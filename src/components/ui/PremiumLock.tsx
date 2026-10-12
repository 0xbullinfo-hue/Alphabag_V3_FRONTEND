import { ArrowRight, Lock } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';

interface PremiumLockProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  requiredTier?: 'PREMIUM' | 'ULTIMATE';
}

export const PremiumLock: React.FC<PremiumLockProps> = ({ 
  children, 
  title = "Premium Access", 
  description = "Requires 1,000,000 BAG held in a verified wallet.",
  requiredTier = 'ULTIMATE',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const hasAccess = React.useMemo(() => {
    if (!user) return false;
    if (user.tier === 'ULTIMATE') return true;
    if (requiredTier === 'PREMIUM' && user.tier === 'PREMIUM') return true;
    return false;
  }, [user, requiredTier]);

  if (hasAccess) return <>{children}</>;

  const handleUpgrade = () => {
    window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
  };

  return (
    <div className="relative overflow-hidden rounded-[6px] h-full border border-[#2B313A]">
      <div className="filter blur-sm pointer-events-none select-none opacity-40 h-full">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0E11]/80 z-10 p-4 text-center">
        <div className="bg-[#181A20] p-5 rounded-[6px] border border-[#2B313A] max-w-sm w-full">
          <div className="w-10 h-10 bg-[#202630] border border-[#2B313A] rounded flex items-center justify-center mx-auto mb-3 text-alphabag-yellow">
            <Lock size={18} />
          </div>
          <h3 className="text-base font-semibold text-alphabag-text mb-1 tracking-tight">{title}</h3>
          <p className="text-alphabag-subtext text-xs mb-4 leading-relaxed">{description}</p>
          <div className="space-y-2">
            <Button size="sm" onClick={handleUpgrade} className="w-full">
              {requiredTier === 'ULTIMATE' ? 'Verify Ultimate Access' : 'Upgrade Account'}
            </Button>
            <Button 
              variant="ghost" 
              size="xs" 
              onClick={() => navigate('/settings')} 
              className="w-full text-alphabag-subtext hover:text-alphabag-text"
            >
              View Membership Tiers <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
