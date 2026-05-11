import React, { useState } from 'react';
import { Shield, Zap, Rocket, CheckCircle2, Info, ArrowRight, Plus, Trash2, Link as LinkIcon, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { AlphaRadarService } from '../services/alphaRadarService';
import Swal from 'sweetalert2';

export const GenesisManifesto: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { premiumTokenBalance } = useWallet();
    const isFounder = user?.accountType === 'FOUNDER';
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        contractAddress: '',
        hook: '',
        description: '',
        totalSupply: '',
        websiteUrl: '',
        buyLink: '',
        logoUrl: '',
        bannerUrl: '',
        // Keep original specialized fields if they fit into Json column
        problemSolution: '',
        utility: [''],
        auditLink: '',
        liquidityLink: '',
        kycLink: '',
        roadmap: ['', '', '']
    });

    const handleAddField = (field: 'utility' | 'roadmap') => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const handleUpdateField = (field: 'utility' | 'roadmap', index: number, value: string) => {
        const newArr = [...formData[field]];
        newArr[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArr }));
    };

    const handleRemoveField = (field: 'utility' | 'roadmap', index: number) => {
        const newArr = formData[field].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [field]: newArr }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Holding Check
        if (premiumTokenBalance < 100000) {
            Swal.fire({
                title: 'Insufficient Locked Stake',
                text: 'Only verified holders can submit project details.',
                icon: 'warning',
                background: '#1E2329',
                color: '#FFF'
            });
            return;
        }

        // 2. Founder Check for Manifesto
        if (!isFounder) {
            Swal.fire({
                title: 'Manifesto Restricted',
                text: 'Only Founders can drop a full Project Manifesto. Traders can only submit basic project details for Live Pairs.',
                icon: 'info',
                background: '#1E2329',
                color: '#FFF'
            });
            return;
        }

        // 3. Project Limit Check
        const projectsSubmitted = localStorage.getItem(`project_submitted_${user?.id || 'guest'}`);
        if (projectsSubmitted) {
            Swal.fire({
                title: 'Limit Reached',
                text: 'You have already submitted a project with this wallet connection.',
                icon: 'error',
                background: '#1E2329',
                color: '#FFF'
            });
            return;
        }

        const projectPayload = {
            name: formData.name,
            symbol: formData.symbol,
            contractAddress: formData.contractAddress,
            theHook: formData.hook,
            description: formData.description,
            totalSupply: formData.totalSupply,
            websiteUrl: formData.websiteUrl,
            buyLink: formData.buyLink,
            logoUrl: formData.logoUrl,
            bannerUrl: formData.bannerUrl,
            manifestoText: {
                problemSolution: formData.problemSolution,
                utility: formData.utility,
                roadmap: formData.roadmap,
                auditLink: formData.auditLink,
                liquidityLink: formData.liquidityLink,
                kycLink: formData.kycLink
            }
        };

        const result = await AlphaRadarService.submitProject(projectPayload);
        if (result.success) {
            // Set submission flag
            localStorage.setItem(`project_submitted_${user?.id || 'guest'}`, 'true');
            
            Swal.fire({
                title: 'Manifesto Dropped!',
                text: 'Your project is now being indexed. It has been auto-pinned to your profile feed.',
                icon: 'success',
                background: '#1E2329',
                color: '#FFF',
                timer: 3000,
                showConfirmButton: false
            });
            
            setTimeout(() => navigate('/live-pairs'), 3000);
        } else {
            Swal.fire({
                title: 'Submission Failed',
                text: result.error || "Please check your data.",
                icon: 'error',
                background: '#1E2329',
                color: '#FFF'
            });
        }
    };

    return (
        <div className="bg-alphabag-black min-h-screen text-white font-sans pt-12 pb-16 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="w-10 h-10 bg-alphabag-yellow text-black flex items-center justify-center rounded-xl shadow-glow-yellow">
                            <Rocket size={20} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight leading-none">Genesis <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600">BAG Manifesto</span></h1>
                            <p className="text-alphabag-muted text-[9px] font-black uppercase tracking-[0.3em] mt-1 opacity-60">Founders Phase 1.0 Onboarding</p>
                        </div>
                    </div>
                    <p className="text-alphabag-subtext text-[13px] leading-relaxed opacity-60">
                        Define your vision. The Genesis Manifesto is your project's permanent record on Alpha Radar. High-quality inputs increase community heat.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <Section title="00. IDENTITY" subtitle="Project name and ticker symbol.">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-alphabag-muted ml-1 opacity-60">Project Name</label>
                                    <input 
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. My Token Project"
                                        className="w-full bg-zinc-100 border border-white/5 rounded-lg px-3 py-2 text-xs text-black focus:border-alphabag-yellow/50 outline-none placeholder:text-zinc-400 transition-all font-bold"
                                        required
                                    />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-alphabag-muted ml-1 opacity-60">Ticker</label>
                                <input 
                                    type="text"
                                    value={formData.symbol}
                                    onChange={(e) => setFormData(p => ({ ...p, symbol: e.target.value }))}
                                    placeholder="e.g. ALPHA"
                                    className="w-full bg-zinc-100 border border-white/5 rounded-lg px-3 py-2 text-xs text-black focus:border-alphabag-yellow/50 outline-none placeholder:text-zinc-400 transition-all font-bold"
                                    required
                                />
                            </div>
                        </div>
 
                        {/* Media Assets */}
                        <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-alphabag-muted ml-1 opacity-60">Logo URL (64x64)</label>
                                <input 
                                    type="url"
                                    value={formData.logoUrl}
                                    onChange={(e) => setFormData(p => ({ ...p, logoUrl: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full bg-zinc-100 border border-white/5 rounded-lg px-3 py-2 text-xs text-black focus:border-alphabag-yellow/50 outline-none placeholder:text-zinc-400 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-alphabag-muted ml-1 opacity-60">Banner URL (1200x400)</label>
                                <input 
                                    type="url"
                                    value={formData.bannerUrl}
                                    onChange={(e) => setFormData(p => ({ ...p, bannerUrl: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full bg-zinc-100 border border-white/5 rounded-lg px-3 py-2 text-xs text-black focus:border-alphabag-yellow/50 outline-none placeholder:text-zinc-400 transition-all font-bold"
                                />
                            </div>
                        </div>

                        {/* Media Preview */}
                        {(formData.logoUrl || formData.bannerUrl || formData.name) && (
                            <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                                <p className="text-[9px] font-black text-alphabag-yellow uppercase mb-2.5 tracking-widest px-1.5 opacity-60">Briefing Preview</p>
                                <div className="relative rounded-xl overflow-hidden aspect-[3/1] bg-alphabag-darkgray/50 border border-white/10 group">
                                    {formData.bannerUrl ? (
                                        <img src={formData.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/5">
                                            <Rocket size={32} />
                                        </div>
                                    )}
                                    <div className="absolute left-4 bottom-4 flex items-end space-x-3">
                                        <div className="w-12 h-12 rounded-xl bg-alphabag-yellow p-0.5 shadow-2xl border border-white/10">
                                            <div className="w-full h-full bg-alphabag-black rounded-lg overflow-hidden">
                                                {formData.logoUrl ? (
                                                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/10 text-[8px]">LOGO</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mb-0.5">
                                            <div className="text-base font-black uppercase tracking-tighter text-white drop-shadow-lg leading-tight">{formData.name || 'PROJECT NAME'}</div>
                                            <div className="bg-alphabag-yellow text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest inline-block leading-none">MANIFESTO PINNED</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Section>

                    <Section title="01. ON-CHAIN DATA" subtitle="Contract Address and Supply details.">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-alphabag-muted ml-1 opacity-60">Contract Address (CA)</label>
                                <input 
                                    type="text"
                                    value={formData.contractAddress}
                                    onChange={(e) => setFormData(p => ({ ...p, contractAddress: e.target.value }))}
                                    placeholder="0x..."
                                    className="w-full bg-zinc-100 border border-white/5 rounded-lg px-3 py-2 text-xs text-black focus:border-alphabag-yellow/50 outline-none placeholder:text-zinc-400 transition-all font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-alphabag-muted ml-1 opacity-60">Total Supply</label>
                                <input 
                                    type="text"
                                    value={formData.totalSupply}
                                    onChange={(e) => setFormData(p => ({ ...p, totalSupply: e.target.value }))}
                                    placeholder="e.g. 1,000,000,000"
                                    className="w-full bg-zinc-100 border border-white/5 rounded-lg px-3 py-2 text-xs text-black focus:border-alphabag-yellow/50 outline-none placeholder:text-zinc-400 transition-all font-bold"
                                    required
                                />
                            </div>
                        </div>
                    </Section>

                    <Section title="02. LINKS" subtitle="Where can users find you and buy?">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-alphabag-muted ml-1 opacity-60">Website URL</label>
                                <input 
                                    type="url"
                                    value={formData.websiteUrl}
                                    onChange={(e) => setFormData(p => ({ ...p, websiteUrl: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full bg-zinc-100 border border-white/5 rounded-lg px-3 py-2 text-xs text-black focus:border-alphabag-yellow/50 outline-none placeholder:text-zinc-400 transition-all font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-alphabag-muted ml-1 opacity-60">Buy Link (DEX/Router)</label>
                                <input 
                                    type="url"
                                    value={formData.buyLink}
                                    onChange={(e) => setFormData(p => ({ ...p, buyLink: e.target.value }))}
                                    placeholder="https://uniswap.org/..."
                                    className="w-full bg-zinc-100 border border-white/5 rounded-lg px-3 py-2 text-xs text-black focus:border-alphabag-yellow/50 outline-none placeholder:text-zinc-400 transition-all font-bold"
                                    required
                                />
                            </div>
                        </div>
                    </Section>

                    {/* The Hook */}
                    <Section title="03. THE HOOK" subtitle="Max 150 chars. Your one-sentence pitch.">
                        <textarea 
                            maxLength={150}
                            className="w-full bg-zinc-100 border border-white/5 rounded-xl p-4 text-xs text-black placeholder:text-zinc-400 focus:border-alphabag-yellow/50 outline-none resize-none h-24 font-bold"
                            placeholder="e.g. The first AI-powered liquidity aggregator that optimizes yield across 12 chains in real-time."
                            value={formData.hook}
                            onChange={(e) => setFormData(prev => ({ ...prev, hook: e.target.value }))}
                            required
                        />
                        <div className="text-[9px] text-right mt-1 font-black text-alphabag-muted uppercase tracking-widest opacity-60">
                            {formData.hook.length} / 150
                        </div>
                    </Section>

                    {/* Description */}
                    <Section title="04. THE DEEP DIVE" subtitle="Explain why your project is the next institutional alpha.">
                        <textarea 
                            className="w-full bg-zinc-100 border border-white/5 rounded-xl p-4 text-xs text-black placeholder:text-zinc-400 focus:border-alphabag-yellow/50 outline-none min-h-[120px] font-bold"
                            placeholder="Provide a detailed description of your project..."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            required
                        />
                    </Section>

                    {/* Problem & Solution */}
                    <Section title="05. PROBLEM & SOLUTION" subtitle="Why does your project exist?">
                        <textarea 
                            className="w-full bg-zinc-100 border border-white/5 rounded-xl p-4 text-xs text-black placeholder:text-zinc-400 focus:border-alphabag-yellow/50 outline-none min-h-[200px] font-bold"
                            placeholder="Define the market inefficiency and how your technology or community fixes it..."
                            value={formData.problemSolution}
                            onChange={(e) => setFormData(prev => ({ ...prev, problemSolution: e.target.value }))}
                        />
                    </Section>

                    {/* Token Utility */}
                    <Section title="03. TOKEN UTILITY" subtitle="Why should investors hold your token?">
                        <div className="space-y-3">
                            {formData.utility.map((item, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input 
                                        className="flex-1 bg-zinc-100 border border-white/5 rounded-lg p-3 text-xs text-black placeholder:text-zinc-400 focus:border-alphabag-yellow/50 outline-none transition-all font-bold"
                                        placeholder={`Benefit #${index + 1}`}
                                        value={item}
                                        onChange={(e) => handleUpdateField('utility', index, e.target.value)}
                                        required
                                    />
                                    {formData.utility.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveField('utility', index)} className="p-1.5 text-alphabag-red hover:bg-alphabag-red/10 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddField('utility')}
                                className="flex items-center space-x-1.5 text-alphabag-yellow text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity"
                            >
                                <Plus size={14} /> <span>Add Utility Point</span>
                            </button>
                        </div>
                    </Section>

                    {/* Security & Trust */}
                    <Section title="04. SECURITY & TRUST" subtitle="Transparency is required for Genesis spots.">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <LinkInput 
                                label="AUDIT LINK" 
                                placeholder="https://certik.com/..." 
                                value={formData.auditLink}
                                onChange={(val) => setFormData(prev => ({ ...prev, auditLink: val }))}
                            />
                            <LinkInput 
                                label="LIQUIDITY LOCK" 
                                placeholder="https://pinksale.finance/..." 
                                value={formData.liquidityLink}
                                onChange={(val) => setFormData(prev => ({ ...prev, liquidityLink: val }))}
                            />
                            <LinkInput 
                                label="KYC STATUS" 
                                placeholder="https://assure.defi/..." 
                                value={formData.kycLink}
                                onChange={(val) => setFormData(prev => ({ ...prev, kycLink: val }))}
                            />
                        </div>
                    </Section>

                    {/* Roadmap */}
                    <Section title="05. THE ROADMAP" subtitle="Your next three major deliverables.">
                        <div className="space-y-4">
                            {formData.roadmap.map((item, index) => (
                                <div key={index} className="relative">
                                    <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-alphabag-yellow text-black flex items-center justify-center rounded-full text-[9px] font-black italic">
                                        M{index + 1}
                                    </div>
                                    <input 
                                        className="w-full bg-zinc-100 border border-white/5 rounded-xl p-4 pl-10 text-xs text-black placeholder:text-zinc-400 focus:border-alphabag-yellow/50 outline-none transition-all font-bold"
                                        placeholder={`Milestone ${index + 1}: e.g. Mainnet V2 Launch`}
                                        value={item}
                                        onChange={(e) => handleUpdateField('roadmap', index, e.target.value)}
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Submit */}
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-alphabag-muted opacity-60">
                            <Lock size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Gatekeeper Fee Bypassed</span>
                        </div>
                        <Button 
                            type="submit"
                            className="bg-alphabag-yellow text-black font-black uppercase tracking-widest shadow-lg shadow-alphabag-yellow/20 hover:shadow-alphabag-yellow/40 hover:-translate-y-0.5 transition-all text-[11px] h-11 px-6 rounded-xl"
                        >
                            Drop Manifesto
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Section = ({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) => (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 md:p-6 backdrop-blur-sm">
        <div className="mb-4">
            <h2 className="text-base font-black text-white uppercase tracking-tight mb-0.5">{title}</h2>
            <p className="text-alphabag-muted text-[9px] font-black uppercase tracking-widest opacity-60">{subtitle}</p>
        </div>
        {children}
    </div>
);

const LinkInput = ({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (val: string) => void }) => (
    <div className="space-y-1.5">
        <label className="text-[9px] font-black text-alphabag-muted uppercase tracking-[0.1em] opacity-60 ml-1">{label}</label>
        <div className="relative">
            <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-muted opacity-40" />
            <input 
                className="w-full bg-zinc-100 border border-white/5 rounded-lg p-3 pl-9 text-[11px] text-black focus:border-alphabag-yellow/50 outline-none placeholder:text-zinc-400 transition-all font-bold"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    </div>
);
