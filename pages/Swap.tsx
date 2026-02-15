
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { ArrowDown, Settings } from 'lucide-react';

export const Swap: React.FC = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  return (
    <div className="flex justify-center items-start pt-10">
        <div className="w-full max-w-md bg-alphabag-dark border border-alphabag-gray rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-bold text-lg">Swap</h2>
                <button className="text-alphabag-subtext hover:text-white"><Settings size={20} /></button>
            </div>

            {/* From Input */}
            <div className="bg-alphabag-black rounded-xl p-4 mb-2 border border-alphabag-gray/50 hover:border-alphabag-gray transition-colors">
                <div className="flex justify-between mb-2">
                    <span className="text-alphabag-subtext text-xs">You Pay</span>
                    <span className="text-alphabag-subtext text-xs">Balance: 2.45 ETH</span>
                </div>
                <div className="flex justify-between items-center">
                    <input 
                        type="number" 
                        placeholder="0" 
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="bg-transparent text-3xl font-bold text-white w-full outline-none placeholder-alphabag-gray"
                    />
                    <button className="bg-alphabag-gray hover:bg-gray-700 text-white px-3 py-1 rounded-full flex items-center space-x-2 shrink-0">
                        <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" className="w-5 h-5" alt="ETH" />
                        <span>ETH</span>
                    </button>
                </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-3 relative z-10">
                <div className="bg-alphabag-dark border border-alphabag-gray p-1.5 rounded-lg">
                    <ArrowDown size={16} className="text-alphabag-yellow" />
                </div>
            </div>

            {/* To Input */}
            <div className="bg-alphabag-black rounded-xl p-4 mt-2 border border-alphabag-gray/50 hover:border-alphabag-gray transition-colors">
                <div className="flex justify-between mb-2">
                    <span className="text-alphabag-subtext text-xs">You Receive</span>
                    <span className="text-alphabag-subtext text-xs">Balance: 0</span>
                </div>
                <div className="flex justify-between items-center">
                    <input 
                        type="number" 
                        placeholder="0" 
                        value={toAmount}
                        readOnly
                        className="bg-transparent text-3xl font-bold text-white w-full outline-none placeholder-alphabag-gray"
                    />
                    <button className="bg-alphabag-gray hover:bg-gray-700 text-white px-3 py-1 rounded-full flex items-center space-x-2 shrink-0">
                        <div className="w-5 h-5 bg-alphabag-yellow rounded-full flex items-center justify-center text-[10px] font-bold text-black">B</div>
                        <span>BAG</span>
                    </button>
                </div>
            </div>

            {/* Price Info */}
            <div className="flex justify-between items-center px-2 py-4 text-xs text-alphabag-subtext">
                <span>1 ETH = 2,540 BAG</span>
                <span>Gas: $4.50</span>
            </div>

            <Button size="lg" className="w-full font-bold text-lg py-4 rounded-xl">Connect Wallet to Swap</Button>
        </div>
    </div>
  );
};
