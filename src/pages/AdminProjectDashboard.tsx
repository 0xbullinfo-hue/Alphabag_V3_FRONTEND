import React, { useState } from 'react';
import { Shield, CheckCircle2, XCircle, Zap, ExternalLink, Filter, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface ProjectSubmission {
    id: string;
    name: string;
    symbol: string;
    founder: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

const MOCK_SUBMISSIONS: ProjectSubmission[] = [
    { id: '1', name: 'AlphaBAG Pro', symbol: 'BAG', founder: 'Founder_Alpha', status: 'PENDING', createdAt: '2026-03-15' },
    { id: '2', name: 'BSC Whale Bot', symbol: 'WHALE', founder: 'Degen_One', status: 'PENDING', createdAt: '2026-03-14' },
];

import { AdminSidebar } from '../components/AdminSidebar';

export const AdminProjectDashboard: React.FC = () => {
    return (
        <div className="flex h-screen bg-alphabag-black">
            <AdminSidebar />
            
            <div className="flex-1 md:pl-64 overflow-y-auto custom-scrollbar">
                <main className="p-4 md:p-8 lg:p-10 pb-20 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b border-white/10 gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-alphabag-yellow to-yellow-600 flex items-center justify-center text-black shadow-glow-yellow/20">
                            <Shield size={16} fill="currentColor" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase relative flex items-center">
                            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">Control</span>
                        </h1>
                        <span className="badge-yellow text-[8px] h-4">Secure</span>
                    </div>
                    <p className="text-alphabag-subtext text-[10px] font-medium opacity-80 uppercase tracking-widest">Protocol validation and platform asset oversight.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Container */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass-panel p-4">
                        <h2 className="text-[11px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Shield size={14} className="text-alphabag-yellow" /> Pending Submissions
                        </h2>
                        
                        <div className="space-y-3">
                            {MOCK_SUBMISSIONS.map(sub => (
                                <div key={sub.id} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/[0.08] transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-alphabag-dark rounded-lg flex items-center justify-center font-black text-alphabag-yellow uppercase text-xs">
                                                {sub.symbol[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white uppercase tracking-tight text-[13px]">{sub.name} (${sub.symbol})</div>
                                                <div className="text-[9px] text-alphabag-muted font-black uppercase tracking-widest mt-0.5">Founder: {sub.founder}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button className="p-2 bg-alphabag-green/20 text-alphabag-green rounded-lg hover:bg-alphabag-green hover:text-black transition-all shadow-glow-green">
                                                <CheckCircle2 size={16} />
                                            </button>
                                            <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-white/5 mt-4 pt-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Button variant="outline" size="sm" className="border-white/10 text-[9px] h-7 uppercase font-bold tracking-widest gap-2">
                                                <Zap size={12} className="text-alphabag-yellow" /> Promote to Ad
                                            </Button>
                                            <Button variant="outline" size="sm" className="border-white/10 text-[9px] h-7 uppercase font-bold tracking-widest gap-2">
                                                <Shield size={12} className="text-alphabag-green" /> Verify Project
                                            </Button>
                                        </div>
                                        <button className="text-alphabag-muted hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                            Details <ExternalLink size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Ad Stats Sidebar */}
                <div className="space-y-4">
                    <div className="glass-panel p-4">
                        <h2 className="text-[11px] font-black text-white uppercase tracking-widest mb-4">Live Ad Slots</h2>
                        <div className="space-y-3">
                            <div className="p-3 bg-alphabag-yellow/5 border border-alphabag-yellow/20 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-alphabag-yellow font-black uppercase tracking-widest">TIMELINE_POS_01</span>
                                    <span className="text-[9px] text-green-500 font-bold tracking-widest">ACTIVE</span>
                                </div>
                                <div className="text-[11px] font-bold text-white">AlphaBAG Pro Campaign</div>
                            </div>
                            <div className="p-3 bg-white/5 border border-white/5 rounded-xl border-dashed">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-alphabag-muted font-black uppercase tracking-widest">SIDEBAR_SLOT_01</span>
                                    <span className="text-[9px] text-alphabag-muted font-bold tracking-widest">VACANT</span>
                                </div>
                                <div className="text-[11px] font-bold text-alphabag-muted italic">Click to Assign</div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </main>
        </div>
    </div>
    );
};
