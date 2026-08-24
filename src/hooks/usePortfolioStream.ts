import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const usePortfolioStream = (token: string | null, address?: string) => {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token || !address) return;

    const es = new EventSource(`/api/stream/portfolio?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);

        if (update.balances) {
          queryClient.setQueryData(['portfolio', 'dex', address], update.balances);
        }
        if (update.cexBalances) {
          queryClient.setQueryData(['portfolio', 'cex'], update.cexBalances);
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    };

    es.onerror = (err) => {
      console.warn('[SSE] Connection error, falling back to polling:', err);
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [token, address, queryClient]);
};
