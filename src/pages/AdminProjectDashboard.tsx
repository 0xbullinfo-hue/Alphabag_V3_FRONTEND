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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-white/10 gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-alphabag-yellow to-yellow-600 flex items-center justify-center text-black shadow-glow-yellow/20">
                            <Shield size={20} fill="currentColor" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative flex items-center">
                            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">Control</span>
                        </h1>
                        <span className="badge-yellow">Secure Session</span>
                    </div>
                    <p className="text-alphabag-subtext text-xs font-medium opacity-80 uppercase tracking-widest">Protocol validation and platform asset oversight.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Container */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass-panel p-6">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Shield size={16} className="text-alphabag-yellow" /> Pending Submissions
                        </h2>
                        
                        <div className="space-y-4">
                            {MOCK_SUBMISSIONS.map(sub => (
                                <div key={sub.id} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-alphabag-dark rounded-xl flex items-center justify-center font-black text-alphabag-yellow uppercase">
                                                {sub.symbol[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white uppercase tracking-tight">{sub.name} (${sub.symbol})</div>
                                                <div className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest mt-0.5">Founder: {sub.founder}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button className="p-3 bg-alphabag-green/20 text-alphabag-green rounded-xl hover:bg-alphabag-green hover:text-black transition-all shadow-glow-green">
                                                <CheckCircle2 size={18} />
                                            </button>
                                            <button className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-white/5 mt-6 pt-6 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <Button variant="outline" size="sm" className="border-white/10 text-[10px] uppercase font-bold tracking-widest gap-2">
                                                <Zap size={14} className="text-alphabag-yellow" /> Promote to Ad
                                            </Button>
                                            <Button variant="outline" size="sm" className="border-white/10 text-[10px] uppercase font-bold tracking-widest gap-2">
                                                <Shield size={14} className="text-alphabag-green" /> Verify Project
                                            </Button>
                                        </div>
                                        <button className="text-alphabag-muted hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            View Details <ExternalLink size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Ad Stats Sidebar */}
                <div className="space-y-6">
                    <div className="glass-panel p-6">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">Live Ad Slots</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-alphabag-yellow/5 border border-alphabag-yellow/20 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-alphabag-yellow font-black uppercase tracking-widest">TIMELINE_POS_01</span>
                                    <span className="text-[10px] text-green-500 font-bold tracking-widest">ACTIVE</span>
                                </div>
                                <div className="text-xs font-bold text-white">AlphaBAG Pro Campaign</div>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/5 rounded-xl border-dashed">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest">SIDEBAR_SLOT_01</span>
                                    <span className="text-[10px] text-alphabag-muted font-bold tracking-widest">VACANT</span>
                                </div>
                                <div className="text-xs font-bold text-alphabag-muted italic">Click to Assign</div>
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
