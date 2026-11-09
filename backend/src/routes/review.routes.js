import { Hono } from 'hono';
import Review from '../models/Review.js';
import Doctor from '../models/Doctor.js';

const review = new Hono();

// POST /api/reviews - Add review for doctor
review.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const { doctorId, patientName, rating, comment, appointmentRef } = body;

        if (!doctorId || !patientName || !rating || !comment) {
            return c.json({
                success: false,
                message: 'Doctor ID, patient name, rating (1-5), and comment are required.',
            }, 400);
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return c.json({ success: false, message: 'Doctor not found.' }, 404);
        }

        const newReview = await Review.create({
            doctorId,
            patientName,
            rating: Math.min(5, Math.max(1, Number(rating))),
            comment,
            appointmentRef: appointmentRef || '',
            isVerifiedVisit: Boolean(appointmentRef),
        });

        // Recalculate doctor rating
        const allReviews = await Review.find({ doctorId });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        doctor.rating = Number(avgRating.toFixed(1));
        doctor.totalReviews = allReviews.length;
        await doctor.save();

        return c.json({
            success: true,
            message: 'Review posted successfully.',
            review: newReview,
            doctorRating: doctor.rating,
        }, 201);
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// GET /api/reviews/doctor/:doctorId - Get all reviews for a doctor
review.get('/doctor/:doctorId', async (c) => {
    try {
        const doctorId = c.req.param('doctorId');
        const reviews = await Review.find({ doctorId })
            .sort({ createdAt: -1 })
            .lean();

        return c.json({
            success: true,
            count: reviews.length,
            reviews,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

export default review;

