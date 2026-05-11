
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchChainInfo, fetchChains } from '../services/mockData';
import { ChainInfo } from '../types';
import { ArrowLeft, Activity, Zap, Wallet, Database } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ChainOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chain, setChain] = useState<ChainInfo | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
        setLoading(true);
        fetchChainInfo(id).then(data => {
            setChain(data);
            setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div className="p-8 text-center text-alphabag-subtext">Loading chain data...</div>;
  if (!chain) return <div className="p-8 text-center text-white">Chain not found</div>;

  return (
    <div className="space-y-4 animate-fade-in">
        <div className="flex items-center space-x-3">
            <button onClick={() => navigate(-1)} className="text-alphabag-subtext hover:text-white transition-colors">
                <ArrowLeft size={18} />
            </button>
            <div className="flex items-center space-x-2.5">
                <img src={chain.icon} alt={chain.name} className="w-8 h-8 rounded-full" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">{chain.name}</h1>
                    <span className="text-[9px] text-alphabag-subtext bg-alphabag-gray px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">{chain.symbol}</span>
                </div>
            </div>
        </div>

        <p className="text-alphabag-subtext text-[13px] max-w-3xl opacity-60">{chain.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
             <StatCard icon={<Database size={16} className="text-blue-400" />} label="TVL" value={`$${(chain.tvl/1e9).toFixed(2)}B`} />
             <StatCard icon={<Zap size={16} className="text-alphabag-yellow" />} label="TPS" value={chain.tps.toLocaleString()} />
             <StatCard icon={<Activity size={16} className="text-alphabag-green" />} label="Avg Gas" value={`$${chain.avgGas}`} />
             <StatCard icon={<Wallet size={16} className="text-purple-400" />} label="Wallets" value={chain.activeWallets.toLocaleString()} />
        </div>

        <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Top Protocols</h3>
            <div className="text-center py-8 text-alphabag-subtext border border-dashed border-alphabag-gray rounded-lg text-[11px] font-bold uppercase tracking-widest opacity-40">
                Protocol indexing in progress for Beta phase.
            </div>
        </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-3 flex items-center space-x-3">
        <div className="p-2 bg-alphabag-black rounded-lg border border-white/5">{icon}</div>
        <div>
            <div className="text-[9px] text-alphabag-subtext uppercase font-black tracking-widest">{label}</div>
            <div className="text-base font-black text-white">{value}</div>
        </div>
    </div>
);
