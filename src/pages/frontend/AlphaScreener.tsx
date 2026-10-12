import { ArrowUpRight,ExternalLink,Globe,RefreshCw,Search } from 'lucide-react';
import React,{ useCallback,useEffect,useMemo,useState } from 'react';
import { useDebounce } from '../../components/hooks/useDebounce';
import { DataSourceBadge } from '../../components/ui/DataSourceBadge';
import { PageIcon } from '../../components/ui/PageIcon';
import { api } from '../../services/api';

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
                api.get('/api/dex/search', { params: { q } }).then((r) => r.data)
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
                    const data = (await api.get(`/api/dex/tokens/${trimmed}`)).data;
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
        <div className="space-y-2 animate-in fade-in duration-700 screener-container">
            {/* ── Header ── */}
            <div className="page-header-card flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <PageIcon name="screener" size={40} />
                        <h1 className="text-2xl font-semibold text-alphabag-text tracking-tight flex items-center gap-2">
                            Alpha Screener
                        </h1>
                        <span className="bg-alphabag-yellow/15 text-alphabag-yellow text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border border-alphabag-yellow/25 flex items-center gap-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 bg-alphabag-yellow rounded-full"></span>
                            DEX Gainers
                        </span>
                        <DataSourceBadge />
                        {lastUpdated && (
                            <span className="text-[11px] text-alphabag-subtext font-medium hidden sm:inline num">
                                Last synced: {lastUpdated}
                            </span>
                        )}
                    </div>
                    <p className="text-alphabag-subtext text-xs">Real-time trending data on-chain directly from DexScreener markets.</p>
                </div>
                
                {/* ── Search & Actions ── */}
                <div className="flex items-center space-x-2 self-start md:self-auto w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext" />
                        <input 
                            type="text"
                            placeholder="Token symbol or paste CA..."
                            className="bg-alphabag-dark border border-alphabag-gray rounded-md py-2 pl-9 pr-4 text-xs text-alphabag-text focus:border-alphabag-yellow outline-none w-full md:w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => loadData(true)} 
                        disabled={isRefreshing}
                        className="border border-alphabag-gray text-alphabag-subtext h-8 px-3 rounded-md bg-alphabag-darkgray hover:bg-alphabag-gray hover:text-white transition-all flex items-center justify-center gap-1 shrink-0"
                        title="Sync Live Data"
                    >
                        <RefreshCw size={13} className={`shrink-0 ${isRefreshing ? 'animate-spin text-alphabag-yellow' : ''}`} />
                        <span className="text-xs font-semibold hidden sm:inline">Sync</span>
                    </button>
                </div>
            </div>
 
            {/* ── Filters (Chain & Timeframe) ── */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center bg-alphabag-darkgray border border-alphabag-gray rounded-lg p-3">
                {/* Chains */}
                <div className="flex flex-wrap gap-1.5">
                    {(['All', 'Solana', 'Ethereum', 'BSC', 'Base'] as const).map(chain => {
                        const filterVal = chain.toUpperCase() === 'ALL' ? 'ALL' : chain.toUpperCase() === 'SOLANA' ? 'SOLANA' : chain.toUpperCase() === 'ETHEREUM' ? 'ETHEREUM' : chain.toUpperCase() === 'BSC' ? 'BSC' : 'BASE';
                        return (
                            <button
                                key={chain}
                                onClick={() => setChainFilter(filterVal)}
                                className={`h-7 px-3.5 text-[11px] font-semibold rounded transition-all border ${
                                    chainFilter === filterVal 
                                        ? 'bg-alphabag-yellow border-alphabag-yellow text-black shadow-md' 
                                        : 'bg-alphabag-dark border-alphabag-gray text-alphabag-subtext hover:bg-alphabag-gray hover:text-white'
                                }`}
                            >
                                {chain}
                            </button>
                        );
                    })}
                </div>
 
                {/* Timeframes */}
                <div className="flex gap-1.5 self-end sm:self-auto">
                    {(['m5', 'h1', 'h6', 'h24'] as const).map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`h-7 px-3 text-[11px] font-semibold rounded transition-all border ${
                                timeframe === tf 
                                    ? 'bg-alphabag-gray border-alphabag-yellow text-alphabag-yellow' 
                                    : 'bg-alphabag-dark border-alphabag-gray text-alphabag-subtext hover:bg-alphabag-gray hover:text-white'
                            }`}
                        >
                            {tf === 'm5' ? '5m' : tf === 'h1' ? '1h' : tf === 'h6' ? '6h' : '24h'}
                        </button>
                    ))}
            </div>
            </div>

            {/* ── Highlighted Specific CA Lookup Result ── */}
            {searchingCa && (
                <div className="bg-[#181A20] border border-dashed border-alphabag-yellow/30 rounded-[6px] p-4 text-center">
                    <div className="w-5 h-5 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider">Querying blockchain for contract address details...</p>
                </div>
            )}
            
            {!searchingCa && searchedPair && (
                <div className="bg-[#181A20] border border-alphabag-yellow/30 rounded-[6px] p-4">
                    <div className="text-[11px] text-alphabag-yellow font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Globe size={12} />
                        DIRECT ON-CHAIN CONTRACT LOOKUP
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-alphabag-yellow text-[#0B0E11] rounded flex items-center justify-center font-bold text-xs">
                                {searchedPair.baseToken.symbol?.[0] || 'T'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-alphabag-text text-sm">{searchedPair.baseToken.name}</span>
                                    <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-[2px] bg-white/5 text-alphabag-subtext border border-white/10 uppercase">
                                        {searchedPair.chainId.toUpperCase()}
                                    </span>
                                    <span className="text-[11px] text-alphabag-subtext bg-[#202630] px-1.5 py-0.2 rounded-[2px] font-medium uppercase">{searchedPair.dexId}</span>
                                </div>
                                <div className="text-xs text-alphabag-subtext num mt-0.5">{searchedPair.baseToken.address}</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div>
                                <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider">Price</div>
                                <div className="num font-semibold text-alphabag-text mt-0.5">${Number(searchedPair.priceUsd) < 0.01 ? Number(searchedPair.priceUsd).toFixed(8) : Number(searchedPair.priceUsd).toFixed(4)}</div>
                            </div>
                            <div>
                                <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider">{timeframe === 'm5' ? '5m' : timeframe.toUpperCase()} Change</div>
                                <div className={`num font-semibold mt-0.5 ${Number(searchedPair.priceChange?.[timeframe] || 0) >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                    {formatPriceChange(searchedPair.priceChange?.[timeframe])}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider">Liquidity</div>
                                <div className="num font-semibold text-alphabag-text mt-0.5">{formatUsd(searchedPair.liquidity?.usd)}</div>
                            </div>
                            <button
                                onClick={() => window.open(searchedPair.url, '_blank', 'noopener,noreferrer')}
                                className="bg-alphabag-yellow text-[#0B0E11] hover:bg-[#FCD535] h-8 px-3 rounded font-semibold text-xs uppercase tracking-wider transition-colors self-center flex items-center gap-1.5"
                            >
                                <ExternalLink size={12} />
                                DexScreener
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Gainers Table ── */}
            <div className="rounded-[6px] border border-[#2B313A] bg-[#181A20] overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-[#2B313A] bg-[#14171D]">
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-alphabag-subtext w-12 text-center uppercase tracking-wider">#</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-alphabag-subtext w-64 text-left uppercase tracking-wider">Token</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-alphabag-subtext text-right uppercase tracking-wider">Price (USD)</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-alphabag-subtext text-right uppercase tracking-wider">{timeframe === 'm5' ? '5m' : timeframe.toUpperCase() === 'H24' ? '24h' : timeframe === 'h1' ? '1h' : '6h'} Change</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-alphabag-subtext text-right uppercase tracking-wider">24h Volume</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-alphabag-subtext text-right uppercase tracking-wider">Liquidity</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-alphabag-subtext text-right uppercase tracking-wider">FDV</th>
                                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-alphabag-subtext w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2B313A]/50 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-16 text-center text-alphabag-subtext">
                                        <div className="w-6 h-6 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <p className="text-xs text-alphabag-subtext font-medium">Synchronizing DexScreener Live Feeds...</p>
                                    </td>
                                </tr>
                            ) : displayedPairs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-16 text-center text-alphabag-subtext">
                                        <p className="text-xs text-alphabag-subtext font-medium">No trading pairs matched filters</p>
                                    </td>
                                </tr>
                            ) : (
                                displayedPairs.map((pair, index) => (
                                    <tr key={pair.pairAddress} className="hover:bg-[#202630] transition-colors group">
                                        <td className="px-3.5 py-2.5 font-medium text-alphabag-subtext text-center text-xs num">
                                            {index + 1}
                                        </td>
                                        <td className="px-3.5 py-2.5">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-7 h-7 bg-[#202630] border border-[#2B313A] rounded flex items-center justify-center font-semibold text-alphabag-yellow text-xs shrink-0">
                                                    {pair.baseToken?.symbol?.[0] || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-semibold text-alphabag-text text-xs uppercase tracking-tight truncate max-w-[120px]">{pair.baseToken?.symbol}</span>
                                                        <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-[2px] bg-white/5 text-alphabag-subtext border border-white/10 uppercase">
                                                            {pair.chainId === 'bsc' ? 'BSC' : pair.chainId?.toUpperCase()}
                                                        </span>
                                                        <span className="text-[11px] text-alphabag-subtext bg-[#202630] px-1.5 py-0.2 rounded-[2px] font-medium uppercase">{pair.dexId}</span>
                                                    </div>
                                                    <div className="text-[11px] text-alphabag-subtext truncate max-w-[180px] mt-0.5">{pair.baseToken?.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right font-semibold text-alphabag-text num">
                                            ${Number(pair.priceUsd) < 0.01 ? Number(pair.priceUsd).toFixed(8) : Number(pair.priceUsd).toFixed(4)}
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right font-semibold num">
                                            <span className={Number(pair.priceChange?.[timeframe] || 0) >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}>
                                                {formatPriceChange(pair.priceChange?.[timeframe])}
                                            </span>
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right font-medium text-alphabag-subtext num">
                                            {formatUsd(pair.volume?.h24)}
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right font-medium text-alphabag-subtext num">
                                            {formatUsd(pair.liquidity?.usd)}
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right font-medium text-alphabag-subtext num">
                                            {formatUsd(pair.fdv)}
                                        </td>
                                        <td className="px-3.5 py-2.5 text-right">
                                            <button 
                                                onClick={() => window.open(pair.url, '_blank', 'noopener,noreferrer')}
                                                className="p-1.5 text-alphabag-subtext hover:text-alphabag-text hover:bg-[#202630] transition-colors rounded opacity-0 group-hover:opacity-100 flex items-center justify-center ml-auto"
                                                title="View on DexScreener"
                                            >
                                                <ArrowUpRight size={13} strokeWidth={2} />
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
