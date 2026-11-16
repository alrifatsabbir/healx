import { Hono } from 'hono';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';

const notifications = new Hono();

notifications.use('*', requireAuth);

// GET /api/notifications/my - Active non-expired, non-dismissed notifications for logged-in user
notifications.get('/my', async (c) => {
    try {
        const user = c.get('user');
        const now = new Date();
        const audienceMatch = ['all'];
        if (user.role === 'patient') audienceMatch.push('patients');
        if (user.role === 'doctor') audienceMatch.push('doctors');
        if (user.role === 'admin') audienceMatch.push('patients', 'doctors');

        const items = await Notification.find({
            isActive: true,
            expiresAt: { $gt: now },
            targetAudience: { $in: audienceMatch },
            dismissedBy: { $ne: user._id },
        })
            .sort({ createdAt: -1 })
            .lean();

        return c.json({
            success: true,
            count: items.length,
            notifications: items.map((n) => ({
                ...n,
                isRead: (n.readBy || []).some((id) => id.toString() === user._id.toString()),
            })),
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// PATCH /api/notifications/:id/read - Mark notification read by user
const handleNotificationRead = async (c) => {
    try {
        const user = c.get('user');
        const id = c.req.param('id');
        await Notification.findByIdAndUpdate(id, { $addToSet: { readBy: user._id } });
        return c.json({ success: true });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
};

notifications.patch('/:id/read', handleNotificationRead);
notifications.post('/:id/read', handleNotificationRead);

// DELETE /api/notifications/:id/dismiss - User dismisses/deletes notification from their panel
notifications.delete('/:id/dismiss', async (c) => {
    try {
        const user = c.get('user');
        const id = c.req.param('id');
        await Notification.findByIdAndUpdate(id, { $addToSet: { dismissedBy: user._id } });
        return c.json({ success: true, message: 'Notification removed.' });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

export default notifications;

