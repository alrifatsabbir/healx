import { Hono } from 'hono';
import Review from '../models/Review.js';
import Doctor from '../models/Doctor.js';
import { requireAuth } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const review = new Hono();

// Helper to optionally extract auth user without failing
async function getOptionalUser(c) {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await User.findById(decoded.id).select('-password');
    } catch {
        return null;
    }
}

// POST /api/reviews - Add review for doctor
review.post('/', async (c) => {
    try {
        const currentUser = await getOptionalUser(c);
        const body = await c.req.json();
        const { doctorId, patientName, rating, comment, appointmentRef } = body;

        const resolvedName = currentUser?.fullName || patientName;

        if (!doctorId || !resolvedName || !rating || !comment) {
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
            patientId: currentUser ? currentUser._id : null,
            patientName: resolvedName,
            rating: Math.min(5, Math.max(1, Number(rating))),
            comment: comment.trim(),
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

// GET /api/reviews/my - Get all reviews posted by current logged in patient
review.get('/my', requireAuth, async (c) => {
    try {
        const user = c.get('user');
        const query = {
            $or: [
                { patientId: user._id },
                { patientName: user.fullName },
            ],
        };

        const reviews = await Review.find(query)
            .populate({
                path: 'doctorId',
                select: 'fullName specialization designation photoUrl chambers rating totalReviews',
            })
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

// PUT /api/reviews/:id - Update patient review
review.put('/:id', requireAuth, async (c) => {
    try {
        const user = c.get('user');
        const reviewId = c.req.param('id');
        const body = await c.req.json();
        const { rating, comment } = body;

        const rev = await Review.findById(reviewId);
        if (!rev) {
            return c.json({ success: false, message: 'Review not found.' }, 404);
        }

        // Check ownership
        const isOwner = (rev.patientId && rev.patientId.toString() === user._id.toString()) ||
                        (rev.patientName === user.fullName);
        if (!isOwner && user.role !== 'admin') {
            return c.json({ success: false, message: 'You are not authorized to edit this review.' }, 403);
        }

        if (rating) rev.rating = Math.min(5, Math.max(1, Number(rating)));
        if (comment) rev.comment = comment.trim();
        await rev.save();

        // Recalculate doctor rating
        const allReviews = await Review.find({ doctorId: rev.doctorId });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await Doctor.findByIdAndUpdate(rev.doctorId, {
            rating: Number(avgRating.toFixed(1)),
        });

        return c.json({
            success: true,
            message: 'Review updated successfully.',
            review: rev,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// DELETE /api/reviews/:id - Delete a review
review.delete('/:id', requireAuth, async (c) => {
    try {
        const user = c.get('user');
        const reviewId = c.req.param('id');

        const rev = await Review.findById(reviewId);
        if (!rev) {
            return c.json({ success: false, message: 'Review not found.' }, 404);
        }

        // Check ownership
        const isOwner = (rev.patientId && rev.patientId.toString() === user._id.toString()) ||
                        (rev.patientName === user.fullName);
        if (!isOwner && user.role !== 'admin') {
            return c.json({ success: false, message: 'You are not authorized to delete this review.' }, 403);
        }

        const doctorId = rev.doctorId;
        await rev.deleteOne();

        // Recalculate doctor rating
        const allReviews = await Review.find({ doctorId });
        const avgRating = allReviews.length ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) : 5.0;
        await Doctor.findByIdAndUpdate(doctorId, {
            rating: Number(avgRating.toFixed(1)),
            totalReviews: allReviews.length,
        });

        return c.json({
            success: true,
            message: 'Review deleted successfully.',
        });
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
