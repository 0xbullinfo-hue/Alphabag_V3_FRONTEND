import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;
let analyticsLoaded = false;
let webVitalsInitialized = false;

export const GA_MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string) || 'G-XXXXXXXXXX';

export const isGaMeasurementId = (value: string | undefined): value is string =>
  Boolean(value && value !== 'G-XXXXXXXXXX' && MEASUREMENT_ID_PATTERN.test(value));

export const isAnalyticsEnabled = (): boolean =>
  import.meta.env.PROD && isGaMeasurementId(GA_MEASUREMENT_ID);

export interface GAEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, unknown>;
}

export const loadAnalytics = (): void => {
  if (analyticsLoaded || !isAnalyticsEnabled()) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function (...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  // Signal Consent Mode v2 that analytics_storage is granted
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
  });

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(script);
  analyticsLoaded = true;

  initWebVitals();
};

export const detectAiReferrer = (
  referrer = typeof document !== 'undefined' ? document.referrer : ''
): string | null => {
  if (!referrer) return null;
  const lower = referrer.toLowerCase();
  if (lower.includes('chatgpt.com') || lower.includes('chat.openai.com')) return 'chatgpt';
  if (lower.includes('perplexity.ai')) return 'perplexity';
  if (lower.includes('claude.ai')) return 'claude';
  if (lower.includes('gemini.google.com')) return 'gemini';
  if (lower.includes('copilot.microsoft.com') || lower.includes('edgeservices.bing.com')) return 'copilot';
  if (lower.includes('poe.com')) return 'poe';
  if (lower.includes('you.com')) return 'you';
  return null;
};

export const trackPageView = (url?: string, title?: string): void => {
  if (!analyticsLoaded || !isAnalyticsEnabled()) return;
  const pageLocation = url || (typeof window !== 'undefined' ? window.location.href : '');
  window.gtag?.('event', 'page_view', {
    page_location: pageLocation,
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
  });

  const aiPlatform = detectAiReferrer();
  if (aiPlatform && typeof window !== 'undefined') {
    window.gtag?.('event', 'ai_referral', {
      ai_platform: aiPlatform,
      landing_page: pageLocation,
      referrer_url: typeof document !== 'undefined' ? document.referrer : '',
    });
    try {
      window.localStorage.setItem('alphabag_ai_attribution', aiPlatform);
    } catch {
      // ignore storage quota / sandbox restrictions
    }
  }
};

export const trackEvent = (event: GAEvent): void => {
  if (!analyticsLoaded || !isAnalyticsEnabled()) return;
  window.gtag?.('event', event.action, {
    event_category: event.category || 'engagement',
    event_label: event.label,
    value: event.value,
    ...(event.custom_parameters || {}),
  });
};

export const reportWebVitals = (metric: Metric): void => {
  if (!isAnalyticsEnabled()) {
    if (import.meta.env.DEV) {
      console.info('[Web Vitals (dev)]:', metric);
    }
    return;
  }

  const value = Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value);

  window.gtag?.('event', 'web_vitals', {
    event_category: 'Web Vitals',
    event_label: metric.name,
    value,
    metric_id: metric.id,
    metric_rating: metric.rating,
    metric_delta: metric.delta,
  });
};

export const initWebVitals = (): void => {
  if (webVitalsInitialized) return;
  webVitalsInitialized = true;

  try {
    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onINP(reportWebVitals);
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Failed to initialize web-vitals observer:', err);
    }
  }
};

export const analytics = {
  trackExternalLink: (url: string, text?: string) => {
    trackEvent({
      action: 'click_external_link',
      category: 'engagement',
      label: url,
      custom_parameters: {
        link_text: text,
        link_url: url,
      },
    });
  },

  trackDownload: (filename: string, fileType?: string) => {
    trackEvent({
      action: 'download',
      category: 'engagement',
      label: filename,
      custom_parameters: {
        file_name: filename,
        file_type: fileType,
      },
    });
  },

  trackFormSubmission: (formName: string, success = true) => {
    trackEvent({
      action: 'form_submission',
      category: 'engagement',
      label: formName,
      value: success ? 1 : 0,
      custom_parameters: {
        form_name: formName,
        submission_success: success,
      },
    });
  },

  trackSearch: (query: string, results?: number) => {
    trackEvent({
      action: 'search',
      category: 'engagement',
      label: query,
      value: results,
      custom_parameters: {
        search_term: query,
        search_results: results,
      },
    });
  },

  trackSocialInteraction: (network: string, action: string, target?: string) => {
    trackEvent({
      action: 'social_interaction',
      category: 'social',
      label: `${network}_${action}`,
      custom_parameters: {
        social_network: network,
        social_action: action,
        social_target: target,
      },
    });
  },

  trackWalletConnect: (walletType: string, chainId?: number) => {
    trackEvent({
      action: 'wallet_connect',
      category: 'web3',
      label: walletType,
      custom_parameters: {
        wallet_type: walletType,
        chain_id: chainId,
      },
    });
  },

  trackMintAction: (tier: string, quantity: number, totalCost: number) => {
    trackEvent({
      action: 'mint_pass',
      category: 'nft',
      label: tier,
      value: totalCost,
      custom_parameters: {
        pass_tier: tier,
        quantity,
        total_cost: totalCost,
      },
    });
  },
};

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}
