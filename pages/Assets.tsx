import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPortfolioHistory } from '../services/mockData';
import { PortfolioItem, PortfolioHistoryPoint } from '../types';
import { Button } from '../components/ui/Button';
import { 
  Plus, Wallet, TrendingUp, Crown, Zap, Activity, 
  Trash2, Settings, ArrowRight, Briefcase
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useWallet } from '../context/WalletContext';
import { PremiumLock } from '../components/ui/PremiumLock';
import { MetricCard } from '../components/ui/MetricCard';
import { TierBadge } from '../components/ui/TierBadge';

const COLORS = ['#FCD535', '#0ECB81', '#3B82F6', '#8B5CF6', '#F6465D', '#848E9C'];

export const Assets: React.FC = () => {
  const { tier, portfolioItems, trackedWallets, isSyncing, getLimits } = useWallet();
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | 'ALL'>('24H');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const limits = getLimits();
  const activeNodes = trackedWallets.filter(w => w.type === 'PORTFOLIO');
  const totalValue = portfolioItems.reduce((acc, item) => acc + item.value, 0);
  const totalPnL = portfolioItems.reduce((acc, item) => acc + item.pnl, 0);
  const totalPnLPercent = portfolioItems.length > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

  useEffect(() => {
    if (activeNodes.length > 0) {
        setLoading(true);
        fetchPortfolioHistory(timeframe).then((historyData) => {
            setHistory(historyData);
            setLoading(false);
        });
    }
  }, [activeNodes.length, timeframe]);

  const handleManageNodes = () => {
      navigate('/settings');
  };

  if (activeNodes.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-8 max-w-2xl mx-auto animate-fade-in">
            <div className="w-24 h-24 bg-alphabag-gray/50 rounded-3xl flex items-center justify-center text-alphabag-yellow animate-pulse-slow shadow-inner border border-alphabag-gray">
                <Briefcase size={48} fill="currentColor" />
            </div>
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Initialize Tracking Node</h1>
                <p className="text-alphabag-subtext font-medium leading-relaxed">
                    AlphaBAG professional hub synchronizes your global holdings across 100+ chains via read-only node addresses. Add a wallet to start monitoring performance.
                </p>
            </div>
            
            <div className="w-full">
                <Button size="lg" className="px-10 py-5 font-black uppercase tracking-widest shadow-2xl" onClick={handleManageNodes}>
                    <Plus className="mr-2" size={20} /> Add Tracking Node
                </Button>
            </div>

            <p className="text-[10px] text-alphabag-subtext uppercase font-bold tracking-[0.2em] opacity-40">
                Secure 256-bit Node Link • Professional Read-Only Access
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-alphabag-dark border border-alphabag-gray rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 pointer-events-none">
            <Zap size={200} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Unified Portfolio</h1>
            <TierBadge tier={tier} size="lg" />
          </div>
          <div>
            <p className="text-alphabag-subtext text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-60">Aggregate Net Worth (USDT)</p>
            <div className="flex items-baseline gap-4">
                <h2 className="text-5xl font-black text-white tracking-tighter leading-none">
                    ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h2>
                <span className={`text-lg font-black ${totalPnL >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                    {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                </span>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col items-end gap-3 relative z-10">
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-alphabag-subtext font-black uppercase tracking-widest mb-1.5">{activeNodes.length} / {limits.maxPortfolios} NODES SYNCED</span>
                <div className="w-40 h-1.5 bg-alphabag-black border border-alphabag-gray rounded-full overflow-hidden">
                    <div 
                        className="bg-alphabag-yellow h-full transition-all duration-1000 shadow-[0_0_8px_rgba(252,213,53,0.5)]" 
                        style={{ width: `${(activeNodes.length / limits.maxPortfolios) * 100}%` }}
                    ></div>
                </div>
            </div>
            <Button variant="primary" size="md" onClick={handleManageNodes} className="font-black uppercase tracking-widest px-8 py-4 shadow-xl">
                <Settings size={18} className="mr-2" /> Manage Nodes
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Current Equity" value={`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} change={{ value: totalPnLPercent, trend: totalPnL >= 0 ? 'up' : 'down' }} icon={<Wallet size={80} />} />
        <MetricCard title="Unrealized PnL" value={`$${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp size={80} />} />
        <MetricCard title="Primary Asset" value={portfolioItems[0]?.symbol || '---'} icon={<Zap size={80} />} />
        <PremiumLock title="WHALE CORRELATION" description="Authorize Elite Membership to monitor institutional divergence.">
          <MetricCard title="Alpha Index" value="0.84" change={{ value: 5.1, trend: 'up' }} icon={<Activity size={80} className="text-blue-400 opacity-20" />} />
        </PremiumLock>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xs uppercase tracking-widest text-alphabag-subtext flex items-center">
                   <Activity className="mr-2 text-alphabag-yellow" size={16} /> Asset Transmissions
                </h3>
                <div className="flex space-x-1 bg-alphabag-black p-1 rounded-xl border border-alphabag-gray">
                    {['24H', '7D', '30D', 'ALL'].map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf as any)}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                                timeframe === tf ? 'bg-alphabag-gray text-white shadow-lg' : 'text-alphabag-subtext hover:text-white'
                            }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="h-[300px]">
                {loading || isSyncing ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-alphabag-subtext">
                      <div className="w-10 h-10 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin mb-4"></div>
                      <span className="text-[10px] uppercase font-bold tracking-widest">Hydrating performance logs...</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FCD535" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#FCD535" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" vertical={false} opacity={0.2} />
                            <XAxis dataKey="timestamp" tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, {month:'short', day:'numeric'})} stroke="#848E9C" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis domain={['auto', 'auto']} orientation="right" tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} stroke="#848E9C" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#181A20', borderColor: '#2B3139', color: '#FFFFFF', borderRadius: '12px'}} 
                                itemStyle={{color: '#FFFFFF'}} 
                                labelFormatter={(label) => new Date(label).toLocaleDateString()} 
                            />
                            <Area type="monotone" dataKey="value" stroke="#FCD535" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

        <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 flex flex-col h-[400px] shadow-xl">
            <h3 className="font-black text-xs uppercase tracking-widest text-alphabag-subtext flex items-center mb-6">
              Allocation Topology
            </h3>
            <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={portfolioItems} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={3} dataKey="value">
                            {portfolioItems.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{backgroundColor: '#181A20', borderColor: '#2B3139', borderRadius: '12px', color: '#FFFFFF'}} 
                          itemStyle={{ color: '#FFFFFF' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconSize={8} formatter={(val) => <span className="text-[10px] font-black uppercase text-alphabag-subtext ml-1">{val}</span>}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="bg-alphabag-dark border border-alphabag-gray rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-alphabag-gray flex justify-between items-center bg-alphabag-black/20">
            <h3 className="font-black text-lg text-white uppercase tracking-tighter">Synchronized Assets</h3>
            <span className="text-[10px] text-alphabag-subtext font-black uppercase tracking-widest">{portfolioItems.length} active transmissions</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-alphabag-black/40 text-alphabag-subtext text-[10px] uppercase tracking-[0.2em] font-black border-b border-alphabag-gray">
                    <tr>
                        <th className="p-6 pl-8">Network asset</th>
                        <th className="p-6 text-right">Price feed</th>
                        <th className="p-6 text-right">Balance</th>
                        <th className="p-6 text-right">Equity (USD)</th>
                        <th className="p-6 text-right">Node PnL</th>
                        <th className="p-6"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-alphabag-gray/20 text-sm">
                    {portfolioItems.map((item) => (
                        <tr key={item.coinId} className="hover:bg-alphabag-gray/10 transition-colors group">
                            <td className="p-6 pl-8">
                                <div className="flex items-center space-x-4">
                                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl shadow-lg group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="font-black text-white text-lg tracking-tighter leading-none">{item.symbol}</div>
                                        <div className="text-alphabag-subtext text-[10px] font-bold mt-1 uppercase tracking-widest">{item.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-6 text-right">
                                <div className="text-white font-bold">${item.currentPrice.toLocaleString()}</div>
                                <div className={`text-[10px] font-black ${item.priceChange24h >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                    {item.priceChange24h >= 0 ? '▲' : '▼'}{Math.abs(item.priceChange24h).toFixed(2)}%
                                </div>
                            </td>
                            <td className="p-6 text-right">
                                <div className="text-white font-mono text-xs font-bold">{item.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                            </td>
                            <td className="p-6 text-right font-black text-white text-base tracking-tighter">
                                ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-6 text-right">
                                <div className={`font-black ${item.pnl >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                    {item.pnl >= 0 ? '+' : '-'}${Math.abs(item.pnl).toLocaleString()}
                                </div>
                                <div className={`text-[10px] font-black ${item.pnlPercent >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                    {item.pnlPercent >= 0 ? '+' : ''}{item.pnlPercent.toFixed(2)}%
                                </div>
                            </td>
                            <td className="p-6 text-center">
                                <button onClick={handleManageNodes} className="p-2 text-alphabag-subtext hover:text-white transition-colors bg-alphabag-black/50 rounded-xl">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};