import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  action?: string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onError,
  onExpire,
  action,
  className = '',
  theme = 'dark',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

  useEffect(() => {
    // If no sitekey is configured (e.g. in local development without Turnstile),
    // provide an automated bypass to allow development flows to function cleanly.
    if (!siteKey) {
      onVerify('dev-turnstile-bypass-token');
      return;
    }

    // Load Turnstile script if not already loaded
    if (!window.turnstile) {
      const existingScript = document.getElementById('cf-turnstile-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => setLoaded(true);
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => setLoaded(true));
      }
    } else {
      setLoaded(true);
    }
  }, [siteKey, onVerify]);

  useEffect(() => {
    if (!loaded || !siteKey || !containerRef.current || !window.turnstile) return;

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (_) {}
    }

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme,
        callback: (token: string) => {
          onVerify(token);
        },
        'error-callback': () => {
          onError?.();
        },
        'expired-callback': () => {
          onExpire?.();
        },
      });
      widgetIdRef.current = id;
    } catch (err) {
      console.warn('[Turnstile] Render error:', err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
      }
    };
  }, [loaded, siteKey, action, theme, onVerify, onError, onExpire]);

  if (!siteKey) {
    return null;
  }

  return <div ref={containerRef} className={`turnstile-container my-2 ${className}`} />;
};
