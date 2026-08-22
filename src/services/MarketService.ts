import { ONE_MINUTE } from './constants';
import { API_CONFIG, DATA_SOURCE_CONFIG } from './config';
import { api } from './api';

const MARKET_PROXY_BASE = API_CONFIG.MARKET_PROXY_BASE_URL;

interface CacheItem { data: any; timestamp: number; }
const cache: Record<string, CacheItem> = {};
const CACHE_DURATION = 2 * ONE_MINUTE;
const inFlight: Record<string, Promise<any> | undefined> = {};

async function withCache<T>(key: string, fetcher: () => Promise<T>, fallback: T): Promise<T> {
  if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) return cache[key].data;
  if (inFlight[key]) return inFlight[key];
  const promise = (async () => {
    try {
      const data = await fetcher();
      cache[key] = { data, timestamp: Date.now() };
      return data;
    } catch (error) {
      console.error(`MarketService Error [${key}]:`, error);
      return fallback;
    } finally {
      delete inFlight[key];
    }
  })();
  inFlight[key] = promise;
  return promise;
}

export const MarketService = {
  getPrice: async (ids: string[], vs_currencies = 'usd') => {
    const key = `price_${ids.join('_')}_${vs_currencies}`;
    return withCache(key, () =>
      api.get('/api/market/price', { params: { ids: ids.join(','), vs_currencies } }).then((r) => r.data),
      null
    );
  },

  getMarketData: async (ids: string[], sparkline = false) => {
    const key = `market_${ids.join('_')}_${sparkline}`;
    return withCache(key, async () => {
      const params = new URLSearchParams({
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: '100',
        page: '1',
        sparkline: String(sparkline),
        price_change_percentage: '1h,24h,7d',
      });
      if (ids.length > 0) params.append('ids', ids.join(','));

      let data: any[] = [];
      const canUseLive = DATA_SOURCE_CONFIG.MODE !== 'MOCK';

      if (canUseLive) {
        try {
          data = (await api.get(`/api/market/coins/markets?${params.toString()}`)).data;
        } catch (proxyError) {
          console.warn('Market proxy unavailable, falling back to public feed.', proxyError);
        }
      }
      if (!Array.isArray(data) || data.length === 0) {
        data = (await api.get(`/api/market/coins/markets?${params.toString()}`)).data;
      }
      return data;
    }, []);
  },

  searchCoins: async (query: string) => {
    try {
      const data = (await api.get('/api/market/search', { params: { query } })).data;
      return data.coins || [];
    } catch (error) {
      return [];
    }
  },

  getTokenPrices: async (platform: string, contractAddresses: string[]) => {
    const key = `token_price_${platform}_${contractAddresses.join('_')}`;
    return withCache(key, () =>
      api.get('/api/market/token-price', {
        params: { platform, contract_addresses: contractAddresses.join(',') },
      }).then((r) => r.data),
      {}
    );
  },

  getDexTokenPrice: async (tokenAddress: string) => {
    const key = `dex_price_${tokenAddress}`;
    return withCache(key, async () => {
      const data = (await api.get(`/api/dex/tokens/${tokenAddress}`)).data;
      if (data.pairs && data.pairs.length > 0) {
        const bestPair = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
        if (bestPair) {
          return {
            price: Number(bestPair.priceUsd),
            pair: bestPair,
            priceChange24h: bestPair.priceChange?.h24 || 0,
          };
        }
      }
      return null;
    }, null);
  },
};
