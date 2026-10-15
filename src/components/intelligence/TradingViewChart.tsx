import { BarChart3, ExternalLink, Maximize2, Minimize2, Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

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
  { label: '1H',  value: '60' },
  { label: '4H',  value: '240' },
  { label: '1D',  value: 'D' },
];

const POPULAR_TOKENS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'PEPE', 'SUI'];

function formatSymbolForTradingView(input: string): string {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return 'BINANCE:BTCUSDT';
  // If user already specified an exchange (e.g. BINANCE:BTCUSDT, COINBASE:ETHUSD, BYBIT:SOLUSDT)
  if (trimmed.includes(':')) return trimmed;
  // If user typed a pair like BTCUSDT, ETHUSD, SOLUSDT
  if (trimmed.endsWith('USDT') || trimmed.endsWith('USD') || trimmed.endsWith('BTC')) {
    return `BINANCE:${trimmed}`;
  }
  // Default to Binance USDT pair for any asset ticker
  return `BINANCE:${trimmed}USDT`;
}

function loadTradingViewScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.TradingView) { resolve(); return; }

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

export function TradingViewChart({ symbol, height = 640, defaultInterval = '60' }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const widgetId = `tv_${rawId.replace(/:/g, '')}`;
  const [interval, setInterval] = useState(defaultInterval);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState(symbol || 'BINANCE:BTCUSDT');
  const [searchInput, setSearchInput] = useState('');

  // Keep in sync when parent preset changes
  useEffect(() => {
    if (symbol) {
      setActiveSymbol(symbol);
    }
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;

    loadTradingViewScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.TradingView) return;

        containerRef.current.innerHTML = `<div id="${widgetId}" style="height:100%"></div>`;

        new window.TradingView.widget({
          container_id: widgetId,
          autosize: true,
          symbol: activeSymbol,
          interval,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#14171D',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          save_image: true,
          details: true,
          hotlist: true,
          calendar: true,
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          withdateranges: true,
        });
      })
      .catch((err: Error) => console.error('[TradingView]', err));

    return () => { cancelled = true; };
  }, [activeSymbol, interval, widgetId]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    const formatted = formatSymbolForTradingView(searchInput);
    setActiveSymbol(formatted);
    setSearchInput('');
  };

  const handleQuickSelect = (token: string) => {
    setActiveSymbol(`BINANCE:${token}USDT`);
  };

  const externalUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(activeSymbol)}`;

  return (
    <div className={`w-full overflow-hidden rounded-[6px] border border-[#2B313A] bg-[#181A20] ${isFullscreen ? 'fixed inset-3 z-50 rounded-[6px]' : 'relative'}`}>
      {/* Chart Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 bg-[#14171D] border-b border-[#2B313A]">
        {/* Left: Active Symbol Badge & Search Input */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow">
            <BarChart3 size={15} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-alphabag-text tracking-wide bg-[#202630] px-2 py-0.5 rounded border border-[#2B313A] num">
              {activeSymbol}
            </span>
          </div>

          {/* Direct Search Bar for ANY token */}
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#0B0E11] border border-[#2B313A] rounded px-2 py-1 gap-1.5">
            <Search size={13} className="text-alphabag-subtext" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="View any token (e.g. PEPE, DOGE, SOL, SUI)..."
              className="bg-transparent text-xs text-alphabag-text placeholder:text-alphabag-subtext/50 outline-none w-44 sm:w-64"
            />
            <button
              type="submit"
              className="text-[11px] font-semibold bg-[#202630] hover:bg-[#2B313A] text-alphabag-text px-2 py-0.5 rounded transition-colors"
            >
              Load
            </button>
          </form>

          {/* Quick Token Chips */}
          <div className="hidden xl:flex items-center gap-1">
            {POPULAR_TOKENS.map((tok) => (
              <button
                key={tok}
                type="button"
                onClick={() => handleQuickSelect(tok)}
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
                  activeSymbol.includes(tok)
                    ? 'bg-alphabag-yellow/20 text-alphabag-yellow border border-alphabag-yellow/40'
                    : 'text-alphabag-subtext hover:text-alphabag-text hover:bg-[#202630]'
                }`}
              >
                {tok}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Timeframe, External TradingView, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex bg-[#0B0E11] border border-[#2B313A] rounded p-0.5 gap-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setInterval(tf.value)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  interval === tf.value
                    ? 'bg-[#202630] text-alphabag-text'
                    : 'text-alphabag-subtext hover:text-alphabag-text'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Direct link to TradingView.com with all native tools */}
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#202630] hover:bg-[#2B313A] text-alphabag-subtext hover:text-alphabag-text border border-[#2B313A] text-xs font-medium transition-colors"
            title="Open in full TradingView.com"
          >
            <span className="hidden sm:inline text-xs">TradingView</span>
            <ExternalLink size={12} />
          </a>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded bg-[#202630] hover:bg-[#2B313A] text-alphabag-subtext hover:text-alphabag-text border border-[#2B313A] transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full bg-[#181A20]"
        style={{ height: isFullscreen ? 'calc(100% - 46px)' : height }}
      />
    </div>
  );
}

export default TradingViewChart;
