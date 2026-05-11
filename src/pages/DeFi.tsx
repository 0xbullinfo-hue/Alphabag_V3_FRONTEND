import React, { useEffect, useState } from 'react';
import { fetchDefiPositions } from '../services/mockData';
import { DefiPosition } from '../types';
import { Button } from '../components/ui/Button';
import { Layers, Activity, Search, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Download } from 'lucide-react';

type Tab = 'ALL' | 'Lending' | 'Liquidity' | 'Staking' | 'Farming';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ALL', label: 'All Positions' },
  { id: 'Lending', label: 'Lending & Debt' },
  { id: 'Liquidity', label: 'Liquidity Pools' },
  { id: 'Staking', label: 'Liquid Staking' },
  { id: 'Farming', label: 'Yield Farms' }
];

export const DeFi: React.FC = () => {
    const [positions, setPositions] = useState<DefiPosition[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('ALL');

    useEffect(() => {
        fetchDefiPositions().then(setPositions);
    }, []);

    const filtered = positions.filter(p => activeTab === 'ALL' || p.type === activeTab);

    // Calculations
    const totalValueLocked = positions.reduce((acc, p) => p.balance > 0 ? acc + p.balance : acc, 0);
    const totalDebt = positions.reduce((acc, p) => p.balance < 0 ? acc + Math.abs(p.balance) : acc, 0);

    // Weighted APY Calculation
    let totalWeightedApy = 0;
    positions.forEach(p => {
        if (p.balance > 0) totalWeightedApy += (p.balance * p.apy);
    });
    const netApy = totalValueLocked > 0 ? (totalWeightedApy / totalValueLocked) : 0;

    // Mock Pending Yield
    const pendingYield = totalValueLocked * 0.0015; 

    return (
        <div className="relative min-h-[calc(100vh-12rem)] flex flex-col pb-20 max-w-7xl w-full mx-auto space-y-5 animate-in fade-in duration-700 px-4 md:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-[#2b3139] gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                            <Layers size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-[#eaecef] tracking-tight">DeFi Operations</h1>
                        <span className="bg-[#0ecb81]/10 text-[#0ecb81] text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider">Active</span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mt-3">
                        <div>
                            <span className="text-[9px] uppercase font-semibold tracking-widest text-[#848e9c] mb-1 block">Supplied</span>
                            <h2 className="text-2xl font-semibold text-[#eaecef] tabular-nums">${totalValueLocked.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</h2>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase font-semibold tracking-widest text-[#848e9c] mb-1 block">Borrowed</span>
                            <h2 className="text-2xl font-semibold text-[#f6465d] tabular-nums">${totalDebt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</h2>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase font-semibold tracking-widest text-[#848e9c] mb-1 block">Net APY</span>
                            <h2 className="text-2xl font-semibold text-[#0ecb81] tabular-nums">+{netApy.toFixed(2)}%</h2>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase font-semibold tracking-widest text-[#848e9c] mb-1 block">Pending</span>
                            <h2 className="text-2xl font-semibold text-[#fcd535] tabular-nums">${pendingYield.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-[#1e2329] border border-[#2b3139] px-3 py-1.5 rounded-md flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse"></div>
                        <span className="text-[8px] font-semibold uppercase tracking-widest text-[#848e9c]">Nodes Live</span>
                    </div>
                    <button className="flex items-center gap-1.5 bg-[#2b3139] text-[#eaecef] px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#474d57] transition-all">
                        <Activity size={13} /> Protocol Audit
                    </button>
                </div>
            </div>

             {/* Tabs & Actions */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
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
                  <Button variant="secondary" size="sm" className="border-alphabag-gray whitespace-nowrap text-[10px] font-black uppercase tracking-widest h-8 px-3">
                      <Download size={12} className="mr-1.5" /> Export CSV
                  </Button>
             </div>

             {/* Table */}
             <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] overflow-hidden w-full">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead className="bg-[#0b0e11] text-[#848e9c] text-[10px] uppercase font-semibold tracking-wider border-b border-[#2b3139]">
                              <tr>
                                  <th className="p-3 px-6">Protocol / Asset</th>
                                  <th className="p-3 px-6 text-center">Type</th>
                                  <th className="p-3 px-6 text-right">Net APY</th>
                                  <th className="p-3 px-6 text-right">Balance</th>
                                  <th className="p-3 px-6 text-center">Health</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2b3139] text-[13px]">
                              {filtered.length === 0 ? (
                                  <tr>
                                      <td colSpan={6} className="p-12 text-center text-alphabag-subtext bg-alphabag-black/10">No positions found.</td>
                                  </tr>
                              ) : (
                                  filtered.map(pos => (
                                      <tr key={pos.id} className="hover:bg-alphabag-black/20 transition-colors group">
                                          <td className="p-3 px-6">
                                              <div className="flex items-center gap-3">
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
                                                  {pos.balance < 0 ? '-' : ''}${Math.abs(pos.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                              </div>
                                          </td>
                                          <td className="p-3 px-6 text-center">
                                              {pos.type === 'Lending' && pos.balance < 0 ? (
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
                                                  <span className="text-alphabag-subtext text-[10px] opacity-30 font-bold tracking-widest uppercase">Idle</span>
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
