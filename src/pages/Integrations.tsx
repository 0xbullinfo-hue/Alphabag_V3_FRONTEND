import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Search, Settings2, ExternalLink, Activity, Network, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

type Tab = 'ALL' | 'CEX' | 'WALLET';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ALL', label: 'All Connections' },
  { id: 'CEX', label: 'API Keys (Exchanges)' },
  { id: 'WALLET', label: 'Wallets (On-Chain)' }
];

interface AggregatedConnection {
    id: string;
    name: string;
    subtext: string;
    icon: React.ReactNode | string;
    category: 'CEX' | 'WALLET';
    status: 'ACTIVE';
}

export const Integrations: React.FC = () => {
  const { trackedWallets } = useWallet();
  const navigate = useNavigate();
  const [cexConnections, setCexConnections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Read CEX connections directly from local storage as established in CexBag.tsx
    const saved = localStorage.getItem('alphabag_cex_connections');
    if (saved) {
        setCexConnections(JSON.parse(saved));
    }
  }, []);

  // Normalize data into a single unified list
  const aggregatedData: AggregatedConnection[] = [
      ...cexConnections.map(cex => ({
          id: `cex-${cex.id}`,
          name: cex.name,
          subtext: `API Key: ${cex.apiKey}`,
          icon: cex.icon,
          category: 'CEX' as const,
          status: 'ACTIVE' as const
      })),
      ...trackedWallets.filter(w => w.type === 'PORTFOLIO').map(wallet => ({
          id: `wallet-${wallet.id}`,
          name: wallet.label || 'Web3 Connection',
          subtext: `Chain: ${wallet.chain} | ${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`,
          icon: <Wallet size={24} className="text-white" />,
          category: 'WALLET' as const,
          status: 'ACTIVE' as const
      }))
  ];

  const filtered = aggregatedData.filter(item => {
    const matchesTab = activeTab === 'ALL' || item.category === activeTab;
    const searchTarget = `${item.name} ${item.subtext}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[calc(100vh-12rem)] max-w-5xl mx-auto pb-10">
      
      {/* Settings Header */}
      <div className="bg-alphabag-dark border border-alphabag-gray rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Network size={120} />
        </div>
        
        <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative flex items-center gap-3">
               Connections <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">Hub</span>
            </h1>
            <p className="text-alphabag-subtext mt-1 text-sm max-w-md">
                A unified, read-only dashboard showing all live API keys and Web3 wallets currently streaming into AlphaBAG.
            </p>
        </div>

        <div className="relative z-10 w-full md:w-auto">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-alphabag-subtext" />
             </div>
             <input 
                type="text" 
                placeholder="Search active connections..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-alphabag-black border border-alphabag-gray rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-alphabag-yellow w-full md:w-72 transition-colors shadow-inner"
             />
        </div>
      </div>

      {/* Connection Prompts - Since Hub is Read-Only, direct users to the Bags to connect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-alphabag-dark/50 border border-alphabag-gray border-dashed rounded-2xl p-4 flex items-center justify-between hover:bg-alphabag-dark transition-colors">
              <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Need to add an Exchange?</h3>
                  <p className="text-xs text-alphabag-subtext">Manage active API Keys in the CEX Bag.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/cex-bag')} className="text-xs border-alphabag-gray">
                 Add CEX API <ExternalLink size={12} className="ml-1.5" />
              </Button>
          </div>
          <div className="bg-alphabag-dark/50 border border-alphabag-gray border-dashed rounded-2xl p-4 flex items-center justify-between hover:bg-alphabag-dark transition-colors">
              <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">Need to add a Web3 Wallet?</h3>
                  <p className="text-xs text-alphabag-subtext">Connect on-chain wallets in the DEX Hub.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/dex-bag')} className="text-xs border-alphabag-gray">
                 Set BAG <ExternalLink size={12} className="ml-1.5" />
              </Button>
          </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex overflow-x-auto custom-scrollbar pb-2 gap-2 mt-4">
         {TABS.map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                    ? 'bg-alphabag-yellow text-alphabag-black shadow-md' 
                    : 'bg-transparent border border-alphabag-gray text-alphabag-subtext hover:text-white hover:border-alphabag-gray'
                }`}
             >
                 {tab.label}
             </button>
         ))}
      </div>

      {/* Aggregated List Layout */}
      <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
            <div className="p-16 text-center text-alphabag-subtext flex flex-col items-center">
                <Settings2 size={48} className="opacity-20 mb-4" />
                <p className="font-bold text-white mb-1">No Active Connections</p>
                <p className="text-sm">You haven't linked any CEX APIs or Web3 Wallets yet.</p>
            </div>
        ) : (
            <div className="divide-y divide-alphabag-gray/50">
                {filtered.map((item) => (
                    <div key={item.id} className="p-5 hover:bg-alphabag-black/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                        
                        {/* Identity */}
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative shrink-0 w-12 h-12 rounded-full bg-alphabag-black border border-alphabag-gray flex items-center justify-center overflow-hidden">
                                {typeof item.icon === 'string' ? (
                                    <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain p-1" />
                                ) : (
                                    item.icon
                                )}
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-alphabag-green rounded-full border-2 border-alphabag-dark"></div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-white text-lg">{item.name}</h3>
                                    <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded uppercase ${item.category === 'CEX' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                       {item.category}
                                    </span>
                                </div>
                                <p className="text-sm font-mono text-alphabag-subtext mt-0.5">
                                   {item.subtext}
                                </p>
                            </div>
                        </div>

                        {/* Status Widget */}
                        <div className="flex items-center gap-4 w-full md:w-auto justify-end border-t md:border-t-0 border-alphabag-gray/30 pt-4 md:pt-0">
                            <div className="flex items-center gap-2 bg-alphabag-green/10 border border-alphabag-green/20 px-3 py-1.5 rounded-lg">
                                <Activity size={14} className="text-alphabag-green animate-pulse" />
                                <span className="text-xs font-bold text-alphabag-green uppercase tracking-wider">Live</span>
                            </div>
                        </div>
                        
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
};
