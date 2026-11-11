import { Hono } from 'hono';
import Doctor from '../models/Doctor.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendDoctorApprovalStatusEmail } from '../config/mailer.js';

const doctor = new Hono();

// GET /api/doctors - Search & filter doctors
doctor.get('/', async (c) => {
    try {
        const {
            q,
            specialty,
            district,
            city,
            minFee,
            maxFee,
            sortBy = 'rating',
            page = '1',
            limit = '20',
        } = c.req.query();

        const filter = {};

        // Free-text search on name, specialty, or degrees
        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            filter.$or = [
                { name: regex },
                { specialty: regex },
                { degrees: regex },
                { 'chambers.hospitalName': regex },
                { 'chambers.city': regex },
            ];
        }

        // Exact/partial specialty filter
        if (specialty && specialty.trim()) {
            filter.specialty = new RegExp(specialty.trim(), 'i');
        }

        // District / City filter inside chambers
        if (district && district.trim()) {
            filter['chambers.district'] = new RegExp(district.trim(), 'i');
        }
        if (city && city.trim()) {
            filter['chambers.city'] = new RegExp(city.trim(), 'i');
        }

        // Fee range filter
        if (minFee || maxFee) {
            filter['chambers.fee'] = {};
            if (minFee) filter['chambers.fee'].$gte = Number(minFee);
            if (maxFee) filter['chambers.fee'].$lte = Number(maxFee);
        }

        // Sorting options
        let sortOption = { rating: -1, totalReviews: -1 };
        if (sortBy === 'fee_asc') sortOption = { 'chambers.fee': 1 };
        if (sortBy === 'fee_desc') sortOption = { 'chambers.fee': -1 };
        if (sortBy === 'experience') sortOption = { experienceYears: -1 };
        if (sortBy === 'newest') sortOption = { createdAt: -1 };

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.max(1, parseInt(limit, 10));
        const skip = (pageNum - 1) * limitNum;

        const [doctors, total] = await Promise.all([
            Doctor.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Doctor.countDocuments(filter),
        ]);

        return c.json({
            success: true,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            doctors,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// GET /api/doctors/:id - Single Doctor Details
doctor.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const doc = await Doctor.findById(id).lean();

        if (!doc) {
            return c.json({ success: false, message: 'Doctor profile not found.' }, 404);
        }

        return c.json({
            success: true,
            doctor: doc,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// POST /api/doctors - Create / Onboard Doctor Profile (Doctor or Admin only)
doctor.post('/', requireAuth, requireRole('doctor', 'admin'), async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();

        const existingDoc = await Doctor.findOne({
            $or: [{ userId: user._id }, { bmdcNumber: body.bmdcNumber }],
        });

        if (existingDoc) {
            return c.json({
                success: false,
                message: 'A doctor profile already exists with this user account or BMDC number.',
            }, 409);
        }

        const newDoctor = await Doctor.create({
            ...body,
            userId: user._id,
            name: body.name || user.fullName,
        });

        return c.json({
            success: true,
            message: 'Doctor profile registered successfully.',
            doctor: newDoctor,
        }, 201);
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// PUT /api/doctors/:id - Update Doctor Profile
doctor.put('/:id', requireAuth, async (c) => {
    try {
        const user = c.get('user');
        const id = c.req.param('id');
        const body = await c.req.json();

        const doc = await Doctor.findById(id);
        if (!doc) {
            return c.json({ success: false, message: 'Doctor not found.' }, 404);
        }

        // Only the doctor themselves or an admin can update
        if (doc.userId.toString() !== user._id.toString() && user.role !== 'admin') {
            return c.json({ success: false, message: 'Unauthorized to update this profile.' }, 403);
        }

        Object.assign(doc, body);
        await doc.save();

        return c.json({
            success: true,
            message: 'Doctor profile updated successfully.',
            doctor: doc,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// PATCH /api/doctors/:id/verify - Admin verifies/rejects doctor & sends status email
doctor.patch('/:id/verify', requireAuth, requireRole('admin'), async (c) => {
    try {
        const id = c.req.param('id');
        const { status, reason = '' } = await c.req.json();

        if (!['approved', 'rejected'].includes(status)) {
            return c.json({ success: false, message: 'Status must be "approved" or "rejected".' }, 400);
        }

        const doc = await Doctor.findById(id);
        if (!doc) {
            return c.json({ success: false, message: 'Doctor profile not found.' }, 404);
        }

        doc.verificationStatus = status;
        doc.isVerified = status === 'approved';
        await doc.save();

        sendDoctorApprovalStatusEmail({
            to: doc.email,
            doctorName: doc.name,
            username: doc.username,
            status,
            reason,
        }).catch(console.error);

        return c.json({
            success: true,
            message: `Doctor @${doc.username} verification updated to ${status}. Notification email dispatched.`,
            doctor: doc,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

export default doctor;

