// HealX API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : '';

export const CONFIG = {
    API_BASE_URL: `${API_BASE_URL}/api`,
    PROFILE_URLS: {
        PATIENT: (username) => `${API_BASE_URL}/u/${username}`,
        DOCTOR: (username) => `${API_BASE_URL}/d/${username}`,
    },
    ENDPOINTS: {
        AUTH: {
            LOGIN: `${API_BASE_URL}/api/auth/login`,
            CHECK_USERNAME: (username) => `${API_BASE_URL}/api/auth/check-username/${username}`,
            PATIENT_SIGNUP: `${API_BASE_URL}/api/auth/patient/signup`,
            DOCTOR_STEP_1: `${API_BASE_URL}/api/auth/doctor/step-1`,
            DOCTOR_VERIFY_OTP: `${API_BASE_URL}/api/auth/doctor/verify-otp`,
            DOCTOR_STEP_2: `${API_BASE_URL}/api/auth/doctor/step-2`,
            ME: `${API_BASE_URL}/api/auth/me`,
            PROFILE: `${API_BASE_URL}/api/auth/profile`,
        },
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
