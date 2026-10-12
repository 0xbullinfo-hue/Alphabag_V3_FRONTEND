import { TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down';
    label?: string;
  };
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  isLoading,
  className = '' 
}) => {
  if (isLoading) {
    return (
      <div className={`bg-[#181A20] border border-[#2B313A] rounded-[6px] p-3.5 h-28 flex flex-col justify-between ${className}`}>
        <div className="w-1/3 h-3 bg-[#2B313A]/50 rounded mb-2"></div>
        <div className="w-2/3 h-6 bg-[#2B313A]/50 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`bg-[#181A20] border border-[#2B313A] rounded-[6px] p-3.5 flex flex-col justify-between transition-colors duration-150 hover:border-[#3E4552] ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-alphabag-subtext uppercase tracking-wider">{title}</span>
        {icon && <span className="text-alphabag-subtext shrink-0">{icon}</span>}
      </div>
      <div>
        <div className="text-xl md:text-2xl font-semibold text-alphabag-text tracking-tight num mb-1">
          {value}
        </div>
        {change && (
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-xs font-medium num ${
              change.trend === 'up' 
                ? 'bg-emerald-500/10 text-alphabag-green border border-emerald-500/20' 
                : 'bg-rose-500/10 text-alphabag-red border border-rose-500/20'
            }`}>
              {change.trend === 'up' ? <TrendingUp size={11} className="mr-1" /> : <TrendingDown size={11} className="mr-1" />}
              {change.value > 0 && change.trend === 'up' ? '+' : ''}{change.value}%
            </span>
            {change.label && (
              <span className="text-[11px] text-alphabag-subtext">{change.label}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
