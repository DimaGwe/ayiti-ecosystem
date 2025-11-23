/**
 * Internationalization (i18n) Module
 * Handles English/Haitian Creole translations
 */

const i18n = {
  currentLang: 'en',
  translations: {},

  // Initialize i18n
  async init() {
    // Get saved language preference
    const savedLang = localStorage.getItem('pwotek_lang') || 'en';
    await this.setLanguage(savedLang);

    // Set up language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setLanguage(btn.dataset.lang);
      });
    });
  },

  // Load translations for a language
  async loadTranslations(lang) {
    try {
      const response = await fetch(`/api/locales/${lang}`);
      const data = await response.json();

      if (data.success) {
        this.translations[lang] = data.translations;
        return true;
      }
    } catch (error) {
      console.error(`Failed to load ${lang} translations:`, error);
    }

    // Fallback to embedded translations
    if (lang === 'en') {
      this.translations.en = this.getDefaultEnglish();
    } else if (lang === 'ht') {
      this.translations.ht = this.getDefaultHaitian();
    }
    return true;
  },

  // Set the active language
  async setLanguage(lang) {
    if (!['en', 'ht'].includes(lang)) lang = 'en';

    // Load translations if not cached
    if (!this.translations[lang]) {
      await this.loadTranslations(lang);
    }

    this.currentLang = lang;
    localStorage.setItem('pwotek_lang', lang);

    // Update UI
    this.updateUI();
    this.updateLanguageButtons();

    // Update HTML lang attribute
    document.documentElement.lang = lang;
  },

  // Update all translatable elements
  updateUI() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.dataset.i18n;
      const translation = this.get(key);
      if (translation) {
        el.textContent = translation;
      }
    });

    // Update placeholders
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const translation = this.get(key);
      if (translation) {
        el.placeholder = translation;
      }
    });
  },

  // Update language button states
  updateLanguageButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
    });
  },

  // Get a translation by key
  get(key, fallback = '') {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];

    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Try English fallback
        value = this.translations.en;
        for (const k2 of keys) {
          if (value && value[k2] !== undefined) {
            value = value[k2];
          } else {
            return fallback || key;
          }
        }
        return value || fallback || key;
      }
    }

    return value || fallback || key;
  },

  // Default English translations
  getDefaultEnglish() {
    return {
      nav: {
        home: 'Home',
        pricing: 'Pricing',
        dashboard: 'Dashboard'
      },
      hero: {
        title: 'Secure Your Connection',
        subtitle: 'Fast, private VPN powered by WireGuard. Protect your data and access the internet freely.',
        feature1: 'WireGuard Protocol',
        feature2: 'No Logs Policy',
        feature3: 'Pay with Credits'
      },
      btn: {
        login: 'Sign In',
        getStarted: 'Get Started',
        learnMore: 'Learn More',
        subscribe: 'Subscribe',
        download: 'Download',
        downloadConfig: 'Download .conf',
        addDevice: '+ Add Device',
        cancel: 'Cancel',
        startFree: 'Start Free Trial',
        signInGoogle: 'Sign in with Google'
      },
      features: {
        title: 'Why Choose Pwotek VPN?',
        speed: {
          title: 'Lightning Fast',
          desc: "WireGuard's modern protocol delivers exceptional speeds with minimal latency."
        },
        security: {
          title: 'Military-Grade Security',
          desc: 'State-of-the-art encryption protects your data from prying eyes.'
        },
        privacy: {
          title: 'Complete Privacy',
          desc: 'Zero logs policy ensures your online activity remains private.'
        }
      },
      pricing: {
        title: 'Simple, Transparent Pricing',
        subtitle: 'Pay with ecosystem credits. Earn credits by learning, contributing, and participating!'
      },
      dashboard: {
        loginRequired: 'Sign In Required',
        loginMessage: 'Please sign in to access your VPN dashboard.',
        subscription: 'Subscription',
        devices: 'Your Devices',
        noDevices: 'No devices configured yet. Add your first device to get started!',
        usage: 'Usage Statistics'
      },
      stats: {
        download: 'Downloaded',
        upload: 'Uploaded',
        devices: 'Devices',
        daysLeft: 'Days Remaining'
      },
      footer: {
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        support: 'Support'
      }
    };
  },

  // Default Haitian Creole translations
  getDefaultHaitian() {
    return {
      nav: {
        home: 'Lakay',
        pricing: 'Pri',
        dashboard: 'Tablo'
      },
      hero: {
        title: 'Pwoteje Koneksyon Ou',
        subtitle: 'VPN rapid, prive ak WireGuard. Pwoteje done ou epi aksede entènèt lib.',
        feature1: 'Pwotokòl WireGuard',
        feature2: 'Pa Gen Jounal',
        feature3: 'Peye ak Kredi'
      },
      btn: {
        login: 'Konekte',
        getStarted: 'Kòmanse',
        learnMore: 'Aprann Plis',
        subscribe: 'Abòne',
        download: 'Telechaje',
        downloadConfig: 'Telechaje .conf',
        addDevice: '+ Ajoute Aparèy',
        cancel: 'Anile',
        startFree: 'Kòmanse Gratis',
        signInGoogle: 'Konekte ak Google'
      },
      features: {
        title: 'Poukisa Chwazi Pwotek VPN?',
        speed: {
          title: 'Rapid Anpil',
          desc: 'Pwotokòl modèn WireGuard bay vitès eksepsyonèl ak mwens reta.'
        },
        security: {
          title: 'Sekirite Militè',
          desc: 'Kriptaj dènye teknoloji pwoteje done ou kont moun k ap gade.'
        },
        privacy: {
          title: 'Konfidansyalite Total',
          desc: 'Politik zewo jounal asire aktivite ou sou entènèt rete prive.'
        }
      },
      pricing: {
        title: 'Pri Senp, Transparan',
        subtitle: 'Peye ak kredi ekosistèm. Fè kredi lè w ap aprann, kontribye, ak patisipe!'
      },
      dashboard: {
        loginRequired: 'Koneksyon Obligatwa',
        loginMessage: 'Tanpri konekte pou aksede tablo VPN ou.',
        subscription: 'Abònman',
        devices: 'Aparèy Ou Yo',
        noDevices: 'Pa gen aparèy konfigire ankò. Ajoute premye aparèy ou pou kòmanse!',
        usage: 'Estatistik Itilizasyon'
      },
      stats: {
        download: 'Telechaje',
        upload: 'Voye',
        devices: 'Aparèy',
        daysLeft: 'Jou Ki Rete'
      },
      footer: {
        privacy: 'Politik Konfidansyalite',
        terms: 'Kondisyon Sèvis',
        support: 'Sipò'
      }
    };
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  i18n.init();
});
