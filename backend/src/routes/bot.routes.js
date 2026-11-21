import { Hono } from 'hono';
import { processBotMessage } from '../services/aiBotService.js';

const botRoutes = new Hono();

// POST /api/bot/chat
botRoutes.post('/chat', async (c) => {
    try {
        const body = await c.req.json().catch(() => ({}));
        const { message, history } = body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return c.json({
                success: false,
                message: 'A valid message string is required.',
            }, 400);
        }

        const result = await processBotMessage({
            message: message.trim(),
            history: Array.isArray(history) ? history : [],
        });

        return c.json({
            success: true,
            data: result,
        });
    } catch (err) {
        console.error('[Bot Route Error]', err);
        return c.json({
            success: false,
            message: 'Error processing your request with HealiiX AI Bot.',
            error: err.message,
        }, 500);
    }
});

// GET /api/bot/health
botRoutes.get('/health', (c) => {
    const hasKey = !!(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY || process.env.GOOGLE_API_KEY);
    return c.json({
        service: 'HealiiX AI HealthBot',
        status: 'online',
        geminiConfigured: hasKey,
        supportedLanguages: ['en', 'bn'],
    });
});

// GET /api/bot/suggestions
botRoutes.get('/suggestions', (c) => {
    return c.json({
        success: true,
        suggestions: [
            { id: 'headache', text: 'মাথাব্যথা ও মাথা ঘোরার জন্য কোন ডাক্তার দেখাবো?', label: '🤕 মাথাব্যথা / Headache' },
            { id: 'chest_pain', text: 'বুকে হালকা চাপ ও অস্বস্তি হচ্ছে, কি করা উচিত?', label: '🫀 বুকে চাপ / Chest discomfort' },
            { id: 'baby_fever', text: 'আমার বাচ্চার ২ দিন ধরে জ্বর, করণীয় কি?', label: '👶 বাচ্চার জ্বর / Child Fever' },
            { id: 'back_pain', text: 'কোমরে তীব্র ব্যথা ও বসতে কষ্ট হচ্ছে', label: '🦴 কোমর ব্যথা / Back Pain' },
            { id: 'stomach_gas', text: 'পেটে গ্যাস ও বদহজমের সমস্যা দূর করার উপায় কি?', label: '🍽️ পেটের সমস্যা / Stomach' },
            { id: 'book_doctor', text: 'HealiiX-এ কিভাবে বিশেষজ্ঞ ডাক্তার বুক করব?', label: '📅 ডাক্তার বুকিং / Book Doctor' },
        ],
    });
});

export default botRoutes;
