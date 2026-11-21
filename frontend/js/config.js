// HealiiX Service URLs (Development & Production Separation)
const SERVICE_URLS = {
    DEV: {
        BACKEND: 'http://localhost:5000',
        AI_BOT: 'http://localhost:8000',
    },
    PROD: {
        // Set your live deployed Backend & AI Bot domains here before deploying Frontend
        BACKEND: 'https://healx-hzkt.onrender.com',
        AI_BOT: 'https://ai.healiix.alrifatsabbir.me',
    },
};

const isLocalDev = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
const ACTIVE_ENV = isLocalDev ? SERVICE_URLS.DEV : SERVICE_URLS.PROD;

const API_BASE_URL = ACTIVE_ENV.BACKEND;
const AI_BOT_BASE_URL = ACTIVE_ENV.AI_BOT;

export function getAppPath(pageFile = '') {
    if (!pageFile) return './';
    const clean = pageFile.replace(/^\/+/, '');
    if (typeof window !== 'undefined') {
        const path = window.location.pathname || '';
        if (path.includes('/frontend/')) {
            return `/frontend/${clean}`;
        }
    }
    return `./${clean}`;
}

if (typeof window !== 'undefined') {
    window.getAppPath = getAppPath;
}

export const CONFIG = {
    getAppPath,
    ENV: isLocalDev ? 'development' : 'production',
    API_BASE_URL: `${API_BASE_URL}/api`,
    BACKEND_BASE_URL: API_BASE_URL,
    AI_BOT_BASE_URL,
    PROFILE_URLS: {
        PATIENT: (username) => `${API_BASE_URL}/api/u/${username}`,
        DOCTOR: (username) => `${API_BASE_URL}/api/d/${username}`,
    },
    PROFILE_PAGES: {
        PATIENT: (username) => (username ? getAppPath(`user-profile.html?u=${encodeURIComponent(username)}`) : getAppPath('patient-settings.html')),
        DOCTOR: (username) => getAppPath(`doctor-profile.html?d=${encodeURIComponent(username)}`),
        ADMIN: () => getAppPath('admin-profile.html'),
    },
    DASHBOARD_PAGES: {
        PATIENT: () => getAppPath('patient-dashboard.html'),
        DOCTOR: () => getAppPath('doctor-dashboard.html'),
        ADMIN: () => getAppPath('admin-dashboard.html'),
    },
    ENDPOINTS: {
        AUTH: {
            LOGIN: `${API_BASE_URL}/api/auth/login`,
            ADMIN_LOGIN: `${API_BASE_URL}/api/auth/admin-login`,
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
            CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
        },
        // Contact uses the Vercel serverless relay in production (api/send-mail.js → Render → SMTP).
        // In local dev it falls back to calling Render directly (no relay overhead).
        CONTACT: `${API_BASE_URL}/api/contact`,
        NOTIFICATIONS: {
            MY: `${API_BASE_URL}/api/notifications/my`,
            READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`,
            DISMISS: (id) => `${API_BASE_URL}/api/notifications/${id}/dismiss`,
        },
        DOCTORS: {
            LIST: `${API_BASE_URL}/api/doctors`,
            ME_PROFILE: `${API_BASE_URL}/api/doctors/me/profile`,
            DETAILS: (id) => `${API_BASE_URL}/api/doctors/${id}`,
            BY_USERNAME: (username) => `${API_BASE_URL}/d/${username}`,
            CREATE: `${API_BASE_URL}/api/doctors`,
        },
        ADMIN: {
            STATS: `${API_BASE_URL}/api/admin/stats`,
            ANALYTICS: `${API_BASE_URL}/api/admin/analytics`,
            PATIENTS: `${API_BASE_URL}/api/admin/patients`,
            PATIENT_BY_ID: (id) => `${API_BASE_URL}/api/admin/patients/${id}`,
            DOCTORS: `${API_BASE_URL}/api/admin/doctors`,
            DOCTOR_BY_ID: (id) => `${API_BASE_URL}/api/admin/doctors/${id}`,
            VERIFY_DOCTOR: (id) => `${API_BASE_URL}/api/admin/doctors/${id}/verify`,
            USERS: `${API_BASE_URL}/api/admin/users`,
            USER_STATUS: (id) => `${API_BASE_URL}/api/admin/users/${id}/status`,
            APPOINTMENTS: `${API_BASE_URL}/api/admin/appointments`,
            CONTACTS: `${API_BASE_URL}/api/admin/contacts`,
            CONTACT_DETAIL: (id) => `${API_BASE_URL}/api/admin/contacts/${id}`,
            CONTACT_STATUS: (id) => `${API_BASE_URL}/api/admin/contacts/${id}/status`,
            CONTACT_REPLY: (id) => `${API_BASE_URL}/api/admin/contacts/${id}/reply`,
            CONTACT_DELETE: (id) => `${API_BASE_URL}/api/admin/contacts/${id}`,
            EMAIL_SEND: `${API_BASE_URL}/api/admin/emails/send`,
            EMAIL_LOGS: `${API_BASE_URL}/api/admin/emails/logs`,
            EMAIL_LOG_DELETE: (id) => `${API_BASE_URL}/api/admin/emails/logs/${id}`,
            NOTIFICATIONS: `${API_BASE_URL}/api/admin/notifications`,
            NOTIFICATION_TOGGLE: (id) => `${API_BASE_URL}/api/admin/notifications/${id}/toggle`,
            NOTIFICATION_DELETE: (id) => `${API_BASE_URL}/api/admin/notifications/${id}`,
        },
        APPOINTMENTS: {
            BOOK: `${API_BASE_URL}/api/appointments/book`,
            MY: `${API_BASE_URL}/api/appointments/my`,
            DOCTOR: `${API_BASE_URL}/api/appointments/doctor-appointments`,
            UPDATE_STATUS: (id) => `${API_BASE_URL}/api/appointments/${id}/status`,
        },
        REVIEWS: {
            CREATE: `${API_BASE_URL}/api/reviews`,
            MY: `${API_BASE_URL}/api/reviews/my`,
            UPDATE: (id) => `${API_BASE_URL}/api/reviews/${id}`,
            DELETE: (id) => `${API_BASE_URL}/api/reviews/${id}`,
            DOCTOR_REVIEWS: (doctorId) => `${API_BASE_URL}/api/reviews/doctor/${doctorId}`,
        },
        UPLOAD: `${API_BASE_URL}/api/upload/image`,
        BOT: {
            CHAT: `${AI_BOT_BASE_URL}/chat`,
            BACKEND_CHAT: `${API_BASE_URL}/api/bot/chat`,
            HEALTH: `${AI_BOT_BASE_URL}/health`,
            BACKEND_HEALTH: `${API_BASE_URL}/api/bot/health`,
            SUGGESTIONS: `${AI_BOT_BASE_URL}/suggestions`,
            BACKEND_SUGGESTIONS: `${API_BASE_URL}/api/bot/suggestions`,
        },
    },
};

CONFIG.getAppPath = getAppPath;

export default CONFIG;
