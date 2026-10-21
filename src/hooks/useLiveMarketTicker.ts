import { useEffect, useRef, useState } from 'react';
import { resolveApiUrl } from '../services/api';
import { MarketService } from '../services/MarketService';

export interface LiveTickerCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change1h?: number;
  change24h?: number;
  change7d?: number;
  volume?: number;
  marketCap?: number;
}

export interface LiveMarketTelemetry {
  marketCap?: number;
  volume?: number;
  btcDominance?: number;
  marketCapChange?: number;
  volumeChange?: number;
  btcDominanceChange?: number;
}

export interface LiveMarketTickerState {
  coins: LiveTickerCoin[];
  telemetry: LiveMarketTelemetry | null;
  isLive: boolean;
  lastUpdated: Date | null;
}

const DEFAULT_COINS: LiveTickerCoin[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://static.coinstats.app/coins/1650455588819.png', price: 83500, change24h: 2.5 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://static.coinstats.app/coins/1650455629727.png', price: 2460, change24h: 3.2 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://static.coinstats.app/coins/1650455806653.png', price: 175, change24h: 4.8 },
  { id: 'binance-coin', symbol: 'BNB', name: 'BNB', image: 'https://static.coinstats.app/coins/1666608145347.png', price: 745, change24h: 2.1 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', image: 'https://static.coinstats.app/coins/XRPdnqGJ.png', price: 1.36, change24h: 4.2 },
];

export const useLiveMarketTicker = (): LiveMarketTickerState => {
  const [coins, setCoins] = useState<LiveTickerCoin[]>(DEFAULT_COINS);
  const [telemetry, setTelemetry] = useState<LiveMarketTelemetry | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial load via REST while SSE handshake initializes
    MarketService.getMarketData([], false).then((data) => {
      if (!isMountedRef.current || !Array.isArray(data) || data.length === 0) return;
      setCoins(
        data.slice(0, 15).map((c: any) => ({
          id: c.id,
          symbol: (c.symbol || '').toUpperCase(),
          name: c.name,
          image: c.image,
          price: c.current_price,
          change1h: c.price_change_percentage_1h_in_currency,
          change24h: c.price_change_percentage_24h,
          volume: c.total_volume,
          marketCap: c.market_cap,
        }))
      );
      setLastUpdated(new Date());
    }).catch(() => {});

    MarketService.getGlobalOverview().then((res) => {
      if (isMountedRef.current && res) {
        setTelemetry(res);
      }
    }).catch(() => {});

    const connectSSE = () => {
      if (!isMountedRef.current) return;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const url = resolveApiUrl('/api/stream/ticker');

      fetch(url, {
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            throw new Error(`SSE ticker error: ${response.status}`);
          }
          if (!isMountedRef.current) return;
          setIsLive(true);

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
                const raw = line.slice(5).trim();
                if (!raw) continue;
                const payload = JSON.parse(raw);
                if (payload.type === 'market_ticker' && isMountedRef.current) {
                  if (Array.isArray(payload.coins) && payload.coins.length > 0) {
                    setCoins(payload.coins);
                  }
                  if (payload.telemetry) {
                    setTelemetry(payload.telemetry);
                  }
                  setLastUpdated(new Date());
                  setIsLive(true);
                }
              } catch (_) {}
            }
          }
          scheduleReconnect();
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setIsLive(false);
            scheduleReconnect();
          }
        });
    };

    const scheduleReconnect = () => {
      if (!isMountedRef.current) return;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) connectSSE();
      }, 8000);
    };

    connectSSE();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return { coins, telemetry, isLive, lastUpdated };
};
