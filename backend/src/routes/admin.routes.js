import { Hono } from 'hono';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Review from '../models/Review.js';
import EmailLog from '../models/EmailLog.js';
import ContactMessage from '../models/ContactMessage.js';
import Notification from '../models/Notification.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendDoctorApprovalStatusEmail, sendAdminCustomEmail } from '../config/mailer.js';

const admin = new Hono();

// Strictly Admin-only routes
admin.use('*', requireAuth, requireRole('admin'));

// ============================================================================
// 1. OVERVIEW STATS & CHARTS ANALYTICS
// ============================================================================
admin.get('/stats', async (c) => {
    try {
        const now = new Date();
        const [
            totalUsers,
            totalPatients,
            totalDoctors,
            verifiedDoctors,
            pendingDoctors,
            rejectedDoctors,
            totalAppointments,
            pendingAppointments,
            totalReviews,
            emailsLast30d,
            activeNotifications,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'patient' }),
            Doctor.countDocuments(),
            Doctor.countDocuments({ verificationStatus: 'approved', isVerified: true }),
            Doctor.countDocuments({ verificationStatus: 'pending' }),
            Doctor.countDocuments({ verificationStatus: 'rejected' }),
            Appointment.countDocuments(),
            Appointment.countDocuments({ status: 'pending' }),
            Review.countDocuments(),
            EmailLog.countDocuments(),
            Notification.countDocuments({ isActive: true, expiresAt: { $gt: now } }),
        ]);

        return c.json({
            success: true,
            stats: {
                totalUsers,
                totalPatients,
                totalDoctors,
                verifiedDoctors,
                pendingDoctors,
                rejectedDoctors,
                totalAppointments,
                pendingAppointments,
                totalReviews,
                emailsLast30d,
                activeNotifications,
            },
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.get('/analytics', async (c) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [apptByStatus, docsBySpecialty, apptsTimeline, emailBreakdown, verificationBreakdown, roleBreakdown] = await Promise.all([
            Appointment.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Doctor.aggregate([
                { $match: { isVerified: true } },
                { $group: { _id: '$specialty', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),
            Appointment.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            EmailLog.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Doctor.aggregate([
                { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
            ]),
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]),
        ]);

        return c.json({
            success: true,
            analytics: {
                apptByStatus,
                docsBySpecialty,
                apptsTimeline,
                emailBreakdown,
                verificationBreakdown,
                roleBreakdown,
            },
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ============================================================================
// 2. PATIENT DIRECTORY (FULL CRUD + CASCADE DELETE)
// ============================================================================
admin.get('/patients', async (c) => {
    try {
        const { q } = c.req.query();
        const filter = { role: 'patient' };
        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            filter.$or = [
                { fullName: regex },
                { username: regex },
                { email: regex },
                { phone: regex },
            ];
        }

        const patients = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        // Attach live appointment count per patient
        const counts = await Appointment.aggregate([
            { $match: { patientId: { $ne: null } } },
            { $group: { _id: '$patientId', count: { $sum: 1 } } },
        ]);
        const countMap = Object.fromEntries(counts.map((x) => [x._id.toString(), x.count]));

        return c.json({
            success: true,
            count: patients.length,
            patients: patients.map((p) => ({
                ...p,
                appointmentCount: countMap[p._id.toString()] || 0,
            })),
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.post('/patients', async (c) => {
    try {
        const { fullName, username, email, phone, dateOfBirth, password } = await c.req.json();
        if (!fullName || !username || !email || !phone || !dateOfBirth || !password) {
            return c.json({ success: false, message: 'All patient fields are required.' }, 400);
        }

        const existing = await User.findOne({
            $or: [{ username: username.toLowerCase().trim() }, { email: email.toLowerCase().trim() }],
        });
        if (existing) {
            return c.json({ success: false, message: 'Username or email already exists.' }, 409);
        }

        const patient = await User.create({
            fullName: fullName.trim(),
            username: username.toLowerCase().trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            dateOfBirth: new Date(dateOfBirth),
            password,
            role: 'patient',
            isEmailVerified: true,
            isActive: true,
        });

        const safe = patient.toObject();
        delete safe.password;

        return c.json({ success: true, message: 'Patient created successfully.', patient: safe }, 201);
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.put('/patients/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const { fullName, username, email, phone, dateOfBirth, isActive } = await c.req.json();

        const patient = await User.findOne({ _id: id, role: 'patient' }).select('-password');
        if (!patient) {
            return c.json({ success: false, message: 'Patient account not found.' }, 404);
        }

        if (fullName) patient.fullName = fullName.trim();
        if (username) patient.username = username.toLowerCase().trim();
        if (email) patient.email = email.toLowerCase().trim();
        if (phone !== undefined) patient.phone = phone.trim();
        if (dateOfBirth) patient.dateOfBirth = new Date(dateOfBirth);
        if (isActive !== undefined) patient.isActive = Boolean(isActive);

        await patient.save();
        return c.json({ success: true, message: 'Patient record updated.', patient });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.delete('/patients/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const patient = await User.findOne({ _id: id, role: 'patient' });
        if (!patient) {
            return c.json({ success: false, message: 'Patient not found.' }, 404);
        }

        // Cascade delete patient's appointments and reviews
        await Promise.all([
            Appointment.deleteMany({ $or: [{ patientId: patient._id }, { patientEmail: patient.email }] }),
            Review.deleteMany({ patientId: patient._id }),
            User.findByIdAndDelete(patient._id),
        ]);

        return c.json({
            success: true,
            message: `Patient @${patient.username} and all associated records deleted.`,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ============================================================================
// 3. DOCTOR DIRECTORY (VERIFIED ONLY) & VERIFICATION AUDIT (ADMIN-ONLY CERTS)
// ============================================================================
admin.get('/doctors', async (c) => {
    try {
        const { status, q } = c.req.query();
        const filter = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            filter.verificationStatus = status;
        }
        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            filter.$or = [{ name: regex }, { username: regex }, { bmdcNumber: regex }, { specialty: regex }];
        }

        const doctors = await Doctor.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        return c.json({
            success: true,
            count: doctors.length,
            doctors,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.put('/doctors/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();

        const doc = await Doctor.findById(id);
        if (!doc) {
            return c.json({ success: false, message: 'Doctor not found.' }, 404);
        }

        const allowed = ['name', 'specialty', 'designation', 'currentWorkplace', 'experienceYears', 'bmdcNumber', 'about', 'degrees', 'chambers'];
        for (const field of allowed) {
            if (body[field] !== undefined) doc[field] = body[field];
        }

        await doc.save();
        if (body.name) {
            await User.findByIdAndUpdate(doc.userId, { fullName: doc.name });
        }

        return c.json({ success: true, message: 'Doctor record updated.', doctor: doc });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.delete('/doctors/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const doc = await Doctor.findById(id);
        if (!doc) {
            return c.json({ success: false, message: 'Doctor not found.' }, 404);
        }

        await Promise.all([
            Appointment.deleteMany({ doctorId: doc._id }),
            Review.deleteMany({ doctorId: doc._id }),
            User.findByIdAndDelete(doc.userId),
            Doctor.findByIdAndDelete(doc._id),
        ]);

        return c.json({
            success: true,
            message: `Doctor @${doc.username} and associated data deleted.`,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

const handleVerifyDoctor = async (c) => {
    try {
        const id = c.req.param('id');
        const { status, reason = '' } = await c.req.json();

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return c.json({ success: false, message: 'Invalid verification status.' }, 400);
        }

        const doc = await Doctor.findById(id);
        if (!doc) {
            return c.json({ success: false, message: 'Doctor profile not found.' }, 404);
        }

        doc.verificationStatus = status;
        doc.isVerified = status === 'approved';
        doc.verificationNotes = reason || '';
        await doc.save();

        // Also ensure Doctor's user account is active & verified
        if (doc.userId) {
            await User.findByIdAndUpdate(doc.userId, {
                isActive: true,
                isEmailVerified: true,
            });
        }

        if (status !== 'pending') {
            sendDoctorApprovalStatusEmail({
                to: doc.email,
                doctorName: doc.name,
                username: doc.username,
                status,
                reason,
            }).catch(console.error);

            // Create notification for the doctor
            await Notification.create({
                title: status === 'approved' ? 'Doctor Profile Verified & Live' : 'Verification Update Needed',
                message: status === 'approved'
                    ? `Congratulations Dr. ${doc.name}! Your BMDC credentials have been verified. Your profile is now live in the specialist directory.`
                    : `Your profile verification needs attention. Reason: ${reason || 'Credentials could not be verified.'}`,
                type: status === 'approved' ? 'announcement' : 'important',
                targetAudience: 'doctors',
                durationDays: 14,
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                createdBy: c.get('user')?._id || doc.userId,
            }).catch(() => {});
        }

        return c.json({
            success: true,
            message: `Doctor @${doc.username} marked as ${status}.`,
            doctor: doc,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
};

admin.patch('/doctors/:id/verify', handleVerifyDoctor);
admin.post('/doctors/:id/verify', handleVerifyDoctor);

// ============================================================================
// 4. LEGACY USERS & APPOINTMENTS LISTS
// ============================================================================
admin.get('/users', async (c) => {
    try {
        const { role } = c.req.query();
        const filter = {};
        if (role && ['patient', 'doctor', 'admin'].includes(role)) {
            filter.role = role;
        }
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();
        return c.json({ success: true, count: users.length, users });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

const handleUserStatus = async (c) => {
    try {
        const id = c.req.param('id');
        const currentAdmin = c.get('user');
        const { isActive } = await c.req.json();

        if (id === currentAdmin._id.toString()) {
            return c.json({ success: false, message: 'Cannot suspend your own admin account.' }, 400);
        }

        const user = await User.findById(id).select('-password');
        if (!user) return c.json({ success: false, message: 'User not found.' }, 404);

        user.isActive = Boolean(isActive);
        await user.save();
        return c.json({ success: true, message: `Account @${user.username} updated.`, user });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
};

admin.patch('/users/:id/status', handleUserStatus);
admin.post('/users/:id/status', handleUserStatus);

admin.get('/appointments', async (c) => {
    try {
        const { date, status, doctorId } = c.req.query();
        const filter = {};
        if (status) filter.status = status;
        if (doctorId) filter.doctorId = doctorId;
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.appointmentDate = { $gte: start, $lte: end };
        }

        const appointments = await Appointment.find(filter)
            .sort({ appointmentDate: 1, createdAt: -1 })
            .limit(250)
            .lean();

        return c.json({ success: true, count: appointments.length, appointments });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ============================================================================
// 5. EMAILS & INBOUND CONTACT INQUIRIES CENTER
// ============================================================================

// 5.1 Inbound Contact Inquiries (from Contact Us page)
admin.get('/contacts', async (c) => {
    try {
        const { status, q, page = 1, limit = 20 } = c.req.query();
        const filter = {};

        if (status && status !== 'all' && ['unread', 'read', 'replied', 'archived'].includes(status)) {
            filter.status = status;
        }

        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            filter.$or = [
                { name: regex },
                { email: regex },
                { phone: regex },
                { subject: regex },
                { message: regex },
            ];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [totalCount, unreadCount, messages] = await Promise.all([
            ContactMessage.countDocuments(filter),
            ContactMessage.countDocuments({ status: 'unread' }),
            ContactMessage.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
        ]);

        return c.json({
            success: true,
            count: totalCount,
            unreadCount,
            page: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            messages,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.get('/contacts/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const msg = await ContactMessage.findById(id);
        if (!msg) return c.json({ success: false, message: 'Contact message not found.' }, 404);

        if (msg.status === 'unread') {
            msg.status = 'read';
            await msg.save();
        }

        return c.json({ success: true, message: msg });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

const handleContactStatus = async (c) => {
    try {
        const id = c.req.param('id');
        const { status } = await c.req.json();
        if (!['unread', 'read', 'replied', 'archived'].includes(status)) {
            return c.json({ success: false, message: 'Invalid status value.' }, 400);
        }

        const msg = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
        if (!msg) return c.json({ success: false, message: 'Contact message not found.' }, 404);

        return c.json({ success: true, message: `Status updated to ${status}.`, contact: msg });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
};

admin.patch('/contacts/:id/status', handleContactStatus);
admin.post('/contacts/:id/status', handleContactStatus);

admin.post('/contacts/:id/reply', async (c) => {
    try {
        const id = c.req.param('id');
        const currentAdmin = c.get('user');
        const { replyMessage, replySubject, badge = 'Care Desk' } = await c.req.json();

        if (!replyMessage || !replyMessage.trim()) {
            return c.json({ success: false, message: 'Reply message cannot be empty.' }, 400);
        }

        const contact = await ContactMessage.findById(id);
        if (!contact) return c.json({ success: false, message: 'Contact message not found.' }, 404);

        const finalSubject = (replySubject || `Re: ${contact.subject}`).trim();

        await sendAdminCustomEmail({
            to: contact.email,
            subject: finalSubject,
            heading: finalSubject,
            message: replyMessage.trim(),
            badge,
            sentBy: currentAdmin.email,
        });

        contact.status = 'replied';
        contact.replySubject = finalSubject;
        contact.replyMessage = replyMessage.trim();
        contact.repliedAt = new Date();
        contact.repliedBy = currentAdmin.email || currentAdmin.fullName || 'Admin';
        await contact.save();

        return c.json({
            success: true,
            message: `Reply dispatched successfully to ${contact.email}.`,
            contact,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.delete('/contacts/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const msg = await ContactMessage.findByIdAndDelete(id);
        if (!msg) return c.json({ success: false, message: 'Contact message not found.' }, 404);
        return c.json({ success: true, message: 'Contact message deleted successfully.' });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// 5.2 Direct Email Sender
admin.post('/emails/send', async (c) => {
    try {
        const currentAdmin = c.get('user');
        const { to, subject, heading, message, badge = 'Official Notice' } = await c.req.json();

        if (!to || !subject || !message) {
            return c.json({ success: false, message: 'Recipient email, subject, and message are required.' }, 400);
        }

        const sent = await sendAdminCustomEmail({
            to: to.trim(),
            subject: subject.trim(),
            heading: (heading || subject).trim(),
            message: message.trim(),
            badge,
            sentBy: currentAdmin.email,
        });

        return c.json({
            success: sent,
            message: sent ? `Email dispatched successfully to ${to}.` : 'Email dispatch failed — check logs.',
        }, sent ? 200 : 500);
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.get('/emails/logs', async (c) => {
    try {
        const { status, q } = c.req.query();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const filter = { createdAt: { $gte: sevenDaysAgo } };

        if (status && ['sent', 'failed'].includes(status)) filter.status = status;
        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            filter.$or = [{ to: regex }, { subject: regex }, { templateType: regex }];
        }

        const logs = await EmailLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();

        return c.json({ success: true, count: logs.length, logs });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.delete('/emails/logs/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const log = await EmailLog.findByIdAndDelete(id);
        if (!log) return c.json({ success: false, message: 'Email log not found.' }, 404);
        return c.json({ success: true, message: 'Email log deleted.' });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// ============================================================================
// 6. NOTIFICATIONS BROADCAST & TIME-LIMIT STATUS TRACKER
// ============================================================================
admin.post('/notifications', async (c) => {
    try {
        const currentAdmin = c.get('user');
        const { title, message, type = 'announcement', targetAudience = 'all', durationDays = 7 } = await c.req.json();

        if (!title || !message) {
            return c.json({ success: false, message: 'Title and message are required.' }, 400);
        }

        const days = Math.min(90, Math.max(1, Number(durationDays) || 7));
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        const notification = await Notification.create({
            title: title.trim(),
            message: message.trim(),
            type,
            targetAudience,
            durationDays: days,
            expiresAt,
            createdBy: currentAdmin._id,
        });

        return c.json({
            success: true,
            message: `Notification broadcast live for ${days} day(s).`,
            notification,
        }, 201);
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

admin.get('/notifications', async (c) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .lean();

        const now = new Date();
        return c.json({
            success: true,
            count: notifications.length,
            notifications: notifications.map((n) => ({
                ...n,
                isExpired: new Date(n.expiresAt) <= now,
                dismissedCount: (n.dismissedBy || []).length,
                readCount: (n.readBy || []).length,
            })),
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

const handleNotificationToggle = async (c) => {
    try {
        const id = c.req.param('id');
        const item = await Notification.findById(id);
        if (!item) return c.json({ success: false, message: 'Notification not found.' }, 404);
        item.isActive = !item.isActive;
        await item.save();
        return c.json({ success: true, message: `Notification ${item.isActive ? 'activated' : 'paused'}.`, notification: item });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
};

admin.patch('/notifications/:id/toggle', handleNotificationToggle);
admin.post('/notifications/:id/toggle', handleNotificationToggle);

admin.delete('/notifications/:id', async (c) => {
    try {
        const id = c.req.param('id');
        await Notification.findByIdAndDelete(id);
        return c.json({ success: true, message: 'Notification deleted permanently.' });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

export default admin;
