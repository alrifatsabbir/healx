import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        lowercase: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-z0-9_.-]+$/, 'Username can only contain lowercase letters, numbers, underscores, dashes, and periods'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false,
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient',
    },
    phone: {
        type: String,
        trim: true,
        required: [true, 'Phone number is required'],
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
    },
    avatar: {
        type: String,
        default: '',
        validate: {
            validator: function (v) {
                if (!v) return true;
                return !v.startsWith('data:image');
            },
            message: 'Base64 image data is not allowed in database. Images must be hosted on Cloudinary as WebP.',
        },
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', ''],
        default: '',
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
        default: '',
    },
    height: {
        type: Number, // in cm
        default: null,
    },
    weight: {
        type: Number, // in kg
        default: null,
    },
    bloodPressure: {
        type: String, // e.g. "120/80"
        default: '',
    },
    bloodSugar: {
        type: String, // e.g. "5.6" mmol/L
        default: '',
    },
    emergencyContact: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        relation: { type: String, default: '' },
    },
    allergies: {
        type: String,
        default: '',
    },
    chronicConditions: {
        type: String,
        default: '',
    },
    currentMedications: {
        type: String,
        default: '',
    },
    medicalNotes: {
        type: String,
        default: '',
    },
    address: {
        type: String,
        default: '',
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
export default User;
