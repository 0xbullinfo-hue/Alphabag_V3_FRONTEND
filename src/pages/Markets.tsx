import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Star, RefreshCw, Activity, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketService } from '../services/MarketService';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchMarketData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(() => {
      fetchMarketData();
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchMarketData = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      const data = await MarketService.getMarketData([], false);
      if (data && data.length > 0) {
        setCoins(data);
        setLastUpdated(new Date());
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching market data:", error);
      setLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    if (!isRefreshing) fetchMarketData();
  };

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fmt = (val: number) => {
    if (!val) return '$–';
    if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T';
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(1) + 'K';
    return '$' + val.toFixed(2);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12 px-4 md:px-8 animate-in fade-in duration-700">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-[#2b3139] gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
              <BarChart3 size={20} />
            </div>
            <h1 className="text-3xl font-semibold text-[#eaecef] tracking-tight">
              Global Market
            </h1>
            <span className="relative flex h-2 w-2 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0ecb81] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0ecb81]"></span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[#848e9c] text-sm font-medium">Top 100 Crypto Assets</p>
            <span className="text-[#848e9c]">·</span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="text-[11px] text-[#fcd535] font-semibold uppercase tracking-wider hover:text-[#eaecef] transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Syncing...' : 'Refresh'}
            </button>
            <span className="text-[10px] text-[#848e9c] font-mono">{lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#848e9c]" size={15} />
          <input
            type="text"
            placeholder="Search token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md py-2.5 pl-10 pr-4 text-[13px] text-[#eaecef] placeholder-[#848e9c] focus:border-[#fcd535] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Market Table */}
      <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0b0e11] border-b border-[#2b3139] text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#2b3139] text-[12px]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[#848e9c]">
                    <div className="animate-spin w-7 h-7 border-2 border-[#fcd535] border-t-transparent rounded-full mx-auto mb-3"></div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider">Loading Market Data...</span>
                  </td>
                </tr>
              ) : filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[#848e9c] font-semibold uppercase tracking-wider text-xs">
                    No assets found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredCoins.map((coin) => {
                  const pch1h = coin.price_change_percentage_1h_in_currency || 0;
                  const pch24h = coin.price_change_percentage_24h_in_currency || coin.price_change_percentage_24h || 0;
                  const pch7d = coin.price_change_percentage_7d_in_currency || 0;
                  const getPchColor = (val: number) => val >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]';
                  const getPchIcon = (val: number) => val >= 0 ? '▲' : '▼';

                  return (
                    <tr
                      key={coin.id}
                      className="hover:bg-[#2b3139]/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/markets/${coin.id}`)}
                    >
                      <td className="py-3 px-3 pl-5 text-center text-[#848e9c] font-medium tabular-nums text-[11px]">
                        <div className="flex items-center justify-center gap-2">
                          <Star size={11} className="text-[#474d57] hover:text-[#fcd535] cursor-pointer hidden sm:block shrink-0" />
                          {coin.market_cap_rank}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full shrink-0" />
                          <div className="flex items-baseline space-x-1.5 min-w-0">
                            <span className="font-semibold text-[#eaecef] text-[12px] truncate max-w-[120px]">{coin.name}</span>
                            <span className="text-[10px] font-semibold text-[#848e9c] uppercase shrink-0">{coin.symbol}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-[#eaecef] tabular-nums text-[12px]">
                        ${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 4 : 2 })}
                      </td>
                      <td className={`py-3 px-3 text-right font-medium tabular-nums text-[12px] ${getPchColor(pch1h)}`}>
                        <span className="text-[8px] mr-0.5">{getPchIcon(pch1h)}</span>{Math.abs(pch1h).toFixed(1)}%
                      </td>
                      <td className={`py-3 px-3 text-right font-medium tabular-nums text-[12px] ${getPchColor(pch24h)}`}>
                        <span className="text-[8px] mr-0.5">{getPchIcon(pch24h)}</span>{Math.abs(pch24h).toFixed(1)}%
                      </td>
                      <td className={`py-3 px-3 text-right font-medium tabular-nums text-[12px] ${getPchColor(pch7d)}`}>
                        <span className="text-[8px] mr-0.5">{getPchIcon(pch7d)}</span>{Math.abs(pch7d).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-[#848e9c] tabular-nums text-[12px]">
                        {fmt(coin.total_volume)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-[#848e9c] tabular-nums text-[12px]">
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
                          <div className="w-[90px] h-[28px] ml-auto bg-[#2b3139] rounded"></div>
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
