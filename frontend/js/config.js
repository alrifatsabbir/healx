// HealiiX Service URLs (Development & Production Separation)
const SERVICE_URLS = {
    DEV: {
        BACKEND: 'http://localhost:5000',
        AI_BOT: 'http://localhost:8000',
    },
    PROD: {
        // Set your live deployed Backend & AI Bot domains here before deploying Frontend
        BACKEND: 'https://api.healiix.alrifatsabbir.me',
        AI_BOT: 'https://ai.healiix.alrifatsabbir.me',
    },
};

const isLocalDev = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
const ACTIVE_ENV = isLocalDev ? SERVICE_URLS.DEV : SERVICE_URLS.PROD;

const API_BASE_URL = ACTIVE_ENV.BACKEND;
const AI_BOT_BASE_URL = ACTIVE_ENV.AI_BOT;

export const CONFIG = {
    ENV: isLocalDev ? 'development' : 'production',
    API_BASE_URL: `${API_BASE_URL}/api`,
    AI_BOT_BASE_URL,
    PROFILE_URLS: {
        PATIENT: (username) => `${API_BASE_URL}/u/${username}`,
        DOCTOR: (username) => `${API_BASE_URL}/d/${username}`,
    },
    ENDPOINTS: {
        AUTH: {
            LOGIN: `${API_BASE_URL}/api/auth/login`,
            CHECK_USERNAME: (username) => `${API_BASE_URL}/api/auth/check-username/${username}`,
            PATIENT_SEND_OTP: `${API_BASE_URL}/api/auth/patient/send-otp`,
            PATIENT_SIGNUP: `${API_BASE_URL}/api/auth/patient/signup`,
            DOCTOR_STEP_1: `${API_BASE_URL}/api/auth/doctor/step-1`,
            DOCTOR_VERIFY_OTP: `${API_BASE_URL}/api/auth/doctor/verify-otp`,
            DOCTOR_STEP_2: `${API_BASE_URL}/api/auth/doctor/step-2`,
            FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
            RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
            ME: `${API_BASE_URL}/api/auth/me`,
            PROFILE: `${API_BASE_URL}/api/auth/profile`,
        },
        CONTACT: `${API_BASE_URL}/api/contact`,
        DOCTORS: {
            LIST: `${API_BASE_URL}/api/doctors`,
            DETAILS: (id) => `${API_BASE_URL}/api/doctors/${id}`,
            BY_USERNAME: (username) => `${API_BASE_URL}/d/${username}`,
            CREATE: `${API_BASE_URL}/api/doctors`,
        },
        APPOINTMENTS: {
            BOOK: `${API_BASE_URL}/api/appointments/book`,
            MY: `${API_BASE_URL}/api/appointments/my`,
            DOCTOR: `${API_BASE_URL}/api/appointments/doctor-appointments`,
            UPDATE_STATUS: (id) => `${API_BASE_URL}/api/appointments/${id}/status`,
        },
        REVIEWS: {
            CREATE: `${API_BASE_URL}/api/reviews`,
            DOCTOR_REVIEWS: (doctorId) => `${API_BASE_URL}/api/reviews/doctor/${doctorId}`,
        },
        UPLOAD: `${API_BASE_URL}/api/upload/image`,
    },
};

export default CONFIG;
