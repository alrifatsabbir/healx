import api from './api.js';
import { CONFIG, getAppPath } from './config.js';

export { getAppPath };

const ICONS = {
    overview: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`,
    patients: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    doctors: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
    verify: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
    calendar: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
    email: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
    bell: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
    chambers: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
    settings: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    search: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
    star: `<svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`,
};

const NAV_BY_ROLE = {
    admin: [
        { href: 'admin-dashboard.html', label: 'Admin Dashboard', icon: ICONS.overview },
        { href: 'admin-patients.html', label: 'Patient Directory', icon: ICONS.patients },
        { href: 'admin-doctors.html', label: 'Doctor Directory', icon: ICONS.doctors },
        { href: 'admin-verifications.html', label: 'Doctor Verification', icon: ICONS.verify },
        { href: 'admin-appointments.html', label: 'All Appointments', icon: ICONS.calendar },
        { href: 'admin-emails.html', label: 'Emails & Inquiries', icon: ICONS.email },
        { href: 'admin-notifications.html', label: 'Notifications', icon: ICONS.bell },
        { href: 'admin-settings.html', label: 'Settings & Security', icon: ICONS.settings },
    ],
    doctor: [
        { href: 'doctor-dashboard.html', label: 'Overview', icon: ICONS.overview },
        { href: 'doctor-appointments.html', label: 'Appointments', icon: ICONS.calendar },
        { href: 'doctor-chambers.html', label: 'Chambers & Fees', icon: ICONS.chambers },
        { href: 'doctor-notifications.html', label: 'Notifications', icon: ICONS.bell },
        { href: 'doctor-settings.html', label: 'Profile Settings', icon: ICONS.settings },
    ],
    patient: [
        { href: 'patient-dashboard.html', label: 'Overview', icon: ICONS.overview },
        { href: 'patient-appointments.html', label: 'My Appointments', icon: ICONS.calendar },
        { href: 'patient-reviews.html', label: 'My Reviews', icon: ICONS.star },
        { href: 'patient-notifications.html', label: 'Notifications', icon: ICONS.bell },
        { href: 'patient-settings.html', label: 'Health Profile & Settings', icon: ICONS.settings },
        { href: 'find-doctors.html', label: 'Find Doctors', icon: ICONS.search },
    ],
};

function ensureLightboxModal() {
    if (document.getElementById('healiix-lightbox-modal')) return;
    const div = document.createElement('div');
    div.id = 'healiix-lightbox-modal';
    div.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-black/80 p-4 backdrop-blur-xs';
    div.innerHTML = `
        <div class="relative max-w-4xl w-full bg-[#0c1d1b] rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col max-h-[92vh]">
            <div class="px-5 py-3.5 bg-[#082c2a] border-b border-white/10 flex items-center justify-between text-white">
                <div>
                    <h4 id="lb-title" class="text-sm font-bold text-white">Document Preview</h4>
                    <p class="text-[11px] text-[#98bcb4]">Protected internal document viewer</p>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" id="lb-zoom-out" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer">-</button>
                    <button type="button" id="lb-zoom-reset" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer">100%</button>
                    <button type="button" id="lb-zoom-in" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer">+</button>
                    <button type="button" id="lb-close" class="ml-2 w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/40 flex items-center justify-center cursor-pointer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-auto p-6 flex items-center justify-center bg-[#091816]" oncontextmenu="return false;">
                <img id="lb-img" src="" alt="Protected preview" class="max-h-[75vh] w-auto object-contain rounded-xl transition-transform duration-150 select-none" draggable="false">
            </div>
        </div>
    `;
    document.body.appendChild(div);

    let zoom = 1;
    const imgEl = div.querySelector('#lb-img');
    const close = () => {
        div.classList.add('hidden');
        div.classList.remove('flex');
        zoom = 1;
        imgEl.style.transform = 'scale(1)';
    };
    div.querySelector('#lb-close').addEventListener('click', close);
    div.addEventListener('click', (e) => { if (e.target === div) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !div.classList.contains('hidden')) close(); });
    div.querySelector('#lb-zoom-in').addEventListener('click', () => { zoom = Math.min(2.5, zoom + 0.25); imgEl.style.transform = `scale(${zoom})`; });
    div.querySelector('#lb-zoom-out').addEventListener('click', () => { zoom = Math.max(0.5, zoom - 0.25); imgEl.style.transform = `scale(${zoom})`; });
    div.querySelector('#lb-zoom-reset').addEventListener('click', () => { zoom = 1; imgEl.style.transform = 'scale(1)'; });

    window.openImageLightbox = function(url, title = 'Protected Document Preview') {
        if (!url) return;
        div.querySelector('#lb-title').textContent = title;
        imgEl.src = url;
        zoom = 1;
        imgEl.style.transform = 'scale(1)';
        div.classList.remove('hidden');
        div.classList.add('flex');
    };
}

function ensureCustomDialogModals() {
    if (document.getElementById('healiix-confirm-modal')) return;

    // Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.id = 'healiix-toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-[150] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4';
    document.body.appendChild(toastContainer);

    window.healiixToast = function(msg, isError = false) {
        const t = document.createElement('div');
        t.className = `pointer-events-auto p-4 rounded-2xl shadow-xl border text-xs font-semibold flex items-center justify-between gap-3 transition-all duration-300 transform translate-y-3 opacity-0 ${
            isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-[#082c2a] text-white border-[#125851]'
        }`;
        t.innerHTML = `
            <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-full ${isError ? 'bg-red-200 text-red-700' : 'bg-[#0e927f] text-white'} flex items-center justify-center text-xs font-black flex-shrink-0">
                    ${isError ? '!' : '✓'}
                </span>
                <span>${msg}</span>
            </div>
            <button class="text-white/60 hover:text-white text-xs cursor-pointer ml-auto">✕</button>
        `;
        t.querySelector('button').onclick = () => t.remove();
        toastContainer.appendChild(t);
        requestAnimationFrame(() => {
            t.classList.remove('translate-y-3', 'opacity-0');
        });
        setTimeout(() => {
            t.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => t.remove(), 300);
        }, 4500);
    };

    // Confirm Modal
    const confirmModal = document.createElement('div');
    confirmModal.id = 'healiix-confirm-modal';
    confirmModal.className = 'fixed inset-0 z-[120] hidden items-center justify-center bg-black/60 backdrop-blur-xs p-4';
    confirmModal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-[#e1eae6] shadow-2xl space-y-5">
            <div class="flex items-start gap-4">
                <div id="hcm-icon" class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"></div>
                <div>
                    <h3 id="hcm-title" class="font-extrabold text-base text-[#082c2a]"></h3>
                    <p id="hcm-msg" class="text-xs text-[#556e68] mt-1 leading-relaxed"></p>
                </div>
            </div>
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#edf3f0]">
                <button type="button" id="hcm-cancel" class="px-4 py-2 rounded-xl border border-[#d7dfdb] text-xs font-bold text-[#556e68] hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="button" id="hcm-confirm" class="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow cursor-pointer"></button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmModal);

    window.healiixConfirm = function({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'success' }) {
        return new Promise((resolve) => {
            const titleEl = confirmModal.querySelector('#hcm-title');
            const msgEl = confirmModal.querySelector('#hcm-msg');
            const iconEl = confirmModal.querySelector('#hcm-icon');
            const confBtn = confirmModal.querySelector('#hcm-confirm');
            const cancBtn = confirmModal.querySelector('#hcm-cancel');

            titleEl.textContent = title;
            msgEl.textContent = message;
            confBtn.textContent = confirmText;
            cancBtn.textContent = cancelText;

            if (type === 'danger') {
                iconEl.className = 'w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 bg-red-100 text-red-600';
                iconEl.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
                confBtn.className = 'px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition-colors cursor-pointer';
            } else if (type === 'warning') {
                iconEl.className = 'w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 bg-amber-100 text-amber-600';
                iconEl.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
                confBtn.className = 'px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-colors cursor-pointer';
            } else {
                iconEl.className = 'w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 bg-[#eef8f5] text-[#0e927f]';
                iconEl.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
                confBtn.className = 'px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0e927f] hover:bg-[#087866] shadow-md transition-colors cursor-pointer';
            }

            const cleanup = () => {
                confirmModal.classList.add('hidden');
                confirmModal.classList.remove('flex');
                confBtn.onclick = null;
                cancBtn.onclick = null;
            };

            confBtn.onclick = () => { cleanup(); resolve(true); };
            cancBtn.onclick = () => { cleanup(); resolve(false); };

            confirmModal.classList.remove('hidden');
            confirmModal.classList.add('flex');
        });
    };

    // Prompt Modal
    const promptModal = document.createElement('div');
    promptModal.id = 'healiix-prompt-modal';
    promptModal.className = 'fixed inset-0 z-[120] hidden items-center justify-center bg-black/60 backdrop-blur-xs p-4';
    promptModal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#e1eae6] shadow-2xl space-y-4">
            <div>
                <h3 id="hpm-title" class="font-extrabold text-base text-[#082c2a]"></h3>
                <p id="hpm-msg" class="text-xs text-[#556e68] mt-0.5 leading-relaxed"></p>
            </div>
            <div>
                <label id="hpm-label" class="block text-xs font-bold text-[#082c2a] mb-1.5"></label>
                <textarea id="hpm-input" rows="3" class="w-full px-3.5 py-2.5 rounded-xl border border-[#d7dfdb] bg-[#f8fbf9] text-xs text-[#082c2a] focus:bg-white focus:border-[#0e927f] outline-none"></textarea>
            </div>
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#edf3f0]">
                <button type="button" id="hpm-cancel" class="px-4 py-2 rounded-xl border border-[#d7dfdb] text-xs font-bold text-[#556e68] hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="button" id="hpm-confirm" class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow cursor-pointer"></button>
            </div>
        </div>
    `;
    document.body.appendChild(promptModal);

    window.healiixPrompt = function({ title, message, label = 'Reason / Note', placeholder = '', defaultValue = '', confirmText = 'Submit' }) {
        return new Promise((resolve) => {
            promptModal.querySelector('#hpm-title').textContent = title;
            promptModal.querySelector('#hpm-msg').textContent = message;
            promptModal.querySelector('#hpm-label').textContent = label;
            const input = promptModal.querySelector('#hpm-input');
            input.placeholder = placeholder;
            input.value = defaultValue;
            const confBtn = promptModal.querySelector('#hpm-confirm');
            const cancBtn = promptModal.querySelector('#hpm-cancel');
            confBtn.textContent = confirmText;

            const cleanup = () => {
                promptModal.classList.add('hidden');
                promptModal.classList.remove('flex');
                confBtn.onclick = null;
                cancBtn.onclick = null;
            };

            confBtn.onclick = () => {
                const val = input.value.trim();
                cleanup();
                resolve(val || defaultValue);
            };
            cancBtn.onclick = () => {
                cleanup();
                resolve(null);
            };

            promptModal.classList.remove('hidden');
            promptModal.classList.add('flex');
            setTimeout(() => input.focus(), 50);
        });
    };
}

function applySidebarCollapsed(collapsed) {
    const sidebarEl = document.getElementById('dashboard-sidebar');
    if (!sidebarEl) return;

    const collapseIcon = document.getElementById('collapse-icon');
    const collapseBtn = sidebarEl.querySelector('#shell-desktop-collapse');
    const collapseLabel = sidebarEl.querySelector('.shell-collapse-label');
    const logoFull = sidebarEl.querySelector('.shell-logo-full');
    const logoCompact = sidebarEl.querySelector('.shell-logo-compact');
    const consoleBadge = sidebarEl.querySelector('.shell-console-badge');
    const expandables = sidebarEl.querySelectorAll('.shell-expandable');
    const navLinks = sidebarEl.querySelectorAll('.shell-nav-link');
    const topBar = sidebarEl.querySelector('#shell-top-bar');
    const userMenu = sidebarEl.querySelector('#shell-user-menu');

    if (collapsed) {
        sidebarEl.classList.remove('w-64');
        sidebarEl.classList.add('w-[76px]');
        if (collapseIcon) collapseIcon.classList.add('rotate-180');
        if (collapseBtn) {
            collapseBtn.classList.remove('px-3');
            collapseBtn.classList.add('px-2', 'justify-center');
            collapseBtn.setAttribute('title', 'Expand sidebar');
        }
        if (collapseLabel) collapseLabel.classList.add('hidden');
        if (logoFull) logoFull.classList.add('hidden');
        if (logoCompact) logoCompact.classList.remove('hidden');
        if (consoleBadge) consoleBadge.classList.add('hidden');
        if (topBar) {
            topBar.classList.remove('px-5', 'py-4', 'justify-between');
            topBar.classList.add('p-3', 'flex-col', 'gap-2.5', 'items-center', 'justify-center');
        }
        if (userMenu) {
            userMenu.classList.remove('left-2', 'right-2', 'bottom-full', 'mb-2');
            userMenu.classList.add('left-[82px]', 'bottom-2', 'w-64');
        }
        expandables.forEach((el) => el.classList.add('hidden'));
        navLinks.forEach((link) => {
            link.classList.remove('gap-3', 'px-3.5', 'py-2.5');
            link.classList.add('justify-center', 'px-2', 'py-3');
            const labelSpan = link.querySelector('.shell-nav-label');
            if (labelSpan) labelSpan.classList.add('hidden');
        });
    } else {
        sidebarEl.classList.remove('w-[76px]');
        sidebarEl.classList.add('w-64');
        if (collapseIcon) collapseIcon.classList.remove('rotate-180');
        if (collapseBtn) {
            collapseBtn.classList.add('px-3');
            collapseBtn.classList.remove('px-2', 'justify-center');
            collapseBtn.setAttribute('title', 'Collapse sidebar');
        }
        if (collapseLabel) collapseLabel.classList.remove('hidden');
        if (logoFull) logoFull.classList.remove('hidden');
        if (logoCompact) logoCompact.classList.add('hidden');
        if (consoleBadge) consoleBadge.classList.remove('hidden');
        if (topBar) {
            topBar.classList.add('px-5', 'py-4', 'justify-between');
            topBar.classList.remove('p-3', 'flex-col', 'gap-2.5', 'items-center', 'justify-center');
        }
        if (userMenu) {
            userMenu.classList.add('left-2', 'right-2', 'bottom-full', 'mb-2');
            userMenu.classList.remove('left-[82px]', 'bottom-2', 'w-64');
        }
        expandables.forEach((el) => el.classList.remove('hidden'));
        navLinks.forEach((link) => {
            link.classList.add('gap-3', 'px-3.5', 'py-2.5');
            link.classList.remove('justify-center', 'px-2', 'py-3');
            const labelSpan = link.querySelector('.shell-nav-label');
            if (labelSpan) labelSpan.classList.remove('hidden');
        });
    }
}

function renderShell(user, expectedRole, activeHref, pageHeading, pageSubheading) {
    const sidebarEl = document.getElementById('dashboard-sidebar');
    const headerEl = document.getElementById('dashboard-header');

    let backdrop = document.getElementById('shell-mobile-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'shell-mobile-backdrop';
        backdrop.className = 'fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 hidden md:hidden';
        document.body.appendChild(backdrop);
    }

    const closeMobileSidebar = () => {
        if (sidebarEl) {
            sidebarEl.classList.add('-translate-x-full');
        }
        backdrop.classList.add('hidden');
    };

    const openMobileSidebar = () => {
        if (sidebarEl) {
            sidebarEl.classList.remove('-translate-x-full');
        }
        backdrop.classList.remove('hidden');
    };

    backdrop.onclick = closeMobileSidebar;
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileSidebar();
    });

    const navItems = NAV_BY_ROLE[expectedRole] || [];
    const avatarHtml = user.avatar
        ? `<img src="${user.avatar}" alt="${user.fullName}" class="w-9 h-9 rounded-full object-cover border-2 border-[#0e927f] flex-shrink-0">`
        : `<div class="w-9 h-9 rounded-full bg-[#16504a] text-[#8ce2d4] flex items-center justify-center font-bold text-sm border border-[#0e927f]/40 flex-shrink-0">${(user.fullName || 'U').charAt(0).toUpperCase()}</div>`;

    const profileHref = expectedRole === 'admin'
        ? getAppPath('admin-profile.html')
        : (expectedRole === 'doctor' ? CONFIG.PROFILE_PAGES.DOCTOR(user.username) : CONFIG.PROFILE_PAGES.PATIENT(user.username));

    const settingsHref = getAppPath(
        expectedRole === 'admin' ? 'admin-settings.html' : (expectedRole === 'doctor' ? 'doctor-settings.html' : 'patient-settings.html')
    );

    const profileBtnLabel = expectedRole === 'admin'
        ? 'Admin Profile ↗'
        : (expectedRole === 'doctor' ? 'Public Profile ↗' : 'My Profile ↗');

    if (sidebarEl) {
        sidebarEl.className = 'fixed md:sticky md:top-0 inset-y-0 left-0 z-50 w-64 h-screen bg-[#082c2a] text-[#e6f3ef] flex flex-col justify-between transform -translate-x-full md:translate-x-0 transition-[width,transform] duration-300 ease-in-out flex-shrink-0 shadow-2xl md:shadow-none overflow-visible';
        sidebarEl.innerHTML = `
            <div class="flex-1 flex flex-col min-h-0">
                <div id="shell-top-bar" class="px-5 py-4 border-b border-white/10 flex items-center justify-between transition-colors flex-shrink-0">
                    <a href="${getAppPath('index.html')}" class="flex items-center gap-2" title="HealiiX Home">
                        <img src="${getAppPath('assets/images/healx-logo-bg-white.png')}" alt="HealiiX" class="h-10 w-auto object-contain shell-logo-full">
                        <img src="${getAppPath('assets/images/icon.png')}" alt="HealiiX" class="h-10 w-10 object-contain hidden shell-logo-compact">
                    </a>

                    <button type="button" id="shell-mobile-close" class="md:hidden p-1.5 rounded-lg bg-[#edf5f1] hover:bg-[#dfeee7] text-[#082c2a] cursor-pointer" aria-label="Close menu">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <div class="shell-console-badge px-5 py-3 border-b border-white/5 bg-black/15 flex items-center justify-between text-[11px] text-[#8cb3aa] flex-shrink-0">
                    <span class="font-extrabold uppercase tracking-wider text-[#0e927f]">${expectedRole.toUpperCase()} CONSOLE</span>
                    <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>Online</span>
                </div>

                <nav class="flex-1 overflow-y-auto p-3 space-y-1.5 text-sm font-semibold">
                    ${navItems.map((item) => {
                        const isMatch = item.href === activeHref || window.location.pathname.endsWith(item.href);
                        const targetUrl = getAppPath(item.href);
                        const cls = isMatch
                            ? 'bg-[#0e927f] text-white shadow-sm border-l-4 border-emerald-300 font-bold'
                            : 'text-[#b6d1cb] hover:bg-white/10 hover:text-white border-l-4 border-transparent';
                        return `
                            <a href="${targetUrl}" class="shell-nav-link w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${cls}" title="${item.label}">
                                ${item.icon}
                                <span class="shell-nav-label truncate">${item.label}</span>
                            </a>
                        `;
                    }).join('')}
                </nav>
            </div>

            <div class="flex-shrink-0 relative overflow-visible">
                <!-- Collapsable toggle button right above profile -->
                <div class="px-3 py-1.5 border-t border-white/10 hidden md:block">
                    <button type="button" id="shell-desktop-collapse" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#a3c7be] hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="Collapse sidebar">
                        <svg id="collapse-icon" class="w-4 h-4 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
                        </svg>
                        <span class="shell-collapse-label truncate">Collapse Sidebar</span>
                    </button>
                </div>

                <!-- Profile Trigger Area with Popup Menu on Click -->
                <div class="relative p-3 border-t border-white/10 bg-[#062422] overflow-visible">
                    <button type="button" id="shell-user-trigger" class="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-left border-0 bg-transparent" aria-haspopup="true" aria-expanded="false" title="${user.fullName || 'User Profile'}">
                        ${avatarHtml}
                        <div class="min-w-0 flex-1 shell-expandable">
                            <p class="text-xs font-bold text-white truncate">${user.fullName || 'User'}</p>
                            <p class="text-[11px] text-[#8cb3aa] truncate font-mono">@${user.username || 'user'}</p>
                        </div>
                        <svg class="w-4 h-4 text-[#8cb3aa] transition-transform duration-200 shell-expandable" id="shell-user-chevron" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/>
                        </svg>
                    </button>

                    <!-- Popover Menu showing Profile Button and Logout Button (Unclipped) -->
                    <div id="shell-user-menu" class="hidden absolute left-2 right-2 bottom-full mb-2 bg-[#ffffff] border border-[#d2ded8] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-2.5 z-[100] min-w-[210px]">
                        <div class="px-3 py-2 border-b border-[#edf3f0] mb-1">
                            <p class="text-xs font-bold text-[#082c2a] truncate">${user.fullName || 'User'}</p>
                            <p class="text-[11px] text-[#556e68] truncate font-mono">@${user.username || 'user'}</p>
                            <span class="inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#0e927f]/15 text-[#0e927f] border border-[#0e927f]/30">${expectedRole}</span>
                        </div>

                        <!-- 1. Profile Button -->
                        <a href="${profileHref}" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#082c2a] hover:bg-[#edf7f4] hover:text-[#0e927f] transition-colors">
                            <svg class="w-4 h-4 text-[#0e927f]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                            <span>${expectedRole === 'admin' ? 'Admin Profile' : 'View Profile'}</span>
                            <span class="ml-auto text-[10px] text-[#8cb3aa]">&rarr;</span>
                        </a>

                        <!-- 2. Settings Button -->
                        <a href="${settingsHref}" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#3d5953] hover:bg-[#edf7f4] hover:text-[#0e927f] transition-colors">
                            ${ICONS.settings}
                            <span>Settings</span>
                        </a>

                        <div class="my-1 border-t border-[#edf3f0]"></div>

                        <!-- 3. Logout Button -->
                        <button type="button" id="shell-logout-btn" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-0 bg-transparent text-left">
                            <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            <span class="text-red-600 font-bold">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Mobile sidebar event handlers
        sidebarEl.querySelector('#shell-mobile-close')?.addEventListener('click', closeMobileSidebar);
        sidebarEl.querySelectorAll('nav a').forEach((a) => {
            a.addEventListener('click', closeMobileSidebar);
        });

        // Desktop collapse toggle
        sidebarEl.querySelector('#shell-desktop-collapse')?.addEventListener('click', () => {
            const isNow = localStorage.getItem('healiix_sidebar_collapsed') === 'true';
            const next = !isNow;
            localStorage.setItem('healiix_sidebar_collapsed', next ? 'true' : 'false');
            applySidebarCollapsed(next);
        });

        const userTrigger = sidebarEl.querySelector('#shell-user-trigger');
        const userMenu = sidebarEl.querySelector('#shell-user-menu');
        const userChevron = sidebarEl.querySelector('#shell-user-chevron');

        userTrigger?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = userMenu.classList.contains('hidden');
            userMenu.classList.toggle('hidden', !isHidden);
            userTrigger.setAttribute('aria-expanded', String(isHidden));
            if (userChevron) userChevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        });

        document.addEventListener('click', (e) => {
            if (!userMenu?.classList.contains('hidden') && !userMenu?.contains(e.target) && !userTrigger?.contains(e.target)) {
                userMenu.classList.add('hidden');
                userTrigger?.setAttribute('aria-expanded', 'false');
                if (userChevron) userChevron.style.transform = 'rotate(0deg)';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                userMenu?.classList.add('hidden');
                userTrigger?.setAttribute('aria-expanded', 'false');
                if (userChevron) userChevron.style.transform = 'rotate(0deg)';
            }
        });

        // Logout action
        sidebarEl.querySelector('#shell-logout-btn')?.addEventListener('click', () => {
            api.setToken(null);
            api.setCurrentUser(null);
            window.location.href = getAppPath(expectedRole === 'admin' ? 'admin-login.html' : 'login.html');
        });

        // Restore initial collapsed state
        const savedCollapsed = localStorage.getItem('healiix_sidebar_collapsed') === 'true';
        applySidebarCollapsed(savedCollapsed);
    }

    if (headerEl) {
        headerEl.className = 'bg-white border-b border-[#e1eae6] px-5 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs';
        headerEl.innerHTML = `
            <div class="flex items-center gap-3">
                <button type="button" id="shell-mobile-menu" class="md:hidden p-2 rounded-xl bg-[#edf5f1] text-[#082c2a] hover:bg-[#dfeee7] cursor-pointer" aria-label="Toggle navigation">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
                <div>
                    <h1 class="font-extrabold text-base sm:text-lg text-[#082c2a]">${pageHeading}</h1>
                    <p class="text-xs text-[#6c8680] hidden sm:block">${pageSubheading}</p>
                </div>
            </div>
            <div class="flex items-center gap-2.5 sm:gap-3.5">
                <a href="${profileHref}" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0e927f] bg-[#edf7f4] px-3.5 py-1.5 rounded-full border border-[#cde8de] hover:bg-[#daf1e8] transition-all">
                    ${profileBtnLabel}
                </a>
                <a href="${getAppPath('index.html')}" class="text-xs font-semibold text-[#556e68] hover:text-[#082c2a] px-2 py-1">Home</a>
            </div>
        `;

        headerEl.querySelector('#shell-mobile-menu')?.addEventListener('click', () => {
            if (sidebarEl?.classList.contains('-translate-x-full')) {
                openMobileSidebar();
            } else {
                closeMobileSidebar();
            }
        });
    }
}

export async function initDashboardShell(expectedRole, activeHref, pageHeading, pageSubheading) {
    ensureLightboxModal();
    ensureCustomDialogModals();

    // 1. Instant zero-latency render using cached profile if available
    const cached = api.getCurrentUser();
    if (cached && cached.role === expectedRole) {
        renderShell(cached, expectedRole, activeHref, pageHeading, pageSubheading);
    }

    // 2. Validate session against backend
    let meRes;
    try {
        meRes = await api.getProfile();
    } catch (_) {
        api.setToken(null);
        api.setCurrentUser(null);
        window.location.href = getAppPath(expectedRole === 'admin' ? 'admin-login.html' : 'login.html');
        return null;
    }

    const user = meRes.user;
    if (user.role !== expectedRole) {
        if (expectedRole === 'admin') {
            window.location.href = getAppPath('admin-login.html');
            return null;
        }
        if (user.role === 'admin') window.location.href = getAppPath('admin-dashboard.html');
        else if (user.role === 'doctor') window.location.href = getAppPath('doctor-dashboard.html');
        else window.location.href = getAppPath('patient-dashboard.html');
        return null;
    }

    api.setCurrentUser(user);
    renderShell(user, expectedRole, activeHref, pageHeading, pageSubheading);

    return user;
}

export async function renderActiveNotifications(containerEl) {
    if (!containerEl) return;
    try {
        const res = await api.getMyNotifications();
        const items = res.notifications || [];
        if (items.length === 0) {
            containerEl.innerHTML = '';
            return;
        }
        containerEl.innerHTML = items.map((n) => `
            <div class="rounded-2xl p-4 border border-[#cce6dc] bg-[#f4faf7] flex items-start justify-between gap-4">
                <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#daf1e8] text-[#0e927f] flex items-center justify-center flex-shrink-0 mt-0.5">${ICONS.bell}</div>
                    <div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <h4 class="font-bold text-sm text-[#082c2a]">${n.title}</h4>
                            <span class="text-[11px] font-semibold text-[#6c8680]">Expires ${new Date(n.expiresAt).toLocaleDateString()}</span>
                        </div>
                        <p class="text-xs text-[#49635d] mt-1 leading-relaxed">${n.message}</p>
                    </div>
                </div>
                <button type="button" data-dismiss-id="${n._id}" title="Delete notification" class="dismiss-notif-btn p-1.5 rounded-lg text-[#6c8680] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        `).join('');

        containerEl.querySelectorAll('.dismiss-notif-btn').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.dismissId;
                await api.dismissNotification(id);
                btn.closest('.rounded-2xl')?.remove();
            });
        });
    } catch (_) {}
}
