import { useState, useCallback } from 'react';
import { api } from '../services/api';

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
     * Real CEX connection flow. This REPLACES the previous pattern (still
     * duplicated in CexBag.tsx and Settings.tsx before this fix) which did:
     *   await new Promise(r => setTimeout(r, 1500));
     *   addConnection({ ...info, balance: Math.random() * 8000 + 500, isConnected: true });
     *   Swal.fire({ title: 'Connected', text: '... verified!' })
     * i.e. it never validated the API key/secret against the exchange at
     * all, told the user it was "verified" regardless, and stored a
     * random fake balance. A real exchange balance read requires signed,
     * exchange-specific REST calls (e.g. HMAC-SHA256 signed requests for
     * Binance) that must happen server-side — the API secret should never
     * be sent anywhere except directly to your own backend over HTTPS,
     * and never logged or persisted in the frontend.
     *
     * This function calls the backend, which must implement
     * POST /api/cex/connect { exchange, apiKey, secret } -> { balance, verified }
     * performing the real signed balance check and returning the actual
     * total. Until that endpoint exists, this throws instead of silently
     * faking success.
     */
    const connectExchange = useCallback(async (
        exchangeInfo: { id: string; name: string; icon: string },
        apiKey: string,
        secret: string
    ): Promise<CexConnection> => {
        const res = await api.post('/api/cex/connect', {
            exchange: exchangeInfo.id,
            apiKey,
            secret,
        });

        if (!res.data?.verified) {
            throw new Error(res.data?.message || 'Could not verify this API key with the exchange.');
        }

        const conn: CexConnection = {
            id: exchangeInfo.id,
            name: exchangeInfo.name,
            icon: exchangeInfo.icon,
            apiKey: apiKey.substring(0, 4) + '••••',
            balance: Number(res.data.balance) || 0,
            isConnected: true,
        };
        addConnection(conn);
        return conn;
    }, [addConnection]);

    const totalBalance = connections.reduce((acc, c) => acc + c.balance, 0);

    return { connections, addConnection, removeConnection, connectExchange, totalBalance };
}
