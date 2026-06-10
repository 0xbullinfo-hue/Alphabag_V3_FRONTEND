
import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ArrowDown, Settings, AlertTriangle } from 'lucide-react';

export const Swap: React.FC = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  return (
    <div className="flex flex-col items-center space-y-6 py-6">
        <div className="text-center mb-2">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">BAG <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-1">Swap</span></h1>
            <p className="text-alphabag-muted text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Genesis Liquidity Protocol</p>
        </div>

        <div className="w-full max-w-sm glass-panel p-4 shadow-glow-yellow/5 relative overflow-hidden group rounded-xl">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>
            
            <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-alphabag-subtext opacity-60">Execution Terminal</span>
                <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-alphabag-muted hover:text-white">
                    <Settings size={14} />
                </button>
            </div>

            {/* From Input */}
            <div className="bg-white/5 rounded-xl p-4 mb-1.5 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex justify-between mb-2">
                    <span className="text-[9px] text-alphabag-muted font-black uppercase tracking-widest">You Pay</span>
                    <span className="text-[9px] text-alphabag-muted font-bold tracking-widest opacity-60">Balance: 2.45 ETH</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                    <input 
                        type="number" 
                        placeholder="0.0" 
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="bg-transparent text-2xl font-black text-white w-full outline-none placeholder-white/10 tabular-nums"
                    />
                    <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all font-bold text-xs">
                        <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" className="w-4 h-4" alt="ETH" />
                        <span>ETH</span>
                    </button>
                </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-3.5 relative z-10">
                <div className="bg-alphabag-black border border-white/10 p-2 rounded-lg shadow-xl hover:scale-110 transition-transform cursor-pointer">
                    <ArrowDown size={16} className="text-alphabag-yellow" />
                </div>
            </div>

            {/* To Input */}
            <div className="bg-white/5 rounded-xl p-4 mt-1.5 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex justify-between mb-2">
                    <span className="text-[9px] text-alphabag-muted font-black uppercase tracking-widest">You Receive</span>
                    <span className="text-[9px] text-alphabag-muted font-bold tracking-widest opacity-60">Balance: 0.00</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                    <input 
                        type="number" 
                        placeholder="0.0" 
                        value={toAmount}
                        readOnly
                        className="bg-transparent text-2xl font-black text-white w-full outline-none placeholder-white/10 tabular-nums"
                    />
                    <button className="bg-alphabag-yellow text-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all font-black text-xs">
                        <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center text-[8px] font-black text-alphabag-yellow">B</div>
                        <span>BAG</span>
                    </button>
                </div>
            </div>

            {/* Safety Message */}
            <div className="mt-4 p-3 rounded-xl bg-alphabag-yellow/5 border border-alphabag-yellow/10 text-center">
                <p className="text-[8px] text-alphabag-yellow font-black uppercase tracking-[0.2em] mb-1">
                    <AlertTriangle size={8} className="inline mr-1" /> PASTE CONTRACT
                </p>
                <p className="text-[9px] text-white/50 font-medium leading-relaxed">
                    Paste the $BAG contract address to find the token. <br/>
                    <span className="text-alphabag-yellow/80 font-bold uppercase">ONLY USE CA FROM OFFICIAL CHANNELS.</span>
                </p>
            </div>

            <Button className="w-full bg-alphabag-yellow text-black hover:bg-yellow-400 hover:scale-[1.02] active:scale-[0.98] font-black text-xs h-11 rounded-xl mt-4 shadow-glow-yellow/10 transition-all uppercase tracking-widest">
                Connect Wallet
            </Button>
        </div>
    </div>
  );
};
