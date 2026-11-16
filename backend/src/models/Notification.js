import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        maxlength: 140,
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['announcement', 'update', 'important', 'maintenance'],
        default: 'announcement',
    },
    targetAudience: {
        type: String,
        enum: ['all', 'patients', 'doctors'],
        default: 'all',
    },
    durationDays: {
        type: Number,
        required: true,
        min: 1,
        max: 90,
        default: 7,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    dismissedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

