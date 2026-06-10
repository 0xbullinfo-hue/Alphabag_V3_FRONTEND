import React, { useState } from 'react';
import { Shield, Zap, ArrowRight, Rocket, Target, User as UserIcon, Globe, Code, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: (role: 'FOUNDER' | 'TRADER', data: any) => void;
    onExit?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete, onExit }) => {
    const [step, setStep] = useState<'ROLE' | 'FORM'>('ROLE');
    const [selectedRole, setSelectedRole] = useState<'FOUNDER' | 'TRADER' | null>(null);
    
    // Form States
    const [founderData, setFounderData] = useState({
        projectName: '',
        symbol: '',
        contractAddress: '',
        hook: '',
        website: ''
    });

    const [traderData, setTraderData] = useState({
        username: '',
        bio: '',
        sector: 'DeFi'
    });

    if (!isOpen) return null;

    const handleRoleSelect = (role: 'FOUNDER' | 'TRADER') => {
        setSelectedRole(role);
        setStep('FORM');
    };

    const handleFounderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete('FOUNDER', founderData);
    };

    const handleTraderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete('TRADER', traderData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-alphabag-black/95 backdrop-blur-2xl animate-fade-in overflow-y-auto">
            <div className="w-full max-w-xl bg-alphabag-dark/95 border border-white/10 rounded-xl shadow-[0_0_70px_rgba(0,0,0,0.65)] overflow-hidden">
                <div className="p-5 md:p-8">
                    {step === 'ROLE' ? (
                        <div className="text-center relative">
                            {onExit && (
                                <button 
                                    onClick={onExit}
                                    className="absolute -top-2 -right-2 p-2 text-alphabag-muted hover:text-white transition-colors"
                                    title="Exit Onboarding"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                        <X size={16} />
                                    </div>
                                </button>
                            )}
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-1.5 leading-none">
                                Choose Your <span className="text-alphabag-yellow">Path</span>
                            </h2>
                            <p className="text-alphabag-subtext text-[11px] mb-6 max-w-xs mx-auto opacity-60 font-medium">
                                Define your role to access the Alpha Radar ecosystem.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleRoleSelect('FOUNDER')}
                                    className="group relative p-5 bg-white/5 border border-white/10 rounded-xl text-left transition-all hover:bg-alphabag-yellow/5 hover:border-alphabag-yellow/40 shadow-[0_0_30px_rgba(252,213,53,0.1)]"
                                >
                                    <div className="w-10 h-10 bg-alphabag-yellow/10 border border-alphabag-yellow/20 rounded-lg flex items-center justify-center text-alphabag-yellow mb-3">
                                        <Shield size={20} />
                                    </div>
                                    <h3 className="text-base font-black text-white uppercase tracking-tight mb-0.5">Founder</h3>
                                    <p className="text-[9px] text-alphabag-muted leading-relaxed font-black uppercase opacity-60">
                                        List token & build manifesto.
                                    </p>
                                    <div className="mt-3 flex items-center text-alphabag-yellow text-[8px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                                        Build <ArrowRight size={10} className="ml-2" />
                                    </div>
                                </button>

                                <button 
                                    onClick={() => handleRoleSelect('TRADER')}
                                    className="group relative p-5 bg-white/5 border border-white/10 rounded-xl text-left transition-all hover:bg-blue-500/5 hover:border-blue-500/40 shadow-[0_0_30px_rgba(96,165,250,0.12)]"
                                >
                                    <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-3">
                                        <Target size={20} />
                                    </div>
                                    <h3 className="text-base font-black text-white uppercase tracking-tight mb-0.5">Trader</h3>
                                    <p className="text-[9px] text-alphabag-muted leading-relaxed font-black uppercase opacity-60">
                                        Hunt tokens & share alpha.
                                    </p>
                                    <div className="mt-3 flex items-center text-blue-400 text-[8px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                                        Join <ArrowRight size={10} className="ml-2" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-slide-up">
                            <button 
                                onClick={() => setStep('ROLE')}
                                className="text-alphabag-muted hover:text-white mb-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-colors"
                            >
                                <ArrowRight className="rotate-180" size={12} /> Back
                            </button>

                            <h2 className="text-lg font-black text-white uppercase tracking-tighter mb-4 leading-none">
                                {selectedRole === 'FOUNDER' ? 'Project Manifesto' : 'Trader Profile'}
                            </h2>

                            {selectedRole === 'FOUNDER' ? (
                                <form onSubmit={handleFounderSubmit} className="space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest ml-1 opacity-60">Project Name</label>
                                            <div className="relative">
                                                <Rocket className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted opacity-40" size={14} />
                                                <input 
                                                    required
                                                    className="w-full bg-alphabag-black/70 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-white font-black text-xs focus:outline-none focus:border-alphabag-yellow/50 transition-colors placeholder:text-alphabag-muted/40"
                                                    placeholder="e.g. My Project Name"
                                                    value={founderData.projectName}
                                                    onChange={e => setFounderData({...founderData, projectName: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                         <div className="space-y-1">
                                            <label className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest ml-1 opacity-60">Symbol</label>
                                            <div className="relative">
                                                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted opacity-40" size={14} />
                                                <input 
                                                    required
                                                    className="w-full bg-alphabag-black/70 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-white font-black text-xs focus:outline-none focus:border-alphabag-yellow/50 transition-colors uppercase placeholder:text-alphabag-muted/40"
                                                    placeholder="TBA"
                                                    value={founderData.symbol}
                                                    onChange={e => setFounderData({...founderData, symbol: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                     <div className="space-y-1">
                                        <label className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest ml-1 opacity-60">Contract Address</label>
                                        <div className="relative">
                                            <Code className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted opacity-40" size={14} />
                                            <input 
                                                required
                                                className="w-full bg-alphabag-black/70 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-white font-black text-xs focus:outline-none focus:border-alphabag-yellow/50 transition-colors font-mono placeholder:text-alphabag-muted/40"
                                                placeholder="0x..."
                                                value={founderData.contractAddress}
                                                onChange={e => setFounderData({...founderData, contractAddress: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                     <div className="space-y-1">
                                        <label className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest ml-1 opacity-60">The Hook (Pitch)</label>
                                        <textarea 
                                            required
                                            rows={2}
                                            className="w-full bg-alphabag-black/70 border border-white/10 rounded-lg p-2.5 text-white font-black text-xs focus:outline-none focus:border-alphabag-yellow/50 transition-colors resize-none placeholder:text-alphabag-muted/40"
                                            placeholder="What makes your project the next big thing?"
                                            value={founderData.hook}
                                            onChange={e => setFounderData({...founderData, hook: e.target.value})}
                                        />
                                    </div>

                                     <div className="space-y-1">
                                        <label className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest ml-1 opacity-60">Website URL</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted opacity-40" size={14} />
                                            <input 
                                                required
                                                type="url"
                                                className="w-full bg-alphabag-black/70 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-white font-black text-xs focus:outline-none focus:border-alphabag-yellow/50 transition-colors placeholder:text-alphabag-muted/40"
                                                placeholder="https://..."
                                                value={founderData.website}
                                                onChange={e => setFounderData({...founderData, website: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <Button className="w-full h-11 bg-alphabag-yellow text-black font-black uppercase tracking-[0.2em] rounded-lg shadow-glow-yellow text-[10px] mt-2">
                                        Save & Access
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleTraderSubmit} className="space-y-4">
                                     <div className="space-y-1">
                                        <label className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest ml-1 opacity-60">Username</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted opacity-40" size={14} />
                                            <input 
                                                required
                                                className="w-full bg-alphabag-black/70 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-white font-black text-xs focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-alphabag-muted/40"
                                                placeholder="e.g. Degen_99"
                                                value={traderData.username}
                                                onChange={e => setTraderData({...traderData, username: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                     <div className="space-y-1">
                                        <label className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest ml-1 opacity-60">Bio (160 Chars)</label>
                                        <textarea 
                                            required
                                            maxLength={160}
                                            rows={2}
                                            className="w-full bg-alphabag-black/70 border border-white/10 rounded-lg p-2.5 text-white font-black text-xs focus:outline-none focus:border-blue-500/50 transition-colors resize-none placeholder:text-alphabag-muted/40"
                                            placeholder="Tell the community about your trading style..."
                                            value={traderData.bio}
                                            onChange={e => setTraderData({...traderData, bio: e.target.value})}
                                        />
                                        <div className="text-right text-[7px] text-alphabag-muted font-black uppercase mt-0.5">
                                            {traderData.bio.length} / 160
                                        </div>
                                    </div>

                                     <div className="space-y-1">
                                        <label className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest ml-1 opacity-60">Sector</label>
                                        <select 
                                            className="w-full bg-alphabag-black/70 border border-white/10 rounded-lg py-2.5 px-2.5 text-white font-black text-xs focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                                            value={traderData.sector}
                                            onChange={e => setTraderData({...traderData, sector: e.target.value})}
                                        >
                                            <option value="DeFi">DeFi & Yield</option>
                                            <option value="Memecoins">Memecoins & Culture</option>
                                            <option value="AI">AI & Agents</option>
                                            <option value="Gaming">GameFi & Metaverse</option>
                                            <option value="Infrastructure">Infrastructure</option>
                                        </select>
                                    </div>

                                    <Button className="w-full h-11 bg-blue-500 text-white font-black uppercase tracking-[0.2em] rounded-lg shadow-[0_0_30px_rgba(96,165,250,0.18)] text-[10px] mt-2">
                                        Join Hub
                                    </Button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
