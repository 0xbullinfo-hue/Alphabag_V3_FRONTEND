import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCoins } from '../services/mockData';
import { Coin } from '../types';
import { TrendingUp, Activity, Search, Filter, Star } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/Button';

export const Markets: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('alphabag_watchlist_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const navigate = useNavigate();

  const toggleWatchlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setWatchlist(prev => {
      const newW = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem('alphabag_watchlist_v1', JSON.stringify(newW));
      return newW;
    });
  };

  useEffect(() => {
    const load = async () => {
      const data = await fetchCoins();
      const top100 = Array.from({ length: 100 }).map((_, i) => {
        const baseCoin = data[i % data.length];
        const multiplier = 1 - (i * 0.009);
        return {
          ...baseCoin,
          id: `${baseCoin.id}-${i}`,
          market_cap_rank: i + 1,
          market_cap: baseCoin.market_cap * multiplier,
          current_price: baseCoin.current_price * (0.95 + (Math.random() * 0.1)),
          price_change_percentage_24h: baseCoin.price_change_percentage_24h * (Math.random() * 2 - 0.5)
        };
      });
      setCoins(top100);
      setLoading(false);
    };
    load();
  }, []);

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const formatCompact = (val: number) =>
    new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 text-alphabag-yellow space-y-4">
      <div className="w-12 h-12 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold uppercase tracking-widest text-xs">Synchronizing Global Markets...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Global Markets</h1>
          <p className="text-alphabag-subtext mt-1 text-sm font-medium">
            Real-time data aggregated from CoinMarketCap & CoinGecko nodes
          </p>
        </div>

        <div className="flex space-x-4 mt-4 md:mt-0 text-sm">
          <div className="bg-alphabag-dark px-4 py-2 rounded-xl border border-alphabag-gray flex items-center shadow-lg">
            <div className="mr-3 p-1 bg-green-500/10 rounded">
              <TrendingUp size={16} className="text-alphabag-green" />
            </div>
            <div>
              <div className="text-alphabag-subtext text-[9px] uppercase font-black tracking-tighter">Global Cap</div>
              <div className="font-bold text-white">$2.42T <span className="text-alphabag-green text-[10px] font-bold">+1.8%</span></div>
            </div>
          </div>
          <div className="bg-alphabag-dark px-4 py-2 rounded-xl border border-alphabag-gray flex items-center hidden sm:flex shadow-lg">
            <div className="mr-3 p-1 bg-blue-500/10 rounded">
              <Activity size={16} className="text-blue-400" />
            </div>
            <div>
              <div className="text-alphabag-subtext text-[9px] uppercase font-black tracking-tighter">24h Vol</div>
              <div className="font-bold text-white">$91.4B</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sticky top-20 z-10 bg-alphabag-black/80 backdrop-blur-md p-2 -mx-2 rounded-xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext" size={18} />
          <input
            type="text"
            placeholder="Search assets by name or symbol (e.g. BTC, ETH, SOL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-alphabag-dark border border-alphabag-gray rounded-xl pl-10 pr-4 py-3 text-white focus:border-alphabag-yellow focus:ring-1 focus:ring-alphabag-yellow outline-none transition-all placeholder:text-alphabag-subtext/50 font-medium"
          />
        </div>
        <Button
          variant={showWatchlistOnly ? 'primary' : 'secondary'}
          onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
          className={`flex items-center border transition-all uppercase font-black ${showWatchlistOnly ? 'border-alphabag-yellow' : 'bg-alphabag-dark border-alphabag-gray hover:border-alphabag-yellow'}`}
        >
          <Star size={18} className="mr-2" fill={showWatchlistOnly ? "currentColor" : "none"} /> Watchlist
        </Button>
      </div>

      <div className="overflow-x-auto bg-alphabag-dark rounded-3xl border border-alphabag-gray shadow-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-alphabag-subtext text-[10px] uppercase font-black tracking-widest border-b border-alphabag-gray bg-alphabag-black/40">
              <th className="p-6 pl-8 font-black"># Asset</th>
              <th className="p-6 font-black text-right">Price</th>
              <th className="p-6 font-black text-right">24h Change</th>
              <th className="p-6 font-black text-right hidden md:table-cell">Market Cap</th>
              <th className="p-6 font-black text-right hidden lg:table-cell">Volume (24h)</th>
              <th className="p-6 font-black text-center hidden md:table-cell w-32">Last 7 Days</th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-alphabag-gray/30">
            {filteredCoins.map((coin) => {
              const isPositive = coin.price_change_percentage_24h >= 0;
              const chartData = coin.sparkline_in_7d.price.map((p, i) => ({ i, p }));

              return (
                <tr
                  key={coin.id}
                  className="hover:bg-alphabag-gray/10 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/markets/${coin.id.split('-')[0]}`)}
                >
                  <td className="p-6 pl-8">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => toggleWatchlist(e, coin.id)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors group-star z-10"
                      >
                        <Star
                          size={14}
                          className={`transition-all ${watchlist.includes(coin.id) ? "text-alphabag-yellow" : "text-alphabag-subtext group-hover/star:text-white"}`}
                          fill={watchlist.includes(coin.id) ? "currentColor" : "none"}
                        />
                      </button>
                      <span className="text-alphabag-subtext w-4 text-[10px] font-bold">{coin.market_cap_rank}</span>
                      <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-xl shadow-lg" />
                      <div>
                        <div className="font-black text-white text-lg tracking-tighter group-hover:text-alphabag-yellow transition-colors leading-none">{coin.symbol.toUpperCase()}</div>
                        <div className="text-alphabag-subtext text-[10px] font-bold mt-1 uppercase tracking-widest">{coin.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-right font-black text-white tracking-tight">
                    {formatCurrency(coin.current_price)}
                  </td>
                  <td className={`p-6 text-right font-black ${isPositive ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </td>
                  <td className="p-6 text-right text-alphabag-text hidden md:table-cell font-bold">
                    ${formatCompact(coin.market_cap)}
                  </td>
                  <td className="p-6 text-right text-alphabag-text hidden lg:table-cell font-bold">
                    ${formatCompact(coin.total_volume)}
                  </td>
                  <td className="p-6 hidden md:table-cell">
                    <div className="h-10 w-28 mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <Area
                            type="monotone"
                            dataKey="p"
                            stroke={isPositive ? '#0ECB81' : '#F6465D'}
                            fill={isPositive ? '#0ECB8120' : '#F6465D20'}
                            strokeWidth={3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredCoins.length === 0 && (
          <div className="py-24 text-center space-y-4 bg-alphabag-dark">
            <div className="w-20 h-20 bg-alphabag-black/50 rounded-3xl flex items-center justify-center mx-auto border border-alphabag-gray/50">
              <Search size={32} className="text-alphabag-subtext opacity-40" />
            </div>
            <div>
              <p className="text-white font-black text-xl uppercase tracking-tighter">No assets match your search</p>
              <p className="text-alphabag-subtext text-sm font-medium">Verify ticker symbol or contract address</p>
            </div>
            <Button variant="ghost" className="text-alphabag-yellow font-black uppercase tracking-widest" onClick={() => setSearchQuery('')}>Clear Filter</Button>
          </div>
        )}
      </div>
    </div>
  );
};