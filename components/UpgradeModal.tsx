import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, ArrowRight, Zap, Globe, Crown, Smartphone, AlertTriangle, Loader2 } from 'lucide-react';
import { useAccount, useBalance, useNetwork, useSwitchNetwork } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Placeholder for the real $BAG token contract on BSC
const BAG_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const MIN_HOLDINGS = 1_000_000;

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { upgradeToUltimate } = useAuth();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Fetch token balance
  const { data: tokenBalance } = useBalance({
    address: address,
    token: BAG_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000' ? undefined : BAG_TOKEN_ADDRESS as `0x${string}`,
    chainId: bsc.id,
    watch: true,
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setVerificationError(null);
      setIsVerifying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    await open();
  };

  const handleVerify = async () => {
    if (!address) return;
    setIsVerifying(true);
    setVerificationError(null);

    try {
      // 1. Check Network
      if (chain?.id !== bsc.id) {
        if (switchNetwork) {
          try {
            await switchNetwork(bsc.id);
            await new Promise(r => setTimeout(r, 1000));
          } catch (e) {
            await open({ view: 'Networks' });
            throw new Error("Please switch your wallet to Binance Smart Chain (BSC).");
          }
        } else {
          await open({ view: 'Networks' });
          throw new Error("Please switch your wallet to Binance Smart Chain (BSC).");
        }
      }

      // 2. Check Balance (Simulation for Demo)
      await new Promise(r => setTimeout(r, 1500));

      // 3. Upgrade
      await upgradeToUltimate(address);
      onClose();
    } catch (e: any) {
      console.error("Verification Failed", e);
      setVerificationError(e.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-alphabag-dark border border-alphabag-gray w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(252,213,53,0.2)] overflow-hidden relative border-t-alphabag-yellow/50">
        <div className="p-8 text-center">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-alphabag-yellow text-alphabag-black flex items-center justify-center rounded-xl">
                <Crown size={22} fill="currentColor" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none text-left">
                Alpha<span className="text-alphabag-yellow">BAG</span> <span className="block text-[10px] text-alphabag-subtext tracking-[0.2em] mt-1 font-bold">Ultimate Upgrade</span>
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-alphabag-subtext hover:text-white transition-colors bg-alphabag-black/50 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="mb-8 bg-alphabag-black/40 border border-alphabag-gray/50 rounded-2xl p-6 relative group overflow-hidden">
            <div className="relative mb-4">
              <ShieldCheck size={48} className="mx-auto text-alphabag-yellow" />
            </div>
            <p className="text-sm text-alphabag-text font-bold leading-relaxed mb-1 uppercase tracking-tight">
              Token Proof of Stake
            </p>
            <p className="text-[10px] text-alphabag-subtext font-medium leading-relaxed px-4">
              Verifying 1,000,000+ $BAG tokens to unlock unlimited neural access.
            </p>
          </div>

          {verificationError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-left">
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <p className="text-xs text-red-400 font-bold">{verificationError}</p>
            </div>
          )}

          {!isConnected ? (
            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-between p-5 bg-alphabag-black border border-alphabag-gray hover:border-alphabag-yellow hover:bg-alphabag-yellow/5 rounded-2xl transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-xl group-hover:scale-105 transition-all">
                  <Smartphone size={24} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-black text-white text-lg uppercase tracking-tighter">Connect Wallet</div>
                  <div className="text-[9px] text-alphabag-subtext font-black uppercase tracking-widest">Connect to BSC to Verify</div>
                </div>
              </div>
              <ArrowRight size={20} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-alphabag-black rounded-xl border border-alphabag-gray">
                <p className="text-[10px] text-alphabag-subtext font-bold uppercase mb-1">Authenticated Wallet</p>
                <p className="text-white font-mono text-xs">{address?.substring(0, 10)}...{address?.substring(address.length - 8)}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${chain?.id === bsc.id ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-[10px] text-alphabag-subtext font-bold uppercase">{chain?.name || 'Unknown Network'}</span>
                </div>
              </div>

              <Button
                onClick={handleVerify}
                isLoading={isVerifying}
                className="w-full py-4 text-sm font-black tracking-widest"
              >
                {isVerifying ? 'SCANNING HOLDINGS...' : 'INITIATE VERIFICATION'}
              </Button>
            </div>
          )}

          <div className="mt-8 flex items-center justify-center space-x-6 grayscale opacity-40">
            <div className="flex items-center space-x-2 text-white">
              <Zap size={16} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-tighter">AES-256 Verified Link</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};