
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_CEX} from '../services/exchanges';

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

const toAsset = (row: { symbol: string; name?: string; balance: string | number; priceUSD?: number; valueUSD?: number; exchange?: string }, exchangeName: string): CexAsset => ({
    symbol: row.symbol,
    name: row.name || row.symbol,
    balance: Number(row.balance || 0),
    price: Number(row.priceUSD || 0),
    value: Number(row.valueUSD ?? (Number(row.balance || 0) * Number(row.priceUSD || 0))),
    exchange: row.exchange || exchangeName,
});

export function useCexConnections() {
    const { isAuthenticated, token } = useAuth();
    const [connections, setConnections] = useState<CexConnection[]>([]);
    const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const persist = useCallback((updated: CexConnection[]) => {
        setConnections(updated);
    }, []);

    const addConnection = useCallback((conn: CexConnection) => {
        setConnections(prev => {
            const updated = [...prev.filter(c => c.id !== conn.id), conn];
            persist(updated);
            return updated;
        });
    }, [persist]);

    const removeConnection = useCallback(async (id: string) => {
        // Require confirmed server-api deletion before wiping from local state
        await api.delete('/api/cex/connections/' + id);
        setConnections(prev => {
            const updated = prev.filter(c => c.id !== id);
            persist(updated);
            return updated;
        });
    }, [persist]);

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
            apiKey: apiKey.substring(0, 4) + '\u2022\u2022\u2022\u2022',
            balance: totalUsd,
            balances,
            isConnected: true,
            lastSynced: Date.now(),
            status: 'CONNECTED',
        };
        addConnection(conn);
        return conn;
    }, [addConnection]);

    const refreshConnections = useCallback(async () => {
        if (!isAuthenticated && !token) {
            setConnections([]);
            return;
        }
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
                    apiKey: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
                    balance,
                    balances,
                    isConnected: sc.status === 'CONNECTED',
                    status: sc.status as 'CONNECTED' | 'ERROR',
                    lastSynced: sc.lastSyncedAt ? new Date(sc.lastSyncedAt).getTime() : Date.now(),
                };
            });

            persist(next);
        } catch (err) {
            console.warn('[useCexConnections] Failed to refresh CEX connections:', err);
        }
    }, [isAuthenticated, token, persist]);

    useEffect(() => {
        if (isAuthenticated || token) {
            refreshConnections();
            refreshTimer.current = setInterval(refreshConnections, REFRESH_INTERVAL_MS);
        } else {
            setConnections([]);
        }
        return () => {
            if (refreshTimer.current) clearInterval(refreshTimer.current);
        };
    }, [isAuthenticated, token, refreshConnections]);


    const totalBalance = connections.reduce((acc, c) => acc + c.balance, 0);

    return { connections, addConnection, removeConnection, connectExchange, refreshConnections, totalBalance };
}
