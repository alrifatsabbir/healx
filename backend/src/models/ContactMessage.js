import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
        default: '',
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        default: 'General Inquiry',
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'replied', 'archived'],
        default: 'unread',
    },
    replySubject: {
        type: String,
        default: '',
    },
    replyMessage: {
        type: String,
        default: '',
    },
    repliedAt: {
        type: Date,
    },
    repliedBy: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
export default ContactMessage;
