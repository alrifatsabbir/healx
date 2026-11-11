import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    otp: {
        type: String,
        required: true,
    },
    purpose: {
        type: String,
        enum: ['patient_signup', 'doctor_signup', 'password_reset'],
        default: 'doctor_signup',
    },
    step1Data: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // 10 minutes TTL
    },
});

export const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
