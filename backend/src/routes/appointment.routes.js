import { Hono } from 'hono';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { requireAuth } from '../middleware/auth.js';
import { sendAppointmentEmail } from '../config/mailer.js';

const appointment = new Hono();

// Helper to generate unique booking reference
function generateBookingRef() {
    return `HLX-${Math.floor(10000 + Math.random() * 90000)}`;
}

// POST /api/appointments/book - Create live appointment
appointment.post('/book', async (c) => {
    try {
        const body = await c.req.json();
        const {
            doctorId,
            hospitalName,
            appointmentDate,
            timeSlot,
            patientName,
            patientPhone,
            patientEmail,
            patientAge,
            patientGender,
            symptomsDescription,
            prescriptionUrl,
            consultationFee,
        } = body;

        if (!doctorId || !appointmentDate || !timeSlot || !patientName || !patientPhone) {
            return c.json({
                success: false,
                message: 'Doctor, date, time slot, patient name, and phone are required.',
            }, 400);
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return c.json({ success: false, message: 'Selected doctor not found.' }, 404);
        }

        // Try to get logged-in user if token is present
        let patientId = null;
        const authHeader = c.req.header('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            // Optional auth decode
            try {
                const jwt = (await import('jsonwebtoken')).default;
                const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
                patientId = decoded.id;
            } catch (_) {}
        }

        const bookingRef = generateBookingRef();

        const newAppointment = await Appointment.create({
            bookingRef,
            patientId,
            doctorId: doctor._id,
            doctorName: doctor.name,
            hospitalName: hospitalName || (doctor.chambers[0]?.hospitalName || 'Main Chamber'),
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            patientName,
            patientPhone,
            patientEmail: patientEmail || '',
            patientAge: patientAge ? Number(patientAge) : undefined,
            patientGender,
            symptomsDescription: symptomsDescription || '',
            prescriptionUrl: prescriptionUrl || '',
            consultationFee: consultationFee || (doctor.chambers[0]?.fee || 1000),
            status: 'pending',
        });

        // Trigger email notification if patient provided email
        if (patientEmail) {
            sendAppointmentEmail({
                to: patientEmail,
                patientName,
                doctorName: doctor.name,
                bookingRef,
                date: appointmentDate,
                slot: timeSlot,
                hospitalName: newAppointment.hospitalName,
            }).catch(console.error);
        }

        return c.json({
            success: true,
            message: 'Appointment booked successfully.',
            bookingRef,
            appointment: newAppointment,
        }, 201);
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// GET /api/appointments/my - Get user's appointments
appointment.get('/my', requireAuth, async (c) => {
    try {
        const user = c.get('user');
        const appointments = await Appointment.find({
            $or: [{ patientId: user._id }, { patientEmail: user.email }, { patientPhone: user.phone }],
        }).sort({ appointmentDate: -1 }).lean();

        return c.json({
            success: true,
            count: appointments.length,
            appointments,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// GET /api/appointments/doctor-appointments - For doctors
appointment.get('/doctor-appointments', requireAuth, async (c) => {
    try {
        const user = c.get('user');
        const doctor = await Doctor.findOne({ userId: user._id });

        if (!doctor) {
            return c.json({ success: false, message: 'Doctor profile not associated with this account.' }, 404);
        }

        const appointments = await Appointment.find({ doctorId: doctor._id })
            .sort({ appointmentDate: 1, timeSlot: 1 })
            .lean();

        return c.json({
            success: true,
            count: appointments.length,
            appointments,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// PATCH /api/appointments/:id/status - Update booking status
appointment.patch('/:id/status', requireAuth, async (c) => {
    try {
        const id = c.req.param('id');
        const { status, cancelledReason } = await c.req.json();

        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            return c.json({ success: false, message: 'Invalid status value.' }, 400);
        }

        const appt = await Appointment.findById(id);
        if (!appt) {
            return c.json({ success: false, message: 'Appointment not found.' }, 404);
        }

        appt.status = status;
        if (cancelledReason) appt.cancelledReason = cancelledReason;
        await appt.save();

        return c.json({
            success: true,
            message: `Appointment status updated to ${status}.`,
            appointment: appt,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

export default appointment;

