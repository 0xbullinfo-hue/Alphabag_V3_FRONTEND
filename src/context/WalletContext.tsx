import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { ChainService } from '../services/ChainService';
import { TokenBalanceService } from '../services/TokenBalanceService';
import { TOKEN_GATING_CONFIG, BLOCKCHAIN_CONFIG, TIER_LIMITS } from '../services/config';
import { WalletEntry, PortfolioItem, Chain } from '../types';
import { useAuth } from './AuthContext';

export interface Toast {
  id: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
}

interface WalletContextType {
  isConnected: boolean;
  isSyncing: boolean;
  address?: string;
  isConnecting: boolean;
  isPremium: boolean;
  isCheckingBalance: boolean;
  tokenCheckError: string | null;
  connectionType: 'MANUAL' | 'WALLET';
  premiumTokenBalance: number;
  trackedWallets: WalletEntry[];
  portfolioItems: PortfolioItem[];
  whaleAlerts: string[];
  toasts: Toast[];
  tier: 'FREE' | 'PREMIUM';

  connectWallet: () => void;
  connectManually: (address: string) => void;
  disconnectWallet: () => Promise<void>;
  addTrackedWallet: (address: string, label: string, chain: Chain, type: 'PORTFOLIO' | 'WHALE') => Promise<{ success: boolean; error?: string }>;
  removeTrackedWallet: (id: string) => void;
  getLimits: () => { maxPortfolios: number; maxWhales: number };
  refreshBalances: () => Promise<void>;
  addToast: (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  removeToast: (id: string) => void;
  toggleWhaleAlert: (address: string) => void;
  hideSmallBalances: boolean;
  toggleHideSmallBalances: () => void;
  addManualTransaction: (data: any) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { open } = useWeb3Modal();
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { user, upgradeToUltimate } = useAuth();

  const isWeb3ModalReady = typeof window !== 'undefined' && Boolean((window as any).__W3M__);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [tokenCheckError, setTokenCheckError] = useState<string | null>(null);
  const [premiumTokenBalance, setPremiumTokenBalance] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [trackedWallets, setTrackedWallets] = useState<WalletEntry[]>(() => {
    const saved = localStorage.getItem('alphabag_tracked_wallets');
    return saved ? JSON.parse(saved) : [];
  });
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [whaleAlerts, setWhaleAlerts] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [manualTransactions, setManualTransactions] = useState<any[]>(() => {
    const saved = localStorage.getItem('alphabag_manual_holdings');
    return saved ? JSON.parse(saved) : [];
  });

  const tier = isPremium ? 'PREMIUM' : 'FREE';

  useEffect(() => {
    localStorage.setItem('alphabag_tracked_wallets', JSON.stringify(trackedWallets));
  }, [trackedWallets]);

  useEffect(() => {
    localStorage.setItem('alphabag_manual_holdings', JSON.stringify(manualTransactions));
  }, [manualTransactions]);

  const [hideSmallBalances, setHideSmallBalances] = useState(() => {
    const saved = localStorage.getItem('alphabag_hide_small_balances');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('alphabag_hide_small_balances', JSON.stringify(hideSmallBalances));
  }, [hideSmallBalances]);

  const toggleHideSmallBalances = () => setHideSmallBalances((prev: boolean) => !prev);

  // ===== TOKEN BALANCE CHECKING =====
  const checkTokenBalance = useCallback(async (address: string) => {
    if (!TOKEN_GATING_CONFIG.ENABLE_TOKEN_GATING) {
      setIsPremium(true);
      setPremiumTokenBalance(0);
      return;
    }

    setIsCheckingBalance(true);
    setTokenCheckError(null);

    try {
      const balance = await TokenBalanceService.checkTokenBalance(address);
      setPremiumTokenBalance(balance);

      const qualified = TokenBalanceService.isQualifiedForPremium(balance);
      setIsPremium(qualified);

      if (qualified && user?.tier !== 'ULTIMATE') {
        await upgradeToUltimate(address);
      }
    } catch (error) {
      console.error('Token balance check failed:', error);
      setTokenCheckError(error instanceof Error ? error.message : 'Failed to check token balance');
      setIsPremium(false);
      setPremiumTokenBalance(0);
    } finally {
      setIsCheckingBalance(false);
    }
  }, [user?.tier, upgradeToUltimate]);

  // Auto-Upgrade Logic - Check token balance on wallet connect
  useEffect(() => {
    if (wagmiAddress && wagmiIsConnected) {
      checkTokenBalance(wagmiAddress);
    }
  }, [wagmiAddress, wagmiIsConnected, checkTokenBalance]);

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

  const addManualTransaction = useCallback((data: any) => {
    setManualTransactions(prev => [...prev, { ...data, id: Math.random().toString(36).substring(2, 9) }]);
    addToast("Manual transaction added.", "SUCCESS");
  }, [addToast]);

  const refreshBalances = useCallback(async () => {
    if (!user || trackedWallets.length === 0) {
      setPortfolioItems([]);
      return;
    }

    setIsSyncing(true);
    try {
      const portfolioWallets = trackedWallets.filter(w => w.type === 'PORTFOLIO');
      if (portfolioWallets.length === 0) {
        setPortfolioItems([]);
        setIsSyncing(false);
        return;
      }

      // Fetch balances for all wallets with error boundary per wallet
      const allResults = await Promise.allSettled(
        portfolioWallets.map(async (node) => {
          try {
            console.log(`[WalletContext] Fetching balances for wallet: ${node.address.substring(0, 10)}...`);
            // Use Multi-Chain Fetching
            // This will scan specific EVM chains (ETH, BSC, POLY, ARB, AVAX, BASE) + Solana if applicable
            const tokens = await ChainService.getMultiChainBalances(node.address);
            console.log(`[WalletContext] Fetched ${tokens.length} tokens for wallet ${node.address.substring(0, 10)}...`);
            return tokens;
          } catch (walletErr: any) {
            console.error(`[WalletContext] Error fetching for wallet ${node.address}:`, walletErr?.message);
            return []; // Return empty array for this wallet on error
          }
        })
      );

      // Handle allSettled results
      const items = allResults
        .map(result => {
          if (result.status === 'fulfilled') {
            return result.value || [];
          } else {
            console.error('[WalletContext] Balance fetch promise rejected:', result.reason);
            return [];
          }
        })
        .flat();

      const aggregated = new Map<string, PortfolioItem>();

      items.forEach(token => {
        try {
          const symbol = token.symbol?.toUpperCase() || 'UNKNOWN';
          // ChainService returns guiBalance already calculated
          const amount = Number(token.guiBalance || 0);
          const currentPrice = Number(token.price || 0);
          const value = Number(token.value || (amount * currentPrice));

          // Mocking PnL for now as balance API doesn't give historical cost basis without complex accounting
          const pnlPercent = (Math.random() * 20) - 5; // Placeholder PnL
          const pnl = value * (pnlPercent / 100);

          if (aggregated.has(symbol)) {
            const existing = aggregated.get(symbol)!;
            aggregated.set(symbol, {
              ...existing,
              amount: existing.amount + amount,
              value: existing.value + value,
              pnl: existing.pnl + pnl,
              pnlPercent: (existing.pnlPercent + pnlPercent) / 2
            });
          } else {
            aggregated.set(symbol, {
              coinId: token.tokenAddress || symbol,
              symbol: symbol,
              name: token.name || symbol,
              image: token.logo || `https://ui-avatars.com/api/?name=${symbol}&background=random`,
              amount: amount,
              avgBuyPrice: currentPrice * 0.9, // Mocking avg buy
              currentPrice: currentPrice,
              priceChange24h: 0, // Need to fetch from MarketService ideally
              value: value,
              pnl: pnl,
              pnlPercent: pnlPercent
            });
          }
        } catch (tokenErr: any) {
          console.warn('[WalletContext] Error processing token:', tokenErr?.message);
          // Skip this token and continue
        }
      });

      // Merge manual transactions
      manualTransactions.forEach(tx => {
        try {
          const symbol = tx.symbol?.toUpperCase() || 'UNKNOWN';
          const amount = Number(tx.amount) || 0;
          const price = Number(tx.buyPrice) || 0;
          const value = amount * price;

          if (amount > 0) {
            if (aggregated.has(symbol)) {
              const existing = aggregated.get(symbol)!;
              aggregated.set(symbol, {
                ...existing,
                amount: existing.amount + amount,
                value: existing.value + value
              });
            } else {
              aggregated.set(symbol, {
                coinId: `manual-${symbol}`,
                symbol: symbol,
                name: tx.coin || symbol,
                image: `https://ui-avatars.com/api/?name=${symbol}&background=random`,
                amount: amount,
                avgBuyPrice: price,
                currentPrice: price,
                priceChange24h: 0,
                value: value,
                pnl: 0,
                pnlPercent: 0
              });
            }
          }
        } catch (manualTxErr: any) {
          console.warn('[WalletContext] Error processing manual transaction:', manualTxErr?.message);
        }
      });

      setPortfolioItems(Array.from(aggregated.values()));

      // Use configured BAG token address when available to avoid false positives.
      const configuredBagAddress =
        TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_MAINNET ||
        TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_TESTNET;

      const bagToken = configuredBagAddress
        ? Array.from(aggregated.values()).find(i => {
            const coinIdStr = String(i.coinId || '');
            return coinIdStr.toLowerCase() === configuredBagAddress.toLowerCase();
          })
        : Array.from(aggregated.values()).find(i => i.symbol === 'BAG');

      const bagBalance = bagToken ? bagToken.amount : 0;
      setPremiumTokenBalance(bagBalance);

      // Auto-Upgrade Trigger (Disabled for Beta)
      console.log('[WalletContext] Portfolio refresh completed successfully');

    } catch (e: any) {
      console.error('[WalletContext] Unexpected error in refreshBalances:', e?.message);
      addToast("Multi-chain network synchronization interrupted.", "ERROR");
    } finally {
      setIsSyncing(false);
    }
  }, [user, trackedWallets, manualTransactions, addToast]);

  useEffect(() => {
    if (user) {
      refreshBalances();
      const interval = setInterval(refreshBalances, 120000); // 120s Auto-Refresh for DEX
      return () => clearInterval(interval);
    }
  }, [user, trackedWallets.length, refreshBalances]);

  const addTrackedWallet = async (address: string, label: string, chain: Chain, type: 'PORTFOLIO' | 'WHALE'): Promise<{ success: boolean; error?: string }> => {
    const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.FREE;
    const currentCount = trackedWallets.filter(w => w.type === type).length;
    const max = type === 'PORTFOLIO' ? limits.maxPortfolios : limits.maxWhales;

    if (currentCount >= max) {
      return {
        success: false,
        error: `${tier} Tier limit reached (Max ${max}). Upgrade to ULTIMATE for unlimited tracking.`
      };
    }

    setTrackedWallets(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), address, label, chain, type }]);
    addToast("New wallet registered", "SUCCESS");

    // Automatic refresh after adding
    setTimeout(refreshBalances, 500);

    return { success: true };
  };

  const [manualAddress, setManualAddress] = useState<string | null>(null);

  const connectManually = (addr: string) => {
    setManualAddress(addr);
    // Trigger auth update if needed, or just let local state handle it for now
    // For MVP, we might need to mock the user for manual connection if AuthContext doesn't handle it
  };

  const activeAddress = (user?.verifiedWallet || user?.id) || wagmiAddress || manualAddress || undefined;

  return (
    <WalletContext.Provider value={{
      isConnected: wagmiIsConnected || !!manualAddress,
      isSyncing,
      address: activeAddress,
      isConnecting: false,
      isPremium,
      isCheckingBalance,
      tokenCheckError,
      connectionType: wagmiIsConnected ? 'WALLET' : 'MANUAL',
      premiumTokenBalance,
      trackedWallets,
      portfolioItems,
      whaleAlerts,
      toasts,
      tier,
      connectWallet: () => {
        if (isWeb3ModalReady) {
          open();
        } else {
          console.warn('[WalletContext] Web3Modal not ready yet; skipping wallet connect.');
        }
      },
      connectManually,
      disconnectWallet: async () => {
        if (manualAddress) {
          setManualAddress(null);
        } else {
          disconnect();
        }
      },
      addTrackedWallet,
      removeTrackedWallet: (id) => setTrackedWallets(p => p.filter(w => w.id !== id)),
      getLimits: () => TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.FREE,
      refreshBalances,
      addToast,
      removeToast,
      toggleWhaleAlert,
      hideSmallBalances,
      toggleHideSmallBalances,
      addManualTransaction
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