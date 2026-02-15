import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
    BarChart2, PieChart as PieChartIcon, TrendingUp, AlertTriangle,
    Wallet, ArrowUpRight, ArrowDownRight, Activity, Layers, Download
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Button } from '../components/ui/Button';

// Mock Data for Analytics
const pnlData = Array.from({ length: 30 }).map((_, i) => ({
    name: `Day ${i + 1}`,
    value: 10000 + Math.random() * 5000 + (i * 200),
    pnl: (Math.random() * 1000) - 300
}));

const riskData = [
    { name: 'Low Risk (Stables)', value: 30, color: '#3B82F6' },
    { name: 'Medium Risk (Blue Chips)', value: 45, color: '#0ECB81' },
    { name: 'High Risk (Alts)', value: 15, color: '#FCD535' },
    { name: 'Degen (Memes)', value: 10, color: '#F6465D' },
];

const cexAssets = [
    { id: 1, name: 'Binance', status: 'Connected', balance: 14250.80, icon: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png' },
    { id: 2, name: 'Coinbase', status: 'Connected', balance: 5430.20, icon: 'https://cryptologos.cc/logos/coinbase-coin-base-logo.png' },
    { id: 3, name: 'Kraken', status: 'Disconnected', balance: 0, icon: 'https://cryptologos.cc/logos/kraken-logo.png' },
];

import { CexConnectModal } from '../components/CexConnectModal';
import axios from 'axios';

export const Analytics: React.FC = () => {
    const [timeframe, setTimeframe] = useState('30D');
    // Using simple state for demo, realistically this comes from backend
    const [cexList, setCexList] = useState(cexAssets);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeExchange, setActiveExchange] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const openConnectModal = (id: number, name: string) => {
        setActiveExchange(name.toLowerCase());
        setIsModalOpen(true);
    };

    const handleConnectApi = async (apiKey: string, secret: string) => {
        if (!activeExchange) return;
        setIsConnecting(true);

        try {
            // Call backend proxy
            const response = await axios.post('http://localhost:3001/api/cex/balance', {
                exchangeId: activeExchange,
                apiKey,
                secret
            });

            if (response.data.success) {
                // Update specific exchange balance
                // In a real app we'd map the raw balances to USD prices here or on backend
                // For this V2, we'll mock the TOTAL USD value based on the successful connection
                // to keep the frontend simple, but prove the connection worked.
                const mockTotalUsd = 12500 + Math.random() * 5000;

                setCexList(prev => prev.map(c => {
                    if (c.name.toLowerCase() === activeExchange) {
                        return { ...c, status: 'Connected', balance: mockTotalUsd };
                    }
                    return c;
                }));

                Swal.fire({
                    title: 'Exchange Connected',
                    text: 'API Keys verified and portfolio synced!',
                    icon: 'success',
                    background: '#1E2329',
                    color: '#FFF',
                    timer: 2000,
                    showConfirmButton: false
                });
                setIsModalOpen(false);
            }
        } catch (error) {
            Swal.fire({
                title: 'Connection Failed',
                text: 'Invalid API Keys or Permissions. Please check and try again.',
                icon: 'error',
                background: '#1E2329',
                color: '#FFF'
            });
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Advanced Analytics</h1>
                    <p className="text-alphabag-subtext mt-1 text-sm font-medium">
                        Cross-exchange portfolio tracking & risk analysis
                    </p>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                    <Button size="sm" variant="secondary" className="border-alphabag-gray text-alphabag-subtext">
                        <Download size={16} className="mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* CEX Integrations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cexList.map(cex => (
                    <div key={cex.id} className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-5 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                                <img src={cex.icon} alt={cex.name} className="w-8 h-8 rounded-full" />
                                <div>
                                    <h3 className="font-bold text-white">{cex.name}</h3>
                                    <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${cex.status === 'Connected' ? 'border-alphabag-green text-alphabag-green bg-alphabag-green/10' : 'border-alphabag-red text-alphabag-red bg-alphabag-red/10'
                                        }`}>
                                        {cex.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2">
                            <p className="text-alphabag-subtext text-xs font-bold uppercase tracking-widest">Total Balance</p>
                            <p className="text-2xl font-black text-white tracking-tight">
                                {cex.balance > 0 ? `$${cex.balance.toLocaleString()}` : '---'}
                            </p>
                        </div>
                        {cex.status === 'Disconnected' && (
                            <div className="absolute inset-0 bg-alphabag-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" onClick={() => openConnectModal(cex.id, cex.name)} className="bg-alphabag-yellow text-black font-bold uppercase tracking-widest">Connect API</Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* PnL Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center">
                            <Activity size={20} className="text-alphabag-yellow mr-2" />
                            Portfolio Performance
                        </h3>
                        <div className="flex bg-alphabag-black rounded-lg p-1 border border-alphabag-gray">
                            {['7D', '30D', '90D', 'YTD'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${timeframe === t ? 'bg-alphabag-yellow text-black' : 'text-alphabag-subtext hover:text-white'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={pnlData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FCD535" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#FCD535" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" hide />
                                <YAxis orientation="right" tick={{ fill: '#848E9C', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B3139" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E2329', borderColor: '#2B3139', borderRadius: '12px', color: '#FFF' }}
                                    itemStyle={{ color: '#FCD535' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#FCD535" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Risk Analysis */}
                <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 shadow-xl">
                    <h3 className="font-bold text-white flex items-center mb-6">
                        <AlertTriangle size={20} className="text-alphabag-red mr-2" />
                        Risk Allocation
                    </h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riskData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1E2329', borderColor: '#2B3139', borderRadius: '8px' }} />
                                <Legend verticalAlign="bottom" height={36} iconSize={8} formatter={(val) => <span className="text-[10px] text-alphabag-subtext font-bold uppercase ml-1">{val}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                            <span className="text-3xl font-black text-white">7.5</span>
                            <p className="text-[9px] text-alphabag-subtext uppercase font-bold tracking-widest">Risk Score</p>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-alphabag-yellow/5 border border-alphabag-yellow/20 rounded-xl">
                        <p className="text-[10px] text-alphabag-yellow leading-relaxed font-medium">
                            <span className="font-black uppercase">Startling Insight:</span> Your allocation to Degen assets has increased by 15% this week. Consider rebalancing into Stables.
                        </p>
                    </div>
                </div>
            </div>

            <CexConnectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                exchangeName={activeExchange?.toUpperCase() || ''}
                onConnect={handleConnectApi}
                isConnecting={isConnecting}
            />
        </div>
    );
};
