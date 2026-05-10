import React, { useState, useEffect, useCallback } from 'react';
import { Rocket, Clock, DollarSign, ExternalLink, RefreshCw, ArrowUpRight, Zap, Users, TrendingUp, Plus, Timer, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Swal from 'sweetalert2';

interface Pair {
    id: string;
    dexId: string;
    baseToken: { address: string; name: string; symbol: string };
    quoteToken: { symbol: string; address: string };
    priceUsd: string;
    priceChange: { m5: number; h1: number; h6: number; h24: number };
    volume: { h24: number; h6: number; h1: number; m5: number };
    liquidity: { usd: number };
    chainId: string;
    pairCreatedAt: number;
    url: string;
    fdv?: number;
    isBoosted?: boolean;
    isCommunity?: boolean;
    boostExpiry?: string;
}

type TabType = 'trending' | 'community';
type ChainFilter = 'bsc' | 'eth' | 'sol' | 'all';

const CHAIN_LABELS: Record<ChainFilter, string> = {
    bsc: 'BSC', eth: 'ETH', sol: 'SOL', all: 'ALL'
};

const timeAgo = (ts: number) => {
    if (!ts) return 'N/A';
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
};

const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K`
    : `$${n.toFixed(0)}`;

export const LivePairs: React.FC = () => {
    const { user, token } = useAuth();

    const [tab, setTab] = useState<TabType>('trending');
    const [chain, setChain] = useState<ChainFilter>('bsc');
    const [trendingPairs, setTrendingPairs] = useState<Pair[]>([]);
    const [communityPairs, setCommunityPairs] = useState<Pair[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cooldown, setCooldown] = useState<{ canSubmit: boolean; nextAvailableAt: string | null } | null>(null);

    const isPremium = user?.tier === 'ULTIMATE';

    // ─── Fetch trending from backend proxy ───────────────────────────────────
    const fetchTrending = useCallback(async (chainVal: ChainFilter) => {
        setRefreshing(true);
        try {
            const res = await api.get(`/api/live-pairs/trending?chain=${chainVal}`);
            const data = res.data;
            if (data.success) setTrendingPairs(data.pairs || []);
        } catch (e) {
            console.error('[LivePairs] Trending fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // ─── Fetch community submissions ─────────────────────────────────────────
    const fetchCommunity = useCallback(async () => {
        try {
            const res = await api.get('/api/live-pairs');
            const data = res.data;
            if (data.success && Array.isArray(data.pairs)) {
                // Re-enrich each stored CA via community list (no extra DexScreener call needed — data stored on submit)
                setCommunityPairs(data.pairs.map((p: any) => ({
                    id: p.id,
                    dexId: 'community',
                    baseToken: { address: p.contractAddress, name: p.name || p.symbol, symbol: p.symbol },
                    quoteToken: { symbol: 'BNB', address: '' },
                    priceUsd: p.priceUsd || '0',
                    priceChange: { m5: 0, h1: 0, h6: 0, h24: 0 },
                    volume: { h24: 0, h6: 0, h1: 0, m5: 0 },
                    liquidity: { usd: p.liquidity || 0 },
                    chainId: p.chainId || 'bsc',
                    pairCreatedAt: new Date(p.createdAt).getTime(),
                    url: p.dexUrl || `https://dexscreener.com/${p.chainId || 'bsc'}/${p.contractAddress}`,
                    isCommunity: true,
                    isBoosted: p.isBoosted,
                    boostExpiry: p.boostExpiry
                })));
            }
        } catch (e) {
            console.error('[LivePairs] Community fetch error:', e);
        }
    }, []);

    // ─── Fetch cooldown ──────────────────────────────────────────────────────
    const fetchCooldown = useCallback(async () => {
        if (!token || !isPremium) return;
        try {
            const res = await api.get('/api/live-pairs/cooldown');
            setCooldown(res.data);
        } catch (e) {}
    }, [token, isPremium]);

    useEffect(() => {
        fetchTrending(chain);
        fetchCommunity();
        fetchCooldown();
        const interval = setInterval(() => fetchTrending(chain), 60_000); // refresh every 60s
        return () => clearInterval(interval);
    }, [chain]);

    // ─── Submit community pair ───────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!isPremium) {
            Swal.fire({
                title: 'Premium Required',
                text: 'Connect your wallet to unlock Community Alpha submissions.',
                icon: 'warning',
                background: '#0B0E11', color: '#EAECEF',
                confirmButtonColor: '#FCD535'
            });
            return;
        }

        if (cooldown && !cooldown.canSubmit && cooldown.nextAvailableAt) {
            const d = new Date(cooldown.nextAvailableAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
            Swal.fire({
                title: 'Submission Cooldown Active',
                text: `Your next Community Alpha slot opens on ${d}. Premium holders get 1 submission per 30 days.`,
                icon: 'info',
                background: '#0B0E11', color: '#EAECEF',
                confirmButtonColor: '#FCD535'
            });
            return;
        }

        const { value: ca } = await Swal.fire({
            title: '🔍 Submit Alpha Pair',
            html: `<div style="color:#848E9C;font-size:12px;margin-bottom:12px">Paste the contract address of the BSC/ETH token you want to nominate. Must have ≥$5,000 liquidity on DexScreener.</div>`,
            input: 'text',
            inputLabel: 'Contract Address',
            inputPlaceholder: '0x...',
            background: '#0B0E11', color: '#EAECEF',
            confirmButtonText: 'Verify & Submit',
            confirmButtonColor: '#FCD535',
            showCancelButton: true,
            inputValidator: (v) => {
                if (!v || v.trim().length < 32) return 'Please enter a valid contract address';
                if (v.includes('http') || v.includes('dexscreener')) return 'Paste the CA only — no URLs';
            }
        });

        if (!ca) return;

        Swal.fire({ title: 'Indexing via DexScreener...', allowOutsideClick: false, background: '#0B0E11', color: '#EAECEF', didOpen: () => Swal.showLoading() });

        try {
            const res = await api.post('/api/live-pairs/submit', { contractAddress: ca.trim() });
            const data = res.data;

            Swal.fire({ title: 'Alpha Pair Listed!', text: data.message, icon: 'success', background: '#0B0E11', color: '#EAECEF', confirmButtonColor: '#FCD535' });
            fetchCommunity();
            fetchCooldown();
            setTab('community');
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Could not reach indexing servers.';
            Swal.fire({ title: 'Submission Failed', text: errorMsg, icon: 'error', background: '#0B0E11', color: '#EAECEF', confirmButtonColor: '#FCD535' });
        }
    };

    // ─── Boost community pair ────────────────────────────────────────────────
    const handleBoost = async (id: string) => {
        if (!isPremium) {
            Swal.fire({
                title: 'Premium Required',
                text: 'Connect your wallet to unlock Community Alpha boosting.',
                icon: 'warning',
                background: '#0B0E11', color: '#EAECEF',
                confirmButtonColor: '#FCD535'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Boost this Alpha?',
            text: 'For the Testnet phase, boosting is completely free! This will pin the token to the top of the Community Alpha feed for 3 days.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Boost Now',
            background: '#0B0E11', color: '#EAECEF',
            confirmButtonColor: '#FCD535'
        });

        if (result.isConfirmed) {
            try {
                Swal.fire({ title: 'Boosting...', allowOutsideClick: false, background: '#0B0E11', color: '#EAECEF', didOpen: () => Swal.showLoading() });
                const res = await api.post(`/api/live-pairs/boost/${id}`);
                const data = res.data;
                
                Swal.fire({ title: 'Boosted!', text: data.message, icon: 'success', background: '#0B0E11', color: '#EAECEF', confirmButtonColor: '#FCD535' });
                fetchCommunity();
            } catch (err: any) {
                const errorMsg = err.response?.data?.error || 'Could not reach the server.';
                Swal.fire({ title: 'Boost Failed', text: errorMsg, icon: 'error', background: '#0B0E11', color: '#EAECEF', confirmButtonColor: '#FCD535' });
            }
        }
    };

    const displayPairs = tab === 'trending' ? trendingPairs : communityPairs;

    return (
        <div className="space-y-6">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                        Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">Pairs</span>
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
                        </span>
                    </h1>
                    <p className="text-alphabag-subtext text-sm mt-1">Real-time DexScreener firehose + community alpha picks.</p>
                </div>

                <Button
                    variant="outline" size="sm"
                    onClick={() => tab === 'trending' ? fetchTrending(chain) : fetchCommunity()}
                    disabled={refreshing}
                    className="border-white/5 text-alphabag-subtext gap-2 self-start md:self-auto"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
                </Button>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-2xl p-1.5">
                <button
                    onClick={() => setTab('trending')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                        tab === 'trending'
                            ? 'bg-alphabag-yellow text-black shadow-[0_0_20px_rgba(252,213,53,0.2)]'
                            : 'text-alphabag-subtext hover:text-white'
                    }`}
                >
                    <TrendingUp size={13} /> Live Firehose
                </button>
                <button
                    onClick={() => setTab('community')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                        tab === 'community'
                            ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                            : 'text-alphabag-subtext hover:text-white'
                    }`}
                >
                    <Users size={13} /> Community Alpha
                    {communityPairs.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[8px]">{communityPairs.length}</span>
                    )}
                </button>
            </div>

            {/* ── Chain Filter (Trending only) ────────────────────────────────── */}
            {tab === 'trending' && (
                <div className="flex items-center gap-2">
                    {(['all', 'bsc', 'eth', 'sol'] as ChainFilter[]).map(c => (
                        <button
                            key={c}
                            onClick={() => { setChain(c); setLoading(true); }}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                                chain === c
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'border-white/5 text-alphabag-subtext hover:border-white/10 hover:text-white'
                            }`}
                        >
                            {CHAIN_LABELS[c]}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Community Submission Banner ─────────────────────────────────── */}
            {tab === 'community' && (
                <div className={`glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${isPremium ? 'border-blue-500/20 bg-blue-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-inner ${isPremium ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/10 text-alphabag-muted'}`}>
                            {isPremium ? <Zap size={18} /> : <Rocket size={18} />}
                        </div>
                        <div>
                            <div className="text-sm font-black text-white uppercase tracking-tight">
                                {isPremium ? 'Community Alpha Submission' : 'Premium Feature'}
                            </div>
                            {isPremium && cooldown ? (
                                cooldown.canSubmit ? (
                                    <div className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                                        <CheckCircle size={10} /> Slot available — nominate your alpha pick
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-alphabag-muted font-bold flex items-center gap-1">
                                        <Timer size={10} /> Next slot: {new Date(cooldown.nextAvailableAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                                    </div>
                                )
                            ) : (
                                <div className="text-[10px] text-alphabag-muted font-bold">
                                    {isPremium ? 'Checking cooldown...' : 'Connect wallet to unlock 1 submission per month'}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className={`flex items-center gap-2 font-black uppercase tracking-widest text-[10px] h-9 px-6 rounded-lg whitespace-nowrap active:scale-95 transition-all ${
                            isPremium && cooldown?.canSubmit
                                ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-blue-400'
                                : 'bg-white/5 text-alphabag-muted border border-white/10 hover:border-white/20'
                        }`}
                    >
                        <Plus size={12} /> Submit CA
                    </button>
                </div>
            )}

            {/* ── Pair Grid ──────────────────────────────────────────────────── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="glass-panel p-6 h-52 animate-pulse bg-white/[0.02]" />
                    ))}
                </div>
            ) : displayPairs.length === 0 ? (
                <div className="glass-panel p-12 text-center">
                    <div className="text-alphabag-muted text-sm">
                        {tab === 'community' ? 'No community pairs submitted yet. Be the first to nominate an alpha pick.' : 'No pairs found. Try a different chain filter.'}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayPairs.map((pair, i) => <PairCard key={pair.id || i} pair={pair} onBoost={handleBoost} />)}
                </div>
            )}
        </div>
    );
};

// ─── Pair Card ────────────────────────────────────────────────────────────────
const PairCard = ({ pair, onBoost }: { pair: Pair; onBoost: (id: string) => void }) => {
    const change = pair.priceChange?.h24 ?? 0;
    const isUp = change >= 0;

    return (
        <div className="glass-panel p-5 hover:bg-white/[0.03] transition-all group border-white/5 relative overflow-hidden">

            {/* Background glow */}
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[50px] rounded-full pointer-events-none transition-all ${
                pair.isBoosted ? 'bg-alphabag-yellow/8 group-hover:bg-alphabag-yellow/15' :
                pair.isCommunity ? 'bg-blue-500/8 group-hover:bg-blue-500/15' :
                'bg-white/5 group-hover:bg-white/8'
            }`} />

            {/* Badge */}
            {(pair.isBoosted || pair.isCommunity) && (
                <div className={`absolute top-0 right-0 px-2.5 py-1 rounded-bl-xl z-20 flex items-center gap-1 border-b border-l ${
                    pair.isBoosted
                        ? 'bg-alphabag-yellow/20 border-alphabag-yellow/30'
                        : 'bg-blue-500/20 border-blue-500/30'
                }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${pair.isBoosted ? 'bg-alphabag-yellow' : 'bg-blue-400'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-widest ${pair.isBoosted ? 'text-alphabag-yellow' : 'text-blue-400'}`}>
                        {pair.isBoosted ? 'Boosted 3D' : 'Community'}
                    </span>
                </div>
            )}

            {/* Token Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                    <div className="w-10 h-10 shrink-0 bg-alphabag-black border border-white/10 rounded-xl flex items-center justify-center font-black text-alphabag-yellow shadow-inner">
                        {pair.baseToken?.symbol?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base tracking-tight truncate max-w-[120px]" title={pair.baseToken.symbol}>
                                {pair.baseToken.symbol}
                            </span>
                            <span className="text-[10px] text-alphabag-muted font-bold shrink-0">/{pair.quoteToken.symbol}</span>
                        </div>
                        <div className="text-[9px] font-black text-alphabag-muted uppercase tracking-[0.2em] truncate">
                            {pair.dexId || pair.chainId}
                        </div>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-sm font-black text-white tabular-nums">
                        ${parseFloat(pair.priceUsd || '0').toFixed(6)}
                    </div>
                    <div className={`text-[10px] font-bold tabular-nums ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {isUp ? '+' : ''}{change.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 mb-5 relative z-10">
                {[
                    { icon: <Clock size={11} className="text-alphabag-yellow" />, label: 'Launched', value: timeAgo(pair.pairCreatedAt) },
                    { icon: <DollarSign size={11} className="text-green-400" />, label: 'Liquidity', value: fmt(pair.liquidity?.usd || 0) },
                    { icon: <Rocket size={11} className="text-blue-400" />, label: '1H Volume', value: fmt(pair.volume?.h1 || 0) },
                    { icon: <Zap size={11} className="text-alphabag-yellow" />, label: 'FDV', value: fmt(pair.fdv || 0) },
                ].map(({ icon, label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                        <span className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest flex items-center gap-1.5">
                            {icon} {label}
                        </span>
                        <span className="text-[11px] font-bold text-white tabular-nums">{value}</span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div className="flex gap-2 relative z-10">
                <button
                    onClick={() => window.open(pair.url || `https://dexscreener.com/${pair.chainId}/${pair.baseToken.address}`, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-alphabag-yellow text-black font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs rounded-xl hover:bg-yellow-400 active:scale-95 transition-all shadow-[0_0_20px_rgba(252,213,53,0.15)]"
                >
                    <ArrowUpRight size={16} /> VIEW TOKEN
                </button>
                {pair.isCommunity && !pair.isBoosted && (
                    <button
                        onClick={() => onBoost(pair.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-transparent border border-alphabag-yellow text-alphabag-yellow font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs rounded-xl hover:bg-alphabag-yellow/10 active:scale-95 transition-all"
                    >
                        <Zap size={14} /> Boost
                    </button>
                )}
            </div>
        </div>
    );
};
