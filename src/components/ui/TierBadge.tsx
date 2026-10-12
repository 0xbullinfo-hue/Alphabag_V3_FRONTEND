import { Crown, Shield } from 'lucide-react';
import React from 'react';
import { UserTier } from '../../types';

interface TierConfig {
  label: string;
  icon: React.ReactNode;
  styles: string;
}

const getConfigs = (size: 'sm' | 'md' | 'lg'): Record<string, TierConfig> => ({
  FREE: {
    label: 'Standard',
    icon: <Shield size={size === 'sm' ? 10 : 12} />,
    styles: 'bg-white/5 text-alphabag-subtext border-white/10'
  },
  BASIC: {
    label: 'Standard',
    icon: <Shield size={size === 'sm' ? 10 : 12} />,
    styles: 'bg-white/5 text-alphabag-subtext border-white/10'
  },
  PREMIUM: {
    label: 'Pro',
    icon: <Shield size={size === 'sm' ? 10 : 12} />,
    styles: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  },
  ULTIMATE: {
    label: 'VIP / Ultimate',
    icon: <Crown size={size === 'sm' ? 10 : 12} className="fill-current" />,
    styles: 'bg-alphabag-yellow/10 text-alphabag-yellow border-alphabag-yellow/20'
  }
});

interface TierBadgeProps {
  tier: UserTier | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md', className = '' }) => {
  const currentSize = size as 'sm' | 'md' | 'lg';
  const configs = getConfigs(currentSize);

  const activeTier = (tier || 'FREE').toString().toUpperCase();
  const config = configs[activeTier] || configs.FREE;

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[11px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-xs'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider border rounded-[2px] ${config.styles} ${sizeStyles[currentSize]} ${className}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};
