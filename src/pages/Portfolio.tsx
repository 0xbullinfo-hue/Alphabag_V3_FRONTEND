import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPortfolioHistory } from '../services/mockData';
import { PortfolioHistoryPoint } from '../types';
import { Button } from '../components/ui/Button';
import { Plus, Settings, Briefcase, Eye, ChevronUp, ChevronDown, Download, PieChart as PieChartIcon, Layers, BarChart3, Shield, Zap, TrendingUp, Wallet2 } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useWallet } from '../context/WalletContext';
import { Sparkline } from '../components/ui/Sparkline';
import { HistoryPage } from './History';

const COLORS = ['#FCD535', '#0ECB81', '#3B82F6', '#8B5CF6', '#F6465D', '#848E9C'];

export const Portfolio: React.FC = () => {
    const { portfolioItems, trackedWallets, isSyncing, getLimits, hideSmallBalances, toggleHideSmallBalances } = useWallet();
    const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
    const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | '90D' | 'ALL'>('ALL');
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showCharts, setShowCharts] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
    const navigate = useNavigate();

    const limits = getLimits();
    const activeWallets = trackedWallets.filter(w => w.type === 'PORTFOLIO');

    // Apply Filters
    const filteredItems = hideSmallBalances
        ? portfolioItems.filter(item => item.value >= 1)
        : portfolioItems;

    // Derived Metrics
    const totalValue = portfolioItems.reduce((acc, item) => acc + item.value, 0);
    const totalPnL = portfolioItems.reduce((acc, item) => acc + item.pnl, 0);
    const totalCost = portfolioItems.reduce((acc, item) => acc + (item.amount * (item.avgBuyPrice || item.currentPrice)), 0);
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    // 24h metrics (Mocked based on current price change for UI demonstration)
    const totalPnL24h = portfolioItems.reduce((acc, item) => acc + (item.value * (item.priceChange24h / 100)), 0);
    const totalPnLPercent24h = totalValue > 0 ? (totalPnL24h / totalValue) * 100 : 0;

    // Find Best/Worst Performers
    const sortedByPnL = [...portfolioItems].filter(item => item.amount > 0).sort((a, b) => b.pnlPercent - a.pnlPercent);
    const bestPerformer = sortedByPnL.length > 0 && sortedByPnL[0].pnlPercent > 0 ? sortedByPnL[0] : null;
    const worstPerformer = sortedByPnL.length > 0 && sortedByPnL[sortedByPnL.length - 1].pnlPercent < 0 ? sortedByPnL[sortedByPnL.length - 1] : null;

    useEffect(() => {
        if (activeWallets.length > 0) {
            setLoadingHistory(true);
            fetchPortfolioHistory(timeframe === '90D' ? 'ALL' : timeframe as any)
                .then((historyData) => {
                    setHistory(historyData);
                    setLoadingHistory(false);
                })
                .catch((err) => {
                    console.error('[Portfolio] Error fetching history:', err);
                    setLoadingHistory(false);
                    // Continue with empty history rather than crashing
                });
        }
    }, [activeWallets.length, timeframe]);

    const handleManageConnections = () => {
        navigate('/settings');
    };

    if (activeWallets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-8 max-w-2xl mx-auto animate-fade-in">
                <div className="w-24 h-24 bg-alphabag-gray/50 rounded-3xl flex items-center justify-center text-alphabag-yellow animate-pulse-slow shadow-inner border border-alphabag-gray">
                    <Briefcase size={48} fill="currentColor" />
                </div>
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Initialize Tracking Hub</h1>
                    <p className="text-alphabag-subtext font-medium leading-relaxed">
                        AlphaBAG professional hub synchronizes your global holdings across 100+ chains via read-only wallet addresses. Add a wallet to start monitoring your performance.
                    </p>
                </div>

                <div className="w-full">
                    <Button size="lg" className="px-10 py-5 font-black uppercase tracking-widest shadow-2xl bg-alphabag-yellow text-alphabag-black hover:bg-alphabag-yellowHover" onClick={handleManageConnections}>
                        <Plus className="mr-2" size={20} /> Add Tracked Wallet
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto px-4 md:px-8">



            {/* 1. Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-[#2b3139] gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                            <Wallet2 size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-[#eaecef] tracking-tight">DEX Portfolio</h1>
                        <span className="bg-[#fcd535]/10 text-[#fcd535] text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider">Default</span>
                    </div>

                    <div className="flex items-baseline gap-4">
                        <h2 className="text-4xl font-semibold text-[#eaecef] tracking-tight tabular-nums flex items-center gap-3 truncate">
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <Eye size={16} className="text-[#848e9c] cursor-pointer hover:text-[#eaecef] transition-colors shrink-0" />
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2">
                        <div className={`flex items-center px-3 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase border ${
                            totalPnL24h >= 0 ? 'bg-[#0ecb81]/10 text-[#0ecb81] border-[#0ecb81]/20' : 'bg-[#f6465d]/10 text-[#f6465d] border-[#f6465d]/20'
                        }`}>
                            {totalPnL24h >= 0 ? <ChevronUp size={13} className="mr-1" /> : <ChevronDown size={13} className="mr-1" />}
                            {totalPnLPercent24h.toFixed(2)}%
                            <span className="ml-2 opacity-70">(${Math.abs(totalPnL24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                        </div>
                        <span className="text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider">24h Change</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-sm font-semibold">
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-[11px] text-[#848e9c] uppercase font-semibold tracking-wider">Charts</span>
                        <div
                            className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-all duration-300 ${showCharts ? 'bg-[#fcd535]' : 'bg-[#2b3139]'}`}
                            onClick={() => setShowCharts(!showCharts)}
                        >
                            <div className={`w-3 h-3 bg-[#181a20] rounded-full shadow-sm transition-transform duration-300 ${showCharts ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    <button
                        onClick={handleManageConnections}
                        className="bg-[#fcd535] text-[#181a20] hover:bg-[#e0bd2e] active:scale-[0.98] border-none rounded-md px-5 py-2 font-semibold text-[11px] uppercase tracking-wider transition-all"
                    >
                        Manage
                    </button>
                    <button
                        onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8,Date,Portfolio Value\n" +
                                history.map(h => `${new Date(h.timestamp).toLocaleDateString()},${h.value}`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "alphabag_portfolio_history.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="bg-[#2b3139] text-[#eaecef] border border-[#474d57] rounded-md px-4 py-2 text-xs font-semibold hover:bg-[#474d57] transition-all flex items-center gap-1.5"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-6 border-b border-[#2b3139]">
                <span onClick={() => setActiveTab('overview')} className={`font-semibold pb-4 -mb-px px-1 cursor-pointer transition-colors text-sm ${activeTab === 'overview' ? 'text-[#eaecef] border-b-2 border-[#fcd535]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>Overview</span>
                <span onClick={() => setActiveTab('transactions')} className={`font-semibold pb-4 -mb-px px-1 cursor-pointer transition-colors text-sm ${activeTab === 'transactions' ? 'text-[#eaecef] border-b-2 border-[#fcd535]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>Transactions</span>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* 2. Metrics 4-Card Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* All-time profit */}
                        <div className="glass-panel p-4 group rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <span className="section-label">PnL Protocol</span>
                                <div className={`p-1.5 rounded-lg ${totalPnL >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    <TrendingUp size={14} />
                                </div>
                            </div>
                            <div className={`text-2xl font-black mb-1 tracking-tight tabular-nums ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`badge-${totalPnL >= 0 ? 'green' : 'red'} w-fit`}>
                                {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}% ALL TIME
                            </div>
                        </div>

                        {/* Assets */}
                        <div className="glass-panel p-4 group rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <span className="section-label">Token Matrix</span>
                                <div className="p-1.5 rounded-lg bg-white/5 text-alphabag-muted">
                                    <Layers size={14} />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-white mb-1 tracking-tight">
                                {portfolioItems.length} <span className="text-alphabag-muted text-lg">Assets</span>
                            </div>
                            <div className="badge-muted w-fit">
                                TRACKING ON-CHAIN
                            </div>
                        </div>

                        {/* Best Performer */}
                        <div className="glass-panel p-4 group overflow-hidden relative rounded-xl">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all duration-700"></div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="section-label">Top Performer</span>
                                <div className="badge-green">ALPHA</div>
                            </div>
                            {bestPerformer ? (
                                <>
                                    <div className="flex items-center gap-3 mb-2 relative z-10">
                                        <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                                            <TrendingUp size={16} className="text-green-400" />
                                        </div>
                                        <div className="text-xl font-black text-white uppercase tracking-tight truncate">{bestPerformer.symbol}</div>
                                    </div>
                                    <div className="text-2xl font-black text-green-400 tabular-nums">+{bestPerformer.pnlPercent.toFixed(2)}%</div>
                                </>
                            ) : (
                                <div className="text-alphabag-muted text-[10px] font-bold uppercase tracking-widest mt-4">Awaiting Signal...</div>
                            )}
                        </div>

                        {/* Worst Performer */}
                        <div className="glass-panel p-4 group overflow-hidden relative rounded-xl">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all duration-700"></div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="section-label">Risk Asset</span>
                                <div className="badge-red">UNDERWATER</div>
                            </div>
                            {worstPerformer ? (
                                <>
                                    <div className="flex items-center gap-3 mb-2 relative z-10">
                                        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                                            <TrendingUp size={16} className="text-red-400 rotate-180" />
                                        </div>
                                        <div className="text-xl font-black text-white uppercase tracking-tight truncate">{worstPerformer.symbol}</div>
                                    </div>
                                    <div className="text-2xl font-black text-red-400 tabular-nums">{worstPerformer.pnlPercent.toFixed(2)}%</div>
                                </>
                            ) : (
                                <div className="text-alphabag-muted text-[10px] font-bold uppercase tracking-widest mt-4">All Clear...</div>
                            )}
                        </div>
                    </div>

                    {/* 3. Charts Section */}
                    {showCharts && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                            {/* History Chart */}
                            <div className="lg:col-span-2 glass-panel bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-white uppercase tracking-tight">History</h3>
                                        <Eye size={14} className="text-alphabag-subtext" />
                                    </div>
                                    <div className="flex space-x-1 bg-black/40 p-1 rounded-lg border border-white/5">
                                        {['24H', '7D', '30D', '90D', 'ALL'].map((tf) => (
                                            <button
                                                key={tf}
                                                onClick={() => setTimeframe(tf as any)}
                                                className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all tracking-widest ${timeframe === tf ? 'bg-alphabag-yellow/20 text-alphabag-yellow border border-alphabag-yellow/50 shadow-[0_0_15px_rgba(252,213,53,0.2)]' : 'text-alphabag-subtext hover:text-white border border-transparent'}`}
                                            >
                                                {tf}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-[250px] w-full">
                                    {loadingHistory || isSyncing ? (
                                        <div className="h-full w-full flex items-center justify-center text-alphabag-subtext">
                                            <div className="w-6 h-6 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={history} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" vertical={false} />
                                                <XAxis dataKey="timestamp" tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#848E9C" fontSize={10} tickLine={false} axisLine={false} />
                                                <YAxis domain={['auto', 'auto']} orientation="right" tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`} stroke="#848E9C" fontSize={10} tickLine={false} axisLine={false} />
                                                <ReTooltip
                                                    contentStyle={{ backgroundColor: '#181A20', borderColor: '#2B3139', color: '#EAECEF', borderRadius: '8px' }}
                                                    labelFormatter={(label) => new Date(label).toLocaleString()}
                                                    itemStyle={{ color: '#0ECB81', fontWeight: 'bold' }}
                                                />
                                                <Area type="monotone" dataKey="value" stroke="#0ECB81" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Allocation Donut */}
                            <div className="glass-panel bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all">
                                <h3 className="font-black text-white mb-4 uppercase tracking-tight">Allocation</h3>
                                <div className="flex-1 flex flex-row items-center justify-center gap-6">

                                    <div className="w-1/2 h-[180px] relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie data={filteredItems} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                                                    {filteredItems.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <PieChartIcon size={24} className="text-alphabag-subtext" />
                                        </div>
                                    </div>

                                    <div className="w-1/2 flex flex-col justify-center space-y-3">
                                        {filteredItems.slice(0, 6).map((item, index) => {
                                            const filteredTotalValue = filteredItems.reduce((acc, curr) => acc + curr.value, 0);
                                            return (
                                                <div key={item.coinId} className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                        <span className="text-alphabag-text font-medium truncate">{item.name}</span>
                                                    </div>
                                                    <span className="text-alphabag-text font-semibold tabular-data">
                                                        {filteredTotalValue > 0 ? ((item.value / filteredTotalValue) * 100).toFixed(2) : '0.00'}%
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Assets Table Area */}
                    <div className="mt-6 glass-panel bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-3">
                            <div>
                                <h3 className="font-black text-white text-xl uppercase tracking-tight">Assets</h3>
                                <p className="text-[11px] text-alphabag-subtext mt-1 max-w-xl">Track your top holdings, profit drivers, and chain exposure across your connected wallets.</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleHideSmallBalances}
                                className="text-xs text-alphabag-subtext hover:text-alphabag-text"
                            >
                                {hideSmallBalances ? 'Show small balances' : 'Hide small balances (<$1)'}
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="text-alphabag-subtext text-xs border-b-2 border-alphabag-gray">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold w-1/4">Name ↕</th>
                                        <th className="py-3 px-4 font-semibold text-right">Price ↕</th>
                                        <th className="py-3 px-4 font-semibold text-right">24h% ↕</th>
                                        <th className="py-3 px-4 font-semibold text-right w-40">7D Trend</th>
                                        <th className="py-3 px-4 font-semibold text-right">Holdings ↕</th>
                                        <th className="py-2.5 px-4 font-semibold text-right">Avg. Buy Price ↕</th>
                                        <th className="py-2.5 px-4 font-semibold text-right">Profit/Loss ↕</th>
                                        <th className="py-3 px-4 font-semibold text-center w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-alphabag-gray text-sm font-medium">
                                    {filteredItems.length === 0 && !isSyncing ? (
                                        <tr>
                                            <td colSpan={7} className="py-10 text-center text-alphabag-subtext">
                                                No assets found. Add a transaction or tracked wallet.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const holdsPositive = item.pnl >= 0;
                                            const dayPnlPositive = item.priceChange24h >= 0;

                                            // Generate a deterministic but randomized array for the sparkline based on the coinId
                                            const fakeSparklineData = Array.from({ length: 20 }, (_, i) => {
                                                const mod = (item.coinId.charCodeAt(0) + i) % 10;
                                                return (dayPnlPositive ? 10 + mod + (i * 0.5) : 20 - mod - (i * 0.5));
                                            });

                                            return (
                                                <tr key={item.coinId} className="hover:bg-alphabag-gray/30 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={item.image} alt={item.name} className="w-6 h-6 rounded-full" />
                                                            <span className="text-alphabag-text font-bold">{item.name}</span>
                                                            <span className="text-alphabag-subtext text-xs font-semibold">{item.symbol}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-alphabag-text tabular-data">
                                                        <div className="tracking-tighter truncate" title={`$${item.currentPrice.toLocaleString()}`}>
                                                            ${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                        </div>
                                                    </td>
                                                    <td className={`py-3 px-4 text-right tabular-data text-xs font-bold ${dayPnlPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                        <div className="flex items-center justify-end gap-1 tracking-tighter truncate">
                                                            {dayPnlPositive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            {Math.abs(item.priceChange24h).toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right w-40">
                                                        <div className="h-8 w-24 ml-auto">
                                                            <Sparkline data={fakeSparklineData} color={dayPnlPositive ? '#0ECB81' : '#F6465D'} />
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="text-alphabag-text font-bold tabular-data tracking-tighter truncate" title={`$${item.value.toLocaleString()}`}>
                                                            ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                        <div className="text-alphabag-subtext text-xs font-semibold tabular-data mt-0.5 tracking-tighter truncate" title={`${item.amount.toLocaleString()} ${item.symbol}`}>
                                                            {item.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {item.symbol}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-alphabag-text tabular-data">
                                                        <div className="tracking-tighter truncate" title={`$${(item.avgBuyPrice || item.currentPrice).toLocaleString()}`}>
                                                            ${(item.avgBuyPrice || item.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right tabular-data">
                                                        <div className={`font-bold tracking-tighter truncate ${holdsPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`} title={`$${item.pnl.toLocaleString()}`}>
                                                            {holdsPositive ? '+' : '-'}${Math.abs(item.pnl).toLocaleString()}
                                                        </div>
                                                        <div className={`text-xs font-bold flex items-center justify-end gap-0.5 mt-0.5 tracking-tighter truncate ${holdsPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                            {holdsPositive ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {Math.abs(item.pnlPercent).toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-2 text-alphabag-subtext">
                                                            <button className="p-1 hover:text-alphabag-text hover:bg-alphabag-gray rounded"><Plus size={16} /></button>
                                                            <button className="p-1 hover:text-alphabag-text hover:bg-alphabag-gray rounded">•••</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="pt-4">
                    <HistoryPage />
                </div>
            )}
        </div>
    );
};
