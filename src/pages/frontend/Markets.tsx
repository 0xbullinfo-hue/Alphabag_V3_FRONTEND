import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  RefreshCw,
  Search,
  Star,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MarketService } from '../../services/MarketService';
import { dexscreenerService, DexPair } from '../../services/dexscreener';

const FALLBACK_DEX_PAIRS: DexPair[] = [
  {
    chainId: 'solana',
    dexId: 'raydium',
    url: 'https://dexscreener.com/solana/83vseozb3aawu9kwpkybft39z3jfdj4m1b5z3w18k8y4',
    pairAddress: '83vsEozB3aAWu9kWpKybFt39z3JfdJ4M1B5z3w18k8Y4',
    baseToken: { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'Bonk', symbol: 'BONK' },
    quoteToken: { address: 'So11111111111111111111111111111111111111112', name: 'Solana', symbol: 'SOL' },
    priceNative: '0.000138',
    priceUsd: '0.00002148',
    volume: { h24: 38240000, h1: 1840000 },
    priceChange: { h1: 2.14, h24: 14.85 },
    liquidity: { usd: 12480000 },
    fdv: 1890000000,
    txns: { h24: { buys: 14200, sells: 11950 } }
  },
  {
    chainId: 'ethereum',
    dexId: 'uniswap_v3',
    url: 'https://dexscreener.com/ethereum/0x11b815efb8f581194ae79006d24e0d814b7697f6',
    pairAddress: '0x11b815efb8f581194ae79006d24e0d814b7697f6',
    baseToken: { address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', name: 'Pepe', symbol: 'PEPE' },
    quoteToken: { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', name: 'Wrapped Ether', symbol: 'WETH' },
    priceNative: '0.00000000412',
    priceUsd: '0.00001015',
    volume: { h24: 51200000, h1: 3410000 },
    priceChange: { h1: 0.95, h24: 6.42 },
    liquidity: { usd: 28900000 },
    fdv: 4280000000,
    txns: { h24: { buys: 22100, sells: 19800 } }
  },
  {
    chainId: 'solana',
    dexId: 'raydium',
    url: 'https://dexscreener.com/solana/ep2wng94ueeqsrj1h1g4ffwukj118x954mupk4z',
    pairAddress: 'EP2Wng94UeeQsRj1h1g4fFWUkJ118X954MUpK4Z',
    baseToken: { address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', name: 'dogwifhat', symbol: 'WIF' },
    quoteToken: { address: 'So11111111111111111111111111111111111111112', name: 'Solana', symbol: 'SOL' },
    priceNative: '0.0162',
    priceUsd: '2.52',
    volume: { h24: 44100000, h1: 2950000 },
    priceChange: { h1: -1.25, h24: 8.35 },
    liquidity: { usd: 19400000 },
    fdv: 2520000000,
    txns: { h24: { buys: 18400, sells: 16200 } }
  },
  {
    chainId: 'bsc',
    dexId: 'pancakeswap_v3',
    url: 'https://dexscreener.com/bsc/0x58f876857a02d6762e0101bb5c46a8c1ed44dc16',
    pairAddress: '0x58f876857a02d6762e0101bb5c46a8c1ed44dc16',
    baseToken: { address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', name: 'Wrapped BNB', symbol: 'WBNB' },
    quoteToken: { address: '0x55d398326f99059ff775485246999027b3197955', name: 'Tether USD', symbol: 'USDT' },
    priceNative: '730.08',
    priceUsd: '730.08',
    volume: { h24: 88500000, h1: 4200000 },
    priceChange: { h1: 0.15, h24: 0.26 },
    liquidity: { usd: 64200000 },
    fdv: 97200000000,
    txns: { h24: { buys: 31200, sells: 29800 } }
  },
  {
    chainId: 'base',
    dexId: 'aerodrome',
    url: 'https://dexscreener.com/base/0x2f90ef59a22f77977eb71b12b59623e8f8fe0774',
    pairAddress: '0x2f90ef59a22f77977eb71b12b59623e8f8fe0774',
    baseToken: { address: '0x532f27101965dd16442e59d40670faf5ebb142e4', name: 'Brett', symbol: 'BRETT' },
    quoteToken: { address: '0x4200000000000000000000000000000000000006', name: 'Wrapped Ether', symbol: 'WETH' },
    priceNative: '0.0000418',
    priceUsd: '0.1025',
    volume: { h24: 18400000, h1: 1210000 },
    priceChange: { h1: 3.12, h24: 11.45 },
    liquidity: { usd: 9240000 },
    fdv: 1024000000,
    txns: { h24: { buys: 9200, sells: 7800 } }
  }
];

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  total_volume: number;
  circulating_supply?: number;
  category?: string;
  sparkline_in_7d?: { price: number[] };
}

// Fallback top 20 crypto dataset matching live CoinMarketCap standards
const FALLBACK_TOP_COINS: CoinMarketData[] = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    current_price: 82193.99,
    market_cap: 1650000000000,
    market_cap_rank: 1,
    price_change_percentage_1h_in_currency: 0.12,
    price_change_percentage_24h: 0.5,
    price_change_percentage_7d_in_currency: 3.42,
    total_volume: 42410000000,
    circulating_supply: 20100000,
    category: 'Layer 1',
    sparkline_in_7d: { price: [79000, 79500, 80200, 81000, 80800, 81900, 82193] },
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    current_price: 2453.15,
    market_cap: 299620000000,
    market_cap_rank: 2,
    price_change_percentage_1h_in_currency: 0.35,
    price_change_percentage_24h: 1.35,
    price_change_percentage_7d_in_currency: 5.12,
    total_volume: 19380000000,
    circulating_supply: 122140000,
    category: 'Layer 1',
    sparkline_in_7d: { price: [2320, 2350, 2380, 2410, 2390, 2430, 2453] },
  },
  {
    id: 'tether',
    symbol: 'usdt',
    name: 'Tether USDt',
    image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    current_price: 1.0,
    market_cap: 183850000000,
    market_cap_rank: 3,
    price_change_percentage_1h_in_currency: 0.01,
    price_change_percentage_24h: 0.01,
    price_change_percentage_7d_in_currency: 0.02,
    total_volume: 89590000000,
    circulating_supply: 184050000000,
    category: 'Stablecoins',
    sparkline_in_7d: { price: [1.0, 1.0, 0.999, 1.001, 1.0, 1.0, 1.0] },
  },
  {
    id: 'binancecoin',
    symbol: 'bnb',
    name: 'BNB',
    image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    current_price: 730.08,
    market_cap: 97220000000,
    market_cap_rank: 4,
    price_change_percentage_1h_in_currency: -0.05,
    price_change_percentage_24h: 0.26,
    price_change_percentage_7d_in_currency: 2.14,
    total_volume: 1680000000,
    circulating_supply: 133160000,
    category: 'Layer 1',
    sparkline_in_7d: { price: [710, 715, 722, 725, 721, 728, 730] },
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    current_price: 155.87,
    market_cap: 72390000000,
    market_cap_rank: 5,
    price_change_percentage_1h_in_currency: 0.42,
    price_change_percentage_24h: 2.44,
    price_change_percentage_7d_in_currency: 8.92,
    total_volume: 4090000000,
    circulating_supply: 469270000,
    category: 'Solana Ecosystem',
    sparkline_in_7d: { price: [142, 145, 148, 150, 149, 153, 155.87] },
  },
  {
    id: 'ripple',
    symbol: 'xrp',
    name: 'XRP',
    image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    current_price: 1.3397,
    market_cap: 84570000000,
    market_cap_rank: 6,
    price_change_percentage_1h_in_currency: 0.15,
    price_change_percentage_24h: 0.59,
    price_change_percentage_7d_in_currency: 4.12,
    total_volume: 3060000000,
    circulating_supply: 63130000000,
    category: 'Layer 1',
    sparkline_in_7d: { price: [1.28, 1.29, 1.31, 1.32, 1.31, 1.33, 1.3397] },
  },
  {
    id: 'usd-coin',
    symbol: 'usdc',
    name: 'USDC',
    image: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    current_price: 0.9997,
    market_cap: 72630000000,
    market_cap_rank: 7,
    price_change_percentage_1h_in_currency: 0.0,
    price_change_percentage_24h: -0.05,
    price_change_percentage_7d_in_currency: 0.01,
    total_volume: 22290000000,
    circulating_supply: 72650000000,
    category: 'Stablecoins',
    sparkline_in_7d: { price: [1.0, 1.0, 0.999, 1.0, 0.999, 1.0, 0.9997] },
  },
  {
    id: 'dogecoin',
    symbol: 'doge',
    name: 'Dogecoin',
    image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    current_price: 0.1814,
    market_cap: 26420000000,
    market_cap_rank: 8,
    price_change_percentage_1h_in_currency: -0.21,
    price_change_percentage_24h: -0.24,
    price_change_percentage_7d_in_currency: -1.82,
    total_volume: 1720000000,
    circulating_supply: 147050000000,
    category: 'Memes',
    sparkline_in_7d: { price: [0.186, 0.184, 0.182, 0.185, 0.181, 0.182, 0.1814] },
  },
  {
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    current_price: 0.723,
    market_cap: 25490000000,
    market_cap_rank: 9,
    price_change_percentage_1h_in_currency: 0.22,
    price_change_percentage_24h: 0.93,
    price_change_percentage_7d_in_currency: 3.45,
    total_volume: 545510000,
    circulating_supply: 36800000000,
    category: 'Layer 1',
    sparkline_in_7d: { price: [0.69, 0.70, 0.71, 0.715, 0.71, 0.72, 0.723] },
  },
  {
    id: 'pepe',
    symbol: 'pepe',
    name: 'Pepe',
    image: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.png',
    current_price: 0.00001048,
    market_cap: 4410000000,
    market_cap_rank: 10,
    price_change_percentage_1h_in_currency: 1.15,
    price_change_percentage_24h: 6.84,
    price_change_percentage_7d_in_currency: 14.28,
    total_volume: 1490000000,
    circulating_supply: 420690000000000,
    category: 'Memes',
    sparkline_in_7d: { price: [0.0000091, 0.0000093, 0.0000096, 0.0000099, 0.0000101, 0.0000103, 0.00001048] },
  },
  {
    id: 'sui',
    symbol: 'sui',
    name: 'Sui',
    image: 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
    current_price: 2.34,
    market_cap: 6720000000,
    market_cap_rank: 11,
    price_change_percentage_1h_in_currency: 0.88,
    price_change_percentage_24h: 5.42,
    price_change_percentage_7d_in_currency: 12.18,
    total_volume: 820000000,
    circulating_supply: 2870000000,
    category: 'Layer 1',
    sparkline_in_7d: { price: [2.08, 2.12, 2.18, 2.22, 2.25, 2.3, 2.34] },
  },
  {
    id: 'avalanche-2',
    symbol: 'avax',
    name: 'Avalanche',
    image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
    current_price: 24.85,
    market_cap: 10120000000,
    market_cap_rank: 12,
    price_change_percentage_1h_in_currency: 0.18,
    price_change_percentage_24h: 1.95,
    price_change_percentage_7d_in_currency: 6.12,
    total_volume: 410000000,
    circulating_supply: 407000000,
    category: 'Layer 1',
    sparkline_in_7d: { price: [23.1, 23.5, 23.8, 24.1, 24.2, 24.6, 24.85] },
  },
  {
    id: 'chainlink',
    symbol: 'link',
    name: 'Chainlink',
    image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    current_price: 13.82,
    market_cap: 8520000000,
    market_cap_rank: 13,
    price_change_percentage_1h_in_currency: 0.11,
    price_change_percentage_24h: 1.15,
    price_change_percentage_7d_in_currency: 4.85,
    total_volume: 380000000,
    circulating_supply: 626000000,
    category: 'DeFi',
    sparkline_in_7d: { price: [13.1, 13.3, 13.4, 13.6, 13.5, 13.7, 13.82] },
  },
  {
    id: 'shiba-inu',
    symbol: 'shib',
    name: 'Shiba Inu',
    image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
    current_price: 0.0000182,
    market_cap: 10720000000,
    market_cap_rank: 14,
    price_change_percentage_1h_in_currency: -0.15,
    price_change_percentage_24h: 0.85,
    price_change_percentage_7d_in_currency: 2.15,
    total_volume: 520000000,
    circulating_supply: 589000000000000,
    category: 'Memes',
    sparkline_in_7d: { price: [0.0000176, 0.0000178, 0.000018, 0.0000181, 0.000018, 0.0000181, 0.0000182] },
  },
  {
    id: 'near',
    symbol: 'near',
    name: 'NEAR Protocol',
    image: 'https://assets.coingecko.com/coins/images/10365/large/near.png',
    current_price: 5.32,
    market_cap: 6470000000,
    market_cap_rank: 15,
    price_change_percentage_1h_in_currency: 1.25,
    price_change_percentage_24h: 10.82,
    price_change_percentage_7d_in_currency: 18.5,
    total_volume: 1490000000,
    circulating_supply: 1210000000,
    category: 'AI & Big Data',
    sparkline_in_7d: { price: [4.45, 4.6, 4.8, 4.95, 5.05, 5.2, 5.32] },
  },
];

const CATEGORIES = [
  'All Cryptos',
  'Layer 1',
  'DeFi',
  'Memes',
  'AI & Big Data',
  'Solana Ecosystem',
  'Stablecoins',
];

export const Markets: React.FC = () => {
  const [coins, setCoins] = useState<CoinMarketData[]>(FALLBACK_TOP_COINS);
  const [isFallback, setIsFallback] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Cryptos');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(['bitcoin', 'ethereum', 'solana']));
  const [telemetry, setTelemetry] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const navigate = useNavigate();

  const fetchMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [data, globalOverview] = await Promise.all([MarketService.getMarketData([], false), MarketService.getGlobalOverview().catch(() => null)]); if (globalOverview) setTelemetry(globalOverview);
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      if (list && list.length > 0) {
        // Merge with our enriched category tags
        const enriched = list.map((c: any) => {
          const match = FALLBACK_TOP_COINS.find((f) => f.id === c.id || f.symbol === c.symbol?.toLowerCase());
          return {
            ...c,
            category: match?.category || 'Layer 1',
            sparkline_in_7d: c.sparkline_in_7d || match?.sparkline_in_7d,
          };
        });
        setCoins(enriched);
        setIsFallback(false);
        setLastUpdated(new Date());
      } else {
        setIsFallback(true);
      }
    } catch {
      // Keep rich fallback dataset active
      setIsFallback(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const [dexPairs, setDexPairs] = useState<DexPair[]>(FALLBACK_DEX_PAIRS);
  const [isFetchingDex, setIsFetchingDex] = useState(false);

  const fetchDexMarketPairs = useCallback(async () => {
    setIsFetchingDex(true);
    try {
      const topSymbols = ['SOL', 'PEPE', 'BONK', 'WIF', 'ETH', 'BRETT', 'SUI', 'RENDER'];
      const results = await Promise.allSettled(topSymbols.map((s) => dexscreenerService.search(s)));
      const pairs: DexPair[] = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value) && res.value[0]) {
          pairs.push(res.value[0]);
        }
      });
      if (pairs.length > 0) {
        pairs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
        setDexPairs(pairs);
      }
    } catch (err) {
      console.warn('[Markets] DexScreener fetch error:', err);
    } finally {
      setIsFetchingDex(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory === 'DEX Live') {
      fetchDexMarketPairs();
    }
  }, [selectedCategory, fetchDexMarketPairs]);

  const toggleWatchlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredCoins = useMemo(() => {
    let list = coins;
    if (selectedCategory === 'Watchlist') {
      list = list.filter((c) => watchlist.has(c.id));
    } else if (selectedCategory !== 'All Cryptos' && selectedCategory !== 'DEX Live') {
      list = list.filter((c) => c.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }
    return list;
  }, [coins, selectedCategory, searchQuery, watchlist]);

  const filteredDexPairs = useMemo(() => {
    if (!searchQuery.trim()) return dexPairs;
    const q = searchQuery.toLowerCase().trim();
    return dexPairs.filter(
      (p) =>
        p.baseToken?.name?.toLowerCase().includes(q) ||
        p.baseToken?.symbol?.toLowerCase().includes(q) ||
        p.chainId?.toLowerCase().includes(q) ||
        p.dexId?.toLowerCase().includes(q)
    );
  }, [dexPairs, searchQuery]);

  const fmt = (val: number | undefined) => {
    if (!val || isNaN(val)) return '—';
    if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T';
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(1) + 'K';
    return '$' + val.toFixed(2);
  };

  const fmtSupply = (val: number | undefined, symbol: string) => {
    if (!val || isNaN(val)) return '–';
    if (val >= 1e12) return (val / 1e12).toFixed(2) + 'T ' + symbol.toUpperCase();
    if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B ' + symbol.toUpperCase();
    if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M ' + symbol.toUpperCase();
    return val.toLocaleString() + ' ' + symbol.toUpperCase();
  };

  return (
    <div className="w-full space-y-3 pb-8 transition-opacity">
      {/* ── CoinMarketCap Global Crypto Metrics Ticker Bar ── */}
      <div className="bg-[#14171D] border border-[#2B313A] rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-gray-300 gap-y-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px]">
          <div>
            <span className="text-gray-400">Cryptos: </span>
            <span className="text-alphabag-yellow font-bold">{telemetry?.activeCryptos ? Number(telemetry.activeCryptos).toLocaleString() : '—'}</span>
          </div>
          <div>
            <span className="text-gray-400">Market Cap: </span>
            <span className="text-white font-semibold">{telemetry?.marketCap ? fmt(telemetry.marketCap) : "—"}</span>
            {telemetry?.marketCapChange24h != null ? (
              <span className={"ml-1 font-semibold " + (telemetry.marketCapChange24h >= 0 ? "text-[#0ECB81]" : "text-rose-400")}>
                {telemetry.marketCapChange24h >= 0 ? "+" + telemetry.marketCapChange24h.toFixed(2) + "%" : telemetry.marketCapChange24h.toFixed(2) + "%"}
              </span>
            ) : null}
          </div>
          <div>
            <span className="text-gray-400">24h Vol: </span>
            <span className="text-white font-semibold">{telemetry?.volume ? fmt(telemetry.volume) : "—"}</span>
          </div>
          <div>
            <span className="text-gray-400">Dominance: </span>
            <span className="text-white font-semibold">BTC: {telemetry?.btcDominance ? telemetry.btcDominance.toFixed(1) + "%" : "—"}</span>
            <span className="text-gray-400 mx-1">·</span>
            <span className="text-white font-semibold">ETH: {telemetry?.ethDominance ? telemetry.ethDominance.toFixed(1) + "%" : "—"}</span>
          </div>
          <div>
            <span className="text-gray-400">ETH Gas: </span>
            <span className="text-[#0ECB81] font-semibold">{telemetry?.gasPriceGwei ? telemetry.gasPriceGwei + " Gwei" : "—"}</span>
          </div>
          <div>
            <span className="text-gray-400">Fear & Greed: </span>
            <span className="text-[#0ECB81] font-bold">{telemetry?.fearAndGreed != null ? telemetry.fearAndGreed : "—"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {isFallback && (
            <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-[#202630] text-gray-300 border border-[#2B313A]">
              Cached • offline feed
            </span>
          )}
          <button
            onClick={() => fetchMarketData()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#202630] hover:bg-[#2B313A] text-alphabag-yellow font-semibold transition-colors"
          >
            <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live Feed'}</span>
          </button>
          <span className="text-gray-400">{lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ── Main Header Title & Search ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#181A20] border border-[#2B313A] rounded-lg p-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <span>Today's Cryptocurrency Prices by Market Cap</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {telemetry?.marketCap ? (
              <>
                Global market capitalization is <span className="text-white font-semibold">{fmt(telemetry.marketCap)}</span>
                {telemetry.marketCapChange24h != null ? (
                  <>
                    , {telemetry.marketCapChange24h >= 0 ? 'an increase of ' : 'a decrease of '}
                    <span className={telemetry.marketCapChange24h >= 0 ? 'text-[#0ECB81] font-semibold' : 'text-[#F6465D] font-semibold'}>
                      {Math.abs(telemetry.marketCapChange24h).toFixed(2)}%
                    </span> over the last day.
                  </>
                ) : '.'}
              </>
            ) : (
              'Real-time cryptocurrency prices, market capitalization, volume, and supply telemetry.'
            )}
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search coin, symbol, or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B0E11] border border-[#2B313A] focus:border-alphabag-yellow/60 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 outline-none transition-colors font-mono"
          />
        </div>
      </div>

      {/* ── CoinMarketCap Category Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCategory('Watchlist')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
            selectedCategory === 'Watchlist'
              ? 'bg-alphabag-yellow text-[#0B0E11] shadow'
              : 'bg-[#181A20] text-gray-300 hover:text-white hover:bg-[#202630] border border-[#2B313A]'
          }`}
        >
          <Star size={12} className={selectedCategory === 'Watchlist' ? 'fill-[#0B0E11]' : ''} />
          <span>Watchlist ({watchlist.size})</span>
        </button>

        <button
          onClick={() => setSelectedCategory('DEX Live')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
            selectedCategory === 'DEX Live'
              ? 'bg-alphabag-yellow text-[#0B0E11] shadow'
              : 'bg-[#181A20] text-alphabag-yellow/90 hover:text-alphabag-yellow hover:bg-[#202630] border border-alphabag-yellow/30'
          }`}
        >
          <Zap size={12} className={selectedCategory === 'DEX Live' ? 'fill-[#0B0E11]' : ''} />
          <span>DEX Live</span>
        </button>

        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? 'bg-[#202630] text-alphabag-yellow border border-[#2B313A] shadow-sm ring-1 ring-alphabag-yellow/20'
                  : 'bg-[#181A20] text-gray-400 hover:text-white hover:bg-[#202630] border border-[#2B313A]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {selectedCategory === 'DEX Live' ? (
        <div className="rounded-lg border border-[#2B313A] bg-[#181A20] overflow-hidden shadow-xl">
          <div className="p-3 bg-[#14171D] border-b border-[#2B313A] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-alphabag-yellow" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">Live On-Chain Liquidity & DEX Screener</span>
              {isFetchingDex && <span className="text-[11px] text-alphabag-yellow font-mono animate-pulse">Syncing...</span>}
            </div>
            <button
              type="button"
              onClick={fetchDexMarketPairs}
              disabled={isFetchingDex}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#181A20] hover:bg-[#202630] text-gray-300 text-[11px] font-semibold border border-[#2B313A]"
            >
              <RefreshCw size={11} className={isFetchingDex ? 'animate-spin' : ''} />
              <span>Refresh Pools</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#14171D] border-b border-[#2B313A] text-[11px] text-gray-400 font-semibold tracking-wider uppercase">
                <tr>
                  <th className="py-3 px-3 pl-4 w-10 text-center">⭐</th>
                  <th className="py-3 px-3 text-left">Pair / Token</th>
                  <th className="py-3 px-3 text-left">DEX & Chain</th>
                  <th className="py-3 px-3 text-right">Price</th>
                  <th className="py-3 px-3 text-right">1h %</th>
                  <th className="py-3 px-3 text-right">24h %</th>
                  <th className="py-3 px-3 text-right">24h Volume</th>
                  <th className="py-3 px-3 text-right">Liquidity Depth</th>
                  <th className="py-3 px-3 text-right hidden lg:table-cell">24h Txns</th>
                  <th className="py-3 px-4 text-center">Live DEX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B313A] text-xs font-mono">
                {filteredDexPairs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-alphabag-subtext font-sans">No DEX pairs match your filter.</td>
                  </tr>
                ) : filteredDexPairs.map((pair, idx) => {
                  const isStarred = watchlist.has(pair.pairAddress);
                  const pch1 = pair.priceChange?.h1 ?? 0;
                  const pch24 = pair.priceChange?.h24 ?? 0;
                  const isUp24 = pch24 >= 0;

                  return (
                    <tr
                      key={pair.pairAddress || idx}
                      className="hover:bg-[#202630]/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 pl-4 text-center">
                        <button
                          type="button"
                          aria-label={`${isStarred ? 'Remove' : 'Add'} ${pair.baseToken?.symbol} from watchlist`}
                          aria-pressed={isStarred}
                          onClick={(e) => toggleWatchlist(pair.pairAddress, e)}
                          className="inline-flex rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-alphabag-yellow"
                        >
                          <Star
                            size={13}
                            aria-hidden="true"
                            className={`transition-colors inline-block ${
                              isStarred ? 'text-alphabag-yellow fill-alphabag-yellow' : 'text-gray-600 hover:text-gray-300'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold text-white text-xs group-hover:text-alphabag-yellow transition-colors flex items-center gap-1.5">
                              <span>{pair.baseToken?.name || pair.baseToken?.symbol}</span>
                              <span className="text-[11px] text-gray-400">/{pair.quoteToken?.symbol}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              {pair.pairAddress ? `${pair.pairAddress.slice(0, 6)}...${pair.pairAddress.slice(-4)}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-[#202630] text-alphabag-yellow border border-[#2B313A]">
                          {pair.chainId} • {pair.dexId}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-white num">
                        ${pair.priceUsd ? Number(pair.priceUsd) < 0.01 ? Number(pair.priceUsd).toFixed(6) : Number(pair.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className={`py-3 px-3 text-right font-semibold num ${pch1 >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {pch1 >= 0 ? '+' : ''}{pch1.toFixed(2)}%
                      </td>
                      <td className={`py-3 px-3 text-right font-semibold num ${isUp24 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {isUp24 ? '+' : ''}{pch24.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right text-gray-300 font-semibold num">
                        {fmt(pair.volume?.h24)}
                      </td>
                      <td className="py-3 px-3 text-right text-alphabag-green font-semibold num">
                        {fmt(pair.liquidity?.usd)}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-400 hidden lg:table-cell num">
                        {pair.txns?.h24 ? `${pair.txns.h24.buys}B / ${pair.txns.h24.sells}S` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={pair.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold uppercase bg-alphabag-yellow/10 text-alphabag-yellow hover:bg-alphabag-yellow hover:text-[#0B0E11] transition-all"
                          title="Open Chart on DexScreener"
                        >
                          Chart <ExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── CoinMarketCap Institutional Data Table ── */
        <div className="rounded-lg border border-[#2B313A] bg-[#181A20] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#14171D] border-b border-[#2B313A] text-[11px] text-gray-400 font-semibold tracking-wider uppercase">
              <tr>
                <th className="py-3 px-3 pl-4 w-10 text-center">⭐</th>
                <th className="py-3 px-2 w-10 text-center">#</th>
                <th className="py-3 px-3 text-left">Name</th>
                <th className="py-3 px-3 text-right">Price</th>
                <th className="py-3 px-3 text-right">1h %</th>
                <th className="py-3 px-3 text-right">24h %</th>
                <th className="py-3 px-3 text-right">7d %</th>
                <th className="py-3 px-3 text-right">Market Cap</th>
                <th className="py-3 px-3 text-right">24h Volume</th>
                <th className="py-3 px-3 text-right hidden lg:table-cell">Circulating Supply</th>
                <th className="py-3 px-4 text-center hidden xl:table-cell w-32">Last 7 Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B313A] text-xs font-mono">
              {filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-alphabag-subtext font-sans">No coins match your filter.</td>
                </tr>
              ) : filteredCoins.map((coin) => {
                const isStarred = watchlist.has(coin.id);
                const pch1h = coin.price_change_percentage_1h_in_currency ?? 0;
                const pch24h = coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h ?? 0;
                const pch7d = coin.price_change_percentage_7d_in_currency ?? 0;
                const isUp24 = pch24h >= 0;
                const isUp7d = pch7d >= 0;

                return (
                  <tr
                    key={coin.id}
                    onClick={() => navigate(`/markets/${coin.id}`)}
                    className="hover:bg-[#202630]/70 transition-colors cursor-pointer group"
                  >
                    {/* Star Watchlist */}
                    <td className="py-3 px-3 pl-4 text-center">
                      <button type="button" aria-label={`${isStarred ? 'Remove' : 'Add'} ${coin.name} from watchlist`} aria-pressed={isStarred} onClick={(e) => toggleWatchlist(coin.id, e)} className="inline-flex rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-alphabag-yellow">
                        <Star
                          size={13}
                          aria-hidden="true"
                          className={`transition-colors inline-block ${
                            isStarred ? 'text-alphabag-yellow fill-alphabag-yellow' : 'text-gray-600 hover:text-gray-300'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Rank */}
                    <td className="py-3 px-2 text-center text-gray-400 font-medium">
                      {coin.market_cap_rank}
                    </td>

                    {/* Coin Name & Symbol */}
                    <td className="py-3 px-3">
                      <Link to={`/markets/${coin.id}`} aria-label={`View ${coin.name} market details`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2.5 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-alphabag-yellow">
                        <img
                          src={coin.image}
                          alt={coin.name}
                          className="w-6 h-6 rounded-full shrink-0 bg-[#0B0E11] p-0.5"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <span className="font-bold text-white text-xs tracking-tight group-hover:text-alphabag-yellow transition-colors font-sans">
                            {coin.name}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-400 uppercase font-sans">
                            {coin.symbol}
                          </span>
                        </div>
                      </Link>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 text-right font-bold text-white">
                      ${coin.current_price < 1
                        ? coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 })
                        : coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* 1h % */}
                    <td className={`py-3 px-3 text-right font-semibold ${pch1h >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {pch1h >= 0 ? '+' : ''}{pch1h.toFixed(2)}%
                    </td>

                    {/* 24h % */}
                    <td className={`py-3 px-3 text-right font-semibold ${isUp24 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      <div className="flex items-center justify-end gap-0.5">
                        {isUp24 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                        <span>{Math.abs(pch24h).toFixed(2)}%</span>
                      </div>
                    </td>

                    {/* 7d % */}
                    <td className={`py-3 px-3 text-right font-semibold ${isUp7d ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {isUp7d ? '+' : ''}{pch7d.toFixed(2)}%
                    </td>

                    {/* Market Cap */}
                    <td className="py-3 px-3 text-right font-semibold text-white">
                      {fmt(coin.market_cap)}
                    </td>

                    {/* 24h Volume */}
                    <td className="py-3 px-3 text-right text-gray-300">
                      {fmt(coin.total_volume)}
                    </td>

                    {/* Circulating Supply */}
                    <td className="py-3 px-3 text-right text-gray-400 hidden lg:table-cell">
                      {fmtSupply(coin.circulating_supply, coin.symbol)}
                    </td>

                    {/* 7d Sparkline Chart */}
                    <td className="py-3 px-4 hidden xl:table-cell">
                      {coin.sparkline_in_7d?.price && coin.sparkline_in_7d.price.length > 1 ? (
                        <svg viewBox="0 0 100 28" className="w-[100px] h-[26px] mx-auto overflow-visible" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke={isUp7d ? '#0ECB81' : '#F6465D'}
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={coin.sparkline_in_7d.price.map((p, i, arr) => {
                              const max = Math.max(...arr);
                              const min = Math.min(...arr);
                              const range = max - min || 1;
                              const x = (i / (arr.length - 1)) * 100;
                              const y = 26 - (((p - min) / range) * 24);
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            }).join(' ')}
                          />
                        </svg>
                      ) : (
                        <div className="w-[80px] h-[20px] mx-auto bg-[#202630] rounded" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};

export default Markets;
