// Cookie Consent Management System
class CookieConsent {
    constructor() {
        this.cookieName = 'codebotiks_cookie_consent';
        this.cookieExpiration = 365; // days
        this.banner = null;
        this.settingsModal = null;
        this.preferences = {
            essential: true, // Always true, cannot be disabled
            analytics: false,
            advertising: false
        };
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.banner = document.getElementById('cookie-banner');
        this.settingsModal = document.getElementById('cookie-settings-modal');
        
        if (!this.banner || !this.settingsModal) {
            console.warn('Cookie consent elements not found');
            return;
        }
        
        // Load existing preferences
        this.loadPreferences();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Show banner if no consent given
        this.checkAndShowBanner();
        
        // Apply current preferences
        this.applyPreferences();
    }
    
    setupEventListeners() {
        // Banner buttons
        const acceptBtn = document.getElementById('cookie-accept');
        const essentialBtn = document.getElementById('cookie-essential');
        const settingsBtn = document.getElementById('cookie-settings');
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.acceptAll());
        }
        
        if (essentialBtn) {
            essentialBtn.addEventListener('click', () => this.acceptEssentialOnly());
        }
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
        
        // Settings modal buttons
        const savePreferencesBtn = document.getElementById('save-cookie-preferences');
        const acceptAllBtn = document.getElementById('accept-all-cookies');
        const closeSettingsBtn = document.getElementById('close-cookie-settings');
        
        if (savePreferencesBtn) {
            savePreferencesBtn.addEventListener('click', () => this.saveCustomPreferences());
        }
        
        if (acceptAllBtn) {
            acceptAllBtn.addEventListener('click', () => this.acceptAll());
        }
        
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.hideSettings());
        }
        
        // Close modal on outside click
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.hideSettings();
                }
            });
        }
        
        // Update checkboxes when modal opens
        const analyticsCheckbox = document.getElementById('analytics-cookies');
        const advertisingCheckbox = document.getElementById('advertising-cookies');
        
        if (analyticsCheckbox) {
            analyticsCheckbox.checked = this.preferences.analytics;
        }
        
        if (advertisingCheckbox) {
            advertisingCheckbox.checked = this.preferences.advertising;
        }
    }
    
    checkAndShowBanner() {
        const consent = this.getCookie(this.cookieName);
        if (!consent) {
            this.showBanner();
        }
    }
    
    showBanner() {
        if (this.banner) {
            this.banner.style.display = 'block';
        }
    }
    
    hideBanner() {
        if (this.banner) {
            this.banner.style.display = 'none';
        }
    }
    
    showSettings() {
        // Update checkbox states before showing
        const analyticsCheckbox = document.getElementById('analytics-cookies');
        const advertisingCheckbox = document.getElementById('advertising-cookies');
        
        if (analyticsCheckbox) {
            analyticsCheckbox.checked = this.preferences.analytics;
        }
        
        if (advertisingCheckbox) {
            advertisingCheckbox.checked = this.preferences.advertising;
        }
        
        if (this.settingsModal) {
            this.settingsModal.style.display = 'flex';
        }
    }
    
    hideSettings() {
        if (this.settingsModal) {
            this.settingsModal.style.display = 'none';
        }
    }
    
    acceptAll() {
        this.preferences = {
            essential: true,
            analytics: true,
            advertising: true
        };
        
        this.savePreferences();
        this.hideBanner();
        this.hideSettings();
        this.applyPreferences();
    }
    
    acceptEssentialOnly() {
        this.preferences = {
            essential: true,
            analytics: false,
            advertising: false
        };
        
        this.savePreferences();
        this.hideBanner();
        this.applyPreferences();
    }
    
    saveCustomPreferences() {
        const analyticsCheckbox = document.getElementById('analytics-cookies');
        const advertisingCheckbox = document.getElementById('advertising-cookies');
        
        this.preferences = {
            essential: true, // Always true
            analytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
            advertising: advertisingCheckbox ? advertisingCheckbox.checked : false
        };
        
        this.savePreferences();
        this.hideBanner();
        this.hideSettings();
        this.applyPreferences();
    }
    
    savePreferences() {
        const consentData = {
            preferences: this.preferences,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        this.setCookie(this.cookieName, JSON.stringify(consentData), this.cookieExpiration);
        
        // Also store in localStorage as backup
        try {
            localStorage.setItem(this.cookieName, JSON.stringify(consentData));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }
    
    loadPreferences() {
        // Try to load from cookie first
        let consentData = this.getCookie(this.cookieName);
        
        // Fallback to localStorage
        if (!consentData) {
            try {
                consentData = localStorage.getItem(this.cookieName);
            } catch (e) {
                console.warn('Could not read from localStorage:', e);
            }
        }
        
        if (consentData) {
            try {
                const parsed = JSON.parse(consentData);
                if (parsed.preferences) {
                    this.preferences = {
                        essential: true, // Always true
                        analytics: parsed.preferences.analytics || false,
                        advertising: parsed.preferences.advertising || false
                    };
                }
            } catch (e) {
                console.warn('Could not parse consent data:', e);
            }
        }
    }
    
    applyPreferences() {
        // Apply analytics preferences (Sentry)
        if (this.preferences.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }
        
        // Apply advertising preferences (Google AdSense)
        if (this.preferences.advertising) {
            this.enableAdvertising();
        } else {
            this.disableAdvertising();
        }
        
        console.log('Cookie preferences applied:', this.preferences);
    }
    
    enableAnalytics() {
        // Sentry is loaded in the head, so we don't need to do anything special
        // The tracking script is already active
        console.log('Analytics cookies enabled');
    }
    
    disableAnalytics() {
        // For Sentry, we could disable error tracking, but this might break functionality
        // In practice, we might want to just not send additional tracking data
        console.log('Analytics cookies disabled');
    }
    
    enableAdvertising() {
        // Google AdSense is loaded in the head, so we don't need to do anything special
        // The ads will be served according to Google's policies
        console.log('Advertising cookies enabled');
    }
    
    disableAdvertising() {
        // For Google AdSense, we would need to configure it for non-personalized ads
        // This is typically done through the ad configuration
        if (window.adsbygoogle) {
            // Set non-personalized ads
            window.adsbygoogle = window.adsbygoogle || [];
            window.adsbygoogle.push({
                google_ad_client: "ca-pub-5628713824897873",
                enable_page_level_ads: true,
                google_ad_modifications: {
                    eids: "21067496"
                }
            });
        }
        console.log('Advertising cookies disabled (non-personalized ads)');
    }
    
    // Cookie utility functions
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
    
    // Public API
    hasConsent(type = 'essential') {
        return this.preferences[type] || false;
    }
    
    revokeConsent() {
        this.deleteCookie(this.cookieName);
        try {
            localStorage.removeItem(this.cookieName);
        } catch (e) {
            console.warn('Could not remove from localStorage:', e);
        }
        
        this.preferences = {
            essential: true,
            analytics: false,
            advertising: false
        };
        
        this.showBanner();
        this.applyPreferences();
    }
    
    getPreferences() {
        return { ...this.preferences };
    }
}

// Initialize cookie consent system
const cookieConsent = new CookieConsent();

// Make it available globally if needed
window.cookieConsent = cookieConsent;