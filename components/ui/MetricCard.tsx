
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
      <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 h-32 animate-pulse">
        <div className="w-1/3 h-3 bg-alphabag-gray rounded mb-4"></div>
        <div className="w-2/3 h-8 bg-alphabag-gray rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 relative overflow-hidden group hover:border-alphabag-yellow/30 transition-all shadow-lg">
      {icon && (
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
          {icon}
        </div>
      )}
      <div className="relative z-10">
        <p className="text-[10px] text-alphabag-subtext font-bold uppercase tracking-[0.2em] mb-2">{title}</p>
        <h3 className="text-3xl font-extrabold text-white tracking-tighter mb-2">{value}</h3>
        {change && (
          <div className="flex items-center gap-1.5">
            <span className={`flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
              change.trend === 'up' ? 'bg-alphabag-green/10 text-alphabag-green' : 'bg-alphabag-red/10 text-alphabag-red'
            }`}>
              {change.trend === 'up' ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
              {change.value}%
            </span>
            {change.label && <span className="text-[9px] text-alphabag-subtext font-bold uppercase tracking-widest">{change.label}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
