import React, { useEffect, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Search, Settings2, ExternalLink, Activity, Network, Wallet, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

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
    <div className="space-y-4 animate-in fade-in duration-700 relative min-h-[calc(100vh-12rem)] max-w-5xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-[#2b3139] gap-3">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                            <Zap size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-[#eaecef] tracking-tight">Connections Hub</h1>
                        <span className="bg-[#0ecb81]/10 text-[#0ecb81] text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider">Live</span>
                    </div>
                    <p className="text-[#848e9c] text-sm">Unified dashboard for all live API keys and Web3 wallets streaming into AlphaBAG.</p>
                </div>
                <div className="relative z-10 w-full md:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={13} className="text-[#848e9c]" />
                    </div>
                    <input type="text" placeholder="Search connections..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#0b0e11] border border-[#2b3139] rounded-md pl-9 pr-4 py-2 text-xs text-[#eaecef] focus:outline-none focus:border-[#fcd535] w-full md:w-64 transition-colors" />
                </div>
            </div>

      {/* Connection Prompts - Since Hub is Read-Only, direct users to the Bags to connect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 border-dashed rounded-xl p-3 flex items-center justify-between hover:bg-white/[0.08] transition-colors">
              <div>
                  <h3 className="text-xs font-bold text-white mb-0.5">Need to add an Exchange?</h3>
                  <p className="text-[10px] text-alphabag-subtext opacity-60">Manage active API Keys in the CEX Portfolio.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/cex-bag')} className="text-[10px] h-8 font-black uppercase tracking-widest border-white/10 px-3">
                 Add CEX <ExternalLink size={10} className="ml-1" />
              </Button>
          </div>
          <div className="bg-white/5 border border-white/10 border-dashed rounded-xl p-3 flex items-center justify-between hover:bg-white/[0.08] transition-colors">
              <div>
                  <h3 className="text-xs font-bold text-white mb-0.5">Need to add a Web3 Wallet?</h3>
                  <p className="text-[10px] text-alphabag-subtext opacity-60">Connect on-chain wallets in the DEX Portfolio.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/dex-bag')} className="text-[10px] h-8 font-black uppercase tracking-widest border-white/10 px-3">
                 Set BAG <ExternalLink size={10} className="ml-1" />
              </Button>
          </div>
      </div>

      <div className="flex overflow-x-auto custom-scrollbar pb-1.5 gap-1.5 mt-2">
         {TABS.map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === tab.id 
                    ? 'bg-[#fcd535] text-[#181a20]' 
                    : 'bg-[#1e2329] border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] hover:border-[#474d57]'
                }`}>{tab.label}</button>
         ))}
      </div>

      <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] overflow-hidden">
        {filtered.length === 0 ? (
            <div className="p-12 text-center text-[#848e9c] flex flex-col items-center">
                <Settings2 size={40} className="opacity-20 mb-3" />
                <p className="font-semibold uppercase tracking-wider text-[#eaecef] text-[11px] mb-1">No Active Connections</p>
                <p className="text-[11px] opacity-60">You haven't linked any CEX APIs or Web3 Wallets yet.</p>
            </div>
        ) : (
            <div className="divide-y divide-[#2b3139]">
                {filtered.map((item) => (
                    <div key={item.id} className="p-3.5 hover:bg-[#0b0e11] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                        
                        {/* Identity */}
                        <div className="flex items-center gap-3 flex-1">
                            <div className="relative shrink-0 w-10 h-10 rounded-full bg-alphabag-black border border-alphabag-gray flex items-center justify-center overflow-hidden">
                                {typeof item.icon === 'string' ? (
                                    <img src={item.icon} alt={item.name} className="w-8 h-8 object-contain p-1" />
                                ) : (
                                    React.cloneElement(item.icon as React.ReactElement, { size: 18 })
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-alphabag-green rounded-full border-2 border-alphabag-dark"></div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-white text-base">{item.name}</h3>
                                    <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase ${item.category === 'CEX' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                       {item.category}
                                    </span>
                                </div>
                                <p className="text-[11px] font-mono text-alphabag-subtext mt-0.5 opacity-60">
                                   {item.subtext}
                                </p>
                            </div>
                        </div>
 
                        {/* Status Widget */}
                        <div className="flex items-center gap-4 w-full md:w-auto justify-end pt-3 md:pt-0">
                            <div className="flex items-center gap-1.5 bg-alphabag-green/10 border border-alphabag-green/20 px-2 py-1 rounded-md">
                                <Activity size={12} className="text-alphabag-green animate-pulse" />
                                <span className="text-[10px] font-black text-alphabag-green uppercase tracking-widest">Live</span>
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
