import { Hono } from 'hono';
import ContactMessage from '../models/ContactMessage.js';
import { sendContactInquiryEmail } from '../config/mailer.js';

const contact = new Hono();

// POST /api/contact - Submit contact form inquiry (saves to DB + forwards to Admin + sends Auto-Reply)
contact.post('/', async (c) => {
    try {
        const body = await c.req.json();
        let { name, email, phone = '', subject = 'General Inquiry', message } = body;

        if (!name || !email || !message) {
            return c.json({
                success: false,
                message: 'Name, email, and message are required.',
            }, 400);
        }

        // If phone wasn't passed separately, check if it was prefixed in message
        if (!phone && message.includes('Phone:')) {
            const match = message.match(/^Phone:\s*([^\n\r]+)/i);
            if (match && match[1]) {
                phone = match[1].trim();
                message = message.replace(/^Phone:\s*[^\n\r]+[\n\r]*/i, '').trim();
            }
        }

        // 1. Save contact message to MongoDB database so Admin can view & reply from Admin Panel
        const contactDoc = await ContactMessage.create({
            name: name.trim(),
            email: email.trim(),
            phone: phone ? phone.trim() : '',
            subject: subject.trim(),
            message: message.trim(),
            status: 'unread',
        });

        // 2. Dispatch email notifications (Non-blocking so failure to send email won't break client submission)
        sendContactInquiryEmail({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: phone ? `Phone: ${phone.trim()}\n\n${message.trim()}` : message.trim(),
        }).catch((mailErr) => {
            console.error('[Contact Mail Warning] Could not dispatch contact email:', mailErr.message);
        });

        return c.json({
            success: true,
            message: 'Thank you for reaching out! We have received your message and sent a confirmation to your email.',
            contactId: contactDoc._id,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

export default contact;
