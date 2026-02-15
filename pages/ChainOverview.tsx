
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
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="text-alphabag-subtext hover:text-white">
                <ArrowLeft size={20} />
            </button>
            <div className="flex items-center space-x-3">
                <img src={chain.icon} alt={chain.name} className="w-10 h-10 rounded-full" />
                <div>
                    <h1 className="text-2xl font-bold text-white">{chain.name}</h1>
                    <span className="text-xs text-alphabag-subtext bg-alphabag-gray px-2 py-0.5 rounded uppercase">{chain.symbol}</span>
                </div>
            </div>
        </div>

        <p className="text-alphabag-subtext max-w-3xl">{chain.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <StatCard icon={<Database size={20} className="text-blue-400" />} label="TVL" value={`$${(chain.tvl/1e9).toFixed(2)}B`} />
             <StatCard icon={<Zap size={20} className="text-alphabag-yellow" />} label="TPS" value={chain.tps.toLocaleString()} />
             <StatCard icon={<Activity size={20} className="text-alphabag-green" />} label="Avg Gas" value={`$${chain.avgGas}`} />
             <StatCard icon={<Wallet size={20} className="text-purple-400" />} label="Active Wallets" value={chain.activeWallets.toLocaleString()} />
        </div>

        <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Top Protocols on {chain.name}</h3>
            <div className="text-center py-10 text-alphabag-subtext border border-dashed border-alphabag-gray rounded-lg">
                Protocol list coming soon via API integration.
            </div>
        </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-4 flex items-center space-x-4">
        <div className="p-2 bg-alphabag-black rounded-lg">{icon}</div>
        <div>
            <div className="text-xs text-alphabag-subtext uppercase">{label}</div>
            <div className="text-lg font-bold text-white">{value}</div>
        </div>
    </div>
);
