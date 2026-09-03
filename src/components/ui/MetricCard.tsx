
import { TrendingDown,TrendingUp } from 'lucide-react';
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
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-4 h-32 animate-pulse">
        <div className="w-1/3 h-3 bg-white/5 rounded mb-2"></div>
        <div className="w-2/3 h-8 bg-white/5 rounded"></div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 relative overflow-hidden group hover:border-white/10 transition-all duration-200">
      {icon && (
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      )}
      <div className="relative z-10">
        <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-[0.2em] mb-2">{title}</p>
        <h3 className="text-3xl font-extrabold text-zinc-50 tracking-tight mb-2 tabular-data drop-shadow-md">{value}</h3>
        {change && (
          <div className="flex items-center gap-2 mt-2">
            <span className={`flex items-center px-2 py-1 rounded-md text-[10px] font-bold tabular-nums ${change.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
              }`}>
              {change.trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
              {change.value}%
            </span>
            {change.label && <span className="text-[9px] text-alphabag-muted font-bold uppercase tracking-widest">{change.label}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
