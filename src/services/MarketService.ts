import { ONE_MINUTE } from './constants';
import { API_CONFIG, DATA_SOURCE_CONFIG } from './config';

const API_BASE = 'https://api.coingecko.com/api/v3';
const MARKET_PROXY_BASE = API_CONFIG.MARKET_PROXY_BASE_URL;
// Note: Free tier has rate limits (approx 10-30 calls/min)

interface CacheItem {
    data: any;
    timestamp: number;
}

const cache: Record<string, CacheItem> = {};
const CACHE_DURATION = 2 * ONE_MINUTE; // Cache for 2 minutes to be safe

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
        if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
            return cache[key].data;
        }

        try {
            const data = await fetchJson(`${API_BASE}/simple/price?ids=${ids.join(',')}&vs_currencies=${vs_currencies}&include_24hr_change=true`);

            cache[key] = { data, timestamp: Date.now() };
            return data;
        } catch (error) {
            console.error("MarketService Error:", error);
            return null; // Fallback to handle gracefully
        }
    },

    /**
     * Get rich data for specific coins (Market Cards)
     * If ids is empty, fetches top 100 coins
     */
    getMarketData: async (ids: string[], sparkline = false) => {
        const key = `market_${ids.join('_')}_${sparkline}`;
        if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
            return cache[key].data;
        }

        try {
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

            cache[key] = { data, timestamp: Date.now() };
            return data;
        } catch (error) {
            console.error("MarketService Error:", error);
            return [];
        }
    },

    /**
     * Search for coins
     */
    searchCoins: async (query: string) => {
        // No cache for search usually, or short cache
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
        if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
            return cache[key].data;
        }

        try {
            const data = await fetchJson(`${API_BASE}/simple/token_price/${platform}?contract_addresses=${contractAddresses.join(',')}&vs_currencies=usd`);

            cache[key] = { data, timestamp: Date.now() };
            return data;
        } catch (error) {
            console.warn("MarketService Token Price Fetch Error:", error);
            return {};
        }
    },

    /**
     * Get Token Price from DexScreener (Real-time for unlisted tokens)
     * Supports multi-chain by address -- usually returns pairs for all chains where token exists
     */
    getDexTokenPrice: async (tokenAddress: string) => {
        // Cache key for DexScreener
        const key = `dex_price_${tokenAddress}`;
        if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
            return cache[key].data;
        }

        try {
            // DexScreener endpoint: https://api.dexscreener.com/latest/dex/tokens/{tokenAddresses}
            const data = await fetchJson(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
            if (data.pairs && data.pairs.length > 0) {
                // Find best pair (highest liquidity USD)
                // Filter out low liquidity spam if needed, or just take top
                const bestPair = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

                if (bestPair) {
                    const priceUsd = Number(bestPair.priceUsd);
                    const result = {
                        price: priceUsd,
                        pair: bestPair,
                        priceChange24h: bestPair.priceChange?.h24 || 0
                    };

                    // Cache result
                    cache[key] = { data: result, timestamp: Date.now() };
                    return result;
                }
            }
            return null;
        } catch (e) {
            console.warn("DexScreener Fetch Error", e);
            return null;
        }
    }
};
