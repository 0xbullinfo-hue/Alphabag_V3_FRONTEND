import { useCallback,useState } from 'react';
import { api } from '../services/api';
import { CEX_SYMBOL_TO_COINGECKO_ID } from '../services/config';
import { MarketService } from '../services/MarketService';

const STORAGE_KEY = 'alphabag_cex_connections';

export interface CexConnection {
    id: string;
    name: string;
    icon: string;
    apiKey: string;
    balance: number;
    balances: CexAsset[];
    isConnected: boolean;
}

export interface CexAsset {
    symbol: string;
    name: string;
    balance: number;
    price: number;
    value: number;
    exchange: string;
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

        let priceData: Record<string, { usd?: number }> | null = null;
        if (coingeckoIds.length > 0) {
            try {
                priceData = await MarketService.getPrice(Array.from(new Set(coingeckoIds)));
            } catch (priceErr) {
                console.warn('[useCexConnections] Price lookup failed, balance will show as $0:', priceErr);
            }
        }

        const balances = currencies.map((symbol): CexAsset => {
            const id = CEX_SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()];
            const price = id ? Number(priceData?.[id]?.usd || 0) : 0;
            const balance = Number(balancesByCurrency[symbol] || 0);
            return {
                symbol,
                name: symbol,
                balance,
                price,
                value: balance * price,
                exchange: exchangeInfo.name,
            };
        });
        const totalUsd = balances.reduce((total, asset) => total + asset.value, 0);

        const conn: CexConnection = {
            id: exchangeInfo.id,
            name: exchangeInfo.name,
            icon: exchangeInfo.icon,
            apiKey: apiKey.substring(0, 4) + '••••',
            balance: totalUsd,
            balances,
            isConnected: true,
        };
        addConnection(conn);
        return conn;
    }, [addConnection]);

    const totalBalance = connections.reduce((acc, c) => acc + c.balance, 0);

    return { connections, addConnection, removeConnection, connectExchange, totalBalance };
}
