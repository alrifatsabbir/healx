import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

let transporter = null;

export async function getTransporter() {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'dev@healx.health',
                pass: 'devsecret',
            },
        });
    }

    return transporter;
}

export async function sendDoctorOtpEmail({ to, doctorName, otp }) {
    try {
        const mail = await getTransporter();
        const info = await mail.sendMail({
            from: process.env.EMAIL_FROM || '"HealX Doctor Verification" <noreply@healx.health>',
            to,
            subject: `${otp} is your HealX Doctor Registration OTP`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 28px; border: 1px solid #dce8e3; border-radius: 16px; background: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #082c2a; margin: 0; font-size: 24px;">HealX Doctor Onboarding</h2>
                        <p style="color: #64817a; font-size: 14px; margin-top: 4px;">Step 1 Verification Code</p>
                    </div>

                    <p style="color: #274843; font-size: 15px;">Hello Dr. <strong>${doctorName}</strong>,</p>
                    <p style="color: #556e68; font-size: 14px; line-height: 1.6;">
                        Thank you for applying to join the HealX Medical Directory. Please use the verification code below to verify your email and unlock Step 2 (BMDC & Credentials):
                    </p>

                    <div style="text-align: center; margin: 28px 0; background: #edf7f4; border: 2px dashed #0e927f; border-radius: 12px; padding: 18px;">
                        <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0e927f; font-family: monospace;">${otp}</span>
                        <p style="color: #556e68; font-size: 12px; margin: 8px 0 0 0;">This OTP is valid for 10 minutes</p>
                    </div>

                    <p style="color: #556e68; font-size: 13px; line-height: 1.5;">
                        If you did not request this code, please disregard this email.
                    </p>

                    <hr style="border: 0; border-top: 1px solid #eef3f1; margin: 24px 0;">
                    <p style="color: #92a9a3; font-size: 11px; text-align: center; margin: 0;">
                        HealX Healthcare Platform • CSE Web Technologies Lab
                    </p>
                </div>
            `,
        });
        console.log(`[Email] Doctor OTP (${otp}) dispatched to ${to} (${info.messageId || 'sent'})`);
        return true;
    } catch (err) {
        console.warn(`[Email Warning] Could not send OTP email:`, err.message);
        return false;
    }
}

export async function sendAppointmentEmail({ to, patientName, doctorName, bookingRef, date, slot, hospitalName }) {
    try {
        const mail = await getTransporter();
        const info = await mail.sendMail({
            from: process.env.EMAIL_FROM || '"HealX Care Team" <noreply@healx.health>',
            to,
            subject: `Appointment Confirmed [Ref: ${bookingRef}] - HealX`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2ede8; border-radius: 16px;">
                    <h2 style="color: #082c2a; margin-bottom: 8px;">HealX Consultation Confirmation</h2>
                    <p style="color: #556e68; font-size: 15px;">Dear <strong>${patientName}</strong>,</p>
                    <p style="color: #556e68; font-size: 14px; line-height: 1.6;">Your medical consultation appointment has been scheduled successfully.</p>
                    
                    <div style="background-color: #f2f7f5; padding: 18px; border-radius: 12px; margin: 20px 0;">
                        <p style="margin: 6px 0; color: #082c2a;"><strong>Booking Reference:</strong> <span style="color: #0e927f;">${bookingRef}</span></p>
                        <p style="margin: 6px 0; color: #082c2a;"><strong>Doctor:</strong> ${doctorName}</p>
                        <p style="margin: 6px 0; color: #082c2a;"><strong>Hospital / Chamber:</strong> ${hospitalName || 'Main Chamber'}</p>
                        <p style="margin: 6px 0; color: #082c2a;"><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                        <p style="margin: 6px 0; color: #082c2a;"><strong>Time Slot:</strong> ${slot || 'Confirmed by chamber'}</p>
                    </div>

                    <p style="color: #8da59f; font-size: 12px;">Please reach the chamber 15 minutes before your scheduled slot. For inquiries, contact HealX support.</p>
                </div>
            `,
        });
        console.log(`[Email] Appointment confirmation sent to ${to} (${info.messageId || 'sent'})`);
        return true;
    } catch (err) {
        console.warn(`[Email Warning] Could not send email:`, err.message);
        return false;
    }
}
