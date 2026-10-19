// SPDX-License-Identifier: MIT
import { useEffect, useRef, useState } from 'react';
import { DexCommunityTakeover, DexTokenBoost, dexscreenerService } from '../services/dexscreener';

export type DexStreamType = 'boosts' | 'takeovers';

export interface UseDexScreenerStreamReturn {
  boosts: DexTokenBoost[];
  takeovers: DexCommunityTakeover[];
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  refresh: () => void;
}

const WSS_URLS: Record<DexStreamType, string> = {
  boosts: 'wss://api.dexscreener.com/token-boosts/latest/v1',
  takeovers: 'wss://api.dexscreener.com/community-takeovers/latest/v1',
};

export function useDexScreenerStream(type: DexStreamType = 'boosts'): UseDexScreenerStreamReturn {
  const [boosts, setBoosts] = useState<DexTokenBoost[]>([]);
  const [takeovers, setTakeovers] = useState<DexCommunityTakeover[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  // Fallback REST fetch
  const fetchRestFallback = async () => {
    try {
      if (type === 'boosts') {
        const data = await dexscreenerService.getLatestBoosts();
        if (data.length > 0) {
          setBoosts(data);
        }
      } else {
        const data = await dexscreenerService.getCommunityTakeovers();
        if (data.length > 0) {
          setTakeovers(data);
        }
      }
    } catch (err: any) {
      console.warn('[DexScreener] REST fallback fetch error:', err.message);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const url = WSS_URLS[type];

    const connectWebSocket = () => {
      // Clean up any existing connection without firing orphaned close handlers
      if (wsRef.current) {
        const stale = wsRef.current;
        stale.onopen = null;
        stale.onmessage = null;
        stale.onerror = null;
        stale.onclose = null;
        try {
          stale.close();
        } catch (_) {}
        wsRef.current = null;
      }

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setIsStreaming(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);
            
            // Handshake or array of items
            if (Array.isArray(payload.data)) {
              if (type === 'boosts') {
                setBoosts(payload.data);
              } else {
                setTakeovers(payload.data);
              }
            } else if (Array.isArray(payload)) {
              if (type === 'boosts') {
                setBoosts(payload);
              } else {
                setTakeovers(payload);
              }
            } else if (payload && typeof payload === 'object') {
              // Single streaming update event
              if (type === 'boosts' && payload.tokenAddress) {
                setBoosts((prev) => {
                  const filtered = prev.filter((b) => b.tokenAddress !== payload.tokenAddress);
                  return [payload as DexTokenBoost, ...filtered].slice(0, 50);
                });
              } else if (type === 'takeovers' && payload.tokenAddress) {
                setTakeovers((prev) => {
                  const filtered = prev.filter((t) => t.tokenAddress !== payload.tokenAddress);
                  return [payload as DexCommunityTakeover, ...filtered].slice(0, 50);
                });
              }
            }
          } catch (e: any) {
            console.warn('[DexScreener] Error parsing WebSocket message:', e.message);
          }
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setError('WebSocket connection error, switching to fallback');
          setIsConnected(false);
          setIsStreaming(false);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          setIsStreaming(false);

          // Exponential backoff reconnect (max 30s)
          if (reconnectAttemptsRef.current < 5) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectAttemptsRef.current += 1;
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMounted) connectWebSocket();
            }, delay);
          } else {
            // After max reconnects, use REST fallback
            fetchRestFallback();
          }
        };
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Failed to initialize WebSocket');
        setIsConnected(false);
        setIsStreaming(false);
        fetchRestFallback();
      }
    };

    // Initial connection + REST warm-up
    fetchRestFallback();
    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        const stale = wsRef.current;
        stale.onopen = null;
        stale.onmessage = null;
        stale.onerror = null;
        stale.onclose = null;
        try {
          stale.close();
        } catch (_) {}
        wsRef.current = null;
      }
    };
  }, [type]);

  const refresh = () => {
    fetchRestFallback();
  };

  return {
    boosts,
    takeovers,
    isConnected,
    isStreaming,
    error,
    refresh,
  };
}
