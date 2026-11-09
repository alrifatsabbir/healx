import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Otp from '../models/Otp.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { sendDoctorOtpEmail } from '../config/mailer.js';
import { compressAndUploadToWebP } from '../utils/imageCompressor.js';

const auth = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || 'healx-secret-fallback-key';

// --------------------------------------------------------------------------
// 1. Check Username Availability
// --------------------------------------------------------------------------
auth.get('/check-username/:username', async (c) => {
    try {
        const username = c.req.param('username').toLowerCase().trim();
        if (!/^[a-z0-9_.-]+$/.test(username)) {
            return c.json({ available: false, message: 'Invalid username format' }, 400);
        }

        const existing = await User.findOne({ username });
        return c.json({
            available: !existing,
            username,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// --------------------------------------------------------------------------
// 2. Patient Signup
// --------------------------------------------------------------------------
auth.post('/patient/signup', async (c) => {
    try {
        const body = await c.req.json();
        const {
            name,
            fullName,
            username,
            email,
            phone,
            dateOfBirth,
            password,
            confirmPassword,
        } = body;

        const resolvedName = name || fullName;

        if (!resolvedName || !username || !email || !phone || !dateOfBirth || !password) {
            return c.json({
                success: false,
                message: 'All fields (Name, Username, Email, Phone, DOB, Password) are required.',
            }, 400);
        }

        if (password !== confirmPassword) {
            return c.json({
                success: false,
                message: 'Password and Confirm Password do not match.',
            }, 400);
        }

        const normalizedUsername = username.toLowerCase().trim();
        const normalizedEmail = email.toLowerCase().trim();

        if (!/^[a-z0-9_.-]+$/.test(normalizedUsername)) {
            return c.json({
                success: false,
                message: 'Username can only contain letters, numbers, underscores, dashes, and periods.',
            }, 400);
        }

        // Check uniqueness
        const existing = await User.findOne({
            $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
        });

        if (existing) {
            const conflict = existing.username === normalizedUsername ? 'Username' : 'Email';
            return c.json({
                success: false,
                message: `${conflict} is already registered. Please choose another or login.`,
            }, 409);
        }

        const user = await User.create({
            fullName: resolvedName,
            username: normalizedUsername,
            email: normalizedEmail,
            phone,
            dateOfBirth: new Date(dateOfBirth),
            password,
            role: 'patient',
            isEmailVerified: true,
        });

        const token = generateToken(user._id, user.role);

        return c.json({
            success: true,
            message: 'Patient account created successfully.',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                phone: user.phone,
                profileUrl: `/u/${user.username}`,
            },
        }, 201);
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// Alias for generic register
auth.post('/register', async (c) => {
    return auth.fetch(new Request(c.req.url.replace('/register', '/patient/signup'), c.req.raw));
});

// --------------------------------------------------------------------------
// 3. Doctor Signup - Step 1: Submit info & Send OTP
// --------------------------------------------------------------------------
auth.post('/doctor/step-1', async (c) => {
    try {
        const body = await c.req.json();
        const { name, fullName, username, email, phone, dateOfBirth } = body;
        const resolvedName = name || fullName;

        if (!resolvedName || !username || !email || !phone || !dateOfBirth) {
            return c.json({
                success: false,
                message: 'Name, Username, Email, Phone, and Date of Birth are all required for Step 1.',
            }, 400);
        }

        const normalizedUsername = username.toLowerCase().trim();
        const normalizedEmail = email.toLowerCase().trim();

        if (!/^[a-z0-9_.-]+$/.test(normalizedUsername)) {
            return c.json({
                success: false,
                message: 'Username can only contain letters, numbers, underscores, dashes, and periods.',
            }, 400);
        }

        // Check if username or email is already taken in Users
        const existingUser = await User.findOne({
            $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
        });

        if (existingUser) {
            const conflict = existingUser.username === normalizedUsername ? 'Username' : 'Email';
            return c.json({
                success: false,
                message: `${conflict} is already taken. Please choose another or login.`,
            }, 409);
        }

        // Generate 6-digit numeric OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Invalidate any existing OTP for this email
        await Otp.deleteMany({ email: normalizedEmail });

        // Save new OTP record
        await Otp.create({
            email: normalizedEmail,
            otp: otpCode,
            purpose: 'doctor_signup',
            step1Data: {
                name: resolvedName,
                username: normalizedUsername,
                email: normalizedEmail,
                phone,
                dateOfBirth: new Date(dateOfBirth),
            },
        });

        // Send OTP email
        await sendDoctorOtpEmail({
            to: normalizedEmail,
            doctorName: resolvedName,
            otp: otpCode,
        });

        return c.json({
            success: true,
            message: `Verification code sent to ${normalizedEmail}. Please enter the OTP to proceed to Step 2.`,
            email: normalizedEmail,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// --------------------------------------------------------------------------
// 4. Doctor Signup - Verify OTP
// --------------------------------------------------------------------------
auth.post('/doctor/verify-otp', async (c) => {
    try {
        const body = await c.req.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return c.json({ success: false, message: 'Email and OTP code are required.' }, 400);
        }

        const normalizedEmail = email.toLowerCase().trim();
        const record = await Otp.findOne({
            email: normalizedEmail,
            otp: String(otp).trim(),
            purpose: 'doctor_signup',
        });

        if (!record) {
            return c.json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new code.',
            }, 400);
        }

        // Mark verified in DB
        record.isVerified = true;
        await record.save();

        // Issue a short-lived stepToken (1 hour) to securely authorize Step 2
        const stepToken = jwt.sign({
            email: normalizedEmail,
            step1Data: record.step1Data,
            verified: true,
        }, JWT_SECRET, { expiresIn: '1h' });

        return c.json({
            success: true,
            message: 'Email verified successfully! You can now complete Step 2.',
            stepToken,
            step1Data: record.step1Data,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// --------------------------------------------------------------------------
// 5. Doctor Signup - Step 2: Final Profile, Documents & Password
// --------------------------------------------------------------------------
auth.post('/doctor/step-2', async (c) => {
    try {
        const body = await c.req.json();
        const {
            stepToken,
            bmdcNumber,
            specialty,
            chamberOrHospital,
            chamberDetails,
            profileImage,
            bmdcCertImage,
            degreeCertImage,
            password,
            confirmPassword,
        } = body;

        if (!stepToken) {
            return c.json({ success: false, message: 'Step 1 verification token is required.' }, 401);
        }

        let verifiedData;
        try {
            verifiedData = jwt.verify(stepToken, JWT_SECRET);
        } catch (_) {
            return c.json({ success: false, message: 'Step verification has expired. Please redo Step 1.' }, 401);
        }

        if (!bmdcNumber || !specialty || !password) {
            return c.json({
                success: false,
                message: 'BMDC number, specialty, and password are required for Step 2.',
            }, 400);
        }

        if (password !== confirmPassword) {
            return c.json({
                success: false,
                message: 'Password and Confirm Password do not match.',
            }, 400);
        }

        const existingBmdc = await Doctor.findOne({ bmdcNumber: bmdcNumber.trim() });
        if (existingBmdc) {
            return c.json({
                success: false,
                message: 'This BMDC registration number is already registered in HealX.',
            }, 409);
        }

        const step1 = verifiedData.step1Data;

        // Compress all uploaded images aggressively to WebP and upload to Cloudinary
        console.log('[Image Compression] Optimizing doctor assets to WebP...');
        const [photoUrl, bmdcCertImageUrl, degreeCertImageUrl] = await Promise.all([
            profileImage ? compressAndUploadToWebP(profileImage, { folder: 'healx_doctors/avatars', maxWidth: 800, quality: 75 }) : Promise.resolve(''),
            bmdcCertImage ? compressAndUploadToWebP(bmdcCertImage, { folder: 'healx_doctors/certs_bmdc', maxWidth: 1400, quality: 70 }) : Promise.resolve(''),
            degreeCertImage ? compressAndUploadToWebP(degreeCertImage, { folder: 'healx_doctors/certs_degrees', maxWidth: 1400, quality: 70 }) : Promise.resolve(''),
        ]);

        // 1. Create Doctor User
        const user = await User.create({
            fullName: step1.name,
            username: step1.username,
            email: step1.email,
            phone: step1.phone,
            dateOfBirth: new Date(step1.dateOfBirth),
            password,
            role: 'doctor',
            avatar: photoUrl,
            isEmailVerified: true,
        });

        // 2. Parse Chamber Information
        const chambers = [];
        if (chamberDetails && Array.isArray(chamberDetails) && chamberDetails.length > 0) {
            chambers.push(...chamberDetails);
        } else if (chamberOrHospital) {
            chambers.push({
                hospitalName: chamberOrHospital,
                address: body.chamberAddress || 'Main Branch',
                city: body.chamberCity || 'Dhaka',
                district: body.chamberDistrict || 'Dhaka',
                fee: Number(body.chamberFee) || 1000,
                visitingDays: body.visitingDays || ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'],
                visitingHours: body.visitingHours || '5:00 PM - 9:00 PM',
                slots: body.slots || ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'],
            });
        }

        // 3. Create Doctor Profile
        const doctorProfile = await Doctor.create({
            userId: user._id,
            username: user.username,
            name: user.fullName,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            bmdcNumber: bmdcNumber.trim(),
            specialty: specialty.trim(),
            subSpecialties: body.subSpecialties || [],
            degrees: body.degrees || ['MBBS'],
            experienceYears: Number(body.experienceYears) || 1,
            about: body.about || '',
            designation: body.designation || 'Consultant Specialist',
            currentWorkplace: chamberOrHospital || body.currentWorkplace || '',
            photoUrl,
            bmdcCertImageUrl,
            degreeCertImageUrl,
            chambers,
            verificationStatus: 'pending',
            isVerified: false,
        });

        // Clean up OTP record
        await Otp.deleteMany({ email: step1.email });

        const token = generateToken(user._id, user.role);

        return c.json({
            success: true,
            message: 'Doctor registration completed! Your credentials have been submitted for verification.',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                profileUrl: `/d/${user.username}`,
            },
            doctor: doctorProfile,
        }, 201);
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// --------------------------------------------------------------------------
// 6. Unified Login (Email OR Username)
// --------------------------------------------------------------------------
auth.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const identifier = (body.identifier || body.emailOrUsername || body.email || body.username || '').toLowerCase().trim();
        const password = body.password;

        if (!identifier || !password) {
            return c.json({
                success: false,
                message: 'Email/Username and Password are required to sign in.',
            }, 400);
        }

        // Find user by either email OR username
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }],
        }).select('+password');

        if (!user) {
            return c.json({
                success: false,
                message: 'No account found with this email or username.',
            }, 401);
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return c.json({
                success: false,
                message: 'Invalid password. Please try again.',
            }, 401);
        }

        const token = generateToken(user._id, user.role);
        const profileUrl = user.role === 'doctor' ? `/d/${user.username}` : `/u/${user.username}`;

        return c.json({
            success: true,
            message: 'Logged in successfully.',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar,
                profileUrl,
            },
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// --------------------------------------------------------------------------
// 7. Me Profile Endpoint (Protected)
// --------------------------------------------------------------------------
auth.get('/me', requireAuth, async (c) => {
    const user = c.get('user');
    let extra = null;

    if (user.role === 'doctor') {
        extra = await Doctor.findOne({ userId: user._id }).lean();
    }

    return c.json({
        success: true,
        user: {
            id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            avatar: user.avatar,
            profileUrl: user.role === 'doctor' ? `/d/${user.username}` : `/u/${user.username}`,
            doctorProfile: extra,
        },
    });
});

export default auth;
