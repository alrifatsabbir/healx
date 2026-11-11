import api from './api.js';
import { CONFIG } from './config.js';

/**
 * Initializes and syncs authentication state across all HealiiX frontend pages.
 * Updates header navigation to show user profile & logout when signed in.
 */
export function initAuthNav() {
    const user = api.getCurrentUser();
    const navActionsContainers = document.querySelectorAll('.nav-actions');

    if (!navActionsContainers || navActionsContainers.length === 0) return;

    navActionsContainers.forEach((container) => {
        if (!user) {
            // Unauthenticated state
            container.innerHTML = `
                <a href="login.html" class="sign-in-btn bg-transparent border-0 text-[#b9d1cc] font-semibold text-sm hover:text-white transition-colors px-3 py-2 cursor-pointer">Sign in</a>
                <a href="sign-up.html" class="button button-small button-light inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs bg-[#0e927f] text-white hover:bg-[#087866] hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer border-0">Join HealiiX <span aria-hidden="true">↗</span></a>
            `;
            return;
        }

        // Authenticated state
        const profileUrl = user.role === 'doctor' 
            ? CONFIG.PROFILE_URLS.DOCTOR(user.username) 
            : CONFIG.PROFILE_URLS.PATIENT(user.username);

        const roleBadge = user.role === 'doctor' 
            ? '<span class="bg-[#0e927f] text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ml-1.5">Doctor</span>'
            : (user.role === 'admin' ? '<span class="bg-amber-500 text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ml-1.5">Admin</span>' : '');

        const avatarMarkup = user.avatar
            ? `<img src="${user.avatar}" alt="${user.fullName}" class="w-8 h-8 rounded-full object-cover border border-[#0e927f]">`
            : `<div class="w-8 h-8 rounded-full bg-[#16504a] text-[#8ce2d4] font-bold text-xs flex items-center justify-center border border-white/20">${(user.fullName || user.username || 'U').charAt(0).toUpperCase()}</div>`;

        container.innerHTML = `
            <a href="${profileUrl}" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all">
                ${avatarMarkup}
                <span class="max-w-[120px] truncate">${user.fullName || user.username}</span>
                ${roleBadge}
            </a>
            <button type="button" id="header-logout-btn" class="text-xs text-[#b9d1cc] hover:text-white transition-colors cursor-pointer px-2 py-1">
                Logout
            </button>
        `;

        const logoutBtn = container.querySelector('#header-logout-btn');
        logoutBtn?.addEventListener('click', () => {
            api.logout();
        });
    });
}

// Auto-run on DOMContentLoaded
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthNav);
    } else {
        initAuthNav();
    }
}

export default { initAuthNav };

