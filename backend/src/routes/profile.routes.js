import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Review from '../models/Review.js';
import { requireAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '../../../frontend');

function isHtmlRequest(c) {
    if (c.req.path.startsWith('/api/')) return false;
    const accept = c.req.header('accept') || '';
    return accept.includes('text/html');
}

function serveFrontendTemplate(c, filename) {
    const filePath = path.join(FRONTEND_DIR, filename);
    if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, 'utf8');
        return c.html(html);
    }
    return c.json({ success: true, message: `API profile view for ${filename}` });
}

export const profileRoutes = new Hono();

// GET /admin/profile - Serve dedicated Admin Profile View (redirects to clean root page)
profileRoutes.get('/admin/profile', (c) => {
    if (isHtmlRequest(c)) {
        return c.redirect('/admin-profile.html');
    }
    return c.json({ success: true, type: 'admin', route: '/admin/profile' });
});

// Clean redirects for admin navigation aliases to prevent 404s
profileRoutes.get('/admin', (c) => c.redirect('/admin-dashboard.html'));
profileRoutes.get('/admin/dashboard', (c) => c.redirect('/admin-dashboard.html'));
profileRoutes.get('/admin/admin-dashboard.html', (c) => c.redirect('/admin-dashboard.html'));
profileRoutes.get('/admin-dashboard', (c) => c.redirect('/admin-dashboard.html'));
profileRoutes.get('/admin-profile', (c) => c.redirect('/admin-profile.html'));
profileRoutes.get('/admin/admin-profile.html', (c) => c.redirect('/admin-profile.html'));
profileRoutes.get('/admin/settings', (c) => c.redirect('/admin-settings.html'));
profileRoutes.get('/admin/admin-settings.html', (c) => c.redirect('/admin-settings.html'));
profileRoutes.get('/admin-settings', (c) => c.redirect('/admin-settings.html'));
profileRoutes.get('/admin/patients', (c) => c.redirect('/admin-patients.html'));
profileRoutes.get('/admin/admin-patients.html', (c) => c.redirect('/admin-patients.html'));
profileRoutes.get('/admin/doctors', (c) => c.redirect('/admin-doctors.html'));
profileRoutes.get('/admin/admin-doctors.html', (c) => c.redirect('/admin-doctors.html'));
profileRoutes.get('/admin/verifications', (c) => c.redirect('/admin-verifications.html'));
profileRoutes.get('/admin/admin-verifications.html', (c) => c.redirect('/admin-verifications.html'));
profileRoutes.get('/admin/appointments', (c) => c.redirect('/admin-appointments.html'));
profileRoutes.get('/admin/admin-appointments.html', (c) => c.redirect('/admin-appointments.html'));
profileRoutes.get('/admin/appointment', (c) => c.redirect('/admin-appointments.html'));
profileRoutes.get('/admin-appointment', (c) => c.redirect('/admin-appointments.html'));
profileRoutes.get('/admin-appointment.html', (c) => c.redirect('/admin-appointments.html'));
profileRoutes.get('/admin-appointments', (c) => c.redirect('/admin-appointments.html'));
profileRoutes.get('/admin/emails', (c) => c.redirect('/admin-emails.html'));
profileRoutes.get('/admin/admin-emails.html', (c) => c.redirect('/admin-emails.html'));
profileRoutes.get('/admin/notifications', (c) => c.redirect('/admin-notifications.html'));
profileRoutes.get('/admin/admin-notifications.html', (c) => c.redirect('/admin-notifications.html'));

// Patient profile handlers (Strictly Protected: Only self, doctors, or admin)
const patientHandler = async (c) => {
    try {
        if (isHtmlRequest(c)) {
            return serveFrontendTemplate(c, 'user-profile.html');
        }

        const username = c.req.param('username').toLowerCase().trim();
        const currentUser = c.get('user');

        const isSelf = currentUser && currentUser.role === 'patient' && currentUser.username === username;
        const isDoctor = currentUser && currentUser.role === 'doctor';
        const isAdmin = currentUser && currentUser.role === 'admin';

        if (!isSelf && !isDoctor && !isAdmin) {
            return c.json({
                success: false,
                message: 'Confidential Patient Record: Health records can only be accessed by the patient themselves, attending doctors, and platform administrators.',
            }, 403);
        }

        const user = await User.findOne({ username, role: 'patient' })
            .select('fullName username role avatar phone dateOfBirth gender bloodGroup height weight bloodPressure bloodSugar emergencyContact allergies chronicConditions currentMedications createdAt')
            .lean();

        if (!user) {
            return c.json({
                success: false,
                message: `Patient profile @${username} not found.`,
            }, 404);
        }

        return c.json({
            success: true,
            type: 'patient',
            profile: {
                name: user.fullName,
                username: user.username,
                avatar: user.avatar,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                bloodGroup: user.bloodGroup,
                height: user.height,
                weight: user.weight,
                bloodPressure: user.bloodPressure,
                bloodSugar: user.bloodSugar,
                emergencyContact: user.emergencyContact,
                allergies: user.allergies,
                chronicConditions: user.chronicConditions,
                currentMedications: user.currentMedications,
                memberSince: user.createdAt,
            },
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
};

profileRoutes.get('/u/:username', patientHandler);
profileRoutes.get('/api/u/:username', requireAuth, patientHandler);

// Doctor profile handlers
const doctorHandler = async (c) => {
    try {
        if (isHtmlRequest(c)) {
            return serveFrontendTemplate(c, 'doctor-profile.html');
        }

        const username = c.req.param('username').toLowerCase().trim();
        const doctor = await Doctor.findOne({ username }).lean();

        if (!doctor) {
            return c.json({
                success: false,
                message: `Doctor profile @${username} not found.`,
            }, 404);
        }

        const reviews = await Review.find({ doctorId: doctor._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        return c.json({
            success: true,
            type: 'doctor',
            profile: {
                id: doctor._id,
                name: doctor.name,
                username: doctor.username,
                specialty: doctor.specialty,
                subSpecialties: doctor.subSpecialties || [],
                degrees: doctor.degrees || [],
                designation: doctor.designation,
                currentWorkplace: doctor.currentWorkplace,
                experienceYears: doctor.experienceYears,
                about: doctor.about,
                photoUrl: doctor.photoUrl,
                bmdcNumber: doctor.bmdcNumber,
                isVerified: doctor.isVerified,
                verificationStatus: doctor.verificationStatus,
                rating: doctor.rating,
                totalReviews: doctor.totalReviews,
                chambers: doctor.chambers,
                reviews,
            },
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
};

profileRoutes.get('/d/:username', doctorHandler);
profileRoutes.get('/api/d/:username', doctorHandler);

export default profileRoutes;
