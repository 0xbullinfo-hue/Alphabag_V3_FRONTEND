import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { resolveApiUrl } from '../services/api';

export interface PortfolioStreamState {
  isLive: boolean;
  isReconnecting: boolean;
  lastUpdated: Date | null;
}

/**
 * Live portfolio SSE stream with auto-reconnection, exponential backoff, jitter,
 * and live telemetry indicator state (UX-02).
 */
export const usePortfolioStream = (token: string | null, address?: string): PortfolioStreamState => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  const [isLive, setIsLive] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    if (!token || !address) {
      setIsLive(false);
      setIsReconnecting(false);
      return;
    }

    const connect = () => {
      if (!isMountedRef.current) return;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const url = `${resolveApiUrl('/api/stream/portfolio')}?address=${encodeURIComponent(address)}`;

      fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            throw new Error(`Stream connection failed (${response.status})`);
          }
          if (!isMountedRef.current) return;
          setIsLive(true);
          setIsReconnecting(false);
          retryCountRef.current = 0;

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              try {
                const rawData = line.slice(5).trim();
                if (!rawData) continue;
                const update = JSON.parse(rawData);

                if (update.type === 'portfolio') {
                  if (isMountedRef.current) {
                    setLastUpdated(new Date());
                  }
                  if (update.tokens) {
                    queryClient.setQueryData(['portfolio', 'dex', address], update.tokens);
                  }
                  if (update.cexBalances) {
                    queryClient.setQueryData(['portfolio', 'cex'], update.cexBalances);
                  }
                  if (typeof update.totalUSD === 'number') {
                    queryClient.setQueryData(['portfolio', 'net-worth'], update.totalUSD);
                  }
                }
              } catch (err) {
                console.error('[SSE] Parse error:', err);
              }
            }
          }
          scheduleReconnect();
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn('[SSE] Stream closed or unavailable, reconnecting with backoff:', err.message);
            scheduleReconnect();
          }
        });
    };

    const scheduleReconnect = () => {
      if (!isMountedRef.current) return;
      setIsLive(false);
      setIsReconnecting(true);
      const retry = Math.min(retryCountRef.current + 1, 5);
      retryCountRef.current = retry;
      const baseDelay = Math.min(1000 * Math.pow(2, retry), 20000);
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, delay);
    };

    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [token, address, queryClient]);

  return { isLive, isReconnecting, lastUpdated };
};
