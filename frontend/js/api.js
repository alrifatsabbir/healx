import { CONFIG } from './config.js';

export const api = {
    getToken() {
        return localStorage.getItem('healx_token');
    },

    setToken(token) {
        if (token) localStorage.setItem('healx_token', token);
        else localStorage.removeItem('healx_token');
    },

    getCurrentUser() {
        const user = localStorage.getItem('healx_user');
        return user ? JSON.parse(user) : null;
    },

    setCurrentUser(user) {
        if (user) localStorage.setItem('healx_user', JSON.stringify(user));
        else localStorage.removeItem('healx_user');
    },

    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const res = await fetch(url, { ...options, headers });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || `Request failed with status ${res.status}`);
            }
            return data;
        } catch (err) {
            console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err.message);
            throw err;
        }
    },

    // ---------------- AUTH API ----------------
    // Login with Email OR Username
    async login(identifier, password) {
        const res = await this.request(CONFIG.ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ identifier, password }),
        });
        if (res.token) this.setToken(res.token);
        if (res.user) this.setCurrentUser(res.user);
        return res;
    },

    async checkUsername(username) {
        return this.request(CONFIG.ENDPOINTS.AUTH.CHECK_USERNAME(username), { method: 'GET' });
    },

    // Patient Signup
    async patientSignup(patientData) {
        const res = await this.request(CONFIG.ENDPOINTS.AUTH.PATIENT_SIGNUP, {
            method: 'POST',
            body: JSON.stringify(patientData),
        });
        if (res.token) this.setToken(res.token);
        if (res.user) this.setCurrentUser(res.user);
        return res;
    },

    // Doctor Signup Step 1 (Send OTP)
    async doctorStep1(step1Data) {
        return this.request(CONFIG.ENDPOINTS.AUTH.DOCTOR_STEP_1, {
            method: 'POST',
            body: JSON.stringify(step1Data),
        });
    },

    // Doctor Verify OTP
    async doctorVerifyOtp(email, otp) {
        return this.request(CONFIG.ENDPOINTS.AUTH.DOCTOR_VERIFY_OTP, {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        });
    },

    // Doctor Signup Step 2 (Final Credentials & WebP Images)
    async doctorStep2(step2Data) {
        const res = await this.request(CONFIG.ENDPOINTS.AUTH.DOCTOR_STEP_2, {
            method: 'POST',
            body: JSON.stringify(step2Data),
        });
        if (res.token) this.setToken(res.token);
        if (res.user) this.setCurrentUser(res.user);
        return res;
    },

    logout() {
        this.setToken(null);
        this.setCurrentUser(null);
        window.location.reload();
    },

    async getProfile() {
        return this.request(CONFIG.ENDPOINTS.AUTH.ME, { method: 'GET' });
    },

    // Public Profiles
    async getPatientProfile(username) {
        return this.request(CONFIG.PROFILE_URLS.PATIENT(username), { method: 'GET' });
    },

    async getDoctorProfile(username) {
        return this.request(CONFIG.PROFILE_URLS.DOCTOR(username), { method: 'GET' });
    },

    // ---------------- DOCTORS API ----------------
    async getDoctors(params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${CONFIG.ENDPOINTS.DOCTORS.LIST}?${query}` : CONFIG.ENDPOINTS.DOCTORS.LIST;
        return this.request(url, { method: 'GET' });
    },

    async getDoctorById(id) {
        return this.request(CONFIG.ENDPOINTS.DOCTORS.DETAILS(id), { method: 'GET' });
    },

    // ---------------- APPOINTMENTS API ----------------
    async bookAppointment(appointmentData) {
        return this.request(CONFIG.ENDPOINTS.APPOINTMENTS.BOOK, {
            method: 'POST',
            body: JSON.stringify(appointmentData),
        });
    },

    async getMyAppointments() {
        return this.request(CONFIG.ENDPOINTS.APPOINTMENTS.MY, { method: 'GET' });
    },

    // ---------------- REVIEWS API ----------------
    async addReview(reviewData) {
        return this.request(CONFIG.ENDPOINTS.REVIEWS.CREATE, {
            method: 'POST',
            body: JSON.stringify(reviewData),
        });
    },

    async getDoctorReviews(doctorId) {
        return this.request(CONFIG.ENDPOINTS.REVIEWS.DOCTOR_REVIEWS(doctorId), { method: 'GET' });
    },
};

export default api;
