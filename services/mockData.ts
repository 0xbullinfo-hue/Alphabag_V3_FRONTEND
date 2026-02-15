import { Coin, NewsItem, PortfolioItem, TradeSignal, SystemService, AuditLog, UserGrowthData } from '../types';

// Storage Keys
const SIGNALS_KEY = 'alphabag_signals_v1';
const NEWS_KEY = 'alphabag_news_v1';
const STATS_KEY = 'alphabag_stats_v1';

const DEFAULT_STATS: GlobalBackendStats = {
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

export const fetchCoins = async (): Promise<Coin[]> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true');
    if (!response.ok) throw new Error('Market data fetch failed');
    return await response.json();
  } catch (e) {
    console.error("CoinGecko Markets Error:", e);
    return MOCK_COINS;
  }
};

export const fetchPrices = async (ids: string[]): Promise<Record<string, { usd: number, usd_24h_change: number }>> => {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`);
    if (!response.ok) throw new Error('Price fetch failed');
    return await response.json();
  } catch (e) {
    console.error("Price Sync Error:", e);
    return {};
  }
};

export const fetchAiBriefing = async (assets: PortfolioItem[], tier: string): Promise<string> => {
  await new Promise(r => setTimeout(r, 800));
  return "Neural links are establishing connection. Historical data suggests a constructive accumulation phase for your primary nodes. Volatility remains high in the degen sector.";
};

export const fetchHoldingsForAddress = async (address: string, chain: string = 'ETH'): Promise<PortfolioItem[]> => {
  await new Promise(r => setTimeout(r, 400));
  const seed = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  let coins: string[] = [];
  if (chain === 'SOL') coins = ['solana', 'bonk', 'wif', 'jupiter'];
  else if (chain === 'BSC') coins = ['binancecoin', 'pancakeswap-token', 'cake', 'bnb'];
  else if (chain === 'BASE') coins = ['ethereum', 'base-god', 'aerodrome-finance'];
  else if (chain === 'AVAX') coins = ['avalanche-2', 'joe'];
  else if (chain === 'ARB') coins = ['arbitrum', 'gmx'];
  else coins = ['ethereum', 'shiba-inu', 'pepe', 'uniswap', 'chainlink']; // Default ETH

  const selectedIds = coins.filter((_, idx) => (seed + idx) % (coins.length > 2 ? 2 : 1) === 0 || idx === 0);

  try {
    const markets = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + selectedIds.join(',')).then(r => r.json());
    if (!Array.isArray(markets)) return []; // Handle API errors

    return markets.map((coin: any) => {
      const amount = ((seed % 10) + 1) * (coin.current_price < 100 ? 1000 : 2);
      const value = amount * coin.current_price;
      const pnlPercent = ((seed % 40) - 15);
      const pnl = value * (pnlPercent / 100);
      const avgBuy = coin.current_price / (1 + (pnlPercent / 100));
      return {
        coinId: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        amount: amount,
        avgBuyPrice: avgBuy,
        currentPrice: coin.current_price,
        priceChange24h: coin.price_change_24h || 0,
        value: value,
        pnl: pnl,
        pnlPercent: pnlPercent
      };
    });
  } catch (e) { return []; }
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
    { id: '1', pair: 'BTC/USDT', category: 'ALPHA', type: 'LONG', entry: '64000', targets: ['68000', '72000'], stopLoss: '62000', timestamp: '2h ago', status: 'ACTIVE', narrative: 'Institutional buying detected at VWAP.' },
    { id: '2', pair: 'ETH/USDT', category: 'FUTURES', type: 'LONG', entry: '3450', targets: ['3800'], stopLoss: '3300', timestamp: '4h ago', status: 'HIT', narrative: 'Whale accumulation cluster identified on-chain.' }
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
export const fetchDefiPositions = async () => [];
export const fetchIntegrations = async () => [];
export const fetchEarnOpportunities = async () => [];
export const fetchBlogPosts = async () => [];
export const fetchChainInfo = async (i: string) => undefined;
export const fetchChains = async () => [];
export const fetchNFTs = async () => [];