import { useWeb3Modal } from '@web3modal/wagmi/react';
import React,{ createContext,useCallback,useContext,useEffect,useState } from 'react';
import { useAccount,useDisconnect } from 'wagmi';
import { ChainService } from '../services/ChainService';
import { MarketService } from '../services/MarketService';
import { CHAIN_SYMBOL_TO_COINGECKO_ID,TIER_LIMITS,TOKEN_GATING_CONFIG } from '../services/config';
import { Chain,PortfolioItem,WalletEntry } from '../types';
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
  const { user } = useAuth();

  const isWeb3ModalReady = typeof window !== 'undefined' && Boolean((window as any).__W3M__);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingBalance] = useState(false);
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

  // Single source of truth: AuthContext.user.tier, set only by the backend
  // after real verification. Previously this derived from a second,
  // independent `isPremium` flag that only got set by an on-chain balance
  // check tied to wagmi wallet connection — so a user could be ULTIMATE in
  // AuthContext (features unlocked) while still being capped at FREE wallet
  // limits here, or vice versa. Fall back to the local on-chain check only
  // while `user` hasn't loaded yet (e.g. brief moment during initial auth).
  const tier = (user?.tier === 'ULTIMATE' || isPremium) ? 'PREMIUM' : 'FREE';

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
  const checkTokenBalance = useCallback(() => {
    if (!TOKEN_GATING_CONFIG.ENABLE_TOKEN_GATING) {
      // Do not auto-grant premium if token gating is off; reflect authentic tier status
      setIsPremium(user?.tier === 'ULTIMATE' || user?.isPro || false);
      setPremiumTokenBalance(0);
      return;
    }

    // Tier entitlement is issued only by the backend after it verifies the
    // wallet bound to the signed session. Do not grant or revoke access from
    // an independently computed browser balance.
    setIsPremium(user?.tier === 'ULTIMATE' || user?.isPro || false);
    setPremiumTokenBalance(0);
    setTokenCheckError(null);
  }, [user?.tier, user?.isPro]);

  // Auto-Upgrade Logic - Check token balance on wallet connect
  useEffect(() => {
    if (wagmiAddress && wagmiIsConnected) {
      checkTokenBalance();
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

      // Resolve real prices for wallet-synced rows in one batched call
      // instead of fabricating them. ChainService currently returns one
      // row per chain (its native gas token) with price/value hardcoded to
      // 0 — see the TODO in ChainService.ts. This fills in a real price for
      // the native tokens we can map; it does NOT invent a number when we
      // can't resolve one.
      const distinctSymbols = Array.from(new Set(items.map(t => (t.symbol || '').toUpperCase())));
      const coingeckoIds = distinctSymbols
        .map(sym => CHAIN_SYMBOL_TO_COINGECKO_ID[sym])
        .filter(Boolean);
      let livePriceBySymbol: Record<string, { price: number; change24h: number }> = {};
      if (coingeckoIds.length > 0) {
        try {
          const priceData = await MarketService.getPrice(Array.from(new Set(coingeckoIds)));
          if (priceData) {
            distinctSymbols.forEach(sym => {
              const id = CHAIN_SYMBOL_TO_COINGECKO_ID[sym];
              if (id && priceData[id]) {
                livePriceBySymbol[sym] = {
                  price: Number(priceData[id].usd || 0),
                  change24h: Number(priceData[id].usd_24h_change || 0),
                };
              }
            });
          }
        } catch (priceErr) {
          console.warn('[WalletContext] Price lookup failed, values will show as unpriced:', priceErr);
        }
      }

      items.forEach(token => {
        try {
          const symbol = token.symbol?.toUpperCase() || 'UNKNOWN';
          // ChainService returns guiBalance already calculated
          const amount = Number(token.guiBalance || 0);
          const resolvedPrice = livePriceBySymbol[symbol];
          const currentPrice = Number(token.price || resolvedPrice?.price || 0);
          const priceChange24h = Number(resolvedPrice?.change24h || 0);
          const value = Number(token.value || (amount * currentPrice));

          // We have no historical cost-basis data for wallet-synced tokens
          // (the balance API only reports current holdings, not purchase
          // history). Do NOT fabricate a P&L here — show it as unknown and
          // let the UI prompt the user to log a manual transaction if they
          // want a real gain/loss figure for this asset.
          const pnl = 0;
          const pnlPercent = 0;

          if (aggregated.has(symbol)) {
            const existing = aggregated.get(symbol)!;
            aggregated.set(symbol, {
              ...existing,
              amount: existing.amount + amount,
              value: existing.value + value,
            });
          } else {
            aggregated.set(symbol, {
              coinId: token.tokenAddress || symbol,
              symbol: symbol,
              name: token.name || symbol,
              image: token.logo || `https://ui-avatars.com/api/?name=${symbol}&background=random`,
              amount: amount,
              avgBuyPrice: currentPrice,
              currentPrice: currentPrice,
              priceChange24h: priceChange24h,
              value: value,
              pnl: pnl,
              pnlPercent: pnlPercent,
              costBasisKnown: false,
              isMockData: !!token.isMockData,
            });
          }
        } catch (tokenErr: any) {
          console.warn('[WalletContext] Error processing token:', tokenErr?.message);
          // Skip this token and continue
        }
      });

      // Merge manual transactions — these DO have a real, user-entered buy
      // price, so this is the only place a P&L figure is legitimate.
      manualTransactions.forEach(tx => {
        try {
          const symbol = tx.symbol?.toUpperCase() || 'UNKNOWN';
          const amount = Number(tx.amount) || 0;
          const buyPrice = Number(tx.buyPrice) || 0;
          // If the user also logged a current market price, use it for a
          // real unrealized P&L; otherwise fall back to the buy price
          // (shows 0% change rather than a fabricated one).
          const currentPrice = Number(tx.currentPrice) || buyPrice;
          const value = amount * currentPrice;
          const cost = amount * buyPrice;
          const pnl = value - cost;
          const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

          if (amount > 0) {
            if (aggregated.has(symbol)) {
              const existing = aggregated.get(symbol)!;
              const combinedAmount = existing.amount + amount;
              const combinedCost = (existing.amount * existing.avgBuyPrice) + cost;
              aggregated.set(symbol, {
                ...existing,
                amount: combinedAmount,
                value: existing.value + value,
                avgBuyPrice: combinedAmount > 0 ? combinedCost / combinedAmount : existing.avgBuyPrice,
                pnl: existing.pnl + pnl,
                pnlPercent: combinedCost > 0 ? ((existing.pnl + pnl) / combinedCost) * 100 : 0,
                costBasisKnown: true,
              });
            } else {
              aggregated.set(symbol, {
                coinId: `manual-${symbol}`,
                symbol: symbol,
                name: tx.coin || symbol,
                image: `https://ui-avatars.com/api/?name=${symbol}&background=random`,
                amount: amount,
                avgBuyPrice: buyPrice,
                currentPrice: currentPrice,
                priceChange24h: 0,
                value: value,
                pnl: pnl,
                pnlPercent: pnlPercent,
                costBasisKnown: true,
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

  // Priority: an actually-connected wallet or a manually-entered watch
  // address always wins over the account's verifiedWallet, and user?.id
  // must NEVER be used as a fallback here — it's a database identifier,
  // not a wallet address, and passing it into chain-balance lookups would
  // silently produce garbage results.
  const activeAddress = wagmiAddress || manualAddress || user?.verifiedWallet || undefined;

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