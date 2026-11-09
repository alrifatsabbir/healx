import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    patientName: {
        type: String,
        required: true,
        trim: true,
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required (1-5)'],
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: [true, 'Review comment is required'],
        trim: true,
    },
    appointmentRef: {
        type: String,
        default: '',
    },
    isVerifiedVisit: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

export const Review = mongoose.model('Review', reviewSchema);
export default Review;

