// Lowercase chain IDs matching Bubblemaps / DexScreener conventions.
// NOTE: deliberately separate from the uppercase Chain type in types.ts
// which is used for CEX/wallet tracking.
export type ChainId = 'eth' | 'bsc' | 'base' | 'arbitrum' | 'solana' | 'polygon';

export interface TrendingWord {
  word: string;
  score: number;
}

export interface SocialVolumePoint {
  datetime: string;
  value: number;
}

export interface SocialMetrics {
  trendingWords: TrendingWord[];
  socialVolume: SocialVolumePoint[];
  sentimentBalance: number | null;
}

/**
 * Shared token context across TradingView, Bubblemaps, and Santiment tabs.
 * Changing the selected TokenContext updates all three simultaneously.
 */
export interface TokenContext {
  label: string;
  tvSymbol: string;
  chain: ChainId;
  address: string;
  assetSlug: string;
}

export type SantimentRange = '24h' | '7d' | '30d';
