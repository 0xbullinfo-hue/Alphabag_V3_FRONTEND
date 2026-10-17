// SPDX-License-Identifier: MIT
import { api } from './api';

export interface DexSocialLink {
  type?: string;
  label?: string;
  url: string;
}

export interface DexTokenBoost {
  url: string;
  chainId: string;
  tokenAddress: string;
  amount: number;
  totalAmount: number;
  icon?: string;
  header?: string;
  description?: string;
  links?: DexSocialLink[];
}

export interface DexCommunityTakeover {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: DexSocialLink[];
  claimDate: string;
}

export interface DexTrendingMeta {
  name: string;
  slug: string;
  description?: string;
  marketCap: number;
  liquidity: number;
  volume: number;
  tokenCount: number;
  marketCapChange?: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
}

export interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns?: {
    m5?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    h6?: { buys: number; sells: number };
    h24?: { buys: number; sells: number };
  };
  volume?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  priceChange?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ label?: string; url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
  boosts?: {
    active?: number;
  };
}

export const dexscreenerService = {
  // Batch token lookup (up to 30 addresses)
  async getBatchTokens(chainId: string, tokenAddresses: string[]): Promise<DexPair[]> {
    if (!tokenAddresses || tokenAddresses.length === 0) return [];
    try {
      const addresses = tokenAddresses.slice(0, 30).join(',');
      const res = await api.get(`/api/dex/tokens/${chainId}/${addresses}`);
      const pairs = res.data?.pairs || res.data || [];
      return Array.isArray(pairs) ? pairs : [];
    } catch (err) {
      console.warn('[DexScreenerService] getBatchTokens fallback:', err);
      return [];
    }
  },

  // Pair by address
  async getPair(chainId: string, pairAddress: string): Promise<DexPair | null> {
    try {
      const res = await api.get(`/api/dex/pairs/${chainId}/${pairAddress}`);
      return res.data?.pair || res.data?.pairs?.[0] || null;
    } catch (err) {
      console.warn('[DexScreenerService] getPair fallback:', err);
      return null;
    }
  },

  // Search pairs
  async search(query: string): Promise<DexPair[]> {
    try {
      const res = await api.get('/api/dex/search', { params: { q: query } });
      return res.data?.pairs || [];
    } catch (err) {
      console.warn('[DexScreenerService] search fallback:', err);
      return [];
    }
  },

  // Trending Metas / Sectors
  async getTrendingMetas(): Promise<DexTrendingMeta[]> {
    try {
      const res = await api.get('/api/dex/metas/trending');
      const data = res.data?.metas || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[DexScreenerService] getTrendingMetas fallback:', err);
      return [];
    }
  },

  // REST snapshot of latest boosts
  async getLatestBoosts(): Promise<DexTokenBoost[]> {
    try {
      const res = await api.get('/api/dex/boosts/latest');
      const data = res.data?.data || res.data?.boosts || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[DexScreenerService] getLatestBoosts fallback:', err);
      return [];
    }
  },

  // REST snapshot of community takeovers
  async getCommunityTakeovers(): Promise<DexCommunityTakeover[]> {
    try {
      const res = await api.get('/api/dex/community-takeovers');
      const data = res.data?.data || res.data?.takeovers || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[DexScreenerService] getCommunityTakeovers fallback:', err);
      return [];
    }
  }
};
