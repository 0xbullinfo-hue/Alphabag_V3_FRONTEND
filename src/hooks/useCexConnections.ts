import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { SUPPORTED_CEX } from '../services/exchanges';

const REFRESH_INTERVAL_MS = 2 * 60 * 1000; // match the DEX 120s auto-refresh cadence

export interface CexConnection {
    id: string;
    name: string;
    icon: string;
    apiKey: string;
    balance: number;
    balances: CexAsset[];
    isConnected: boolean;
    lastSynced?: number;
    status?: 'CONNECTED' | 'ERROR';
}

export interface CexAsset {
    symbol: string;
    name: string;
    balance: number;
    price: number;
    value: number;
    exchange: string;
}

const iconFor = (exchangeId: string) => SUPPORTED_CEX.find(c => c.id === exchangeId)?.icon || '';
const nameFor = (exchangeId: string) => SUPPORTED_CEX.find(c => c.id === exchangeId)?.name || exchangeId;

// Backend balance rows already carry real priceUSD/valueUSD per the
// platform integration contract (docs/PLATFORM_INTEGRATION_CONTRACT_V1.md
// §5) — no client-side symbol->CoinGecko-id guessing needed anymore.
const toAsset = (row: { symbol: string; name?: string; balance: string | number; priceUSD?: number; valueUSD?: number; exchange?: string }, exchangeName: string): CexAsset => ({
    symbol: row.symbol,
    name: row.name || row.symbol,
    balance: Number(row.balance || 0),
    price: Number(row.priceUSD || 0),
    value: Number(row.valueUSD ?? (Number(row.balance || 0) * Number(row.priceUSD || 0))),
    exchange: row.exchange || exchangeName,
});

export function useCexConnections() {
    // Server is the source of truth. Do not persist CEX connection metadata in localStorage.
    const [connections, setConnections] = useState<CexConnection[]>([]);
    const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const persist = useCallback((updated: CexConnection[]) => {
        setConnections(updated);
        try {
            
        } catch {
            // localStorage can throw in private-browsing/quota-exceeded
            // cases; the in-memory state is still correct either way.
        }
    }, []);

    const addConnection = useCallback((conn: CexConnection) => {
        setConnections(prev => {
            const updated = [...prev.filter(c => c.id !== conn.id), conn];
            persist(updated);
            return updated;
        });
    }, [persist]);

    const removeConnection = useCallback(async (id: string) => {
        // Previously this only removed the entry from localStorage —
        // the server-side cex_connections row (and its encrypted API key)
        // stayed live and kept being usable/refreshable server-side even
        // after the user "disconnected" it in the UI.
        try {
            await api.delete(`/api/cex/connections/${id}`);
        } catch (err) {
            console.warn('[useCexConnections] Server-side disconnect failed, removing locally anyway:', err);
        }
        setConnections(prev => {
            const updated = prev.filter(c => c.id !== id);
            persist(updated);
            return updated;
        });
    }, [persist]);

    /**
     * Real CEX connection flow — calls the backend (src/controllers/
     * cexController.js, using ccxt for real signed exchange balance reads).
     *
     * Per the platform integration contract, the correct endpoint is
     * POST /api/cex/connections (not the deprecated /api/cex/connect
     * alias), and the response balances already carry real priceUSD/
     * valueUSD computed server-side.
     */
    const connectExchange = useCallback(async (
        exchangeInfo: { id: string; name: string; icon: string },
        apiKey: string,
        secret: string
    ): Promise<CexConnection> => {
        const res = await api.post('/api/cex/connections', {
            exchangeId: exchangeInfo.id,
            apiKey,
            secret,
        });

        if (!res.data?.verified) {
            throw new Error(res.data?.message || 'Could not verify this API key with the exchange.');
        }

        const balances: CexAsset[] = (res.data.balances || []).map((row: any) => toAsset(row, exchangeInfo.name));
        const totalUsd = balances.reduce((total, asset) => total + asset.value, 0);
        const serverConnectionId: string = res.data.connection?.id || exchangeInfo.id;

        const conn: CexConnection = {
            id: serverConnectionId,
            name: exchangeInfo.name,
            icon: exchangeInfo.icon,
            apiKey: apiKey.substring(0, 4) + '••••',
            balance: totalUsd,
            balances,
            isConnected: true,
            lastSynced: Date.now(),
            status: 'CONNECTED',
        };
        addConnection(conn);
        return conn;
    }, [addConnection]);

    /**
     * Rehydrate saved exchange connections from the server and pull fresh
     * balances. Previously this hook only ever knew about connections
     * created in the CURRENT browser's localStorage — the backend has
     * supported GET /api/cex/connections and GET /api/cex/balances since
     * the security patch, but nothing on the frontend called them, so
     * switching browsers/devices (or just clearing site data) silently
     * lost every linked exchange even though the server-side encrypted
     * credentials were still there. This also means balances were frozen
     * at whatever they were at connect-time — no background refresh.
     */
    const refreshConnections = useCallback(async () => {
        try {
            localStorage.removeItem('alphabag_cex_connections');
            const [connectionsRes, balancesRes] = await Promise.all([
                api.get('/api/cex/connections'),
                api.get('/api/cex/balances'),
            ]);

            const serverConnections: Array<{ id: string; exchangeId: string; status: string; lastSyncedAt: string | null }> =
                connectionsRes.data?.connections || [];
            const balanceRows: Array<{ connectionId: string; exchange: string; symbol: string; name?: string; balance: string; priceUSD?: number; valueUSD?: number }> =
                balancesRes.data?.balances || [];

            const next: CexConnection[] = serverConnections.map((sc) => {
                const rows = balanceRows.filter((b) => b.connectionId === sc.id);
                const exchangeName = nameFor(sc.exchangeId);
                const balances = rows.map((row) => toAsset(row, exchangeName));
                const balance = balances.reduce((sum, a) => sum + a.value, 0);
                return {
                    id: sc.id,
                    name: exchangeName,
                    icon: iconFor(sc.exchangeId),
                    apiKey: '••••••••',
                    balance,
                    balances,
                    isConnected: sc.status === 'CONNECTED',
                    status: sc.status as 'CONNECTED' | 'ERROR',
                    lastSynced: sc.lastSyncedAt ? new Date(sc.lastSyncedAt).getTime() : Date.now(),
                };
            });

            persist(next);
        } catch (err) {
            // Leave whatever we already have (e.g. from localStorage) in
            // place rather than wiping the dashboard on a transient
            // network error.
            console.warn('[useCexConnections] Failed to refresh CEX connections:', err);
        }
    }, [persist]);

    useEffect(() => {
        refreshConnections();
        refreshTimer.current = setInterval(refreshConnections, REFRESH_INTERVAL_MS);
        return () => {
            if (refreshTimer.current) clearInterval(refreshTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalBalance = connections.reduce((acc, c) => acc + c.balance, 0);

    return { connections, addConnection, removeConnection, connectExchange, refreshConnections, totalBalance };
}
