import { ArrowRight, Code, Globe, Rocket, Shield, Target, User as UserIcon, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-alphabag-black/90 animate-fade-in overflow-y-auto">
            <div className="w-full max-w-xl bg-alphabag-card border border-alphabag-border rounded-lg overflow-hidden">
                <div className="p-5 md:p-6">
                    {step === 'ROLE' ? (
                        <div className="text-center relative">
                            {onExit && (
                                <button 
                                    onClick={onExit}
                                    className="absolute -top-2 -right-2 p-2 text-alphabag-muted hover:text-white transition-colors"
                                    title="Exit Onboarding"
                                >
                                    <div className="w-8 h-8 rounded-full bg-alphabag-panel border border-alphabag-border flex items-center justify-center">
                                        <X size={16} />
                                    </div>
                                </button>
                            )}
                            <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-1.5 leading-none">
                                Choose Your <span className="text-alphabag-yellow">Path</span>
                            </h2>
                            <p className="text-alphabag-subtext text-[11px] mb-4 max-w-xs mx-auto font-medium">
                                Define your role to access the Alpha Radar ecosystem.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleRoleSelect('FOUNDER')}
                                    className="group relative p-5 bg-alphabag-panel border border-alphabag-border rounded-lg text-left transition-all hover:bg-alphabag-hover hover:border-alphabag-yellow/40"
                                >
                                    <div className="w-10 h-10 bg-alphabag-yellow/10 border border-alphabag-yellow/20 rounded-md flex items-center justify-center text-alphabag-yellow mb-3">
                                        <Shield size={20} />
                                    </div>
                                    <h3 className="text-base font-bold text-white uppercase tracking-tight mb-0.5">Founder</h3>
                                    <p className="text-[11px] text-alphabag-muted leading-relaxed font-semibold uppercase">
                                        List token & build manifesto.
                                    </p>
                                    <div className="mt-3 flex items-center text-alphabag-yellow text-[11px] font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                        Build <ArrowRight size={12} className="ml-2" />
                                    </div>
                                </button>

                                <button 
                                    onClick={() => handleRoleSelect('TRADER')}
                                    className="group relative p-5 bg-alphabag-panel border border-alphabag-border rounded-lg text-left transition-all hover:bg-alphabag-hover hover:border-blue-500/40"
                                >
                                    <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-center justify-center text-blue-400 mb-3">
                                        <Target size={20} />
                                    </div>
                                    <h3 className="text-base font-bold text-white uppercase tracking-tight mb-0.5">Trader</h3>
                                    <p className="text-[11px] text-alphabag-muted leading-relaxed font-semibold uppercase">
                                        Hunt tokens & share alpha.
                                    </p>
                                    <div className="mt-3 flex items-center text-blue-400 text-[11px] font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                        Join <ArrowRight size={12} className="ml-2" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-slide-up">
                            <button 
                                onClick={() => setStep('ROLE')}
                                className="text-alphabag-muted hover:text-white mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                            >
                                <ArrowRight className="rotate-180" size={12} /> Back
                            </button>

                            <h2 className="text-lg font-bold text-white uppercase tracking-tight mb-3 leading-none">
                                {selectedRole === 'FOUNDER' ? 'Project Manifesto' : 'Trader Profile'}
                            </h2>

                            {selectedRole === 'FOUNDER' ? (
                                <form onSubmit={handleFounderSubmit} className="space-y-3">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider ml-1">Project Name</label>
                                            <div className="relative">
                                                <Rocket className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted" size={14} />
                                                <input 
                                                    required
                                                    className="w-full bg-alphabag-panel border border-alphabag-border rounded-md py-2.5 pl-9 pr-3 text-white font-semibold text-xs focus:outline-none focus:border-alphabag-yellow/50 transition-colors placeholder:text-alphabag-muted/40"
                                                    placeholder="e.g. My Project Name"
                                                    value={founderData.projectName}
                                                    onChange={e => setFounderData({...founderData, projectName: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                         <div className="space-y-1">
                                            <label className="text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider ml-1">Symbol</label>
                                            <div className="relative">
                                                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted" size={14} />
                                                <input 
                                                    required
                                                    className="w-full bg-alphabag-panel border border-alphabag-border rounded-md py-2.5 pl-9 pr-3 text-white font-semibold text-xs focus:outline-none focus:border-alphabag-yellow/50 transition-colors uppercase placeholder:text-alphabag-muted/40"
                                                    placeholder="TBA"
                                                    value={founderData.symbol}
                                                    onChange={e => setFounderData({...founderData, symbol: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                     <div className="space-y-1">
                                        <label className="text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider ml-1">Contract Address</label>
                                        <div className="relative">
                                            <Code className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted" size={14} />
                                            <input 
                                                required
                                                className="w-full bg-alphabag-panel border border-alphabag-border rounded-md py-2.5 pl-9 pr-3 text-white font-semibold text-xs focus:outline-none focus:border-alphabag-yellow/50 transition-colors font-mono placeholder:text-alphabag-muted/40"
                                                placeholder="0x..."
                                                value={founderData.contractAddress}
                                                onChange={e => setFounderData({...founderData, contractAddress: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                     <div className="space-y-1">
                                        <label className="text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider ml-1">The Hook (Pitch)</label>
                                        <textarea 
                                            required
                                            rows={2}
                                            className="w-full bg-alphabag-panel border border-alphabag-border rounded-md p-2.5 text-white font-semibold text-xs focus:outline-none focus:border-alphabag-yellow/50 transition-colors resize-none placeholder:text-alphabag-muted/40"
                                            placeholder="What makes your project the next big thing?"
                                            value={founderData.hook}
                                            onChange={e => setFounderData({...founderData, hook: e.target.value})}
                                        />
                                    </div>

                                     <div className="space-y-1">
                                        <label className="text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider ml-1">Website URL</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted" size={14} />
                                            <input 
                                                required
                                                type="url"
                                                className="w-full bg-alphabag-panel border border-alphabag-border rounded-md py-2.5 pl-9 pr-3 text-white font-semibold text-xs focus:outline-none focus:border-alphabag-yellow/50 transition-colors placeholder:text-alphabag-muted/40"
                                                placeholder="https://..."
                                                value={founderData.website}
                                                onChange={e => setFounderData({...founderData, website: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <Button className="w-full h-10 bg-alphabag-yellow text-black font-semibold uppercase tracking-wider rounded-md text-xs mt-3">
                                        Save & Access
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleTraderSubmit} className="space-y-3">
                                     <div className="space-y-1">
                                        <label className="text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider ml-1">Username</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted" size={14} />
                                            <input 
                                                required
                                                className="w-full bg-alphabag-panel border border-alphabag-border rounded-md py-2.5 pl-9 pr-3 text-white font-semibold text-xs focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-alphabag-muted/40"
                                                placeholder="e.g. Degen_99"
                                                value={traderData.username}
                                                onChange={e => setTraderData({...traderData, username: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                     <div className="space-y-1">
                                        <label className="text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider ml-1">Bio (160 Chars)</label>
                                        <textarea 
                                            required
                                            maxLength={160}
                                            rows={2}
                                            className="w-full bg-alphabag-panel border border-alphabag-border rounded-md p-2.5 text-white font-semibold text-xs focus:outline-none focus:border-blue-500/50 transition-colors resize-none placeholder:text-alphabag-muted/40"
                                            placeholder="Tell the community about your trading style..."
                                            value={traderData.bio}
                                            onChange={e => setTraderData({...traderData, bio: e.target.value})}
                                        />
                                        <div className="text-right text-[11px] text-alphabag-muted font-medium num mt-0.5">
                                            {traderData.bio.length} / 160
                                        </div>
                                    </div>

                                     <div className="space-y-1">
                                        <label className="text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider ml-1">Sector</label>
                                        <select 
                                            className="w-full bg-alphabag-panel border border-alphabag-border rounded-md py-2.5 px-2.5 text-white font-semibold text-xs focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
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

                                    <Button className="w-full h-10 bg-blue-500 text-white font-semibold uppercase tracking-wider rounded-md text-xs mt-3">
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
