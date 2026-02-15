import React from 'react';
import { Button } from './ui/Button.tsx';
import { Wallet, LogOut, Crown, Eye, Globe } from 'lucide-react';
import { useWallet } from '../context/WalletContext.tsx';
import { useNetwork } from 'wagmi';

export const WalletConnectButton: React.FC = () => {
  const { address, isConnecting, connectWallet, disconnectWallet, isPremium, connectionType } = useWallet();
  const { chain } = useNetwork();

  if (address) {
    return (
      <div className="flex items-center space-x-2">
        {isPremium && (
          <div className="hidden lg:flex items-center bg-gradient-to-r from-alphabag-yellow to-orange-400 text-alphabag-black text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg">
            <Crown size={12} className="mr-1.5" fill="currentColor" /> NODE ELITE
          </div>
        )}
        
        <div className="hidden sm:flex items-center bg-alphabag-black/50 text-alphabag-subtext text-[10px] font-bold px-3 py-1.5 rounded-lg border border-alphabag-gray">
          {connectionType === 'MANUAL' ? (
            <><Eye size={12} className="mr-1.5" /> Observer</>
          ) : (
            <><Globe size={12} className="mr-1.5 text-alphabag-yellow" /> {chain?.name || 'Mainnet'}</>
          )}
        </div>

        <div className="flex items-center bg-alphabag-gray/30 rounded-xl overflow-hidden border border-alphabag-gray group">
          <div className="px-3 py-2 text-xs font-mono text-alphabag-text border-r border-alphabag-gray/50 flex items-center group-hover:bg-alphabag-yellow/5 transition-all">
            {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </div>
          <button 
            onClick={disconnectWallet}
            title="Terminate Neural Link"
            className="px-2.5 py-2 hover:bg-alphabag-red/20 text-alphabag-subtext hover:text-alphabag-red transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Button 
      variant="primary" 
      size="sm" 
      onClick={connectWallet} 
      isLoading={isConnecting}
      className="shadow-[0_0_15px_rgba(252,213,53,0.2)] font-black"
    >
      <Wallet className="w-4 h-4 mr-2" />
      Sync Node
    </Button>
  );
};