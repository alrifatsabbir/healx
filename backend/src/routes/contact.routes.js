import { Hono } from 'hono';
import { sendContactInquiryEmail } from '../config/mailer.js';

const contact = new Hono();

// POST /api/contact - Submit contact form inquiry (forwards to Admin + sends Auto-Reply)
contact.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const { name, email, subject = 'General Inquiry', message } = body;

        if (!name || !email || !message) {
            return c.json({
                success: false,
                message: 'Name, email, and message are required.',
            }, 400);
        }

        await sendContactInquiryEmail({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
        });

        return c.json({
            success: true,
            message: 'Thank you for reaching out! We have received your message and sent a confirmation to your email.',
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

export default contact;

