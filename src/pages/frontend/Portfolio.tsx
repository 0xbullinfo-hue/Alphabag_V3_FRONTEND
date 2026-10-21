import { ArrowLeft, Briefcase, ChevronDown, ChevronUp, Download, Eye, Layers, PieChart as PieChartIcon, Plus, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../components/ui/Button';
import { DataSourceBadge } from '../../components/ui/DataSourceBadge';
import { PageIcon } from '../../components/ui/PageIcon';
import { useWallet } from '../../context/WalletContext';
import { fetchPortfolioHistory } from '../../services/mockData';
import { PortfolioHistoryPoint } from '../../types';
import { HistoryPage } from './History';
import { formatUsd } from '../../lib/formatters';

const COLORS = ['#F0B90B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B', '#6366F1'];

export const Portfolio: React.FC = () => {
    const { portfolioItems, trackedWallets, isSyncing, hideSmallBalances, toggleHideSmallBalances } = useWallet();
    const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
    const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | '90D' | 'ALL'>('ALL');
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showCharts, setShowCharts] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
    const navigate = useNavigate();

    const safeTrackedWallets = Array.isArray(trackedWallets) ? trackedWallets : [];
    const safePortfolioItems = Array.isArray(portfolioItems) ? portfolioItems : [];
    const activeWallets = safeTrackedWallets.filter(w => w?.type === 'PORTFOLIO');

    // Apply Filters
    const filteredItems = hideSmallBalances
        ? safePortfolioItems.filter(item => item?.value >= 1)
        : safePortfolioItems;
    const hasVisibleAssets = filteredItems.length > 0;

    // Derived Metrics
    const totalValue = safePortfolioItems.reduce((acc, item) => acc + (item?.value || 0), 0);
    const totalPnL = safePortfolioItems.reduce((acc, item) => acc + (item?.pnl || 0), 0);
    const totalCost = safePortfolioItems.reduce((acc, item) => acc + ((item?.amount || 0) * (item?.avgBuyPrice || item?.currentPrice || 0)), 0);
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    // Find Best/Worst Performers
    const knownCostBasisItems = safePortfolioItems.filter(item => item?.costBasisKnown);
    const sortedByPnL = [...knownCostBasisItems].filter(item => (item?.amount || 0) > 0).sort((a, b) => b.pnlPercent - a.pnlPercent);
    const bestPerformer = sortedByPnL.length > 0 && sortedByPnL[0].pnlPercent > 0 ? sortedByPnL[0] : null;
    const worstPerformer = sortedByPnL.length > 0 && sortedByPnL[sortedByPnL.length - 1].pnlPercent < 0 ? sortedByPnL[sortedByPnL.length - 1] : null;

    // Honesty flags for the badges/labels below.
    const hasMockData = safePortfolioItems.some(item => item?.isMockData);
    const hasAnyKnownCostBasis = knownCostBasisItems.length > 0;

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
                });
        }
    }, [activeWallets.length, timeframe]);

    const handleManageConnections = () => {
        navigate('/settings');
    };

    if (activeWallets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-3 max-w-xl mx-auto">
                <div className="w-12 h-12 bg-[#202630] rounded-[6px] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow">
                    <Briefcase size={22} />
                </div>
                <div className="space-y-1.5">
                    <h1 className="text-xl font-bold text-alphabag-text uppercase tracking-tight">Initialize Portfolio Tracking</h1>
                    <p className="text-alphabag-subtext text-xs leading-relaxed max-w-md">
                        AlphaBAG synchronizes your multi-chain holdings across connected wallets and API keys via read-only telemetry.
                    </p>
                </div>

                <div className="w-full max-w-xs pt-2">
                    <Button size="md" className="w-full font-semibold" onClick={handleManageConnections}>
                        <Plus className="mr-1.5" size={16} /> Add Tracked Wallet
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 pb-16 w-full">

            {/* Back to Overview Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/my-alphabag')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-alphabag-subtext hover:text-alphabag-yellow transition-colors cursor-pointer group py-1"
                >
                    <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                    <span>Back to Portfolio Overview</span>
                </button>
            </div>

            {/* 1. Header Area */}
            <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <PageIcon name="portfolio" size={32} />
                        <h1 className="text-xl font-bold text-alphabag-text tracking-tight">Portfolio</h1>
                        <span className="bg-emerald-500/10 text-alphabag-green text-[11px] font-semibold uppercase px-2 py-0.5 rounded-[2px] border border-emerald-500/20">Unified</span>
                        {hasMockData ? (
                            <span className="bg-alphabag-yellow/10 text-alphabag-yellow text-[11px] font-semibold uppercase px-2 py-0.5 rounded-[2px] border border-alphabag-yellow/20">Demo Data</span>
                        ) : (
                            <span className="bg-emerald-500/10 text-alphabag-green text-[11px] font-semibold uppercase px-2 py-0.5 rounded-[2px] border border-emerald-500/20">{isSyncing ? 'Syncing…' : 'Live Sync'}</span>
                        )}
                        <DataSourceBadge className="ml-auto" actuallyMock={hasMockData} />
                    </div>

                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-bold text-alphabag-text tracking-tight num flex items-center gap-2 truncate">
                            {formatUsd(totalValue)}
                            <Eye size={16} className="text-alphabag-subtext cursor-pointer hover:text-alphabag-text transition-colors shrink-0" />
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium border bg-[#202630] text-alphabag-subtext border-[#2B313A]">
                            <span className="text-[11px] text-alphabag-subtext">24h PnL snapshot active</span>
                        </div>
                        <span className="text-[11px] text-alphabag-subtext font-medium">Real-time valuation</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-[11px] text-alphabag-subtext uppercase font-semibold">Charts</span>
                        <button
                            type="button"
                            role="switch"
                            aria-label="Charts"
                            aria-checked={showCharts}
                            className={`w-9 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${showCharts ? 'bg-alphabag-yellow' : 'bg-[#2B313A]'}`}
                            onClick={() => setShowCharts(!showCharts)}
                        >
                            <span aria-hidden="true" className={`w-4 h-4 bg-[#0B0E11] rounded-full transition-transform ${showCharts ? 'translate-x-4' : 'translate-x-0'}`}></span>
                        </button>
                    </div>

                    <button
                        onClick={handleManageConnections}
                        className="bg-alphabag-yellow text-[#0B0E11] hover:bg-[#FCD535] rounded px-4 py-1.5 font-semibold text-xs uppercase tracking-wider transition-colors"
                    >
                        Manage
                    </button>
                    <button
                        onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8,Date,Portfolio Value\n" +
                                history.map((h: PortfolioHistoryPoint) => `${new Date(h.timestamp).toLocaleDateString()},${h.value}`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "alphabag_portfolio_history.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="bg-[#202630] text-alphabag-text border border-[#2B313A] rounded px-3 py-1.5 text-xs font-medium hover:bg-[#2B313A] transition-colors flex items-center gap-1.5"
                    >
                        <Download size={13} /> Export
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-[#2B313A]">
                <button 
                    onClick={() => setActiveTab('overview')} 
                    className={`font-semibold pb-2.5 -mb-px cursor-pointer text-xs transition-colors ${activeTab === 'overview' ? 'text-alphabag-yellow border-b-2 border-alphabag-yellow' : 'text-alphabag-subtext hover:text-alphabag-text'}`}
                >
                    Holdings & Performance
                </button>
                <button 
                    onClick={() => setActiveTab('transactions')} 
                    className={`font-semibold pb-2.5 -mb-px cursor-pointer text-xs transition-colors ${activeTab === 'transactions' ? 'text-alphabag-yellow border-b-2 border-alphabag-yellow' : 'text-alphabag-subtext hover:text-alphabag-text'}`}
                >
                    Transaction Ledger
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* 2. Metrics 4-Card Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {/* All-time profit */}
                        <div className="bg-[#181A20] border border-[#2B313A] p-3.5 rounded-[6px]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-alphabag-subtext uppercase tracking-wider">Unrealized PnL</span>
                                <div className={`p-1 rounded-[2px] ${totalPnL >= 0 ? 'bg-emerald-500/10 text-alphabag-green' : 'bg-rose-500/10 text-alphabag-red'}`}>
                                    <TrendingUp size={13} />
                                </div>
                            </div>
                            {hasAnyKnownCostBasis ? (
                                <>
                                    <div className={`text-xl font-bold mb-1 num ${totalPnL >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                        {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className={`text-[11px] font-semibold num ${totalPnL >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                        {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}% ALL TIME
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-base font-semibold mb-1 text-alphabag-subtext">
                                        No cost basis logged
                                    </div>
                                    <button onClick={handleManageConnections} className="text-[11px] text-alphabag-yellow hover:underline">
                                        Log buy price for PnL &rarr;
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Assets */}
                        <div className="bg-[#181A20] border border-[#2B313A] p-3.5 rounded-[6px]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-alphabag-subtext uppercase tracking-wider">Token Matrix</span>
                                <div className="p-1 rounded-[2px] bg-white/5 text-alphabag-subtext">
                                    <Layers size={13} />
                                </div>
                            </div>
                            <div className="text-xl font-bold text-alphabag-text mb-1 num">
                                {safePortfolioItems.length} <span className="text-alphabag-subtext text-xs font-normal">Assets</span>
                            </div>
                            <div className="text-[11px] text-alphabag-subtext font-medium">
                                ON-CHAIN BALANCES
                            </div>
                        </div>

                        {/* Best Performer */}
                        <div className="bg-[#181A20] border border-[#2B313A] p-3.5 rounded-[6px]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-alphabag-subtext uppercase tracking-wider">Top Performer</span>
                                <span className="text-[11px] font-semibold text-alphabag-green bg-emerald-500/10 px-1.5 py-0.2 rounded-[2px] border border-emerald-500/20">LEADER</span>
                            </div>
                            {bestPerformer ? (
                                <>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="text-base font-bold text-alphabag-text uppercase tracking-tight truncate">{bestPerformer.symbol}</div>
                                    </div>
                                    <div className="text-xl font-bold text-alphabag-green num">+{bestPerformer.pnlPercent.toFixed(2)}%</div>
                                </>
                            ) : (
                                <div className="text-alphabag-subtext text-[11px] mt-2">Awaiting price movement...</div>
                            )}
                        </div>

                        {/* Worst Performer */}
                        <div className="bg-[#181A20] border border-[#2B313A] p-3.5 rounded-[6px]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-alphabag-subtext uppercase tracking-wider">Lagging Asset</span>
                                <span className="text-[11px] font-semibold text-alphabag-red bg-rose-500/10 px-1.5 py-0.2 rounded-[2px] border border-rose-500/20">DRAWDOWN</span>
                            </div>
                            {worstPerformer ? (
                                <>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="text-base font-bold text-alphabag-text uppercase tracking-tight truncate">{worstPerformer.symbol}</div>
                                    </div>
                                    <div className="text-xl font-bold text-alphabag-red num">{worstPerformer.pnlPercent.toFixed(2)}%</div>
                                </>
                            ) : (
                                <div className="text-alphabag-subtext text-[11px] mt-2">No drawdown flagged</div>
                            )}
                        </div>
                    </div>

                    {/* 3. Charts Section */}
                    {showCharts && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">

                            {/* History Chart */}
                            <div className="lg:col-span-2 bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-alphabag-text text-xs uppercase tracking-wider">Historical Net Worth</h3>
                                        <Eye size={13} className="text-alphabag-subtext" />
                                    </div>
                                    <div className="flex space-x-1 bg-[#0B0E11] p-0.5 rounded border border-[#2B313A]">
                                        {['24H', '7D', '30D', '90D', 'ALL'].map((tf) => (
                                            <button
                                                key={tf}
                                                onClick={() => setTimeframe(tf as any)}
                                                className={`px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors ${timeframe === tf ? 'bg-[#202630] text-alphabag-text font-semibold' : 'text-alphabag-subtext hover:text-white'}`}
                                            >
                                                {tf}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-[240px] w-full">
                                    {loadingHistory || isSyncing ? (
                                        <div className="h-full w-full flex items-center justify-center text-alphabag-subtext">
                                            <div className="w-5 h-5 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={history} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#0ECB81" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#0ECB81" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#2B313A" vertical={false} />
                                                <XAxis dataKey="timestamp" tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#848E9C" fontSize={11} tickLine={false} axisLine={false} />
                                                <YAxis domain={['auto', 'auto']} orientation="right" tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`} stroke="#848E9C" fontSize={11} tickLine={false} axisLine={false} />
                                                <ReTooltip
                                                    contentStyle={{ backgroundColor: '#181A20', borderColor: '#2B313A', color: '#EAECEF', borderRadius: '4px', fontSize: '11px' }}
                                                    labelFormatter={(label) => new Date(label).toLocaleString()}
                                                    itemStyle={{ color: '#0ECB81', fontWeight: 'bold' }}
                                                />
                                                <Area type="monotone" dataKey="value" stroke="#0ECB81" strokeWidth={1.5} fillOpacity={1} fill="url(#colorValue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Allocation Donut */}
                            <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4 flex flex-col justify-between">
                                <h3 className="font-semibold text-alphabag-text text-xs uppercase tracking-wider mb-2">Asset Weight</h3>
                                <div className="flex-1 flex flex-row items-center justify-center gap-2">

                                    <div className="w-1/2 h-[160px] relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie data={filteredItems} cx="50%" cy="50%" innerRadius={50} outerRadius={68} paddingAngle={2} dataKey="value" stroke="none">
                                                    {filteredItems.map((_entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <PieChartIcon size={20} className="text-alphabag-subtext" />
                                        </div>
                                    </div>

                                    <div className="w-1/2 flex flex-col justify-center space-y-1.5">
                                        {filteredItems.slice(0, 6).map((item, index) => {
                                            const filteredTotalValue = filteredItems.reduce((acc, curr) => acc + curr.value, 0);
                                            return (
                                                <div key={item.coinId} className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                        <span className="text-alphabag-text truncate">{item.name}</span>
                                                    </div>
                                                    <span className="text-alphabag-subtext num text-[11px]">
                                                        {filteredTotalValue > 0 ? ((item.value / filteredTotalValue) * 100).toFixed(1) : '0.0'}%
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
                    <div className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-4">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-3">
                            <div>
                                <h3 className="font-semibold text-alphabag-text text-sm uppercase tracking-wider">Asset Holdings</h3>
                                <p className="text-xs text-alphabag-subtext mt-0.5">Top balances, cost basis valuation, and multi-network wallet exposure.</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={toggleHideSmallBalances}
                                className="text-xs text-alphabag-subtext hover:text-alphabag-text"
                            >
                                {hideSmallBalances ? 'Show small balances' : 'Hide balances (<$1)'}
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-alphabag-subtext text-[11px] uppercase font-semibold tracking-wider border-b border-[#2B313A]">
                                        <th className="py-2.5 px-3">Asset</th>
                                        <th className="py-2.5 px-3 text-right">Price</th>
                                        <th className="py-2.5 px-3 text-right">24h Change</th>
                                        <th className="py-2.5 px-3 text-right">Holdings</th>
                                        <th className="py-2.5 px-3 text-right">Avg. Cost</th>
                                        <th className="py-2.5 px-3 text-right">PnL</th>
                                        <th className="py-2.5 px-3 text-center w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2B313A]/50 text-xs">
                                    {!hasVisibleAssets && !isSyncing ? (
                                        <tr>
                                            <td colSpan={7} className="py-12">
                                                <div className="flex flex-col items-center justify-center text-center px-4">
                                                    <div className="w-10 h-10 rounded bg-[#202630] text-alphabag-yellow border border-[#2B313A] flex items-center justify-center mb-2">
                                                        <PieChartIcon size={18} />
                                                    </div>
                                                    <h4 className="text-sm font-semibold text-alphabag-text uppercase">No assets tracked</h4>
                                                    <p className="text-xs text-alphabag-subtext mt-1 max-w-sm">
                                                        Add a tracked address or exchange connection to view portfolio balances.
                                                    </p>
                                                    <div className="mt-3">
                                                        <Button size="xs" onClick={handleManageConnections}>
                                                            Manage Connections
                                                        </Button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const holdsPositive = item.pnl >= 0;
                                            const dayPnlPositive = item.priceChange24h >= 0;

                                            return (
                                                <tr key={item.coinId} className="hover:bg-[#202630] transition-colors">
                                                    <td className="py-2.5 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <img src={item.image} alt={item.name} className="w-5 h-5 rounded-full" />
                                                            <span className="text-alphabag-text font-semibold">{item.name}</span>
                                                            <span className="text-alphabag-subtext text-[11px] font-medium">{item.symbol}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right text-alphabag-text num">
                                                        ${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                    </td>
                                                    <td className={`py-2.5 px-3 text-right num text-xs font-semibold ${dayPnlPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                        <div className="flex items-center justify-end gap-0.5">
                                                            {dayPnlPositive ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                            {Math.abs(item.priceChange24h).toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right">
                                                        <div className="text-alphabag-text font-semibold num">
                                                            {formatUsd(item.value)}
                                                        </div>
                                                        <div className="text-alphabag-subtext text-[11px] num">
                                                            {item.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {item.symbol}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right text-alphabag-text num">
                                                        ${(item.avgBuyPrice || item.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right num">
                                                        {item.costBasisKnown ? (
                                                            <>
                                                                <div className={`font-semibold ${holdsPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                                    {holdsPositive ? '+' : '-'}${Math.abs(item.pnl).toLocaleString()}
                                                                </div>
                                                                <div className={`text-[11px] ${holdsPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                                    {holdsPositive ? '+' : '-'}{Math.abs(item.pnlPercent).toFixed(2)}%
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={handleManageConnections}
                                                                className="text-alphabag-subtext text-[11px] font-semibold uppercase hover:text-alphabag-yellow transition-colors"
                                                            >
                                                                + Cost Basis
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <button 
                                                            onClick={handleManageConnections} 
                                                            className="p-1 text-alphabag-subtext hover:text-alphabag-text rounded hover:bg-[#202630]"
                                                            title="Asset Options"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
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
                <div className="pt-2">
                    <HistoryPage />
                </div>
            )}
        </div>
    );
};

export default Portfolio;
