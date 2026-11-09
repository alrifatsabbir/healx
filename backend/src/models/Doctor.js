import mongoose from 'mongoose';

const chamberSchema = new mongoose.Schema({
    hospitalName: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    district: {
        type: String,
        required: true,
        default: 'Dhaka',
    },
    fee: {
        type: Number,
        required: true,
        default: 1000,
    },
    visitingDays: [{
        type: String,
    }],
    visitingHours: {
        type: String,
    },
    slots: [{
        type: String,
    }],
});

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: {
        type: String,
        required: [true, 'Doctor username is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-z0-9_.-]+$/, 'Username can only contain lowercase letters, numbers, underscores, dashes, and periods'],
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    bmdcNumber: {
        type: String,
        required: [true, 'BMDC Registration Number is required'],
        unique: true,
        trim: true,
    },
    specialty: {
        type: String,
        required: [true, 'Primary specialty is required'],
        trim: true,
    },
    subSpecialties: [{
        type: String,
    }],
    degrees: [{
        type: String,
    }],
    experienceYears: {
        type: Number,
        default: 1,
    },
    about: {
        type: String,
        default: '',
    },
    designation: {
        type: String,
        default: 'Consultant Specialist',
    },
    currentWorkplace: {
        type: String,
        default: '',
    },
    photoUrl: {
        type: String,
        default: '', // Compressed WebP Cloudinary URL
    },
    bmdcCertImageUrl: {
        type: String,
        default: '', // Compressed WebP Cloudinary URL for verification
    },
    degreeCertImageUrl: {
        type: String,
        default: '', // Compressed WebP Cloudinary URL for verification
    },
    chambers: [chamberSchema],
    rating: {
        type: Number,
        default: 5.0,
        min: 1,
        max: 5,
    },
    totalReviews: {
        type: Number,
        default: 0,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        default: 'Male',
    },
}, {
    timestamps: true,
});

doctorSchema.index({
    username: 1,
    name: 'text',
    specialty: 'text',
    bmdcNumber: 1,
});

export const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
