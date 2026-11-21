/**
 * HealiiX Unified Capsule Navbar, Global Page Loader & Scroll Reveal Controller
 * Provides smooth scroll morphing, global branded page loader, and automatic
 * scroll reveal animations across all public pages.
 */
(() => {
    // -------------------------------------------------------------------------
    // 1. GLOBAL BRANDED PAGE LOADER
    // -------------------------------------------------------------------------
    function initGlobalLoader() {
        if (window.__healiixLoaderActive) return;
        window.__healiixLoaderActive = true;

        // Skip loader if inside an iframe or if explicitly disabled
        if (window.self !== window.top) return;

        let loader = document.getElementById('healiix-page-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'healiix-page-loader';
            loader.setAttribute('aria-hidden', 'true');
            loader.innerHTML = `
                <div class="relative flex flex-col items-center justify-center text-center px-6 select-none">
                    <!-- Ambient Glow -->
                    <div class="absolute -inset-10 bg-[#0E927F]/20 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <!-- Icon Box with Heartbeat Pulse -->
                    <div class="relative mb-5 flex items-center justify-center">
                        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#082C2A] to-[#0E927F] p-0.5 shadow-2xl border border-white/20 flex items-center justify-center">
                            <div class="w-full h-full rounded-[14px] bg-[#082C2A] flex items-center justify-center overflow-hidden">
                                <img src="./assets/images/icon.png" alt="HealiiX" class="w-10 h-10 object-contain animate-heartbeat" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                <span class="hidden text-2xl font-bold text-[#92F07F]">HX</span>
                            </div>
                        </div>
                        <div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#92F07F] animate-ping opacity-75"></div>
                        <div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#92F07F] border-2 border-[#082C2A]"></div>
                    </div>

                    <!-- Brand Wordmark -->
                    <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5 flex items-center gap-1">
                        <span>Healii</span><span class="text-[#92F07F]">X</span>
                    </h2>

                    <!-- ECG Pulse Wave Trace Line -->
                    <div class="w-44 sm:w-52 h-7 my-1 flex items-center justify-center opacity-90">
                        <svg class="w-full h-full" viewBox="0 0 160 36" fill="none">
                            <path class="ecg-line" d="M 0 18 L 45 18 L 55 5 L 68 32 L 80 10 L 92 24 L 100 18 L 160 18" stroke="#92F07F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>

                    <!-- Modern Progress Indicator -->
                    <div class="w-40 sm:w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-2.5 mb-2.5 relative">
                        <div class="loader-progress-bar h-full bg-gradient-to-r from-[#0E927F] to-[#92F07F] rounded-full"></div>
                    </div>

                    <p class="text-[10px] font-bold text-[#89AAA1] uppercase tracking-widest">Connecting Care</p>
                </div>
            `;
            if (document.body) {
                document.body.prepend(loader);
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    document.body.prepend(loader);
                });
            }
        }

        const hideLoader = () => {
            const el = document.getElementById('healiix-page-loader');
            if (el && !el.classList.contains('loader-hidden')) {
                el.classList.add('loader-hidden');
                setTimeout(() => {
                    el.remove();
                }, 500);
            }
        };

        // Dismiss smoothly when page finishes loading
        if (document.readyState === 'complete') {
            setTimeout(hideLoader, 350);
        } else {
            window.addEventListener('load', () => setTimeout(hideLoader, 350));
        }

        // Safety fallback: maximum 1000ms delay to never block user on slow network
        setTimeout(hideLoader, 1000);
    }

    // Run loader initialization immediately
    initGlobalLoader();

    // -------------------------------------------------------------------------
    // 2. SCROLL REVEAL OBSERVER
    // -------------------------------------------------------------------------
    function initScrollReveal() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for ancient browsers: reveal all
            document.querySelectorAll('.reveal, .reveal-on-scroll, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
                el.classList.add('is-revealed');
            });
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        // Query all reveal elements and auto-enhance doctor and service cards
        const revealTargets = document.querySelectorAll(
            '.reveal, .reveal-on-scroll, .reveal-left, .reveal-right, .reveal-scale, .doctor-card, .category-card'
        );

        revealTargets.forEach(el => {
            if (!el.classList.contains('reveal') &&
                !el.classList.contains('reveal-on-scroll') &&
                !el.classList.contains('reveal-left') &&
                !el.classList.contains('reveal-right') &&
                !el.classList.contains('reveal-scale')) {
                el.classList.add('reveal-on-scroll');
            }
            observer.observe(el);
        });
    }

    // -------------------------------------------------------------------------
    // 3. UNIFIED CAPSULE NAVBAR CONTROLLER
    // -------------------------------------------------------------------------
    function initNavbar() {
        const siteHeader = document.getElementById('site-header');
        const capsuleNav = document.getElementById('capsule-nav');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenuPanel = document.getElementById('mobile-menu-panel');
        const menuIconOpen = document.getElementById('menu-icon-open');
        const menuIconClose = document.getElementById('menu-icon-close');

        if (!siteHeader || !capsuleNav) return;

        // Prevent attaching multiple times if script is loaded or called twice
        if (window.__healiixNavbarActive) return;
        window.__healiixNavbarActive = true;

        const updateNavbarScroll = () => {
            const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            const isMenuOpen = mobileMenuPanel && !mobileMenuPanel.classList.contains('hidden');
            const isScrolled = scrollY > 20;

            if (isScrolled || isMenuOpen) {
                siteHeader.classList.remove('header-unscrolled');
                siteHeader.classList.add('header-scrolled');
                capsuleNav.classList.remove('nav-unscrolled');
                capsuleNav.classList.add('nav-scrolled');
            } else {
                siteHeader.classList.remove('header-scrolled');
                siteHeader.classList.add('header-unscrolled');
                capsuleNav.classList.remove('nav-scrolled');
                capsuleNav.classList.add('nav-unscrolled');
            }
        };

        // Attach scroll and resize listeners
        window.addEventListener('scroll', updateNavbarScroll, { passive: true });
        window.addEventListener('resize', updateNavbarScroll, { passive: true });
        
        // Immediate initial check
        updateNavbarScroll();

        // Mobile Menu Drawer Handler
        if (mobileMenuToggle && mobileMenuPanel) {
            mobileMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const willOpen = mobileMenuPanel.classList.contains('hidden');
                mobileMenuPanel.classList.toggle('hidden', !willOpen);
                if (menuIconOpen && menuIconClose) {
                    menuIconOpen.classList.toggle('hidden', willOpen);
                    menuIconClose.classList.toggle('hidden', !willOpen);
                }
                updateNavbarScroll();
            });

            // Close when clicking outside of the mobile menu
            document.addEventListener('click', (e) => {
                if (!mobileMenuPanel.classList.contains('hidden') &&
                    !mobileMenuPanel.contains(e.target) &&
                    !mobileMenuToggle.contains(e.target)) {
                    mobileMenuPanel.classList.add('hidden');
                    menuIconOpen?.classList.remove('hidden');
                    menuIconClose?.classList.add('hidden');
                    updateNavbarScroll();
                }
            });

            // Close when any link inside the mobile menu is tapped
            mobileMenuPanel.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => {
                    mobileMenuPanel.classList.add('hidden');
                    menuIconOpen?.classList.remove('hidden');
                    menuIconClose?.classList.add('hidden');
                    updateNavbarScroll();
                });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initNavbar();
            initScrollReveal();
        });
    } else {
        initNavbar();
        initScrollReveal();
    }
})();
