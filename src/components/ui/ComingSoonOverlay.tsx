import { Lock } from 'lucide-react';
import React from 'react';
import { Button } from './Button';

interface ComingSoonOverlayProps {
  title?: string;
  description?: string;
  fullPage?: boolean;
  onClose?: () => void;
}

export const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({ 
  title = "Premium Feature", 
  description = "Institutional-grade tooling is currently under deployment for this terminal surface.",
  fullPage = true,
  onClose
}) => {
  return (
    <div className={`
      absolute z-50 flex items-center justify-center p-4 bg-alphabag-black/85 overflow-hidden transition-all duration-300
      ${fullPage ? '-inset-4 md:-inset-6 lg:-inset-8' : 'inset-0 rounded-lg border border-white/5'}
    `}>
      <div className="max-w-md w-full bg-alphabag-dark border border-alphabag-yellow/20 p-6 rounded-lg text-center relative overflow-hidden group">
        <div className="relative z-10">
          <div className="w-14 h-14 bg-alphabag-yellow/10 rounded-md flex items-center justify-center mx-auto mb-3 border border-alphabag-yellow/20">
            <Lock className="text-alphabag-yellow animate-pulse" size={28} />
          </div>
          
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight mb-3">
            {title}
          </h2>
          
          <p className="text-alphabag-subtext text-sm font-medium leading-relaxed mb-4">
            {description}
          </p>

          <Button 
            onClick={onClose}
            className="w-full bg-alphabag-black border border-alphabag-yellow/30 text-alphabag-yellow font-bold uppercase tracking-wider py-3 transition-all"
          >
            <span className="text-alphabag-yellow">Coming Soon</span>
          </Button>
          
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-alphabag-yellow animate-ping"></div>
            <span className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider">Development Phase 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
