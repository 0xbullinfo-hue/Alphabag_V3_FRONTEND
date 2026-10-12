import { SEO } from '../../components/common/SEO';
import { buildBreadcrumbs } from '../../lib/structuredData';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { ArrowRight, Briefcase, Crown, ShieldCheck, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export const GenesisLanding: React.FC = () => {
    useWeb3Modal();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [projectCount] = useState(82);

    const handleClaimSpot = async () => {
        if (!isAuthenticated) {
            window.dispatchEvent(new Event('open-login-modal'));
        } else {
            navigate('/genesis-manifesto');
        }
    };

    return (
        <div className="bg-alphabag-black min-h-screen text-white font-sans selection:bg-alphabag-yellow selection:text-black overflow-hidden relative">
            <SEO
                title="Genesis Access | AlphaBAG Terminal"
                description="AlphaBAG Genesis launchpad and VIP access portal. Secure your early node allocations and beta terminal access."
                canonicalUrl="/genesis"
                structuredData={buildBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'Genesis', path: '/genesis' }])}
            />
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-alphabag-card to-transparent pointer-events-none"></div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-alphabag-card border-b border-alphabag-border">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-alphabag-yellow text-black flex items-center justify-center rounded-md">
                            <Briefcase size={16} fill="currentColor" strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white uppercase">Alpha<span className="text-alphabag-yellow">BAG</span></span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-[11px] font-semibold text-alphabag-muted uppercase tracking-wider hidden md:block">Genesis Phase 1.0</span>
                        <Button size="sm" onClick={handleClaimSpot} className="uppercase font-semibold tracking-wider px-3.5 py-1.5 h-8 text-[11px] rounded-md">
                            Claim Spot
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative pt-28 pb-12 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <div className="inline-flex items-center space-x-2 bg-alphabag-card border border-alphabag-yellow/30 rounded-full px-3.5 py-1 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-alphabag-yellow animate-ping"></div>
                    <span className="text-[11px] font-semibold text-alphabag-yellow uppercase tracking-wider">Hub Initialization: Active</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight uppercase leading-none animate-fade-in-up">
                    The <span className="text-alphabag-yellow">Genesis</span> <br />
                    100 <span className="text-alphabag-subtext">Spots</span>
                </h1>

                <p className="text-sm md:text-base text-alphabag-subtext max-w-2xl mx-auto mb-8 leading-relaxed font-normal animate-fade-in-up delay-100">
                    The Alpha Radar is launching. We are selecting the first 100 projects to seed the most organic social layer on BSC. No fees. No bots. Pure alpha.
                </p>

                {/* Live Counter */}
                <div className="bg-alphabag-card border border-alphabag-border rounded-lg p-5 mb-8 relative overflow-hidden group animate-fade-in-up delay-200">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="text-[11px] font-semibold text-alphabag-subtext uppercase tracking-wider mb-2">Live Genesis Counter</div>
                        <div className="flex items-center justify-center space-x-4">
                            <div className="text-6xl md:text-7xl font-bold text-white tracking-tight tabular-nums num">
                                {100 - projectCount}
                            </div>
                            <div className="h-14 w-px bg-alphabag-border"></div>
                            <div className="text-left">
                                <div className="text-2xl font-bold text-alphabag-yellow num">100</div>
                                <div className="text-[11px] font-semibold text-alphabag-muted uppercase tracking-wider mt-0.5">Limit</div>
                            </div>
                        </div>
                        <div className="mt-4 text-[11px] font-semibold text-alphabag-muted uppercase tracking-wider flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-alphabag-green animate-pulse"></span>
                            <span className="num">{projectCount} / 100 Genesis Spots Remaining</span>
                        </div>
                    </div>
                </div>

                {/* Primary CTA */}
                <div className="flex flex-col items-center space-y-2 animate-fade-in-up delay-300">
                    <Button 
                        size="lg" 
                        onClick={handleClaimSpot}
                        className="group relative px-8 py-3 text-base font-bold transition-all bg-alphabag-yellow text-black rounded-md"
                    >
                        <span className="relative z-10 flex items-center">
                            CLAIM GENESIS SPOT <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Button>
                    <p className="text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider">Gatekeeper Fee ($50 $ALPHA) Bypassed for Genesis Founders</p>
                </div>

                {/* Core Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-16 w-full animate-fade-in-up delay-500">
                    <GenesisBenefit 
                        icon={<Crown size={22} className="text-alphabag-yellow" />}
                        title="OG MULTIPLIER"
                        desc="Permanent x1.5 visibility multiplier for all alpha drops on the timeline."
                    />
                    <GenesisBenefit 
                        icon={<ShieldCheck size={22} className="text-alphabag-green" />}
                        title="VERIFIED GENESIS"
                        desc="Exclusive profile badge denoting verified founding project status."
                    />
                    <GenesisBenefit 
                        icon={<Zap size={22} className="text-blue-400" />}
                        title="PRIORITY ROUTING"
                        desc="Enhanced placement in the organic community heat table forever."
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-alphabag-border bg-alphabag-card mt-16 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col items-center text-alphabag-muted text-[11px] font-semibold uppercase tracking-wider">
                    <span>AlphaBAG Systems // Genesis Layer 1.0</span>
                </div>
            </footer>
        </div>
    );
};

const GenesisBenefit = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="bg-alphabag-card border border-alphabag-border p-4 rounded-lg text-left hover:border-alphabag-yellow/40 transition-all group overflow-hidden relative">
        <div className="mb-3 bg-alphabag-panel w-10 h-10 rounded-md flex items-center justify-center border border-alphabag-border">
            {icon}
        </div>
        <h3 className="text-base font-bold text-white mb-1 uppercase tracking-tight leading-tight">{title}</h3>
        <p className="text-[11px] text-alphabag-subtext font-normal leading-relaxed">{desc}</p>
    </div>
);
