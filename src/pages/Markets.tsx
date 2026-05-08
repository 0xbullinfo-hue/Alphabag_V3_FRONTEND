import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
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

  useEffect(() => {
    fetchMarketData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(() => {
      fetchMarketData();
    }, 60000); // 60s Auto-Refresh
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchMarketData = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      // Use cached MarketService
      const data = await MarketService.getMarketData(
        [], // Empty array implies fetching top coins (default behavior in service needs to support this or we adjust service)
        false
      );

      // If service returns empty (error or limit), don't wipe state if we have data
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

  // Compact number: $49.09B, $2.48T, $183.9M etc.
  const fmt = (val: number) => {
    if (!val) return '$–';
    if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T';
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(1) + 'K';
    return '$' + val.toFixed(2);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative flex items-center gap-3">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">Market</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alphabag-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-alphabag-green"></span>
            </span>
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-alphabag-subtext text-xs font-bold uppercase tracking-widest">Top 100 Crypto Assets</p>
            <div className="h-1 w-1 rounded-full bg-alphabag-subtext"></div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="text-[10px] text-alphabag-yellow font-bold uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isRefreshing ? 'Syncing...' : 'Refresh Feed'}
            </button>
            <span className="text-[10px] text-alphabag-subtext font-mono">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search Token / Contract..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-alphabag-dark border border-alphabag-gray rounded-xl py-3 pl-12 pr-4 text-white focus:border-alphabag-yellow outline-none transition-colors"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-subtext" size={18} />
        </div>
      </div>

      <div className="bg-alphabag-dark border border-alphabag-gray rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-alphabag-black/40 border-b border-alphabag-gray text-[11px] text-zinc-400 font-bold capitalize">
              <tr>
                <th className="py-3 px-2 pl-4 w-12 text-center">#</th>
                <th className="py-3 px-2 text-left">Coin</th>
                <th className="py-3 px-2 text-right">Price</th>
                <th className="py-3 px-2 text-right">1h</th>
                <th className="py-3 px-2 text-right">24h</th>
                <th className="py-3 px-2 text-right">7d</th>
                <th className="py-3 px-2 text-right">24h Volume</th>
                <th className="py-3 px-2 text-right">Market Cap</th>
                <th className="py-3 px-2 pr-4 text-right hidden xl:table-cell">7d Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-alphabag-subtext">
                    <div className="animate-spin w-8 h-8 border-2 border-alphabag-yellow border-t-transparent rounded-full mx-auto mb-4"></div>
                    <span className="text-[10px] uppercase font-bold tracking-widest">Loading Market Data...</span>
                  </td>
                </tr>
              ) : filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-alphabag-subtext font-bold uppercase tracking-widest">
                    No assets found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredCoins.map((coin) => {
                  const pch1h = coin.price_change_percentage_1h_in_currency || 0;
                  const pch24h = coin.price_change_percentage_24h_in_currency || coin.price_change_percentage_24h || 0;
                  const pch7d = coin.price_change_percentage_7d_in_currency || 0;

                  const getPchColor = (val: number) => val >= 0 ? 'text-alphabag-green' : 'text-[#F6465D]';
                  const getPchIcon = (val: number) => val >= 0 ? '▲' : '▼';

                  return (
                    <tr key={coin.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => navigate(`/markets/${coin.id}`)}>
                      <td className="py-3 px-2 pl-4 text-center text-zinc-400 font-medium tabular-nums text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <Star size={12} className="text-zinc-600 hover:text-alphabag-yellow cursor-pointer hidden sm:block shrink-0" />
                          {coin.market_cap_rank}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-left">
                        <div className="flex items-center space-x-2">
                          <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full shrink-0" />
                          <div className="flex items-baseline space-x-1.5 min-w-0">
                            <span className="font-bold text-white tracking-tight text-[13px] truncate max-w-[120px]">{coin.name}</span>
                            <span className="text-[11px] font-semibold text-zinc-500 uppercase shrink-0">{coin.symbol}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-white tabular-nums text-[13px]">
                        ${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 4 : 2 })}
                      </td>
                      <td className={`py-3 px-2 text-right font-medium tabular-nums text-[13px] ${getPchColor(pch1h)}`}>
                        <span className="text-[9px] mr-0.5">{getPchIcon(pch1h)}</span>{Math.abs(pch1h).toFixed(1)}%
                      </td>
                      <td className={`py-3 px-2 text-right font-medium tabular-nums text-[13px] ${getPchColor(pch24h)}`}>
                        <span className="text-[9px] mr-0.5">{getPchIcon(pch24h)}</span>{Math.abs(pch24h).toFixed(1)}%
                      </td>
                      <td className={`py-3 px-2 text-right font-medium tabular-nums text-[13px] ${getPchColor(pch7d)}`}>
                        <span className="text-[9px] mr-0.5">{getPchIcon(pch7d)}</span>{Math.abs(pch7d).toFixed(1)}%
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-zinc-300 tabular-nums text-[13px]">
                        {fmt(coin.total_volume)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-zinc-300 tabular-nums text-[13px]">
                        {fmt(coin.market_cap)}
                      </td>
                      <td className="py-3 px-2 pr-4 hidden xl:table-cell">
                        {/* Placeholder for Sparkline. If data present, it would be an SVG. The image shows a small red/green jagged line */}
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
                          <div className="w-[90px] h-[28px] ml-auto bg-white/5 rounded"></div>
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
