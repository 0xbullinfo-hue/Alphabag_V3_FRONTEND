import React, { useEffect, useState, useMemo } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { PieChart as PieChartIcon, Briefcase, Layers, Wallet as WalletIcon, ArrowUpRight, TrendingUp, Search, Radio, ChevronRight, Eye, ShieldCheck, HelpCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const MyAlphabag: React.FC = () => {
    const navigate = useNavigate();
    const { portfolioItems } = useWallet();
    const [cexTotal, setCexTotal] = useState(0);
    const [cexConnections, setCexConnections] = useState<any[]>([]);

    const [activeSection, setActiveSection] = useState<'overview' | 'fee-auditor'>('overview');
    const [selectedWallet, setSelectedWallet] = useState<string>('all');
    const [customWalletInput, setCustomWalletInput] = useState<string>('');
    const [auditingWallet, setAuditingWallet] = useState<string | null>(null);
    const [isAuditingCustom, setIsAuditingCustom] = useState<boolean>(false);

    useEffect(() => {
        // Load connected CEX connections
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

    // Filter out unique chains from DEX portfolio items
    const dexChains = Array.from(new Set(portfolioItems.map(item => item.chain || 'BSC')));
    const dexWallets = Array.from(new Set(portfolioItems.map(item => item.address)));

    const feeAuditData = useMemo(() => {
        // Base values for "all" connected wallets
        let gasSpent = 642.50;
        let slippageLoss = 124.20;
        let bridgeFriction = 89.00;
        
        let ethLeakage = 72;
        let solLeakage = 2;
        let bscLeakage = 14;
        let baseLeakage = 12;

        let txs = [
            { id: 't1', asset: 'ETH', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', action: 'Swap ETH -> PEPE', net: 'Ethereum', fee: 34.20, status: 'High Gas Warning', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            { id: 't2', asset: 'USDT', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png', action: 'Bridge USDT -> Base', net: 'Base Network', fee: 12.50, status: 'Average Toll', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            { id: 't3', asset: 'SOL', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', action: 'Swap SOL -> JUP', net: 'Solana', fee: 0.003, status: 'Highly Efficient', color: 'text-[#0ecb81] bg-[#0ecb81]/10 border-[#0ecb81]/20' },
            { id: 't4', asset: 'BNB', logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png', action: 'Swap BNB -> CAKE', net: 'BSC Network', fee: 0.15, status: 'Highly Efficient', color: 'text-[#0ecb81] bg-[#0ecb81]/10 border-[#0ecb81]/20' },
            { id: 't5', asset: 'ETH', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', action: 'Mint NFT', net: 'Ethereum', fee: 52.80, status: 'High Gas Warning', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
        ];

        // Modify values dynamically if specific wallets are chosen to simulate a live calculation
        if (selectedWallet === 'custom' && auditingWallet) {
            // For custom wallet paste, generate a random-looking but deterministic set of stats based on length of address
            const seed = auditingWallet.length || 10;
            gasSpent = (seed * 12.4) + 85.3;
            slippageLoss = (seed * 3.1) + 12.5;
            bridgeFriction = (seed * 1.8) + 5.0;

            ethLeakage = 50;
            solLeakage = 15;
            bscLeakage = 20;
            baseLeakage = 15;

            txs = [
                { id: 'c1', asset: 'SOL', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', action: 'Swap SOL -> PYTH', net: 'Solana', fee: 0.004, status: 'Highly Efficient', color: 'text-[#0ecb81] bg-[#0ecb81]/10 border-[#0ecb81]/20' },
                { id: 'c2', asset: 'USDC', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', action: 'Bridge USDC -> Solana', net: 'Solana', fee: 8.50, status: 'Average Toll', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                { id: 'c3', asset: 'ETH', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', action: 'Swap ETH -> UNI', net: 'Ethereum', fee: (seed * 0.8) + 15.0, status: 'High Gas Warning', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
            ];
        } else if (selectedWallet !== 'all') {
            // For a specific wallet from dropdown list
            const idx = dexWallets.indexOf(selectedWallet);
            gasSpent = 120.40 + (idx * 45.2);
            slippageLoss = 32.10 + (idx * 12.4);
            bridgeFriction = 15.00 + (idx * 8.3);

            ethLeakage = 40;
            solLeakage = 10;
            bscLeakage = 30;
            baseLeakage = 20;

            txs = [
                { id: 'w1', asset: 'BNB', logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png', action: 'Swap BNB -> CAKE', net: 'BSC Network', fee: 0.18, status: 'Highly Efficient', color: 'text-[#0ecb81] bg-[#0ecb81]/10 border-[#0ecb81]/20' },
                { id: 'w2', asset: 'ETH', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', action: 'Bridge ETH -> Arbitrum', net: 'Arbitrum Network', fee: 18.20, status: 'High Gas Warning', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
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

    // Handle Coming Soon sweetalerts
    const triggerComingSoon = (feature: string) => {
        Swal.fire({
            title: 'COMING SOON',
            text: `${feature} is in final testing. Launching in Phase 2.0.`,
            icon: 'info',
            confirmButtonText: 'ACKNOWLEDGE',
            confirmButtonColor: '#fcd535',
            background: 'var(--panel-color)',
            color: 'var(--text-color)',
            customClass: {
                popup: 'border border-alphabag-gray rounded-2xl',
                confirmButton: 'text-black font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg text-xs'
            }
        });
    };

    const allocationData = useMemo(() => {
        const dataMap: Record<string, { name: string, value: number, color: string }> = {
            'BTC': { name: 'BTC', value: 29032.18, color: '#FCD535' },
            'ETH': { name: 'ETH', value: 14490.84 + 6347.16, color: '#3B82F6' },
            'SOL': { name: 'SOL', value: 7492.80, color: '#8B5CF6' },
            'USDT': { name: 'USDT', value: 3500.00, color: '#0ECB81' },
            'PEPE': { name: 'PEPE', value: 1638.00, color: '#F6465D' }
        };
        return Object.values(dataMap).sort((a, b) => b.value - a.value);
    }, []);

    return (
        <div className="w-full space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-alphabag-gray gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                            <PieChartIcon size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">My AlphaBAG</h1>
                        <span className="text-[10px] bg-[#fcd535]/10 text-alphabag-yellow border border-[#fcd535]/20 px-2 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">Live overview</span>
                    </div>
                    <p className="text-alphabag-subtext text-sm">Consolidated portfolio overview of your centralized and decentralized assets.</p>
                </div>
            </div>

            {/* Net Worth & Allocation Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Combined Net Worth Hero Card */}
                <div className="lg:col-span-3 bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 min-h-[180px]">
                    <div className="absolute top-[-50px] right-[-30px] w-40 h-40 bg-[#fcd535] filter blur-[80px] opacity-[0.06] pointer-events-none"></div>
                    <div className="space-y-2 z-10">
                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-alphabag-subtext">Combined Net Worth</p>
                        <h2 className="text-4xl font-extrabold text-alphabag-text tracking-tight tabular-data">
                            ${combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <p className="text-xs text-alphabag-subtext font-medium leading-relaxed">
                            <span className="font-bold text-alphabag-text">${cexTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> CEX Bag &nbsp;·&nbsp; <span className="font-bold text-alphabag-text">${dexTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> DEX Bag
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-[#0ecb81] font-bold text-xs shrink-0 self-start md:self-auto border border-green-500/20">
                        <TrendingUp size={14} /> +3.9% Today
                    </div>
                </div>

                {/* Total Allocation Donut Chart */}
                <div className="lg:col-span-2 bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-6 flex flex-row items-center gap-6 min-h-[180px]">
                    <div className="w-1/2 h-[120px] relative shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie 
                                    data={allocationData} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={38} 
                                    outerRadius={50} 
                                    paddingAngle={2} 
                                    dataKey="value" 
                                    stroke="none"
                                >
                                    {allocationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <PieChartIcon size={18} className="text-alphabag-subtext" />
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center space-y-1.5 min-w-0">
                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-alphabag-subtext mb-1">Portfolio Allocation</p>
                        {allocationData.slice(0, 4).map((item) => {
                            const pct = ((item.value / combinedTotal) * 100).toFixed(1);
                            return (
                                <div key={item.name} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-alphabag-text font-medium truncate">{item.name}</span>
                                    </div>
                                    <span className="text-alphabag-subtext font-semibold tabular-data">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Split Bags Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* CEX Card */}
                <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5 hover:border-[#474d57] transition-all relative flex flex-col justify-between h-[280px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-base border border-blue-500/20">C</div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase">CEX Portfolio</h3>
                                    <p className="text-[10px] text-alphabag-subtext">
                                        {cexConnections.length > 0 ? cexConnections.map(c => c.name).join(' · ') : 'Binance · Bybit · Kraken'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => navigate('/cex-bag')} className="text-[11px] font-bold text-alphabag-subtext hover:text-white border border-alphabag-gray rounded-lg px-2.5 py-1 transition-colors">
                                View Details &rarr;
                            </button>
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-alphabag-text tabular-data">${cexTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div className="text-xs text-[#0ecb81] font-semibold mt-1 flex items-center gap-1">
                                <TrendingUp size={12} /> +2.1% Today
                            </div>
                        </div>
                    </div>

                    <div>
                        {/* Token Preview Chips */}
                        <div className="flex gap-2 flex-wrap mb-4">
                            <div className="flex items-center gap-1.5 bg-alphabag-dark/40 border border-alphabag-gray rounded-lg px-2.5 py-1 text-xs text-alphabag-subtext">
                                <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" className="w-3.5 h-3.5 rounded-full" alt="BTC" /> BTC 0.45
                            </div>
                            <div className="flex items-center gap-1.5 bg-alphabag-dark/40 border border-alphabag-gray rounded-lg px-2.5 py-1 text-xs text-alphabag-subtext">
                                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" className="w-3.5 h-3.5 rounded-full" alt="ETH" /> ETH 4.20
                            </div>
                            <div className="flex items-center gap-1.5 bg-alphabag-dark/40 border border-alphabag-gray rounded-lg px-2.5 py-1 text-xs text-alphabag-subtext">
                                <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="w-3.5 h-3.5 rounded-full" alt="USDT" /> USDT 3,500
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-alphabag-gray/40 pt-3">
                            <span className="text-[10px] text-alphabag-subtext font-medium">{cexConnections.length} Exchanges Connected</span>
                            <button onClick={() => navigate('/settings')} className="text-xs font-bold text-[#fcd535] hover:underline">
                                Configure API Keys &rarr;
                            </button>
                        </div>
                    </div>
                </div>

                {/* DEX Card */}
                <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5 hover:border-[#474d57] transition-all relative flex flex-col justify-between h-[280px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#fcd535]/10 text-[#fcd535] flex items-center justify-center font-black text-base border border-[#fcd535]/20">D</div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase">DEX Portfolio</h3>
                                    <p className="text-[10px] text-alphabag-subtext">
                                        {dexWallets.length || 4} Wallets · {dexChains.length || 6} Chains
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => navigate('/dex-bag')} className="text-[11px] font-bold text-alphabag-subtext hover:text-white border border-alphabag-gray rounded-lg px-2.5 py-1 transition-colors">
                                View Details &rarr;
                            </button>
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-alphabag-text tabular-data">${dexTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div className="text-xs text-[#0ecb81] font-semibold mt-1 flex items-center gap-1">
                                <TrendingUp size={12} /> +5.4% Today
                            </div>
                        </div>
                    </div>

                    <div>
                        {/* Token Preview Chips */}
                        <div className="flex gap-2 flex-wrap mb-4">
                            <div className="flex items-center gap-1.5 bg-alphabag-dark/40 border border-alphabag-gray rounded-lg px-2.5 py-1 text-xs text-alphabag-subtext">
                                <img src="https://cryptologos.cc/logos/solana-sol-logo.png" className="w-3.5 h-3.5 rounded-full" alt="SOL" /> SOL 42.0
                            </div>
                            <div className="flex items-center gap-1.5 bg-alphabag-dark/40 border border-alphabag-gray rounded-lg px-2.5 py-1 text-xs text-alphabag-subtext">
                                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" className="w-3.5 h-3.5 rounded-full" alt="ETH" /> ETH 1.84
                            </div>
                            <div className="flex items-center gap-1.5 bg-alphabag-dark/40 border border-alphabag-gray rounded-lg px-2.5 py-1 text-xs text-alphabag-subtext">
                                <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png" className="w-3.5 h-3.5 rounded-full" alt="PEPE" /> PEPE 180M
                            </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-alphabag-gray/40 pt-3">
                            <span className="text-[10px] text-alphabag-subtext font-medium">{dexWallets.length} Wallets Tracked</span>
                            <button onClick={() => navigate('/settings')} className="text-xs font-bold text-[#fcd535] hover:underline">
                                Configure Wallets &rarr;
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-alphabag-gray gap-6 mt-8 mb-6">
                <button
                    onClick={() => setActiveSection('overview')}
                    className={`pb-4 text-xs font-black uppercase tracking-[0.15em] relative transition-all ${activeSection === 'overview' ? 'text-alphabag-yellow font-black border-b-2 border-[#fcd535]' : 'text-alphabag-subtext hover:text-alphabag-text'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveSection('fee-auditor')}
                    className={`pb-4 text-xs font-black uppercase tracking-[0.15em] relative transition-all ${activeSection === 'fee-auditor' ? 'text-alphabag-yellow font-black border-b-2 border-[#fcd535]' : 'text-alphabag-subtext hover:text-alphabag-text'}`}
                >
                    Fee Auditor
                </button>
            </div>

            {activeSection === 'overview' ? (
                /* Bottom Section: Recent Activity & Alpha Radar */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Recent Activity Table (2/3 width) */}
                    <div className="lg:col-span-2 bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-alphabag-gray">
                            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                                <Briefcase size={16} className="text-blue-400" /> Recent Holdings
                            </h3>
                            <span className="text-[10px] font-bold text-alphabag-subtext uppercase">Combined Assets</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-alphabag-subtext text-[10px] uppercase font-bold tracking-wider border-b border-alphabag-gray/50">
                                        <th className="pb-3 px-2">Asset</th>
                                        <th className="pb-3 px-2">Source</th>
                                        <th className="pb-3 px-2 text-right">24h Change</th>
                                        <th className="pb-3 px-2 text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2b3139]/20 text-xs">
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2.5">
                                                <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" className="w-5 h-5 rounded-full" alt="BTC" />
                                                <span className="font-semibold text-white">BTC</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className="text-[9px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">CEX</span>
                                        </td>
                                        <td className="py-3 px-2 text-right text-[#0ecb81] font-bold tabular-data">+2.5%</td>
                                        <td className="py-3 px-2 text-right text-white font-semibold tabular-data">$29,032.18</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2.5">
                                                <img src="https://cryptologos.cc/logos/solana-sol-logo.png" className="w-5 h-5 rounded-full" alt="SOL" />
                                                <span className="font-semibold text-white">SOL</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className="text-[9px] font-black uppercase bg-[#fcd535]/10 text-alphabag-yellow border border-[#fcd535]/20 px-2 py-0.5 rounded">DEX</span>
                                        </td>
                                        <td className="py-3 px-2 text-right text-[#0ecb81] font-bold tabular-data">+5.6%</td>
                                        <td className="py-3 px-2 text-right text-white font-semibold tabular-data">$7,492.80</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2.5">
                                                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" className="w-5 h-5 rounded-full" alt="ETH" />
                                                <span className="font-semibold text-white">ETH</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className="text-[9px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">CEX</span>
                                        </td>
                                        <td className="py-3 px-2 text-right text-[#0ecb81] font-bold tabular-data">+2.1%</td>
                                        <td className="py-3 px-2 text-right text-white font-semibold tabular-data">$14,490.84</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2.5">
                                                <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png" className="w-5 h-5 rounded-full" alt="PEPE" />
                                                <span className="font-semibold text-white">PEPE</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className="text-[9px] font-black uppercase bg-[#fcd535]/10 text-alphabag-yellow border border-[#fcd535]/20 px-2 py-0.5 rounded">DEX</span>
                                        </td>
                                        <td className="py-3 px-2 text-right text-[#f6465d] font-bold tabular-data">-4.2%</td>
                                        <td className="py-3 px-2 text-right text-white font-semibold tabular-data">$1,638.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Alpha Radar Feed (1/3 width) */}
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-xl p-5">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-alphabag-gray">
                            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                                <Radio size={16} className="text-alphabag-yellow animate-pulse" /> Alpha Radar
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-3 items-start border-b border-alphabag-gray/40 pb-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 text-xs font-black">W</div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs text-alphabag-text leading-relaxed">
                                        <span className="font-bold">Whale 0x7a2...f31</span> moved <span className="font-bold">1,200 ETH</span> to Binance.
                                    </p>
                                    <span className="text-[9px] text-alphabag-subtext block font-mono">2 min ago</span>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start border-b border-alphabag-gray/40 pb-3">
                                <div className="w-8 h-8 rounded-lg bg-[#fcd535]/10 text-alphabag-yellow border border-[#fcd535]/20 flex items-center justify-center shrink-0 text-xs font-black">A</div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs text-alphabag-text leading-relaxed">
                                        <span className="font-bold">Alpha call</span> flagged <span className="font-bold text-alphabag-yellow">$JUP</span> &mdash; 3 analysts bullish.
                                    </p>
                                    <span className="text-[9px] text-alphabag-subtext block font-mono">18 min ago</span>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 text-[#0ecb81] border border-green-500/20 flex items-center justify-center shrink-0 text-xs font-black">S</div>
                                <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs text-alphabag-text leading-relaxed">
                                        New airdrop mission is live for <span className="font-bold">Genesis</span> members.
                                    </p>
                                    <span className="text-[9px] text-alphabag-subtext block font-mono">1 hour ago</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                /* Fee Auditor Tab Content */
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Wallet input controller banner */}
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={16} className="text-[#fcd535]" /> Select Audit Target
                            </h4>
                            <p className="text-xs text-alphabag-subtext">Choose a connected portfolio address or paste a custom wallet target.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
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
                                className="bg-alphabag-dark border border-alphabag-gray rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:border-[#fcd535] min-w-[200px]"
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
                                        placeholder="Paste EVM / Solana Address (0x... or 3M4...)"
                                        value={customWalletInput}
                                        onChange={(e) => setCustomWalletInput(e.target.value)}
                                        className="bg-alphabag-dark border border-alphabag-gray rounded-lg px-4 py-2.5 text-xs text-white outline-none focus:border-[#fcd535] flex-1 md:w-[280px]"
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
                                                timer: 2000,
                                                showConfirmButton: false,
                                                background: '#1E2329',
                                                color: '#FFF'
                                            });
                                        }}
                                        className="bg-[#fcd535] hover:bg-yellow-400 text-black text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shrink-0"
                                    >
                                        Audit Address
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedWallet === 'custom' && !isAuditingCustom ? (
                        <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                            <div className="p-4 bg-alphabag-yellow/10 rounded-full text-alphabag-yellow animate-bounce">
                                <Search size={32} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white uppercase">Waiting for Audit Target</h4>
                                <p className="text-xs text-alphabag-subtext mt-1 max-w-sm mx-auto">Please enter a valid wallet address in the field above and click "Audit Address" to query on-chain fee logs.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Summary Auditor cards grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-xl p-5 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Cumulative Bleed</span>
                                        <div className="px-2 py-0.5 rounded text-[8px] font-black bg-orange-500/10 text-orange-400 border border-orange-500/20">Gas Fees</div>
                                    </div>
                                    <div className="text-3xl font-extrabold text-alphabag-text tabular-data">${feeAuditData.gasSpent.toFixed(2)}</div>
                                    <p className="text-[10px] text-alphabag-muted mt-2 font-medium">Estimated execution gas cost lost to consensus validators.</p>
                                </div>
                                <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-xl p-5 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] text-alphabag-red font-bold uppercase tracking-wider">Slippage Leakage</span>
                                        <div className="px-2 py-0.5 rounded text-[8px] font-black bg-red-500/10 text-alphabag-red border border-red-500/20">MEV Loss</div>
                                    </div>
                                    <div className="text-3xl font-extrabold text-alphabag-text tabular-data">${feeAuditData.slippageLoss.toFixed(2)}</div>
                                    <p className="text-[10px] text-alphabag-muted mt-2 font-medium">Slippage loss due to frontrunning or sub-optimal trade routes.</p>
                                </div>
                                <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-xl p-5 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Bridge Friction</span>
                                        <div className="px-2 py-0.5 rounded text-[8px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">Network Tolls</div>
                                    </div>
                                    <div className="text-3xl font-extrabold text-alphabag-text tabular-data">${feeAuditData.bridgeFriction.toFixed(2)}</div>
                                    <p className="text-[10px] text-alphabag-muted mt-2 font-medium">Friction charges incurred during cross-chain asset bridging.</p>
                                </div>
                            </div>

                            {/* Middle section: Chart & recommendations */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                
                                {/* Network Leakage Chart Breakdown (5 cols) */}
                                <div className="lg:col-span-5 bg-alphabag-darkgray border border-alphabag-gray rounded-xl p-5">
                                    <h3 className="text-xs font-black uppercase text-white tracking-widest mb-4">Network Leakage Share</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs font-semibold mb-1">
                                                <span className="text-white">Ethereum</span>
                                                <span className="text-alphabag-muted">{feeAuditData.ethLeakage}%</span>
                                            </div>
                                            <div className="w-full bg-alphabag-dark h-2.5 rounded-full overflow-hidden">
                                                <div className="bg-[#3B82F6] h-full rounded-full" style={{ width: `${feeAuditData.ethLeakage}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-semibold mb-1">
                                                <span className="text-white">BSC Network</span>
                                                <span className="text-alphabag-muted">{feeAuditData.bscLeakage}%</span>
                                            </div>
                                            <div className="w-full bg-alphabag-dark h-2.5 rounded-full overflow-hidden">
                                                <div className="bg-[#fcd535] h-full rounded-full" style={{ width: `${feeAuditData.bscLeakage}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-semibold mb-1">
                                                <span className="text-white">Base Network</span>
                                                <span className="text-alphabag-muted">{feeAuditData.baseLeakage}%</span>
                                            </div>
                                            <div className="w-full bg-alphabag-dark h-2.5 rounded-full overflow-hidden">
                                                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${feeAuditData.baseLeakage}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs font-semibold mb-1">
                                                <span className="text-white">Solana</span>
                                                <span className="text-alphabag-muted">{feeAuditData.solLeakage}%</span>
                                            </div>
                                            <div className="w-full bg-alphabag-dark h-2.5 rounded-full overflow-hidden">
                                                <div className="bg-[#0ECB81] h-full rounded-full" style={{ width: `${feeAuditData.solLeakage}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Optimization Recommendations (7 cols) */}
                                <div className="lg:col-span-7 bg-alphabag-darkgray border border-alphabag-gray rounded-xl p-5 space-y-4">
                                    <h3 className="text-xs font-black uppercase text-white tracking-widest border-b border-alphabag-gray pb-3 flex items-center gap-2">
                                        <TrendingUp size={14} className="text-alphabag-yellow" /> AI Fee Optimizer Reports
                                    </h3>
                                    <div className="space-y-3.5 text-xs text-alphabag-subtext leading-relaxed">
                                        <div className="flex items-start gap-2.5">
                                            <span className="text-[#fcd535] shrink-0 mt-0.5">▪</span>
                                            <p>Your **Ethereum** network fee share is **{feeAuditData.ethLeakage}%** of your total cumulative bleed. Recommend routing token trades through L2 aggregators like **Arbitrum** or **Optimism** to cut swap gas by 85%.</p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <span className="text-[#fcd535] shrink-0 mt-0.5">▪</span>
                                            <p>Estimated slippage leakage is **${feeAuditData.slippageLoss.toFixed(2)}**. This is likely due to direct swap interactions with standard DEX router pools. Consider switching to private RPC endpoints (e.g. **Flashbots Protect**) in your Web3 wallet extension to mitigate MEV sandwiching.</p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <span className="text-[#fcd535] shrink-0 mt-0.5">▪</span>
                                            <p>Cross-chain bridges accounted for **${feeAuditData.bridgeFriction.toFixed(2)}** in friction toll fees. Recommend using cheaper messaging bridges like **Stargate** or **Across** rather than high-margin direct layer-1 portals.</p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Audit table logs list */}
                            <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-xl p-5">
                                <h3 className="text-xs font-black uppercase text-white tracking-widest mb-4 pb-3 border-b border-alphabag-gray">Audited Fee Log</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-alphabag-subtext text-[10px] uppercase font-bold tracking-wider border-b border-alphabag-gray/50">
                                                <th className="pb-3 px-2">Asset</th>
                                                <th className="pb-3 px-2">Action</th>
                                                <th className="pb-3 px-2">Network</th>
                                                <th className="pb-3 px-2 text-right">Fee (USD)</th>
                                                <th className="pb-3 px-2 text-right">Audit Assessment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2b3139]/20 text-xs">
                                            {feeAuditData.txs.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3 px-2 font-bold text-white flex items-center gap-2">
                                                        <img src={tx.logo} className="w-4 h-4 rounded-full" alt={tx.asset} /> {tx.asset}
                                                    </td>
                                                    <td className="py-3 px-2 text-alphabag-subtext">{tx.action}</td>
                                                    <td className="py-3 px-2 text-alphabag-muted font-medium">{tx.net}</td>
                                                    <td className="py-3 px-2 text-right text-white font-mono font-semibold">${tx.fee.toFixed(2)}</td>
                                                    <td className="py-3 px-2 text-right">
                                                        <span className={`text-[8px] font-black uppercase border px-2 py-0.5 rounded ${tx.color}`}>
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
