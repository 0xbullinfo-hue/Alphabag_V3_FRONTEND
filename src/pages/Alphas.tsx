import React from 'react';

export const Alphas: React.FC = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase relative flex items-center">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">Alphas</span>
      </h1>
      <div className="bg-alphabag-dark p-4 rounded-xl border border-alphabag-gray">
        <p className="text-alphabag-muted text-[11px] mb-3 uppercase font-bold tracking-widest opacity-60">Beta Stream Active. Neural link syncing...</p>
        <div className="flex flex-col space-y-3">
          <div className="border border-alphabag-gray p-3 rounded-lg bg-black/20">
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-alphabag-yellow/10"></div>
              <div className="h-3 w-20 bg-white/5 rounded"></div>
            </div>
            <div className="h-3 w-full bg-white/5 rounded mb-1.5"></div>
            <div className="h-3 w-2/3 bg-white/5 rounded"></div>
          </div>
          <div className="border border-alphabag-gray p-3 rounded-lg bg-black/20">
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-alphabag-yellow/10"></div>
              <div className="h-3 w-20 bg-white/5 rounded"></div>
            </div>
            <div className="h-3 w-full bg-white/5 rounded mb-1.5"></div>
            <div className="h-3 w-2/3 bg-white/5 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
