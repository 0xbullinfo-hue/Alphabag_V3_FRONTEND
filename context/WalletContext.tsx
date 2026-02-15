import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { fetchChainBalances, SUPPORTED_CHAINS, CovalentToken } from '../services/covalent.ts';
import { WalletEntry, PortfolioItem, Chain } from '../types.ts';
import { useAuth } from './AuthContext';

export interface Toast {
  id: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
}

interface WalletContextType {
  isConnected: boolean;
  isSyncing: boolean;
  premiumTokenBalance: number;
  trackedWallets: WalletEntry[];
  portfolioItems: PortfolioItem[];
  whaleAlerts: string[];
  toasts: Toast[];
  tier: string;

  connectWallet: () => void;
  disconnectWallet: () => Promise<void>;
  addTrackedWallet: (address: string, label: string, chain: Chain, type: 'PORTFOLIO' | 'WHALE') => Promise<{ success: boolean; error?: string }>;
  removeTrackedWallet: (id: string) => void;
  getLimits: () => { maxPortfolios: number; maxWhales: number };
  refreshBalances: () => Promise<void>;
  addToast: (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  removeToast: (id: string) => void;
  toggleWhaleAlert: (address: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected: wagmiIsConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { user } = useAuth();

  const [isSyncing, setIsSyncing] = useState(false);
  const [premiumTokenBalance, setPremiumTokenBalance] = useState(0);
  const [trackedWallets, setTrackedWallets] = useState<WalletEntry[]>(() => {
    const saved = localStorage.getItem('alphabag_tracked_wallets');
    return saved ? JSON.parse(saved) : [];
  });
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [whaleAlerts, setWhaleAlerts] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const tier = user?.tier || 'FREE';

  const LIMITS = {
    FREE: { maxPortfolios: 5, maxWhales: 5 },
    ULTIMATE: { maxPortfolios: 1000, maxWhales: 1000 }
  };

  useEffect(() => {
    localStorage.setItem('alphabag_tracked_wallets', JSON.stringify(trackedWallets));
  }, [trackedWallets]);

  const addToast = useCallback((message: string, type: 'SUCCESS' | 'ERROR' | 'INFO' = 'SUCCESS') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleWhaleAlert = (address: string) => {
    setWhaleAlerts(prev => prev.includes(address) ? prev.filter(a => a !== address) : [...prev, address]);
  };

  const refreshBalances = useCallback(async () => {
    if (!user || trackedWallets.length === 0) {
      setPortfolioItems([]);
      return;
    }

    setIsSyncing(true);
    try {
      const portfolioNodes = trackedWallets.filter(w => w.type === 'PORTFOLIO');
      if (portfolioNodes.length === 0) {
        setPortfolioItems([]);
        return;
      }

      const allResults = await Promise.all(
        portfolioNodes.map(async (node) => {
          // If node has a specific chain, use it. Otherwise default to ETH (backward compatibility)
          // We map the internal Chain type to Covalent's chain string
          const chainMap: Record<string, string> = {
            'BSC': 'bsc-mainnet',
            'ETH': 'eth-mainnet',
            'SOL': 'solana-mainnet',
            'BASE': 'base-mainnet',
            'AVAX': 'avalanche-mainnet',
            'ARB': 'arbitrum-mainnet'
          };

          const chainId = chainMap[node.chain] || 'eth-mainnet';
          return fetchChainBalances(chainId, node.address);
        })
      );

      const items = allResults.flat() as CovalentToken[];
      const aggregated = new Map<string, PortfolioItem>();

      items.forEach(token => {
        const symbol = token.contract_ticker_symbol?.toUpperCase() || 'UNKNOWN';
        const balance = Number(token.balance) / Math.pow(10, token.contract_decimals);
        const value = token.quote || 0;
        const pnl = token.quote_24h ? (token.quote - token.quote_24h) : 0;
        const pnlPercent = token.quote_24h ? ((token.quote - token.quote_24h) / token.quote_24h) * 100 : 0;

        if (aggregated.has(symbol)) {
          const existing = aggregated.get(symbol)!;
          aggregated.set(symbol, {
            ...existing,
            amount: existing.amount + balance,
            value: existing.value + value,
            pnl: existing.pnl + pnl,
            pnlPercent: (existing.pnlPercent + pnlPercent) / 2
          });
        } else {
          aggregated.set(symbol, {
            coinId: token.contract_address,
            symbol: symbol,
            name: token.contract_name || symbol,
            image: token.logo_url || `https://ui-avatars.com/api/?name=${symbol}&background=random`,
            amount: balance,
            avgBuyPrice: token.quote_rate,
            currentPrice: token.quote_rate,
            priceChange24h: pnlPercent,
            value: value,
            pnl: pnl,
            pnlPercent: pnlPercent
          });
        }
      });

      setPortfolioItems(Array.from(aggregated.values()));
    } catch (e) {
      addToast("Multi-chain node synchronization interrupted.", "ERROR");
    } finally {
      setIsSyncing(false);
    }
  }, [user, trackedWallets, addToast]);

  useEffect(() => {
    if (user) refreshBalances();
  }, [user, trackedWallets.length, refreshBalances]);

  const addTrackedWallet = async (address: string, label: string, chain: Chain, type: 'PORTFOLIO' | 'WHALE'): Promise<{ success: boolean; error?: string }> => {
    const limits = LIMITS[tier as keyof typeof LIMITS] || LIMITS.FREE;
    const currentCount = trackedWallets.filter(w => w.type === type).length;
    const max = type === 'PORTFOLIO' ? limits.maxPortfolios : limits.maxWhales;

    if (currentCount >= max) {
      return {
        success: false,
        error: `${tier} Tier limit reached (Max ${max}). Upgrade to ULTIMATE for unlimited tracking.`
      };
    }

    setTrackedWallets(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), address, label, chain, type }]);
    addToast("New node registered", "SUCCESS");

    // Automatic refresh after adding
    setTimeout(refreshBalances, 500);

    return { success: true };
  };

  return (
    <WalletContext.Provider value={{
      isConnected: wagmiIsConnected, isSyncing, premiumTokenBalance, trackedWallets, portfolioItems, whaleAlerts, toasts, tier,
      connectWallet: () => window.dispatchEvent(new CustomEvent('open-upgrade-modal')),
      disconnectWallet: async () => { disconnect(); },
      addTrackedWallet, removeTrackedWallet: (id) => setTrackedWallets(p => p.filter(w => w.id !== id)),
      getLimits: () => LIMITS[tier as keyof typeof LIMITS] || LIMITS.FREE,
      refreshBalances, addToast, removeToast, toggleWhaleAlert
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};