import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Wallet2, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Layers, AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

interface TokenBalance {
    symbol: string;
    name: string;
    balance: string;
    valueUSD: number;
    priceUSD: number;
    change24h: number;
    logo?: string;
    contractAddress?: string;
    chain: string;
}

const CHAIN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    eth: { label: 'ETH', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    bsc: { label: 'BSC', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    sol: { label: 'SOL', color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

export const DexBag: React.FC = () => {
    const { address, isConnected } = useAccount();
    const [balances, setBalances] = useState<TokenBalance[]>([]);
    const [totalUSD, setTotalUSD] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [filterChain, setFilterChain] = useState<string>('ALL');

    const fetchBalances = async () => {
        if (!address) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/api/portfolio/balances?address=${address}`);
            const data = res.data?.tokens || res.data || [];
            const tokens: TokenBalance[] = Array.isArray(data) ? data : [];
            setBalances(tokens);
            const total = tokens.reduce((sum: number, t: TokenBalance) => sum + (t.valueUSD || 0), 0);
            setTotalUSD(total);
            setLastUpdated(new Date());
        } catch (e: any) {
            setError('Unable to fetch on-chain balances. Check wallet connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected && address) {
            fetchBalances();
        }
    }, [address, isConnected]);

    const filtered = filterChain === 'ALL' ? balances : balances.filter(t => t.chain === filterChain);

    return (
        <div className="space-y-2 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="bg-alphabag-darkgray border-y border-alphabag-gray -mx-2 rounded-none p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-alphabag-black">
                            <Wallet2 size={20} />
                        </div>
                        <h1 className="text-3xl font-black text-alphabag-text tracking-tight uppercase">DEX Portfolio</h1>
                    </div>
                    <p className="text-alphabag-subtext text-xs font-medium mt-0.5 uppercase tracking-widest">
                        On-chain token holdings — read only
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Chain Filter */}
                    <select
                        value={filterChain}
                        onChange={e => setFilterChain(e.target.value)}
                        className="bg-alphabag-black border border-alphabag-gray rounded-lg px-3 py-1.5 text-xs text-alphabag-text focus:border-[#fcd535] outline-none font-semibold uppercase"
                    >
                        <option value="ALL">All Chains</option>
                        <option value="eth">Ethereum</option>
                        <option value="bsc">BSC</option>
                        <option value="sol">Solana</option>
                    </select>
                    <button
                        onClick={fetchBalances}
                        disabled={loading || !isConnected}
                        className="bg-[#2b3139] text-alphabag-text border border-[#474d57] rounded-lg px-3 py-1.5 hover:bg-[#474d57] transition-all disabled:opacity-40 flex items-center gap-1.5 text-xs font-bold uppercase"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Not Connected State */}
            {!isConnected && (
                <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-12 text-center">
                    <Wallet2 size={48} className="mx-auto mb-2 text-alphabag-subtext opacity-30" />
                    <p className="text-alphabag-text font-black uppercase tracking-widest text-sm mb-2">Wallet Not Connected</p>
                    <p className="text-alphabag-subtext text-xs font-medium mb-2">Connect your EVM wallet to view your on-chain DEX holdings.</p>
                    <Link
                        to="/settings"
                        className="inline-flex items-center gap-2 bg-[#fcd535] text-black font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-yellow-400 transition-all"
                    >
                        Setup Connections <ChevronRight size={14} />
                    </Link>
                </div>
            )}

            {/* Error */}
            {isConnected && error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-xs font-semibold">{error}</p>
                </div>
            )}

            {/* Portfolio Summary Card */}
            {isConnected && !error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5">
                        <p className="text-alphabag-subtext text-[10px] font-black uppercase tracking-widest mb-1">Total DEX Value</p>
                        <p className="text-2xl font-black text-alphabag-text">
                            {loading ? <span className="animate-pulse">···</span> : `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </p>
                        <p className="text-alphabag-subtext text-[10px] mt-1 font-mono">
                            {address ? `${address.slice(0, 6)}···${address.slice(-4)}` : ''}
                        </p>
                    </div>
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5">
                        <p className="text-alphabag-subtext text-[10px] font-black uppercase tracking-widest mb-1">Token Count</p>
                        <p className="text-2xl font-black text-alphabag-text">
                            {loading ? <span className="animate-pulse">···</span> : filtered.length}
                        </p>
                        <p className="text-alphabag-subtext text-[10px] mt-1 font-medium uppercase">Assets detected</p>
                    </div>
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5">
                        <p className="text-alphabag-subtext text-[10px] font-black uppercase tracking-widest mb-1">Last Synced</p>
                        <p className="text-sm font-black text-alphabag-text">
                            {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
                        </p>
                        <p className="text-alphabag-subtext text-[10px] mt-1 font-medium uppercase">Real-time data</p>
                    </div>
                </div>
            )}

            {/* Token Table */}
            {isConnected && !error && (
                <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray overflow-hidden">
                    <div className="px-6 py-4 border-b border-alphabag-gray flex items-center gap-2">
                        <Layers size={16} className="text-[#fcd535]" />
                        <span className="text-xs font-black uppercase tracking-widest text-alphabag-text">On-Chain Holdings</span>
                        <span className="ml-auto text-[10px] text-alphabag-subtext font-mono uppercase tracking-widest">Read-Only View</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-alphabag-black text-alphabag-subtext text-[10px] uppercase tracking-wider font-black border-b border-alphabag-gray">
                                <tr>
                                    <th className="p-4 pl-6">Asset</th>
                                    <th className="p-4">Chain</th>
                                    <th className="p-4 text-right">Balance</th>
                                    <th className="p-4 text-right">Price</th>
                                    <th className="p-4 text-right">24h</th>
                                    <th className="p-4 text-right">Value</th>
                                    <th className="p-4 text-center">Explorer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2b3139] text-sm">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="p-4 pl-6"><div className="h-4 w-24 bg-[#2b3139] rounded" /></td>
                                            <td className="p-4"><div className="h-4 w-10 bg-[#2b3139] rounded" /></td>
                                            <td className="p-4 text-right"><div className="h-4 w-16 bg-[#2b3139] rounded ml-auto" /></td>
                                            <td className="p-4 text-right"><div className="h-4 w-14 bg-[#2b3139] rounded ml-auto" /></td>
                                            <td className="p-4 text-right"><div className="h-4 w-10 bg-[#2b3139] rounded ml-auto" /></td>
                                            <td className="p-4 text-right"><div className="h-4 w-16 bg-[#2b3139] rounded ml-auto" /></td>
                                            <td className="p-4"><div className="h-4 w-8 bg-[#2b3139] rounded mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : filtered.length > 0 ? (
                                    filtered.map((token, i) => {
                                        const chain = CHAIN_LABELS[token.chain] || { label: token.chain?.toUpperCase() || '—', color: 'text-alphabag-subtext', bg: 'bg-white/5' };
                                        const isPositive = (token.change24h || 0) >= 0;
                                        return (
                                            <tr key={i} className="hover:bg-[#2b3139]/40 transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-2">
                                                        {token.logo ? (
                                                            <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full bg-[#2b3139]" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-[#fcd535]/10 flex items-center justify-center">
                                                                <span className="text-[#fcd535] font-black text-[10px]">{token.symbol?.slice(0, 2)}</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-black text-alphabag-text text-xs uppercase">{token.symbol}</div>
                                                            <div className="text-alphabag-subtext text-[10px] font-medium truncate max-w-[120px]">{token.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${chain.bg} ${chain.color} uppercase`}>{chain.label}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-mono text-alphabag-text text-xs font-bold">{parseFloat(token.balance || '0').toLocaleString()}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="text-alphabag-subtext text-xs font-mono">${(token.priceUSD || 0).toFixed(4)}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className={`text-xs font-black flex items-center justify-end gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                        {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                        {isPositive ? '+' : ''}{(token.change24h || 0).toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-black text-alphabag-text text-xs">${(token.valueUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {token.contractAddress && (
                                                        <a
                                                            href={`https://bscscan.com/token/${token.contractAddress}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-alphabag-subtext hover:text-[#fcd535]"
                                                        >
                                                            <ExternalLink size={13} />
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <Wallet2 size={40} className="mx-auto mb-3 text-alphabag-subtext opacity-20" />
                                            <p className="text-alphabag-subtext font-black uppercase tracking-widest text-xs">No DEX tokens found for this wallet.</p>
                                            <p className="text-alphabag-subtext text-[10px] mt-1">Try switching chain filter or refreshing.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length > 0 && (
                        <div className="px-6 py-3 border-t border-alphabag-gray flex justify-between items-center">
                            <span className="text-[10px] text-alphabag-subtext font-medium uppercase tracking-wider">
                                {filtered.length} token{filtered.length !== 1 ? 's' : ''} · Read-only · Prices via Alchemy
                            </span>
                            <Link to="/portfolio" className="text-[10px] text-[#fcd535] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                                Full Portfolio View <ChevronRight size={11} />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
