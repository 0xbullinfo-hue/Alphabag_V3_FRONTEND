import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveMarketTicker } from '../../hooks/useLiveMarketTicker';

function formatCompact(num?: number): string {
  if (num == null || isNaN(num)) return '—';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export const LiveMarketTickerBar: React.FC = () => {
  const { coins, telemetry, isLive } = useLiveMarketTicker();
  const navigate = useNavigate();

  return (
    <div
      data-testid="live-market-ticker-bar"
      className="w-full bg-[#080B11] border-b border-border/50 text-[11px] font-mono h-8 flex items-center px-3 sm:px-4 text-muted-foreground select-none overflow-hidden z-30"
    >
      {/* Live Status Badge */}
      <div className="flex items-center gap-1.5 pr-3 border-r border-border/40 shrink-0">
        <span className="relative flex h-2 w-2">
          {isLive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isLive ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>
        <span className="text-[11px] uppercase tracking-wider font-semibold text-foreground/80">
          {isLive ? 'LIVE' : 'SYNCING'}
        </span>
      </div>

      {/* Global Telemetry */}
      {telemetry && (
        <div className="hidden md:flex items-center gap-3 px-3 border-r border-border/40 shrink-0 text-muted-foreground/90">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/60">MCAP:</span>
            <span className="text-foreground/90 font-medium">
              {formatCompact(telemetry.marketCap)}
            </span>
            {telemetry.marketCapChange != null && (
              <span
                className={
                  telemetry.marketCapChange >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }
              >
                {telemetry.marketCapChange >= 0 ? '+' : ''}
                {telemetry.marketCapChange.toFixed(2)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-muted-foreground/60">24H VOL:</span>
            <span className="text-foreground/90 font-medium">
              {formatCompact(telemetry.volume)}
            </span>
          </div>

          {telemetry.btcDominance != null && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground/60">BTC DOM:</span>
              <span className="text-foreground/90 font-medium">
                {telemetry.btcDominance.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Scrolling / Flex Ticker Items */}
      <div className="flex items-center gap-4 px-3 overflow-x-auto no-scrollbar scroll-smooth flex-1 whitespace-nowrap">
        {coins.map((coin) => {
          const change = coin.change24h ?? 0;
          const isUp = change >= 0;
          return (
            <button
              key={coin.id}
              onClick={() => navigate(`/markets?search=${encodeURIComponent(coin.symbol)}`)}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer text-left focus:outline-none"
              title={`View ${coin.name} market data`}
            >
              {coin.image && (
                <img
                  src={coin.image}
                  alt={coin.symbol}
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              )}
              <span className="font-semibold text-foreground/90">{coin.symbol}</span>
              <span className="text-muted-foreground font-medium">
                ${coin.price < 1 ? coin.price.toFixed(4) : coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`text-[11px] ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isUp ? '+' : ''}
                {change.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LiveMarketTickerBar;
