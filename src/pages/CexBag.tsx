import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Activity, Trash2, ArrowUpRight, ArrowDownRight, RefreshCcw, Plus, Key, TrendingUp, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CexConnectModal } from '../components/CexConnectModal';
import { useWallet } from '../context/WalletContext';
import { useCexConnections } from '../hooks/useCexConnections';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CHART_COLORS = [
    '#FCD535','#F97316','#22D3EE','#A78BFA','#34D399',
    '#F43F5E','#60A5FA','#FBBF24','#4ADE80','#E879F9',
    '#FB923C','#38BDF8','#C084FC','#86EFAC','#F472B6',
    '#FDE68A','#6EE7B7','#93C5FD','#DDD6FE','#FDA4AF',
];

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

    const MAX_CEX = 20;

    const openConnectModal = (cexId: string) => {
        if (connectedCex.find(c => c.id === cexId)) {
            Swal.fire({ title: 'Already Connected', text: 'This exchange is already linked. Remove it first to reconnect.', icon: 'info', background: '#1E2329', color: '#EAECEF' });
            return;
        }
        if (connectedCex.length >= MAX_CEX) {
            Swal.fire({ title: 'Limit Reached', text: `You can connect up to ${MAX_CEX} exchanges.`, icon: 'warning', background: '#1E2329', color: '#EAECEF' });
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
            Swal.fire({ title: 'Connected', text: `Read-Only ${info.name} API verified!`, icon: 'success', timer: 1500, showConfirmButton: false, background: '#1E2329', color: '#EAECEF' });
            setIsModalOpen(false);
        } finally {
            setIsConnecting(false);
        }
    };

    const mockPnL    = totalBalance * 0.054;
    const mockPnLPct = 5.4;

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
                <div className="bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-3 shadow-xl text-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <img src={d.icon} className="w-5 h-5 rounded-full" alt={d.name} />
                        <span className="font-semibold text-[#eaecef]">{d.name}</span>
                    </div>
                    <div className="text-[#fcd535] font-semibold tabular-nums">${d.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[#848e9c] text-xs">{d.pct}% of total</div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-5 pb-12 px-4 md:px-8 animate-in fade-in duration-700">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-[#2b3139] gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                            <Layers size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-[#eaecef] tracking-tight">CEX Portfolio</h1>
                    </div>
                    <p className="text-[#848e9c] text-sm font-medium leading-relaxed">
                        Aggregate your centralized exchange balances via read-only <span className="text-[#eaecef] font-semibold">API keys</span>.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-[#2b3139] px-3 py-1.5 rounded-md text-[11px] text-[#0ecb81] font-semibold uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse"></span> API Sync
                    </div>
                    <button
                        onClick={() => { setActiveExchange(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-[#fcd535] text-[#181a20] px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#e0bd2e] active:scale-[0.98] transition-all"
                    >
                        <Plus size={16} /> Add Exchange
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-6">
                    <span className="text-xs font-semibold uppercase text-[#848e9c] block mb-2">Aggregate Net Worth</span>
                    <div className="text-3xl font-semibold text-[#eaecef] tracking-tight tabular-nums mb-2">
                        ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="bg-[#fcd535]/10 text-[#fcd535] px-2 py-1 rounded-md text-[10px] font-semibold uppercase w-fit">Consolidated Assets</div>
                </div>
                <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-6">
                    <span className="text-xs font-semibold uppercase text-[#848e9c] block mb-2">Consolidated PnL</span>
                    <div className={`flex items-center gap-3 mb-2`}>
                        <div className={`text-3xl font-semibold tracking-tight tabular-nums ${mockPnL >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                            {mockPnL >= 0 ? '+' : '-'}${Math.abs(mockPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`px-2 py-1 rounded-md text-[10px] font-semibold ${mockPnL >= 0 ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f6465d]/10 text-[#f6465d]'}`}>
                            {mockPnL >= 0 ? '+' : ''}{mockPnLPct.toFixed(2)}%
                        </div>
                    </div>
                    <div className="bg-[#2b3139] text-[#848e9c] px-2 py-1 rounded-md text-[10px] font-semibold uppercase w-fit">24H Metrics</div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left: Chart + Table */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Exchange Allocation Chart */}
                    <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-6">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#2b3139]">
                            <h3 className="text-xs font-semibold uppercase text-[#848e9c] tracking-wider">Exchange Allocation</h3>
                        </div>
                        {connectedCex.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-36 border border-dashed border-[#2b3139] rounded-lg gap-3 text-center px-6">
                                <Key size={24} className="text-[#848e9c]" />
                                <p className="text-[#848e9c] text-sm font-semibold">No exchanges connected</p>
                                <p className="text-[#848e9c] text-xs">Connect a read-only API key to view your allocation.</p>
                                <button
                                    onClick={() => { setActiveExchange(null); setIsModalOpen(true); }}
                                    className="mt-1 bg-[#fcd535] text-[#181a20] px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#e0bd2e] transition-all"
                                >
                                    <Plus size={14} className="inline mr-1" /> Connect First Exchange
                                </button>
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
                                <div className="flex-1 space-y-2 w-full max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                                    {chartData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <img src={d.icon} alt={d.name} className="w-6 h-6 rounded-full bg-white p-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center text-xs mb-1">
                                                    <span className="font-semibold text-[#eaecef] truncate">{d.name}</span>
                                                    <span className="font-semibold text-[#eaecef] tabular-nums shrink-0 ml-2">${d.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="w-full bg-[#0b0e11] rounded-full h-1.5">
                                                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-semibold tabular-nums shrink-0 w-10 text-right" style={{ color: d.color }}>{d.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Unified Balances Table */}
                    <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#2b3139]">
                            <h3 className="text-xs font-semibold uppercase text-[#848e9c] tracking-wider">Unified Balances</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[560px]">
                                <thead className="bg-[#0b0e11] text-[#848e9c] text-[10px] uppercase font-semibold tracking-wider border-b border-[#2b3139]">
                                    <tr>
                                        <th className="p-4 px-6">Asset</th>
                                        <th className="p-4 px-6 text-right">Balance</th>
                                        <th className="p-4 px-6 text-right">Value (USD)</th>
                                        <th className="p-4 px-6 text-right">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2b3139] text-sm">
                                    {connectedCex.length === 0 ? (
                                        <tr><td colSpan={4} className="p-16 text-center text-[#848e9c] text-xs">No data. Connect an exchange API key to view balances.</td></tr>
                                    ) : (
                                        MOCK_ASSETS.map((asset, idx) => (
                                            <tr key={idx} className="hover:bg-[#2b3139]/40 transition-colors">
                                                <td className="p-4 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <img src={asset.img} alt={asset.symbol} className="w-7 h-7 rounded-full shadow-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                        <div>
                                                            <div className="text-[#eaecef] font-semibold">{asset.symbol}</div>
                                                            <div className="text-[#848e9c] text-[10px] mt-0.5">{asset.coin}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right tabular-nums">
                                                    <div className="font-semibold text-[#eaecef]">{asset.balance.toLocaleString()}</div>
                                                </td>
                                                <td className="py-4 px-6 text-right tabular-nums">
                                                    <div className="font-semibold text-[#eaecef]">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                    <div className="text-[10px] text-[#848e9c] mt-1">@ ${asset.price.toLocaleString()}</div>
                                                </td>
                                                <td className="p-4 px-6 text-right">
                                                    <span className="text-[10px] font-semibold uppercase text-[#848e9c] bg-[#2b3139] px-2 py-0.5 rounded-md border border-[#474d57]">{asset.exchange}</span>
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
                    <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-6">
                        <h3 className="text-xs font-semibold uppercase text-[#848e9c] tracking-wider mb-4 pb-4 border-b border-[#2b3139]">Active Integrations</h3>
                        {connectedCex.length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {connectedCex.map((cex) => (
                                    <div key={cex.id} className="bg-[#0b0e11] border border-[#2b3139] rounded-md p-3 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <img src={cex.icon} alt={cex.name} className="w-8 h-8 rounded-full bg-white p-0.5" />
                                            <div>
                                                <h3 className="font-semibold text-[#eaecef] text-sm">{cex.name}</h3>
                                                <div className="flex items-center text-[9px] text-[#0ecb81] font-semibold uppercase tracking-wider mt-0.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] mr-1.5 animate-pulse"></div>
                                                    Live API
                                                </div>
                                                <div className="text-[#848e9c] text-[9px] font-mono mt-0.5">{cex.apiKey}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => removeConnection(cex.id)} className="text-[#848e9c] hover:text-[#f6465d] transition-colors p-2">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-dashed border-[#2b3139] rounded-md p-6 text-center">
                                <p className="text-[#848e9c] text-xs">No active CEX connections.</p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-6">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#848e9c] mb-4 pb-4 border-b border-[#2b3139]">
                            Available ({availableExchanges.length} remaining)
                        </h4>
                        <div className="grid grid-cols-5 gap-2">
                            {availableExchanges.map(cex => (
                                <button
                                    key={cex.id}
                                    onClick={() => openConnectModal(cex.id)}
                                    className="flex items-center justify-center p-2 bg-[#0b0e11] border border-[#2b3139] rounded-md hover:border-[#fcd535]/40 hover:bg-[#2b3139] transition-all group"
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
