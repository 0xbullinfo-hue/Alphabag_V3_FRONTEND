import React, { useEffect, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { PieChart, Briefcase, Layers, Wallet as WalletIcon, ArrowUpRight, TrendingUp, Search, Radio, ChevronRight, Eye, ShieldCheck, HelpCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export const MyAlphabag: React.FC = () => {
    const navigate = useNavigate();
    const { portfolioItems } = useWallet();
    const [cexTotal, setCexTotal] = useState(0);
    const [cexConnections, setCexConnections] = useState<any[]>([]);

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

    return (
        <div className="w-full space-y-6 pb-12 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-[#2b3139] gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                            <PieChart size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-[#eaecef] tracking-tight">My AlphaBAG</h1>
                        <span className="text-[10px] bg-[#fcd535]/10 text-alphabag-yellow border border-[#fcd535]/20 px-2 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">Live overview</span>
                    </div>
                    <p className="text-[#848e9c] text-sm">Consolidated portfolio overview of your centralized and decentralized assets.</p>
                </div>
            </div>

            {/* Combined Net Worth Hero Card */}
            <div className="bg-[#181a20] border border-[#2b3139] rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-[-50px] right-[-30px] w-40 h-40 bg-[#fcd535] filter blur-[80px] opacity-[0.06] pointer-events-none"></div>
                <div className="space-y-2 z-10">
                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#848e9c]">Combined Net Worth</p>
                    <h2 className="text-4xl font-extrabold text-[#eaecef] tracking-tight tabular-data">
                        ${combinedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-[#848e9c] font-medium leading-relaxed">
                        <span className="font-bold text-[#eaecef]">${cexTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> CEX Bag &nbsp;·&nbsp; <span className="font-bold text-[#eaecef]">${dexTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> DEX Bag
                    </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-[#0ecb81] font-bold text-xs shrink-0 self-start md:self-auto border border-green-500/20">
                    <TrendingUp size={14} /> +3.9% Today
                </div>
            </div>

            {/* Split Bags Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* CEX Card */}
                <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-5 hover:border-[#474d57] transition-all relative flex flex-col justify-between h-[280px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-base border border-blue-500/20">C</div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase">CEX Portfolio</h3>
                                    <p className="text-[10px] text-[#848e9c]">
                                        {cexConnections.length > 0 ? cexConnections.map(c => c.name).join(' · ') : 'Binance · Bybit · Kraken'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => triggerComingSoon('CEX Portfolio Details')} className="text-[11px] font-bold text-[#848e9c] hover:text-white border border-[#2b3139] rounded-lg px-2.5 py-1 transition-colors">
                                View Details &rarr;
                            </button>
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-[#eaecef] tabular-data">${cexTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div className="text-xs text-[#0ecb81] font-semibold mt-1 flex items-center gap-1">
                                <TrendingUp size={12} /> +2.1% Today
                            </div>
                        </div>
                    </div>

                    <div>
                        {/* Token Preview Chips */}
                        <div className="flex gap-2 flex-wrap mb-4">
                            <div className="flex items-center gap-1.5 bg-[#181a20]/40 border border-[#2b3139] rounded-lg px-2.5 py-1 text-xs text-[#848e9c]">
                                <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" className="w-3.5 h-3.5 rounded-full" alt="BTC" /> BTC 0.45
                            </div>
                            <div className="flex items-center gap-1.5 bg-[#181a20]/40 border border-[#2b3139] rounded-lg px-2.5 py-1 text-xs text-[#848e9c]">
                                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" className="w-3.5 h-3.5 rounded-full" alt="ETH" /> ETH 4.20
                            </div>
                            <div className="flex items-center gap-1.5 bg-[#181a20]/40 border border-[#2b3139] rounded-lg px-2.5 py-1 text-xs text-[#848e9c]">
                                <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="w-3.5 h-3.5 rounded-full" alt="USDT" /> USDT 3,500
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-[#2b3139]/40 pt-3">
                            <span className="text-[10px] text-[#848e9c] font-medium">{cexConnections.length} Exchanges Connected</span>
                            <button onClick={() => navigate('/settings')} className="text-xs font-bold text-[#fcd535] hover:underline">
                                Configure API Keys &rarr;
                            </button>
                        </div>
                    </div>
                </div>

                {/* DEX Card */}
                <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-5 hover:border-[#474d57] transition-all relative flex flex-col justify-between h-[280px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#fcd535]/10 text-[#fcd535] flex items-center justify-center font-black text-base border border-[#fcd535]/20">D</div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase">DEX Portfolio</h3>
                                    <p className="text-[10px] text-[#848e9c]">
                                        {dexWallets.length || 4} Wallets · {dexChains.length || 6} Chains
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => triggerComingSoon('DEX Portfolio Details')} className="text-[11px] font-bold text-[#848e9c] hover:text-white border border-[#2b3139] rounded-lg px-2.5 py-1 transition-colors">
                                View Details &rarr;
                            </button>
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-[#eaecef] tabular-data">${dexTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div className="text-xs text-[#0ecb81] font-semibold mt-1 flex items-center gap-1">
                                <TrendingUp size={12} /> +5.4% Today
                            </div>
                        </div>
                    </div>

                    <div>
                        {/* Token Preview Chips */}
                        <div className="flex gap-2 flex-wrap mb-4">
                            <div className="flex items-center gap-1.5 bg-[#181a20]/40 border border-[#2b3139] rounded-lg px-2.5 py-1 text-xs text-[#848e9c]">
                                <img src="https://cryptologos.cc/logos/solana-sol-logo.png" className="w-3.5 h-3.5 rounded-full" alt="SOL" /> SOL 42.0
                            </div>
                            <div className="flex items-center gap-1.5 bg-[#181a20]/40 border border-[#2b3139] rounded-lg px-2.5 py-1 text-xs text-[#848e9c]">
                                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" className="w-3.5 h-3.5 rounded-full" alt="ETH" /> ETH 1.84
                            </div>
                            <div className="flex items-center gap-1.5 bg-[#181a20]/40 border border-[#2b3139] rounded-lg px-2.5 py-1 text-xs text-[#848e9c]">
                                <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png" className="w-3.5 h-3.5 rounded-full" alt="PEPE" /> PEPE 180M
                            </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-[#2b3139]/40 pt-3">
                            <span className="text-[10px] text-[#848e9c] font-medium">{dexWallets.length} Wallets Tracked</span>
                            <button onClick={() => navigate('/settings')} className="text-xs font-bold text-[#fcd535] hover:underline">
                                Configure Wallets &rarr;
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Section: Recent Activity & Alpha Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Activity Table (2/3 width) */}
                <div className="lg:col-span-2 bg-[#181a20] border border-[#2b3139] rounded-xl p-5">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#2b3139]">
                        <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                            <Briefcase size={16} className="text-blue-400" /> Recent Holdings
                        </h3>
                        <span className="text-[10px] font-bold text-[#848e9c] uppercase">Combined Assets</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[#848e9c] text-[10px] uppercase font-bold tracking-wider border-b border-[#2b3139]/50">
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
                <div className="bg-[#181a20] border border-[#2b3139] rounded-xl p-5">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#2b3139]">
                        <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                            <Radio size={16} className="text-alphabag-yellow animate-pulse" /> Alpha Radar
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-3 items-start border-b border-[#2b3139]/40 pb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 text-xs font-black">W</div>
                            <div className="space-y-0.5 min-w-0">
                                <p className="text-xs text-[#eaecef] leading-relaxed">
                                    <span className="font-bold">Whale 0x7a2...f31</span> moved <span className="font-bold">1,200 ETH</span> to Binance.
                                </p>
                                <span className="text-[9px] text-[#848e9c] block font-mono">2 min ago</span>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start border-b border-[#2b3139]/40 pb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#fcd535]/10 text-alphabag-yellow border border-[#fcd535]/20 flex items-center justify-center shrink-0 text-xs font-black">A</div>
                            <div className="space-y-0.5 min-w-0">
                                <p className="text-xs text-[#eaecef] leading-relaxed">
                                    <span className="font-bold">Alpha call</span> flagged <span className="font-bold text-alphabag-yellow">$JUP</span> &mdash; 3 analysts bullish.
                                </p>
                                <span className="text-[9px] text-[#848e9c] block font-mono">18 min ago</span>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-[#0ecb81] border border-green-500/20 flex items-center justify-center shrink-0 text-xs font-black">S</div>
                            <div className="space-y-0.5 min-w-0">
                                <p className="text-xs text-[#eaecef] leading-relaxed">
                                    New airdrop mission is live for <span className="font-bold">Genesis</span> members.
                                </p>
                                <span className="text-[9px] text-[#848e9c] block font-mono">1 hour ago</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};
