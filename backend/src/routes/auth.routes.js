import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Otp from '../models/Otp.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import {
    sendDoctorOtpEmail,
    sendPatientVerificationOtpEmail,
    sendWelcomeEmail,
    sendDoctorPendingReviewEmail,
    sendAdminNewDoctorAlertEmail,
    sendPasswordResetOtpEmail,
    sendPasswordChangedEmail,
} from '../config/mailer.js';
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
// 2A. Patient Signup - Send Verification OTP
// --------------------------------------------------------------------------
auth.post('/patient/send-otp', async (c) => {
    try {
        const body = await c.req.json();
        const name = (body.name || body.fullName || '').trim();
        const username = (body.username || '').toLowerCase().trim();
        const email = (body.email || '').toLowerCase().trim();

        if (!name || !username || !email) {
            return c.json({
                success: false,
                message: 'Name, Username, and Email are required to send verification OTP.',
            }, 400);
        }

        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            const conflict = existing.username === username ? 'Username' : 'Email';
            return c.json({
                success: false,
                message: `${conflict} is already registered. Please choose another or login.`,
            }, 409);
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({ email, purpose: 'patient_signup' });
        await Otp.create({
            email,
            otp: otpCode,
            purpose: 'patient_signup',
            step1Data: { name, username, email },
        });

        // Dispatch OTP email asynchronously so slow SMTP handshakes never freeze the user UI
        sendPatientVerificationOtpEmail({ to: email, name, otp: otpCode }).catch((err) => {
            console.error(`[Mailer Warning] Failed sending patient OTP to ${email}:`, err.message);
        });

        return c.json({
            success: true,
            message: `Verification OTP sent to ${email}.`,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// --------------------------------------------------------------------------
// 2B. Patient Signup (Creates account + sends Welcome Email)
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
            otp,
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

        // If OTP is supplied, validate it strictly against Otp collection
        if (otp) {
            const otpRecord = await Otp.findOne({
                email: normalizedEmail,
                otp: String(otp).trim(),
                purpose: 'patient_signup',
            });
            if (!otpRecord) {
                return c.json({
                    success: false,
                    message: 'Invalid or expired verification OTP.',
                }, 400);
            }
            await Otp.deleteMany({ email: normalizedEmail, purpose: 'patient_signup' });
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

        // Dispatch Welcome Email asynchronously
        sendWelcomeEmail({
            to: user.email,
            name: user.fullName,
            username: user.username,
            role: 'patient',
        }).catch(console.error);

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

        // Send OTP email asynchronously so slow SMTP handshakes never freeze the user UI
        sendDoctorOtpEmail({
            to: normalizedEmail,
            doctorName: resolvedName,
            otp: otpCode,
        }).catch((err) => {
            console.error(`[Mailer Warning] Failed sending doctor OTP to ${normalizedEmail}:`, err.message);
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
            govtIdType = 'NID',
            govtIdImage,
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
                message: 'This BMDC registration number is already registered in HealiiX.',
            }, 409);
        }

        const step1 = verifiedData.step1Data;

        // Compress all uploaded images aggressively to WebP and upload to Cloudinary
        console.log('[Image Compression] Optimizing doctor assets to WebP...');
        const [photoUrl, bmdcCertImageUrl, govtIdImageUrl, degreeCertImageUrl] = await Promise.all([
            profileImage ? compressAndUploadToWebP(profileImage, { folder: 'healiix_doctors/avatars', maxWidth: 800, quality: 75 }) : Promise.resolve(''),
            bmdcCertImage ? compressAndUploadToWebP(bmdcCertImage, { folder: 'healiix_doctors/certs_bmdc', maxWidth: 1400, quality: 72 }) : Promise.resolve(''),
            govtIdImage ? compressAndUploadToWebP(govtIdImage, { folder: 'healiix_doctors/govt_ids', maxWidth: 1400, quality: 75 }) : Promise.resolve(''),
            degreeCertImage ? compressAndUploadToWebP(degreeCertImage, { folder: 'healiix_doctors/certs_degrees', maxWidth: 1400, quality: 70 }) : Promise.resolve(''),
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
            govtIdType,
            govtIdImageUrl,
            degreeCertImageUrl,
            chambers,
            verificationStatus: 'pending',
            isVerified: false,
        });

        // Clean up OTP record
        await Otp.deleteMany({ email: step1.email });

        // Notify Doctor (Under Review) + Admin (New Application Alert)
        Promise.all([
            sendDoctorPendingReviewEmail({
                to: user.email,
                doctorName: user.fullName,
                username: user.username,
                bmdcNumber: doctorProfile.bmdcNumber,
                specialty: doctorProfile.specialty,
            }),
            sendAdminNewDoctorAlertEmail({
                doctorName: user.fullName,
                username: user.username,
                email: user.email,
                phone: user.phone,
                bmdcNumber: doctorProfile.bmdcNumber,
                specialty: doctorProfile.specialty,
                hospitalName: doctorProfile.currentWorkplace,
            }),
        ]).catch(console.error);

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
            gender: user.gender || '',
            bloodGroup: user.bloodGroup || '',
            height: user.height ?? null,
            weight: user.weight ?? null,
            bloodPressure: user.bloodPressure || '',
            bloodSugar: user.bloodSugar || '',
            emergencyContact: user.emergencyContact || { name: '', phone: '', relation: '' },
            allergies: user.allergies || '',
            chronicConditions: user.chronicConditions || '',
            currentMedications: user.currentMedications || '',
            medicalNotes: user.medicalNotes || '',
            address: user.address || '',
            profileUrl: user.role === 'doctor' ? `/d/${user.username}` : `/u/${user.username}`,
            doctorProfile: extra,
        },
    });
});

// --------------------------------------------------------------------------
// 7B. Update User Profile (Patient / Any Auth User, compresses avatar to WebP)
// --------------------------------------------------------------------------
auth.put('/profile', requireAuth, async (c) => {
    try {
        const currentUser = c.get('user');
        const body = await c.req.json();
        const {
            fullName,
            phone,
            dateOfBirth,
            avatarImage,
            gender,
            bloodGroup,
            height,
            weight,
            bloodPressure,
            bloodSugar,
            emergencyContact,
            allergies,
            chronicConditions,
            currentMedications,
            medicalNotes,
            address,
        } = body;

        const user = await User.findById(currentUser._id);
        if (!user) {
            return c.json({ success: false, message: 'User not found.' }, 404);
        }

        if (fullName) user.fullName = fullName.trim();
        if (phone) user.phone = phone.trim();
        if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
        if (gender !== undefined) user.gender = gender;
        if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
        if (height !== undefined) user.height = height === '' ? null : Number(height);
        if (weight !== undefined) user.weight = weight === '' ? null : Number(weight);
        if (bloodPressure !== undefined) user.bloodPressure = bloodPressure.trim();
        if (bloodSugar !== undefined) user.bloodSugar = bloodSugar.trim();
        if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
        if (allergies !== undefined) user.allergies = allergies.trim();
        if (chronicConditions !== undefined) user.chronicConditions = chronicConditions.trim();
        if (currentMedications !== undefined) user.currentMedications = currentMedications.trim();
        if (medicalNotes !== undefined) user.medicalNotes = medicalNotes.trim();
        if (address !== undefined) user.address = address.trim();

        if (avatarImage) {
            const url = await compressAndUploadToWebP(avatarImage, {
                folder: 'healiix_users/avatars',
                maxWidth: 600,
                quality: 75,
            });
            user.avatar = url;
        }

        await user.save();

        return c.json({
            success: true,
            message: 'Profile updated successfully.',
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                avatar: user.avatar,
                gender: user.gender,
                bloodGroup: user.bloodGroup,
                height: user.height,
                weight: user.weight,
                bloodPressure: user.bloodPressure,
                bloodSugar: user.bloodSugar,
                emergencyContact: user.emergencyContact,
                allergies: user.allergies,
                chronicConditions: user.chronicConditions,
                currentMedications: user.currentMedications,
                medicalNotes: user.medicalNotes,
                address: user.address,
                profileUrl: user.role === 'doctor' ? `/d/${user.username}` : `/u/${user.username}`,
            },
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// --------------------------------------------------------------------------
// 8. Forgot Password - Request OTP
// --------------------------------------------------------------------------
auth.post('/forgot-password', async (c) => {
    try {
        const body = await c.req.json();
        const identifier = (body.identifier || body.email || body.username || '').toLowerCase().trim();

        if (!identifier) {
            return c.json({ success: false, message: 'Please provide your email or username.' }, 400);
        }

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }],
        });

        if (!user) {
            return c.json({ success: false, message: 'No account found with that email or username.' }, 404);
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({ email: user.email, purpose: 'password_reset' });
        await Otp.create({
            email: user.email,
            otp: otpCode,
            purpose: 'password_reset',
        });

        // Dispatch Password Reset OTP asynchronously
        sendPasswordResetOtpEmail({
            to: user.email,
            name: user.fullName,
            otp: otpCode,
        }).catch((err) => {
            console.error(`[Mailer Warning] Failed sending password reset OTP to ${user.email}:`, err.message);
        });

        return c.json({
            success: true,
            message: `Password reset OTP sent to ${user.email}.`,
            email: user.email,
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// --------------------------------------------------------------------------
// 9. Reset Password with OTP
// --------------------------------------------------------------------------
auth.post('/reset-password', async (c) => {
    try {
        const body = await c.req.json();
        const { email, otp, newPassword, confirmPassword } = body;

        if (!email || !otp || !newPassword) {
            return c.json({ success: false, message: 'Email, OTP, and new password are required.' }, 400);
        }

        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
            return c.json({ success: false, message: 'Passwords do not match.' }, 400);
        }

        const normalizedEmail = email.toLowerCase().trim();
        const otpRecord = await Otp.findOne({
            email: normalizedEmail,
            otp: String(otp).trim(),
            purpose: 'password_reset',
        });

        if (!otpRecord) {
            return c.json({ success: false, message: 'Invalid or expired reset OTP.' }, 400);
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return c.json({ success: false, message: 'Account not found.' }, 404);
        }

        user.password = newPassword;
        await user.save();

        await Otp.deleteMany({ email: normalizedEmail, purpose: 'password_reset' });

        // Send security notification email
        sendPasswordChangedEmail({
            to: user.email,
            name: user.fullName,
        }).catch(console.error);

        return c.json({
            success: true,
            message: 'Password updated successfully. You may now sign in with your new password.',
        });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

// --------------------------------------------------------------------------
// 10. Authenticated Change Password (Settings Pages)
// --------------------------------------------------------------------------
auth.put('/change-password', requireAuth, async (c) => {
    try {
        const currentUser = c.get('user');
        const { currentPassword, newPassword, confirmPassword } = await c.req.json();

        if (!currentPassword || !newPassword) {
            return c.json({ success: false, message: 'Current password and new password are required.' }, 400);
        }
        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
            return c.json({ success: false, message: 'New passwords do not match.' }, 400);
        }
        if (newPassword.length < 6) {
            return c.json({ success: false, message: 'New password must be at least 6 characters.' }, 400);
        }

        const user = await User.findById(currentUser._id).select('+password');
        if (!user || !(await user.matchPassword(currentPassword))) {
            return c.json({ success: false, message: 'Current password is incorrect.' }, 401);
        }

        user.password = newPassword;
        await user.save();

        sendPasswordChangedEmail({ to: user.email, name: user.fullName }).catch(console.error);

        return c.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
        return c.json({ success: false, message: err.message }, 500);
    }
});

export default auth;
