import {
Rocket,
Send,
Shield,
Sparkles,
Target,
X,
Zap
} from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import { Button } from '../ui/Button';

export const AirdropOnboarding: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('alphabag_airdrop_onboarding_v2');
        if (!hasSeenOnboarding) {
            const timer = setTimeout(() => setIsOpen(true), 1500);
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
            description: "Welcome to the ecosystem. Early participants earn ecosystem reward units (ITEMS) through verified campaign missions.",
            icon: <Rocket className="text-alphabag-yellow" size={24} />,
            color: "from-alphabag-yellow to-yellow-600",
            bg: "bg-alphabag-yellow/10"
        },
        {
            title: "Accumulate ITEMS Daily",
            description: "Execute missions in the Mission Hub to earn ITEMS. Every action brings you closer to higher tier allocations.",
            icon: <Zap className="text-blue-400" size={24} />,
            color: "from-blue-400 to-indigo-600",
            bg: "bg-blue-400/10"
        },
        {
            title: "Mission Feedback",
            description: "Submit verified user feedback upon mission completion to assist protocol audits and terminal quality.",
            icon: <Target className="text-alphabag-green" size={24} />,
            color: "from-alphabag-green to-emerald-600",
            bg: "bg-alphabag-green/10"
        },
        {
            title: "TGE Final Sync",
            description: "Once missions are complete, perform the Final Sync by submitting your verified BSC wallet address.",
            icon: <Send className="text-purple-400" size={24} />,
            color: "from-purple-400 to-pink-600",
            bg: "bg-purple-400/10"
        }
    ];

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-alphabag-dark border border-white/10 rounded-lg overflow-hidden relative group">
                {/* Decorative Elements */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${currentStep.color} transition-all duration-500`} style={{width: `${(step + 1) * 25}%`}}></div>

                <button 
                    onClick={closeOnboarding}
                    className="absolute top-6 right-6 p-2 text-alphabag-muted hover:text-white transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-6 md:p-8 text-center">
                    <div className="flex justify-center mb-3">
                        <div className={`w-14 h-14 rounded-md ${currentStep.bg} flex items-center justify-center border border-white/5`}>
                            {currentStep.icon}
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider">
                            <Sparkles size={11} className="text-alphabag-yellow" /> Onboarding Step {step + 1} of 4
                        </div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight leading-none">
                            {currentStep.title}
                        </h2>
                        <p className="text-alphabag-subtext text-xs leading-relaxed font-medium">
                            {currentStep.description}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button 
                            onClick={nextStep}
                            className="w-full py-3 bg-alphabag-yellow text-alphabag-dark font-bold uppercase tracking-wider rounded-md transition-all text-xs h-11"
                        >
                            {step < 3 ? 'Continue' : 'Enter Mission Terminal'}
                        </Button>
                        <div className="flex justify-center gap-2 mt-1">
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
                <div className="bg-white/[0.02] p-3 text-center border-t border-white/5">
                    <p className="text-[11px] text-alphabag-muted font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
                        <Shield size={12} className="text-alphabag-yellow" /> AlphaBAG Terminal Infrastructure
                    </p>
                </div>
            </div>
        </div>
    );
};
