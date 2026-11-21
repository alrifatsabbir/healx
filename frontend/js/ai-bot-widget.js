import { CONFIG, getAppPath } from './config.js';

/**
 * HealiiX Clinical Triage Bot Widget (v2.5)
 * Default English Interface with Bilingual (English & বাংলা) Intelligence.
 * Fast, non-blocking responses, unified Medical Bot branding, and complete markdown rendering.
 */
class HealiixAiBotWidget {
    constructor() {
        this.isOpen = false;
        this.isLoading = false;
        this.history = [];
        this.storageKey = 'healiix_chat_history_v1';
        this.botSvgPath = `
            <rect x="3" y="11" width="18" height="10" rx="3"></rect>
            <circle cx="12" cy="5" r="2"></circle>
            <path d="M12 7v4"></path>
            <line x1="8" y1="16" x2="8" y2="16"></line>
            <line x1="16" y1="16" x2="16" y2="16"></line>
        `;
        this.init();
    }

    init() {
        if (document.getElementById('healiix-ai-bot-root')) return;
        this.loadHistory();
        this.renderWidget();
        this.bindEvents();
        this.setupExternalTriggers();
        if (typeof window !== 'undefined' && (window.location.search.includes('bot=open') || window.location.hash === '#ai-bot')) {
            setTimeout(() => this.open(), 250);
        }
    }

    loadHistory() {
        try {
            const saved = sessionStorage.getItem(this.storageKey);
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (_) {
            this.history = [];
        }
    }

    saveHistory() {
        try {
            sessionStorage.setItem(this.storageKey, JSON.stringify(this.history.slice(-20)));
        } catch (_) {}
    }

    renderWidget() {
        const root = document.createElement('div');
        root.id = 'healiix-ai-bot-root';
        root.className = 'fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 font-sans';

        root.innerHTML = `
            <style>
                @keyframes aiBotFadeSlide {
                    0% {
                        opacity: 0;
                        transform: translateY(8px) scale(0.98);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .ai-msg-enter {
                    animation: aiBotFadeSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes aiPulseDot {
                    0%, 100% { opacity: 0.3; transform: scale(0.85); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                .ai-typing-dot-1 { animation: aiPulseDot 1.1s infinite ease-in-out; }
                .ai-typing-dot-2 { animation: aiPulseDot 1.1s infinite ease-in-out 0.2s; }
                .ai-typing-dot-3 { animation: aiPulseDot 1.1s infinite ease-in-out 0.4s; }

                #ai-bot-label-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: linear-gradient(135deg, rgba(8, 44, 42, 0.96), rgba(5, 28, 26, 0.98));
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    color: #86e2cb;
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 0.5rem 0.875rem;
                    border-radius: 9999px;
                    border: 1px solid rgba(74, 222, 128, 0.25);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.28);
                    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                                transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                                max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                                padding 0.3s ease,
                                margin 0.3s ease;
                    will-change: opacity, transform, max-width;
                    white-space: nowrap;
                    max-width: 250px;
                    opacity: 1;
                    transform: translateX(0);
                    overflow: hidden;
                    pointer-events: none;
                    user-select: none;
                }
                #ai-bot-label-pill.pill-scrolled {
                    opacity: 0;
                    transform: translateX(12px) scale(0.95);
                    max-width: 0;
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                    border: none !important;
                    pointer-events: none;
                }

                #ai-bot-messages::-webkit-scrollbar {
                    width: 5px;
                }
                #ai-bot-messages::-webkit-scrollbar-track {
                    background: transparent;
                }
                #ai-bot-messages::-webkit-scrollbar-thumb {
                    background-color: #cbe4db;
                    border-radius: 9999px;
                }
                #ai-bot-messages::-webkit-scrollbar-thumb:hover {
                    background-color: #0e927f;
                }
            </style>

            <!-- Floating Launcher Button -->
            <div id="ai-bot-launcher" class="flex items-center gap-2.5 group">
                <span id="ai-bot-label-pill">
                    <span class="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse flex-shrink-0"></span>
                    <span>HealiiX Triage BOT</span>
                </span>
                <button type="button" id="ai-bot-toggle-btn" class="relative w-14 h-14 rounded-full bg-[#4ade80] hover:bg-[#3cd070] text-[#082c2a] flex items-center justify-center shadow-[0_10px_30px_rgba(74,222,128,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 flex-shrink-0" aria-label="Open HealiiX Triage BOT">
                    <svg id="bot-icon-open" class="w-7 h-7 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        ${this.botSvgPath}
                    </svg>
                    <svg id="bot-icon-close" class="w-6 h-6 hidden transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Chat Window Panel (Default English) with Smooth Blossom Transition -->
            <div id="ai-bot-panel" class="bot-hidden fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-24px)] sm:w-[430px] max-w-[430px] h-[calc(100vh-60px)] sm:h-[620px] max-h-[660px] bg-[#fbfdfc] rounded-[24px] sm:rounded-[28px] shadow-[0_25px_65px_-12px_rgba(8,44,42,0.32),0_0_0_1px_rgba(14,146,127,0.18)] overflow-hidden flex flex-col z-50 origin-bottom-right">
                
                <!-- Custom Confirmation Modal for Clear Conversation -->
                <div id="ai-bot-confirm-modal" class="hidden absolute inset-0 z-50 bg-[#082C2A]/75 backdrop-blur-xs flex items-center justify-center p-5 transition-all">
                    <div class="bg-white rounded-2xl p-6 shadow-2xl border border-[#cbe4db] max-w-[310px] w-full text-center space-y-4 animate-scale-in">
                        <div class="w-12 h-12 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto text-xl shadow-xs">
                            <svg class="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </div>
                        <div class="space-y-1">
                            <h4 class="font-extrabold text-[#082C2A] text-base">Clear Conversation?</h4>
                            <p class="text-xs text-[#526a65] leading-relaxed">
                                This will erase your current symptom triage history and reset the assistant.
                            </p>
                        </div>
                        <div class="grid grid-cols-2 gap-2 pt-1">
                            <button type="button" id="ai-bot-confirm-cancel" class="py-2.5 px-3 rounded-xl border border-[#d2e2dc] bg-[#f8fbf9] hover:bg-[#eaf4f0] text-[#082C2A] text-xs font-bold transition-all cursor-pointer">
                                Cancel
                            </button>
                            <button type="button" id="ai-bot-confirm-delete" class="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer">
                                Clear Chat
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Inner Header with Matching Bot Identity -->
                <div class="bg-gradient-to-r from-[#041b19] via-[#082c2a] to-[#0a3532] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-white/10 flex-shrink-0 relative overflow-hidden">
                    <div class="absolute -right-6 -top-6 w-28 h-28 bg-[#4ade80]/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div class="flex items-center gap-3 relative z-10">
                        <div class="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0e927f] to-[#082c2a] text-[#4ade80] flex items-center justify-center shadow-inner border border-[#4ade80]/30 flex-shrink-0">
                            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                ${this.botSvgPath}
                            </svg>
                            <span class="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-80"></span>
                                <span class="relative inline-flex rounded-full h-3 w-3 bg-[#4ade80] border-2 border-[#082c2a]"></span>
                            </span>
                        </div>
                        
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-extrabold text-[14px] text-white tracking-tight leading-tight">HealiiX Triage BOT</h3>
                                <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30">CLINICAL AI</span>
                            </div>
                            <p class="text-[11px] text-[#8cead3] font-medium leading-none mt-1 flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></span>
                                <span>Online • Symptom Assessment & Care</span>
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-1 relative z-10">
                        <button type="button" id="ai-bot-clear-btn" title="Clear conversation history" class="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer" aria-label="Clear chat">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                        <button type="button" id="ai-bot-close-btn" title="Minimize chat" class="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer" aria-label="Close chat">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Emergency Safety Notice Strip -->
                <div class="bg-[#fef2f2] border-b border-[#fee2e2] px-4 py-1.5 flex items-center justify-between text-[11px] text-[#991b1b] flex-shrink-0">
                    <div class="flex items-center gap-1.5">
                        <span class="animate-pulse">🚨</span>
                        <span>In life-threatening medical emergencies, dial <strong>999</strong> immediately</span>
                    </div>
                    <a href="tel:999" class="font-extrabold text-[#b91c1c] hover:underline flex items-center gap-0.5">
                        Call 999 ↗
                    </a>
                </div>

                <!-- Messages Stream Area -->
                <div id="ai-bot-messages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8faf9] text-xs sm:text-[13px] leading-relaxed scroll-smooth">
                    <!-- Welcome Card (Default English) -->
                    <div id="ai-bot-welcome-card" class="bg-gradient-to-b from-[#eaf4f0] to-[#edf7f3] border border-[#cbe4db] rounded-2xl p-4 text-[#082c2a] space-y-3 shadow-xs">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-[#082c2a] text-[#4ade80] flex items-center justify-center flex-shrink-0 shadow-xs">
                                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    ${this.botSvgPath}
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-extrabold text-[13px] text-[#082c2a] leading-tight">Welcome to HealiiX Triage BOT</h4>
                                <p class="text-[11px] text-[#4a6b63] font-medium leading-tight mt-0.5">24/7 AI-powered Clinical Companion</p>
                            </div>
                        </div>

                        <p class="text-[#2d4d45] leading-relaxed text-xs">
                            Describe your symptoms in <strong>English</strong> or <strong>বাংলা</strong>. Our clinical AI evaluates urgency, provides immediate care advice, and connects you with verified specialist doctors.
                        </p>

                        <div class="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-bold text-[#0e927f]">
                            <div class="bg-white/80 rounded-xl p-2 text-center border border-[#d6eae2] shadow-2xs">
                                <span class="block text-sm mb-0.5">⚡</span>
                                <span>Instant Triage</span>
                            </div>
                            <div class="bg-white/80 rounded-xl p-2 text-center border border-[#d6eae2] shadow-2xs">
                                <span class="block text-sm mb-0.5">🛡️</span>
                                <span>Private & Secure</span>
                            </div>
                            <div class="bg-white/80 rounded-xl p-2 text-center border border-[#d6eae2] shadow-2xs">
                                <span class="block text-sm mb-0.5">👨‍⚕️</span>
                                <span>Doctor Matching</span>
                            </div>
                        </div>

                        <div class="pt-2 border-t border-[#c5ddd3]/80">
                            <p class="text-[10px] font-extrabold text-[#0e927f] uppercase tracking-wider mb-2">
                                Popular Symptoms & Quick Start:
                            </p>
                            <div class="grid grid-cols-2 gap-1.5" id="ai-bot-suggestions-chips">
                                <button type="button" class="ai-chip text-left text-[11px] font-semibold bg-white hover:bg-[#dcfce7] active:bg-[#bbf7d0] text-[#082c2a] px-2.5 py-2 rounded-xl border border-[#cbe4db] hover:border-[#0e927f] transition-all cursor-pointer shadow-2xs" data-text="I have severe migraine and headache, which doctor should I see?">
                                    🤕 Migraine & Headache
                                </button>
                                <button type="button" class="ai-chip text-left text-[11px] font-semibold bg-white hover:bg-[#dcfce7] active:bg-[#bbf7d0] text-[#082c2a] px-2.5 py-2 rounded-xl border border-[#cbe4db] hover:border-[#0e927f] transition-all cursor-pointer shadow-2xs" data-text="I feel mild chest tightness and discomfort, what should I do?">
                                    🫀 Chest Pain & Tightness
                                </button>
                                <button type="button" class="ai-chip text-left text-[11px] font-semibold bg-white hover:bg-[#dcfce7] active:bg-[#bbf7d0] text-[#082c2a] px-2.5 py-2 rounded-xl border border-[#cbe4db] hover:border-[#0e927f] transition-all cursor-pointer shadow-2xs" data-text="Looking for guidance on child fever and cold symptoms">
                                    👶 Child Fever & Cold
                                </button>
                                <button type="button" class="ai-chip text-left text-[11px] font-semibold bg-white hover:bg-[#dcfce7] active:bg-[#bbf7d0] text-[#082c2a] px-2.5 py-2 rounded-xl border border-[#cbe4db] hover:border-[#0e927f] transition-all cursor-pointer shadow-2xs" data-text="I have severe lower back pain and difficulty sitting">
                                    🦴 Back & Joint Pain
                                </button>
                                <button type="button" class="ai-chip text-left text-[11px] font-semibold bg-white hover:bg-[#dcfce7] active:bg-[#bbf7d0] text-[#082c2a] px-2.5 py-2 rounded-xl border border-[#cbe4db] hover:border-[#0e927f] transition-all cursor-pointer shadow-2xs" data-text="How to relieve severe stomach gas and indigestion?">
                                    🍽️ Acidity & Stomach Gas
                                </button>
                                <button type="button" class="ai-chip text-left text-[11px] font-semibold bg-white hover:bg-[#dcfce7] active:bg-[#bbf7d0] text-[#082c2a] px-2.5 py-2 rounded-xl border border-[#cbe4db] hover:border-[#0e927f] transition-all cursor-pointer shadow-2xs" data-text="I have red itchy skin rashes and allergies">
                                    🧴 Skin Allergy & Rash
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Render History Messages -->
                    <div id="ai-bot-history-container" class="space-y-4"></div>

                    <!-- Typing Indicator -->
                    <div id="ai-bot-typing" class="hidden items-start gap-2.5 text-xs text-[#526a65] py-2 transition-all">
                        <div class="w-8 h-8 rounded-xl bg-[#082c2a] text-[#4ade80] border border-[#0e927f]/30 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-xs animate-pulse">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                ${this.botSvgPath}
                            </svg>
                        </div>
                        <div class="bg-white border border-[#cbe4db] px-4 py-2.5 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2.5">
                            <div class="flex items-center gap-1.5 py-0.5">
                                <span class="w-2 h-2 rounded-full bg-[#0e927f] ai-typing-dot-1"></span>
                                <span class="w-2 h-2 rounded-full bg-[#0e927f] ai-typing-dot-2"></span>
                                <span class="w-2 h-2 rounded-full bg-[#0e927f] ai-typing-dot-3"></span>
                            </div>
                            <span class="text-[11px] font-semibold text-[#082c2a]">Analyzing symptoms & clinical guidelines...</span>
                        </div>
                    </div>
                </div>

                <!-- Input Footer -->
                <div class="p-3.5 bg-white border-t border-[#d5e7df] flex-shrink-0">
                    <form id="ai-bot-form" class="flex items-center gap-2">
                        <input type="text" id="ai-bot-input" placeholder="Describe symptoms (English / বাংলা)..." autocomplete="off" class="flex-1 bg-[#f0f6f3] border border-[#c5ddd3] focus:border-[#0e927f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0e927f]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#082c2a] placeholder-[#8aa89f] transition-all">
                        <button type="submit" id="ai-bot-send-btn" class="w-11 h-11 rounded-2xl bg-[#082c2a] hover:bg-[#0c3e3a] active:scale-95 text-[#4ade80] flex items-center justify-center shadow-sm transition-all cursor-pointer flex-shrink-0 disabled:opacity-40" aria-label="Send message">
                            <svg class="w-5 h-5 -rotate-45 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                    <p class="text-[10px] text-[#718b83] text-center mt-2 font-medium">
                        🛡️ Preliminary AI triage only. For life-threatening emergencies, call <strong>999</strong> immediately.
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(root);
        this.renderHistory();
    }

    bindEvents() {
        const toggleBtn = document.getElementById('ai-bot-toggle-btn');
        const closeBtn = document.getElementById('ai-bot-close-btn');
        const clearBtn = document.getElementById('ai-bot-clear-btn');
        const form = document.getElementById('ai-bot-form');
        const input = document.getElementById('ai-bot-input');

        toggleBtn?.addEventListener('click', () => this.toggle());
        closeBtn?.addEventListener('click', () => this.close());
        clearBtn?.addEventListener('click', () => this.clearChat());

        // Custom Delete Confirmation Pop-up Events
        const confirmModal = document.getElementById('ai-bot-confirm-modal');
        const confirmCancel = document.getElementById('ai-bot-confirm-cancel');
        const confirmDelete = document.getElementById('ai-bot-confirm-delete');

        confirmCancel?.addEventListener('click', () => {
            confirmModal?.classList.add('hidden');
        });

        confirmDelete?.addEventListener('click', () => {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
            confirmModal?.classList.add('hidden');
        });

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = (input?.value || '').trim();
            if (text && !this.isLoading) {
                this.sendMessage(text);
                input.value = '';
            }
        });

        this.bindChipEvents();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        const labelPill = document.getElementById('ai-bot-label-pill');
        if (labelPill) {
            const handleScroll = () => {
                const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                if (scrollY > 20) {
                    labelPill.classList.add('pill-scrolled');
                } else {
                    labelPill.classList.remove('pill-scrolled');
                }
            };
            window.addEventListener('scroll', handleScroll, { passive: true });
            handleScroll();
        }
    }

    bindChipEvents() {
        document.querySelectorAll('.ai-chip').forEach(btn => {
            btn.onclick = () => {
                const text = btn.dataset.text;
                if (text && !this.isLoading) {
                    this.sendMessage(text);
                }
            };
        });
    }

    setupExternalTriggers() {
        document.querySelectorAll('[data-open-ai-bot], [data-open-assistant]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
            });
        });
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        this.isOpen = true;
        const panel = document.getElementById('ai-bot-panel');
        const launcher = document.getElementById('ai-bot-launcher');
        const iconOpen = document.getElementById('bot-icon-open');
        const iconClose = document.getElementById('bot-icon-close');
        const input = document.getElementById('ai-bot-input');

        panel?.classList.remove('bot-hidden');
        panel?.classList.add('bot-visible');
        launcher?.classList.add('opacity-0', 'pointer-events-none', 'scale-90');
        iconOpen?.classList.add('hidden');
        iconClose?.classList.remove('hidden');

        setTimeout(() => {
            input?.focus();
            this.scrollToBottom();
        }, 120);
    }

    close() {
        this.isOpen = false;
        const panel = document.getElementById('ai-bot-panel');
        const launcher = document.getElementById('ai-bot-launcher');
        const iconOpen = document.getElementById('bot-icon-open');
        const iconClose = document.getElementById('bot-icon-close');
        const confirmModal = document.getElementById('ai-bot-confirm-modal');

        confirmModal?.classList.add('hidden');
        panel?.classList.remove('bot-visible');
        panel?.classList.add('bot-hidden');
        launcher?.classList.remove('opacity-0', 'pointer-events-none', 'scale-90');
        iconOpen?.classList.remove('hidden');
        iconClose?.classList.add('hidden');
    }

    clearChat() {
        const confirmModal = document.getElementById('ai-bot-confirm-modal');
        confirmModal?.classList.remove('hidden');
    }

    renderHistory() {
        const container = document.getElementById('ai-bot-history-container');
        const welcomeCard = document.getElementById('ai-bot-welcome-card');
        if (!container) return;

        if (this.history.length > 0) {
            welcomeCard?.classList.add('hidden');
        } else {
            welcomeCard?.classList.remove('hidden');
            this.bindChipEvents();
        }

        const total = this.history.length;
        container.innerHTML = this.history.map((msg, idx) => {
            const isLatestBot = (msg.sender === 'bot' && idx === total - 1);
            if (msg.sender === 'user') {
                return `
                    <div class="flex justify-end">
                        <div class="max-w-[85%] bg-gradient-to-r from-[#082c2a] to-[#0c403d] text-white px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs text-xs sm:text-[13px] leading-relaxed break-words border border-[#0e927f]/20">
                            ${this.escapeHtml(msg.text)}
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="flex items-start gap-2.5 ${isLatestBot ? 'ai-msg-enter' : ''}">
                        <div class="w-8 h-8 rounded-xl bg-[#082c2a] text-[#4ade80] border border-[#0e927f]/30 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-xs">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                ${this.botSvgPath}
                            </svg>
                        </div>
                        <div class="max-w-[88%] bg-white border border-[#d2e7df] text-[#082c2a] p-3.5 sm:p-4 rounded-2xl rounded-tl-xs shadow-xs text-xs sm:text-[13px] leading-relaxed break-words space-y-2.5">
                            <div class="bot-content leading-relaxed">${this.formatMarkdown(msg.text)}</div>
                            ${this.renderFilterCta(msg)}
                            ${this.renderDoctorCards(msg.doctors)}
                        </div>
                    </div>
                `;
            }
        }).join('');

        this.scrollToBottom();
    }

    renderFilterCta(msg) {
        if (!msg || !msg.filterUrl) return '';
        const label = msg.filterLabel || msg.filterLabelBn || 'Find Verified Specialists';
        const specialty = msg.suggestedSpecialty ? `<span class="text-[10px] text-[#4ade80] block font-semibold">${msg.suggestedSpecialty}</span>` : '';
        return `
            <div class="pt-2.5 mt-2.5 border-t border-[#d5e7df]">
                <a href="${getAppPath(msg.filterUrl)}" class="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#082c2a] to-[#0e4e46] hover:from-[#0c3e3a] hover:to-[#126359] text-white flex items-center justify-between text-xs font-bold shadow-xs hover:shadow-md transition-all group no-underline border border-[#0e927f]/40">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm">
                            🩺
                        </div>
                        <div class="text-left">
                            <span class="block text-xs font-extrabold text-white">${label}</span>
                            ${specialty}
                        </div>
                    </div>
                    <div class="flex items-center gap-1 text-[#4ade80] font-bold text-xs group-hover:translate-x-1 transition-transform">
                        <span>View Specialists</span>
                        <span>&rarr;</span>
                    </div>
                </a>
            </div>
        `;
    }

    renderDoctorCards(doctors = []) {
        if (!doctors || doctors.length === 0) return '';
        return `
            <div class="pt-2.5 border-t border-[#e2ece7] mt-3">
                <span class="text-[10px] uppercase tracking-wider font-extrabold text-[#0e927f] block mb-2 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#0e927f]"></span>
                    <span>Verified Specialists on HealiiX:</span>
                </span>
                <div class="space-y-2">
                    ${doctors.map(d => {
                        const avatarHtml = d.avatar
                            ? `<img src="${d.avatar}" alt="${d.name}" class="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[#0e927f]/30">`
                            : `<div class="w-8 h-8 rounded-full bg-[#082c2a] text-[#4ade80] text-xs font-bold flex items-center justify-center flex-shrink-0">${d.name ? d.name.charAt(0) : 'D'}</div>`;

                        return `
                            <div class="bg-[#f4faf7] border border-[#d5e7df] rounded-xl p-2.5 flex items-center justify-between gap-2.5 hover:border-[#0e927f] transition-all shadow-2xs">
                                <div class="flex items-center gap-2.5 overflow-hidden">
                                    ${avatarHtml}
                                    <div class="truncate">
                                        <h4 class="font-bold text-xs text-[#082c2a] truncate leading-tight">${d.name}</h4>
                                        <p class="text-[10px] text-[#526a65] truncate font-medium">${d.specialty} • ${d.fee}</p>
                                    </div>
                                </div>
                                <a href="${getAppPath(d.profileUrl || 'find-doctors.html')}" target="_blank" class="px-3 py-1.5 rounded-lg bg-[#4ade80] hover:bg-[#3cd070] text-[#082c2a] text-[10px] font-black flex-shrink-0 transition-all shadow-2xs flex items-center gap-1">
                                    <span>Book</span>
                                    <span>&rarr;</span>
                                </a>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    async sendMessage(text) {
        if (!text || this.isLoading) return;

        // 1. Add user message
        this.history.push({ sender: 'user', text, timestamp: Date.now() });
        this.saveHistory();
        this.renderHistory();

        // 2. Set loading state
        this.setLoading(true);

        try {
            // Send to Bot Service directly without artificial delays
            const res = await this.callBotApi(text);
            const reply = res.reply || 'Thank you for reaching out. Please feel free to ask any health questions.';
            const doctors = res.matchingDoctors || [];

            this.history.push({
                sender: 'bot',
                text: reply,
                suggestedSpecialty: res.suggestedSpecialty,
                filterUrl: res.filterUrl,
                filterLabel: res.filterLabel,
                filterLabelBn: res.filterLabelBn,
                doctors,
                timestamp: Date.now()
            });
            this.saveHistory();
            this.renderHistory();
        } catch (err) {
            console.error('[HealiiX Triage Bot Error]', err);
            this.history.push({
                sender: 'bot',
                text: 'Connection temporarily unavailable. Please visit our [Find Doctors](find-doctors.html) directory directly to schedule an appointment with verified specialists.',
                timestamp: Date.now()
            });
            this.saveHistory();
            this.renderHistory();
        } finally {
            this.setLoading(false);
        }
    }

    async callBotApi(message) {
        const payload = {
            message,
            history: this.history.slice(-6).map(h => ({ sender: h.sender, text: h.text }))
        };

        const microserviceUrl = CONFIG.ENDPOINTS.BOT.CHAT;
        const backendRouteUrl = CONFIG.ENDPOINTS.BOT.BACKEND_CHAT;

        // Try standalone AI-Bot microservice (port 8000) with fast 3.5s timeout
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const res = await fetch(microserviceUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                return data.data || data;
            }
        } catch (_) {
            // Instantly fall through to primary backend
        }

        // Primary / Fallback Backend Route (port 5000)
        const fallbackRes = await fetch(backendRouteUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!fallbackRes.ok) {
            throw new Error(`HTTP ${fallbackRes.status}`);
        }

        const fallbackData = await fallbackRes.json();
        return fallbackData.data || fallbackData;
    }

    setLoading(loading) {
        this.isLoading = loading;
        const typingEl = document.getElementById('ai-bot-typing');
        const sendBtn = document.getElementById('ai-bot-send-btn');
        if (loading) {
            typingEl?.classList.remove('hidden');
            typingEl?.classList.add('flex');
            sendBtn?.setAttribute('disabled', 'true');
        } else {
            typingEl?.classList.add('hidden');
            typingEl?.classList.remove('flex');
            sendBtn?.removeAttribute('disabled');
        }
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messages = document.getElementById('ai-bot-messages');
        if (messages) {
            messages.scrollTop = messages.scrollHeight;
        }
    }

    escapeHtml(str = '') {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    formatMarkdown(text = '') {
        if (!text) return '';
        let html = this.escapeHtml(text);

        // Bold: **text**
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#082c2a] font-extrabold">$1</strong>');
        
        // Italic: *text*
        html = html.replace(/\*(.*?)\*/g, '<em class="text-[#405d56]">$1</em>');
        
        // Markdown Links: [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, p1, p2) => {
            const url = p2.startsWith('http') ? p2 : getAppPath(p2);
            return `<a href="${url}" class="inline-flex items-center gap-1 text-[#0e927f] hover:text-[#087866] underline font-extrabold transition-colors">${p1} &rarr;</a>`;
        });
        
        // Bullet points (• or - or *)
        html = html.replace(/^[•\-\*]\s+(.*?)$/gm, '<li class="ml-4 list-disc text-[#284942] my-0.5">$1</li>');
        
        // Preserves all line breaks cleanly without eating or truncating text
        html = html.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

        return html;
    }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.healiixAiBot = new HealiixAiBotWidget();
        });
    } else {
        window.healiixAiBot = new HealiixAiBotWidget();
    }
}

export default HealiixAiBotWidget;
