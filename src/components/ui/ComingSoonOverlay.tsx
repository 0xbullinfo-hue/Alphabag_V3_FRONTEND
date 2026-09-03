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
  description = "Get a sneak peek at our institutional-grade tools and classified alpha streams during the Alpha Phase.",
  fullPage = true,
  onClose
}) => {
  return (
    <div className={`
      absolute z-50 flex items-center justify-center p-4 bg-alphabag-black/40 backdrop-blur-2xl overflow-hidden transition-all duration-500
      ${fullPage ? '-inset-4 md:-inset-6 lg:-inset-8' : 'inset-0 rounded-3xl border border-white/5'}
    `}>
      <div className="max-w-md w-full bg-alphabag-dark border border-alphabag-yellow/20 p-4 rounded-3xl text-center relative overflow-hidden group">
        {/* Animated Background Glow */}
        
        

        <div className="relative z-10">
          <div className="w-16 h-16 bg-alphabag-yellow/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-alphabag-yellow/20 shadow-inner">
            <Lock className="text-alphabag-yellow animate-pulse" size={32} />
          </div>
          
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">
            {title}
          </h2>
          
          <p className="text-alphabag-subtext text-sm font-medium leading-relaxed mb-2">
            {description}
          </p>

          <Button 
            onClick={onClose}
            className="w-full bg-alphabag-black/50 border border-alphabag-yellow/30 text-alphabag-yellow font-black uppercase tracking-widest py-4 transition-all"
          >
            <span className="text-alphabag-yellow">Coming Soon</span>
          </Button>
          
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-alphabag-yellow animate-ping"></div>
            <span className="text-[10px] text-alphabag-subtext font-black uppercase tracking-[0.3em]">Development Phase 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
