import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, Filter, Search, ArrowUpRight, Flame, Globe, ExternalLink, RefreshCw, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useDebounce } from '../../components/hooks/useDebounce';
import { DataSourceBadge } from '../../components/ui/DataSourceBadge';

interface DexPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceUsd: string;
    priceNative: string;
    txns?: {
        h24: { buys: number; sells: number };
    };
    volume: {
        h24: number;
    };
    priceChange: {
        m5?: number;
        h1?: number;
        h6?: number;
        h24?: number;
    };
    liquidity?: {
        usd?: number;
    };
    fdv?: number;
}

export const AlphaScreener: React.FC = () => {
    const [search, setSearch] = useState('');
    const [chainFilter, setChainFilter] = useState<'ALL' | 'SOLANA' | 'ETHEREUM' | 'BSC' | 'BASE'>('ALL');
    const [timeframe, setTimeframe] = useState<'m5' | 'h1' | 'h6' | 'h24'>('h24');
    const [pairs, setPairs] = useState<DexPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [searchedPair, setSearchedPair] = useState<DexPair | null>(null);
    const [searchingCa, setSearchingCa] = useState(false);

    const debouncedSearch = useDebounce(search, 300);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setIsRefreshing(true);
        try {
            // Fetch multiple queries in parallel to get a wide variety of trending pairs
            // Generic keywords like popular base/quote assets on main chains
            const queries = ['USDT', 'USDC', 'SOL', 'WBNB', 'WETH'];
            const promises = queries.map(q =>
                fetch(`https://api.dexscreener.com/latest/dex/search?q=${q}`)
                    .then(res => res.json())
                    .catch(() => ({ pairs: [] }))
            );

            const results = await Promise.all(promises);
            let allPairs: DexPair[] = results.flatMap(r => r.pairs || []);

            // Deduplicate by pairAddress to prevent copies
            const seen = new Set<string>();
            const uniquePairs = allPairs.filter(p => {
                if (!p.pairAddress) return false;
                const key = p.pairAddress.toLowerCase();
                const duplicate = seen.has(key);
                seen.add(key);
                return !duplicate;
            });

            // Filter out pairs with very low liquidity (dust or test tokens)
            const cleanPairs = uniquePairs.filter(p => p.liquidity?.usd && p.liquidity.usd >= 2000);
            setPairs(cleanPairs);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (error) {
            console.error("Failed to fetch DexScreener gainers:", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Load trending pairs on mount or when chain changes
    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadData(true);
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadData(true);
            }
        }, 90000);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            clearInterval(interval);
        };
    }, [loadData]);

    // Contract address search lookup
    useEffect(() => {
        const lookupCa = async () => {
            const trimmed = debouncedSearch.trim();
            // Contract address detection (length check for BSC/ETH/SOL addresses)
            if (trimmed.length >= 32) {
                setSearchingCa(true);
                try {
                    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${trimmed}`);
                    const data = await res.json();
                    if (data.pairs && data.pairs.length > 0) {
                        // Use the highest liquidity pair found for this contract
                        const sortedPairs = [...data.pairs].sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
                        setSearchedPair(sortedPairs[0]);
                    } else {
                        setSearchedPair(null);
                    }
                } catch (err) {
                    console.error("CA lookup failed", err);
                    setSearchedPair(null);
                } finally {
                    setSearchingCa(false);
                }
            } else {
                setSearchedPair(null);
            }
        };

        lookupCa();
    }, [debouncedSearch]);

    // Format helpers
    const formatUsd = (val?: number) => {
        if (val === undefined || val === null) return 'TBA';
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
        if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
        return `$${val.toFixed(2)}`;
    };

    const formatPriceChange = (val?: number) => {
        if (val === undefined || val === null) return '0.00%';
        const prefix = val >= 0 ? '+' : '';
        return `${prefix}${val.toFixed(2)}%`;
    };

    const getChainColor = (chain: string) => {
        const c = chain.toLowerCase();
        if (c === 'solana') return 'from-[#9945FF] to-[#14F195] text-black';
        if (c === 'bsc') return 'from-[#F3BA2F] to-[#D89F0E] text-black';
        if (c === 'base') return 'from-[#0052FF] to-[#003DC6] text-white';
        if (c === 'ethereum') return 'from-[#627EEA] to-[#3B4E99] text-white';
        return 'from-[#848e9c] to-[#474d57] text-white';
    };

    // Filter and Sort pairs
    const getFilteredAndSorted = useCallback(() => {
        let list = [...pairs];

        // Chain Filter
        if (chainFilter !== 'ALL') {
            const filterKey = chainFilter === 'SOLANA' ? 'solana' :
                              chainFilter === 'ETHEREUM' ? 'ethereum' :
                              chainFilter === 'BSC' ? 'bsc' :
                              chainFilter === 'BASE' ? 'base' : '';
            list = list.filter(p => p.chainId?.toLowerCase() === filterKey);
        }

        // Search Filter (excluding CA lookup since it has its own display row)
        if (debouncedSearch && debouncedSearch.trim().length < 32) {
            const s = debouncedSearch.toLowerCase();
            list = list.filter(p => 
                p.baseToken?.symbol?.toLowerCase().includes(s) ||
                p.baseToken?.name?.toLowerCase().includes(s) ||
                p.chainId?.toLowerCase().includes(s) ||
                p.dexId?.toLowerCase().includes(s)
            );
        }

        // Sort by selected timeframe change descending (Gainers)
        list.sort((a, b) => {
            const valA = a.priceChange?.[timeframe] || 0;
            const valB = b.priceChange?.[timeframe] || 0;
            return valB - valA;
        });

        return list;
    }, [pairs, chainFilter, debouncedSearch, timeframe]);

    const displayedPairs = useMemo(() => getFilteredAndSorted(), [getFilteredAndSorted]);

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-semibold text-[#eaecef] tracking-tight flex items-center gap-2">
                            <Flame size={22} className="text-[#fcd535]" /> ALPHA SCREENER
                        </h1>
                        <span className="bg-[#fcd535]/15 text-[#fcd535] text-[9px] font-black uppercase px-2 py-1 rounded border border-[#fcd535]/25 tracking-widest flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-[#fcd535] rounded-full"></span>
                            DEX GAINERS
                        </span>
                        <DataSourceBadge />
                        {lastUpdated && (
                            <span className="text-[10px] text-[#848e9c] font-medium hidden sm:inline">
                                Last synced: {lastUpdated}
                            </span>
                        )}
                    </div>
                    <p className="text-[#848e9c] text-xs">Real-time trending data on-chain directly from DexScreener markets.</p>
                </div>
                
                {/* ── Search & Actions ── */}
                <div className="flex items-center space-x-2 self-start md:self-auto w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
                        <input 
                            type="text"
                            placeholder="Token Symbol or paste CA..."
                            className="bg-[#0b0e11] border border-[#2b3139] rounded-md py-2 pl-9 pr-4 text-xs text-[#eaecef] focus:border-[#fcd535] outline-none w-full md:w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => loadData(true)} 
                        disabled={isRefreshing}
                        className="border border-[#2b3139] text-[#848e9c] h-8 px-3 rounded-md bg-[#1e2329] hover:bg-[#2b3139] hover:text-white transition-all flex items-center justify-center gap-1 shrink-0"
                        title="Sync Live Data"
                    >
                        <RefreshCw size={13} className={`shrink-0 ${isRefreshing ? 'animate-spin text-[#fcd535]' : ''}`} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Sync</span>
                    </button>
                </div>
            </div>

            {/* ── Filters (Chain & Timeframe) ── */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-[#1e2329] border border-[#2b3139] rounded-lg p-3">
                {/* Chains */}
                <div className="flex flex-wrap gap-1.5">
                    {(['ALL', 'SOLANA', 'ETHEREUM', 'BSC', 'BASE'] as const).map(chain => (
                        <button
                            key={chain}
                            onClick={() => setChainFilter(chain)}
                            className={`h-7 px-3.5 text-[9px] font-black uppercase tracking-wider rounded transition-all border ${
                                chainFilter === chain 
                                    ? 'bg-[#fcd535] border-[#fcd535] text-black font-extrabold shadow-md' 
                                    : 'bg-[#181a20] border-[#2b3139] text-[#848e9c] hover:bg-[#2b3139] hover:text-white'
                            }`}
                        >
                            {chain}
                        </button>
                    ))}
                </div>

                {/* Timeframes */}
                <div className="flex gap-1.5 self-end sm:self-auto">
                    {(['m5', 'h1', 'h6', 'h24'] as const).map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`h-7 px-3 text-[9px] font-black uppercase tracking-wider rounded transition-all border ${
                                timeframe === tf 
                                    ? 'bg-[#2b3139] border-[#fcd535] text-[#fcd535]' 
                                    : 'bg-[#181a20] border-[#2b3139] text-[#848e9c] hover:bg-[#2b3139] hover:text-white'
                            }`}
                        >
                            {tf === 'm5' ? '5M' : tf.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Highlighted Specific CA Lookup Result ── */}
            {searchingCa && (
                <div className="bg-[#1e2329] border border-dashed border-[#fcd535]/30 rounded-lg p-4 text-center">
                    <div className="w-5 h-5 border-2 border-[#fcd535] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-[10px] text-[#848e9c] font-black uppercase tracking-wider">Querying blockchain for contract address details...</p>
                </div>
            )}
            
            {!searchingCa && searchedPair && (
                <div className="bg-[#fcd535]/5 border-2 border-[#fcd535]/30 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="text-[9px] text-[#fcd535] font-black uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                        <Globe size={11} />
                        FOUND VIA DIRECT BLOCKCHAIN CA LOOKUP
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#fcd535] text-black rounded flex items-center justify-center font-black text-sm">
                                {searchedPair.baseToken.symbol?.[0] || 'T'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-base">{searchedPair.baseToken.name}</span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded bg-gradient-to-r ${getChainColor(searchedPair.chainId)}`}>
                                        {searchedPair.chainId.toUpperCase()}
                                    </span>
                                    <span className="text-[9px] text-alphabag-muted bg-[#2b3139] px-1.5 py-0.5 rounded font-semibold uppercase">{searchedPair.dexId}</span>
                                </div>
                                <div className="text-xs text-alphabag-muted font-mono mt-0.5">{searchedPair.baseToken.address}</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm">
                            <div>
                                <div className="text-[10px] text-alphabag-muted font-bold uppercase tracking-wider">Price</div>
                                <div className="font-mono font-bold text-white mt-0.5">${Number(searchedPair.priceUsd) < 0.01 ? Number(searchedPair.priceUsd).toFixed(8) : Number(searchedPair.priceUsd).toFixed(4)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-alphabag-muted font-bold uppercase tracking-wider">{timeframe === 'm5' ? '5m' : timeframe.toUpperCase()} Change</div>
                                <div className={`font-mono font-bold mt-0.5 ${Number(searchedPair.priceChange?.[timeframe] || 0) >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                    {formatPriceChange(searchedPair.priceChange?.[timeframe])}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-alphabag-muted font-bold uppercase tracking-wider">Liquidity</div>
                                <div className="font-mono font-bold text-white mt-0.5">{formatUsd(searchedPair.liquidity?.usd)}</div>
                            </div>
                            <button
                                onClick={() => window.open(searchedPair.url, '_blank')}
                                className="bg-[#fcd535] text-black hover:bg-[#e0bd2e] h-9 px-4 rounded font-black text-xs uppercase tracking-widest transition-all self-center flex items-center gap-1.5 shadow-md shadow-[#fcd535]/10 active:scale-[0.98]"
                            >
                                <ExternalLink size={12} />
                                Trade Token
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Gainers Table ── */}
            <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-[#2b3139] bg-[#0b0e11]">
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#848e9c] w-14 text-center"># Rank</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#848e9c] w-64">Token</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#848e9c] text-right">Price (USD)</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#848e9c] text-right">{timeframe === 'm5' ? '5M' : timeframe.toUpperCase()} Change</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#848e9c] text-right">24H Volume</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#848e9c] text-right">Liquidity</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#848e9c] text-right">FDV</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#848e9c] w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2b3139] text-[13px]">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-20 text-center text-alphabag-subtext">
                                        <div className="w-8 h-8 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-[10px] text-[#848e9c] font-black uppercase tracking-[0.2em] animate-pulse">Synchronizing DexScreener Live Feeds...</p>
                                    </td>
                                </tr>
                            ) : displayedPairs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-20 text-center text-alphabag-subtext">
                                        <p className="text-[10px] text-[#848e9c] font-black uppercase tracking-[0.2em]">No trading pairs matched filters</p>
                                    </td>
                                </tr>
                            ) : (
                                displayedPairs.map((pair, index) => (
                                    <tr key={pair.pairAddress} className="hover:bg-[#2b3139]/40 transition-colors group">
                                        <td className="px-4 py-3 font-mono text-[12px] text-[#848e9c] text-center font-bold">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-alphabag-black border border-white/5 rounded flex items-center justify-center font-black text-alphabag-yellow relative overflow-hidden text-xs shrink-0">
                                                    {pair.baseToken?.symbol?.[0] || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-bold text-white text-[13px] uppercase tracking-tight truncate max-w-[120px]">{pair.baseToken?.symbol}</span>
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none bg-gradient-to-r ${getChainColor(pair.chainId)}`}>
                                                            {pair.chainId?.toUpperCase()}
                                                        </span>
                                                        <span className="text-[8px] text-[#848e9c] bg-[#2b3139] px-1 rounded leading-none py-0.5 font-semibold uppercase">{pair.dexId}</span>
                                                    </div>
                                                    <div className="text-[10px] text-alphabag-muted truncate max-w-[180px] mt-0.5">{pair.baseToken?.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs font-bold text-white tabular-nums">
                                            ${Number(pair.priceUsd) < 0.01 ? Number(pair.priceUsd).toFixed(8) : Number(pair.priceUsd).toFixed(4)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs font-bold tabular-nums">
                                            <span className={Number(pair.priceChange?.[timeframe] || 0) >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}>
                                                {formatPriceChange(pair.priceChange?.[timeframe])}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs text-[#eaecef] tabular-nums">
                                            {formatUsd(pair.volume?.h24)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs text-[#eaecef] tabular-nums">
                                            {formatUsd(pair.liquidity?.usd)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs text-[#848e9c] tabular-nums">
                                            {formatUsd(pair.fdv)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => window.open(pair.url, '_blank')}
                                                className="p-1.5 text-[#fcd535] hover:text-black hover:bg-[#fcd535] transition-all border border-[#fcd535]/30 hover:border-[#fcd535] rounded opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                title="View on DexScreener"
                                            >
                                                <ArrowUpRight size={13} strokeWidth={2.5} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
