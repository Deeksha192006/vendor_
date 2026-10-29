import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, Check, X, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const COOKIE_CONSENT_KEY = 'baapoo_cookie_consent_v1';

export const getStoredCookieConsent = () => {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

export const saveCookieConsent = (preferences) => {
  const payload = {
    necessary: true, // Always true
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    version: '1.0',
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
  // Dispatch custom event to notify listeners
  window.dispatchEvent(new CustomEvent('baapoo_cookie_consent_updated', { detail: payload }));
  return payload;
};

export const CookiePreferencesModal = ({ isOpen, onClose, onSave }) => {
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCookieConsent();
      if (stored) {
        setPreferences({
          necessary: true,
          analytics: Boolean(stored.analytics),
          marketing: Boolean(stored.marketing),
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleToggle = (category) => {
    if (category === 'necessary') return; // Cannot toggle necessary
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSavePreferences = () => {
    const saved = saveCookieConsent(preferences);
    if (onSave) onSave(saved);
    if (onClose) onClose();
  };

  const handleAcceptAll = () => {
    const all = { necessary: true, analytics: true, marketing: true };
    const saved = saveCookieConsent(all);
    if (onSave) onSave(saved);
    if (onClose) onClose();
  };

  const handleRejectOptional = () => {
    const minimal = { necessary: true, analytics: false, marketing: false };
    const saved = saveCookieConsent(minimal);
    if (onSave) onSave(saved);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#30358F]/10 text-[#30358F] flex items-center justify-center shrink-0">
                <Cookie className="w-5 h-5" />
              </div>
              <div>
                <h3 id="cookie-modal-title" className="text-base font-black text-slate-900">Cookie &amp; Tracking Preferences</h3>
                <p className="text-xs text-slate-500">Manage how BAAPOO MART uses cookies on your device</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close cookie preferences modal"
              className="w-8 h-8 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
            <p className="leading-relaxed">
              We respect your privacy. Under applicable digital privacy guidelines, you have granular control over non-essential cookies. Strictly necessary cookies are required for site security, authentication, and core marketplace functionality.
            </p>

            {/* Category 1: Strictly Necessary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900 text-sm">Strictly Necessary Cookies</span>
                  <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Always Active
                  </span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Essential for security, encrypted login sessions, shopping cart integrity, and checkout operations. These cannot be disabled.
                </p>
              </div>
              <div className="pt-1">
                <div className="w-11 h-6 rounded-full bg-emerald-600 flex items-center justify-end px-1 cursor-not-allowed opacity-80">
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </div>
              </div>
            </div>

            {/* Category 2: Performance & Analytics */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-4 hover:border-slate-300 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-sm">Performance & Analytics Cookies</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    Optional
                  </span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Help us understand how users navigate the catalog, monitor page load speeds, and resolve technical issues without identifying you individually.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleToggle('analytics')}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${
                    preferences.analytics ? 'bg-[#30358F] justify-end' : 'bg-slate-200 justify-start'
                  }`}
                  aria-pressed={preferences.analytics}
                >
                  <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {/* Category 3: Personalization & Marketing */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-4 hover:border-slate-300 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Cookie className="w-4 h-4 text-orange-600" />
                  <span className="font-bold text-slate-900 text-sm">Personalization & Spotlight Cookies</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                    Optional
                  </span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Used to present relevant Indian artisan spotlights, personalized product recommendations, and campaign announcements suited to your interests.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleToggle('marketing')}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${
                    preferences.marketing ? 'bg-[#30358F] justify-end' : 'bg-slate-200 justify-start'
                  }`}
                  aria-pressed={preferences.marketing}
                >
                  <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              For complete details, please read our{' '}
              <Link to="/cookie-policy" onClick={onClose} className="text-[#30358F] underline font-bold">
                Cookie Policy
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" onClick={onClose} className="text-[#30358F] underline font-bold">
                Privacy Policy
              </Link>
              .
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRejectOptional}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition text-xs"
            >
              Reject Optional Cookies
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition text-xs"
              >
                Save Preferences
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#ED1C2E] text-white font-black hover:bg-[#D91425] transition shadow-md shadow-red-500/20 text-xs"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CookiePreferencesModal;
