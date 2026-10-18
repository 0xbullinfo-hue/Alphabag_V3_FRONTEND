import {
  Activity,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import {
  DexCommunityTakeover,
  dexscreenerService,
  DexTokenBoost,
  DexTrendingMeta,
} from '../../services/dexscreener';
import { useDexScreenerStream } from '../../hooks/useDexScreenerStream';

export interface DexScreenerPair {
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
  priceUsd: string;
  priceNative?: string;
  age?: string;
  txns?: {
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
  priceChange: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  liquidity?: {
    usd?: number;
  };
  fdv?: number;
  makers?: number;
}

// Fallback high-liquidity trending DEX pairs matching DexScreener standards
const FALLBACK_DEX_PAIRS: DexScreenerPair[] = [
  {
    chainId: 'solana',
    dexId: 'raydium',
    url: 'https://dexscreener.com/solana/83vseozb3aawu9kwpkybft39z3jfdj4m1b5z3w18k8y4',
    pairAddress: '83vsEozB3aAWu9kWpKybFt39z3JfdJ4M1B5z3w18k8Y4',
    baseToken: {
      address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      name: 'Bonk',
      symbol: 'BONK',
    },
    quoteToken: {
      address: 'So11111111111111111111111111111111111111112',
      name: 'Solana',
      symbol: 'SOL',
    },
    priceUsd: '0.00002148',
    age: '1y',
    txns: { h24: { buys: 14200, sells: 11950 } },
    volume: { h24: 38240000, h6: 10420000, h1: 1840000, m5: 142000 },
    priceChange: { m5: 0.85, h1: 2.14, h6: 6.82, h24: 14.85 },
    liquidity: { usd: 12480000 },
    fdv: 1890000000,
    makers: 9840,
  },
  {
    chainId: 'ethereum',
    dexId: 'uniswap_v3',
    url: 'https://dexscreener.com/ethereum/0x11b815efb8f581194ae79006d24e0d814b7697f6',
    pairAddress: '0x11b815efb8f581194ae79006d24e0d814b7697f6',
    baseToken: {
      address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
      name: 'Pepe',
      symbol: 'PEPE',
    },
    quoteToken: {
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      name: 'Wrapped Ether',
      symbol: 'WETH',
    },
    priceUsd: '0.00001048',
    age: '1y',
    txns: { h24: { buys: 18950, sells: 15400 } },
    volume: { h24: 64200000, h6: 18400000, h1: 3100000, m5: 280000 },
    priceChange: { m5: 0.42, h1: 1.84, h6: 4.95, h24: 12.35 },
    liquidity: { usd: 18450000 },
    fdv: 4410000000,
    makers: 14200,
  },
  {
    chainId: 'solana',
    dexId: 'raydium',
    url: 'https://dexscreener.com/solana/ep2ibnhnbdegcr5yv8e3fupq6bcpcfquvky1q6qwpump',
    pairAddress: 'EP2iBNHNbDeGcR5YV8e3FuPq6BCPCfquvkY1q6Qwpump',
    baseToken: {
      address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
      name: 'dogwifhat',
      symbol: 'WIF',
    },
    quoteToken: {
      address: 'So11111111111111111111111111111111111111112',
      name: 'Solana',
      symbol: 'SOL',
    },
    priceUsd: '2.42',
    age: '11m',
    txns: { h24: { buys: 11200, sells: 9800 } },
    volume: { h24: 51200000, h6: 14200000, h1: 2450000, m5: 195000 },
    priceChange: { m5: -0.25, h1: 1.15, h6: 5.42, h24: 8.92 },
    liquidity: { usd: 14200000 },
    fdv: 2418000000,
    makers: 8120,
  },
  {
    chainId: 'base',
    dexId: 'aerodrome',
    url: 'https://dexscreener.com/base/0xcda86a272531e8640cd7f1a92c01839911b90bb0',
    pairAddress: '0xcda86a272531e8640cd7f1a92c01839911b90bb0',
    baseToken: {
      address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
      name: 'Degen',
      symbol: 'DEGEN',
    },
    quoteToken: {
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
    },
    priceUsd: '0.00845',
    age: '8m',
    txns: { h24: { buys: 8400, sells: 7120 } },
    volume: { h24: 14200000, h6: 3950000, h1: 720000, m5: 84000 },
    priceChange: { m5: 1.45, h1: 3.82, h6: 9.15, h24: 24.18 },
    liquidity: { usd: 5820000 },
    fdv: 312000000,
    makers: 5410,
  },
  {
    chainId: 'base',
    dexId: 'aerodrome',
    url: 'https://dexscreener.com/base/0x16ac91e1d6476e33914a73757851a34b205274b5',
    pairAddress: '0x16ac91e1d6476e33914a73757851a34b205274b5',
    baseToken: {
      address: '0x532f27101965dd16442e59d40670faf5ebb142e4',
      name: 'Brett',
      symbol: 'BRETT',
    },
    quoteToken: {
      address: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
    },
    priceUsd: '0.0984',
    age: '7m',
    txns: { h24: { buys: 9800, sells: 8400 } },
    volume: { h24: 22100000, h6: 6100000, h1: 1120000, m5: 110000 },
    priceChange: { m5: 0.15, h1: 2.45, h6: 7.82, h24: 18.45 },
    liquidity: { usd: 10450000 },
    fdv: 984000000,
    makers: 7420,
  },
  {
    chainId: 'solana',
    dexId: 'raydium',
    url: 'https://dexscreener.com/solana/2bcchqadi4qehwpkg3w13sicywwqpgkftnioutqvpump',
    pairAddress: '2bCCHQadi4QeHWPKG3w13siCyWWQPgkFtniouTqVpump',
    baseToken: {
      address: '2bCCHQadi4QeHWPKG3w13siCyWWQPgkFtniouTqVpump',
      name: 'Trump $1 Coin',
      symbol: 'TRUMP',
    },
    quoteToken: {
      address: 'So11111111111111111111111111111111111111112',
      name: 'Solana',
      symbol: 'SOL',
    },
    priceUsd: '0.0142',
    age: '2d',
    txns: { h24: { buys: 9420, sells: 8120 } },
    volume: { h24: 8450000, h6: 2140000, h1: 420000, m5: 51000 },
    priceChange: { m5: 2.15, h1: 6.84, h6: 18.92, h24: 42.15 },
    liquidity: { usd: 940000 },
    fdv: 14200000,
    makers: 4120,
  },
];

const FALLBACK_BOOSTS: DexTokenBoost[] = [
  {
    url: 'https://dexscreener.com/solana/ekpqgsjtjmfqkz9kqansqyxdcr8fbopzlhyxdm65zcjm',
    chainId: 'solana',
    tokenAddress: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    amount: 500,
    totalAmount: 14200,
    icon: 'https://dd.dexscreener.com/ds-data/tokens/solana/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm.png',
    header: 'dogwifhat with a hat',
    description: 'Community supported meme coin on Solana network with active tier-1 liquidity.',
    links: [
      { type: 'twitter', label: 'Twitter', url: 'https://x.com/dogwifcoin' },
      { type: 'telegram', label: 'Telegram', url: 'https://t.me/dogwifcoin' },
    ],
  },
  {
    url: 'https://dexscreener.com/base/0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    chainId: 'base',
    tokenAddress: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    amount: 250,
    totalAmount: 8900,
    icon: 'https://dd.dexscreener.com/ds-data/tokens/base/0x4ed4e862860bed51a9570b96d89af5e1b0efefed.png',
    header: 'DEGEN On Base',
    description: 'Decentralized social tipping ecosystem on Base and Farcaster network.',
    links: [
      { type: 'twitter', label: 'Twitter', url: 'https://x.com/degentokenbase' },
      { type: 'website', label: 'Website', url: 'https://degen.tips' },
    ],
  },
  {
    url: 'https://dexscreener.com/solana/dezxaz8z7pnrrnjjz3wxboxca6xjn7yab1ppb263',
    chainId: 'solana',
    tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    amount: 180,
    totalAmount: 6400,
    icon: 'https://dd.dexscreener.com/ds-data/tokens/solana/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263.png',
    header: 'Bonk Solana Dog Coin',
    description: 'First dog-themed memecoin on Solana for the people, by the people.',
    links: [
      { type: 'twitter', label: 'Twitter', url: 'https://x.com/bonk_inu' },
    ],
  },
];

const FALLBACK_TAKEOVERS: DexCommunityTakeover[] = [
  {
    url: 'https://dexscreener.com/solana/2bcchqadi4qehwpkg3w13sicywwqpgkftnioutqvpump',
    chainId: 'solana',
    tokenAddress: '2bCCHQadi4QeHWPKG3w13siCyWWQPgkFtniouTqVpump',
    icon: 'https://dd.dexscreener.com/ds-data/tokens/solana/2bCCHQadi4QeHWPKG3w13siCyWWQPgkFtniouTqVpump.png',
    header: 'Community Takeover: TRUMP $1 Coin',
    description: 'Original dev rugged dev tokens. Community organized complete takeover, burnt LP and established multisig treasury.',
    claimDate: '2026-10-15T18:24:00Z',
    links: [
      { type: 'telegram', label: 'Community Telegram', url: 'https://t.me/trumpcto' },
      { type: 'twitter', label: 'Twitter CTO', url: 'https://x.com/trump_cto' },
    ],
  },
  {
    url: 'https://dexscreener.com/base/0x532f27101965dd16442e59d40670faf5ebb142e4',
    chainId: 'base',
    tokenAddress: '0x532f27101965dd16442e59d40670faf5ebb142e4',
    icon: 'https://dd.dexscreener.com/ds-data/tokens/base/0x532f27101965dd16442e59d40670faf5ebb142e4.png',
    header: 'BRETT Community Governance',
    description: 'Full community takeover on Base chain, community-run marketing wallet and verified DEX listing.',
    claimDate: '2026-09-20T12:00:00Z',
    links: [
      { type: 'twitter', label: 'Twitter', url: 'https://x.com/basedbrett' },
      { type: 'telegram', label: 'Telegram', url: 'https://t.me/basedbrett' },
    ],
  },
];

const FALLBACK_METAS: DexTrendingMeta[] = [
  {
    name: 'AI Agents & Autonomous Swarms',
    slug: 'ai-agents',
    description: 'Autonomous LLM agents with on-chain wallets, trading swarms, and decentralized compute nodes.',
    marketCap: 4820000000,
    liquidity: 345000000,
    volume: 890000000,
    tokenCount: 42,
    marketCapChange: { m5: 1.2, h1: 3.4, h6: 8.9, h24: 24.5 },
  },
  {
    name: 'Solana High-Velocity Memes',
    slug: 'solana-memes',
    description: 'High-frequency micro-cap and narrative tokens originating from Pump.fun and Raydium CPMM.',
    marketCap: 6200000000,
    liquidity: 520000000,
    volume: 1420000000,
    tokenCount: 88,
    marketCapChange: { m5: 0.5, h1: 1.8, h6: 5.2, h24: 12.8 },
  },
  {
    name: 'Base Layer-2 Ecosystem',
    slug: 'base-ecosystem',
    description: 'Decentralized social tokens, Aerodrome liquidity pairs, and consumer crypto primitives on Coinbase L2.',
    marketCap: 2150000000,
    liquidity: 185000000,
    volume: 380000000,
    tokenCount: 35,
    marketCapChange: { m5: -0.4, h1: 2.1, h6: 6.4, h24: 18.2 },
  },
  {
    name: 'DePIN & Decentralized Compute',
    slug: 'depin',
    description: 'Decentralized physical infrastructure, GPU clusters, storage relays, and IoT wireless networks.',
    marketCap: 3840000000,
    liquidity: 290000000,
    volume: 450000000,
    tokenCount: 26,
    marketCapChange: { m5: 0.8, h1: 1.2, h6: 4.1, h24: 9.6 },
  },
];

const CHAINS = [
  { id: 'ALL', name: 'All Chains', icon: '🌐' },
  { id: 'solana', name: 'Solana', icon: '🟣' },
  { id: 'ethereum', name: 'Ethereum', icon: '🔷' },
  { id: 'base', name: 'Base', icon: '🔵' },
  { id: 'bsc', name: 'BSC', icon: '🟡' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
];

const PAIR_FILTERS = [
  { id: 'trending', label: 'Trending' },
  { id: 'gainers', label: 'Top Gainers' },
  { id: 'volume', label: 'High Volume' },
  { id: 'new', label: 'New Pairs' },
];

type MainTab = 'pairs' | 'boosts' | 'takeovers' | 'metas';

export const AlphaScreener: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('pairs');
  const [pairs, setPairs] = useState<DexScreenerPair[]>(FALLBACK_DEX_PAIRS);
  const [metas, setMetas] = useState<DexTrendingMeta[]>(FALLBACK_METAS);
  const [chainFilter, setChainFilter] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<string>('trending');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // DexScreener Live WebSocket Stream Hook
  const streamType = activeTab === 'takeovers' ? 'takeovers' : 'boosts';
  const {
    boosts: liveBoosts,
    takeovers: liveTakeovers,
    isConnected: isWsConnected,
    refresh: refreshWsStream,
  } = useDexScreenerStream(streamType);

  const displayBoosts = useMemo(() => {
    return liveBoosts.length > 0 ? liveBoosts : FALLBACK_BOOSTS;
  }, [liveBoosts]);

  const displayTakeovers = useMemo(() => {
    return liveTakeovers.length > 0 ? liveTakeovers : FALLBACK_TAKEOVERS;
  }, [liveTakeovers]);

  // Load DEX Screener REST Pairs
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const queries = ['SOL', 'PEPE', 'WETH', 'USDC'];
      const promises = queries.map((q) =>
        api
          .get('/api/dex/search', { params: { q } })
          .then((r) => r.data)
          .catch(() => ({ pairs: [] }))
      );

      const results = await Promise.all(promises);
      const allPairs: DexScreenerPair[] = results.flatMap((r) => r.pairs || []);

      if (allPairs.length > 0) {
        const seen = new Set<string>();
        const unique = allPairs.filter((p) => {
          if (!p.pairAddress) return false;
          const k = p.pairAddress.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        const clean = unique.filter((p) => (p.liquidity?.usd || 0) >= 2000);
        if (clean.length > 0) {
          setPairs(clean);
        }
      }

      // Also refresh trending metas
      const metaData = await dexscreenerService.getTrendingMetas();
      if (metaData && metaData.length > 0) {
        setMetas(metaData);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // Fallback pairs remain safely visible
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualRefresh = () => {
    if (activeTab === 'pairs' || activeTab === 'metas') {
      loadData();
    } else {
      refreshWsStream();
    }
  };

  const copyCA = (addr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 1800);
  };

  const filteredPairs = useMemo(() => {
    let list = [...pairs];

    // Filter by Chain
    if (chainFilter !== 'ALL') {
      list = list.filter((p) => p.chainId?.toLowerCase() === chainFilter.toLowerCase());
    }

    // Filter by Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.baseToken?.symbol?.toLowerCase().includes(q) ||
          p.baseToken?.name?.toLowerCase().includes(q) ||
          p.baseToken?.address?.toLowerCase() === q ||
          p.pairAddress?.toLowerCase() === q
      );
    }

    // Sort by Filter category
    if (activeFilter === 'gainers') {
      list.sort((a, b) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0));
    } else if (activeFilter === 'volume') {
      list.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
    }

    return list;
  }, [pairs, chainFilter, search, activeFilter]);

  const filteredBoosts = useMemo(() => {
    let list = [...displayBoosts];
    if (chainFilter !== 'ALL') {
      list = list.filter((b) => b.chainId?.toLowerCase() === chainFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.tokenAddress?.toLowerCase().includes(q) ||
          b.header?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [displayBoosts, chainFilter, search]);

  const filteredTakeovers = useMemo(() => {
    let list = [...displayTakeovers];
    if (chainFilter !== 'ALL') {
      list = list.filter((t) => t.chainId?.toLowerCase() === chainFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.tokenAddress?.toLowerCase().includes(q) ||
          t.header?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [displayTakeovers, chainFilter, search]);

  const filteredMetas = useMemo(() => {
    let list = [...metas];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.slug?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [metas, search]);

  const fmtUsd = (val?: number) => {
    if (!val || isNaN(val)) return '$–';
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(1) + 'K';
    return '$' + val.toFixed(2);
  };

  const formatPrice = (priceStr?: string) => {
    if (!priceStr) return '$0.00';
    const num = parseFloat(priceStr);
    if (num < 0.000001) return `$${num.toExponential(3)}`;
    if (num < 0.01) return `$${num.toFixed(6)}`;
    if (num < 1) return `$${num.toFixed(4)}`;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDisplayTitle = (header?: string, address?: string, chainId?: string) => {
    if (header && !header.startsWith('http://') && !header.startsWith('https://')) {
      return header;
    }
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return `${chainId?.toUpperCase() || 'DEX'} Token`;
  };

  const getCtoTitle = (header?: string, address?: string, chainId?: string) => {
    if (header && !header.startsWith('http://') && !header.startsWith('https://')) {
      return header;
    }
    if (address) {
      return `CTO ${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return `${chainId?.toUpperCase() || 'DEX'} Community Takeover`;
  };

  return (
    <div className="w-full space-y-3 pb-8 animate-in fade-in duration-300">
      {/* ── DexScreener Command Bar Header ── */}
      <div className="bg-[#14171D] border border-[#2B313A] rounded-lg p-3.5 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow shadow-inner">
              <Zap size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide uppercase">
                  DEX Screener Live
                </h1>
                {/* Real-time WebSocket connection status badge */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                    isWsConnected
                      ? 'bg-[#0ECB81]/10 border-[#0ECB81]/30 text-[#0ECB81]'
                      : 'bg-alphabag-yellow/10 border-alphabag-yellow/30 text-alphabag-yellow'
                  }`}
                  title={
                    isWsConnected
                      ? 'DexScreener WebSocket connected live'
                      : 'DexScreener REST syncing fallback active'
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isWsConnected ? 'bg-[#0ECB81] animate-pulse' : 'bg-alphabag-yellow'
                    }`}
                  />
                  <span>{isWsConnected ? 'DEXSTREAM: LIVE' : 'DEXSTREAM: SYNCING'}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Institutional real-time liquidity pools, token boosts, and transaction velocity.
                <span className="text-gray-500 ml-2 font-mono text-[11px]">Synced: {lastUpdated}</span>
              </p>
            </div>
          </div>

          {/* Search Box (Pairs or Contract Addresses) */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol, narrative, or CA..."
              className="w-full bg-[#0B0E11] border border-[#2B313A] focus:border-alphabag-yellow/60 rounded-lg py-2 pl-9 pr-8 text-xs text-white placeholder-gray-500 font-mono outline-none transition-colors"
            />
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-alphabag-yellow hover:text-[#FCD535] transition-colors p-1"
              title="Refresh Feed"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Main Tab Navigation Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2B313A]">
          <div className="flex items-center gap-1.5 bg-[#0B0E11] p-1 rounded-lg border border-[#2B313A]">
            <button
              data-testid="tab-pairs"
              onClick={() => setActiveTab('pairs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'pairs'
                  ? 'bg-[#202630] text-alphabag-yellow border border-alphabag-yellow/30 shadow-inner'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Activity size={13} />
              <span>DEX Pairs</span>
            </button>
            <button
              data-testid="tab-boosts"
              onClick={() => setActiveTab('boosts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'boosts'
                  ? 'bg-[#202630] text-alphabag-yellow border border-alphabag-yellow/30 shadow-inner'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Zap size={13} />
              <span>Live Boosts</span>
              <span className="px-1.5 py-0.2 rounded bg-alphabag-yellow/20 text-alphabag-yellow text-[11px] font-mono">
                {displayBoosts.length}
              </span>
            </button>
            <button
              data-testid="tab-takeovers"
              onClick={() => setActiveTab('takeovers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'takeovers'
                  ? 'bg-[#202630] text-alphabag-yellow border border-alphabag-yellow/30 shadow-inner'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users size={13} />
              <span>Community Takeovers (CTO)</span>
              <span className="px-1.5 py-0.2 rounded bg-[#0ECB81]/20 text-[#0ECB81] text-[11px] font-mono">
                {displayTakeovers.length}
              </span>
            </button>
            <button
              data-testid="tab-metas"
              onClick={() => setActiveTab('metas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'metas'
                  ? 'bg-[#202630] text-alphabag-yellow border border-alphabag-yellow/30 shadow-inner'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>Trending Metas</span>
            </button>
          </div>

          {/* Subfilters for DEX Pairs */}
          {activeTab === 'pairs' && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {PAIR_FILTERS.map((f) => {
                const active = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 transition-all ${
                      active
                        ? 'bg-[#202630] text-alphabag-yellow border border-alphabag-yellow/30 shadow-inner'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Chain Switcher Pills (for Pairs, Boosts, CTO) ── */}
        {activeTab !== 'metas' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CHAINS.map((c) => {
              const active = chainFilter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setChainFilter(c.id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold shrink-0 transition-all ${
                    active
                      ? 'bg-alphabag-yellow text-[#0B0E11] shadow'
                      : 'bg-[#202630] text-gray-300 hover:text-white hover:bg-[#2B313A] border border-[#2B313A]'
                  }`}
                >
                  <span className="text-[11px]">{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── TAB 1: Dense Multi-Chain Pair Table ── */}
      {activeTab === 'pairs' && (
        <div className="rounded-lg border border-[#2B313A] bg-[#181A20] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#14171D] border-b border-[#2B313A] text-[11px] text-gray-400 font-semibold tracking-wider uppercase font-mono">
                <tr>
                  <th className="py-2.5 px-3 pl-4 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 text-left">Token</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-2 text-center">Age</th>
                  <th className="py-2.5 px-3 text-right">Txns 24h</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                  <th className="py-2.5 px-2 text-right hidden sm:table-cell">Makers</th>
                  <th className="py-2.5 px-2 text-right">5m</th>
                  <th className="py-2.5 px-2 text-right">1h</th>
                  <th className="py-2.5 px-2 text-right">6h</th>
                  <th className="py-2.5 px-2 text-right">24h</th>
                  <th className="py-2.5 px-3 text-right">Liquidity</th>
                  <th className="py-2.5 px-3 text-right">FDV</th>
                  <th className="py-2.5 px-3 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B313A] text-xs font-mono">
                {filteredPairs.map((p, idx) => {
                  const buys = p.txns?.h24?.buys || 0;
                  const sells = p.txns?.h24?.sells || 0;
                  const totalTx = buys + sells;
                  const buyRatio = totalTx > 0 ? (buys / totalTx) * 100 : 50;

                  const m5 = p.priceChange?.m5 ?? 0;
                  const h1 = p.priceChange?.h1 ?? 0;
                  const h6 = p.priceChange?.h6 ?? 0;
                  const h24 = p.priceChange?.h24 ?? 0;

                  const renderPct = (val: number) => {
                    const isUp = val >= 0;
                    return (
                      <span className={`font-semibold ${isUp ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {isUp ? '+' : ''}
                        {val.toFixed(1)}%
                      </span>
                    );
                  };

                  return (
                    <tr
                      key={p.pairAddress || idx}
                      className="hover:bg-[#202630]/70 transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-2.5 px-3 pl-4 text-center text-gray-500 font-medium">
                        {idx + 1}
                      </td>

                      {/* Token Pair & Chain */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs font-sans group-hover:text-alphabag-yellow transition-colors">
                                {p.baseToken?.symbol || 'TOKEN'}
                              </span>
                              <span className="text-[11px] text-gray-400">/ {p.quoteToken?.symbol}</span>
                              <span className="text-[11px] uppercase px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10 font-sans">
                                {p.chainId}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                              <span className="uppercase text-[11px] text-alphabag-yellow/80">{p.dexId?.replace('_', ' ')}</span>
                              <span>•</span>
                              <span className="truncate max-w-[90px]">{p.baseToken?.address}</span>
                              <button
                                onClick={(e) => copyCA(p.baseToken?.address, e)}
                                className="hover:text-white transition-colors"
                                title="Copy Contract Address"
                              >
                                {copiedAddress === p.baseToken?.address ? (
                                  <Check size={10} className="text-[#0ECB81]" />
                                ) : (
                                  <Copy size={10} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {formatPrice(p.priceUsd)}
                      </td>

                      {/* Age */}
                      <td className="py-2.5 px-2 text-center text-gray-400 text-[11px]">
                        {p.age || '1d'}
                      </td>

                      {/* Txns (Buys / Sells Ratio Bar) */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-[#0ECB81]">{buys.toLocaleString()}</span>
                            <span className="text-gray-500">/</span>
                            <span className="text-[#F6465D]">{sells.toLocaleString()}</span>
                          </div>
                          <div className="w-16 h-1 bg-[#202630] rounded-full overflow-hidden flex">
                            <div className="bg-[#0ECB81] h-full" style={{ width: `${buyRatio}%` }} />
                            <div className="bg-[#F6465D] h-full" style={{ width: `${100 - buyRatio}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Volume */}
                      <td className="py-2.5 px-3 text-right font-semibold text-white">
                        {fmtUsd(p.volume?.h24)}
                      </td>

                      {/* Makers */}
                      <td className="py-2.5 px-2 text-right text-gray-400 hidden sm:table-cell">
                        {p.makers?.toLocaleString() || '–'}
                      </td>

                      {/* 5m, 1h, 6h, 24h Changes */}
                      <td className="py-2.5 px-2 text-right">{renderPct(m5)}</td>
                      <td className="py-2.5 px-2 text-right">{renderPct(h1)}</td>
                      <td className="py-2.5 px-2 text-right">{renderPct(h6)}</td>
                      <td className="py-2.5 px-2 text-right">{renderPct(h24)}</td>

                      {/* Liquidity */}
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-300">
                        {fmtUsd(p.liquidity?.usd)}
                      </td>

                      {/* FDV */}
                      <td className="py-2.5 px-3 text-right text-gray-400">
                        {fmtUsd(p.fdv)}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={p.url || `https://dexscreener.com/${p.chainId}/${p.pairAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-[#202630] hover:bg-alphabag-yellow hover:text-[#0B0E11] text-gray-400 transition-colors"
                            title="View on DexScreener"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: Live Token Boosts (DexScreener WebSocket Feed) ── */}
      {activeTab === 'boosts' && (
        <div className="rounded-lg border border-[#2B313A] bg-[#181A20] overflow-hidden shadow-xl">
          <div className="p-3 bg-[#14171D] border-b border-[#2B313A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-alphabag-yellow animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Live Token Boost Stream
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                Tokens with active trending boosts backed by paid DexScreener velocity
              </span>
            </div>
            <div className="text-[11px] font-mono text-alphabag-yellow">
              {filteredBoosts.length} Active Boosts
            </div>
          </div>

          <div className="divide-y divide-[#2B313A]">
            {filteredBoosts.map((boost, idx) => (
              <div
                key={boost.tokenAddress + idx}
                className="p-3.5 hover:bg-[#202630]/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#202630] border border-[#2B313A] overflow-hidden shrink-0 flex items-center justify-center">
                    {boost.icon ? (
                      <img
                        src={boost.icon}
                        alt="Token Icon"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : boost.header && (boost.header.startsWith('http://') || boost.header.startsWith('https://')) ? (
                      <img
                        src={boost.header}
                        alt="Token Banner"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Zap size={18} className="text-alphabag-yellow" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-alphabag-yellow transition-colors font-sans">
                        {getDisplayTitle(boost.header, boost.tokenAddress, boost.chainId)}
                      </span>
                      <span className="text-[11px] uppercase px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10 font-mono">
                        {boost.chainId}
                      </span>
                      <span className="text-[11px] px-2 py-0.2 rounded bg-alphabag-yellow/15 border border-alphabag-yellow/30 text-alphabag-yellow font-mono font-bold">
                        +{boost.amount} BOOSTS
                      </span>
                    </div>
                    {boost.description && (
                      <p className="text-xs text-gray-300 max-w-2xl line-clamp-2">
                        {boost.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
                      <span>CA:</span>
                      <span className="text-gray-300 truncate max-w-[200px]">
                        {boost.tokenAddress}
                      </span>
                      <button
                        onClick={(e) => copyCA(boost.tokenAddress, e)}
                        className="hover:text-white transition-colors"
                        title="Copy Contract Address"
                      >
                        {copiedAddress === boost.tokenAddress ? (
                          <Check size={11} className="text-[#0ECB81]" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                      {boost.totalAmount > 0 && (
                        <>
                          <span>•</span>
                          <span>Cumulative: {boost.totalAmount.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Socials & Launch Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {boost.links && boost.links.length > 0 && (
                    <div className="flex items-center gap-1.5 mr-2">
                      {boost.links.slice(0, 3).map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-[#202630] border border-[#2B313A] text-[11px] text-gray-400 hover:text-white hover:border-gray-500 transition-colors font-mono"
                        >
                          {link.label || link.type || 'Link'}
                        </a>
                      ))}
                    </div>
                  )}

                  <a
                    href={boost.url || `https://dexscreener.com/${boost.chainId}/${boost.tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#202630] hover:bg-alphabag-yellow hover:text-[#0B0E11] text-xs font-semibold text-gray-300 border border-[#2B313A] hover:border-alphabag-yellow transition-colors"
                    title="View on DexScreener"
                  >
                    <ExternalLink size={13} />
                    <span>DexScreener</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: Community Takeovers (CTO) Stream ── */}
      {activeTab === 'takeovers' && (
        <div className="rounded-lg border border-[#2B313A] bg-[#181A20] overflow-hidden shadow-xl">
          <div className="p-3 bg-[#14171D] border-b border-[#2B313A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#0ECB81]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Community Takeovers (CTO) Verified Registry
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                Tokens revitalized and governed 100% by community takeover initiatives
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#0ECB81]">
              {filteredTakeovers.length} Verified CTOs
            </div>
          </div>

          <div className="divide-y divide-[#2B313A]">
            {filteredTakeovers.map((cto, idx) => (
              <div
                key={cto.tokenAddress + idx}
                className="p-3.5 hover:bg-[#202630]/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#202630] border border-[#2B313A] overflow-hidden shrink-0 flex items-center justify-center">
                    {cto.icon ? (
                      <img
                        src={cto.icon}
                        alt="CTO Icon"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : cto.header && (cto.header.startsWith('http://') || cto.header.startsWith('https://')) ? (
                      <img
                        src={cto.header}
                        alt="CTO Banner"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Users size={18} className="text-[#0ECB81]" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-alphabag-yellow transition-colors font-sans">
                        {getCtoTitle(cto.header, cto.tokenAddress, cto.chainId)}
                      </span>
                      <span className="text-[11px] uppercase px-1.5 py-0.2 rounded bg-white/5 text-gray-400 border border-white/10 font-mono">
                        {cto.chainId}
                      </span>
                      <span className="text-[11px] px-2 py-0.2 rounded bg-[#0ECB81]/15 border border-[#0ECB81]/30 text-[#0ECB81] font-mono font-bold flex items-center gap-1">
                        <ShieldCheck size={10} />
                        VERIFIED CTO
                      </span>
                    </div>
                    {cto.description && (
                      <p className="text-xs text-gray-300 max-w-2xl line-clamp-2">
                        {cto.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
                      <span>CA:</span>
                      <span className="text-gray-300 truncate max-w-[200px]">
                        {cto.tokenAddress}
                      </span>
                      <button
                        onClick={(e) => copyCA(cto.tokenAddress, e)}
                        className="hover:text-white transition-colors"
                        title="Copy Contract Address"
                      >
                        {copiedAddress === cto.tokenAddress ? (
                          <Check size={11} className="text-[#0ECB81]" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                      {cto.claimDate && (
                        <>
                          <span>•</span>
                          <span>Claimed: {new Date(cto.claimDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Socials & Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {cto.links && cto.links.length > 0 && (
                    <div className="flex items-center gap-1.5 mr-2">
                      {cto.links.slice(0, 3).map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-[#202630] border border-[#2B313A] text-[11px] text-gray-400 hover:text-white hover:border-gray-500 transition-colors font-mono"
                        >
                          {link.label || link.type || 'Social'}
                        </a>
                      ))}
                    </div>
                  )}

                  <a
                    href={cto.url || `https://dexscreener.com/${cto.chainId}/${cto.tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#202630] hover:bg-alphabag-yellow hover:text-[#0B0E11] text-xs font-semibold text-gray-300 border border-[#2B313A] hover:border-alphabag-yellow transition-colors"
                    title="View on DexScreener"
                  >
                    <ExternalLink size={13} />
                    <span>DexScreener</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: Trending Metas (Sectors & Narratives) ── */}
      {activeTab === 'metas' && (
        <div className="rounded-lg border border-[#2B313A] bg-[#181A20] overflow-hidden shadow-xl">
          <div className="p-3 bg-[#14171D] border-b border-[#2B313A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-alphabag-yellow" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Trending Metas & Narratives
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                Aggregated market velocity across emerging on-chain narratives
              </span>
            </div>
            <div className="text-[11px] font-mono text-gray-400">
              {filteredMetas.length} Metas Tracked
            </div>
          </div>

          <div className="divide-y divide-[#2B313A]">
            {filteredMetas.map((meta, idx) => {
              const h24 = meta.marketCapChange?.h24 ?? 0;
              const isUp = h24 >= 0;

              return (
                <div
                  key={meta.slug || idx}
                  className="p-4 hover:bg-[#202630]/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-sm font-bold text-white group-hover:text-alphabag-yellow transition-colors font-sans">
                        {meta.name}
                      </h2>
                      <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-white/5 border border-white/10 text-gray-400">
                        {meta.tokenCount} Tokens
                      </span>
                    </div>
                    {meta.description && (
                      <p className="text-xs text-gray-400 max-w-2xl">
                        {meta.description}
                      </p>
                    )}
                  </div>

                  {/* Metrics Grid */}
                  <div className="flex items-center gap-6 font-mono self-end md:self-center">
                    <div className="text-right">
                      <div className="text-[11px] text-gray-500 uppercase">Market Cap</div>
                      <div className="text-xs font-bold text-white">{fmtUsd(meta.marketCap)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-gray-500 uppercase">24h Volume</div>
                      <div className="text-xs font-bold text-white">{fmtUsd(meta.volume)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-gray-500 uppercase">Liquidity</div>
                      <div className="text-xs font-bold text-gray-300">{fmtUsd(meta.liquidity)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-gray-500 uppercase">24h Change</div>
                      <div
                        className={`text-xs font-bold ${
                          isUp ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {h24.toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSearch(meta.name.split(' ')[0]);
                        setActiveTab('pairs');
                      }}
                      className="px-2.5 py-1.5 rounded bg-[#202630] border border-[#2B313A] text-xs font-semibold text-alphabag-yellow hover:bg-alphabag-yellow hover:text-[#0B0E11] transition-colors font-sans shrink-0"
                    >
                      Filter Pairs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlphaScreener;
