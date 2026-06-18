import React, { useState, useEffect } from 'react';
import { 
  X, Briefcase, Wallet, Mail, ArrowRight, Loader, 
  Shield, CheckCircle2, Zap, Rocket, Target, Send, Sparkles 
} from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useSignMessage } from 'wagmi';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { open } = useWeb3Modal();
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { siweLogin, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'INFO' | 'CONNECT' | 'SIGN' | 'SUCCESS'>('INFO');
  const [carouselStep, setCarouselStep] = useState(0);
  
  const address = wagmiAddress;
  const isConnected = wagmiIsConnected;
  const navigate = useNavigate();

  const carouselSteps = [
    {
      title: "Genesis Phase: AlphaBAG",
      description: "Welcome to the core community. We seek early testers of our utility and we have rewards for all initial supporters with ITEMS through our Genesis Airdrop Protocol.",
      icon: <Rocket className="text-alphabag-yellow" size={32} />,
      color: "from-alphabag-yellow to-yellow-600",
      bg: "bg-alphabag-yellow/10"
    },
    {
      title: "Accumulate ITEMS Daily",
      description: "Execute missions in the Mission Hub to earn ITEMS. Every action brings you closer to the elite Syndicate tier and higher token allocations. Ensure to claim daily/weekly ITEMS.",
      icon: <Zap className="text-blue-400" size={32} />,
      color: "from-blue-400 to-indigo-600",
      bg: "bg-blue-400/10"
    },
    {
      title: "Mission Feedback",
      description: "On your final mission, a constructive feedback is compulsory. We value our testers' honest input to refine our AlphaBAG infrastructure.",
      icon: <Target className="text-alphabag-green" size={32} />,
      color: "from-alphabag-green to-emerald-600",
      bg: "bg-alphabag-green/10"
    },
    {
      title: "TGE Final Sync",
      description: "Once missions are complete, perform the Final Sync by submitting your BSC wallet. Your ITEMS will be collected for future utility reward conversion during the campaign.",
      icon: <Send className="text-purple-400" size={32} />,
      color: "from-purple-400 to-pink-600",
      bg: "bg-purple-400/10"
    }
  ];

  useEffect(() => {
    // Only auto-transition if NOT in the INFO step
    if (step !== 'INFO') {
      if (isConnected && address && !isAuthenticated) {
        setStep('SIGN');
      } else if (!isConnected) {
        setStep('CONNECT');
      }
    }
  }, [isConnected, address, isAuthenticated, step]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError('');
      await open();
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setError('Connection failed');
    }
  };

  const handleSiwe = async () => {
    if (!address) return;
    setLoading(true);
    setError('');
    try {
      const message = `Sign in to AlphaBAG Protocol Hub.\nTimestamp: ${Date.now()}`;
      
      const signature = await signMessageAsync({ message });

      const success = await siweLogin(address, signature, message);
      if (success) {
        setStep('SUCCESS');
        onClose();
      } else {
        setError('Verification Failed');
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || e.message || 'Signature rejected';
      setError(errorMsg);
      console.error("[SIWE Error]", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-alphabag-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-alphabag-dark border border-white/10 w-full max-w-sm rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative group">
        
        {/* Animated Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-alphabag-yellow/10 rounded-full blur-[80px] group-hover:bg-alphabag-yellow/20 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-alphabag-blue/5 rounded-full blur-[80px]" />

        <div className="p-8 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="AlphaBAG Logo" className="w-10 h-10 object-contain rounded-full shadow-[0_0_20px_rgba(252,213,53,0.3)] transform rotate-3 hover:rotate-0 transition-transform duration-300" />
              <div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                  Alpha<span className="text-alphabag-yellow">BAG</span>
                </h2>
                <span className="block text-[8px] text-alphabag-subtext tracking-[0.4em] mt-1 font-black uppercase opacity-60">Genesis Airdrop Protocol</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 text-alphabag-subtext hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-xl"
            >
              <X size={18} />
            </button>
          </div>

          {step === 'INFO' ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 rounded-xl ${carouselSteps[carouselStep].bg} flex items-center justify-center border border-white/5 shadow-inner`}>
                  {React.cloneElement(carouselSteps[carouselStep].icon as React.ReactElement, { size: 24 })}
                </div>
              </div>

              <div className="text-center space-y-3 mb-8">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] text-alphabag-muted font-black uppercase tracking-widest opacity-60">
                  <Sparkles size={10} className="text-alphabag-yellow" /> Deployment Step {carouselStep + 1} of 4
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                  {carouselSteps[carouselStep].title}
                </h3>
                <p className="text-alphabag-subtext text-[11px] leading-relaxed font-medium opacity-60">
                  {carouselSteps[carouselStep].description}
                </p>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={() => {
                    if (carouselStep < 3) {
                      setCarouselStep(carouselStep + 1);
                    } else {
                      // Transition to real wallet connection
                      setStep('CONNECT');
                    }
                  }}
                  className={`w-full py-4 bg-gradient-to-r ${carouselSteps[carouselStep].color} text-black font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] text-[9px] flex items-center justify-center gap-2 h-11`}
                >
                  {carouselStep < 3 ? (
                    <><span>Next Phase</span><ArrowRight size={12} strokeWidth={3} /></>
                  ) : (
                    <>
                      <Zap size={12} strokeWidth={3} />
                      <span>ENTER HUB</span>
                    </>
                  )}
                </Button>
                
                <div className="flex justify-center gap-2">
                  {carouselSteps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-300 ${i === carouselStep ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 space-y-1.5">
                <p className="text-sm text-white font-black uppercase tracking-tight">
                  {step === 'CONNECT' && 'Establish Connection'}
                  {step === 'SIGN' && 'Verify Identity'}
                  {step === 'SUCCESS' && 'Access Granted'}
                </p>
                <p className="text-[10px] text-alphabag-subtext font-medium leading-relaxed opacity-60">
                  {step === 'CONNECT' && 'Sync your professional wallet to interface with the AlphaBAG terminal.'}
                  {step === 'SIGN' && 'Provide a secure signature to initialize your member profile.'}
                  {step === 'SUCCESS' && 'Initialization complete. Redirecting...'}
                </p>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="text-red-400 text-[10px] text-center font-black uppercase tracking-widest bg-red-500/5 border border-red-500/20 p-3 rounded-xl animate-in shake duration-300">
                    Error: {error}
                  </div>
                )}

                {step === 'CONNECT' && (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        'Read-only access',
                        'Secure signature',
                        'Instant onboarding'
                      ].map((item) => (
                        <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center">
                          <div className="text-[8px] font-black uppercase tracking-[0.18em] text-alphabag-subtext">{item}</div>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleConnect}
                      className="w-full h-12 text-[10px] font-black tracking-[0.2em] shadow-2xl uppercase flex items-center justify-center gap-3 bg-alphabag-yellow hover:bg-yellow-400 text-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      disabled={loading}
                    >
                      {loading ? <Loader className="animate-spin" size={16} /> : <><Wallet size={16} strokeWidth={3} /> Connect Wallet</>}
                    </Button>
                  </>
                )}

                {step === 'SIGN' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mb-1">
                      <div className="w-7 h-7 bg-alphabag-blue/20 rounded flex items-center justify-center text-alphabag-blue">
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <div className="text-[7px] text-alphabag-subtext font-black uppercase tracking-widest opacity-60">Connected Terminal</div>
                        <div className="text-[9px] text-white font-mono font-black tracking-tighter">{address}</div>
                      </div>
                    </div>
                    <Button
                      onClick={handleSiwe}
                      className="w-full h-12 text-[10px] font-black tracking-[0.2em] shadow-2xl uppercase flex items-center justify-center gap-3 bg-white text-black hover:bg-alphabag-blue hover:text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader className="animate-spin" size={16} />
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        <><Shield size={16} strokeWidth={3} /> Sign & Initialize</>
                      )}
                    </Button>
                  </div>
                )}

                {step === 'SUCCESS' && (
                  <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-alphabag-green/20 rounded-full flex items-center justify-center text-alphabag-green shadow-[0_0_40px_rgba(0,255,163,0.2)]">
                      <CheckCircle2 size={40} strokeWidth={2.5} />
                    </div>
                    <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-alphabag-green animate-progress" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <Shield size={10} className="text-alphabag-subtext" />
                <span className="text-[8px] font-black uppercase tracking-widest text-alphabag-subtext">Secure Phase 1</span>
              </div>
              <div className="w-1 h-1 bg-alphabag-subtext rounded-full" />
              <div className="flex items-center gap-2">
                <Zap size={10} className="text-alphabag-subtext" />
                <span className="text-[8px] font-black uppercase tracking-widest text-alphabag-subtext">EVM Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

