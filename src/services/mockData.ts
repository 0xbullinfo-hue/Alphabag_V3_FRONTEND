import { Coin, NewsItem, PortfolioItem, TradeSignal, SystemService, AuditLog, UserGrowthData, Integration, DefiPosition } from '../types';
import { api } from './api';

// Storage Keys
const SIGNALS_KEY = 'alphabag_signals_v1';
const NEWS_KEY = 'alphabag_news_v1';
const STATS_KEY = 'alphabag_stats_v1';
const INTEGRATIONS_KEY = 'alphabag_integrations_v1';

const DEFAULT_INTEGRATIONS: Integration[] = [
  { id: 'binance', name: 'Binance', description: 'World\'s largest crypto exchange.', icon: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png', category: 'CEX', status: 'DISCONNECTED', requiresApiKeys: true },
  { id: 'coinbase', name: 'Coinbase', description: 'Secure and easy-to-use crypto exchange.', icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', category: 'CEX', status: 'DISCONNECTED', requiresApiKeys: true },
  { id: 'metamask', name: 'MetaMask', description: 'The leading Web3 wallet for Ethereum and EVM chains.', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg', category: 'WALLET', status: 'DISCONNECTED', requiresApiKeys: false },
  { id: 'phantom', name: 'Phantom', description: 'A friendly crypto wallet for Solana.', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png', category: 'WALLET', status: 'DISCONNECTED', requiresApiKeys: false },
  { id: 'nansen', name: 'Nansen', description: 'Premium on-chain analytics and wallet labels.', icon: 'https://cryptologos.cc/logos/neo-neo-logo.png', category: 'ANALYTICS', status: 'DISCONNECTED', requiresApiKeys: true },
  { id: 'koinly', name: 'Koinly', description: 'Crypto tax software designed for traders.', icon: 'https://cryptologos.cc/logos/cosmos-atom-logo.png', category: 'TAX', status: 'DISCONNECTED', requiresApiKeys: true }
];

const DEFAULT_STATS = {
  visitors: 12450,
  tierUsers: { FREE: 8500, ULTIMATE: 750 },
  geoData: [
    { country: 'USA', count: 4200 },
    { country: 'Germany', count: 1200 },
    { country: 'Singapore', count: 800 }
  ],
  totalWallets: 15600,
  totalWhaleWatches: 4200,
  userGrowth: [
    { date: '2024-01', count: 4500 },
    { date: '2024-02', count: 6200 },
    { date: '2024-03', count: 8100 },
    { date: '2024-04', count: 11200 },
    { date: '2024-05', count: 12450 },
  ]
};

// NOTE: This function is not currently called anywhere in the app —
// WalletContext uses ChainService.getMultiChainBalances instead. Fixed here
// for type-correctness and left as a reference implementation, but if this
// is wired back in, callers must check the isMockData flag on the results.
export const fetchHoldingsForAddress = async (address: string, chain: string = 'ETH'): Promise<PortfolioItem[]> => {
  try {
    const res = await api.get(`/api/portfolio/balances`, { params: { address, chain } });
    if (!res.data || !res.data.success) throw new Error('Failed to fetch real balances');

    const rawData = res.data.data;
    
    // Map backend data to frontend PortfolioItem format
    // For simplicity in Beta, we focus on the native asset (ETH/BNB/SOL) balance first
    // Token details can be added as we expand the UI to show multiple tokens
    
    const nativeValue = parseFloat(rawData.nativeBalance) / 1e18; // Default for ETH/EVM
    if (chain === 'SOL') {
      const solValue = parseFloat(rawData.nativeBalance) / 1e9; // SOL has 9 decimals
      return [{
        coinId: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        image: 'https://cryptologos.cc/logos/solana-sol-logo.png',
        amount: solValue,
        avgBuyPrice: 0,
        currentPrice: 0,
        priceChange24h: 0,
        value: 0,
        pnl: 0,
        pnlPercent: 0,
        costBasisKnown: false
      }];
    }

    return [{
        coinId: chain.toLowerCase(),
        symbol: chain,
        name: chain === 'ETH' ? 'Ethereum' : chain,
        image: '', // To be populated by price sync
        amount: nativeValue,
        avgBuyPrice: 0,
        currentPrice: 0,
        priceChange24h: 0,
        value: 0,
        pnl: 0,
        pnlPercent: 0,
        costBasisKnown: false
    }];

  } catch (e) {
    console.warn("Real balance fetch failed for address, returning empty holdings:", address, e);
    // IMPORTANT: previously this branch fabricated a deterministic
    // "random but stable per wallet address" fake portfolio — picking a
    // seeded subset of real coins, pulling their real live prices from
    // CoinGecko, and inventing a holding amount for each. Because it used
    // real market data and was stable across reloads for the same
    // address, it was MORE convincing than plain mock data, not less —
    // a user could easily mistake it for their real portfolio. Returning
    // an empty array here is the honest behavior: no data beats fake data.
    return [];
  }
};

export const MOCK_COINS: Coin[] = [
  {
    id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    current_price: 64230.50, market_cap: 1200000000000, market_cap_rank: 1,
    price_change_percentage_24h: 2.5, total_volume: 35000000000,
    sparkline_in_7d: { price: [60000, 61000, 60500, 62000, 63000, 64230] }
  },
  {
    id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    current_price: 3450.20, market_cap: 400000000000, market_cap_rank: 2,
    price_change_percentage_24h: -1.2, total_volume: 15000000000,
    sparkline_in_7d: { price: [3500, 3480, 3550, 3520, 3490, 3450] }
  }
];

export interface GlobalBackendStats {
  visitors: number;
  tierUsers: { FREE: number; ULTIMATE: number };
  geoData: { country: string; count: number }[];
  totalWallets: number;
  totalWhaleWatches: number;
  userGrowth: UserGrowthData[];
}

export const getGlobalStats = (): GlobalBackendStats => {
  const saved = localStorage.getItem(STATS_KEY);
  if (!saved) return DEFAULT_STATS;
  try {
    const parsed = JSON.parse(saved);
    // Deep merge to guarantee critical dashboard structures exist
    return {
      ...DEFAULT_STATS,
      ...parsed,
      tierUsers: {
        FREE: parsed.tierUsers?.FREE ?? DEFAULT_STATS.tierUsers.FREE,
        ULTIMATE: parsed.tierUsers?.ULTIMATE ?? DEFAULT_STATS.tierUsers.ULTIMATE
      },
      userGrowth: parsed.userGrowth || DEFAULT_STATS.userGrowth,
      geoData: parsed.geoData || DEFAULT_STATS.geoData
    };
  } catch (e) {
    return DEFAULT_STATS;
  }
};

export const updateGlobalStats = (updates: Partial<GlobalBackendStats>) => {
  const current = getGlobalStats();
  localStorage.setItem(STATS_KEY, JSON.stringify({ ...current, ...updates }));
};

export const recordVisitor = () => {
  const stats = getGlobalStats();
  updateGlobalStats({ visitors: stats.visitors + 1 });
};

export const getPersistentSignals = (): TradeSignal[] => {
  const saved = localStorage.getItem(SIGNALS_KEY);
  return saved ? JSON.parse(saved) : [
    { id: '1', pair: 'BTC/USDT', category: 'ALPHA', type: 'LONG', entry: '64000', targets: ['68000', '72000'], stopLoss: '62000', timestamp: '2h ago', status: 'ACTIVE', narrative: 'Institutional buying detected at VWAP.' } as any,
    { id: '2', pair: 'ETH/USDT', category: 'FUTURES', type: 'LONG', entry: '3450', targets: ['3800'], stopLoss: '3300', timestamp: '4h ago', status: 'HIT', narrative: 'Whale accumulation cluster identified on-chain.' } as any
  ];
};

export const savePersistentSignal = (signal: TradeSignal) => {
  const signals = getPersistentSignals();
  const idx = signals.findIndex(s => s.id === signal.id);
  if (idx > -1) signals[idx] = signal; else signals.unshift(signal);
  localStorage.setItem(SIGNALS_KEY, JSON.stringify(signals));
};

export const deletePersistentSignal = (id: string) => {
  const signals = getPersistentSignals().filter(s => s.id !== id);
  localStorage.setItem(SIGNALS_KEY, JSON.stringify(signals));
};

export const getPersistentNews = (): NewsItem[] => {
  const saved = localStorage.getItem(NEWS_KEY);
  return saved ? JSON.parse(saved) : [
    { id: '1', title: 'Global Liquidity Injection Incoming', source: 'Alpha Intel', date: '2h ago', summary: 'Macro analysis suggests a shift in stablecoin minting rates.', isPremium: true, imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=400', sentiment: 'POSITIVE', isAiCurated: true },
    { id: '2', title: 'Ethereum Layer 2 TVL Hits New ATH', source: 'Chain Node', date: '5h ago', summary: 'Optimism and Arbitrum seeing massive inflows.', isPremium: false, imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=400', sentiment: 'POSITIVE', isAiCurated: true },
    { id: '3', title: 'Regulatory Headwinds for Privacy Coins', source: 'Compliance Watch', date: '8h ago', summary: 'New EU guidelines may impact Monero and ZCash listings.', isPremium: false, imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=400', sentiment: 'NEGATIVE', isAiCurated: false }
  ];
};

export const savePersistentNews = (item: NewsItem) => {
  const news = getPersistentNews();
  const idx = news.findIndex(n => n.id === item.id);
  if (idx > -1) news[idx] = item; else news.unshift(item);
  localStorage.setItem(NEWS_KEY, JSON.stringify(news));
};

export const deletePersistentNews = (id: string) => {
  const news = getPersistentNews().filter(n => n.id !== id);
  localStorage.setItem(NEWS_KEY, JSON.stringify(news));
};

export const getSystemHealth = (): SystemService[] => [
  { name: 'Covalent API', status: 'ONLINE', latency: '42ms', lastCheck: 'Just now' },
  { name: 'CoinGecko Nodes', status: 'ONLINE', latency: '156ms', lastCheck: '2m ago' },
  { name: 'Gemini AI core', status: 'ONLINE', latency: '89ms', lastCheck: 'Just now' },
  { name: 'Nansen Hub', status: 'DEGRADED', latency: '450ms', lastCheck: '1m ago' },
  { name: 'Central Database', status: 'ONLINE', latency: '2ms', lastCheck: 'Just now' },
  { name: 'Redis Cache', status: 'ONLINE', latency: '1ms', lastCheck: 'Just now' }
];

export const getAuditLogs = (): AuditLog[] => [
  { id: '1', admin: 'admin@alphabag.pro', action: 'Published Signal BTC/USDT', timestamp: '10m ago' },
  { id: '2', admin: 'admin@alphabag.pro', action: 'Updated System Config (Gemini API)', timestamp: '1h ago' },
  { id: '3', admin: 'admin@alphabag.pro', action: 'Pinned News Article', timestamp: '2h ago' }
];

export const fetchPortfolioHistory = async (r: string) => {
  const now = Date.now();
  const points = r === '24H' ? 24 : r === '7D' ? 7 : 30;
  return Array.from({ length: points }).map((_, i) => ({
    timestamp: now - (points - i) * (r === '24H' ? 3600000 : 86400000),
    value: 50000 + Math.random() * 10000,
    pnl: 5000 + Math.random() * 2000
  }));
};
export const fetchFearAndGreed = async () => ({ value: 72, classification: 'Greed' as any, nextUpdate: '4 hours' });
export const fetchGlobalStats = async () => ({ marketCap: 2.42e12, btcDominance: 52.4 });
export const fetchNews = async () => getPersistentNews();
export const fetchSignals = async () => getPersistentSignals();
export const fetchWhaleHoldings = async (address: string, chain: string = 'ETH') => fetchHoldingsForAddress(address, chain);
export const fetchDefiPositions = async (): Promise<DefiPosition[]> => [
  {
    id: '1', protocol: 'Aave V3', name: 'USDC Lend', icon: 'https://cryptologos.cc/logos/aave-aave-logo.png', chain: 'Base',
    type: 'Lending', apy: 6.5, balance: 14500.50
  },
  {
    id: '2', protocol: 'Lido', name: 'stETH', icon: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png', chain: 'Ethereum',
    type: 'Staking', apy: 3.2, balance: 34500.00
  },
  {
    id: '3', protocol: 'Uniswap V3', name: 'ETH/USDC 0.05%', icon: 'https://cryptologos.cc/logos/uniswap-uni-logo.png', chain: 'Arbitrum',
    type: 'Liquidity', apy: 24.5, balance: 8000.00
  },
  {
    id: '4', protocol: 'Aave V3', name: 'ETH Borrow', icon: 'https://cryptologos.cc/logos/aave-aave-logo.png', chain: 'Base',
    type: 'Lending', apy: -4.2, balance: -5000.00, healthFactor: 2.4
  },
  {
    id: '5', protocol: 'Pendle', name: 'eETH PT', icon: 'https://cryptologos.cc/logos/pendle-pendle-logo.png', chain: 'Ethereum',
    type: 'Farming', apy: 18.2, balance: 12000.00
  }
];
export const getIntegrations = (): Integration[] => {
  const saved = localStorage.getItem(INTEGRATIONS_KEY);
  return saved ? JSON.parse(saved) : DEFAULT_INTEGRATIONS;
};

export const updateIntegration = (id: string, updates: Partial<Integration>) => {
  const integrations = getIntegrations();
  const index = integrations.findIndex(i => i.id === id);
  if (index > -1) {
    integrations[index] = { ...integrations[index], ...updates };
    localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(integrations));
  }
};

export const fetchIntegrations = async () => getIntegrations();
export const fetchEarnOpportunities = async () => [];
export const fetchBlogPosts = async () => [];
export const fetchChainInfo = async (i: string) => undefined;
export const fetchChains = async () => [];
export const fetchNFTs = async () => [];