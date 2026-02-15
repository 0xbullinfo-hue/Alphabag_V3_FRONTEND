
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
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, secondaryAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-alphabag-dark/30 border border-dashed border-alphabag-gray rounded-3xl animate-fade-in">
      <div className="w-20 h-20 bg-alphabag-gray/30 rounded-full flex items-center justify-center text-alphabag-yellow mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-alphabag-subtext max-w-sm mb-8 font-medium leading-relaxed">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button onClick={action.onClick} leftIcon={action.icon} variant="primary">
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} variant="ghost">
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};
