import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { MarketService } from '../services/MarketService';
import { CEX_SYMBOL_TO_COINGECKO_ID } from '../services/config';

const STORAGE_KEY = 'alphabag_cex_connections';

export interface CexConnection {
    id: string;
    name: string;
    icon: string;
    apiKey: string;
    balance: number;
    isConnected: boolean;
}

export function useCexConnections() {
    const [connections, setConnections] = useState<CexConnection[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const save = useCallback((updated: CexConnection[]) => {
        setConnections(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, []);

    const addConnection = useCallback((conn: CexConnection) => {
        setConnections(prev => {
            const updated = [...prev.filter(c => c.id !== conn.id), conn];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const removeConnection = useCallback((id: string) => {
        setConnections(prev => {
            const updated = prev.filter(c => c.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    /**
     * Real CEX connection flow — calls the backend (src/controllers/
     * cexController.js, using ccxt for real signed exchange balance
     * reads). Backend contract:
     *   POST /api/cex/connect { exchangeId, apiKey, secret }
     *   -> { success, verified, balances: { BTC: 0.5, USDT: 100, ... }, raw }
     * Note the field is `exchangeId` (a real ccxt exchange id like
     * 'binance'), not `exchange` — sending the wrong field name silently
     * fails against the real backend contract even once the route exists.
     */
    const connectExchange = useCallback(async (
        exchangeInfo: { id: string; name: string; icon: string },
        apiKey: string,
        secret: string
    ): Promise<CexConnection> => {
        const res = await api.post('/api/cex/connect', {
            exchangeId: exchangeInfo.id,
            apiKey,
            secret,
        });

        if (!res.data?.verified) {
            throw new Error(res.data?.message || 'Could not verify this API key with the exchange.');
        }

        // The backend returns real per-currency balances, not a single
        // USD figure — compute that here using the cached/deduped price
        // service, rather than asking the backend to guess USD
        // conversion for 100+ exchanges' worth of possible assets.
        const balancesByCurrency: Record<string, number> = res.data.balances || {};
        const currencies = Object.keys(balancesByCurrency);
        const coingeckoIds = currencies
            .map(sym => CEX_SYMBOL_TO_COINGECKO_ID[sym.toUpperCase()])
            .filter(Boolean);

        let totalUsd = 0;
        if (coingeckoIds.length > 0) {
            try {
                const priceData = await MarketService.getPrice(Array.from(new Set(coingeckoIds)));
                if (priceData) {
                    currencies.forEach(sym => {
                        const id = CEX_SYMBOL_TO_COINGECKO_ID[sym.toUpperCase()];
                        const price = id ? Number(priceData[id]?.usd || 0) : 0;
                        totalUsd += balancesByCurrency[sym] * price;
                    });
                }
            } catch (priceErr) {
                console.warn('[useCexConnections] Price lookup failed, balance will show as $0:', priceErr);
            }
        }

        const conn: CexConnection = {
            id: exchangeInfo.id,
            name: exchangeInfo.name,
            icon: exchangeInfo.icon,
            apiKey: apiKey.substring(0, 4) + '••••',
            balance: totalUsd,
            isConnected: true,
        };
        addConnection(conn);
        return conn;
    }, [addConnection]);

    const totalBalance = connections.reduce((acc, c) => acc + c.balance, 0);

    return { connections, addConnection, removeConnection, connectExchange, totalBalance };
}
