import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ShieldCheck, Settings2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  CookiePreferencesModal,
  getStoredCookieConsent,
  saveCookieConsent,
} from './CookiePreferencesModal';

export const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Check if consent has been recorded previously
    const existing = getStoredCookieConsent();
    if (!existing) {
      // Short delay before showing banner for smooth visual entrance
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Provide a global window function to allow footer links to open preferences anytime
    window.openCookiePreferences = () => {
      setModalOpen(true);
    };

    const handleConsentEvent = () => {
      setShowBanner(false);
    };

    window.addEventListener('baapoo_cookie_consent_updated', handleConsentEvent);
    return () => {
      window.removeEventListener('baapoo_cookie_consent_updated', handleConsentEvent);
      delete window.openCookiePreferences;
    };
  }, []);

  const handleAcceptAll = () => {
    saveCookieConsent({ analytics: true, marketing: true });
    setShowBanner(false);
  };

  const handleRejectOptional = () => {
    saveCookieConsent({ analytics: false, marketing: false });
    setShowBanner(false);
  };

  const handleManagePreferences = () => {
    setModalOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.aside
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            role="dialog"
            aria-label="Cookie consent notice"
            className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none"
          >
            <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-slate-900/15 pointer-events-auto flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Text Description */}
              <div className="flex items-start gap-3.5 max-w-3xl">
                <div className="w-10 h-10 rounded-2xl bg-[#30358F]/10 text-[#30358F] flex items-center justify-center shrink-0 mt-0.5">
                  <Cookie className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">We value your privacy</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#30358F]">
                      BAAPOO MART Privacy
                    </span>
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    We use strictly necessary cookies to ensure encrypted login sessions, shopping cart continuity, and secure checkout. With your permission, we also use optional cookies for performance analytics and personalized Indian marketplace recommendations.
                  </p>
                  <div className="flex items-center gap-3 pt-0.5 text-[11px] font-bold text-slate-500">
                    <Link to="/cookie-policy" className="text-[#30358F] hover:text-[#ED1C2E] underline">
                      Cookie Policy
                    </Link>
                    <span>•</span>
                    <Link to="/privacy-policy" className="text-[#30358F] hover:text-[#ED1C2E] underline">
                      Privacy Policy
                    </Link>
                    <span>•</span>
                    <Link to="/terms/customer" className="text-slate-500 hover:text-slate-700 underline">
                      Customer Terms
                    </Link>
                    <span>•</span>
                    <Link to="/terms/vendor" className="text-slate-500 hover:text-slate-700 underline">
                      Vendor Terms
                    </Link>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={handleManagePreferences}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs flex items-center gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Manage Preferences</span>
                </button>

                <button
                  type="button"
                  onClick={handleRejectOptional}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 transition-colors text-xs"
                >
                  Reject Optional
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-5 py-2.5 rounded-xl bg-[#ED1C2E] text-white font-black hover:bg-[#D91425] transition-all shadow-md shadow-red-500/20 text-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Accept All</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Granular Preferences Modal */}
      <CookiePreferencesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => {
          setShowBanner(false);
          setModalOpen(false);
        }}
      />
    </>
  );
};

export default CookieConsentBanner;
