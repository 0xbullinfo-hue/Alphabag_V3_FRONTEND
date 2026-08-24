import { Coin, NewsItem, PortfolioItem, TradeSignal, SystemService, AuditLog, UserGrowthData, Integration, DefiPosition } from '../types';
import { api } from './api';

export const fetchHoldingsForAddress = async (address: string, chain: string = 'ETH'): Promise<PortfolioItem[]> => {
  try {
    const res = await api.get('/api/portfolio/balances', { params: { address, chain } });
    if (!res.data?.success && !Array.isArray(res.data)) return [];
    return res.data.data || res.data.tokens || [];
  } catch (e) {
    console.warn("Real balance fetch failed for address:", address, e);
    return [];
  }
};

export const fetchPortfolioHistory = async (range: string = '7D') => {
  try {
    const res = await api.get('/api/portfolio/history', { params: { range } });
    return res.data?.data || res.data || [];
  } catch (e) {
    return [];
  }
};

export const fetchFearAndGreed = async () => {
  try {
    const res = await api.get('/api/market/fear-greed');
    return res.data?.data || res.data || { value: 50, classification: 'Neutral', nextUpdate: 'Real-time' };
  } catch (e) {
    return { value: 50, classification: 'Neutral', nextUpdate: 'Unavailable' };
  }
};

export const fetchGlobalStats = async () => {
  try {
    const res = await api.get('/api/market/global-stats');
    return res.data?.data || res.data || { marketCap: 0, btcDominance: 0 };
  } catch (e) {
    return { marketCap: 0, btcDominance: 0 };
  }
};

export const fetchNews = async (): Promise<NewsItem[]> => {
  try {
    const res = await api.get('/api/news');
    return Array.isArray(res.data) ? res.data : (res.data?.news || []);
  } catch (e) {
    return [];
  }
};

export const fetchSignals = async (): Promise<TradeSignal[]> => {
  try {
    const res = await api.get('/api/signals');
    return Array.isArray(res.data) ? res.data : (res.data?.signals || []);
  } catch (e) {
    return [];
  }
};

export const fetchWhaleHoldings = async (address: string, chain: string = 'ETH') => {
  return fetchHoldingsForAddress(address, chain);
};

export const fetchDefiPositions = async (): Promise<DefiPosition[]> => {
  try {
    const res = await api.get('/api/portfolio/defi');
    return Array.isArray(res.data) ? res.data : (res.data?.positions || []);
  } catch (e) {
    return [];
  }
};

export const fetchIntegrations = async (): Promise<Integration[]> => {
  try {
    const res = await api.get('/api/integrations');
    return Array.isArray(res.data) ? res.data : (res.data?.integrations || []);
  } catch (e) {
    return [];
  }
};

export const getIntegrations = (): Integration[] => [];
export const updateIntegration = async (id: string, updates: Partial<Integration>) => {
  try {
    await api.patch(`/api/integrations/${id}`, updates);
  } catch (e) {
    console.error("Update integration failed", e);
  }
};

export const getSystemHealth = async (): Promise<SystemService[]> => {
  try {
    const res = await api.get('/api/system/health');
    return Array.isArray(res.data) ? res.data : (res.data?.services || []);
  } catch (e) {
    return [];
  }
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const res = await api.get('/api/admin/audit-logs');
    return Array.isArray(res.data) ? res.data : (res.data?.logs || []);
  } catch (e) {
    return [];
  }
};

export interface GlobalBackendStats {
  visitors: number;
  tierUsers: { FREE: number; ULTIMATE: number };
  geoData: { country: string; count: number }[];
  totalWallets: number;
  totalWhaleWatches: number;
  userGrowth: UserGrowthData[];
}

export const getGlobalStats = async (): Promise<GlobalBackendStats> => {
  try {
    const res = await api.get('/api/stats');
    return res.data || {
      visitors: 0,
      tierUsers: { FREE: 0, ULTIMATE: 0 },
      geoData: [],
      totalWallets: 0,
      totalWhaleWatches: 0,
      userGrowth: []
    };
  } catch (e) {
    return {
      visitors: 0,
      tierUsers: { FREE: 0, ULTIMATE: 0 },
      geoData: [],
      totalWallets: 0,
      totalWhaleWatches: 0,
      userGrowth: []
    };
  }
};

export const recordVisitor = () => {
  api.post('/api/stats/visit').catch(() => {});
};

export const savePersistentSignal = async (signal: TradeSignal) => {
  try {
    await api.post('/api/admin/signals', signal);
  } catch (e) {
    console.error("Save signal failed", e);
  }
};

export const deletePersistentSignal = async (id: string) => {
  try {
    await api.delete(`/api/admin/signals/${id}`);
  } catch (e) {
    console.error("Delete signal failed", e);
  }
};

export const savePersistentNews = async (item: NewsItem) => {
  try {
    await api.post('/api/admin/news', item);
  } catch (e) {
    console.error("Save news failed", e);
  }
};

export const deletePersistentNews = async (id: string) => {
  try {
    await api.delete(`/api/admin/news/${id}`);
  } catch (e) {
    console.error("Delete news failed", e);
  }
};

export const fetchEarnOpportunities = async () => [];
export const fetchBlogPosts = async () => [];
export const fetchChainInfo = async (_i: string) => undefined;
export const fetchChains = async () => [];
export const fetchNFTs = async () => [];
export const MOCK_COINS: Coin[] = [];
