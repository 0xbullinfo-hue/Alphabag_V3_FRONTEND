
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Wallet, Search, Eye } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const ConnectOrWatch: React.FC = () => {
  const { connectWallet, connectManually, isConnecting } = useWallet();
  const [manualAddress, setManualAddress] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualAddress.trim().length > 0) {
      connectManually(manualAddress);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-alphabag-dark border border-alphabag-gray rounded-xl p-8 text-center shadow-xl">
      <div className="mb-6">
        <div className="w-16 h-16 bg-alphabag-yellow/10 rounded-full flex items-center justify-center text-alphabag-yellow mx-auto mb-4">
            <Wallet size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-alphabag-subtext text-sm">
            Access your dashboard, track assets, and unlock premium insights.
        </p>
      </div>

      <div className="space-y-6">
        <Button size="lg" className="w-full font-bold py-3" onClick={connectWallet} isLoading={isConnecting}>
            <Wallet className="mr-2" size={20} />
            Connect Web3 Wallet
        </Button>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-alphabag-gray"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-alphabag-dark px-2 text-alphabag-subtext">Or manually track address</span>
            </div>
        </div>

        <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-alphabag-subtext" />
                </div>
                <input 
                    type="text" 
                    placeholder="Enter wallet address (0x...)" 
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-alphabag-black border border-alphabag-gray rounded-lg text-white text-sm focus:ring-1 focus:ring-alphabag-yellow focus:border-alphabag-yellow transition-all outline-none"
                />
            </div>
            <Button type="submit" variant="secondary" disabled={!manualAddress}>
                <Eye className="mr-2" size={16} />
                Watch
            </Button>
        </form>
      </div>
    </div>
  );
};
