import React, { useState, useEffect } from 'react';
import { Rocket, Clock, DollarSign, ExternalLink, RefreshCw, AlertCircle, ArrowUpRight, Search, Filter, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

interface Pair {
    id: string;
    dexId: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        symbol: string;
        address: string;
    };
    priceUsd: string;
    priceChange: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    volume: {
        h24: number;
        h6: number;
        h1: number;
        m5: number;
    };
    liquidity: {
        usd: number;
    };
    chainId: string;
    pairCreatedAt: number;
    url: string;
    fdv?: number;
    totalSupply?: string;
    boosted?: boolean;
    isCommunity?: boolean;
}

export const LivePairs: React.FC = () => {
    const { premiumTokenBalance } = useWallet();
    const { user } = useAuth();
    const [pairs, setPairs] = useState<Pair[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPairs = async () => {
        setRefreshing(true);
        try {
            // 1. Fetch native firehose
            const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=bsc');
            const data = await response.json();
            
            // 2. Filter firehose
            const sortedPairs = (data.pairs || [])
                .filter((p: any) => p.chainId === 'bsc' && p.pairCreatedAt)
                .sort((a: any, b: any) => b.pairCreatedAt - a.pairCreatedAt);

            // 3. Fetch community DB pairs explicitly
            let communityPairs: any[] = [];
            try {
                const dbRes = await fetch('http://localhost:3003/api/live-pairs');
                const dbTrans = await dbRes.json();
                const communityCAs = dbTrans.pairs ? dbTrans.pairs.map((p: any) => p.contractAddress).join(',') : '';
                
                if (communityCAs) {
                    const commRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${communityCAs}`);
                    const commData = await commRes.json();
                    communityPairs = (commData.pairs || []).map((p: any) => ({ ...p, isCommunity: true }));
                }
            } catch (e) {
                console.error('Core routing error fetching community pairs:', e);
            }

            // Combine and prioritize community pairs
            const finalPairs = [...communityPairs, ...sortedPairs].slice(0, 24);
            setPairs(finalPairs);
        } catch (error) {
            console.error('Failed to fetch live pairs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const submitAlphaPair = async () => {
        if (premiumTokenBalance < 100000) {
            Swal.fire({
                title: 'Insufficient Locked Tokens',
                text: 'Only verified holders can add Alpha Pairs to the terminal.',
                icon: 'warning',
                background: '#1E2329', color: '#FFF'
            });
            return;
        }

        const { value: ca } = await Swal.fire({
            title: 'Submit Alpha Pair CA',
            input: 'text',
            inputLabel: 'Contract Address (No URLs allowed)',
            inputPlaceholder: '0x...',
            background: '#1E2329', color: '#FFF',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value || value.length < 32) return 'Invalid CA Format';
            }
        });

        if (ca) {
            Swal.fire({ title: 'Indexing CA cross-chain...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            try {
                const res = await fetch('http://localhost:3003/api/live-pairs/submit', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}` 
                    },
                    body: JSON.stringify({ contractAddress: ca })
                });
                const responseData = await res.json();
                
                if (res.ok) {
                    Swal.fire({ title: 'Alpha Pair Synced!', text: 'Your pair was verified by DexScreener and posted.', icon: 'success' });
                    fetchPairs();
                } else {
                    Swal.fire({ title: 'Submission Failed', text: responseData.error, icon: 'error' });
                }
            } catch (error) {
                Swal.fire({ title: 'Network Error', text: 'Could not reach indexing servers.', icon: 'error' });
            }
        }
    };

    useEffect(() => {
        fetchPairs();
        const interval = setInterval(fetchPairs, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative flex items-center gap-3">
                        Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">Pairs</span>
                        <div className="px-2 py-0.5 bg-alphabag-red/10 border border-alphabag-red/20 rounded text-[10px] text-alphabag-red font-black uppercase tracking-widest not-italic flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-alphabag-red animate-pulse"></span> FIREHOSE
                        </div>
                    </h1>
                    <p className="text-alphabag-subtext text-sm mt-1">Real-time BSC liquidity deployment monitor.</p>
                </div>
                
                <div className="flex items-center space-x-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchPairs()} 
                        disabled={refreshing}
                        className="border-white/5 text-alphabag-subtext gap-2"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
                    </Button>
                </div>
            </div>



            {/* Community Pair Submission CTA */}
            <div className="glass-panel p-4 border-alphabag-blue/20 bg-blue-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                        <Search size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-black text-white uppercase tracking-tight">Community Alpha</div>
                        <div className="text-[10px] text-alphabag-muted font-bold">Verified holders can push contract addresses natively to the Firehose (1/month).</div>
                    </div>
                </div>
                <button 
                    className="bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] h-9 px-6 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] whitespace-nowrap active:scale-95 transition-transform"
                    onClick={submitAlphaPair}
                >
                    Submit CA
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="glass-panel p-6 h-48 animate-pulse bg-white/[0.02]"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pairs.map(pair => (
                        <PairCard key={pair.id} pair={pair} />
                    ))}
                </div>
            )}
        </div>
    );
};

const PairCard = ({ pair }: { pair: Pair }) => {
    const timeAgo = (timestamp: number) => {
        if (!timestamp) return 'N/A';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    return (
        <div className="glass-panel p-6 hover:bg-white/[0.03] transition-all group border-white/5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full pointer-events-none transition-all ${pair.isCommunity ? 'bg-blue-500/10 group-hover:bg-blue-500/20' : 'bg-alphabag-yellow/5 group-hover:bg-alphabag-yellow/10'}`}></div>
            
            {pair.isCommunity && (
                <div className="absolute top-0 right-0 px-2.5 py-1 bg-blue-500/20 border-b border-l border-blue-500/30 rounded-bl-xl z-20 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Community Pick</span>
                </div>
            )}

            <div className="flex justify-between items-start mb-4 relative z-10 w-full mb-6">
                <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3">
                    <div className="w-10 h-10 shrink-0 bg-alphabag-black border border-white/10 rounded-xl flex items-center justify-center font-black text-alphabag-yellow italic shadow-inner">
                        {pair.baseToken?.symbol?.[0] || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-base tracking-tight truncate max-w-[100px] sm:max-w-[140px]" title={pair.baseToken.symbol}>
                                {pair.baseToken.symbol}
                            </span>
                            <span className="text-[10px] text-alphabag-muted font-bold shrink-0">/ {pair.quoteToken.symbol}</span>
                            {/* Alpha Radar Boost Tiers */}
                            {pair.boosted && (
                                <div className="px-1.5 py-0.5 bg-alphabag-yellow text-black text-[8px] font-black rounded uppercase flex items-center gap-1 leading-none shrink-0">
                                    <Zap size={8} fill="currentColor" /> Boosted
                                </div>
                            )}
                        </div>
                        <div className="text-[9px] font-black text-alphabag-muted uppercase tracking-[0.2em] mt-0.5 truncate">{pair.dexId}</div>
                    </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                    <div className="text-sm font-black text-white tabular-nums">${parseFloat(pair.priceUsd).toFixed(6)}</div>
                    <div className={`text-[10px] font-bold tabular-nums flex items-center justify-end gap-1 ${pair.priceChange.h24 >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                        {pair.priceChange.h24 >= 0 ? '+' : ''}{pair.priceChange.h24}%
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-6 relative z-10">
                <div className="flex justify-between items-center py-2 border-b border-white/5 space-x-2">
                    <span className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                        <Clock size={12} className="text-alphabag-yellow" /> Launched
                    </span>
                    <span className="text-[11px] font-bold text-white uppercase truncate text-right min-w-0">{timeAgo(pair.pairCreatedAt)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5 space-x-2">
                    <span className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                        <DollarSign size={12} className="text-alphabag-green" /> Liquidity
                    </span>
                    <span className="text-[11px] font-bold text-white tabular-nums truncate text-right min-w-0">${(pair.liquidity?.usd || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5 space-x-2">
                    <span className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                        <Rocket size={12} className="text-alphabag-blue" /> 1H Vol
                    </span>
                    <span className="text-[11px] font-bold text-white tabular-nums truncate text-right min-w-0">${(pair.volume?.h1 || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5 space-x-2">
                    <span className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                        <Zap size={12} className="text-alphabag-yellow" /> Supply (FDV)
                    </span>
                    <span className="text-[11px] font-bold text-white tabular-nums truncate text-right min-w-0">${(pair.fdv || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 space-x-2">
                    <span className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                        <Search size={12} className="text-alphabag-muted" /> Total Supply
                    </span>
                    <span className="text-[11px] font-bold text-white tabular-nums truncate text-right min-w-0">
                        {pair.totalSupply || (pair.fdv && pair.priceUsd ? (pair.fdv / parseFloat(pair.priceUsd)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A')}
                    </span>
                </div>
            </div>

            <div className="flex gap-2 relative z-10">
                <Button 
                    size="sm" 
                    className="w-full bg-alphabag-yellow text-black font-black uppercase tracking-[0.2em] h-12 rounded-xl shadow-glow-yellow flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 text-xs"
                    onClick={() => window.open(pair.url || `https://dexscreener.com/bsc/${pair.baseToken.address}`, '_blank')}
                >
                    <ArrowUpRight size={18} /> BUY TOKEN
                </Button>
            </div>
        </div>
    );
};
