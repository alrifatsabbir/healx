import nodemailer from 'nodemailer';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMAIL_LOGO_PATH = path.resolve(__dirname, '../assets/healiix-email-logo.png');
const LOGO_CID = 'healiix-logo@alrifatsabbir.me';
const APP_BASE_URL = env.FRONTEND_URL;

let transporter = null;
let isEtherealFallback = false;

export async function getTransporter() {
    if (transporter) return transporter;

    if (process.env.MAILER_HOST && process.env.MAILER_USER && process.env.MAILER_PASSWORD) {
        transporter = nodemailer.createTransport({
            host: process.env.MAILER_HOST,
            port: Number(process.env.MAILER_PORT) || 465,
            secure: process.env.MAILER_SECURE === 'true',
            auth: {
                user: process.env.MAILER_USER,
                pass: process.env.MAILER_PASSWORD,
            },
        });
        console.log(`[Mailer] Connected to ${process.env.MAILER_HOST}:${process.env.MAILER_PORT} (${process.env.MAILER_USER})`);
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        console.log(`[Mailer] Mail Service (${process.env.EMAIL_SERVICE || 'gmail'}) connected as ${process.env.EMAIL_USER}`);
    } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        isEtherealFallback = true;
        console.log('[Mailer] Using Ethereal Dev Test Account (no live mailer credentials configured)');
    }

    return transporter;
}

function getFromAddress() {
    const rawFrom = process.env.MAIL_FROM || process.env.MAILER_USER || 'healiix@alrifatsabbir.me';
    return rawFrom.includes('<') ? rawFrom : `"HealiiX" <${rawFrom}>`;
}

function getAdminInbox() {
    return process.env.MAIL_TO || process.env.ADMIN_EMAIL || 'healiix@alrifatsabbir.me';
}

/**
 * Clean, modern Stripe/Zocdoc-inspired clinical email layout.
 * Uses crisp white header with inline CID logo so webmail clients (Roundcube, Gmail, Outlook)
 * render the HealiiX logo immediately without image blocking placeholders.
 */
function buildEmailLayout({ preheader = '', badge = '', heading, bodyHtml, footerNote = '' }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f2f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1b3b36;-webkit-font-smoothing:antialiased;">
  <span style="display:none;font-size:1px;color:#f2f6f4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f6f4;padding:36px 14px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e1ebe7;box-shadow:0 4px 20px rgba(8,44,42,0.05);">
          <!-- Top Brand Accent Line -->
          <tr>
            <td style="height:4px;background-color:#0e927f;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Clean Light Header with Inline Logo -->
          <tr>
            <td style="padding:24px 32px 20px 32px;border-bottom:1px solid #eef4f1;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <img src="cid:${LOGO_CID}" alt="HealiiX" width="118" style="display:block;height:auto;max-height:42px;border:0;outline:none;font-family:sans-serif;font-size:20px;font-weight:800;color:#082c2a;">
                  </td>
                  ${badge ? `<td align="right" valign="middle"><span style="display:inline-block;padding:5px 12px;border-radius:999px;background-color:#e9f6f1;border:1px solid #cde9de;color:#087866;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">${badge}</span></td>` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px 32px 30px 32px;">
              <h1 style="margin:0 0 14px 0;font-size:21px;line-height:1.35;font-weight:800;color:#082c2a;letter-spacing:-0.3px;">${heading}</h1>
              ${bodyHtml}
            </td>
          </tr>

          <!-- Sub-Footer Note Inside Card (if provided) -->
          ${footerNote ? `
          <tr>
            <td style="padding:16px 32px;background-color:#f9fcfb;border-top:1px solid #eef4f1;">
              <p style="margin:0;font-size:12.5px;line-height:1.6;color:#5b7770;">${footerNote}</p>
            </td>
          </tr>` : ''}
        </table>

        <!-- Quiet Outside Footer -->
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:20px 16px 6px 16px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#738d86;">
                Questions? Simply reply to this email or write to <a href="mailto:healiix@alrifatsabbir.me" style="color:#0e927f;text-decoration:none;font-weight:600;">healiix@alrifatsabbir.me</a><br>
                &copy; ${new Date().getFullYear()} HealiiX Healthcare Platform &bull; Bangladesh
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderOtpBlock(otp, validityMinutes = 10) {
    return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="background-color:#f4faf7;border:1px solid #cce6dc;border-radius:12px;padding:24px 16px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0e927f;margin-bottom:8px;">Verification Code</div>
          <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#082c2a;line-height:1.1;padding-left:10px;">${otp}</div>
          <div style="margin-top:10px;font-size:12px;color:#627e77;">Expires in ${validityMinutes} minutes &bull; Keep this code private</div>
        </td>
      </tr>
    </table>`;
}

function renderDetailTable(rows) {
    const trs = rows
        .filter(([, val]) => val !== undefined && val !== null && val !== '')
        .map(([label, val], idx, arr) => {
            const borderBottom = idx < arr.length - 1 ? 'border-bottom:1px solid #e6efec;' : '';
            return `
            <tr>
              <td style="padding:11px 0;font-size:13px;color:#627e77;font-weight:500;width:40%;${borderBottom}">${label}</td>
              <td align="right" style="padding:11px 0;font-size:13.5px;color:#082c2a;font-weight:700;${borderBottom}">${val}</td>
            </tr>`;
        })
        .join('');

    return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;background-color:#f7fbf9;border:1px solid #e1ede8;border-radius:12px;padding:6px 18px;">
      ${trs}
    </table>`;
}

function renderButton(text, href) {
    return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 4px 0;">
      <tr>
        <td align="center" bgcolor="#0e927f" style="border-radius:999px;">
          <a href="${href}" target="_blank" style="display:inline-block;padding:12px 26px;font-size:13.5px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${text} &rarr;</a>
        </td>
      </tr>
    </table>`;
}

async function dispatchMail({ to, subject, html, text, replyTo }) {
    try {
        const mail = await getTransporter();
        const from = getFromAddress();
        const domain = (process.env.MAIL_FROM || 'alrifatsabbir.me').split('@')[1] || 'alrifatsabbir.me';
        const refId = crypto.randomUUID();

        const info = await mail.sendMail({
            from,
            to,
            replyTo: replyTo || process.env.MAIL_FROM || 'healiix@alrifatsabbir.me',
            subject,
            text,
            html,
            messageId: `<${refId}@${domain}>`,
            attachments: [
                {
                    filename: 'healiix-logo.png',
                    path: EMAIL_LOGO_PATH,
                    cid: LOGO_CID,
                    contentDisposition: 'inline',
                },
            ],
            headers: {
                'X-Entity-Ref-ID': refId,
                'X-Auto-Response-Suppress': 'OOF, AutoReply',
            },
        });

        console.log(`[Email] "${subject}" sent to ${to} (${info.messageId})`);
        if (isEtherealFallback) {
            console.log(` 🔗 [Ethereal Preview]: ${nodemailer.getTestMessageUrl(info)}`);
        }
        return true;
    } catch (err) {
        console.warn(`[Email Warning] Failed sending "${subject}" to ${to}:`, err.message);
        return false;
    }
}

// ============================================================================
// 1. ACCOUNT & AUTHENTICATION EMAILS
// ============================================================================

export async function sendPatientVerificationOtpEmail({ to, name, otp }) {
    const html = buildEmailLayout({
        preheader: `Your HealiiX verification code is ${otp}. Valid for 10 minutes.`,
        badge: 'Verify Email',
        heading: 'Confirm your email address',
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">Enter this 6-digit verification code to verify your email address and finish setting up your HealiiX patient account.</p>
          ${renderOtpBlock(otp, 10)}
          <p style="margin:0;font-size:13px;line-height:1.6;color:#6c8680;">If you did not request this signup, you can safely ignore this message.</p>`,
    });

    const text = `Hi ${name},\n\nYour HealiiX patient verification code is: ${otp}\nValid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n- HealiiX Healthcare`;

    return dispatchMail({ to, subject: `${otp} is your HealiiX verification code`, html, text });
}

export async function sendWelcomeEmail({ to, name, username, role = 'patient' }) {
    const profilePath = role === 'doctor' ? `/d/${username}` : `/u/${username}`;
    const isDoctor = role === 'doctor';
    const html = buildEmailLayout({
        preheader: `Welcome to HealiiX, ${name}! Your @${username} account is active.`,
        badge: 'Welcome',
        heading: `Welcome to HealiiX, ${name}`,
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">
            ${isDoctor
                ? 'Your doctor account has been created and your credentials are now under BMDC verification.'
                : 'Your patient account is verified and ready. You can now explore certified specialists across 64 districts and book consultations online.'}
          </p>
          ${renderDetailTable([
              ['Account Name', name],
              ['Username', `@${username}`],
              ['Account Role', isDoctor ? 'Specialist Doctor' : 'Patient'],
              ['Profile Path', profilePath],
          ])}
          ${renderButton('Browse Doctor Directory', `${APP_BASE_URL}/find-doctors.html`)}`,
    });

    const text = `Welcome to HealiiX, ${name}!\n\nUsername: @${username}\nProfile: ${profilePath}\n\nThank you for joining HealiiX Healthcare.`;

    return dispatchMail({ to, subject: `Welcome to HealiiX (@${username})`, html, text });
}

export async function sendPasswordResetOtpEmail({ to, name, otp }) {
    const html = buildEmailLayout({
        preheader: `Password reset code: ${otp}. Expires in 10 minutes.`,
        badge: 'Password Reset',
        heading: 'Reset your HealiiX password',
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">We received a request to reset the password for your HealiiX account. Enter this verification code to choose a new password.</p>
          ${renderOtpBlock(otp, 10)}
          <p style="margin:0;font-size:13px;line-height:1.6;color:#6c8680;">Didn't request a password reset? Ignore this email — your account stays secure.</p>`,
    });

    const text = `Hi ${name},\n\nYour HealiiX password reset OTP is: ${otp}\nExpires in 10 minutes.\n\nIf you did not request this, ignore this email.`;

    return dispatchMail({ to, subject: `${otp} is your HealiiX password reset code`, html, text });
}

export async function sendPasswordChangedEmail({ to, name }) {
    const html = buildEmailLayout({
        preheader: 'Your HealiiX account password was updated.',
        badge: 'Security Alert',
        heading: 'Your password was changed',
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 16px 0;font-size:14.5px;line-height:1.65;color:#4a6660;">This confirms that the password for your HealiiX account (<strong>${to}</strong>) was successfully changed on ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.</p>
          <div style="font-size:13.5px;line-height:1.6;color:#9f3a38;background-color:#fdf3f2;padding:14px 16px;border-radius:10px;border:1px solid #f5d8d6;">If you did not make this change, reply to this email immediately so we can secure your account.</div>`,
    });

    const text = `Hi ${name},\n\nYour HealiiX password for ${to} was recently changed.\nIf this wasn't you, reply to this email immediately.\n- HealiiX Security`;

    return dispatchMail({ to, subject: 'Security notice: Your HealiiX password was updated', html, text });
}

// ============================================================================
// 2. DOCTOR ONBOARDING & VERIFICATION EMAILS
// ============================================================================

export async function sendDoctorOtpEmail({ to, doctorName, otp }) {
    const html = buildEmailLayout({
        preheader: `Your HealiiX doctor registration code is ${otp}.`,
        badge: 'Step 1 OTP',
        heading: 'Verify your email to continue',
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Dear <strong>${doctorName}</strong>,</p>
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">Thank you for applying to the HealiiX Medical Directory. Enter the code below to verify your email and unlock Step 2 (BMDC &amp; chamber setup).</p>
          ${renderOtpBlock(otp, 10)}
          <p style="margin:0;font-size:13px;line-height:1.6;color:#6c8680;">If you did not initiate this registration, you can safely disregard this email.</p>`,
    });

    const text = `Dear ${doctorName},\n\nYour HealiiX Doctor Onboarding Step 1 OTP is: ${otp}\nValid for 10 minutes.\n\n- HealiiX Medical Team`;

    return dispatchMail({ to, subject: `${otp} is your HealiiX Doctor Registration OTP`, html, text });
}

export async function sendDoctorPendingReviewEmail({ to, doctorName, username, bmdcNumber, specialty }) {
    const html = buildEmailLayout({
        preheader: 'Your BMDC credentials have been submitted for review.',
        badge: 'Under Review',
        heading: 'Application submitted successfully',
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Dear <strong>${doctorName}</strong>,</p>
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">We have received your BMDC certificate and specialty details. Our verification team is reviewing your credentials and will notify you once approved.</p>
          ${renderDetailTable([
              ['Doctor Name', doctorName],
              ['Username', `@${username}`],
              ['BMDC Reg. No.', bmdcNumber],
              ['Speciality', specialty],
              ['Current Status', 'Pending Admin Review'],
          ])}`,
        footerNote: 'Verification typically completes within 24 hours.',
    });

    const text = `Dear ${doctorName},\n\nYour HealiiX doctor credentials (BMDC: ${bmdcNumber}, Speciality: ${specialty}) are under admin review.\nWe will email you once approved.`;

    return dispatchMail({ to, subject: 'HealiiX application received — BMDC verification in progress', html, text });
}

export async function sendAdminNewDoctorAlertEmail({ doctorName, username, email, phone, bmdcNumber, specialty, hospitalName }) {
    const adminEmail = getAdminInbox();
    const html = buildEmailLayout({
        preheader: `New Doctor Verification Request: ${doctorName} (${bmdcNumber}).`,
        badge: 'Admin Action',
        heading: 'New doctor awaiting verification',
        bodyHtml: `
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">A new medical professional has completed Step 2 onboarding on HealiiX and is awaiting BMDC credential review.</p>
          ${renderDetailTable([
              ['Doctor Name', doctorName],
              ['Username', `@${username}`],
              ['Email', email],
              ['Phone', phone],
              ['BMDC Reg. No.', bmdcNumber],
              ['Speciality', specialty],
              ['Chamber / Hospital', hospitalName || 'Not specified'],
          ])}`,
        footerNote: 'Cross-check the BMDC registration number before approving this profile.',
    });

    const text = `New Doctor Verification Request on HealiiX\n\nName: ${doctorName} (@${username})\nEmail: ${email}\nPhone: ${phone}\nBMDC: ${bmdcNumber}\nSpeciality: ${specialty}\nHospital: ${hospitalName}`;

    return dispatchMail({ to: adminEmail, subject: `[Admin] New doctor awaiting BMDC verification: ${doctorName}`, html, text, replyTo: email });
}

export async function sendDoctorApprovalStatusEmail({ to, doctorName, username, status, reason = '' }) {
    const isApproved = status === 'approved';
    const html = buildEmailLayout({
        preheader: isApproved ? 'Congratulations! Your HealiiX doctor profile is now verified and live.' : 'Update regarding your HealiiX doctor verification.',
        badge: isApproved ? 'Verified' : 'Status Update',
        heading: isApproved ? 'Your HealiiX profile is approved' : 'Verification update required',
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Dear <strong>${doctorName}</strong>,</p>
          ${isApproved
              ? `<p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">Your BMDC credentials have been verified. Your public profile on HealiiX is now live and open for patient appointments.</p>
                 ${renderDetailTable([['Public Handle', `@${username}`], ['Profile Path', `/d/${username}`], ['Status', 'Verified & Live']])}
                 ${renderButton('Sign In to Doctor Portal', `${APP_BASE_URL}/login.html`)}`
              : `<p style="margin:0 0 14px 0;font-size:14.5px;line-height:1.65;color:#4a6660;">We were unable to verify your submitted documents at this stage.</p>
                 ${reason ? `<div style="margin:0 0 14px 0;font-size:13.5px;color:#9f3a38;background-color:#fdf3f2;padding:14px 16px;border-radius:10px;border:1px solid #f5d8d6;"><strong>Reason:</strong> ${reason}</div>` : ''}
                 <p style="margin:0;font-size:13.5px;line-height:1.6;color:#556e68;">Please reply directly to this email with updated BMDC/degree documentation for re-verification.</p>`}`,
    });

    const text = isApproved
        ? `Dear ${doctorName},\n\nYour HealiiX doctor profile (@${username}) is verified and live!`
        : `Dear ${doctorName},\n\nYour HealiiX verification needs attention.${reason ? ` Reason: ${reason}` : ''}`;

    return dispatchMail({
        to,
        subject: isApproved ? 'Approved: Your HealiiX Doctor Profile is Live' : 'Action Needed: HealiiX Doctor Verification Update',
        html,
        text,
    });
}

// ============================================================================
// 3. APPOINTMENT & CONSULTATION EMAILS
// ============================================================================

export async function sendAppointmentEmail({ to, patientName, doctorName, bookingRef, date, slot, hospitalName, fee }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const html = buildEmailLayout({
        preheader: `Appointment Ref ${bookingRef} with ${doctorName} on ${formattedDate}.`,
        badge: 'Appointment',
        heading: 'Appointment request confirmed',
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Dear <strong>${patientName}</strong>,</p>
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">Your medical consultation has been scheduled through HealiiX. Present this booking reference at the chamber desk:</p>
          ${renderDetailTable([
              ['Booking Ref', bookingRef],
              ['Doctor', doctorName],
              ['Hospital / Chamber', hospitalName || 'Main Chamber'],
              ['Date', formattedDate],
              ['Time Slot', slot || 'Confirmed by chamber'],
              ['Consultation Fee', fee ? `BDT ${fee}` : 'Standard chamber fee'],
          ])}`,
        footerNote: 'Please arrive 15 minutes early with any relevant prescriptions or medical reports.',
    });

    const text = `Dear ${patientName},\n\nAppointment scheduled on HealiiX.\nRef: ${bookingRef}\nDoctor: ${doctorName}\nChamber: ${hospitalName}\nDate: ${formattedDate}\nTime: ${slot}`;

    return dispatchMail({ to, subject: `Appointment Confirmation [${bookingRef}] - ${doctorName}`, html, text });
}

export async function sendDoctorNewBookingEmail({ to, doctorName, patientName, patientPhone, bookingRef, date, slot, symptoms }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const html = buildEmailLayout({
        preheader: `New patient booking ${bookingRef} from ${patientName}.`,
        badge: 'New Booking',
        heading: 'New patient appointment',
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Dear <strong>${doctorName}</strong>,</p>
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">A new patient consultation has been booked for your chamber:</p>
          ${renderDetailTable([
              ['Booking Ref', bookingRef],
              ['Patient Name', patientName],
              ['Patient Phone', patientPhone],
              ['Date', formattedDate],
              ['Time Slot', slot],
              ['Symptoms / Note', symptoms || 'Not specified'],
          ])}`,
    });

    const text = `Dear ${doctorName},\n\nNew patient booking [${bookingRef}]:\nPatient: ${patientName} (${patientPhone})\nDate: ${formattedDate} at ${slot}\nNotes: ${symptoms || 'None'}`;

    return dispatchMail({ to, subject: `New Patient Booking [${bookingRef}] - ${patientName}`, html, text });
}

export async function sendAppointmentStatusEmail({ to, patientName, doctorName, bookingRef, status, date, slot, reason = '' }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const labelMap = {
        confirmed: 'Confirmed',
        completed: 'Completed',
        cancelled: 'Cancelled',
    };
    const label = labelMap[status] || status;

    const html = buildEmailLayout({
        preheader: `Appointment ${bookingRef} with ${doctorName} is now ${label}.`,
        badge: label,
        heading: `Appointment ${label}`,
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Dear <strong>${patientName}</strong>,</p>
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">The status of your consultation with <strong>${doctorName}</strong> has been updated to <strong>${label}</strong>.</p>
          ${renderDetailTable([
              ['Booking Ref', bookingRef],
              ['Doctor', doctorName],
              ['Scheduled Date', `${formattedDate} (${slot})`],
              ['Updated Status', label],
              ...(reason ? [['Note / Reason', reason]] : []),
          ])}`,
    });

    const text = `Dear ${patientName},\n\nYour HealiiX appointment [${bookingRef}] with ${doctorName} on ${formattedDate} is now ${label}.${reason ? `\nReason: ${reason}` : ''}`;

    return dispatchMail({ to, subject: `Appointment ${label} [${bookingRef}] - HealiiX`, html, text });
}

// ============================================================================
// 4. CONTACT & SUPPORT EMAILS
// ============================================================================

export async function sendContactInquiryEmail({ name, email, subject = 'General Inquiry', message }) {
    const adminEmail = getAdminInbox();

    const adminHtml = buildEmailLayout({
        preheader: `Contact message from ${name}: ${subject}`,
        badge: 'Contact Desk',
        heading: 'New contact form message',
        bodyHtml: `
          ${renderDetailTable([
              ['Sender Name', name],
              ['Sender Email', email],
              ['Topic', subject],
          ])}
          <div style="background-color:#f7fbf9;border:1px solid #e1ede8;border-radius:12px;padding:16px;font-size:14px;line-height:1.65;color:#123b39;white-space:pre-line;">${message}</div>`,
    });

    await dispatchMail({
        to: adminEmail,
        subject: `[HealiiX Contact] ${subject} — from ${name}`,
        html: adminHtml,
        text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
        replyTo: email,
    });

    const userHtml = buildEmailLayout({
        preheader: `Thanks for contacting HealiiX, ${name}. We've received your inquiry.`,
        badge: 'Received',
        heading: 'We received your message',
        bodyHtml: `
          <p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.65;color:#274843;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0;font-size:14.5px;line-height:1.65;color:#4a6660;">Thank you for reaching out to HealiiX regarding <strong>"${subject}"</strong>. Our care desk has received your inquiry and will reply within 24 hours.</p>`,
    });

    return dispatchMail({
        to: email,
        subject: `We received your inquiry: ${subject} - HealiiX`,
        html: userHtml,
        text: `Hi ${name},\n\nThank you for contacting HealiiX regarding "${subject}". Our team will respond shortly.\n- HealiiX Care Desk`,
    });
}
