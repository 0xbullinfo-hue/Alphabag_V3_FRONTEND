
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
  isPro?: boolean;
  visits?: number;
  lastLoginIp?: string;
  location?: string;
  bio?: string;
  website?: string;
  onboardingComplete: boolean;
  accountType?: 'FOUNDER' | 'TRADER';
  bagTokens?: number;
  referralCode?: string;
  referralCount?: number;
  completedTasks?: string[];
  completedMissions?: string[];
  items?: number;
  lastDailyTaskAt?: string;
  lastWeeklyTaskAt?: string;
  strikes?: number;
  bannerUrl?: string;
  logoUrl?: string;
}

export interface ReferralEntry {
  id: string;
  email?: string;
  pointsEarned?: number;
  joinedAt?: string;
}

export interface MissionTask {
  id: string;
  title: string;
  description?: string;
  rewardTokens?: number;
  type?: string;
  frequency?: string;
  status?: string;
  requiresLink?: boolean;
  requiresFeedback?: boolean;
  actionUrl?: string;
}

export interface MissionListResponse {
  missions: MissionTask[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface AirdropStatsResponse {
  totalEntries: number;
  totalLimit: number;
  founderEntries: number;
  founderLimit: number;
  remainingSpots: number;
  tgeDate: string;
}

export interface AirdropPayoutRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'SENT' | 'REJECTED';
  expectedTokens: number;
  walletAddress?: string;
  createdAt: string;
  sentAt?: string | null;
  txReference?: string | null;
}

export interface AirdropStatusResponse {
  settings: {
    isPaused: boolean;
    itemsToBagRate: number | null;
    campaignEnded: boolean;
    tgeDate?: string;
    [key: string]: unknown;
  };
  userStatus: {
    walletSubmitted?: string | null;
    payoutRequest?: AirdropPayoutRequest | null;
    [key: string]: unknown;
  } | null;
  reveal?: {
    isRevealed?: boolean;
    [key: string]: unknown;
  };
}

export interface MissionClaimResponse {
  success: boolean;
  message?: string;
  items?: number;
  rewardTokens?: number;
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

export type SignalCategory = 'DEGEN' | 'LONGTERM' | 'AIRDROPS' | 'SCALPS' | 'SWING';

export type SignalStatus = 'ACTIVE' | 'HIT' | 'LOSS' | 'CLOSED' | 'PENDING';

export interface TradeSignal {
  id: string;
  pair: string;
  category: SignalCategory;
  type: 'LONG' | 'SHORT' | 'BUY' | 'AIRDROP';
  entry: string;
  targets: string[];
  stopLoss: string;
  timestamp: string;
  status: SignalStatus;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  chain?: string;
  leverage?: string;
  tokenInfo?: string; // Kept as string to match existing, or update if it was any
  narrative?: string;
  description?: string;
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  };
  relevantInfo?: string;
  contractAddress?: string;
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

export interface Project {
    id: string;
    ownerId: string;
    name: string;
    symbol: string;
    logoUrl?: string;
    theHook: string;
    description: string;
    contractAddress: string;
    totalSupply: string;
    websiteUrl: string;
    buyLink: string;
    bannerUrl?: string;
    heatIndex: number;
    engagementTotal: number;
    totalMentions: number;
    isVerified: boolean;
    isAd: boolean;
    adPlacement?: 'SIDEBAR' | 'TIMELINE' | 'BOTH';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

export interface Post {
    id: string;
    authorId: string;
    content: string;
    projectId?: string;
    boostMultiplier?: number;
    isAd?: boolean;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    createdAt: string;
    logoUrl?: string;
    bannerUrl?: string;
    strategy?: 'DEGEN' | 'SHORT' | 'LONGTERM' | 'AIRDROP';
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'CEX' | 'WALLET' | 'ANALYTICS' | 'TAX';
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  requiresApiKeys?: boolean;
  lastSynced?: string;
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

export interface TokenBalance {
  symbol: string;
  name: string;
  decimals: number;
  balance: string; // Raw balance
  guiBalance: number; // Human readable
  price?: number;
  value?: number;
  tokenAddress: string;
  logo?: string;
  chain?: string; // Added to track source chain
}
