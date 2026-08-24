# ALPHABAG V3 FRONTEND — COMPLETE SECURITY & ARCHITECTURE PATCH
# Generated: 2026-08-19
# Scope: Frontend-only fixes. Backend endpoints specified but must be implemented separately.
# Target: LLM Agent (Claude / Cursor / Windsurf)
# ====================================================================================

# ====================================================================================
# SECTION 0: EXECUTION CHECKLIST
# ====================================================================================

STEP 1: npm install @tanstack/react-query@^5 @tanstack/react-query-devtools@^5
STEP 2: Apply all file modifications below (replace entire files where indicated)
STEP 3: Remove VITE_COVALENT_API_KEY from .env and .env.local
STEP 4: npm run build (verify no TypeScript errors)
STEP 5: Deploy backend endpoints (Section 10) before frontend goes live

# ====================================================================================
# SECTION 1: API CLIENT RESILIENCE
# File: src/services/api.ts — REPLACE ENTIRE FILE
# ====================================================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface RetryConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: RetryConfig) => {
    const token = sessionStorage.getItem('alphabag_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    config.headers['X-Request-ID'] = crypto.randomUUID();
    config.headers['X-Client-Timestamp'] = Date.now().toString();
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config) return Promise.reject(error);

    const isRetryable = !error.response || [502, 503, 504].includes(error.response.status);
    config.retryCount = config.retryCount || 0;

    if (isRetryable && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      const delay = Math.pow(2, config.retryCount) * RETRY_DELAY_MS;
      console.warn(`[API] Retry ${config.retryCount}/${MAX_RETRIES} for ${config.url} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }

    if (error.response?.status === 401) {
      sessionStorage.removeItem('alphabag_token');
      sessionStorage.removeItem('alphabag_user');
      window.dispatchEvent(new CustomEvent('auth:expired'));
      if (window.location.hash !== '#/' && window.location.hash !== '#/airdrop') {
        window.location.hash = '#/';
      }
    }

    const structuredError = {
      ...error,
      isRetryable,
      retryCount: config.retryCount,
      requestId: config.headers?.['X-Request-ID'],
    };
    return Promise.reject(structuredError);
  }
);

export default api;

# ====================================================================================
# SECTION 2: REMOVE COVALENT API KEY FROM FRONTEND
# File: src/pages/frontend/SecurityScanner.tsx — REPLACE fetchApprovals METHOD ONLY
# Keep all other component code (getMockApprovals, WalletLabels_getFriendlyLabel, etc.)
# ====================================================================================

# INSIDE SecurityScanner component, REPLACE the fetchApprovals function with:

const fetchApprovals = async (targetAddress: string, chain: ScanChain) => {
  if (!targetAddress || !targetAddress.startsWith('0x')) {
    addToast("Please provide a valid EVM address.", "ERROR");
    return;
  }

  setLoading(true);
  setApprovals([]);

  try {
    const res = await api.get(`/api/security/approvals`, {
      params: { address: targetAddress, chain: chain.slug }
    });

    const rawItems = res.data?.items || [];

    const mapped: ApprovalItem[] = rawItems.map((item: any): ApprovalItem => {
      const balance = Number(item.balance || 0) / Math.pow(10, item.contract_decimals || 18);
      const price = item.quote_rate || 0;

      const spenders: SpenderAllowance[] = (item.allowances || []).map((allow: any): SpenderAllowance => {
        const allowanceValue = allow.allowance_amount || '0';
        const isInfinite = allowanceValue.length > 25 || allowanceValue.startsWith('1157920892');
        const valueAtRiskUsd = balance * price;

        let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (isInfinite) {
          const lowSpender = (allow.spender_address || '').toLowerCase();
          const isCommonProtocol = lowSpender.includes('router') || lowSpender.includes('uniswap') || lowSpender.includes('pancake');
          riskLevel = isCommonProtocol ? 'MEDIUM' : 'HIGH';
        } else if (valueAtRiskUsd > 100) {
          riskLevel = 'MEDIUM';
        }

        return {
          spenderAddress: allow.spender_address || '',
          spenderLabel: allow.spender_label || WalletLabels_getFriendlyLabel(allow.spender_address),
          allowanceValue: isInfinite ? 'Infinite' : (Number(allowanceValue) / Math.pow(10, item.contract_decimals || 18)).toLocaleString(),
          allowanceUsd: isInfinite ? Infinity : (Number(allowanceValue) / Math.pow(10, item.contract_decimals || 18)) * price,
          valueAtRiskUsd,
          riskLevel,
          txHash: allow.transaction_hash || ''
        };
      });

      return {
        tokenAddress: item.contract_address || '',
        tokenSymbol: item.contract_ticker_symbol || 'UNK',
        tokenName: item.contract_name || 'Unknown Token',
        tokenLogo: item.logo_url || 'https://ui-avatars.com/api/?name=' + (item.contract_ticker_symbol || 'UNK'),
        tokenBalance: balance,
        tokenPriceUsd: price,
        spenders
      };
    }).filter((item: ApprovalItem) => item.spenders.length > 0);

    setApprovals(mapped);
    if (mapped.length === 0) {
      addToast("No active token approvals found for this wallet.", "INFO");
    } else {
      addToast(`Found active approvals on ${chain.name}.`, "SUCCESS");
    }
  } catch (err: any) {
    console.error("[SecurityScanner] Approvals fetch failed:", err);
    addToast("Failed to retrieve approvals. Falling back to demo data.", "ERROR");
    setApprovals(getMockApprovals());
  } finally {
    setLoading(false);
  }
};

# ALSO REMOVE from top of file:
# const COVALENT_API_KEY = import.meta.env.VITE_COVALENT_API_KEY;

# ====================================================================================
# SECTION 3: PROTECT ALCHEMY RPC KEY (BACKEND PROXY OPTION)
# File: src/lib/wagmi.ts — REPLACE ENTIRE FILE
# ====================================================================================

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, bsc, polygon, arbitrum, base, avalanche } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
const isLocalhost = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const shouldEnableWalletConnect = !isLocalhost && Boolean(projectId);

const metadata = {
  name: 'AlphaBAG Pro',
  description: 'Professional Crypto Intelligence Hub & Portfolio Tracker',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://alphabag.pro',
  icons: ['https://s2.coinmarketcap.com/static/img/coins/64x64/1.png']
};

const apiBase = import.meta.env.VITE_API_BASE_URL || '';

const rpcUrls = {
  mainnet: `${apiBase}/api/rpc/mainnet`,
  bsc: `${apiBase}/api/rpc/bsc`,
  polygon: `${apiBase}/api/rpc/polygon`,
  arbitrum: `${apiBase}/api/rpc/arbitrum`,
  base: `${apiBase}/api/rpc/base`,
  avalanche: `${apiBase}/api/rpc/avalanche`,
};

const chains = [
  { ...mainnet, rpcUrls: { ...mainnet.rpcUrls, default: { http: [rpcUrls.mainnet] } } },
  { ...bsc, rpcUrls: { ...bsc.rpcUrls, default: { http: [rpcUrls.bsc] } } },
  { ...polygon, rpcUrls: { ...polygon.rpcUrls, default: { http: [rpcUrls.polygon] } } },
  { ...arbitrum, rpcUrls: { ...arbitrum.rpcUrls, default: { http: [rpcUrls.arbitrum] } } },
  { ...base, rpcUrls: { ...base.rpcUrls, default: { http: [rpcUrls.base] } } },
  { ...avalanche, rpcUrls: { ...avalanche.rpcUrls, default: { http: [rpcUrls.avalanche] } } }
];

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: shouldEnableWalletConnect,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: !isLocalhost
});

try {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    chains,
    enableAnalytics: false,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#FCD535',
      '--w3m-border-radius-master': '1px'
    }
  });
} catch (error) {
  console.warn('[Web3Modal] Initialization skipped:', error);
}

export { chains, projectId, shouldEnableWalletConnect };

# ====================================================================================
# SECTION 4: TANSTACK QUERY V5 SETUP
# File: src/lib/queryClient.ts — NEW FILE
# ====================================================================================

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

# ====================================================================================
# SECTION 5: APP.TSX PROVIDER UPDATE
# File: src/App.tsx — REPLACE IMPORTS AND PROVIDER SETUP ONLY
# Keep all routes, components, and logic.
# ====================================================================================

# REPLACE these imports:
# REMOVE: import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
# REMOVE: const queryClient = new QueryClient();

# ADD:
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

# In the JSX return of App(), inside <QueryClientProvider>, add as last child:
# {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}

# ====================================================================================
# SECTION 6: DEXBAG FULL REWRITE WITH TANSTACK QUERY
# File: src/pages/frontend/DexBag.tsx — REPLACE ENTIRE FILE
# ====================================================================================

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { TokenBalance } from '../../types';

const CHAIN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  eth: { label: 'ETH', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  bsc: { label: 'BSC', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  sol: { label: 'SOL', color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

const fetchDexBalances = async (address: string): Promise<TokenBalance[]> => {
  const res = await api.get(`/api/portfolio/balances?address=${address}`);
  const data = res.data?.tokens || res.data || [];
  return Array.isArray(data) ? data : [];
};

export const DexBag: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [filterChain, setFilterChain] = useState('ALL');

  const {
    data: balances = [],
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['portfolio', 'dex', address],
    queryFn: () => fetchDexBalances(address!),
    enabled: !!address && isConnected,
    staleTime: 60_000,
  });

  const totalUSD = balances.reduce((sum, t) => sum + (t.valueUSD || 0), 0);
  const filtered = filterChain === 'ALL'
    ? balances
    : balances.filter(t => t.chain === filterChain);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DEX Bag</h1>
          <p className="text-alphabag-subtext">On-chain token holdings — read only</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-4 py-2 bg-alphabag-yellow text-black rounded-lg font-medium hover:bg-alphabag-yellowHover transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      <div className="flex gap-2">
        {['ALL', 'ETH', 'BSC', 'SOL'].map((chain) => (
          <button
            key={chain}
            onClick={() => setFilterChain(chain)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterChain === chain
                ? 'bg-alphabag-yellow text-black'
                : 'bg-white/5 text-alphabag-subtext hover:bg-white/10'
            }`}
          >
            {chain}
          </button>
        ))}
      </div>

      {!isConnected && (
        <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Wallet Not Connected</h3>
          <p className="text-alphabag-subtext mb-4">Connect your EVM wallet to view your on-chain DEX holdings.</p>
        </div>
      )}

      {isConnected && error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          Unable to fetch on-chain balances. Check wallet connection.
        </div>
      )}

      {isConnected && !error && (
        <div className="p-6 bg-alphabag-dark border border-white/5 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-alphabag-subtext">Total DEX Value</p>
              <p className="text-2xl font-bold text-white">
                {isLoading ? '···' : `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-alphabag-subtext font-mono">
                {address ? `${address.slice(0, 6)}···${address.slice(-4)}` : ''}
              </p>
              <p className="text-xs text-alphabag-muted">
                {filtered.length} token{filtered.length !== 1 ? 's' : ''}
                {lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {isConnected && !error && (
        <div className="border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-alphabag-subtext">
              <tr>
                <th className="text-left p-4">Asset</th>
                <th className="text-left p-4">Chain</th>
                <th className="text-right p-4">Balance</th>
                <th className="text-right p-4">Price</th>
                <th className="text-right p-4">24h</th>
                <th className="text-right p-4">Value</th>
                <th className="text-right p-4">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="p-4"><div className="h-8 bg-white/5 rounded" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((token, i) => {
                  const chain = CHAIN_LABELS[token.chain] || {
                    label: token.chain?.toUpperCase() || '—',
                    color: 'text-alphabag-subtext',
                    bg: 'bg-white/5'
                  };
                  const isPositive = (token.change24h || 0) >= 0;

                  return (
                    <tr key={`${token.contractAddress}-${i}`} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {token.logo ? (
                            <img
                              src={token.logo}
                              alt={token.symbol}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                              {token.symbol?.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{token.symbol}</p>
                            <p className="text-xs text-alphabag-subtext">{token.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${chain.bg} ${chain.color}`}>
                          {chain.label}
                        </span>
                      </td>
                      <td className="p-4 text-right text-white">
                        {parseFloat(token.balance || '0').toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-alphabag-subtext">
                        ${(token.priceUSD || 0).toFixed(4)}
                      </td>
                      <td className="p-4 text-right">
                        <span className={isPositive ? 'text-alphabag-green' : 'text-alphabag-red'}>
                          {isPositive ? '+' : ''}{(token.change24h || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-white">
                        ${(token.valueUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right">
                        {token.contractAddress && (
                          <a
                            href={`https://bscscan.com/token/${token.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-alphabag-yellow hover:underline text-xs"
                          >
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-alphabag-subtext">
                    No DEX tokens found for this wallet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

# ====================================================================================
# SECTION 7: CEXBAG TANSTACK QUERY MIGRATION
# File: src/pages/frontend/CexBag.tsx — ADD HOOK, REPLACE DATA FETCHING
# Keep all JSX, only replace the useState/useEffect fetching logic.
# ====================================================================================

# ADD at top of file:
import { useQuery } from '@tanstack/react-query';

# ADD hook (can be extracted to src/hooks/useCexBalances.ts):
const useCexBalances = () => {
  return useQuery({
    queryKey: ['portfolio', 'cex'],
    queryFn: async () => {
      const res = await api.get('/api/cex/balances');
      return res.data;
    },
    staleTime: 60_000,
    enabled: true,
  });
};

# INSIDE CexBag component, REPLACE:
# const [balances, setBalances] = useState(...)
# const [loading, setLoading] = useState(...)
# useEffect(() => { fetch... }, [])

# WITH:
const { data: cexData, isLoading, error, refetch } = useCexBalances();
const balances = cexData?.balances || [];
const totalBalance = cexData?.totalUSD || 0;

# Replace manual loading states with `isLoading` from useQuery.
# Replace manual refresh button with `refetch()`.

# ====================================================================================
# SECTION 8: FEATURE FLAGS HOOK
# File: src/hooks/useFeatures.ts — NEW FILE
# ====================================================================================

import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface FeatureFlags {
  disabledPages: string[];
  enableTokenGating: boolean;
  isTeaserMode: boolean;
  maxPortfolios: number;
  maxWhales: number;
  enableAlphaAi: boolean;
  enableSecurityScanner: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  disabledPages: [],
  enableTokenGating: false,
  isTeaserMode: false,
  maxPortfolios: 5,
  maxWhales: 5,
  enableAlphaAi: true,
  enableSecurityScanner: true,
};

export const useFeatures = () => {
  return useQuery({
    queryKey: ['config', 'features'],
    queryFn: async (): Promise<FeatureFlags> => {
      const res = await api.get('/api/config/features');
      return { ...DEFAULT_FLAGS, ...res.data };
    },
    staleTime: 5 * 60_000,
    retry: 3,
  });
};

# ====================================================================================
# SECTION 9: CONFIG.TS CLEANUP
# File: src/services/config.ts — REMOVE HARDCODED DISABLED_PAGES
# ====================================================================================

# REMOVE this entire block:
# export const DISABLED_PAGES = [
#   '/cex-bag',
#   '/portfolio',
#   '/alphas-feed',
#   '/alpha-ai',
#   '/integrations',
#   '/whales',
#   '/security',
#   '/alpha-calls',
#   '/defi',
# ];

# REPLACE WITH:
export const getDisabledPages = (): string[] => [];

# Keep everything else in config.ts as-is.

# ====================================================================================
# SECTION 10: APP.TSX ROUTEGUARD UPDATE
# File: src/App.tsx — UPDATE RouteGuard COMPONENT
# ====================================================================================

# REPLACE RouteGuard component with:

import { useFeatures } from './hooks/useFeatures';

const RouteGuard = ({ path, title, description, children }: {
  path: string;
  title: string;
  description: string;
  children: React.ReactNode
}) => {
  const navigate = useNavigate();
  const { data: features, isLoading } = useFeatures();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-alphabag-yellow border-t-transparent rounded-full" />
      </div>
    );
  }

  const disabledPages = features?.disabledPages || [];

  if (disabledPages.includes(path)) {
    return (
      <ComingSoonOverlay
        title={title}
        description={description}
        onBack={() => navigate('/')}
      />
    );
  }
  return <>{children}</>;
};

# ====================================================================================
# SECTION 11: SSE REAL-TIME PORTFOLIO STREAM
# File: src/hooks/usePortfolioStream.ts — NEW FILE
# ====================================================================================

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const usePortfolioStream = (token: string | null, address?: string) => {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token || !address) return;

    const es = new EventSource(`/api/stream/portfolio?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);

        if (update.balances) {
          queryClient.setQueryData(['portfolio', 'dex', address], update.balances);
        }
        if (update.cexBalances) {
          queryClient.setQueryData(['portfolio', 'cex'], update.cexBalances);
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    };

    es.onerror = (err) => {
      console.warn('[SSE] Connection error, falling back to polling:', err);
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [token, address, queryClient]);
};

# ====================================================================================
# SECTION 12: APP.TXSSE INTEGRATION
# File: src/App.tsx — ADD usePortfolioStream TO AppContent
# ====================================================================================

# INSIDE AppContent component, ADD:
import { usePortfolioStream } from './hooks/usePortfolioStream';

# THEN inside component body:
const { token } = useAuth();
const { address } = useAccount();
usePortfolioStream(token, address);

# ====================================================================================
# SECTION 13: VITE CONFIG BUNDLE OPTIMIZATION
# File: vite.config.ts — UPDATE manualChunks
# ====================================================================================

# REPLACE manualChunks block with:

manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  web3: ['wagmi', 'viem', '@web3modal/wagmi'],
  walletconnect: ['@walletconnect/ethereum-provider'],
  recharts: ['recharts'],
  ui: ['lucide-react', 'framer-motion', 'sweetalert2'],
  ai: ['@google/genai'],
  query: ['@tanstack/react-query'],
}

# REMOVE: solana chunk (and remove @solana/* deps from package.json if unused)

# ====================================================================================
# SECTION 14: TSCONFIG STRICT MODE
# File: tsconfig.json — UPDATE compilerOptions
# ====================================================================================

{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}

# ====================================================================================
# SECTION 15: TYPE DEFINITIONS
# File: src/types/index.ts — ENSURE THESE EXIST (create if missing)
# ====================================================================================

export interface TokenBalance {
  contractAddress?: string;
  symbol: string;
  name: string;
  chain: string;
  balance: string;
  priceUSD: number;
  valueUSD: number;
  change24h?: number;
  logo?: string;
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  isPremium: boolean;
  imageUrl: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  isAiCurated: boolean;
}

export interface TradeSignal {
  id: string;
  pair: string;
  category: string;
  type: 'LONG' | 'SHORT';
  entry: string;
  targets: string[];
  stopLoss: string;
  timestamp: string;
  status: 'ACTIVE' | 'HIT' | 'STOPPED';
  narrative: string;
}

export interface User {
  id: string;
  email: string;
  tier: 'FREE' | 'PRO' | 'ULTIMATE';
  alphaAiUsageSeconds: number;
  lastAlphaAiReset: string;
  isAdmin: boolean;
  isPro: boolean;
  onboardingComplete: boolean;
  accountType?: 'FOUNDER' | 'TRADER';
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'CEX' | 'WALLET' | 'ANALYTICS' | 'TAX';
  status: 'CONNECTED' | 'DISCONNECTED';
  requiresApiKeys: boolean;
}

export interface DefiPosition {
  id: string;
  protocol: string;
  name: string;
  icon: string;
  chain: string;
  type: 'Lending' | 'Staking' | 'Liquidity' | 'Farming';
  apy: number;
  balance: number;
  healthFactor?: number;
}

export interface SystemService {
  name: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latency: string;
  lastCheck: string;
}

export interface AuditLog {
  id: string;
  admin: string;
  action: string;
  timestamp: string;
}

export interface UserGrowthData {
  date: string;
  count: number;
}

# ====================================================================================
# SECTION 16: ENVIRONMENT VARIABLES
# File: .env.example — REPLACE ENTIRE FILE
# ====================================================================================

# === API ===
VITE_API_BASE_URL=http://localhost:3003

# === WalletConnect ===
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# === Launch Mode ===
VITE_LAUNCH_MODE=full
# VITE_LAUNCH_MODE=teaser

# === Data Mode ===
VITE_DATA_MODE=AUTO
# VITE_DATA_MODE=MOCK
# VITE_DATA_MODE=LIVE

# === Feature Flags (fallbacks only — backend is source of truth) ===
VITE_ENABLE_TOKEN_GATING=false
VITE_ENVIRONMENT=testnet

# === REMOVED (moved to backend) ===
# VITE_COVALENT_API_KEY
# VITE_ALCHEMY_API_KEY (only needed if using Option B with IP allowlist)

# ====================================================================================
# SECTION 17: BACKEND ENDPOINT CONTRACTS
# These must be implemented on the backend server.
# ====================================================================================

# --- 17.1: Security Approvals Proxy ---
GET /api/security/approvals?address=0x...&chain=bsc
Headers: Authorization: Bearer <JWT>
Response: { items: [...] }  # Pass-through from Covalent API

# --- 17.2: RPC Proxy ---
POST /api/rpc/:chain
Headers: Authorization: Bearer <JWT>
Body: { jsonrpc: "2.0", method: "eth_getBalance", params: [...], id: 1 }
Response: { jsonrpc: "2.0", result: "...", id: 1 }
# Backend proxies to Alchemy using server-side API key.

# --- 17.3: Feature Flags ---
GET /api/config/features
Headers: Authorization: Bearer <JWT>
Response:
{
  "disabledPages": ["/cex-bag", "/portfolio"],
  "enableTokenGating": false,
  "isTeaserMode": false,
  "maxPortfolios": 5,
  "maxWhales": 5,
  "enableAlphaAi": true,
  "enableSecurityScanner": true
}

# --- 17.4: SSE Portfolio Stream ---
GET /api/stream/portfolio?token=<JWT>
Content-Type: text/event-stream
# Emits every 30s or on significant balance change:
data: {"balances": [...], "cexBalances": [...], "timestamp": 1234567890}

# ====================================================================================
# SECTION 18: DEPENDENCY CHANGES
# File: package.json — UPDATE dependencies
# ====================================================================================

# REMOVE these if Solana is truly unused:
# "@solana/wallet-adapter-base": "^0.9.27"
# "@solana/wallet-adapter-react": "^0.15.39"
# "@solana/wallet-adapter-react-ui": "^0.9.39"
# "@solana/wallet-adapter-wallets": "^0.19.38"
# "@solana/web3.js": "^1.98.4"

# REPLACE:
# "@tanstack/react-query": "4.36.1"
# WITH:
# "@tanstack/react-query": "^5.0.0"
# "@tanstack/react-query-devtools": "^5.0.0"

# ====================================================================================
# SECTION 19: POST-PATCH VERIFICATION CHECKLIST
# ====================================================================================

[ ] npm install completes without peer dependency conflicts
[ ] npm run build succeeds with zero TypeScript errors
[ ] grep -r "import.meta.env.VITE_COVALENT" src/ returns nothing
[ ] grep -r "api.covalenthq.com" src/ returns nothing
[ ] grep -r "VITE_ALCHEMY_API_KEY" src/ returns nothing (or only in wagmi.ts if using Option B)
[ ] All pages load without runtime errors
[ ] DexBag shows loading skeleton, then data
[ ] SecurityScanner works without Covalent key in frontend env
[ ] Wallet connection still functions (RPC proxy responding)
[ ] Feature flags endpoint returns 200 with valid JSON

# ====================================================================================
# END OF PATCH
# ====================================================================================
