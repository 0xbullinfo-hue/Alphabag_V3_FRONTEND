
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
  sparkline_in_7d: { price: number[] };
}

// Strict 2-tier system as per requirements
export type UserTier = 'FREE' | 'ULTIMATE';

export interface User {
  id: string;
  email: string;
  tier: UserTier;
  verifiedWallet?: string;
  alphaAiUsageSeconds: number;
  lastAlphaAiReset: string;
  isAdmin: boolean;
}

export type Chain = 'BSC' | 'ETH' | 'SOL' | 'BASE' | 'AVAX' | 'ARB';

export interface WalletEntry {
  id: string;
  address: string;
  label: string;
  chain: Chain;
  type: 'PORTFOLIO' | 'WHALE';
}

export interface PortfolioItem {
  coinId: string;
  symbol: string;
  name: string;
  image: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  priceChange24h: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

export interface PortfolioHistoryPoint {
  timestamp: number;
  value: number;
  pnl: number;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL' | 'TRANSFER' | 'SWAP' | 'APPROVAL' | 'UNKNOWN';
  coin: string;
  price: number;
  amount: number;
  date: string;
  value: number;
  hash: string;
  from: string;
  to: string;
  fee: number;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  chain: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  content?: string;
  isPremium: boolean;
  imageUrl?: string;
  isPinned?: boolean;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  isAiCurated?: boolean;
}

export type SignalCategory = 'DEGEN' | 'ALPHA' | 'FUTURES';

export interface TradeSignal {
  id: string;
  pair: string;
  category: SignalCategory;
  type: 'LONG' | 'SHORT' | 'BUY';
  entry: string;
  targets: string[];
  stopLoss: string;
  timestamp: string;
  status: 'ACTIVE' | 'HIT' | 'CLOSED' | 'DRAFT' | 'SCHEDULED';
  contractAddress?: string;
  chain?: string;
  leverage?: string;
  tokenInfo?: string;
  narrative?: string;
  copyCount?: number;
}

export interface MarketSentiment {
  value: number;
  classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  nextUpdate: string;
}

export interface SystemService {
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
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

// Added missing NFTItem interface
export interface NFTItem {
  id: string;
  name: string;
  imageUrl: string;
  collection: string;
  floorPrice: number;
}

// Added missing DefiPosition interface
export interface DefiPosition {
  id: string;
  protocol: string;
  name: string;
  icon: string;
  chain: string;
  type: 'Lending' | 'Liquidity' | 'Staking' | 'Farming' | 'Governance';
  apy: number;
  balance: number;
  healthFactor?: number;
}

// Added missing Integration interface
export interface Integration {
  id: string;
  name: string;
  icon: string;
  type: string;
  status: 'CONNECTED' | 'DISCONNECTED';
}

// Added missing EarnOpportunity interface
export interface EarnOpportunity {
  id: string;
  asset: string;
  protocol: string;
  chain: string;
  tvl: number;
  apy: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  icon: string;
}

// Added missing BlogPost interface
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  author: string;
  date: string;
}

// Added missing ChainInfo interface
export interface ChainInfo {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  description: string;
  tvl: number;
  tps: number;
  avgGas: string;
  activeWallets: number;
}

export interface CovalentToken {
  contract_address: string;
  contract_name: string;
  contract_ticker_symbol: string;
  contract_decimals: number;
  logo_url: string;
  balance: string;
  quote: number;
  quote_rate: number;
  quote_24h?: number;
}
