
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowDown, Settings, AlertTriangle } from 'lucide-react';

export const Swap: React.FC = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  return (
    <div className="flex flex-col items-center space-y-10 py-10">
        <div className="text-center mb-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">BAG Swap</h1>
            <p className="text-alphabag-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Genesis Liquidity Protocol</p>
        </div>

        <div className="w-full max-w-md glass-panel p-6 shadow-glow-yellow/5 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-alphabag-yellow/5 rounded-full blur-3xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>
            
            <div className="flex justify-between items-center mb-6">
                <span className="section-label">Execution Terminal</span>
                <button className="p-2 rounded-xl hover:bg-white/5 transition-colors text-alphabag-muted hover:text-white">
                    <Settings size={18} />
                </button>
            </div>

            {/* From Input */}
            <div className="bg-white/5 rounded-2xl p-5 mb-2 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex justify-between mb-3">
                    <span className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest">You Pay</span>
                    <span className="text-[10px] text-alphabag-muted font-bold tracking-widest">Balance: 2.45 ETH</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <input 
                        type="number" 
                        placeholder="0.0" 
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="bg-transparent text-4xl font-black text-white w-full outline-none placeholder-white/10 tabular-nums"
                    />
                    <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0 transition-all font-bold">
                        <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" className="w-5 h-5" alt="ETH" />
                        <span>ETH</span>
                    </button>
                </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-4 relative z-10">
                <div className="bg-alphabag-black border border-white/10 p-2.5 rounded-2xl shadow-xl hover:scale-110 transition-transform cursor-pointer">
                    <ArrowDown size={20} className="text-alphabag-yellow" />
                </div>
            </div>

            {/* To Input */}
            <div className="bg-white/5 rounded-2xl p-5 mt-2 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex justify-between mb-3">
                    <span className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest">You Receive</span>
                    <span className="text-[10px] text-alphabag-muted font-bold tracking-widest">Balance: 0.00</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <input 
                        type="number" 
                        placeholder="0.0" 
                        value={toAmount}
                        readOnly
                        className="bg-transparent text-4xl font-black text-white w-full outline-none placeholder-white/10 tabular-nums"
                    />
                    <button className="bg-alphabag-yellow text-black px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0 transition-all font-black">
                        <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-[10px] font-black text-alphabag-yellow">B</div>
                        <span>BAG</span>
                    </button>
                </div>
            </div>

            {/* Safety Message */}
            <div className="mt-6 p-4 rounded-2xl bg-alphabag-yellow/5 border border-alphabag-yellow/20 text-center">
                <p className="text-[9px] text-alphabag-yellow font-black uppercase tracking-widest mb-1">
                    <AlertTriangle size={10} className="inline mr-1" /> PASTE CONTRACT
                </p>
                <p className="text-[9px] text-white/70 font-medium leading-relaxed">
                    Paste the $BAG contract address to find the token. <br/>
                    <span className="text-alphabag-yellow font-bold uppercase">ONLY USE CA FROM OUR WEBSITE OR OFFICIAL CHANNELS WHEN WE ARE LIVE.</span>
                </p>
            </div>

            <Button className="w-full bg-alphabag-yellow text-black hover:bg-yellow-400 hover:scale-[1.02] active:scale-[0.98] font-black text-base py-5 rounded-2xl mt-6 shadow-glow-yellow/20 transition-all uppercase tracking-widest">
                Connect Wallet
            </Button>
        </div>
    </div>
  );
};
