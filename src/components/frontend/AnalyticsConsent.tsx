import { Settings } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loadAnalytics, trackPageView } from '../../lib/analytics';

type Consent = 'granted' | 'denied' | 'unknown';

const CONSENT_STORAGE_KEY = 'alphabag_analytics_consent';

const getStoredConsent = (): Consent => {
  if (typeof window === 'undefined') return 'unknown';
  const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
  return saved === 'granted' || saved === 'denied' ? saved : 'unknown';
};

export const AnalyticsConsent: React.FC = () => {
  const [consent, setConsent] = useState<Consent>('unknown');
  const location = useLocation();

  useEffect(() => {
    const saved = getStoredConsent();
    setConsent(saved);
    if (saved === 'granted') {
      loadAnalytics();
      trackPageView(window.location.href, document.title);
    }
  }, []);

  // Track page view on route transitions if user granted consent
  useEffect(() => {
    if (consent === 'granted') {
      trackPageView(window.location.href, document.title);
    }
  }, [location.pathname, consent]);

  const saveConsent = (value: Exclude<Consent, 'unknown'>) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
    setConsent(value);

    if (value === 'granted') {
      loadAnalytics();
      trackPageView(window.location.href, document.title);
    } else {
      window.gtag?.('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  };

  if (consent === 'unknown') {
    return (
      <div
        role="dialog"
        aria-label="Analytics cookie consent"
        className="fixed inset-x-4 bottom-4 z-[110] mx-auto max-w-xl border border-alphabag-gray bg-alphabag-darkgray p-4 shadow-2xl sm:flex sm:items-center sm:justify-between sm:gap-5"
      >
        <p className="text-xs leading-relaxed text-alphabag-subtext">
          We use anonymous analytics to measure performance and improve features. Analytics stays off
          until you choose whether to accept.
        </p>
        <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
          <button
            type="button"
            onClick={() => saveConsent('denied')}
            className="h-9 px-3 text-xs font-semibold text-alphabag-subtext hover:text-alphabag-text"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => saveConsent('granted')}
            className="h-9 bg-alphabag-yellow px-4 text-xs font-bold text-alphabag-black hover:bg-yellow-400"
          >
            Accept
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      title="Cookie settings"
      aria-label="Cookie settings"
      onClick={() => setConsent('unknown')}
      className="fixed bottom-4 right-4 z-[110] flex h-9 w-9 items-center justify-center border border-alphabag-gray bg-alphabag-darkgray text-alphabag-subtext shadow-lg hover:text-alphabag-yellow"
    >
      <Settings size={16} />
    </button>
  );
};

export default AnalyticsConsent;
