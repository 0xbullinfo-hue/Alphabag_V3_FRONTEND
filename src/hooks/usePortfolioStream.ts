import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const usePortfolioStream = (token: string | null, address?: string) => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token || !address) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Fetch stream securely with Authorization header instead of leaking JWT in query string
    fetch('/api/stream/portfolio', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream'
      },
      signal: controller.signal
    }).then(async (response) => {
      if (!response.ok || !response.body) {
        throw new Error('Stream connection failed');
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
          if (line.startsWith('data:')) {
            try {
              const rawData = line.slice(5).trim();
              if (rawData) {
                const update = JSON.parse(rawData);
                if (update.balances) {
                  queryClient.setQueryData(['portfolio', 'dex', address], update.balances);
                }
                if (update.cexBalances) {
                  queryClient.setQueryData(['portfolio', 'cex'], update.cexBalances);
                }
              }
            } catch (err) {
              console.error('[SSE] Parse error:', err);
            }
          }
        }
      }
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('[SSE] Stream closed or unavailable, polling active:', err.message);
      }
    });

    return () => {
      controller.abort();
      abortControllerRef.current = null;
    };
  }, [token, address, queryClient]);
};
