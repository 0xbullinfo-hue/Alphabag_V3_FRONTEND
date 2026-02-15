import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

interface PremiumLockProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const PremiumLock: React.FC<PremiumLockProps> = ({ 
  children, 
  title = "Ultimate Feature", 
  description = "Verify 1,000,000 BAG Tokens to unlock this professional data." 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isUltimate = user?.tier === 'ULTIMATE';

  if (isUltimate) return <>{children}</>;

  const handleUpgrade = () => {
    window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
  };

  return (
    <div className="relative overflow-hidden rounded-xl h-full">
      <div className="filter blur-md pointer-events-none select-none opacity-50 h-full">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-alphabag-black/40 z-10 p-4 text-center">
        <div className="bg-alphabag-dark/95 p-6 rounded-2xl border border-alphabag-yellow/30 shadow-2xl max-w-sm backdrop-blur-md animate-fade-in">
          <div className="w-14 h-14 bg-alphabag-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4 text-alphabag-yellow border border-alphabag-yellow/20">
            <Lock size={28} />
          </div>
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{title}</h3>
          <p className="text-alphabag-subtext text-xs mb-6 font-bold leading-relaxed">{description}</p>
          <div className="space-y-2">
            <Button size="md" onClick={handleUpgrade} className="w-full uppercase font-black tracking-widest shadow-xl">
              Upgrade to Ultimate
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/settings')} 
                className="w-full uppercase font-black tracking-widest text-[10px] hover:text-white"
            >
              Explore Premium Features <ArrowRight size={14} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};