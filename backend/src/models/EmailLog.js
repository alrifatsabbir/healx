import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    subject: {
        type: String,
        required: true,
    },
    templateType: {
        type: String,
        default: 'general',
    },
    status: {
        type: String,
        enum: ['sent', 'failed'],
        default: 'sent',
    },
    messageId: {
        type: String,
        default: '',
    },
    errorMessage: {
        type: String,
        default: '',
    },
    sentBy: {
        type: String,
        default: 'system', // 'system' or admin email
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30, // Auto-expire after exactly 30 days
    },
});

export const EmailLog = mongoose.model('EmailLog', emailLogSchema);
export default EmailLog;

