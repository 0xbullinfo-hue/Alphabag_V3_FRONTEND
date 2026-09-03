import { Briefcase,ChevronDown,ChevronUp,Download,Eye,Layers,PieChart as PieChartIcon,Plus,TrendingUp,Wallet2 } from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area,AreaChart,CartesianGrid,Cell,Pie,PieChart as RePieChart,Tooltip as ReTooltip,ResponsiveContainer,XAxis,YAxis } from 'recharts';
import { Button } from '../../components/ui/Button';
import { DataSourceBadge } from '../../components/ui/DataSourceBadge';
import { useWallet } from '../../context/WalletContext';
import { fetchPortfolioHistory } from '../../services/mockData';
import { PortfolioHistoryPoint } from '../../types';
import { HistoryPage } from './History';

const COLORS = ['#FCD535', '#0ECB81', '#3B82F6', '#8B5CF6', '#F6465D', '#848E9C'];

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

    // 24h metrics (Mocked based on current price change for UI demonstration)
    const totalPnL24h = safePortfolioItems.reduce((acc, item) => acc + ((item?.value || 0) * ((item?.priceChange24h || 0) / 100)), 0);
    const totalPnLPercent24h = totalValue > 0 ? (totalPnL24h / totalValue) * 100 : 0;

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
                    // Continue with empty history rather than crashing
                });
        }
    }, [activeWallets.length, timeframe]);

    const handleManageConnections = () => {
        navigate('/settings');
    };

    if (activeWallets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-2 max-w-2xl mx-auto animate-fade-in">
                <div className="w-24 h-24 bg-alphabag-gray/50 rounded-3xl flex items-center justify-center text-alphabag-yellow animate-pulse-slow shadow-inner border border-alphabag-gray">
                    <Briefcase size={48} fill="currentColor" />
                </div>
                <div className="space-y-2">
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
        <div className="space-y-2 animate-in fade-in duration-700 pb-20 w-full">



            {/* 1. Header Area */}
            <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-dark">
                            <Wallet2 size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">DEX Portfolio</h1>
                        <span className="bg-alphabag-yellow/10 text-alphabag-yellow text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider">Default</span>
                        {hasMockData ? (
                            <span className="bg-alphabag-yellow/10 text-alphabag-yellow text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider">Demo Data</span>
                        ) : (
                            <span className="bg-alphabag-green/10 text-alphabag-green text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider">{isSyncing ? 'Syncing…' : 'Live Sync'}</span>
                        )}
                        <DataSourceBadge className="ml-auto" actuallyMock={hasMockData} />
                    </div>

                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-semibold text-alphabag-text tracking-tight tabular-nums flex items-center gap-2 truncate">
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <Eye size={16} className="text-alphabag-subtext cursor-pointer hover:text-alphabag-text transition-colors shrink-0" />
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`flex items-center px-3 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase border ${
                            totalPnL24h >= 0 ? 'bg-alphabag-green/10 text-alphabag-green border-alphabag-green/20' : 'bg-alphabag-red/10 text-alphabag-red border-alphabag-red/20'
                        }`}>
                            {totalPnL24h >= 0 ? <ChevronUp size={13} className="mr-1" /> : <ChevronDown size={13} className="mr-1" />}
                            {totalPnLPercent24h.toFixed(2)}%
                            <span className="ml-2 opacity-70">(${Math.abs(totalPnL24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                        </div>
                        <span className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider">24h Change</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-[11px] text-alphabag-subtext uppercase font-semibold tracking-wider">Charts</span>
                        <div
                            className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-all duration-300 ${showCharts ? 'bg-alphabag-yellow' : 'bg-alphabag-gray'}`}
                            onClick={() => setShowCharts(!showCharts)}
                        >
                            <div className={`w-3 h-3 bg-alphabag-dark rounded-full shadow-sm transition-transform duration-300 ${showCharts ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    <button
                        onClick={handleManageConnections}
                        className="bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] border-none rounded-md px-5 py-2 font-semibold text-[11px] uppercase tracking-wider transition-all"
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
                        className="bg-alphabag-gray text-alphabag-text border border-alphabag-muted rounded-md px-4 py-2 text-xs font-semibold hover:bg-alphabag-muted transition-all flex items-center gap-1.5"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-alphabag-gray">
                <span onClick={() => setActiveTab('overview')} className={`font-semibold pb-4 -mb-px px-1 cursor-pointer transition-colors text-sm ${activeTab === 'overview' ? 'text-alphabag-text border-b-2 border-alphabag-yellow' : 'text-alphabag-subtext hover:text-alphabag-text'}`}>Overview</span>
                <span onClick={() => setActiveTab('transactions')} className={`font-semibold pb-4 -mb-px px-1 cursor-pointer transition-colors text-sm ${activeTab === 'transactions' ? 'text-alphabag-text border-b-2 border-alphabag-yellow' : 'text-alphabag-subtext hover:text-alphabag-text'}`}>Transactions</span>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* 2. Metrics 4-Card Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {/* All-time profit */}
                        <div className="glass-panel p-4 group rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <span className="section-label">PnL Protocol</span>
                                <div className={`p-1.5 rounded-lg ${totalPnL >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    <TrendingUp size={14} />
                                </div>
                            </div>
                            {hasAnyKnownCostBasis ? (
                                <>
                                    <div className={`text-2xl font-black mb-1 tracking-tight tabular-nums ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className={`badge-${totalPnL >= 0 ? 'green' : 'red'} w-fit`}>
                                        {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}% ALL TIME
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-lg font-black mb-1 tracking-tight text-alphabag-subtext">
                                        No cost basis logged
                                    </div>
                                    <button onClick={handleManageConnections} className="badge-yellow w-fit text-[9px]">
                                        Log a buy price to see real P&L
                                    </button>
                                </>
                            )}
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
                            
                            <div className="flex items-center justify-between mb-3">
                                <span className="section-label">Top Performer</span>
                                <div className="badge-green">ALPHA</div>
                            </div>
                            {bestPerformer ? (
                                <>
                                    <div className="flex items-center gap-2 mb-2 relative z-10">
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
                            
                            <div className="flex items-center justify-between mb-3">
                                <span className="section-label">Risk Asset</span>
                                <div className="badge-red">UNDERWATER</div>
                            </div>
                            {worstPerformer ? (
                                <>
                                    <div className="flex items-center gap-2 mb-2 relative z-10">
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

                            {/* History Chart */}
                            <div className="lg:col-span-2 glass-panel bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-white uppercase tracking-tight">History</h3>
                                        <Eye size={14} className="text-alphabag-subtext" />
                                    </div>
                                    <div className="flex space-x-1 bg-black/40 p-1 rounded-lg border border-white/5">
                                        {['24H', '7D', '30D', '90D', 'ALL'].map((tf) => (
                                            <button
                                                key={tf}
                                                onClick={() => setTimeframe(tf as any)}
                                                className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all tracking-widest ${timeframe === tf ? 'bg-alphabag-yellow/20 text-alphabag-yellow border border-alphabag-yellow/50 ' : 'text-alphabag-subtext hover:text-white border border-transparent'}`}
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
                                <h3 className="font-black text-white mb-2 uppercase tracking-tight">Allocation</h3>
                                <div className="flex-1 flex flex-row items-center justify-center gap-2">

                                    <div className="w-1/2 h-[180px] relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie data={filteredItems} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                                                    {filteredItems.map((_entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <PieChartIcon size={24} className="text-alphabag-subtext" />
                                        </div>
                                    </div>

                                    <div className="w-1/2 flex flex-col justify-center space-y-2">
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
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-3">
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
                                    {!hasVisibleAssets && !isSyncing ? (
                                        <tr>
                                            <td colSpan={8} className="py-16">
                                                <div className="flex flex-col items-center justify-center text-center px-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-alphabag-yellow/10 text-alphabag-yellow flex items-center justify-center mb-2">
                                                        <PieChartIcon size={24} />
                                                    </div>
                                                    <h4 className="text-base font-bold text-white uppercase tracking-wider">No assets detected</h4>
                                                    <p className="text-sm text-alphabag-subtext mt-2 max-w-md">
                                                        Add a tracked wallet or a manual transaction to start building your premium portfolio view.
                                                    </p>
                                                    <div className="mt-4 flex gap-2">
                                                        <Button size="sm" onClick={handleManageConnections} className="px-5 py-2.5 font-semibold uppercase tracking-wider">
                                                            Manage Wallets
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
                                                <tr key={item.coinId} className="hover:bg-alphabag-gray/30 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
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
                                                        <div className="h-8 w-24 ml-auto flex items-center justify-end text-alphabag-subtext text-[10px] font-semibold">
                                                            {/* Real per-token price history isn't wired up yet — showing
                                                                a randomized line here previously implied a real 7d
                                                                trend that had no relation to the actual asset. */}
                                                            No history yet
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
                                                        {item.costBasisKnown ? (
                                                            <>
                                                                <div className={`font-bold tracking-tighter truncate ${holdsPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`} title={`$${item.pnl.toLocaleString()}`}>
                                                                    {holdsPositive ? '+' : '-'}${Math.abs(item.pnl).toLocaleString()}
                                                                </div>
                                                                <div className={`text-xs font-bold flex items-center justify-end gap-0.5 mt-0.5 tracking-tighter truncate ${holdsPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                                    {holdsPositive ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {Math.abs(item.pnlPercent).toFixed(2)}%
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={handleManageConnections}
                                                                className="text-alphabag-subtext text-[10px] font-bold uppercase tracking-wider hover:text-alphabag-yellow transition-colors"
                                                            >
                                                                + Add cost basis
                                                            </button>
                                                        )}
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
