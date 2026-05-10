import React from 'react';

export const Alphas: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase mb-6 relative flex items-center">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">Alphas</span>
      </h1>
      <div className="bg-alphabag-darkgray p-6 rounded-xl border border-alphabag-border">
        <p className="text-alphabag-muted mb-4">Beta Stream Active. Neural link syncing...</p>
        <div className="flex flex-col space-y-6">
          <div className="border border-alphabag-border p-4 rounded-lg bg-black/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-alphabag-yellow/20"></div>
              <div className="h-4 w-24 bg-white/10 rounded"></div>
            </div>
            <div className="h-4 w-full bg-white/5 rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-white/5 rounded"></div>
          </div>
          <div className="border border-alphabag-border p-4 rounded-lg bg-black/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-alphabag-yellow/20"></div>
              <div className="h-4 w-24 bg-white/10 rounded"></div>
            </div>
            <div className="h-4 w-full bg-white/5 rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-white/5 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
