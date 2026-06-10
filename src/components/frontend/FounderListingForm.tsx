import React, { useState } from 'react';
import { X, Globe, Shield, Tag, FileText, Send, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { AlphaRadarService } from '../../services/alphaRadarService';

interface FounderListingFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const FounderListingForm: React.FC<FounderListingFormProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        contractAddress: '',
        description: '',
        logoUrl: '',
        website: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await AlphaRadarService.submitProject(formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-alphabag-black/95 backdrop-blur-sm animate-fade-in">
            <div className="bg-alphabag-dark border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                            List Your <span className="text-alphabag-yellow">Project</span>
                        </h2>
                        <button onClick={onClose} className="p-2 text-alphabag-muted hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${step >= i ? 'bg-alphabag-yellow shadow-[0_0_10px_rgba(252,213,53,0.3)]' : 'bg-white/5'}`}></div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-4 animate-slide-in">
                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest flex items-center gap-2">
                                    <Tag size={12} /> Project Name
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full bg-zinc-100 border border-white/5 rounded-xl px-4 py-3 text-black font-semibold focus:border-alphabag-yellow outline-none transition-all placeholder:text-zinc-400"
                                    placeholder="e.g. AlphaBAG Systems"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={12} /> Token Symbol
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full bg-zinc-100 border border-white/5 rounded-xl px-4 py-3 text-black font-semibold focus:border-alphabag-yellow outline-none transition-all placeholder:text-zinc-400"
                                    placeholder="e.g. BAG"
                                    value={formData.symbol}
                                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                                />
                            </div>
                            <Button onClick={() => setStep(2)} className="w-full py-4 uppercase font-bold tracking-widest">Next Step</Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-slide-in">
                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={12} /> Contract Address
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full bg-zinc-100 border border-white/5 rounded-xl px-4 py-3 text-black font-semibold focus:border-alphabag-yellow outline-none transition-all font-mono placeholder:text-zinc-400"
                                    placeholder="0x..."
                                    value={formData.contractAddress}
                                    onChange={(e) => setFormData({...formData, contractAddress: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={12} /> Website URL
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full bg-zinc-100 border border-white/5 rounded-xl px-4 py-3 text-black font-semibold focus:border-alphabag-yellow outline-none transition-all placeholder:text-zinc-400"
                                    placeholder="https://..."
                                    value={formData.website}
                                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 py-4 border-white/5">Back</Button>
                                <Button onClick={() => setStep(3)} className="flex-1 py-4 uppercase font-bold tracking-widest">Next Step</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-slide-in">
                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={12} /> Project Description
                                </label>
                                <textarea 
                                    className="w-full bg-zinc-100 border border-white/5 rounded-xl px-4 py-3 text-black font-semibold focus:border-alphabag-yellow outline-none transition-all min-h-[120px] placeholder:text-zinc-400"
                                    placeholder="Describe your vision, utility, and roadmap..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 py-4 border-white/5">Back</Button>
                                <Button 
                                    onClick={handleSubmit} 
                                    isLoading={isSubmitting}
                                    className="flex-1 py-4 uppercase font-bold tracking-widest bg-alphabag-yellow text-black"
                                >
                                    Submit Project
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
