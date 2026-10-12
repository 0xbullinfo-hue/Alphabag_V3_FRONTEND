import { useWeb3Modal } from '@web3modal/wagmi/react';
import { AlertTriangle,ArrowRight,Crown,ShieldCheck,Smartphone,X,Zap } from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import { useAccount,useBalance,useNetwork,useSwitchNetwork } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { useAuth } from '../../context/AuthContext';
import { TOKEN_GATING_CONFIG } from '../../services/config';
import { Button } from '../ui/Button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BAG_TOKEN_ADDRESS =
  TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_MAINNET ||
  TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_TESTNET ||
  '0x0000000000000000000000000000000000000000';
const MIN_HOLDINGS = TOKEN_GATING_CONFIG.MIN_BAG_REQUIRED;

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { upgradeToUltimate } = useAuth();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const { data: tokenBalance } = useBalance({
    address: address,
    token: BAG_TOKEN_ADDRESS as `0x${string}`,
    chainId: bsc.id,
    watch: true,
  });

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

      const currentBalance = Number(tokenBalance?.formatted || 0);
      if (MIN_HOLDINGS > 0 && currentBalance < MIN_HOLDINGS) {
        throw new Error(
          `Insufficient BAG balance. You have ${currentBalance.toFixed(2)}, need ${MIN_HOLDINGS}.`
        );
      }

      const upgraded = await upgradeToUltimate(address);
      if (!upgraded) {
        throw new Error('Verification failed. The server could not confirm your BAG balance.');
      }
      onClose();
    } catch (e: any) {
      console.error("Verification Failed", e);
      let errorMsg = e.message || "Verification failed. Please try again.";
      
      if (e.message?.includes("rejected") || e.code === 4001) {
        errorMsg = "Verification cancelled. Please ensure you approve the network switch and signature request in your wallet.";
      }
      
      setVerificationError(errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-alphabag-black/90 animate-fade-in">
      <div className="bg-alphabag-dark border border-alphabag-gray w-full max-w-md rounded-lg overflow-hidden relative border-t-alphabag-yellow/50">
        <div className="p-6 text-center">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-alphabag-yellow text-alphabag-black flex items-center justify-center rounded-md">
                <Crown size={22} fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase leading-none text-left">
                Alpha<span className="text-alphabag-yellow">BAG</span> <span className="block text-[11px] text-alphabag-subtext tracking-wider mt-1 font-semibold">Genesis Node Upgrade</span>
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-alphabag-subtext hover:text-white transition-colors bg-alphabag-black/50 rounded-md">
              <X size={20} />
            </button>
          </div>

          <div className="mb-4 bg-alphabag-black/40 border border-alphabag-gray/50 rounded-md p-4 relative group overflow-hidden">
            <div className="relative mb-2">
              <ShieldCheck size={44} className="mx-auto text-alphabag-yellow" />
            </div>
            <p className="text-sm text-alphabag-text font-bold leading-relaxed mb-1 uppercase tracking-wider">
              Unlock Premium Intelligence
            </p>
            <p className="text-[11px] text-alphabag-subtext font-medium leading-relaxed px-4">
              Verify eligibility to unlock deeper analytics, priority alerts, and unlimited AlphaAI access.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              'Unlimited AI',
              'Priority alerts',
              'Deeper analytics'
            ].map((item) => (
              <div key={item} className="rounded-md border border-alphabag-gray/50 bg-alphabag-black/50 px-2 py-2.5 text-center">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext">{item}</div>
              </div>
            ))}
          </div>

          {verificationError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2 text-left">
              <AlertTriangle className="text-red-500 shrink-0" size={18} />
              <p className="text-xs text-red-400 font-bold">{verificationError}</p>
            </div>
          )}

          {!isConnected ? (
            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-between p-4 bg-alphabag-black border border-alphabag-gray hover:border-alphabag-yellow hover:bg-alphabag-yellow/5 rounded-md transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-md group-hover:scale-105 transition-all">
                  <Smartphone size={20} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-white text-base uppercase tracking-tight">Connect Wallet</div>
                  <div className="text-[11px] text-alphabag-subtext font-medium uppercase tracking-wider">Connect to BSC to Verify</div>
                </div>
              </div>
              <ArrowRight size={18} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-alphabag-black rounded-md border border-alphabag-gray">
                <p className="text-[11px] text-alphabag-subtext font-semibold uppercase mb-1">Authenticated Wallet</p>
                <p className="text-white font-mono text-xs">{address?.substring(0, 10)}...{address?.substring(address.length - 8)}</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${chain?.id === bsc.id ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-[11px] text-alphabag-subtext font-semibold uppercase">{chain?.name || 'Unknown Network'}</span>
                </div>
              </div>

              <Button
                onClick={handleVerify}
                isLoading={isVerifying}
                className="w-full py-3.5 text-xs font-bold tracking-wider uppercase"
              >
                {isVerifying ? 'Scanning Holdings...' : 'Initiate Verification'}
              </Button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-alphabag-gray/50"></span></div>
                <div className="relative flex justify-center text-[11px] uppercase font-semibold tracking-wider"><span className="bg-alphabag-dark px-4 text-alphabag-subtext">Need Tokens?</span></div>
              </div>

              <a
                href="https://pancakeswap.finance/swap"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center py-2.5 bg-alphabag-black border border-alphabag-yellow/30 text-alphabag-yellow font-bold uppercase tracking-wider rounded-md hover:bg-alphabag-yellow/10 transition-all text-xs"
              >
                Secure Initial Allocation (DEX)
              </a>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center space-x-2 grayscale opacity-40">
            <div className="flex items-center space-x-2 text-white">
              <Zap size={14} fill="currentColor" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Read-Only Verification — No Funds Moved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
