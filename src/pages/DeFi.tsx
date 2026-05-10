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
        <div className="relative min-h-[calc(100vh-12rem)] flex flex-col pb-20 max-w-7xl w-full mx-auto space-y-6 animate-fade-in text-alphabag-text">
            {/* 1. Header Area Area Area Area Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-white/10 gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-alphabag-yellow to-yellow-600 flex items-center justify-center text-black shadow-glow-yellow/20">
                            <Layers size={20} fill="currentColor" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative flex items-center">
                            DeFi <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">Operations</span>
                        </h1>
                        <span className="badge-yellow">Active Tracking</span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                        <div>
                            <span className="section-label mb-1.5 block opacity-70">Total Supplied</span>
                            <h2 className="text-3xl font-black text-white tabular-nums">${totalValueLocked.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</h2>
                        </div>
                        <div>
                            <span className="section-label mb-1.5 block opacity-70">Total Borrowed</span>
                            <h2 className="text-3xl font-black text-red-400 tabular-nums">${totalDebt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</h2>
                        </div>
                        <div>
                            <span className="section-label mb-1.5 block opacity-70">Net APY</span>
                            <h2 className="text-3xl font-black text-green-400 tabular-nums">+{netApy.toFixed(2)}%</h2>
                        </div>
                        <div>
                            <span className="section-label mb-1.5 block opacity-70">Pending Yield</span>
                            <h2 className="text-3xl font-black text-alphabag-yellow tabular-nums">${pendingYield.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="glass-panel px-4 py-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-glow-green"></div>
                        <span className="section-label text-[9px]">Live Nodes</span>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-2xl border-white/10 hover:border-alphabag-yellow/50 transition-all font-black uppercase tracking-widest text-[10px] h-10 px-6"
                    >
                        <Activity size={14} className="mr-2" /> Protocol Audit
                    </Button>
                </div>
            </div>

             {/* Tabs & Actions */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div className="flex overflow-x-auto custom-scrollbar pb-2 gap-2">
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
                  <Button variant="secondary" size="sm" className="border-alphabag-gray whitespace-nowrap">
                      <Download size={14} className="mr-2" /> Export CSV
                  </Button>
             </div>

             {/* Table */}
             <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl overflow-hidden shadow-lg w-full">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead className="bg-alphabag-black/40 text-alphabag-muted text-[10px] uppercase font-black tracking-wider border-b border-alphabag-gray/50">
                              <tr>
                                  <th className="p-5 px-6">Protocol / Asset</th>
                                  <th className="p-5 px-6 text-center">Type</th>
                                  <th className="p-5 px-6 text-right">Net APY</th>
                                  <th className="p-5 px-6 text-right">Balance</th>
                                  <th className="p-5 px-6 text-center">Health</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-alphabag-gray/30 text-sm">
                              {filtered.length === 0 ? (
                                  <tr>
                                      <td colSpan={6} className="p-16 text-center text-alphabag-subtext bg-alphabag-black/10">No positions found for this category.</td>
                                  </tr>
                              ) : (
                                  filtered.map(pos => (
                                      <tr key={pos.id} className="hover:bg-alphabag-black/20 transition-colors group">
                                          <td className="p-5 px-6">
                                              <div className="flex items-center gap-4">
                                                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm border border-alphabag-gray shrink-0">
                                                     <img src={pos.icon} alt={pos.protocol} className="w-full h-full object-contain rounded-full" />
                                                  </div>
                                                  <div>
                                                      <div className="text-white font-bold text-base flex items-center gap-2">
                                                          {pos.name}
                                                          <span className="text-[9px] bg-alphabag-black border border-alphabag-gray px-1.5 py-0.5 rounded uppercase tracking-wider text-alphabag-muted">{pos.chain}</span>
                                                      </div>
                                                      <div className="text-alphabag-muted text-xs mt-0.5">{pos.protocol}</div>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-5 px-6 text-center">
                                              <span className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext bg-alphabag-gray/30 px-2.5 py-1 rounded">
                                                  {pos.type}
                                              </span>
                                          </td>
                                          <td className="p-5 px-6 text-right">
                                              <span className={`font-bold ${pos.apy >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                                  {pos.apy >= 0 ? '+' : ''}{pos.apy.toFixed(2)}%
                                              </span>
                                          </td>
                                          <td className="p-5 px-6 text-right tabular-data">
                                              <div className={`font-bold text-base ${pos.balance >= 0 ? 'text-white' : 'text-alphabag-red'}`}>
                                                  {pos.balance < 0 ? '-' : ''}${Math.abs(pos.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                              </div>
                                          </td>
                                          <td className="p-5 px-6 text-center">
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
