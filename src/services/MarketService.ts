import { ONE_MINUTE } from './constants';
import { API_CONFIG, DATA_SOURCE_CONFIG } from './config';

const API_BASE = 'https://api.coingecko.com/api/v3';
const MARKET_PROXY_BASE = API_CONFIG.MARKET_PROXY_BASE_URL;
// Note: Free tier has rate limits (approx 10-30 calls/min).
//
// SCALING CAVEAT: the cache and in-flight de-duplication below only
// operate within a single browser tab — they stop this app firing
// duplicate requests when several components on one page ask for the
// same price at once, but they do NOT protect the shared CoinGecko
// free-tier rate limit across many different users/tabs. At real
// traffic volume this (and getTokenPrices/getDexTokenPrice/searchCoins,
// which have no server-side proxy at all) will get rate-limited. The
// real fix is a server-side cache/proxy shared across all users —
// getMarketData already has a partial version via MARKET_PROXY_BASE;
// extend that pattern to the other methods here.

interface CacheItem {
    data: any;
    timestamp: number;
}

const cache: Record<string, CacheItem> = {};
const CACHE_DURATION = 2 * ONE_MINUTE; // Cache for 2 minutes to be safe

// Tracks requests currently in flight, keyed the same way as `cache`. If
// a second caller asks for the same key while the first request is still
// pending, it gets handed the SAME promise instead of firing a second
// network request.
const inFlight: Record<string, Promise<any> | undefined> = {};

/**
 * Wraps a fetch with cache + in-flight de-duplication. Every cached
 * method in this file should go through this instead of hand-rolling
 * its own cache[key]/timestamp check.
 */
async function withCache<T>(key: string, fetcher: () => Promise<T>, fallback: T): Promise<T> {
    if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
        return cache[key].data;
    }
    if (inFlight[key]) {
        return inFlight[key];
    }

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

const fetchJson = async (url: string, timeoutMs = 9000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timeout);
    }
};

export const MarketService = {
    /**
     * Get simple price for standard coins
     */
    getPrice: async (ids: string[], vs_currencies = 'usd') => {
        const key = `price_${ids.join('_')}_${vs_currencies}`;
        return withCache(key, () =>
            fetchJson(`${API_BASE}/simple/price?ids=${ids.join(',')}&vs_currencies=${vs_currencies}&include_24hr_change=true`),
            null
        );
    },

    /**
     * Get rich data for specific coins (Market Cards)
     * If ids is empty, fetches top 100 coins
     */
    getMarketData: async (ids: string[], sparkline = false) => {
        const key = `market_${ids.join('_')}_${sparkline}`;
        return withCache(key, async () => {
            const params = new URLSearchParams({
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: '100',
                page: '1',
                sparkline: String(sparkline),
                price_change_percentage: '1h,24h,7d'
            });

            if (ids.length > 0) {
                params.append('ids', ids.join(','));
            }

            let data: any[] = [];
            const canUseLive = DATA_SOURCE_CONFIG.MODE !== 'MOCK';

            if (canUseLive) {
                try {
                    data = await fetchJson(`${MARKET_PROXY_BASE}/coins/markets?${params.toString()}`);
                } catch (proxyError) {
                    console.warn('Market proxy unavailable, falling back to public feed.', proxyError);
                }
            }

            if (!Array.isArray(data) || data.length === 0) {
                data = await fetchJson(`${API_BASE}/coins/markets?${params.toString()}`);
            }

            return data;
        }, []);
    },

    /**
     * Search for coins
     */
    searchCoins: async (query: string) => {
        try {
            const data = await fetchJson(`${API_BASE}/search?query=${query}`);
            return data.coins || [];
        } catch (error) {
            return [];
        }
    },

    /**
     * Get Token Prices by Contract Address
     */
    getTokenPrices: async (platform: string, contractAddresses: string[]) => {
        const key = `token_price_${platform}_${contractAddresses.join('_')}`;
        return withCache(key, () =>
            fetchJson(`${API_BASE}/simple/token_price/${platform}?contract_addresses=${contractAddresses.join(',')}&vs_currencies=usd`),
            {}
        );
    },

    /**
     * Get Token Price from DexScreener (Real-time for unlisted tokens)
     * Supports multi-chain by address -- usually returns pairs for all chains where token exists
     */
    getDexTokenPrice: async (tokenAddress: string) => {
        const key = `dex_price_${tokenAddress}`;
        return withCache(key, async () => {
            const data = await fetchJson(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
            if (data.pairs && data.pairs.length > 0) {
                const bestPair = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
                if (bestPair) {
                    const priceUsd = Number(bestPair.priceUsd);
                    return {
                        price: priceUsd,
                        pair: bestPair,
                        priceChange24h: bestPair.priceChange?.h24 || 0
                    };
                }
            }
            return null;
        }, null);
    }
};
