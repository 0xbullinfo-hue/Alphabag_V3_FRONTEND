import React, { useState, useEffect } from 'react';
import { Briefcase, Crown, ShieldCheck, Zap, Rocket, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const GenesisLanding: React.FC = () => {
    const { open } = useWeb3Modal();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [projectCount, setProjectCount] = useState(82); // This would eventually come from the backend

    const handleClaimSpot = async () => {
        if (!isAuthenticated) {
            window.dispatchEvent(new Event('open-login-modal'));
        } else {
            navigate('/genesis-manifesto');
        }
    };

    return (
        <div className="bg-alphabag-black min-h-screen text-white font-sans selection:bg-alphabag-yellow selection:text-black overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[1000px] bg-gradient-to-b from-alphabag-yellow/5 to-transparent pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-alphabag-yellow/5 blur-[150px] rounded-full pointer-events-none"></div>

            {/* Navigation (Minimized for Genesis) */}
            <nav className="fixed top-0 w-full z-50 bg-alphabag-black/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-alphabag-yellow text-black flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(252,213,53,0.4)]">
                            <Briefcase size={18} fill="currentColor" strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-white uppercase">Alpha<span className="text-alphabag-yellow">BAG</span></span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-[9px] font-black text-alphabag-muted uppercase tracking-[0.3em] hidden md:block">Genesis Phase 1.0</span>
                        <Button size="sm" onClick={handleClaimSpot} className="uppercase font-black tracking-widest px-4 py-1.5 h-9 text-[10px] shadow-[0_0_15px_rgba(252,213,53,0.3)] rounded-lg">
                            Claim Spot
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-32 pb-12 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <div className="inline-flex items-center space-x-2 bg-alphabag-darkgray/80 border border-alphabag-yellow/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md shadow-glow-yellow">
                    <div className="w-1.5 h-1.5 rounded-full bg-alphabag-yellow animate-ping"></div>
                    <span className="text-[9px] font-black text-alphabag-yellow uppercase tracking-[0.4em]">Hub Initialization: Active</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase leading-none animate-fade-in-up">
                    The <span className="text-alphabag-yellow">Genesis</span> <br />
                    100 <span className="text-white/20">Spots</span>
                </h1>

                <p className="text-base md:text-lg text-alphabag-muted max-w-2xl mx-auto mb-10 leading-relaxed font-medium animate-fade-in-up delay-100 opacity-60">
                    The Alpha Radar is launching. We are selecting the first 100 projects to seed the most organic social layer on BSC. No fees. No bots. Pure alpha.
                </p>

                {/* Live Counter */}
                <div className="bg-alphabag-darkgray border border-white/10 rounded-xl p-8 mb-12 relative overflow-hidden group shadow-glass animate-fade-in-up delay-200">
                    <div className="absolute inset-0 bg-gradient-to-br from-alphabag-yellow/5 to-transparent pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="text-[9px] font-black text-alphabag-subtext uppercase tracking-[0.5em] mb-3 opacity-60">Live Genesis Counter</div>
                        <div className="flex items-center justify-center space-x-6">
                            <div className="text-7xl md:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(252,213,53,0.2)]">
                                {100 - projectCount}
                            </div>
                            <div className="h-16 w-px bg-white/10"></div>
                            <div className="text-left">
                                <div className="text-3xl font-black text-alphabag-yellow">100</div>
                                <div className="text-[9px] font-black text-alphabag-muted uppercase tracking-widest mt-1">Limit</div>
                            </div>
                        </div>
                        <div className="mt-6 text-[11px] font-black text-alphabag-muted uppercase tracking-widest flex items-center space-x-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-alphabag-green animate-pulse"></span>
                            <span>{projectCount} / 100 Genesis Spots Remaining</span>
                        </div>
                    </div>
                </div>

                {/* Primary CTA */}
                <div className="flex flex-col items-center space-y-4 animate-fade-in-up delay-300">
                    <Button 
                        size="lg" 
                        onClick={handleClaimSpot}
                        className="group relative px-10 py-6 text-lg font-black transition-all hover:scale-105 active:scale-95 bg-alphabag-yellow text-black shadow-[0_0_50px_rgba(252,213,53,0.4)] rounded-xl"
                    >
                        <span className="relative z-10 flex items-center">
                            CLAIM GENESIS SPOT <ArrowRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    </Button>
                    <p className="text-[9px] text-alphabag-muted font-black uppercase tracking-[0.3em] opacity-40">Gatekeeper Fee ($50 $ALPHA) Bypassed for Genesis Founders</p>
                </div>

                {/* Core Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full animate-fade-in-up delay-500">
                    <GenesisBenefit 
                        icon={<Crown size={24} className="text-alphabag-yellow" />}
                        title="OG MULTIPLIER"
                        desc="Permanent x1.5 visibility multiplier for all alpha drops on the timeline."
                    />
                    <GenesisBenefit 
                        icon={<ShieldCheck size={24} className="text-alphabag-green" />}
                        title="VERIFIED GENESIS"
                        desc="Exclusive profile badge denoting verified founding project status."
                    />
                    <GenesisBenefit 
                        icon={<Zap size={24} className="text-blue-400" />}
                        title="PRIORITY ROUTING"
                        desc="Enhanced placement in the organic community heat table forever."
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 bg-alphabag-black mt-20 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-alphabag-muted text-[10px] font-black uppercase tracking-[0.5em]">
                    <span>AlphaBAG Systems // Genesis Layer 1.0</span>
                </div>
            </footer>
        </div>
    );
};

const GenesisBenefit = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="bg-alphabag-darkgray/30 backdrop-blur-xl border border-white/5 p-6 rounded-xl text-left hover:border-alphabag-yellow/20 transition-all group overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-alphabag-yellow/5 blur-[40px] rounded-full group-hover:bg-alphabag-yellow/10 transition-all"></div>
        <div className="mb-4 bg-alphabag-black/50 w-12 h-12 rounded-lg flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter leading-tight">{title}</h3>
        <p className="text-[11px] text-alphabag-muted font-bold uppercase tracking-widest leading-relaxed opacity-60">{desc}</p>
    </div>
);
