import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, Star, RefreshCw, Activity, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketService } from '../../services/MarketService';
import { DataSourceBadge } from '../../components/ui/DataSourceBadge';

interface CoinData {
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
  sparkline_in_7d?: { price: number[] };
}

export const Markets: React.FC = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshLock = useRef(false);

  const fetchMarketData = useCallback(async (silent = false) => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    try {
      if (!silent) setLoading(true);
      setIsRefreshing(true);
      const data = await MarketService.getMarketData([], false);
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      if (list && list.length > 0) {
        setCoins(list);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      refreshLock.current = false;
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMarketData(true);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMarketData(true);
      }
    }, 60000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchMarketData]);

  const handleManualRefresh = () => {
    if (!isRefreshing) fetchMarketData(true);
  };

  const filteredCoins = useMemo(() => {
    const safeCoins = Array.isArray(coins) ? coins : [];
    const query = searchQuery.toLowerCase();
    return safeCoins.filter((coin) =>
      Boolean(coin && (coin.name?.toLowerCase().includes(query) || coin.symbol?.toLowerCase().includes(query)))
    );
  }, [coins, searchQuery]);

  const fmt = (val: number) => {
    if (!val) return '$–';
    if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T';
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(1) + 'K';
    return '$' + val.toFixed(2);
  };

  return (
    <div className="w-full space-y-2 pb-2 animate-in fade-in duration-700">

      {/* Page Header */}
      <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-dark">
              <BarChart3 size={20} />
            </div>
            <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">
              Global Market
            </h1>
            <span className="relative flex h-2 w-2 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alphabag-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-alphabag-green"></span>
            </span>
            <DataSourceBadge className="ml-auto md:ml-4" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-alphabag-subtext text-sm font-medium">Top 100 Crypto Assets</p>
            <span className="text-alphabag-subtext">·</span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="text-[11px] text-alphabag-yellow font-semibold uppercase tracking-wider hover:text-alphabag-text transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Syncing...' : 'Refresh'}
            </button>
            <span className="text-[10px] text-alphabag-subtext font-mono">{lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-alphabag-subtext" size={15} />
          <input
            type="text"
            placeholder="Search token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-alphabag-black border border-alphabag-gray rounded-md py-2.5 pl-10 pr-4 text-[13px] text-alphabag-text placeholder-alphabag-subtext focus:border-alphabag-yellow outline-none transition-colors"
          />
        </div>
      </div>

      {/* Market Table */}
      <div className="rounded-lg border border-alphabag-gray bg-alphabag-darkgray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-alphabag-dark border-b border-alphabag-gray text-xs text-alphabag-subtext font-semibold tracking-normal">
              <tr>
                <th className="py-3 px-3 pl-5 w-12 text-center">#</th>
                <th className="py-3 px-3 text-left">Coin</th>
                <th className="py-3 px-3 text-right">Price</th>
                <th className="py-3 px-3 text-right">1h</th>
                <th className="py-3 px-3 text-right">24h</th>
                <th className="py-3 px-3 text-right">7d</th>
                <th className="py-3 px-3 text-right">24h Volume</th>
                <th className="py-3 px-3 text-right">Market Cap</th>
                <th className="py-3 px-4 text-right hidden xl:table-cell">7d Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-alphabag-gray text-[14px]">
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-7 skeleton" />
                    </td>
                  </tr>
                ))
              ) : filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-alphabag-subtext font-semibold uppercase tracking-wider text-xs">
                    No assets found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredCoins.map((coin) => {
                  const pch1h = coin.price_change_percentage_1h_in_currency || 0;
                  const pch24h = coin.price_change_percentage_24h_in_currency || coin.price_change_percentage_24h || 0;
                  const pch7d = coin.price_change_percentage_7d_in_currency || 0;
                  const getPchColor = (val: number) => val >= 0 ? 'text-alphabag-green' : 'text-alphabag-red';
                  const getPchIcon = (val: number) => val >= 0 ? '▲' : '▼';

                  return (
                    <tr
                      key={coin.id}
                      className="hover:bg-alphabag-gray/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/markets/${coin.id}`)}
                    >
                      <td className="py-3 px-3 pl-5 text-center text-alphabag-subtext font-medium tabular-nums text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <Star size={11} className="text-alphabag-muted hover:text-alphabag-yellow cursor-pointer hidden sm:block shrink-0" />
                          {coin.market_cap_rank}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full shrink-0" />
                          <div className="flex items-baseline space-x-1.5 min-w-0">
                            <span className="font-semibold text-alphabag-text text-[14px] truncate max-w-[120px]">{coin.name}</span>
                            <span className="text-[12px] font-semibold text-alphabag-subtext uppercase shrink-0">{coin.symbol}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-alphabag-text tabular-data text-[14px]">
                        ${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 4 : 2 })}
                      </td>
                      <td className={`py-3 px-3 text-right font-medium tabular-data text-[14px] ${getPchColor(pch1h)}`}>
                        <span className="text-[8px] mr-0.5">{getPchIcon(pch1h)}</span>{Math.abs(pch1h).toFixed(1)}%
                      </td>
                      <td className={`py-3 px-3 text-right font-medium tabular-data text-[14px] ${getPchColor(pch24h)}`}>
                        <span className="text-[8px] mr-0.5">{getPchIcon(pch24h)}</span>{Math.abs(pch24h).toFixed(1)}%
                      </td>
                      <td className={`py-3 px-3 text-right font-medium tabular-data text-[14px] ${getPchColor(pch7d)}`}>
                        <span className="text-[8px] mr-0.5">{getPchIcon(pch7d)}</span>{Math.abs(pch7d).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-alphabag-subtext tabular-data text-[14px]">
                        {fmt(coin.total_volume)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-alphabag-subtext tabular-data text-[14px]">
                        {fmt(coin.market_cap)}
                      </td>
                      <td className="py-3 px-4 hidden xl:table-cell">
                        {coin.sparkline_in_7d && coin.sparkline_in_7d.price.length > 0 ? (
                          <svg viewBox="0 0 100 30" className="w-[90px] h-[28px] ml-auto overflow-visible" preserveAspectRatio="none">
                            <polyline
                              fill="none"
                              stroke={pch7d >= 0 ? '#0ECB81' : '#F6465D'}
                              strokeWidth="1.5"
                              points={coin.sparkline_in_7d.price.map((p, i, arr) => {
                                const max = Math.max(...arr);
                                const min = Math.min(...arr);
                                const range = max - min || 1;
                                const x = (i / (arr.length - 1)) * 100;
                                const y = 30 - (((p - min) / range) * 30);
                                return `${x},${y}`;
                              }).join(' ')}
                            />
                          </svg>
                        ) : (
                          <div className="w-[90px] h-[28px] ml-auto bg-alphabag-gray rounded"></div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
