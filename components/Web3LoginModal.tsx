import React from 'react';
import { X, ShieldCheck, ArrowRight, Briefcase, Zap, Globe, Smartphone } from 'lucide-react';
import { useConnect } from 'wagmi';
import { useWallet } from '../context/WalletContext.tsx';

interface Web3LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Web3LoginModal: React.FC<Web3LoginModalProps> = ({ isOpen, onClose }) => {
  const { connect, connectors, isLoading: isConnectingWagmi } = useConnect();
  const { isConnecting: isConnectingContext } = useWallet();

  if (!isOpen) return null;

  const isConnecting = isConnectingWagmi || isConnectingContext;

  const handleConnect = async (connectorId: string) => {
    // CRITICAL: Prevent concurrent attempts
    if (isConnecting) return;

    try {
      // Find the specific connector (injected or walletConnect)
      const connector = connectors.find(c => c.id === connectorId);
      if (connector) {
        connect({ connector });
      }
      onClose();
    } catch (e) {
      console.error("Connection Failed", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-alphabag-dark border border-alphabag-gray w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative border-t-alphabag-yellow/50">
        <div className="p-8 text-center">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-alphabag-yellow text-alphabag-black flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(252,213,53,0.3)]">
                  <Briefcase size={22} fill="currentColor" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none text-left">
                Alpha<span className="text-alphabag-yellow">BAG</span> <span className="block text-[10px] text-alphabag-subtext tracking-[0.2em] mt-1 font-bold">Node Sync v2.0</span>
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-alphabag-subtext hover:text-white transition-colors bg-alphabag-black/50 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="mb-8 bg-alphabag-black/40 border border-alphabag-gray/50 rounded-2xl p-6 relative group overflow-hidden">
             <div className="relative mb-4">
                <ShieldCheck size={48} className="mx-auto text-alphabag-yellow" />
                <div className="absolute top-1 right-[38%]">
                    <div className="w-3 h-3 bg-alphabag-yellow rounded-full animate-ping opacity-50"></div>
                </div>
             </div>
             <p className="text-sm text-alphabag-text font-bold leading-relaxed mb-1 uppercase tracking-tight">
               Secure Access Protocol
             </p>
             <p className="text-xs text-alphabag-subtext font-medium leading-relaxed px-4">
               Authorize your node connection to synchronize your global multi-chain assets securely.
             </p>
          </div>

          <div className="space-y-3">
            {/* Browser Wallet Fallback (Injected) */}
            <button 
              onClick={() => handleConnect('injected')}
              disabled={isConnecting}
              className="w-full flex items-center justify-between p-5 bg-alphabag-black border border-alphabag-gray hover:border-alphabag-yellow hover:bg-alphabag-yellow/5 rounded-2xl transition-all group disabled:opacity-50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 flex items-center justify-center bg-alphabag-yellow/10 border border-alphabag-yellow/20 rounded-xl group-hover:scale-105 transition-all">
                  <Globe size={24} className="text-alphabag-yellow" />
                </div>
                <div className="text-left">
                  <div className="font-black text-white text-lg uppercase tracking-tighter">Browser Extension</div>
                  <div className="text-[9px] text-alphabag-subtext font-black uppercase tracking-widest">MetaMask, Phantom, Trust</div>
                </div>
              </div>
              <ArrowRight size={20} className="text-alphabag-yellow opacity-0 group-hover:opacity-100 transition-all" />
            </button>

            {/* WalletConnect (Relay) */}
            <button 
              onClick={() => handleConnect('walletConnect')}
              disabled={isConnecting}
              className="w-full flex items-center justify-between p-5 bg-alphabag-black border border-alphabag-gray hover:border-blue-500 hover:bg-blue-500/5 rounded-2xl transition-all group disabled:opacity-50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-xl group-hover:scale-105 transition-all">
                  <Smartphone size={24} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-black text-white text-lg uppercase tracking-tighter">Mobile Node</div>
                  <div className="text-[9px] text-alphabag-subtext font-black uppercase tracking-widest">WalletConnect Protocol</div>
                </div>
              </div>
              <ArrowRight size={20} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center space-x-6 grayscale opacity-40">
             <div className="flex items-center space-x-2 text-white">
                <Zap size={16} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Verified Connection</span>
             </div>
          </div>

          <div className="mt-8 text-center">
             <p className="text-[9px] text-alphabag-subtext font-bold uppercase tracking-[0.3em] opacity-50 leading-relaxed">
               Secure AES-256 EIP-191 Auth<br />
               AlphaBAG Professional Core Interface
             </p>
          </div>
        </div>
        
        {isConnecting && (
          <div className="absolute inset-0 bg-alphabag-dark/80 flex flex-col items-center justify-center backdrop-blur-md z-40 animate-fade-in">
            <div className="w-16 h-16 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-alphabag-yellow font-black uppercase tracking-[0.4em] text-xs">Connecting Neural Node...</p>
          </div>
        )}
      </div>
    </div>
  );
};