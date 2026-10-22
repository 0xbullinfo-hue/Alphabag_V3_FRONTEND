import { useWeb3Modal } from '@web3modal/wagmi/react';
import {
  CheckCircle2,
  Loader,
  Shield,
  Wallet,
  X,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAccount, useNetwork, useSignMessage } from 'wagmi';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { createSiweMessage } from '../../utils/siwe';
import { parseWalletError } from '../../utils/walletErrors';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { open } = useWeb3Modal();
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { chain } = useNetwork();
  const { signMessageAsync } = useSignMessage();
  const { siweLogin, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'CONNECT' | 'SIGN' | 'SUCCESS'>('CONNECT');
  
  const address = wagmiAddress;
  const isConnected = wagmiIsConnected;

  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      setStep('SIGN');
    } else if (!isConnected) {
      setStep('CONNECT');
    }
  }, [isConnected, address, isAuthenticated]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError('');
      await open();
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setError('Connection failed');
    }
  };

  const handleSiwe = async () => {
    if (!address) return;
    setLoading(true);
    setError('');
    try {
      const nonceResponse = await api.get(`/api/auth/nonce?wallet=${encodeURIComponent(address)}`);
      const nonce = nonceResponse.data?.nonce;
      if (!nonce) throw new Error('Could not initialize secure sign-in. Please try again.');

      const issuedAt = new Date().toISOString();
      const domain = window.location.host;
      const message = createSiweMessage({
        domain,
        address,
        statement: 'Sign in to AlphaBAG Protocol Hub.',
        uri: window.location.origin,
        version: '1',
        chainId: chain?.id || 1,
        nonce,
        issuedAt
      });
      
      const signature = await signMessageAsync({ message });

      const success = await siweLogin(address, signature, message);
      if (success) {
        setStep('SUCCESS');
        onClose();
      } else {
        setError('Verification Failed');
      }
    } catch (e: any) {
      const parsed = parseWalletError(e);
      const errorMsg = e.response?.data?.error || parsed.message;
      setError(errorMsg);
      console.error("[SIWE Error]", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-alphabag-black/90 transition-opacity">
      <div className="bg-alphabag-dark border border-white/10 w-full max-w-sm rounded-lg overflow-hidden relative group">
        <div className="p-5 relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="AlphaBAG Logo" className="w-9 h-9 object-contain rounded-full" />
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase leading-none">
                  Alpha<span className="text-alphabag-yellow">BAG</span>
                </h2>
                <span className="block text-[11px] text-alphabag-subtext tracking-wider mt-1 font-semibold uppercase opacity-75">Web3 Authentication</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-alphabag-subtext hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-md"
            >
              <X size={18} />
            </button>
          </div>

          <div className="text-center mb-3 space-y-1">
            <p className="text-sm text-white font-bold uppercase tracking-tight">
              {step === 'CONNECT' && 'Establish Connection'}
              {step === 'SIGN' && 'Verify Identity'}
              {step === 'SUCCESS' && 'Access Granted'}
            </p>
            <p className="text-[11px] text-alphabag-subtext font-medium leading-relaxed">
              {step === 'CONNECT' && 'Sync your professional wallet to interface with the AlphaBAG terminal.'}
              {step === 'SIGN' && 'Provide a secure signature to initialize your member profile.'}
              {step === 'SUCCESS' && 'Initialization complete. Redirecting...'}
            </p>
          </div>

          <div className="space-y-3">
            {error && (
              <div className="text-red-400 text-[11px] text-center font-semibold uppercase tracking-wider bg-red-500/10 border border-red-500/20 p-2.5 rounded-md transition-opacity">
                Error: {error}
              </div>
            )}

            {step === 'CONNECT' && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    'Read-only access',
                    'Secure signature',
                    'Instant onboarding'
                  ].map((item) => (
                    <div key={item} className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-center">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext">{item}</div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleConnect}
                  className="w-full h-11 text-[11px] font-bold tracking-wider shadow-md uppercase flex items-center justify-center gap-2 bg-alphabag-yellow hover:bg-yellow-400 text-black rounded-md transition-all"
                  disabled={loading}
                >
                  {loading ? <Loader className="animate-spin" size={16} /> : <><Wallet size={16} strokeWidth={2.5} /> Connect Wallet</>}
                </Button>
              </>
            )}

            {step === 'SIGN' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-md mb-1">
                  <div className="w-7 h-7 bg-alphabag-blue/20 rounded flex items-center justify-center text-alphabag-blue">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider">Connected Terminal</div>
                    <div className="text-[11px] text-white font-mono font-semibold tracking-tight">{address}</div>
                  </div>
                </div>
                <Button
                  onClick={handleSiwe}
                  className="w-full h-11 text-[11px] font-bold tracking-wider shadow-md uppercase flex items-center justify-center gap-2 bg-white text-black hover:bg-alphabag-blue hover:text-white rounded-md transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="animate-spin" size={16} />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <><Shield size={16} strokeWidth={2.5} /> Sign & Initialize</>
                  )}
                </Button>
              </div>
            )}

            {step === 'SUCCESS' && (
              <div className="flex flex-col items-center justify-center py-3 space-y-2 transition-opacity">
                <div className="w-16 h-16 bg-alphabag-green/20 rounded-full flex items-center justify-center text-alphabag-green">
                  <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
                <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-alphabag-green animate-progress" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 opacity-50">
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-alphabag-subtext" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext">Secure Phase 1</span>
              </div>
              <div className="w-1 h-1 bg-alphabag-subtext rounded-full" />
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-alphabag-subtext" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext">EVM Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
