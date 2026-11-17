/**
 * Vercel Serverless SMTP Bridge  —  /api/send-mail
 *
 * WHY THIS EXISTS:
 *   Render hobby plan blocks all outbound SMTP connections (ports 465, 587).
 *   Vercel serverless functions have no such restriction.
 *   So Render handles all business logic, but instead of calling nodemailer
 *   directly it POSTs the mail payload here, and THIS function opens the
 *   actual SMTP connection and sends the email.
 *
 * SECURITY:
 *   Every request must include the header  X-Mail-Bridge-Secret
 *   matching the MAIL_BRIDGE_SECRET environment variable set on both sides.
 *   Without it the request is rejected with 401.
 *
 * FLOW:
 *   Render (mailer.js)
 *     └─► POST https://<vercel-frontend>/api/send-mail  { payload + secret header }
 *               └─► nodemailer  →  SMTP :465
 */

import nodemailer from 'nodemailer';

// ─── Config from Vercel environment variables ────────────────────────────────
const BRIDGE_SECRET   = process.env.MAIL_BRIDGE_SECRET;
const MAILER_HOST     = process.env.MAILER_HOST;
const MAILER_PORT     = Number(process.env.MAILER_PORT) || 465;
const MAILER_SECURE   = process.env.MAILER_SECURE !== 'false'; // default true
const MAILER_USER     = process.env.MAILER_USER;
const MAILER_PASSWORD = process.env.MAILER_PASSWORD;
const MAIL_FROM       = process.env.MAIL_FROM || MAILER_USER;

// Build once, reuse (Vercel keeps the function warm between invocations)
let _transporter = null;
function getTransporter() {
    if (_transporter) return _transporter;
    _transporter = nodemailer.createTransport({
        host:   MAILER_HOST,
        port:   MAILER_PORT,
        secure: MAILER_SECURE,
        auth:   { user: MAILER_USER, pass: MAILER_PASSWORD },
        tls:    { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout:   6000,
        socketTimeout:     15000,
    });
    return _transporter;
}

export default async function handler(req, res) {
    // ── Only POST ────────────────────────────────────────────────────────────
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // ── Shared-secret auth ───────────────────────────────────────────────────
    if (!BRIDGE_SECRET || req.headers['x-mail-bridge-secret'] !== BRIDGE_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // ── SMTP config must be present ──────────────────────────────────────────
    if (!MAILER_HOST || !MAILER_USER || !MAILER_PASSWORD) {
        console.error('[send-mail] SMTP env vars not configured on Vercel');
        return res.status(500).json({ success: false, message: 'Mail service not configured' });
    }

    const { to, subject, html, text, replyTo, messageId, attachments } = req.body || {};

    if (!to || !subject || (!html && !text)) {
        return res.status(400).json({ success: false, message: 'to, subject and html/text are required' });
    }

    try {
        const transporter = getTransporter();
        const from = MAIL_FROM.includes('<') ? MAIL_FROM : `"HealiiX" <${MAIL_FROM}>`;

        const info = await transporter.sendMail({
            from,
            to,
            replyTo: replyTo || MAIL_FROM,
            subject,
            html,
            text,
            ...(messageId ? { messageId } : {}),
            // Attachments are base64-encoded by Render before sending
            attachments: Array.isArray(attachments) ? attachments : [],
            headers: {
                'X-Auto-Response-Suppress': 'OOF, AutoReply',
            },
        });

        console.log(`[send-mail] Sent "${subject}" to ${to} (${info.messageId})`);
        return res.status(200).json({ success: true, messageId: info.messageId });
    } catch (err) {
        console.error(`[send-mail] SMTP error for "${subject}" to ${to}:`, err.message);
        // Reset transporter on connection failure so next request gets a fresh one
        _transporter = null;
        return res.status(502).json({ success: false, message: err.message });
    }
}
