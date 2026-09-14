import { Activity, AlertTriangle, Download, Layers, RefreshCw, ShieldCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useWallet } from '../../context/WalletContext';
import { fetchDefiPositions } from '../../services/mockData';
import { DefiPosition } from '../../types';

type Tab = 'ALL' | 'Lending' | 'Liquidity' | 'Staking' | 'Farming';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ALL', label: 'All Positions' },
  { id: 'Lending', label: 'Lending & Debt' },
  { id: 'Liquidity', label: 'Liquidity Pools' },
  { id: 'Staking', label: 'Liquid Staking' },
  { id: 'Farming', label: 'Yield Farms' }
];

export const DeFi: React.FC = () => {
    const { address } = useWallet();
    const [positions, setPositions] = useState<DefiPosition[]>([]);
    const [source, setSource] = useState<'moralis' | 'defillama-opportunities' | 'none'>('none');
    const [activeTab, setActiveTab] = useState<Tab>('ALL');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchDefiPositions(address).then(({ positions, source }) => {
            setPositions(positions);
            setSource(source);
        });
    }, [address]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const { positions, source } = await fetchDefiPositions(address);
            setPositions(positions);
            setSource(source);
        } catch (err) {
            console.error('Failed to refresh DeFi positions:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const isOwnPositions = source === 'moralis';
    const safePositions = Array.isArray(positions) ? positions : [];
    const filtered = isOwnPositions ? safePositions.filter(p => activeTab === 'ALL' || p?.type === activeTab) : safePositions;

    // Calculations — only meaningful for the user's own real positions.
    // Opportunity-list rows have no user balance, so TVL stays at 0 when viewing opportunities.
    const totalValueLocked = isOwnPositions ? safePositions.reduce((acc, p) => p.balance > 0 ? acc + p.balance : acc, 0) : 0;
    const totalDebt = isOwnPositions ? safePositions.reduce((acc, p) => p.balance < 0 ? acc + Math.abs(p.balance) : acc, 0) : 0;

    let totalWeightedApy = 0;
    if (isOwnPositions) {
        safePositions.forEach(p => {
            if (p.balance > 0) totalWeightedApy += (p.balance * p.apy);
        });
    }
    const netApy = totalValueLocked > 0 ? (totalWeightedApy / totalValueLocked) : 0;
    const pendingYield = isOwnPositions
        ? safePositions.reduce((acc, p) => acc + ((p as any).pendingRewardsUsd ?? 0), 0)
        : 0;

    const handleExportCsv = () => {
        if (!filtered.length) return;
        const headers = ['Protocol', 'Asset', 'Chain', 'Type', 'APY (%)', isOwnPositions ? 'Balance (USD)' : 'Pool Type'];
        const rows = filtered.map(p => [
            `"${p.protocol || ''}"`,
            `"${p.name || ''}"`,
            `"${p.chain || ''}"`,
            `"${p.type || ''}"`,
            p.apy.toFixed(2),
            isOwnPositions ? (p.balance ?? 0).toFixed(2) : '"Opportunity"'
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `alphabag-defi-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="relative min-h-[calc(100vh-12rem)] flex flex-col pb-20 w-full space-y-2 animate-in fade-in duration-700">
            {/* Header */}
            <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-dark">
                            <Layers size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">DeFi Operations</h1>
                        {isOwnPositions ? (
                            <span className="bg-alphabag-green/10 text-alphabag-green text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider">Active</span>
                        ) : (
                            <span className="bg-alphabag-yellow/10 text-alphabag-yellow text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider">No Wallet Positions Found</span>
                        )}
                    </div>

                    {!isOwnPositions && (
                        <p className="text-[11px] text-alphabag-subtext mb-2 max-w-lg">
                            {address
                                ? "No verified DeFi positions were returned for this wallet. Opportunities are shown separately and are never counted as your holdings."
                                : "Connect a wallet to see your real lending, staking, and liquidity positions. Showing top yield opportunities across major protocols in the meantime."}
                        </p>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
                        <div>
                            <span className="text-[9px] uppercase font-semibold tracking-widest text-alphabag-subtext mb-1 block">Supplied</span>
                            <h2 className="text-2xl font-semibold text-alphabag-text tabular-nums">
                                {isOwnPositions ? `$${totalValueLocked.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '—'}
                            </h2>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase font-semibold tracking-widest text-alphabag-subtext mb-1 block">Borrowed</span>
                            <h2 className="text-2xl font-semibold text-alphabag-red tabular-nums">
                                {isOwnPositions ? `$${totalDebt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '—'}
                            </h2>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase font-semibold tracking-widest text-alphabag-subtext mb-1 block">Net APY</span>
                            <h2 className="text-2xl font-semibold text-alphabag-green tabular-nums">
                                {isOwnPositions ? `+${netApy.toFixed(2)}%` : '—'}
                            </h2>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase font-semibold tracking-widest text-alphabag-subtext mb-1 block">Pending</span>
                            <h2 className="text-2xl font-semibold text-alphabag-yellow tabular-nums">
                                {isOwnPositions ? `$${pendingYield.toFixed(2)}` : '—'}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 bg-alphabag-gray text-alphabag-text px-3 py-2 rounded-md text-xs font-semibold hover:bg-alphabag-muted transition-all disabled:opacity-50"
                        title="Refresh DeFi positions"
                    >
                        <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <div className="bg-alphabag-darkgray border border-alphabag-gray px-3 py-1.5 rounded-md flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-alphabag-green animate-pulse"></div>
                        <span className="text-[8px] font-semibold uppercase tracking-widest text-alphabag-subtext">Nodes Live</span>
                    </div>
                    <button className="flex items-center gap-1.5 bg-alphabag-gray text-alphabag-text px-4 py-2 rounded-md text-xs font-semibold hover:bg-alphabag-muted transition-all">
                        <Activity size={13} /> Protocol Audit
                    </button>
                </div>
            </div>

             {/* Tabs & Actions */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                 <div className="flex overflow-x-auto custom-scrollbar pb-1.5 gap-1.5">
                     {TABS.map(tab => (
                         <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === tab.id 
                                ? 'bg-alphabag-yellow text-alphabag-black shadow-md' 
                                : 'bg-transparent border border-alphabag-gray text-alphabag-subtext hover:text-white hover:border-alphabag-gray'
                            }`}
                         >
                             {tab.label}
                         </button>
                     ))}
                  </div>
                  <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExportCsv}
                      disabled={filtered.length === 0}
                      className="border-alphabag-gray whitespace-nowrap text-[10px] font-black uppercase tracking-widest h-8 px-3"
                  >
                      <Download size={12} className="mr-1.5" /> Export CSV
                  </Button>
             </div>

             {/* Table */}
             <div className="rounded-lg border border-alphabag-gray bg-alphabag-darkgray overflow-hidden w-full">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead className="bg-alphabag-black text-alphabag-subtext text-[10px] uppercase font-semibold tracking-wider border-b border-alphabag-gray">
                              <tr>
                                  <th className="p-3 px-6">Protocol / Asset</th>
                                  <th className="p-3 px-6 text-center">Type</th>
                                  <th className="p-3 px-6 text-right">Net APY</th>
                                  <th className="p-3 px-6 text-right">Balance</th>
                                  <th className="p-3 px-6 text-center">Health</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-alphabag-gray text-[13px]">
                              {filtered.length === 0 ? (
                                  <tr>
                                      <td colSpan={6} className="p-12 text-center text-alphabag-subtext bg-alphabag-black/10">No positions found.</td>
                                  </tr>
                              ) : (
                                  filtered.map(pos => (
                                      <tr key={pos.id} className="hover:bg-alphabag-black/20 transition-colors group">
                                          <td className="p-3 px-6">
                                              <div className="flex items-center gap-2">
                                                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm border border-alphabag-gray shrink-0">
                                                     <img src={pos.icon} alt={pos.protocol} className="w-full h-full object-contain rounded-full" />
                                                  </div>
                                                  <div>
                                                      <div className="text-white font-bold text-sm flex items-center gap-1.5">
                                                          {pos.name}
                                                          <span className="text-[8px] bg-alphabag-black border border-alphabag-gray px-1 py-0.5 rounded uppercase tracking-wider text-alphabag-muted">{pos.chain}</span>
                                                      </div>
                                                      <div className="text-alphabag-muted text-[11px] mt-0.5 opacity-60">{pos.protocol}</div>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-3 px-6 text-center">
                                              <span className="text-[9px] font-black uppercase tracking-widest text-alphabag-subtext bg-alphabag-gray/30 px-2 py-0.5 rounded">
                                                  {pos.type}
                                              </span>
                                          </td>
                                          <td className="p-3 px-6 text-right">
                                              <span className={`font-bold ${pos.apy >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                  {pos.apy >= 0 ? '+' : ''}{pos.apy.toFixed(2)}%
                                              </span>
                                          </td>
                                          <td className="p-3 px-6 text-right tabular-data">
                                              <div className={`font-bold text-sm ${pos.balance >= 0 ? 'text-white' : 'text-alphabag-red'}`}>
                                                  {isOwnPositions
                                                      ? `${pos.balance < 0 ? '-' : ''}$${Math.abs(pos.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}`
                                                      : '—'}
                                              </div>
                                          </td>
                                          <td className="p-3 px-6 text-center">
                                              {isOwnPositions && pos.type === 'Lending' && pos.balance < 0 ? (
                                                  <div className="flex items-center justify-center gap-1.5 bg-alphabag-black/30 w-fit mx-auto px-2.5 py-1 rounded-full border border-alphabag-gray/30">
                                                      {pos.healthFactor && pos.healthFactor < 1.5 ? (
                                                          <AlertTriangle size={12} className="text-alphabag-red" />
                                                      ) : (
                                                          <ShieldCheck size={12} className="text-alphabag-green" />
                                                      )}
                                                      <span className={`font-black text-[10px] tabular-data ${pos.healthFactor && pos.healthFactor < 1.5 ? 'text-alphabag-red' : 'text-alphabag-green'}`}>
                                                          {pos.healthFactor ? pos.healthFactor.toFixed(2) : 'N/A'}
                                                      </span>
                                                  </div>
                                              ) : (
                                                  <span className="text-alphabag-subtext text-[10px] opacity-30 font-bold tracking-widest uppercase">
                                                      {isOwnPositions ? 'Idle' : '—'}
                                                  </span>
                                              )}
                                          </td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
             </div>
        </div>
    );
};
