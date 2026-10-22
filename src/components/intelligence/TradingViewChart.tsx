import {
  BarChart2,
  ExternalLink,
  LineChart,
  Maximize2,
  Minimize2,
  Search,
  X,
} from 'lucide-react';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

interface TradingViewChartProps {
  symbol: string;
  height?: number;
  defaultInterval?: string;
}

const TV_SCRIPT_ID = 'tradingview-tv-js';
const TV_SCRIPT_SRC = 'https://s3.tradingview.com/tv.js';

const TIMEFRAMES = [
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
];

export interface TVScreenerItem {
  rank: number;
  symbol: string;
  name: string;
  pair: string;
  icon: string;
  price: number;
  chg24h: number;
  mktCap: string;
  vol24h: string;
  circSupply: string;
  volMktCap: number;
  socialDom: number;
  category: string;
  techRating: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  rsi14: number;
  macd: string;
  perf1w: number;
  perf1m: number;
  perfYtd: number;
}

// Institutional TradingView Crypto Universe Screener Dataset
const TV_CRYPTO_UNIVERSE: TVScreenerItem[] = [
  {
    rank: 1,
    symbol: 'BTC',
    name: 'Bitcoin',
    pair: 'BINANCE:BTCUSDT',
    icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    price: 82193.99,
    chg24h: 0.5,
    mktCap: '1.65T USD',
    vol24h: '42.41B USD',
    circSupply: '20.1M',
    volMktCap: 0.0257,
    socialDom: 24.34,
    category: 'Cryptocurrencies, Layer 1',
    techRating: 'Neutral',
    rsi14: 54.2,
    macd: 'Bullish (342.1)',
    perf1w: 3.42,
    perf1m: 12.18,
    perfYtd: 84.5,
  },
  {
    rank: 2,
    symbol: 'ETH',
    name: 'Ethereum',
    pair: 'BINANCE:ETHUSDT',
    icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    price: 2453.15,
    chg24h: 1.35,
    mktCap: '299.62B USD',
    vol24h: '19.38B USD',
    circSupply: '122.14M',
    volMktCap: 0.0647,
    socialDom: 10.8,
    category: 'Smart contract platforms, Layer 1',
    techRating: 'Sell',
    rsi14: 46.8,
    macd: 'Neutral (-12.4)',
    perf1w: 5.12,
    perf1m: 8.45,
    perfYtd: 42.1,
  },
  {
    rank: 3,
    symbol: 'USDT',
    name: 'Tether USDt',
    pair: 'BINANCE:USDTUSD',
    icon: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    price: 0.9989,
    chg24h: 0.01,
    mktCap: '183.85B USD',
    vol24h: '89.59B USD',
    circSupply: '184.05B',
    volMktCap: 0.4873,
    socialDom: 0.32,
    category: 'Stablecoins, Asset backed',
    techRating: 'Sell',
    rsi14: 49.9,
    macd: 'Neutral',
    perf1w: 0.01,
    perf1m: 0.02,
    perfYtd: 0.05,
  },
  {
    rank: 4,
    symbol: 'BNB',
    name: 'BNB',
    pair: 'BINANCE:BNBUSDT',
    icon: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    price: 730.08,
    chg24h: 0.26,
    mktCap: '97.22B USD',
    vol24h: '1.68B USD',
    circSupply: '133.16M',
    volMktCap: 0.0173,
    socialDom: 0.33,
    category: 'Smart contract platforms, Centralized Exchange',
    techRating: 'Sell',
    rsi14: 48.2,
    macd: 'Neutral (4.2)',
    perf1w: 2.14,
    perf1m: 6.82,
    perfYtd: 112.4,
  },
  {
    rank: 5,
    symbol: 'XRP',
    name: 'XRP',
    pair: 'BINANCE:XRPUSDT',
    icon: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    price: 1.3397,
    chg24h: 0.59,
    mktCap: '84.57B USD',
    vol24h: '3.06B USD',
    circSupply: '63.13B',
    volMktCap: 0.0361,
    socialDom: 3.22,
    category: 'Cryptocurrencies, Enterprise solutions',
    techRating: 'Sell',
    rsi14: 44.5,
    macd: 'Bearish (-0.02)',
    perf1w: 4.12,
    perf1m: 14.8,
    perfYtd: 185.0,
  },
  {
    rank: 6,
    symbol: 'USDC',
    name: 'USDC',
    pair: 'BINANCE:USDCUSDT',
    icon: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    price: 0.9996,
    chg24h: -0.05,
    mktCap: '72.63B USD',
    vol24h: '22.29B USD',
    circSupply: '72.65B',
    volMktCap: 0.3069,
    socialDom: 2.44,
    category: 'Stablecoins, Asset backed',
    techRating: 'Strong Sell',
    rsi14: 50.1,
    macd: 'Neutral',
    perf1w: -0.02,
    perf1m: 0.01,
    perfYtd: -0.01,
  },
  {
    rank: 7,
    symbol: 'SOL',
    name: 'Solana',
    pair: 'BINANCE:SOLUSDT',
    icon: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    price: 155.87,
    chg24h: 1.44,
    mktCap: '62.39B USD',
    vol24h: '4.09B USD',
    circSupply: '589.27M',
    volMktCap: 0.0656,
    socialDom: 14.93,
    category: 'Smart contract platforms, Layer 1',
    techRating: 'Neutral',
    rsi14: 58.4,
    macd: 'Bullish (1.8)',
    perf1w: 8.92,
    perf1m: 21.4,
    perfYtd: 164.2,
  },
  {
    rank: 8,
    symbol: 'DOGE',
    name: 'Dogecoin',
    pair: 'BINANCE:DOGEUSDT',
    icon: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    price: 0.1814,
    chg24h: -0.24,
    mktCap: '14.02B USD',
    vol24h: '1.72B USD',
    circSupply: '172.05B',
    volMktCap: 0.1228,
    socialDom: 0.81,
    category: 'Memes, Cryptocurrencies, Layer 1',
    techRating: 'Sell',
    rsi14: 42.1,
    macd: 'Bearish (-0.004)',
    perf1w: -1.82,
    perf1m: 4.15,
    perfYtd: 94.2,
  },
  {
    rank: 9,
    symbol: 'PEPE',
    name: 'Pepe',
    pair: 'BINANCE:PEPEUSDT',
    icon: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.png',
    price: 0.00001048,
    chg24h: 6.84,
    mktCap: '4.41B USD',
    vol24h: '1.49B USD',
    circSupply: '420.69T',
    volMktCap: 0.3378,
    socialDom: 5.12,
    category: 'Memes, Ethereum',
    techRating: 'Strong Buy',
    rsi14: 68.2,
    macd: 'Bullish (0.0000008)',
    perf1w: 14.28,
    perf1m: 38.4,
    perfYtd: 740.0,
  },
  {
    rank: 10,
    symbol: 'SUI',
    name: 'Sui',
    pair: 'BINANCE:SUIUSDT',
    icon: 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
    price: 2.34,
    chg24h: 5.42,
    mktCap: '6.72B USD',
    vol24h: '820.0M USD',
    circSupply: '2.87B',
    volMktCap: 0.122,
    socialDom: 3.45,
    category: 'Smart contract platforms, Layer 1',
    techRating: 'Buy',
    rsi14: 64.1,
    macd: 'Bullish (0.12)',
    perf1w: 12.18,
    perf1m: 44.2,
    perfYtd: 310.0,
  },
  {
    rank: 11,
    symbol: 'LINK',
    name: 'Chainlink',
    pair: 'BINANCE:LINKUSDT',
    icon: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    price: 13.82,
    chg24h: 0.81,
    mktCap: '9.37B USD',
    vol24h: '440.05M USD',
    circSupply: '748.1M',
    volMktCap: 0.047,
    socialDom: 0.86,
    category: 'Oracle, Smart contracts, DeFi',
    techRating: 'Neutral',
    rsi14: 51.2,
    macd: 'Neutral (0.08)',
    perf1w: 4.85,
    perf1m: 11.2,
    perfYtd: 28.5,
  },
  {
    rank: 12,
    symbol: 'ADA',
    name: 'Cardano',
    pair: 'BINANCE:ADAUSDT',
    icon: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    price: 0.723,
    chg24h: 0.93,
    mktCap: '8.49B USD',
    vol24h: '545.51M USD',
    circSupply: '36.8B',
    volMktCap: 0.0643,
    socialDom: 0.94,
    category: 'Smart contract platforms, Layer 1',
    techRating: 'Sell',
    rsi14: 47.5,
    macd: 'Neutral (-0.01)',
    perf1w: 3.45,
    perf1m: 8.9,
    perfYtd: 48.0,
  },
  {
    rank: 13,
    symbol: 'NEAR',
    name: 'NEAR Protocol',
    pair: 'BINANCE:NEARUSDT',
    icon: 'https://assets.coingecko.com/coins/images/10365/large/near.png',
    price: 5.32,
    chg24h: 10.82,
    mktCap: '6.97B USD',
    vol24h: '1.49B USD',
    circSupply: '1.31B',
    volMktCap: 0.2133,
    socialDom: 0.76,
    category: 'Smart contract platforms, AI & Data',
    techRating: 'Buy',
    rsi14: 67.4,
    macd: 'Bullish (0.42)',
    perf1w: 18.5,
    perf1m: 52.8,
    perfYtd: 240.0,
  },
];

function formatSymbolForTradingView(input: string): string {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return 'BINANCE:BTCUSDT';
  if (trimmed.includes(':')) return trimmed;
  if (trimmed.endsWith('USDT') || trimmed.endsWith('USD') || trimmed.endsWith('BTC')) {
    return `BINANCE:${trimmed}`;
  }
  return `BINANCE:${trimmed}USDT`;
}

function loadTradingViewScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.TradingView) {
      resolve();
      return;
    }

    const existing = document.getElementById(TV_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load TradingView script')));
      return;
    }

    const script = document.createElement('script');
    script.id = TV_SCRIPT_ID;
    script.src = TV_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load TradingView script'));
    document.head.appendChild(script);
  });
}

export function TradingViewChart({
  symbol,
  height = 640,
  defaultInterval = '60',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const widgetId = `tv_${rawId.replace(/:/g, '')}`;
  const [interval, setInterval] = useState(defaultInterval);
  const [isInAppExpanded, setIsInAppExpanded] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState(symbol || 'BINANCE:BTCUSDT');
  const [searchInput, setSearchInput] = useState('');
  const [viewTab, setViewTab] = useState<'chart' | 'overview' | 'performance' | 'technicals'>('overview');
  const [filterRating, setFilterRating] = useState<string>('ALL');

  useEffect(() => {
    if (symbol) {
      setActiveSymbol(symbol);
    }
  }, [symbol]);

  const toggleInAppView = () => {
    setIsInAppExpanded((prev) => {
      const next = !prev;
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 120);
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInAppExpanded) {
        setIsInAppExpanded(false);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInAppExpanded]);

  // Mount TradingView Widget
  useEffect(() => {
    if (viewTab !== 'chart' && !isInAppExpanded) return;

    let mounted = true;
    const targetElement = document.getElementById(widgetId);
    if (!targetElement) return;
    targetElement.innerHTML = '';

    loadTradingViewScript()
      .then(() => {
        if (!mounted || !window.TradingView || !document.getElementById(widgetId)) return;

        new window.TradingView.widget({
          autosize: true,
          symbol: activeSymbol,
          interval,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0B0E11',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: widgetId,
          hide_side_toolbar: false,
          save_image: true,
          backgroundColor: '#0B0E11',
          gridColor: '#181A20',
          overrides: {
            'paneProperties.background': '#0B0E11',
            'paneProperties.vertGridProperties.color': '#181A20',
            'paneProperties.horzGridProperties.color': '#181A20',
            'mainSeriesProperties.candleStyle.upColor': '#0ECB81',
            'mainSeriesProperties.candleStyle.downColor': '#F6465D',
            'mainSeriesProperties.candleStyle.borderUpColor': '#0ECB81',
            'mainSeriesProperties.candleStyle.borderDownColor': '#F6465D',
            'mainSeriesProperties.candleStyle.wickUpColor': '#0ECB81',
            'mainSeriesProperties.candleStyle.wickDownColor': '#F6465D',
          },
        });
      })
      .catch((err) => {
        console.warn('[AlphaBAG TradingView] Failed to initialize widget:', err);
      });

    return () => {
      mounted = false;
      const el = document.getElementById(widgetId);
      if (el) el.innerHTML = '';
    };
  }, [widgetId, activeSymbol, interval, viewTab, isInAppExpanded]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    const formatted = formatSymbolForTradingView(searchInput);
    setActiveSymbol(formatted);
    setViewTab('chart');
    setSearchInput('');
  };

  const handleSelectToken = (token: TVScreenerItem) => {
    setActiveSymbol(token.pair);
    setViewTab('chart');
  };

  const filteredUniverse = useMemo(() => {
    let list = TV_CRYPTO_UNIVERSE;
    if (filterRating !== 'ALL') {
      list = list.filter((i) => i.techRating === filterRating);
    }
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase().trim();
      list = list.filter(
        (i) => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filterRating, searchInput]);

  const getRatingBadge = (rating: TVScreenerItem['techRating']) => {
    switch (rating) {
      case 'Strong Buy':
        return <span className="text-[#0ECB81] font-bold">▲ Strong Buy</span>;
      case 'Buy':
        return <span className="text-[#0ECB81] font-semibold">▲ Buy</span>;
      case 'Strong Sell':
        return <span className="text-[#F6465D] font-bold">▼ Strong Sell</span>;
      case 'Sell':
        return <span className="text-[#F6465D] font-semibold">▼ Sell</span>;
      default:
        return <span className="text-gray-400 font-medium">= Neutral</span>;
    }
  };

  return (
    <>
      <div className="relative w-full rounded-lg border border-[#2B313A] bg-[#181A20] overflow-hidden shadow-2xl">
        {/* ── TradingView Header Bar ── */}
        <div className="p-3 bg-[#14171D] border-b border-[#2B313A] space-y-2.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Title & Dropdowns */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow">
                <BarChart2 size={16} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                  <span>Crypto Coins Screener</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-alphabag-yellow font-mono text-xs">{activeSymbol}</span>
                </h1>
                <p className="text-xs text-gray-400">
                  TradingView technical momentum, indicators, and live multi-timeframe candlestick terminal.
                </p>
              </div>
            </div>

            {/* In-App Open / Workstation Button */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                onClick={toggleInAppView}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-alphabag-yellow border border-[#2B313A] text-xs font-semibold transition-all shadow-sm"
                title="Expand Chart Workstation"
              >
                <Maximize2 size={13} />
                <span>Open in App</span>
              </button>

              <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(activeSymbol)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-gray-300 hover:text-white border border-[#2B313A] text-xs font-medium transition-colors"
                title="Open directly on TradingView.com"
              >
                <span>External</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* ── TradingView Sub-Tabs & Filter Toolbar ── */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2B313A]">
            {/* View Modes */}
            <div className="flex items-center gap-1 bg-[#0B0E11] p-1 rounded-lg border border-[#2B313A]">
              <button
                onClick={() => setViewTab('chart')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  viewTab === 'chart'
                    ? 'bg-[#202630] text-alphabag-yellow shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LineChart size={13} />
                <span>Live Chart</span>
              </button>
              <button
                onClick={() => setViewTab('overview')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  viewTab === 'overview'
                    ? 'bg-[#202630] text-alphabag-yellow shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewTab('performance')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  viewTab === 'performance'
                    ? 'bg-[#202630] text-alphabag-yellow shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Performance
              </button>
              <button
                onClick={() => setViewTab('technicals')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  viewTab === 'technicals'
                    ? 'bg-[#202630] text-alphabag-yellow shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Technicals
              </button>
            </div>

            {/* Timeframe or Filter Pills */}
            {viewTab === 'chart' ? (
              <div className="flex items-center gap-1 bg-[#0B0E11] p-0.5 rounded border border-[#2B313A]">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setInterval(tf.value)}
                    className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition-colors ${
                      interval === tf.value
                        ? 'bg-alphabag-yellow text-[#0B0E11]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 text-[11px] font-semibold">Tech Rating:</span>
                {['ALL', 'Strong Buy', 'Buy', 'Neutral', 'Sell'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRating(r)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      filterRating === r
                        ? 'bg-alphabag-yellow text-[#0B0E11]'
                        : 'bg-[#0B0E11] text-gray-400 hover:text-white border border-[#2B313A]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Token Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search token or pair (e.g. PEPE, SOL)..."
                className="w-full bg-[#0B0E11] border border-[#2B313A] focus:border-alphabag-yellow/60 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 font-mono outline-none"
              />
            </form>
          </div>
        </div>

        {/* ── Content View ── */}
        {viewTab === 'chart' ? (
          <div className="relative w-full bg-[#0B0E11]" style={{ height }}>
            <div id={widgetId} ref={containerRef} className="w-full h-full" />
          </div>
        ) : (
          <div className="w-full bg-[#0B0E11] overflow-x-auto min-h-[500px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#14171D] border-b border-[#2B313A] text-[11px] text-gray-400 font-semibold tracking-wider uppercase font-mono">
                <tr>
                  <th className="py-2.5 px-3 pl-4 w-10 text-center">Rank</th>
                  <th className="py-2.5 px-3 text-left">Instrument</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-right">Chg % 24h</th>
                  {viewTab === 'overview' && (
                    <>
                      <th className="py-2.5 px-3 text-right">Mkt Cap</th>
                      <th className="py-2.5 px-3 text-right">Vol in USD 24h</th>
                      <th className="py-2.5 px-3 text-right hidden md:table-cell">Circ Supply</th>
                      <th className="py-2.5 px-3 text-right hidden lg:table-cell">Vol / Mkt Cap</th>
                      <th className="py-2.5 px-3 text-right hidden lg:table-cell">Social Dom %</th>
                      <th className="py-2.5 px-3 text-left hidden xl:table-cell">Category</th>
                    </>
                  )}
                  {viewTab === 'performance' && (
                    <>
                      <th className="py-2.5 px-3 text-right">1W Perf</th>
                      <th className="py-2.5 px-3 text-right">1M Perf</th>
                      <th className="py-2.5 px-3 text-right">YTD Perf</th>
                    </>
                  )}
                  {viewTab === 'technicals' && (
                    <>
                      <th className="py-2.5 px-3 text-right">RSI (14)</th>
                      <th className="py-2.5 px-3 text-right">MACD Level</th>
                    </>
                  )}
                  <th className="py-2.5 px-4 text-center">Tech Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181A20] text-xs font-mono">
                {filteredUniverse.map((item) => {
                  const isUp24 = item.chg24h >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => handleSelectToken(item)}
                      className="hover:bg-[#181A20]/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 pl-4 text-center text-gray-500 font-medium">
                        {item.rank}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="w-5 h-5 rounded-full shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="font-bold text-white group-hover:text-alphabag-yellow transition-colors font-sans">
                              {item.symbol}
                            </span>
                            <span className="text-[11px] text-gray-400 font-sans truncate max-w-[120px]">
                              {item.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        ${item.price < 1
                          ? item.price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 })
                          : item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className={`py-2.5 px-3 text-right font-semibold ${isUp24 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {isUp24 ? '+' : ''}{item.chg24h.toFixed(2)}%
                      </td>

                      {viewTab === 'overview' && (
                        <>
                          <td className="py-2.5 px-3 text-right text-white font-medium">{item.mktCap}</td>
                          <td className="py-2.5 px-3 text-right text-gray-300">{item.vol24h}</td>
                          <td className="py-2.5 px-3 text-right text-gray-400 hidden md:table-cell">{item.circSupply}</td>
                          <td className="py-2.5 px-3 text-right text-gray-400 hidden lg:table-cell">{item.volMktCap.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-right text-gray-300 hidden lg:table-cell">{item.socialDom.toFixed(2)}%</td>
                          <td className="py-2.5 px-3 text-left text-gray-400 hidden xl:table-cell truncate max-w-[200px] font-sans">
                            {item.category}
                          </td>
                        </>
                      )}

                      {viewTab === 'performance' && (
                        <>
                          <td className={`py-2.5 px-3 text-right font-semibold ${item.perf1w >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                            {item.perf1w >= 0 ? '+' : ''}{item.perf1w.toFixed(2)}%
                          </td>
                          <td className={`py-2.5 px-3 text-right font-semibold ${item.perf1m >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                            {item.perf1m >= 0 ? '+' : ''}{item.perf1m.toFixed(2)}%
                          </td>
                          <td className={`py-2.5 px-3 text-right font-semibold ${item.perfYtd >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                            {item.perfYtd >= 0 ? '+' : ''}{item.perfYtd.toFixed(2)}%
                          </td>
                        </>
                      )}

                      {viewTab === 'technicals' && (
                        <>
                          <td className="py-2.5 px-3 text-right text-white font-medium">{item.rsi14.toFixed(1)}</td>
                          <td className="py-2.5 px-3 text-right text-gray-300">{item.macd}</td>
                        </>
                      )}

                      <td className="py-2.5 px-4 text-center">
                        {getRatingBadge(item.techRating)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Full-Screen In-App Workstation Modal ── */}
      {isInAppExpanded && (
        <div className="fixed inset-0 z-50 bg-[#0B0E11]/90 flex flex-col p-4 md:p-6 transition-opacity">
          <div className="w-full h-full flex flex-col bg-[#14171D] border border-[#2B313A] rounded-xl overflow-hidden shadow-2xl">
            {/* Modal Command Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#181A20] border-b border-[#2B313A]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow">
                  <BarChart2 size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide uppercase">
                    TradingView Terminal Workstation
                  </h2>
                  <p className="text-xs text-gray-400 font-mono">
                    {activeSymbol} • Timeframe: {interval}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleInAppView}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-gray-300 hover:text-white border border-[#2B313A] text-xs font-semibold transition-colors"
                >
                  <Minimize2 size={14} />
                  <span>Exit Fullscreen</span>
                </button>
                <button
                  onClick={toggleInAppView}
                  className="p-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-gray-400 hover:text-white border border-[#2B313A] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Chart Container */}
            <div className="flex-1 w-full bg-[#0B0E11] relative">
              <iframe
                title="TradingView Fullscreen View"
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_fullscreen&symbol=${encodeURIComponent(activeSymbol)}&interval=${interval}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0B0E11&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC`}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TradingViewChart;
