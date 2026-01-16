// PornMake Showcase Script with Multi-language Support
(function() {
    'use strict';

    const startTime = performance.now();
    const state = {
        currentLang: 'en',
        currentAPK: 'PornMake.apk',
        apkName: 'Porn Make',
        isLoading: false
    };

    // DOM Elements
    const elements = {};

    // Initialize the app
    function init() {
        // Cache DOM elements
        elements.html = document.documentElement;
        elements.langButtons = document.querySelectorAll('.lang-btn');
        elements.downloadButtons = document.querySelectorAll('#downloadBtn, #downloadBtnLarge');
        elements.copyButton = document.getElementById('copyButton');
        elements.downloadStatus = document.getElementById('downloadStatus');

        // Check URL parameter for custom APK
        checkURLParameter();

        // Detect and set language
        detectLanguage();

        // Apply initial translations
        applyTranslations(state.currentLang);

        // Set up event listeners
        setupEventListeners();

        // Update page metadata
        updateMetadata();

        const loadTime = (performance.now() - startTime).toFixed(2);
        console.log(`PornMake showcase loaded in ${loadTime}ms`);
    }

    // Check for APK code in URL
    function checkURLParameter() {
        const urlParams = new URLSearchParams(window.location.search);
        const apkCode = urlParams.get('r');

        if (apkCode) {
            fetch('apks.json')
                .then(response => response.json())
                .then(data => {
                    if (data.apps && data.apps[apkCode]) {
                        const app = data.apps[apkCode];
                        state.currentAPK = app.filename;
                        state.apkName = app.name || 'Porn Make';
                        console.log(`Custom APK loaded: ${state.currentAPK}`);
                    }
                })
                .catch(err => console.error('Error loading APK config:', err));
        }
    }

    // Detect browser language
    function detectLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0];

        // Check if the detected language is supported
        if (translations[langCode]) {
            state.currentLang = langCode;
        }

        // Update active button
        updateActiveLangButton();
    }

    // Apply translations to the page
    function applyTranslations(lang) {
        const t = translations[lang];
        if (!t) return;

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        // Update RTL for Arabic
        if (lang === 'ar') {
            elements.html.setAttribute('dir', 'rtl');
            elements.html.lang = 'ar';
        } else {
            elements.html.removeAttribute('dir');
            elements.html.lang = lang;
        }

        // Update page title
        document.title = `${t.title} - ${t.tagline}`;
    }

    // Update active language button
    function updateActiveLangButton() {
        elements.langButtons.forEach(btn => {
            if (btn.getAttribute('data-lang') === state.currentLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Set up event listeners
    function setupEventListeners() {
        // Language switcher buttons
        elements.langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                if (translations[lang]) {
                    state.currentLang = lang;
                    applyTranslations(lang);
                    updateActiveLangButton();
                }
            });
        });

        // Download buttons
        elements.downloadButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', handleDownload);
            }
        });

        // Copy button
        if (elements.copyButton) {
            elements.copyButton.addEventListener('click', handleCopy);
        }
    }

    // Handle download
    function handleDownload(e) {
        e.preventDefault();
        if (state.isLoading) return;

        const btn = e.currentTarget;
        const originalText = btn.querySelector('.btn-text')?.textContent;

        state.isLoading = true;
        btn.disabled = true;

        // Show loading state
        const t = translations[state.currentLang];
        showStatus(t.downloadStarted || 'Download started!');

        // Create download link
        const link = document.createElement('a');
        link.href = state.currentAPK;
        link.download = state.currentAPK;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Reset button after delay
        setTimeout(() => {
            state.isLoading = false;
            btn.disabled = false;
        }, 2000);
    }

    // Handle copy to clipboard
    function handleCopy() {
        const t = translations[state.currentLang];
        const textToCopy = window.location.href;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    if (elements.copyButton) {
                        elements.copyButton.textContent = t.copied || 'Copied!';
                        setTimeout(() => {
                            elements.copyButton.textContent = t.copyLink || 'Copy';
                        }, 2000);
                    }
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                    fallbackCopy(textToCopy);
                });
        } else {
            fallbackCopy(textToCopy);
        }
    }

    // Fallback copy method
    function fallbackCopy(text) {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = text;
        tempTextArea.style.position = 'fixed';
        tempTextArea.style.left = '-9999px';
        document.body.appendChild(tempTextArea);
        tempTextArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful && elements.copyButton) {
                const t = translations[state.currentLang];
                elements.copyButton.textContent = t.copied || 'Copied!';
                setTimeout(() => {
                    elements.copyButton.textContent = t.copyLink || 'Copy';
                }, 2000);
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }

        document.body.removeChild(tempTextArea);
    }

    // Show status message
    function showStatus(message) {
        if (!elements.downloadStatus) return;

        elements.downloadStatus.textContent = message;
        elements.downloadStatus.className = 'download-status show';

        setTimeout(() => {
            elements.downloadStatus.className = 'download-status';
        }, 3000);
    }

    // Update page metadata
    function updateMetadata() {
        const t = translations[state.currentLang];
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', `${t.tagline} - ${t.subtitle}`);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
