import api from './api.js';
import { CONFIG, getAppPath } from './config.js';
import './ai-bot-widget.js';

function getDashboardUrls(user) {
    if (!user) return { dashboard: getAppPath('login.html'), profile: getAppPath('login.html') };
    if (user.role === 'admin') {
        return { dashboard: getAppPath('admin-dashboard.html'), profile: CONFIG.PROFILE_PAGES.ADMIN() };
    }
    if (user.role === 'doctor') {
        return { dashboard: getAppPath('doctor-dashboard.html'), profile: CONFIG.PROFILE_PAGES.DOCTOR(user.username) };
    }
    return { dashboard: getAppPath('patient-dashboard.html'), profile: CONFIG.PROFILE_PAGES.PATIENT(user.username) };
}

function syncPrimaryNav(user) {
    const primaryNav = document.getElementById('primary-nav');
    if (!primaryNav) return;
    // Remove any previously injected tags
    primaryNav.querySelectorAll('.healiix-injected-nav').forEach((el) => el.remove());
}

function renderDesktopActions(container, user) {
    if (!user) {
        container.innerHTML = `
            <a href="login.html" class="text-xs sm:text-[13px] font-semibold text-white/80 hover:text-white transition-colors whitespace-nowrap">Sign In</a>
            <a id="nav-join-btn" href="sign-up.html" class="flex items-center gap-1.5 px-4 py-2 bg-[#0E927F] hover:bg-[#0b7c6c] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] whitespace-nowrap">
                <svg class="hidden sm:inline-block w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>Join Healiix</span>
            </a>
        `;
        return;
    }

    const { dashboard, profile } = getDashboardUrls(user);
    const displayName = user.fullName || user.username || 'User';
    const initial = displayName.charAt(0).toUpperCase();

    const avatarMarkup = user.avatar
        ? `<img src="${user.avatar}" alt="${displayName}" class="w-8 h-8 rounded-full object-cover border border-[#0e927f]">`
        : `<div class="w-8 h-8 rounded-full bg-[#0e927f] text-white font-extrabold text-xs flex items-center justify-center">${initial}</div>`;

    container.innerHTML = `
        <a href="${dashboard}" class="flex items-center gap-1.5 px-3.5 py-2 bg-[#0e927f] hover:bg-[#087866] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-[0.98] whitespace-nowrap">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
        </a>

        <div class="relative healiix-user-menu-root">
            <button type="button" class="healiix-user-trigger flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer" aria-expanded="false" aria-haspopup="true">
                ${avatarMarkup}
                <svg class="healiix-chevron w-3.5 h-3.5 text-[#b9d1cc] transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>

            <div class="healiix-user-dropdown hidden absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-[#dce8e3] shadow-2xl overflow-hidden z-[999]">
                <div class="px-4 py-3 bg-[#f7fbf9] border-b border-[#e8f0ed]">
                    <p class="text-xs font-extrabold text-[#082c2a] truncate leading-tight">${displayName}</p>
                    <p class="text-[11px] font-mono text-[#64817a] truncate mt-0.5">@${user.username || 'user'}</p>
                </div>
                <div class="p-1.5">
                    <a href="${profile}" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#123b39] hover:bg-[#edf7f4] hover:text-[#087866] transition-colors">
                        <svg class="w-4 h-4 text-[#0e927f]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span>Profile</span>
                    </a>
                    <a href="${dashboard}" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#123b39] hover:bg-[#edf7f4] hover:text-[#087866] transition-colors">
                        <svg class="w-4 h-4 text-[#0e927f]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>${user.role === 'admin' ? 'Admin Dashboard' : (user.role === 'doctor' ? 'Doctor Dashboard' : 'Dashboard')}</span>
                    </a>
                    <div class="my-1 border-t border-[#edf3f0]"></div>
                    <button type="button" class="healiix-logout-btn w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#c53030] hover:bg-[#fff5f5] transition-colors cursor-pointer text-left border-0 bg-transparent">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    const trigger = container.querySelector('.healiix-user-trigger');
    const dropdown = container.querySelector('.healiix-user-dropdown');
    const chevron = container.querySelector('.healiix-chevron');
    const logoutBtn = container.querySelector('.healiix-logout-btn');

    trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !dropdown.classList.contains('hidden');
        dropdown.classList.toggle('hidden', isOpen);
        trigger.setAttribute('aria-expanded', String(!isOpen));
        if (chevron) chevron.style.transform = !isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    logoutBtn?.addEventListener('click', () => {
        api.logout();
    });
}

function renderMobileActions(user) {
    document.querySelectorAll('.mobile-signin-btn').forEach((btn) => {
        if (!user) {
            btn.href = 'login.html';
            btn.textContent = 'Sign In';
        } else {
            const { dashboard } = getDashboardUrls(user);
            btn.href = dashboard;
            btn.textContent = 'Dashboard';
        }
    });

    const authSection = document.getElementById('mobile-auth-section');
    if (!authSection) return;

    if (!user) {
        authSection.className = 'border-t border-white/10 pt-3 flex items-center justify-between w-full';
        authSection.innerHTML = `
            <a href="login.html" class="text-xs font-bold text-white hover:underline">Sign In &rarr;</a>
            <a href="sign-up.html" class="px-3.5 py-1.5 bg-[#0E927F] hover:bg-[#0b7c6c] text-white text-xs font-bold rounded-full transition-all">Join Healiix</a>
        `;
        return;
    }

    const { dashboard, profile } = getDashboardUrls(user);
    const initial = (user.fullName || user.username || 'U').charAt(0).toUpperCase();
    const userAvatar = user.avatar || user.photoUrl || user.image;
    const roleLabel = user.role === 'admin' ? 'Admin' : (user.role === 'doctor' ? 'Doctor' : 'Patient');
    const dashboardLabel = user.role === 'admin' ? 'Admin Panel' : (user.role === 'doctor' ? 'Doctor Dashboard' : 'Dashboard');

    const avatarHtml = userAvatar
        ? `
            <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-xs border border-[#0E927F] relative">
                <img src="${userAvatar}" alt="${user.fullName || user.username}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="hidden w-full h-full bg-[#0E927F] text-white items-center justify-center font-bold text-xs">${initial}</div>
            </div>
        `
        : `
            <div class="w-8 h-8 rounded-full bg-[#0E927F] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                ${initial}
            </div>
        `;

    authSection.className = 'border-t border-white/10 pt-3 flex flex-col gap-2 w-full';
    authSection.innerHTML = `
        <div class="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 border border-white/10 mb-1">
            <div class="flex items-center gap-2.5 overflow-hidden">
                ${avatarHtml}
                <div class="truncate">
                    <p class="text-[10px] text-[#8cb3aa] leading-none uppercase tracking-wider font-bold mb-0.5">Signed In As</p>
                    <p class="text-xs font-extrabold text-white truncate leading-tight">${user.fullName || user.username}</p>
                </div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30 uppercase flex-shrink-0">
                ${roleLabel}
            </span>
        </div>
        <div class="grid grid-cols-2 gap-2">
            <a href="${profile}" class="py-2 px-3 text-center rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all border border-white/10 flex items-center justify-center gap-1.5">
                <span>👤</span>
                <span>Profile</span>
            </a>
            <a href="${dashboard}" class="py-2 px-3 text-center rounded-xl bg-[#0E927F] hover:bg-[#0b7c6c] text-xs font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1.5">
                <span>⚡</span>
                <span>${dashboardLabel}</span>
            </a>
        </div>
        <button type="button" class="healiix-mobile-logout w-full mt-1 py-2 px-3 text-center rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold transition-all border border-red-500/20 cursor-pointer flex items-center justify-center gap-1.5">
            <span>🚪</span>
            <span>Sign Out</span>
        </button>
    `;

    authSection.querySelector('.healiix-mobile-logout')?.addEventListener('click', () => {
        api.logout();
    });
}

function renderNavbarState(user) {
    syncPrimaryNav(user);
    document.querySelectorAll('.nav-actions').forEach((container) => {
        renderDesktopActions(container, user);
    });
    renderMobileActions(user);
}

// Close dropdown cleanly on outside click or Escape
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.healiix-user-menu-root').forEach((root) => {
            if (!root.contains(e.target)) {
                root.querySelector('.healiix-user-dropdown')?.classList.add('hidden');
                const trigger = root.querySelector('.healiix-user-trigger');
                trigger?.setAttribute('aria-expanded', 'false');
                const chevron = root.querySelector('.healiix-chevron');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.healiix-user-dropdown').forEach((dd) => dd.classList.add('hidden'));
            document.querySelectorAll('.healiix-chevron').forEach((ch) => (ch.style.transform = 'rotate(0deg)'));
        }
    });
}

/**
 * Syncs auth state from localStorage immediately (zero flicker) and validates live token
 * against /api/auth/me so stale/expired sessions or updated avatars never get stuck across pages.
 */
export async function initAuthNav() {
    const token = api.getToken();
    const cachedUser = api.getCurrentUser();

    // Render cached state immediately if token exists
    renderNavbarState(token ? cachedUser : null);

    // If token exists, silently validate & refresh fresh user info from backend
    if (token) {
        try {
            const res = await api.getProfile();
            if (res?.user) {
                api.setCurrentUser(res.user);
                renderNavbarState(res.user);
            }
        } catch (err) {
            // Clear stale/invalid token only on explicit auth failure (401/403)
            if (err.message && /denied|expired|invalid|not found/i.test(err.message)) {
                api.setToken(null);
                api.setCurrentUser(null);
                renderNavbarState(null);
            }
        }
    }
}

// Keep all open tabs synced automatically
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === 'healx_token' || e.key === 'healx_user') {
            const token = api.getToken();
            const user = api.getCurrentUser();
            renderNavbarState(token ? user : null);
        }
    });
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthNav);
    } else {
        initAuthNav();
    }
}

export default { initAuthNav };
