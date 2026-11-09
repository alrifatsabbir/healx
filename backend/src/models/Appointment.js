import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    bookingRef: {
        type: String,
        unique: true,
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // Allow guest/quick booking or registered user
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Doctor selection is required'],
    },
    doctorName: {
        type: String,
        required: true,
    },
    hospitalName: {
        type: String,
        default: 'Main Consultation Chamber',
    },
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required'],
    },
    timeSlot: {
        type: String,
        required: [true, 'Appointment time slot is required'],
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true,
    },
    patientPhone: {
        type: String,
        required: [true, 'Patient phone number is required'],
        trim: true,
    },
    patientEmail: {
        type: String,
        trim: true,
        lowercase: true,
    },
    patientAge: {
        type: Number,
    },
    patientGender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    symptomsDescription: {
        type: String,
        trim: true,
        default: '',
    },
    prescriptionUrl: {
        type: String, // Cloudinary URL if uploaded
        default: '',
    },
    consultationFee: {
        type: Number,
        required: true,
        default: 1000,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'cash_at_chamber'],
        default: 'cash_at_chamber',
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending',
    },
    cancelledReason: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

export const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;

