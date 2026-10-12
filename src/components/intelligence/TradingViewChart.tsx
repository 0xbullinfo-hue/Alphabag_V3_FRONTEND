import { BarChart3, Maximize2, Minimize2 } from 'lucide-react';
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

  useEffect(() => {
    let cancelled = false;

    loadTradingViewScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.TradingView) return;

        containerRef.current.innerHTML = `<div id="${widgetId}" style="height:100%"></div>`;

        new window.TradingView.widget({
          container_id: widgetId,
          autosize: true,
          symbol,
          interval,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#181A20',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          details: false,
          withdateranges: true,
        });
      })
      .catch((err: Error) => console.error('[TradingView]', err));

    return () => { cancelled = true; };
  }, [symbol, interval, widgetId]);

  return (
    <div className={`w-full overflow-hidden rounded-[6px] border border-[#2B313A] bg-[#181A20] ${isFullscreen ? 'fixed inset-3 z-50 rounded-[6px]' : 'relative'}`}>
      {/* Chart Control Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#14171D] border-b border-[#2B313A]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow">
            <BarChart3 size={13} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-alphabag-text tracking-wide num">{symbol}</span>
            <span className="text-[11px] text-alphabag-subtext hidden sm:inline">Advanced Market Chart</span>
          </div>
        </div>

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

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded bg-[#202630] hover:bg-[#2B313A] text-alphabag-subtext hover:text-alphabag-text border border-[#2B313A] transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full bg-[#181A20]"
        style={{ height: isFullscreen ? 'calc(100% - 41px)' : height }}
      />
    </div>
  );
}

export default TradingViewChart;
