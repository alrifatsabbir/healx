import { Hono } from 'hono';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Review from '../models/Review.js';

export const profileRoutes = new Hono();

// GET /u/:username - Patient Public / Summary Profile
profileRoutes.get('/u/:username', async (c) => {
    try {
        const username = c.req.param('username').toLowerCase().trim();
        const user = await User.findOne({ username, role: 'patient' })
            .select('fullName username role avatar createdAt')
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
                memberSince: user.createdAt,
            },
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// GET /d/:username - Doctor Full Public Profile
profileRoutes.get('/d/:username', async (c) => {
    try {
        const username = c.req.param('username').toLowerCase().trim();
        const doctor = await Doctor.findOne({ username }).lean();

        if (!doctor) {
            return c.json({
                success: false,
                message: `Doctor profile @${username} not found.`,
            }, 404);
        }

        // Fetch recent verified reviews for this doctor
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
});

export default profileRoutes;

