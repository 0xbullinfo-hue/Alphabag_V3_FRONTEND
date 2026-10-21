import { Activity,ExternalLink,Search,Settings2,Trash2,Wallet } from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useWallet } from '../../context/WalletContext';
import { PageIcon } from '../../components/ui/PageIcon';

type Tab = 'ALL' | 'CEX' | 'WALLET';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ALL', label: 'All Connections' },
  { id: 'CEX', label: 'API Keys (Exchanges)' },
  { id: 'WALLET', label: 'Wallets (On-Chain)' }
];

interface AggregatedConnection {
    id: string;
    rawId: string;
    name: string;
    subtext: string;
    icon: React.ReactNode | string;
    category: 'CEX' | 'WALLET';
    status: 'ACTIVE';
}

export const Integrations: React.FC = () => {
  const { trackedWallets, removeTrackedWallet, addToast } = useWallet();
  const navigate = useNavigate();
  const [cexConnections, setCexConnections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Read CEX connections directly from local storage as established in CexBag.tsx
    const saved = localStorage.getItem('alphabag_cex_connections');
    if (saved) {
        try {
            setCexConnections(JSON.parse(saved));
        } catch (e) {
            console.error('[Integrations] Error parsing CEX connections:', e);
            setCexConnections([]);
        }
    }
  }, []);

  // Normalize data into a single unified list
  const aggregatedData: AggregatedConnection[] = [
      ...cexConnections.map(cex => ({
          id: `cex-${cex.id}`,
          rawId: cex.id,
          name: cex.name,
          subtext: `API Key: ${cex.apiKey}`,
          icon: cex.icon,
          category: 'CEX' as const,
          status: 'ACTIVE' as const
      })),
      ...trackedWallets.filter(w => w.type === 'PORTFOLIO').map(wallet => ({
          id: `wallet-${wallet.id}`,
          rawId: wallet.id,
          name: wallet.label || 'Web3 Connection',
          subtext: `Chain: ${wallet.chain} | ${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`,
          icon: <Wallet size={24} className="text-white" />,
          category: 'WALLET' as const,
          status: 'ACTIVE' as const
      }))
  ];

  
  const handleDeleteConnection = (item: AggregatedConnection) => {
    if (item.category === 'WALLET') {
      removeTrackedWallet(item.rawId);
      addToast(`Disconnected wallet ${item.name}`, 'SUCCESS');
    } else if (item.category === 'CEX') {
      const updated = cexConnections.filter(c => c.id !== item.rawId);
      setCexConnections(updated);
      localStorage.setItem('alphabag_cex_connections', JSON.stringify(updated));
      addToast(`Disconnected ${item.name}`, 'SUCCESS');
    }
  };

  const filtered = aggregatedData.filter(item => {
    const matchesTab = activeTab === 'ALL' || item.category === activeTab;
    const searchTarget = `${item.name} ${item.subtext}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-2 animate-in fade-in duration-700 relative min-h-[calc(100vh-12rem)] w-full pb-10">
            <div className="page-header-card flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <PageIcon name="integrations" size={40} />
                        <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">Connections Hub</h1>
                        {aggregatedData.length > 0 ? (
                            <span className="bg-alphabag-green/10 text-alphabag-green border border-alphabag-green/20 text-[11px] font-semibold uppercase px-2 py-0.5 rounded tracking-wider">
                                Live ({aggregatedData.length})
                            </span>
                        ) : (
                            <span className="bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 text-[11px] font-semibold uppercase px-2 py-0.5 rounded tracking-wider">
                                Standby (0 Active)
                            </span>
                        )}
                    </div>
                    <p className="text-alphabag-subtext text-sm">Unified dashboard for all live API keys and Web3 wallets streaming into AlphaBAG.</p>
                </div>
                <div className="relative z-10 w-full lg:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={13} className="text-alphabag-subtext" />
                    </div>
                    <input type="text" placeholder="Search connections..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-alphabag-black border border-alphabag-gray rounded-md pl-9 pr-4 py-2 text-xs text-alphabag-text focus:outline-none focus:border-alphabag-yellow w-full lg:w-64 transition-colors" />
                </div>
            </div>

      {/* Connection Prompts - Since Hub is Read-Only, direct users to the Bags to connect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg p-3 flex items-center justify-between hover:bg-alphabag-gray/30 transition-colors">
              <div>
                  <h3 className="text-xs font-semibold text-white mb-0.5">Need to add an Exchange?</h3>
                  <p className="text-[11px] text-alphabag-subtext">Manage active API Keys in the CEX Portfolio.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/cex-bag')} className="text-xs h-8 font-semibold uppercase tracking-wider px-3">
                 Add CEX <ExternalLink size={10} className="ml-1" />
              </Button>
          </div>
          <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg p-3 flex items-center justify-between hover:bg-alphabag-gray/30 transition-colors">
              <div>
                  <h3 className="text-xs font-semibold text-white mb-0.5">Need to add a Web3 Wallet?</h3>
                  <p className="text-[11px] text-alphabag-subtext">Connect on-chain wallets in the DEX Portfolio.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/dex-bag')} className="text-xs h-8 font-semibold uppercase tracking-wider px-3">
                 Set BAG <ExternalLink size={10} className="ml-1" />
              </Button>
          </div>
      </div>

      <div className="flex overflow-x-auto custom-scrollbar pb-1.5 gap-1.5 mt-2">
         {TABS.map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    activeTab === tab.id 
                    ? 'bg-alphabag-yellow text-alphabag-dark' 
                    : 'bg-alphabag-darkgray border border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text hover:border-alphabag-muted'
                }`}>{tab.label}</button>
         ))}
      </div>

      <div className="rounded-lg border border-alphabag-gray bg-alphabag-darkgray overflow-hidden">
        {filtered.length === 0 ? (
            <div className="p-12 text-center text-alphabag-subtext flex flex-col items-center">
                <Settings2 size={40} className="opacity-20 mb-3" />
                <p className="font-semibold uppercase tracking-wider text-alphabag-text text-[11px] mb-1">No Active Connections</p>
                <p className="text-[11px] opacity-60">You haven't linked any CEX APIs or Web3 Wallets yet.</p>
            </div>
        ) : (
            <div className="divide-y divide-alphabag-gray">
                {filtered.map((item) => (
                    <div key={item.id} className="p-3.5 hover:bg-alphabag-black transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2 group">
                        
                        {/* Identity */}
                        <div className="flex items-center gap-2 flex-1">
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
                                    <h3 className="font-semibold text-white text-base">{item.name}</h3>
                                    <span className={`text-[11px] font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase ${item.category === 'CEX' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                       {item.category}
                                    </span>
                                </div>
                                <p className="text-[11px] font-mono text-alphabag-subtext mt-0.5 opacity-60">
                                   {item.subtext}
                                </p>
                            </div>
                        </div>
 
                        {/* Status Widget & Actions */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0">
                            <div className="flex items-center gap-1.5 bg-alphabag-green/10 border border-alphabag-green/20 px-2 py-1 rounded-md">
                                <Activity size={12} className="text-alphabag-green" />
                                <span className="text-[11px] font-semibold text-alphabag-green uppercase tracking-wider">Live</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDeleteConnection(item)}
                                aria-label={`Disconnect ${item.name}`}
                                title={`Disconnect ${item.name}`}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
                            >
                                <Trash2 size={12} />
                                <span>Delete</span>
                            </button>
                        </div>
                        
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
};
