import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { resolveApiUrl } from '../services/api';

/**
 * Live portfolio SSE stream (fixed).
 * Changes vs. previous version:
 *  1. Passes the wallet address to the stream (?address=...) so the server can
 *     actually compute the DEX side of the portfolio.
 *  2. Handles the real payload shape the server now emits:
 *     { type:'portfolio', tokens, balances:{tokens,totalUSD}, cexBalances, totalUSD, timestamp }
 */
export const usePortfolioStream = (token: string | null, address?: string) => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token || !address) return;

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
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('[SSE] Stream closed or unavailable, polling fallback active:', err.message);
        }
      });

    return () => {
      controller.abort();
      abortControllerRef.current = null;
    };
  }, [token, address, queryClient]);
};
