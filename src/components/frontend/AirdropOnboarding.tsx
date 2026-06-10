import React, { useState, useEffect } from 'react';
import { 
    Gift, Zap, Shield, Target, ArrowRight, X, 
    CheckCircle2, MousePointer2, Send, Rocket, Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';

export const AirdropOnboarding: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('alphabag_airdrop_onboarding_v2');
        if (!hasSeenOnboarding) {
            const timer = setTimeout(() => setIsOpen(true), 1500); // Delay for better impact
            return () => clearTimeout(timer);
        }
    }, []);

    const closeOnboarding = () => {
        setIsOpen(false);
        localStorage.setItem('alphabag_airdrop_onboarding_v2', 'true');
    };

    const nextStep = () => {
        if (step < 3) setStep(step + 1);
        else closeOnboarding();
    };

    if (!isOpen) return null;

    const steps = [
        {
            title: "Genesis Phase: AlphaBAG",
            description: "Welcome to the core community. We reward our earliest supporters with ITEMS through our Genesis Airdrop Protocol.",
            icon: <Rocket className="text-alphabag-yellow" size={24} />,
            color: "from-alphabag-yellow to-yellow-600",
            bg: "bg-alphabag-yellow/10"
        },
        {
            title: "Accumulate ITEMS Daily",
            description: "Execute missions in the Mission Hub to earn ITEMS. Every action brings you closer to the elite Syndicate tier and higher ITEMS allocations.",
            icon: <Zap className="text-blue-400" size={24} />,
            color: "from-blue-400 to-indigo-600",
            bg: "bg-blue-400/10"
        },
        {
            title: "Mission Feedback",
            description: "On your final mission, constructive feedback is compulsory. We value our testers' input to refine the AlphaBAG infrastructure.",
            icon: <Target className="text-alphabag-green" size={24} />,
            color: "from-alphabag-green to-emerald-600",
            bg: "bg-alphabag-green/10"
        },
        {
            title: "TGE Final Sync",
            description: "Once missions are complete, perform the Final Sync by submitting your BSC wallet. Your ITEMS will be collected for future utility reward conversion during the campaign.",
            icon: <Send className="text-purple-400" size={24} />,
            color: "from-purple-400 to-pink-600",
            bg: "bg-purple-400/10"
        }
    ];

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
            <div className="w-full max-w-lg bg-alphabag-dark/95 border border-white/10 rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.85)] overflow-hidden relative group">
                {/* Decorative Elements */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${currentStep.color} transition-all duration-700`} style={{width: `${(step + 1) * 25}%`}}></div>
                <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-all duration-700 bg-gradient-to-br ${currentStep.color}`}></div>
                
                <button 
                    onClick={closeOnboarding}
                    className="absolute top-6 right-6 p-2 text-alphabag-muted hover:text-white transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-6 md:p-10 text-center">
                    <div className="flex justify-center mb-6">
                        <div className={`w-16 h-16 rounded-xl ${currentStep.bg} flex items-center justify-center animate-bounce-slow border border-white/5 shadow-inner`}>
                            {currentStep.icon}
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] text-alphabag-muted font-black uppercase tracking-widest">
                            <Sparkles size={10} className="text-alphabag-yellow" /> Deployment Step {step + 1} of 4
                        </div>
                        <h2 className={`text-2xl font-black text-white uppercase tracking-tighter leading-none`}>
                            {currentStep.title}
                        </h2>
                        <p className="text-alphabag-subtext text-[13px] leading-relaxed font-medium opacity-60">
                            {currentStep.description}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button 
                            onClick={nextStep}
                            className={`w-full py-4 bg-gradient-to-r ${currentStep.color} text-black font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-[0_20px_80px_rgba(252,213,53,0.18)] text-[11px] h-11`}
                        >
                            {step < 3 ? 'Initiate Next Phase' : 'Access Control Deck'}
                        </Button>
                        <div className="flex justify-center gap-2 mt-2">
                            {steps.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="bg-white/[0.02] p-4 text-center border-t border-white/5">
                    <p className="text-[9px] text-alphabag-muted font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <Shield size={10} className="text-alphabag-yellow" /> AlphaBAG Encrypted Transmission v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};
