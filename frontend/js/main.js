document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const menuToggle = document.querySelector('.menu-toggle');
    const menuIcon = document.querySelector('.menu-icon');
    const nav = document.querySelector('.primary-nav');
    const searchForm = document.querySelector('#doctor-search');
    const searchInput = document.querySelector('#search-input');
    const locationInput = document.querySelector('#location-input');
    const feedback = document.querySelector('#search-feedback');
    const clearSearchBtn = document.querySelector('#clear-search');
    const doctorCards = [...document.querySelectorAll('.doctor-card')];
    const emptyState = document.querySelector('#empty-state');
    const doctorGrid = document.querySelector('#doctor-grid');
    const carouselPage = document.querySelector('#carousel-page');
    const carouselTotal = document.querySelector('#carousel-total');
    const prevBtn = document.querySelector('[data-carousel-prev]');
    const nextBtn = document.querySelector('[data-carousel-next]');
    const viewAllBtn = document.querySelector('#view-all-doctors-btn');

    // Modals
    const bookingModal = document.querySelector('#booking-modal');
    const bookingForm = document.querySelector('#booking-form');
    const bookingSuccess = document.querySelector('#form-success');
    const bookingDoctorSelect = document.querySelector('#booking-doctor-select');
    const bookingDateInput = document.querySelector('#booking-date');
    const bookingDoneBtn = document.querySelector('#booking-done-btn');

    const profileModal = document.querySelector('#profile-modal');
    const profileBookBtn = document.querySelector('#profile-book-btn');

    const authModal = document.querySelector('#auth-modal');
    const authForm = document.querySelector('#auth-form');
    const authSuccess = document.querySelector('#auth-success');
    const authDoneBtn = document.querySelector('#auth-done-btn');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authRoleBtns = document.querySelectorAll('.auth-role-btn');
    const authTitle = document.querySelector('#auth-title');
    const authSubmitBtn = document.querySelector('#auth-submit-btn');

    let currentSelectedDoctor = '';
    let carouselIndex = 0;

    // --- Auto-Changing Hero Carousel (Images Only, Text Stays Static) ---
    const imageSlides = document.querySelectorAll('.hero-image-slide');
    const heroDots = document.querySelectorAll('[data-hero-dot]');
    const heroSection = document.querySelector('#hero-carousel');
    let heroCurrentIndex = 0;
    let heroTimer = null;
    const TOTAL_HERO_IMAGES = imageSlides.length;

    function goToHeroSlide(index) {
        if (!TOTAL_HERO_IMAGES) return;
        heroCurrentIndex = (index + TOTAL_HERO_IMAGES) % TOTAL_HERO_IMAGES;

        // Cross-fade images smoothly
        imageSlides.forEach((img, i) => {
            if (i === heroCurrentIndex) {
                img.classList.remove('opacity-0', 'pointer-events-none');
                img.classList.add('opacity-100', 'pointer-events-auto');
            } else {
                img.classList.remove('opacity-100', 'pointer-events-auto');
                img.classList.add('opacity-0', 'pointer-events-none');
            }
        });

        // Update pagination dots
        heroDots.forEach((dot, i) => {
            if (i === heroCurrentIndex) {
                dot.className = 'hero-dot w-3 h-3 rounded-full bg-[#0e927f] transition-all cursor-pointer border-0 p-0 shadow-sm';
            } else {
                dot.className = 'hero-dot w-3 h-3 rounded-full bg-[#bcd1cb] hover:bg-[#0e927f] transition-all cursor-pointer border-0 p-0';
            }
        });
    }

    if (TOTAL_HERO_IMAGES > 0) {
        // Dot click handlers
        heroDots.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                goToHeroSlide(idx);
                resetHeroTimer();
            });
        });

        function startHeroTimer() {
            heroTimer = setInterval(() => {
                goToHeroSlide(heroCurrentIndex + 1);
            }, 3500); 
        }

        function resetHeroTimer() {
            clearInterval(heroTimer);
            startHeroTimer();
        }

        heroSection?.addEventListener('mouseenter', () => clearInterval(heroTimer));
        heroSection?.addEventListener('mouseleave', startHeroTimer);

        startHeroTimer();
    }


    // --- Modern Navbar Scroll & Mobile Menu (Matches mr-scrappe style) ---
    const siteHeader = document.getElementById('site-header') || document.querySelector('.site-header');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle') || menuToggle;
    const mobileMenuPanel = document.getElementById('mobile-menu-panel');
    const menuIconOpen = document.getElementById('menu-icon-open');
    const menuIconClose = document.getElementById('menu-icon-close');

    if (siteHeader) {
        const updateNavbarScroll = () => {
            const isScrolled = (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0) > 15;
            const isMenuOpen = mobileMenuPanel && !mobileMenuPanel.classList.contains('hidden');

            if (isScrolled || isMenuOpen) {
                siteHeader.classList.remove('py-4');
                siteHeader.classList.add('py-3', 'bg-[#082c2a]/95', 'backdrop-blur-md', 'border-b', 'border-white/10', 'shadow-[0_10px_24px_rgba(6,37,33,0.22)]');
            } else {
                siteHeader.classList.remove('py-3', 'bg-[#082c2a]/95', 'backdrop-blur-md', 'border-b', 'border-white/10', 'shadow-[0_10px_24px_rgba(6,37,33,0.22)]');
                siteHeader.classList.add('py-4', 'bg-[#082c2a]');
            }
        };

        window.addEventListener('scroll', updateNavbarScroll, { passive: true });
        updateNavbarScroll();

        if (mobileMenuToggle && mobileMenuPanel) {
            mobileMenuToggle.addEventListener('click', () => {
                const isCurrentlyHidden = mobileMenuPanel.classList.contains('hidden');
                if (isCurrentlyHidden) {
                    mobileMenuPanel.classList.remove('hidden');
                    menuIconOpen?.classList.add('hidden');
                    menuIconClose?.classList.remove('hidden');
                } else {
                    mobileMenuPanel.classList.add('hidden');
                    menuIconOpen?.classList.remove('hidden');
                    menuIconClose?.classList.add('hidden');
                }
                updateNavbarScroll();
            });

            // Close mobile menu when any link inside is clicked
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

    // --- Modal Management (Pure Tailwind) ---
    function openModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove('hidden');
        modalEl.classList.add('flex');
        document.body.classList.add('overflow-hidden');
        const firstInput = modalEl.querySelector('input:not([type="hidden"]), select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 50);
        }
    }

    function closeModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.add('hidden');
        modalEl.classList.remove('flex');
        const anyOpen = document.querySelectorAll('.modal-backdrop:not(.hidden)').length > 0;
        if (!anyOpen) {
            document.body.classList.remove('overflow-hidden');
        }
    }

    // Close on backdrop click or close button
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
        backdrop.addEventListener('click', (event) => {
            if (event.target === backdrop || event.target.closest('.modal-close')) {
                closeModal(backdrop);
            }
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(closeModal);
        }
    });

    // --- Date picker setup ---
    if (bookingDateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        bookingDateInput.min = today.toISOString().split('T')[0];
        bookingDateInput.value = tomorrow.toISOString().split('T')[0];
    }

    // Open Booking Modal Buttons
    document.querySelectorAll('[data-open-booking]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (bookingForm) bookingForm.hidden = false;
            if (bookingSuccess) bookingSuccess.hidden = true;
            if (bookingDoctorSelect) bookingDoctorSelect.value = '';
            openModal(bookingModal);
        });
    });

    // Booking Form Submit
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const doctor = bookingDoctorSelect?.value || 'Specialist Care Provider';
            const successDocEl = document.querySelector('#success-doctor-name');
            const successRefEl = document.querySelector('#success-booking-ref');
            
            if (successDocEl) successDocEl.textContent = doctor;
            if (successRefEl) successRefEl.textContent = `HLX-${Math.floor(10000 + Math.random() * 90000)}`;

            bookingForm.hidden = true;
            if (bookingSuccess) bookingSuccess.hidden = false;
        });
    }

    if (bookingDoneBtn) {
        bookingDoneBtn.addEventListener('click', () => {
            closeModal(bookingModal);
            if (bookingForm) {
                bookingForm.reset();
                bookingForm.hidden = false;
            }
            if (bookingSuccess) bookingSuccess.hidden = true;
        });
    }

    // --- Doctor Profile Modal ---
    document.querySelectorAll('[data-doctor-trigger]').forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest('.doctor-card');
            if (!card) return;

            const name = card.dataset.doctor || '';
            const title = card.dataset.title || '';
            const degree = card.dataset.degree || '';
            const hospital = card.dataset.hospital || '';
            const location = card.dataset.location || '';
            const fee = card.dataset.fee || '';
            const hours = card.dataset.time || '';
            const exp = card.dataset.experience || '';
            const rating = card.dataset.rating || '';
            const about = card.dataset.about || '';
            const img = card.dataset.image || '';

            currentSelectedDoctor = name;

            const docImgEl = document.querySelector('#profile-doc-img');
            const docNameEl = document.querySelector('#profile-doc-name');
            const docSpecialtyEl = document.querySelector('#profile-doc-specialty');
            const docDegreeEl = document.querySelector('#profile-doc-degree');
            const docHospitalEl = document.querySelector('#profile-doc-hospital');
            const docLocationEl = document.querySelector('#profile-doc-location');
            const docHoursEl = document.querySelector('#profile-doc-hours');
            const docFeeEl = document.querySelector('#profile-doc-fee');
            const docExpEl = document.querySelector('#profile-doc-exp');
            const docRatingEl = document.querySelector('#profile-doc-rating');
            const docAboutEl = document.querySelector('#profile-doc-about');

            if (docImgEl) { docImgEl.src = img; docImgEl.alt = name; }
            if (docNameEl) docNameEl.innerHTML = `${name} <span class="verified">✓</span>`;
            if (docSpecialtyEl) docSpecialtyEl.textContent = title;
            if (docDegreeEl) docDegreeEl.textContent = degree;
            if (docHospitalEl) docHospitalEl.textContent = hospital;
            if (docLocationEl) docLocationEl.textContent = location;
            if (docHoursEl) docHoursEl.textContent = hours;
            if (docFeeEl) docFeeEl.textContent = fee;
            if (docExpEl) docExpEl.textContent = exp;
            if (docRatingEl) docRatingEl.textContent = rating;
            if (docAboutEl) docAboutEl.textContent = about;

            openModal(profileModal);
        });
    });

    // Profile Modal "Book Appointment With This Doctor" button
    if (profileBookBtn) {
        profileBookBtn.addEventListener('click', () => {
            closeModal(profileModal);
            if (bookingDoctorSelect && currentSelectedDoctor) {
                // Find matching option
                for (let option of bookingDoctorSelect.options) {
                    if (option.value.includes(currentSelectedDoctor)) {
                        bookingDoctorSelect.value = option.value;
                        break;
                    }
                }
            }
            if (bookingForm) bookingForm.hidden = false;
            if (bookingSuccess) bookingSuccess.hidden = true;
            openModal(bookingModal);
        });
    }

    // --- Sign In / Auth Modal ---
    document.querySelectorAll('[data-open-auth]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (authForm) authForm.hidden = false;
            if (authSuccess) authSuccess.hidden = true;
            openModal(authModal);
        });
    });

    authTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            authTabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            const isLogin = tab.dataset.authTab === 'login';
            if (authTitle) authTitle.textContent = isLogin ? 'Welcome to HealiiX' : 'Create your HealiiX Account';
            if (authSubmitBtn) authSubmitBtn.innerHTML = isLogin ? 'Sign In <span aria-hidden="true">↗</span>' : 'Create Account <span aria-hidden="true">↗</span>';
        });
    });

    authRoleBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            authRoleBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            authForm.hidden = true;
            if (authSuccess) authSuccess.hidden = false;
        });
    }

    if (authDoneBtn) {
        authDoneBtn.addEventListener('click', () => {
            closeModal(authModal);
            if (authForm) {
                authForm.reset();
                authForm.hidden = false;
            }
            if (authSuccess) authSuccess.hidden = true;
        });
    }

    // --- Search & Find Doctors Navigation ---
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const term = (searchInput?.value || '').trim();
            const loc = (locationInput?.value || '').trim();
            const params = new URLSearchParams();
            if (term) params.set('q', term);
            if (loc) params.set('location', loc);
            const queryStr = params.toString();
            const targetPage = (typeof window !== 'undefined' && window.getAppPath) 
                ? window.getAppPath('find-doctors.html') 
                : 'find-doctors.html';
            window.location.href = queryStr ? `${targetPage}?${queryStr}` : targetPage;
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (locationInput) locationInput.value = '';
            clearSearchBtn.hidden = true;
            if (feedback) feedback.textContent = '';
        });
    }

    // Quick filter chips & Specialty buttons -> Seamlessly navigate to Directory with Filter
    document.querySelectorAll('[data-search]').forEach((button) => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const term = (button.dataset.search || '').trim();
            const targetPage = (typeof window !== 'undefined' && window.getAppPath) 
                ? window.getAppPath('find-doctors.html') 
                : 'find-doctors.html';
            if (term) {
                window.location.href = `${targetPage}?category=${encodeURIComponent(term)}`;
            } else {
                window.location.href = targetPage;
            }
        });
    });

    // --- Scroll Reveal Animations ---
    const revealElements = document.querySelectorAll('section:not(.hero), .doctor-card, .step, .faq-list details');
    revealElements.forEach((el) => el.classList.add('scroll-reveal'));

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        revealElements.forEach((el) => observer.observe(el));
    } else {
        revealElements.forEach((el) => el.classList.add('is-visible'));
    }
});
