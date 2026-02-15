
import React from 'react';
import { Shield, Crown } from 'lucide-react';
import { UserTier } from '../../types';

interface TierConfig {
  label: string;
  icon: React.ReactNode;
  styles: string;
}

const getConfigs = (size: 'sm' | 'md' | 'lg'): Record<string, TierConfig> => ({
  FREE: {
    label: 'Free',
    icon: <Shield size={size === 'sm' ? 10 : 14} />,
    styles: 'bg-alphabag-gray/50 text-alphabag-subtext border-alphabag-gray/30'
  },
  BASIC: {
    label: 'Free',
    icon: <Shield size={size === 'sm' ? 10 : 14} />,
    styles: 'bg-alphabag-gray/50 text-alphabag-subtext border-alphabag-gray/30'
  },
  ULTIMATE: {
    label: 'Ultimate',
    icon: <Crown size={size === 'sm' ? 10 : 14} className="fill-current" />,
    styles: 'bg-alphabag-yellow/10 text-alphabag-yellow border-alphabag-yellow/30 shadow-[0_0_15px_rgba(252,213,53,0.15)]'
  }
});

interface TierBadgeProps {
  tier: UserTier | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md', className = '' }) => {
  // Explicitly cast to the union type to resolve type narrowing issues in some React/TS environments
  const currentSize = size as 'sm' | 'md' | 'lg';
  const configs = getConfigs(currentSize);
  
  // Robust lookup with multiple fallbacks to ensure config is never undefined
  const activeTier = (tier || 'FREE').toString().toUpperCase();
  const config = configs[activeTier] || configs.FREE;

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[8px]',
    md: 'px-2.5 py-1 text-[10px]',
    lg: 'px-4 py-2 text-xs'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 font-extrabold uppercase tracking-widest border rounded-full ${config.styles} ${sizeStyles[currentSize]} ${className}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};
