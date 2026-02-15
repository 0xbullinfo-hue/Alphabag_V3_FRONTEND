import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchWhaleHoldings } from '../services/mockData';
import { PortfolioItem } from '../types';
import { useWallet } from '../context/WalletContext';
import { ArrowLeft, Eye, ShieldCheck, Share2, MoreHorizontal, TrendingUp, DollarSign, Bell, BellOff, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '../components/ui/Button';

const COLORS = ['#FCD535', '#0ECB81', '#3B82F6', '#8B5CF6', '#F6465D', '#848E9C'];

export const WhaleDetail: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const { trackedWallets, whaleAlerts, toggleWhaleAlert } = useWallet();
  const [holdings, setHoldings] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const whaleInfo = trackedWallets.find(w => w.address === address);
  const totalValue = holdings.reduce((acc, h) => acc + h.value, 0);
  const alertsEnabled = address ? whaleAlerts.includes(address) : false;

  useEffect(() => {
    if (address) {
        setLoading(true);
        fetchWhaleHoldings(address).then(data => {
            setHoldings(data);
            setLoading(false);
        });
    }
  }, [address]);

  const handleToggle = () => {
    if (address) {
        toggleWhaleAlert(address);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-alphabag-subtext font-medium uppercase tracking-widest text-[10px]">Scanning whale wallet...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
        {showToast && (
            <div className="fixed top-20 right-8 z-[60] bg-alphabag-dark border border-alphabag-yellow/50 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 animate-slide-in">
                <div className={`p-1.5 rounded-full ${alertsEnabled ? 'bg-alphabag-green/20 text-alphabag-green' : 'bg-alphabag-red/20 text-alphabag-red'}`}>
                    {alertsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                </div>
                <div>
                    <div className="text-sm font-bold text-white">Alerts {alertsEnabled ? 'Enabled' : 'Disabled'}</div>
                    <div className="text-[10px] text-alphabag-subtext uppercase tracking-widest">For {whaleInfo?.label || 'this whale'}</div>
                </div>
            </div>
        )}

        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <Link to="/whales" className="p-2 bg-alphabag-gray hover:text-white rounded-lg transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">{whaleInfo?.label || 'Unknown Whale'}</h1>
                        <span className="bg-alphabag-yellow/10 text-alphabag-yellow text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-alphabag-yellow/20">Verified Whale</span>
                    </div>
                    <div className="text-sm font-mono text-alphabag-subtext mt-1">{address}</div>
                </div>
            </div>
            <div className="flex space-x-2">
                <Button variant="ghost" size="sm" className="uppercase font-bold"><Share2 size={18} /></Button>
                <Button variant="ghost" size="sm" className="uppercase font-bold"><MoreHorizontal size={18} /></Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TrendingUp size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-alphabag-subtext text-sm font-medium mb-2 uppercase tracking-widest">Total estimated balance</p>
                        <h2 className="text-5xl font-bold text-white mb-4 tracking-tighter leading-none">
                            ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h2>
                        <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center text-alphabag-green font-bold uppercase tracking-wider">
                                <TrendingUp size={16} className="mr-1" />
                                <span>+4.2% (24h)</span>
                            </div>
                            <div className="text-alphabag-subtext font-medium">
                                Cost basis: <span className="text-white">$15.4M</span>
                            </div>
                            <div className="text-alphabag-subtext font-medium">
                                Active chains: <span className="text-white">Ethereum, Solana</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-alphabag-gray flex justify-between items-center">
                        <h3 className="font-bold text-white uppercase tracking-widest text-xs">Holdings distribution</h3>
                        <div className="text-xs text-alphabag-subtext font-medium">{holdings.length} assets found</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-alphabag-black/40 text-alphabag-subtext text-[10px] uppercase font-bold tracking-widest">
                                <tr>
                                    <th className="p-4 pl-8">Asset</th>
                                    <th className="p-4 text-right">Price</th>
                                    <th className="p-6 text-right">Balance</th>
                                    <th className="p-4 text-right pr-8">Value (USD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-alphabag-gray/50 text-sm">
                                {holdings.map((h, i) => (
                                    <tr key={h.coinId} className="hover:bg-alphabag-gray/20 transition-colors">
                                        <td className="p-4 pl-8">
                                            <div className="flex items-center space-x-3">
                                                <img src={h.image} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <div className="font-bold text-white">{h.symbol}</div>
                                                    <div className="text-xs text-alphabag-subtext font-medium">{h.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-white font-medium">
                                            ${h.currentPrice.toLocaleString()}
                                        </td>
                                        <td className="p-6 text-right text-alphabag-subtext font-medium">
                                            {h.amount.toLocaleString()} {h.symbol}
                                        </td>
                                        <td className="p-4 text-right font-bold text-white pr-8">
                                            ${h.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 h-[400px] flex flex-col">
                    <h3 className="font-bold text-white mb-6 flex items-center uppercase tracking-widest text-xs">
                        <ShieldCheck className="mr-2 text-alphabag-yellow" size={18} />
                        Asset allocation
                    </h3>
                    <div className="flex-1 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={holdings}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {holdings.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#1E2329', borderColor: '#2B3139', borderRadius: '8px', color: '#FFFFFF'}} 
                                    itemStyle={{color: '#FFFFFF'}}
                                />
                                <Legend verticalAlign="bottom" height={36} iconSize={8} formatter={(val) => <span className="text-[10px] uppercase font-bold text-alphabag-subtext ml-1">{val}</span>}/>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-12">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">Top 3</div>
                                <div className="text-[10px] text-alphabag-subtext uppercase font-bold tracking-widest">Holdings</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Whale insights</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-alphabag-black border border-alphabag-gray rounded-xl">
                            <div className="text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-bold">Accumulation strategy</div>
                            <div className="text-sm text-white font-medium">Buying ETH consistently below $3,500 over the last 30 days.</div>
                        </div>
                        <div className="p-4 bg-alphabag-black border border-alphabag-gray rounded-xl">
                            <div className="text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-bold">Risk profile</div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white font-medium">Conservative / Large Cap</span>
                                <span className="text-xs bg-alphabag-green/20 text-alphabag-green px-2 py-0.5 rounded font-bold uppercase">Low Risk</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-6 bg-gradient-to-br rounded-2xl transition-all duration-500 ${alertsEnabled ? 'from-alphabag-green to-emerald-600' : 'from-alphabag-yellow to-orange-500'}`}>
                     <div className="flex items-center space-x-2 mb-3">
                        <div className="bg-black/10 rounded-full p-1.5 flex items-center justify-center">
                            {alertsEnabled ? <Bell size={20} className="text-black" /> : <DollarSign size={20} className="text-black" />}
                        </div>
                        <h4 className="font-extrabold text-lg italic uppercase tracking-tighter text-black">
                            {alertsEnabled ? 'Alerts active' : 'Alpha alerts'}
                        </h4>
                     </div>
                     <p className="text-xs font-bold leading-tight opacity-90 mb-4 text-black">
                        {alertsEnabled 
                            ? "You'll receive push notifications for significant transactions from this wallet." 
                            : "Get push notifications when this whale moves more than $100k USD in assets."}
                     </p>
                     <Button 
                        variant="secondary" 
                        onClick={handleToggle}
                        className={`w-full font-bold shadow-lg transition-all uppercase ${alertsEnabled ? 'bg-white text-alphabag-green border-none hover:bg-white/90' : 'bg-black text-white hover:bg-gray-800 border-none'}`}
                    >
                        {alertsEnabled ? (
                            <span className="flex items-center justify-center"><Check size={16} className="mr-2" /> Monitoring active</span>
                        ) : (
                            "Enable alerts"
                        )}
                     </Button>
                </div>
            </div>
        </div>
    </div>
  );
};