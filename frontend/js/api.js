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

    // Strictly Administrator Portal Login
    async adminLogin(identifier, password) {
        const res = await this.request(CONFIG.ENDPOINTS.AUTH.ADMIN_LOGIN, {
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

    // Patient Send Email Verification OTP
    async patientSendOtp(data) {
        return this.request(CONFIG.ENDPOINTS.AUTH.PATIENT_SEND_OTP, {
            method: 'POST',
            body: JSON.stringify(data),
        });
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

    // Forgot & Reset Password
    async forgotPassword(identifier) {
        return this.request(CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
            method: 'POST',
            body: JSON.stringify({ identifier }),
        });
    },

    async resetPassword(data) {
        return this.request(CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Contact Us
    async sendContactMessage(contactData) {
        return this.request(CONFIG.ENDPOINTS.CONTACT, {
            method: 'POST',
            body: JSON.stringify(contactData),
        });
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

    async updateProfile(profileData) {
        const res = await this.request(CONFIG.ENDPOINTS.AUTH.PROFILE, {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
        if (res.user) this.setCurrentUser(res.user);
        return res;
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

    async getMyDoctorProfile() {
        return this.request(CONFIG.ENDPOINTS.DOCTORS.ME_PROFILE, { method: 'GET' });
    },

    async updateMyDoctorProfile(data) {
        return this.request(CONFIG.ENDPOINTS.DOCTORS.ME_PROFILE, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
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

    async getDoctorAppointments() {
        return this.request(CONFIG.ENDPOINTS.APPOINTMENTS.DOCTOR, { method: 'GET' });
    },

    async updateAppointmentStatus(id, status, cancelledReason = '') {
        return this.request(CONFIG.ENDPOINTS.APPOINTMENTS.UPDATE_STATUS(id), {
            method: 'POST',
            body: JSON.stringify({ status, cancelledReason }),
        });
    },

    async changePassword(data) {
        return this.request(CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // ---------------- NOTIFICATIONS API ----------------
    async getMyNotifications() {
        return this.request(CONFIG.ENDPOINTS.NOTIFICATIONS.MY, { method: 'GET' });
    },

    async markNotificationRead(id) {
        return this.request(CONFIG.ENDPOINTS.NOTIFICATIONS.READ(id), { method: 'POST' });
    },

    async dismissNotification(id) {
        return this.request(CONFIG.ENDPOINTS.NOTIFICATIONS.DISMISS(id), { method: 'DELETE' });
    },

    // ---------------- ADMIN API ----------------
    async getAdminStats() {
        return this.request(CONFIG.ENDPOINTS.ADMIN.STATS, { method: 'GET' });
    },

    async getAdminAnalytics() {
        return this.request(CONFIG.ENDPOINTS.ADMIN.ANALYTICS, { method: 'GET' });
    },

    async getAdminPatients(q = '') {
        const url = q ? `${CONFIG.ENDPOINTS.ADMIN.PATIENTS}?q=${encodeURIComponent(q)}` : CONFIG.ENDPOINTS.ADMIN.PATIENTS;
        return this.request(url, { method: 'GET' });
    },

    async createAdminPatient(data) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.PATIENTS, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateAdminPatient(id, data) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.PATIENT_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteAdminPatient(id) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.PATIENT_BY_ID(id), { method: 'DELETE' });
    },

    async getAdminDoctors(status = '', q = '') {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (q) params.set('q', q);
        const qs = params.toString();
        return this.request(qs ? `${CONFIG.ENDPOINTS.ADMIN.DOCTORS}?${qs}` : CONFIG.ENDPOINTS.ADMIN.DOCTORS, { method: 'GET' });
    },

    async updateAdminDoctor(id, data) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.DOCTOR_BY_ID(id), {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteAdminDoctor(id) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.DOCTOR_BY_ID(id), { method: 'DELETE' });
    },

    async verifyDoctor(id, status, reason = '') {
        return this.request(CONFIG.ENDPOINTS.ADMIN.VERIFY_DOCTOR(id), {
            method: 'POST',
            body: JSON.stringify({ status, reason }),
        });
    },

    async getAdminUsers(role = '') {
        const url = role ? `${CONFIG.ENDPOINTS.ADMIN.USERS}?role=${encodeURIComponent(role)}` : CONFIG.ENDPOINTS.ADMIN.USERS;
        return this.request(url, { method: 'GET' });
    },

    async toggleUserStatus(id, isActive) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.USER_STATUS(id), {
            method: 'POST',
            body: JSON.stringify({ isActive }),
        });
    },

    async getAdminAppointments(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(qs ? `${CONFIG.ENDPOINTS.ADMIN.APPOINTMENTS}?${qs}` : CONFIG.ENDPOINTS.ADMIN.APPOINTMENTS, { method: 'GET' });
    },

    async sendAdminEmail(data) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.EMAIL_SEND, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Inbound Contact Inquiries (Admin)
    async getAdminContacts(status = '', q = '', page = 1, limit = 20) {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (q) params.set('q', q);
        if (page) params.set('page', page);
        if (limit) params.set('limit', limit);
        const qs = params.toString();
        return this.request(qs ? `${CONFIG.ENDPOINTS.ADMIN.CONTACTS}?${qs}` : CONFIG.ENDPOINTS.ADMIN.CONTACTS, { method: 'GET' });
    },

    async getAdminContactById(id) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.CONTACT_DETAIL(id), { method: 'GET' });
    },

    async updateAdminContactStatus(id, status) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.CONTACT_STATUS(id), {
            method: 'POST',
            body: JSON.stringify({ status }),
        });
    },

    async replyAdminContact(id, data) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.CONTACT_REPLY(id), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async deleteAdminContact(id) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.CONTACT_DELETE(id), { method: 'DELETE' });
    },

    async getEmailLogs(status = '', q = '') {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (q) params.set('q', q);
        const qs = params.toString();
        return this.request(qs ? `${CONFIG.ENDPOINTS.ADMIN.EMAIL_LOGS}?${qs}` : CONFIG.ENDPOINTS.ADMIN.EMAIL_LOGS, { method: 'GET' });
    },

    async deleteEmailLog(id) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.EMAIL_LOG_DELETE(id), { method: 'DELETE' });
    },

    async sendAdminNotification(data) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.NOTIFICATIONS, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getAdminNotifications() {
        return this.request(CONFIG.ENDPOINTS.ADMIN.NOTIFICATIONS, { method: 'GET' });
    },

    async toggleAdminNotification(id) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.NOTIFICATION_TOGGLE(id), { method: 'POST' });
    },

    async deleteAdminNotification(id) {
        return this.request(CONFIG.ENDPOINTS.ADMIN.NOTIFICATION_DELETE(id), { method: 'DELETE' });
    },

    // ---------------- REVIEWS API ----------------
    async addReview(reviewData) {
        return this.request(CONFIG.ENDPOINTS.REVIEWS.CREATE, {
            method: 'POST',
            body: JSON.stringify(reviewData),
        });
    },

    async createReview(reviewData) {
        return this.addReview(reviewData);
    },

    async getMyReviews() {
        return this.request(CONFIG.ENDPOINTS.REVIEWS.MY, { method: 'GET' });
    },

    async updateReview(id, data) {
        return this.request(CONFIG.ENDPOINTS.REVIEWS.UPDATE(id), {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteReview(id) {
        return this.request(CONFIG.ENDPOINTS.REVIEWS.DELETE(id), { method: 'DELETE' });
    },

    async getDoctorReviews(doctorId) {
        return this.request(CONFIG.ENDPOINTS.REVIEWS.DOCTOR_REVIEWS(doctorId), { method: 'GET' });
    },
};

export default api;
