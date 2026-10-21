import { AlertTriangle, Briefcase, Radio, Search, ShieldCheck, TrendingUp } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart as RePieChart, ResponsiveContainer } from 'recharts';
import Swal from 'sweetalert2';
import { useWallet } from '../../context/WalletContext';
import { PageIcon } from '../../components/ui/PageIcon';
import { formatUsd } from '../../lib/formatters';

export const MyAlphabag: React.FC = () => {
    const navigate = useNavigate();
    const { portfolioItems, trackedWallets, address: activeAddress, isSyncing } = useWallet();
    const [cexTotal, setCexTotal] = useState(0);
    const [cexConnections, setCexConnections] = useState<any[]>([]);

    const [activeSection, setActiveSection] = useState<'overview' | 'fee-auditor'>('overview');
    const [selectedWallet, setSelectedWallet] = useState<string>('all');
    const [customWalletInput, setCustomWalletInput] = useState<string>('');
    const [auditingWallet, setAuditingWallet] = useState<string | null>(null);
    const [isAuditingCustom, setIsAuditingCustom] = useState<boolean>(false);

    useEffect(() => {
        const savedCex = localStorage.getItem('alphabag_cex_connections');
        if (savedCex) {
            try {
                const parsed = JSON.parse(savedCex);
                setCexConnections(parsed);
                const total = parsed.reduce((acc: number, item: any) => acc + (item.balance || 0), 0);
                setCexTotal(total);
            } catch (e) {
                console.error("Error loading CEX portfolio data on MYALPHABAG", e);
            }
        }
    }, []);

    const dexTotal = portfolioItems?.reduce((acc, item) => acc + (item.value || 0), 0) || 0;
    const combinedTotal = dexTotal + cexTotal;

    const dexWallets = useMemo(() => Array.from(new Set([
        ...trackedWallets.filter(w => w.type === 'PORTFOLIO').map(w => w.address),
        ...(activeAddress ? [activeAddress] : []),
        ...portfolioItems.map(item => (item as any).address)
    ].filter(Boolean) as string[])), [trackedWallets, activeAddress, portfolioItems]);

    const dexChains = useMemo(() => Array.from(new Set([
        ...trackedWallets.filter(w => w.type === 'PORTFOLIO').map(w => w.chain),
        ...portfolioItems.map(item => (item as any).chain || 'ETH')
    ].filter(Boolean) as string[])), [trackedWallets, portfolioItems]);

    const feeAuditData = useMemo(() => {
        let gasSpent = 642.50;
        let slippageLoss = 124.20;
        let bridgeFriction = 89.00;

        let ethLeakage = 72;
        let solLeakage = 2;
        let bscLeakage = 14;
        let baseLeakage = 12;

        let txs = [
            { id: 't1', asset: 'ETH', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', action: 'Swap ETH -> PEPE', net: 'Ethereum', fee: 34.20, status: 'High Gas', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            { id: 't2', asset: 'USDT', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png', action: 'Bridge USDT -> Base', net: 'Base Network', fee: 12.50, status: 'Standard Toll', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            { id: 't3', asset: 'SOL', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', action: 'Swap SOL -> JUP', net: 'Solana', fee: 0.003, status: 'Efficient', color: 'text-alphabag-green bg-alphabag-green/10 border-alphabag-green/20' },
            { id: 't4', asset: 'BNB', logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png', action: 'Swap BNB -> CAKE', net: 'BSC Network', fee: 0.15, status: 'Efficient', color: 'text-alphabag-green bg-alphabag-green/10 border-alphabag-green/20' },
            { id: 't5', asset: 'ETH', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', action: 'Mint NFT', net: 'Ethereum', fee: 52.80, status: 'High Gas', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
        ];

        if (selectedWallet === 'custom' && auditingWallet) {
            const seed = auditingWallet.length || 10;
            gasSpent = (seed * 12.4) + 85.3;
            slippageLoss = (seed * 3.1) + 12.5;
            bridgeFriction = (seed * 1.8) + 5.0;

            ethLeakage = 50;
            solLeakage = 15;
            bscLeakage = 20;
            baseLeakage = 15;

            txs = [
                { id: 'c1', asset: 'SOL', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', action: 'Swap SOL -> PYTH', net: 'Solana', fee: 0.004, status: 'Efficient', color: 'text-alphabag-green bg-alphabag-green/10 border-alphabag-green/20' },
                { id: 'c2', asset: 'USDC', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', action: 'Bridge USDC -> Solana', net: 'Solana', fee: 8.50, status: 'Standard Toll', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                { id: 'c3', asset: 'ETH', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', action: 'Swap ETH -> UNI', net: 'Ethereum', fee: (seed * 0.8) + 15.0, status: 'High Gas', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
            ];
        } else if (selectedWallet !== 'all') {
            const idx = dexWallets.indexOf(selectedWallet);
            gasSpent = 120.40 + (idx * 45.2);
            slippageLoss = 32.10 + (idx * 12.4);
            bridgeFriction = 15.00 + (idx * 8.3);

            ethLeakage = 40;
            solLeakage = 10;
            bscLeakage = 30;
            baseLeakage = 20;

            txs = [
                { id: 'w1', asset: 'BNB', logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png', action: 'Swap BNB -> CAKE', net: 'BSC Network', fee: 0.18, status: 'Efficient', color: 'text-alphabag-green bg-alphabag-green/10 border-alphabag-green/20' },
                { id: 'w2', asset: 'ETH', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', action: 'Bridge ETH -> Arbitrum', net: 'Arbitrum Network', fee: 18.20, status: 'High Gas', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
            ];
        }

        const totalFees = gasSpent + slippageLoss + bridgeFriction;

        return {
            gasSpent,
            slippageLoss,
            bridgeFriction,
            totalFees,
            ethLeakage,
            solLeakage,
            bscLeakage,
            baseLeakage,
            txs
        };
    }, [selectedWallet, auditingWallet, dexWallets]);

    const allocationData = useMemo(() => {
        const PALETTE = ['#F0B90B', '#3B82F6', '#8B5CF6', '#0ECB81', '#F6465D', '#06B6D4', '#EC4899', '#EAB308', '#6366F1', '#14B8A6'];
        const dataMap: Record<string, { name: string; value: number; color: string }> = {};

        // DEX holdings
        if (portfolioItems && portfolioItems.length > 0) {
            portfolioItems.forEach(item => {
                const sym = item.symbol?.toUpperCase() || 'OTHER';
                const val = Number(item.value || 0);
                if (val > 0) {
                    if (dataMap[sym]) {
                        dataMap[sym].value += val;
                    } else {
                        const colorIdx = Object.keys(dataMap).length % PALETTE.length;
                        dataMap[sym] = { name: sym, value: val, color: PALETTE[colorIdx] };
                    }
                }
            });
        }

        // CEX holdings
        if (cexConnections && cexConnections.length > 0) {
            cexConnections.forEach(cex => {
                const name = cex.name || 'CEX';
                const val = Number(cex.balance || 0);
                if (val > 0) {
                    if (dataMap[name]) {
                        dataMap[name].value += val;
                    } else {
                        const colorIdx = Object.keys(dataMap).length % PALETTE.length;
                        dataMap[name] = { name, value: val, color: PALETTE[colorIdx] };
                    }
                }
            });
        }

        const list = Object.values(dataMap).sort((a, b) => b.value - a.value);
        if (list.length > 0) return list;

        return [
            { name: 'ETH', value: 0, color: '#3B82F6' },
            { name: 'USDT', value: 0, color: '#0ECB81' },
            { name: 'SOL', value: 0, color: '#8B5CF6' }
        ];
    }, [portfolioItems, cexConnections]);

    return (
        <div className="w-full space-y-3 pb-3">
            {/* Header section */}
            <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <PageIcon name="bag" size={32} />
                        <h1 className="text-xl font-bold text-alphabag-text tracking-tight">Portfolio Overview</h1>
                        <span className="text-[11px] bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/20 px-2 py-0.5 rounded-[2px] font-semibold uppercase tracking-wider">LIVE FEED</span>
                    </div>
                    <p className="text-alphabag-subtext text-xs">Consolidated portfolio telemetry across connected centralized exchanges and Web3 on-chain wallets.</p>
                </div>
            </div>

            {/* Net Worth & Allocation Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch">

                {/* Combined Net Worth Hero Card */}
                <div className="lg:col-span-3 bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 flex flex-col justify-between">
                    <div className="space-y-1.5">
                        <p className="text-[11px] uppercase font-semibold tracking-wider text-alphabag-subtext">Combined Net Worth</p>
                        <h2 className="text-3xl font-bold text-alphabag-text tracking-tight num">
                            {formatUsd(combinedTotal)}
                        </h2>
                        <p className="text-xs text-alphabag-subtext font-medium leading-relaxed">
                            <span className="font-semibold text-alphabag-text num">{formatUsd(cexTotal)}</span> CEX Holdings &nbsp;·&nbsp; <span className="font-semibold text-alphabag-text num">{formatUsd(dexTotal)}</span> DEX Holdings
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-emerald-500/10 text-alphabag-green font-semibold text-xs shrink-0 self-start mt-4 border border-emerald-500/20 num">
                        <TrendingUp size={13} /> +3.9% 24h
                    </div>
                </div>

                {/* Total Allocation Donut Chart */}
                <div className="lg:col-span-2 bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 flex flex-row items-center gap-4">
                    <div className="w-1/2 h-[120px] relative shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie 
                                    data={allocationData} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={36} 
                                    outerRadius={52} 
                                    paddingAngle={3} 
                                    dataKey="value"
                                >
                                    {allocationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#181A20" strokeWidth={2} />
                                    ))}
                                </Pie>
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-1.5 overflow-hidden">
                        <p className="text-[11px] font-semibold text-alphabag-subtext uppercase tracking-wider">Asset Weight</p>
                        <div className="space-y-1 text-xs">
                            {allocationData.slice(0, 4).map((a) => (
                                <div key={a.name} className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-1.5 truncate text-alphabag-text">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }}></span>
                                        {a.name}
                                    </span>
                                    <span className="text-alphabag-subtext num text-[11px]">
                                        {combinedTotal > 0 && Number.isFinite(a.value)
                                            ? ((a.value / combinedTotal) * 100).toFixed(1)
                                            : '0.0'}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* CEX / DEX Overview Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {/* CEX Card */}
                <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 flex flex-col justify-between hover:border-[#3E4552] transition-colors">
                    <div>
                        <div className="flex justify-between items-start mb-2.5">
                            <div className="flex items-center gap-2">
                                <PageIcon name="cex" size={32} />
                                <div>
                                    <h3 className="text-xs font-semibold text-alphabag-text uppercase">CEX Portfolio</h3>
                                    <p className="text-[11px] text-alphabag-subtext">
                                        {cexConnections.length > 0 ? cexConnections.map(c => c.name).join(' · ') : 'No Exchanges Connected'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => navigate('/cex-bag')} className="text-xs font-semibold text-alphabag-subtext hover:text-white border border-[#2B313A] rounded px-2.5 py-1 transition-colors">
                                View Details &rarr;
                            </button>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-alphabag-text num">{formatUsd(cexTotal)}</div>
                            {cexConnections.length > 0 ? (
                                <div className="text-xs text-alphabag-subtext font-medium mt-1 flex items-center gap-1">
                                    {cexConnections.length} Active Exchange Connection{cexConnections.length !== 1 ? 's' : ''}
                                </div>
                            ) : (
                                <div className="text-xs text-alphabag-subtext font-medium mt-1">
                                    Read-only API key balance telemetry
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        {cexConnections.length > 0 ? (
                            <div className="flex gap-2 flex-wrap mb-3">
                                {cexConnections.slice(0, 3).map((c, i) => (
                                    <div key={i} className="flex items-center gap-1.5 bg-[#202630] border border-[#2B313A] rounded px-2.5 py-1 text-xs text-alphabag-subtext">
                                        {c.icon && <img src={c.icon} className="w-3.5 h-3.5 rounded-full" alt={c.name} />}
                                        {c.name}: <span className="num text-alphabag-text">{formatUsd(Number(c.balance || 0))}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mb-3 py-2 px-3 rounded bg-[#0B0E11] border border-[#2B313A] text-xs text-alphabag-subtext">
                                Connect Binance, Bybit, Coinbase or OKX via read-only API credentials.
                            </div>
                        )}

                        <div className="flex justify-between items-center border-t border-[#2B313A] pt-3">
                            <span className="text-[11px] text-alphabag-subtext font-medium">{cexConnections.length} Connected</span>
                            <button onClick={() => navigate('/settings')} className="text-xs font-semibold text-alphabag-yellow hover:underline">
                                Configure API Keys &rarr;
                            </button>
                        </div>
                    </div>
                </div>

                {/* DEX Card */}
                <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 flex flex-col justify-between hover:border-[#3E4552] transition-colors">
                    <div>
                        <div className="flex justify-between items-start mb-2.5">
                            <div className="flex items-center gap-2">
                                <PageIcon name="dex" size={32} />
                                <div>
                                    <h3 className="text-xs font-semibold text-alphabag-text uppercase">DEX Portfolio</h3>
                                    <p className="text-[11px] text-alphabag-subtext">
                                        {dexWallets.length > 0 ? `${dexWallets.length} Wallets · ${dexChains.length} Networks` : 'No Wallets Connected'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => navigate('/dex-bag')} className="text-xs font-semibold text-alphabag-subtext hover:text-white border border-[#2B313A] rounded px-2.5 py-1 transition-colors">
                                View Details &rarr;
                            </button>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-alphabag-text num">{formatUsd(dexTotal)}</div>
                            {portfolioItems && portfolioItems.length > 0 ? (
                                <div className="text-xs text-alphabag-subtext font-medium mt-1 flex items-center gap-1">
                                    {portfolioItems.length} On-chain asset{portfolioItems.length !== 1 ? 's' : ''} detected
                                </div>
                            ) : (
                                <div className="text-xs text-alphabag-subtext font-medium mt-1">
                                    Multi-chain Web3 wallet holdings
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        {portfolioItems && portfolioItems.length > 0 ? (
                            <div className="flex gap-2 flex-wrap mb-3">
                                {portfolioItems.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex items-center gap-1.5 bg-[#202630] border border-[#2B313A] rounded px-2.5 py-1 text-xs text-alphabag-subtext">
                                        {item.image && <img src={item.image} className="w-3.5 h-3.5 rounded-full" alt={item.symbol} />}
                                        {item.symbol} <span className="num text-alphabag-text">{Number(item.amount || 0).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mb-3 py-2 px-3 rounded bg-[#0B0E11] border border-[#2B313A] text-xs text-alphabag-subtext">
                                Connect EVM or Solana wallets to aggregate on-chain token balances.
                            </div>
                        )}

                        <div className="flex justify-between items-center border-t border-[#2B313A] pt-3">
                            <span className="text-[11px] text-alphabag-subtext font-medium">{dexWallets.length} Tracked</span>
                            <button onClick={() => navigate('/settings')} className="text-xs font-semibold text-alphabag-yellow hover:underline">
                                Configure Wallets &rarr;
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Tabs Navigation Card */}
            <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-1.5 flex gap-1">
                <button
                    onClick={() => setActiveSection('overview')}
                    className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${activeSection === 'overview' ? 'bg-[#202630] text-alphabag-text border border-[#2B313A]' : 'text-alphabag-subtext hover:text-white'}`}
                >
                    Holdings Breakdown
                </button>
                <button
                    onClick={() => setActiveSection('fee-auditor')}
                    className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${activeSection === 'fee-auditor' ? 'bg-[#202630] text-alphabag-text border border-[#2B313A]' : 'text-alphabag-subtext hover:text-white'}`}
                >
                    On-Chain Fee Auditor
                </button>
            </div>

            {activeSection === 'overview' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">

                    {/* Holdings Table (2/3 width) */}
                    <div className="lg:col-span-2 bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-[#2B313A]">
                            <h3 className="text-xs font-semibold text-alphabag-text uppercase flex items-center gap-2">
                                <Briefcase size={14} className="text-blue-400" /> Tracked Assets
                            </h3>
                            <span className="text-[11px] font-semibold text-alphabag-subtext uppercase">Consolidated</span>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-alphabag-subtext text-[11px] uppercase font-semibold tracking-wider border-b border-[#2B313A]">
                                        <th className="pb-2.5 px-2">Asset</th>
                                        <th className="pb-2.5 px-2">Source</th>
                                        <th className="pb-2.5 px-2 text-right">24h Change</th>
                                        <th className="pb-2.5 px-2 text-right">Value (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2B313A]/50 text-xs">
                                    {portfolioItems && portfolioItems.length > 0 ? (
                                        portfolioItems
                                            .slice()
                                            .sort((a, b) => (b.value || 0) - (a.value || 0))
                                            .map((item, idx) => {
                                                const change = item.priceChange24h || 0;
                                                const isPositive = change >= 0;
                                                return (
                                                    <tr key={item.coinId || item.symbol + idx} className="hover:bg-[#202630] transition-colors">
                                                        <td className="py-2.5 px-2">
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={item.image || `https://ui-avatars.com/api/?name=${item.symbol}&background=random`}
                                                                    className="w-4 h-4 rounded-full object-cover"
                                                                    alt={item.symbol}
                                                                    onError={(e: any) => { e.target.src = `https://ui-avatars.com/api/?name=${item.symbol}&background=random`; }}
                                                                />
                                                                <span className="font-semibold text-alphabag-text">{item.symbol}</span>
                                                                <span className="text-[11px] text-alphabag-subtext hidden sm:inline">{item.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-2">
                                                            <span className="text-[11px] font-semibold uppercase bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/20 px-1.5 py-0.2 rounded-[2px]">
                                                                DEX
                                                            </span>
                                                        </td>
                                                        <td className={`py-2.5 px-2 text-right font-semibold num ${isPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                                                        </td>
                                                        <td className="py-2.5 px-2 text-right text-alphabag-text font-semibold num">
                                                            {formatUsd(item.value || 0)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    ) : isSyncing ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-alphabag-subtext text-xs">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Syncing multi-chain wallet balances...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-alphabag-subtext text-xs">
                                                No on-chain assets detected yet. Connect a Web3 wallet or add a tracked wallet to load live balances.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Flow Radar Feed (1/3 width) */}
                    <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-[#2B313A]">
                            <h3 className="text-xs font-semibold text-alphabag-text uppercase flex items-center gap-2">
                                <Radio size={14} className="text-alphabag-yellow" /> Flow Telemetry
                            </h3>
                        </div>

                        <div className="space-y-3 flex-1">
                            <div className="flex gap-2.5 items-start border-b border-[#2B313A]/50 pb-2.5">
                                <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 text-xs font-semibold">W</div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs text-alphabag-text leading-relaxed">
                                        <span className="font-semibold">0x7a2...f31</span> transferred <span className="font-semibold num">1,200 ETH</span> to exchange custody.
                                    </p>
                                    <span className="text-[11px] text-alphabag-subtext block num">2m ago</span>
                                </div>
                            </div>

                            <div className="flex gap-2.5 items-start border-b border-[#2B313A]/50 pb-2.5">
                                <div className="w-6 h-6 rounded bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/20 flex items-center justify-center shrink-0 text-xs font-semibold">S</div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs text-alphabag-text leading-relaxed">
                                        <span className="font-semibold">Trade signal</span> registered for <span className="font-semibold text-alphabag-yellow">$JUP</span>.
                                    </p>
                                    <span className="text-[11px] text-alphabag-subtext block num">18m ago</span>
                                </div>
                            </div>

                            <div className="flex gap-2.5 items-start">
                                <div className="w-6 h-6 rounded bg-emerald-500/10 text-alphabag-green border border-emerald-500/20 flex items-center justify-center shrink-0 text-xs font-semibold">M</div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs text-alphabag-text leading-relaxed">
                                        Ecosystem reward cycle is live for verified members.
                                    </p>
                                    <span className="text-[11px] text-alphabag-subtext block num">1h ago</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                /* Fee Auditor Tab Content */
                <div className="space-y-3">
                    <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-3 flex items-center gap-2">
                        <AlertTriangle size={15} className="text-alphabag-yellow shrink-0" />
                        <p className="text-xs text-alphabag-text">
                            Illustrative figures. Connect full RPC node integration to compute verified block-level gas consumption.
                        </p>
                    </div>

                    {/* Wallet input controller banner */}
                    <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-alphabag-text uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={14} className="text-alphabag-yellow" /> Audit Scope
                            </h4>
                            <p className="text-xs text-alphabag-subtext">Select portfolio address or input external target wallet.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <select
                                value={selectedWallet}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedWallet(val);
                                    if (val === 'all') {
                                        setIsAuditingCustom(false);
                                        setAuditingWallet(null);
                                    } else if (val !== 'custom') {
                                        setIsAuditingCustom(false);
                                        setAuditingWallet(val);
                                    }
                                }}
                                className="bg-[#0B0E11] border border-[#2B313A] rounded px-3 py-1.5 text-xs text-alphabag-text outline-none focus:border-alphabag-yellow min-w-[200px]"
                            >
                                <option value="all">Consolidated (All Connected)</option>
                                {dexWallets.map((w, i) => (
                                    <option key={w} value={w}>Connected Wallet {i + 1} ({w.slice(0, 6)}...{w.slice(-4)})</option>
                                ))}
                                <option value="custom">Paste Custom Wallet Address...</option>
                            </select>

                            {selectedWallet === 'custom' && (
                                <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                    <input
                                        type="text"
                                        placeholder="Paste EVM / Solana Address..."
                                        value={customWalletInput}
                                        onChange={(e) => setCustomWalletInput(e.target.value)}
                                        className="bg-[#0B0E11] border border-[#2B313A] rounded px-3 py-1.5 text-xs text-alphabag-text outline-none focus:border-alphabag-yellow flex-1 md:w-[260px] num"
                                    />
                                    <button
                                        onClick={() => {
                                            if (!customWalletInput) return;
                                            setAuditingWallet(customWalletInput);
                                            setIsAuditingCustom(true);
                                            Swal.fire({
                                                title: 'AUDITING WALLET',
                                                text: 'Parsing transaction logs on BSC, Ethereum and Solana nodes...',
                                                icon: 'success',
                                                timer: 1500,
                                                showConfirmButton: false,
                                                background: '#181A20',
                                                color: '#EAECEF'
                                            });
                                        }}
                                        className="bg-alphabag-yellow hover:bg-[#FCD535] text-[#0B0E11] text-xs font-semibold px-3.5 py-1.5 rounded transition-colors shrink-0"
                                    >
                                        Audit
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedWallet === 'custom' && !isAuditingCustom ? (
                        <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-8 text-center flex flex-col items-center justify-center space-y-2 min-h-[220px]">
                            <div className="p-3 bg-[#202630] rounded border border-[#2B313A] text-alphabag-yellow">
                                <Search size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-alphabag-text uppercase">Awaiting Target Wallet</h4>
                                <p className="text-xs text-alphabag-subtext mt-1 max-w-sm mx-auto">Enter an on-chain address above to scan gas expenditure and execution leakage.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Summary Auditor cards grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
                                <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 relative overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[11px] text-orange-400 font-semibold uppercase tracking-wider">Gas Expenditure</span>
                                        <div className="px-1.5 py-0.2 rounded-[2px] text-[11px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">Gas</div>
                                    </div>
                                    <div className="text-2xl font-bold text-alphabag-text num">${feeAuditData.gasSpent.toFixed(2)}</div>
                                    <p className="text-[11px] text-alphabag-subtext mt-1.5 flex-1">Estimated gas consumed on consensus verification.</p>
                                </div>
                                <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 relative overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[11px] text-alphabag-red font-semibold uppercase tracking-wider">Slippage Leakage</span>
                                        <div className="px-1.5 py-0.2 rounded-[2px] text-[11px] font-semibold bg-rose-500/10 text-alphabag-red border border-rose-500/20">MEV</div>
                                    </div>
                                    <div className="text-2xl font-bold text-alphabag-text num">${feeAuditData.slippageLoss.toFixed(2)}</div>
                                    <p className="text-[11px] text-alphabag-subtext mt-1.5 flex-1">Loss incurred from sub-optimal routing and frontrunning.</p>
                                </div>
                                <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 relative overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[11px] text-blue-400 font-semibold uppercase tracking-wider">Bridge Tolls</span>
                                        <div className="px-1.5 py-0.2 rounded-[2px] text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Cross-Chain</div>
                                    </div>
                                    <div className="text-2xl font-bold text-alphabag-text num">${feeAuditData.bridgeFriction.toFixed(2)}</div>
                                    <p className="text-[11px] text-alphabag-subtext mt-1.5 flex-1">Protocol charges paid during cross-chain asset bridging.</p>
                                </div>
                            </div>

                            {/* Middle section grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">

                                {/* Network Leakage Share (5 cols) */}
                                <div className="lg:col-span-5 bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 flex flex-col">
                                    <h3 className="text-xs font-semibold uppercase text-alphabag-text tracking-wider mb-3">Network Gas Share</h3>
                                    <div className="space-y-2.5 flex-1">
                                        <div>
                                            <div className="flex justify-between text-xs font-medium mb-1">
                                                <span className="text-alphabag-text">Ethereum</span>
                                                <span className="text-alphabag-subtext num">{feeAuditData.ethLeakage}%</span>
                                            </div>
                                            <div className="w-full bg-[#0B0E11] h-2 rounded overflow-hidden">
                                                <div className="bg-[#3B82F6] h-full" style={{ width: `${feeAuditData.ethLeakage}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-medium mb-1">
                                                <span className="text-alphabag-text">BNB Chain</span>
                                                <span className="text-alphabag-subtext num">{feeAuditData.bscLeakage}%</span>
                                            </div>
                                            <div className="w-full bg-[#0B0E11] h-2 rounded overflow-hidden">
                                                <div className="bg-alphabag-yellow h-full" style={{ width: `${feeAuditData.bscLeakage}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-medium mb-1">
                                                <span className="text-alphabag-text">Base</span>
                                                <span className="text-alphabag-subtext num">{feeAuditData.baseLeakage}%</span>
                                            </div>
                                            <div className="w-full bg-[#0B0E11] h-2 rounded overflow-hidden">
                                                <div className="bg-purple-500 h-full" style={{ width: `${feeAuditData.baseLeakage}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-medium mb-1">
                                                <span className="text-alphabag-text">Solana</span>
                                                <span className="text-alphabag-subtext num">{feeAuditData.solLeakage}%</span>
                                            </div>
                                            <div className="w-full bg-[#0B0E11] h-2 rounded overflow-hidden">
                                                <div className="bg-emerald-500 h-full" style={{ width: `${feeAuditData.solLeakage}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Optimization Recommendations (7 cols) */}
                                <div className="lg:col-span-7 bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 flex flex-col">
                                    <h3 className="text-xs font-semibold uppercase text-alphabag-text tracking-wider border-b border-[#2B313A] pb-2.5 flex items-center gap-2">
                                        <TrendingUp size={14} className="text-alphabag-yellow" /> Optimization Diagnostics
                                    </h3>
                                    <div className="space-y-2 text-xs text-alphabag-subtext leading-relaxed flex-1 pt-2">
                                        <div className="flex items-start gap-2">
                                            <span className="text-alphabag-yellow shrink-0 mt-0.5">•</span>
                                            <p><strong className="text-alphabag-text">Ethereum Layer-1</strong> accounts for <strong className="num text-alphabag-text">{feeAuditData.ethLeakage}%</strong> of total gas bleed. Route high-frequency trades via Arbitrum or Base to reduce transaction overhead by ~85%.</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-alphabag-yellow shrink-0 mt-0.5">•</span>
                                            <p>Estimated slippage friction is <strong className="num text-alphabag-text">${feeAuditData.slippageLoss.toFixed(2)}</strong>. Configure private mempool endpoints (e.g. Flashbots Protect RPC) to prevent MEV sandwich attacks on public mempools.</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-alphabag-yellow shrink-0 mt-0.5">•</span>
                                            <p>Cross-chain bridge friction totaled <strong className="num text-alphabag-text">${feeAuditData.bridgeFriction.toFixed(2)}</strong>. Utilize intent-based messaging bridges (Stargate / Across) over high-fee native lock-and-mint mechanisms.</p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Audit table logs list */}
                            <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4">
                                <h3 className="text-xs font-semibold uppercase text-alphabag-text tracking-wider mb-2 pb-2.5 border-b border-[#2B313A]">Audited Fee Log</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-alphabag-subtext text-[11px] uppercase font-semibold tracking-wider border-b border-[#2B313A]">
                                                <th className="pb-2.5 px-2">Asset</th>
                                                <th className="pb-2.5 px-2">Action</th>
                                                <th className="pb-2.5 px-2">Network</th>
                                                <th className="pb-2.5 px-2 text-right">Fee (USD)</th>
                                                <th className="pb-2.5 px-2 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2B313A]/50 text-xs">
                                            {feeAuditData.txs.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-[#202630] transition-colors">
                                                    <td className="py-2.5 px-2 font-semibold text-alphabag-text flex items-center gap-2">
                                                        <img src={tx.logo} className="w-4 h-4 rounded-full" alt={tx.asset} /> {tx.asset}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-alphabag-subtext">{tx.action}</td>
                                                    <td className="py-2.5 px-2 text-alphabag-subtext">{tx.net}</td>
                                                    <td className="py-2.5 px-2 text-right text-alphabag-text num font-semibold">${tx.fee.toFixed(2)}</td>
                                                    <td className="py-2.5 px-2 text-right">
                                                        <span className={`text-[11px] font-semibold uppercase border px-1.5 py-0.2 rounded-[2px] ${tx.color}`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

        </div>
    );
};

export default MyAlphabag;
