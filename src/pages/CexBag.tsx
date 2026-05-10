import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Activity, Trash2, ArrowUpRight, ArrowDownRight, RefreshCcw, ShieldCheck, Plus, Key, Zap, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CexConnectModal } from '../components/CexConnectModal';
import { useWallet } from '../context/WalletContext';
import { useCexConnections } from '../hooks/useCexConnections';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// 20-color palette — enough for max allowed exchanges
const CHART_COLORS = [
    '#FCD535','#F97316','#22D3EE','#A78BFA','#34D399',
    '#F43F5E','#60A5FA','#FBBF24','#4ADE80','#E879F9',
    '#FB923C','#38BDF8','#C084FC','#86EFAC','#F472B6',
    '#FDE68A','#6EE7B7','#93C5FD','#DDD6FE','#FDA4AF',
];

// Full Supported CEX List (up to 20)
export const SUPPORTED_CEX = [
    { id: 'binance',  name: 'Binance',  icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png' },
    { id: 'bybit',    name: 'Bybit',    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/521.png' },
    { id: 'okx',      name: 'OKX',      icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/294.png' },
    { id: 'coinbase', name: 'Coinbase', icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/89.png'  },
    { id: 'kraken',   name: 'Kraken',   icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/24.png'  },
    { id: 'kucoin',   name: 'KuCoin',   icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/311.png' },
    { id: 'gate',     name: 'Gate.io',  icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/302.png' },
    { id: 'mexc',     name: 'MEXC',     icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/544.png' },
    { id: 'bitget',   name: 'Bitget',   icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/517.png' },
    { id: 'bingx',    name: 'BingX',    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/4003.png'},
    { id: 'htx',      name: 'HTX',      icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/400.png' },
    { id: 'bitfinex', name: 'Bitfinex', icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/37.png'  },
    { id: 'gemini',   name: 'Gemini',   icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/151.png' },
    { id: 'phemex',   name: 'Phemex',   icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/723.png' },
    { id: 'deribit',  name: 'Deribit',  icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/426.png' },
    { id: 'bitstamp', name: 'Bitstamp', icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/70.png'  },
    { id: 'lbank',    name: 'LBank',    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/498.png' },
    { id: 'bitcomp',  name: 'Bit.com',  icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/1230.png'},
    { id: 'poloniex', name: 'Poloniex', icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/23.png'  },
    { id: 'upbit',    name: 'Upbit',    icon: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/375.png' },
];

// Mock Unified Asset Data (in future: pulled from API per exchange)
const MOCK_ASSETS = [
    { coin: 'Bitcoin',  symbol: 'BTC',  balance: 0.452, price: 64230.50, value: 29032.18, exchange: 'Binance',  img: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'  },
    { coin: 'Ethereum', symbol: 'ETH',  balance: 4.2,   price: 3450.20,  value: 14490.84, exchange: 'Binance',  img: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'  },
    { coin: 'Solana',   symbol: 'SOL',  balance: 145.5, price: 145.20,   value: 21126.60, exchange: 'Coinbase', img: 'https://cryptologos.cc/logos/solana-sol-logo.png'    },
    { coin: 'Tether',   symbol: 'USDT', balance: 3500,  price: 1.00,     value: 3500.00,  exchange: 'Kraken',   img: 'https://cryptologos.cc/logos/tether-usdt-logo.png'   },
];

export const CexBag: React.FC = () => {
    const { tier } = useWallet();
    const { connections: connectedCex, addConnection, removeConnection, totalBalance } = useCexConnections();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeExchange, setActiveExchange] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Max 20 connections — same limit as DEX wallets
    const MAX_CEX = 20;

    const openConnectModal = (cexId: string) => {
        if (connectedCex.find(c => c.id === cexId)) {
            Swal.fire({ title: 'Already Connected', text: 'This exchange is already linked. Remove it first to reconnect.', icon: 'info', background: '#1E2329', color: '#FFF' });
            return;
        }
        if (connectedCex.length >= MAX_CEX) {
            Swal.fire({ title: 'Limit Reached', text: `You can connect up to ${MAX_CEX} exchanges.`, icon: 'warning', background: '#1E2329', color: '#FFF' });
            return;
        }
        setActiveExchange(cexId);
        setIsModalOpen(true);
    };

    const handleConnectApi = async (apiKey: string, _secret: string) => {
        if (!activeExchange) return;
        setIsConnecting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const info = SUPPORTED_CEX.find(c => c.id === activeExchange);
            if (!info) return;
            addConnection({
                ...info,
                apiKey: apiKey.substring(0, 4) + '••••',
                balance: Math.random() * 8000 + 500,
                isConnected: true,
            });
            Swal.fire({ title: 'Connected', text: `Read-Only ${info.name} API verified!`, icon: 'success', timer: 1500, showConfirmButton: false, background: '#1E2329', color: '#FFF' });
            setIsModalOpen(false);
        } finally {
            setIsConnecting(false);
        }
    };

    const mockPnL     = totalBalance * 0.054;
    const mockPnLPct  = 5.4;

    const chartData = connectedCex.map((cex, i) => ({
        name:  cex.name,
        value: parseFloat(cex.balance.toFixed(2)),
        icon:  cex.icon,
        color: CHART_COLORS[i % CHART_COLORS.length],
        pct:   totalBalance > 0 ? ((cex.balance / totalBalance) * 100).toFixed(1) : '0',
    }));

    const availableExchanges = SUPPORTED_CEX.filter(c => !connectedCex.find(cc => cc.id === c.id));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload?.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-alphabag-black border border-alphabag-gray rounded-xl px-4 py-3 shadow-xl text-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <img src={d.icon} className="w-5 h-5 rounded-full" alt={d.name} />
                        <span className="font-black text-white">{d.name}</span>
                    </div>
                    <div className="text-alphabag-yellow font-bold tabular-data">${d.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-alphabag-muted text-xs">{d.pct}% of total</div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-[calc(100vh-12rem)] pb-20 max-w-7xl w-full mx-auto space-y-6 animate-fade-in text-alphabag-text">


            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-white/10 gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-alphabag-yellow to-yellow-600 flex items-center justify-center text-black shadow-glow-yellow/20">
                            <Activity size={20} fill="currentColor" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative flex items-center">
                            My CEX <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">Portfolio</span>
                        </h1>
                        <span className="badge-yellow">Active</span>
                    </div>

                    <div className="flex items-baseline gap-4">
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight tabular-nums flex items-center gap-3 truncate">
                            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2">
                        <div className={`flex items-center px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase ${mockPnL >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {mockPnL >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingUp size={14} className="mr-1 rotate-180" />}
                            {mockPnLPct.toFixed(2)}%
                            <span className="ml-2 opacity-60">(${Math.abs(mockPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                        </div>
                        <span className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest">Aggregate PnL</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="glass-panel px-4 py-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-glow-green"></div>
                        <span className="section-label text-[9px]">API Sync</span>
                    </div>
                    <Button 
                        onClick={() => { setActiveExchange(null); setIsModalOpen(true); }}
                        className="bg-alphabag-yellow text-alphabag-black hover:bg-yellow-400 hover:scale-[1.02] active:scale-[0.98] border-none rounded-2xl px-6 py-3 font-black uppercase tracking-widest text-[10px] shadow-glow-yellow/20 transition-all"
                    >
                        <Plus className="mr-2" size={16} /> Add Exchange
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="glass-panel p-6 relative overflow-hidden group transition-all">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>
                    <span className="section-label mb-3 block">Aggregate Net Worth</span>
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter tabular-nums mb-2">
                        ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <div className="badge-yellow w-fit">CONSOLIDATED ASSETS</div>
                </div>
                <div className="glass-panel p-6 relative overflow-hidden group transition-all">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-alphabag-green/5 rounded-full blur-3xl group-hover:bg-alphabag-green/10 transition-all duration-700"></div>
                    <span className="section-label mb-3 block">Consolidated PnL</span>
                    <div className="flex items-center gap-4 mb-2">
                        <h2 className={`text-3xl md:text-5xl font-black tracking-tighter tabular-nums ${mockPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {mockPnL >= 0 ? '+' : '-'}${Math.abs(mockPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <div className={`badge-${mockPnL >= 0 ? 'green' : 'red'}`}>
                            {mockPnL >= 0 ? '+' : ''}{mockPnLPct.toFixed(2)}%
                        </div>
                    </div>
                    <div className="badge-muted w-fit uppercase">24H Metrics</div>
                </div>
            </div>

            {/* ─── Main Content Grid ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Chart + Table */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Exchange Allocation Chart */}
                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 shadow-lg">
                        <h3 className="font-black text-sm uppercase tracking-widest text-alphabag-subtext mb-4">Exchange Allocation</h3>
                        {connectedCex.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-36 border border-dashed border-alphabag-gray/40 rounded-xl gap-3 text-center px-6">
                                <Key size={24} className="text-alphabag-muted" />
                                <p className="text-alphabag-subtext text-sm font-bold">No exchanges connected</p>
                                <p className="text-alphabag-muted text-xs">Connect a read-only API key to see your allocation chart.</p>
                                <Button size="sm" variant="primary" onClick={() => { setActiveExchange(null); setIsModalOpen(true); }} className="mt-1">
                                    <Plus size={14} className="mr-2" /> Connect First Exchange
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="w-full md:w-48 h-48 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={connectedCex.length > 1 ? 2 : 0} dataKey="value" stroke="none">
                                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Scrollable legend for 20 exchanges */}
                                <div className="flex-1 space-y-2 w-full max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                                    {chartData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <img src={d.icon} alt={d.name} className="w-6 h-6 rounded-full bg-white p-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center text-xs mb-1">
                                                    <span className="font-bold text-white truncate">{d.name}</span>
                                                    <span className="font-black text-white tabular-data shrink-0 ml-2">${d.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="w-full bg-alphabag-black rounded-full h-1.5">
                                                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-black tabular-data shrink-0 w-10 text-right" style={{ color: d.color }}>{d.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Unified Balances Table */}
                    <h3 className="font-black text-sm uppercase tracking-widest text-alphabag-subtext border-b border-alphabag-gray pb-2">Unified Balances</h3>
                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl overflow-hidden shadow-lg">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[560px]">
                                <thead className="bg-alphabag-black/40 text-alphabag-muted text-[10px] uppercase font-black tracking-wider border-b border-alphabag-gray/50">
                                    <tr>
                                        <th className="p-5 px-6">Asset</th>
                                        <th className="p-5 px-6 text-right">Balance</th>
                                        <th className="p-5 px-6 text-right">Value (USD)</th>
                                        <th className="p-5 px-6 text-right">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-alphabag-gray/30 text-sm">
                                    {connectedCex.length === 0 ? (
                                        <tr><td colSpan={4} className="p-16 text-center text-alphabag-subtext">No data. Connect an exchange API key to view balances.</td></tr>
                                    ) : (
                                        MOCK_ASSETS.map((asset, idx) => (
                                            <tr key={idx} className="hover:bg-alphabag-black/20 transition-colors">
                                                <td className="p-5 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <img src={asset.img} alt={asset.symbol} className="w-8 h-8 rounded-full shadow-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                        <div className="overflow-hidden">
                                                            <div className="text-white font-bold text-base truncate" title={asset.symbol}>{asset.symbol}</div>
                                                            <div className="text-alphabag-subtext text-[10px] mt-0.5 truncate" title={asset.coin}>{asset.coin}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right tabular-data">
                                                    <div className="font-bold text-white text-base tracking-tighter truncate" title={asset.balance.toLocaleString()}>{asset.balance.toLocaleString()}</div>
                                                </td>
                                                <td className="py-4 px-6 text-right tabular-data">
                                                    <div className="font-bold text-white text-base tracking-tighter truncate" title={`$${asset.value.toLocaleString()}`}>${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    <div className="text-[10px] text-alphabag-muted mt-1 truncate">@ ${asset.price.toLocaleString()}</div>
                                                </td>
                                                <td className="p-5 px-6 text-right">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext bg-alphabag-gray/30 px-2.5 py-1 rounded border border-alphabag-gray/50">{asset.exchange}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Active Integrations + Add New */}
                <div className="space-y-4">
                    <h3 className="font-black text-sm uppercase tracking-widest text-alphabag-subtext border-b border-alphabag-gray pb-2">Active Integrations</h3>
                    {connectedCex.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {connectedCex.map((cex) => (
                                <div key={cex.id} className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-4 flex items-center justify-between group">
                                    <div className="flex items-center space-x-3">
                                        <img src={cex.icon} alt={cex.name} className="w-8 h-8 rounded-full bg-white p-0.5" />
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{cex.name}</h3>
                                            <div className="flex items-center text-[9px] text-alphabag-green font-bold uppercase tracking-widest mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-alphabag-green mr-1.5 shadow-[0_0_5px_rgba(52,211,153,0.8)]"></div>
                                                Live API
                                            </div>
                                            <div className="text-alphabag-muted text-[9px] font-mono mt-0.5">{cex.apiKey}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeConnection(cex.id)} className="text-alphabag-subtext hover:text-alphabag-red transition-colors opacity-50 hover:opacity-100 p-2">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-alphabag-black/20 border border-alphabag-gray/50 border-dashed rounded-xl p-6 text-center">
                            <p className="text-alphabag-subtext text-xs">No active CEX connections.</p>
                        </div>
                    )}

                    <div className="pt-2 border-t border-alphabag-gray/50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-alphabag-muted mb-3">
                            Available ({availableExchanges.length} remaining)
                        </h4>
                        <div className="grid grid-cols-5 gap-2">
                            {availableExchanges.map(cex => (
                                <button
                                    key={cex.id}
                                    onClick={() => openConnectModal(cex.id)}
                                    className="flex items-center justify-center p-2 bg-alphabag-black border border-alphabag-gray rounded-xl hover:bg-white/5 hover:border-alphabag-yellow/40 transition-all group"
                                    title={`Connect ${cex.name}`}
                                >
                                    <img src={cex.icon} alt={cex.name} className="w-6 h-6 rounded-full bg-white p-0.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <CexConnectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                exchangeName={activeExchange ? SUPPORTED_CEX.find(c => c.id === activeExchange)?.name || 'Exchange' : 'Exchange'}
                onConnect={handleConnectApi}
                isConnecting={isConnecting}
            />
        </div>
    );
};
