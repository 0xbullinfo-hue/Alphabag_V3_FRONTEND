import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action, 
  secondaryAction,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-[#181A20] border border-dashed border-[#2B313A] rounded-[6px] ${className}`}>
      <div className="w-10 h-10 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-subtext mb-3">
        {icon}
      </div>
      <h3 className="text-sm md:text-base font-semibold text-alphabag-text mb-1 tracking-tight">{title}</h3>
      <p className="text-xs text-alphabag-subtext max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {action && (
          <Button onClick={action.onClick} leftIcon={action.icon} variant="primary" size="sm">
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} variant="secondary" size="sm">
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};
