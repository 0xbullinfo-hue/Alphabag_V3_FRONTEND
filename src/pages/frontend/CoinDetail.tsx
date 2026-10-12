import { ArrowLeft, Share2, ShieldCheck, Star, Wallet, Zap } from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import { Link,useNavigate,useParams } from 'react-router-dom';
import { Area,AreaChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis } from 'recharts';
import { Button } from '../../components/ui/Button';
import { useWallet } from '../../context/WalletContext';
import { Coin,PortfolioItem } from '../../types';

import { MarketService } from '../../services/MarketService';
import { api } from '../../services/api';

export const CoinDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isConnected, portfolioItems } = useWallet();
    const [coin, setCoin] = useState<Coin | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [holding, setHolding] = useState<PortfolioItem | undefined>(undefined);
    const [timeframe, setTimeframe] = useState('1D');
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isFetchingAi, setIsFetchingAi] = useState(false);
    const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
    const [audit, setAudit] = useState<{ score: number; label: string; color: string; bgClass: string; shadowClass: string } | null>(null);

    useEffect(() => {
        const loadCoinData = async () => {
            if (!id) return;
            setNotFound(false);

            try {
                const data = await MarketService.getMarketData([id], true); // Fetch with sparkline
                if (data && data.length > 0) {
                    const realCoin = data[0];
                    setCoin({
                        ...realCoin,
                        sparkline_in_7d: { price: realCoin.sparkline_in_7d?.price || [] }
                    });
                    fetchAiInsight(realCoin.name, realCoin.symbol);
                    return;
                }
            } catch (e) {
                console.warn("Failed to fetch real-time coin details:", e);
            }

            // NOTE: this previously fell back to MOCK_COINS (now empty) and
            // then, if that also missed, fabricated an entire coin —
            // random price, random market cap, random rank, random 24h
            // change, random sparkline — all confidently rendered as if
            // real. A trader could pull up an obscure or mistyped coin ID
            // and see a completely made-up price with no indication it
            // wasn't real. This now shows an honest "not found" state
            // instead of inventing data.
            setNotFound(true);
        };
        loadCoinData();
    }, [id]);

    useEffect(() => {
        // NOTE: this used to compute a "Smart Audit Score" from the coin's
        // market-cap rank and the length of its name — a fully fabricated
        // number with a progress bar and the caption "Audited by Certik",
        // regardless of whether Certik (or anyone) had ever audited the
        // asset. That's a false third-party-certification claim, not just
        // placeholder UI. Until a real audit provider (e.g. GoPlus,
        // Honeypot.is, TokenSniffer) is wired in, this section now shows
        // an honest "not available" state instead — see the render below.
        setAudit(null);
    }, [coin]);

    useEffect(() => {
        if (coin) {
            setHolding(portfolioItems.find(p => p.coinId === coin.id));
        }
    }, [coin, portfolioItems]);

    const fetchAiInsight = async (coinName: string, symbol: string) => {
        setIsFetchingAi(true);
        setGroundingLinks([]);
        try {
            const response = await api.post('/api/ai/briefing', {
                marketData: {
                  assetId: id,
                  name: coinName,
                  symbol,
                },
                userMessage: `Summarize the current verified market facts for ${coinName} (${symbol}). Do not invent prices or technical indicators.`,
            });
            setAiInsight(response.data?.briefing || response.data?.summary || "Verified AI analysis is unavailable.");
        } catch (e) {
            console.error("AI Insight Error:", e);
            setAiInsight("Unable to fetch live technical analysis at this moment. Asset remains in a consolidation phase.");
        } finally {
            setIsFetchingAi(false);
        }
    };

    if (notFound) return (
        <div className="flex flex-col items-center justify-center h-96 text-alphabag-subtext text-center px-4">
            <p className="text-lg font-bold text-white mb-1">Asset data unavailable</p>
            <p className="text-sm max-w-sm">We couldn't find live market data for this asset. It may be delisted, too new, or not tracked by our data provider.</p>
            <Link to="/markets" className="mt-4 text-alphabag-yellow text-sm font-bold uppercase tracking-widest">Back to Markets</Link>
        </div>
    );

    if (!coin) return (
        <div className="flex flex-col items-center justify-center h-96 text-alphabag-subtext">
            <div className="w-10 h-10 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Loading Asset Details...</p>
        </div>
    );

    // Use the real 7-day sparkline from the market data API when available.
    // Previously this ALWAYS discarded any real sparkline data and instead
    // fabricated a random walk around the current price — meaning the
    // price chart was fake even on coins where real historical data had
    // just been fetched. When no sparkline is available, show a flat
    // reference line rather than inventing volatility.
    const realSparkline = coin.sparkline_in_7d?.price;
    const chartData = realSparkline && realSparkline.length > 0
        ? realSparkline.map((price, i) => ({ time: i, price }))
        : Array.from({ length: 20 }, (_, i) => ({ time: i, price: coin.current_price }));
    const hasRealChart = Boolean(realSparkline && realSparkline.length > 0);

    const isPositive = coin.price_change_percentage_24h >= 0;

    return (
        <div className="space-y-2 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                    <Link to="/markets" className="p-1.5 bg-alphabag-dark border border-alphabag-gray hover:text-white rounded-md transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="flex items-center space-x-2">
                        <img src={coin.image} className="w-10 h-10 rounded-full p-1 bg-alphabag-gray" alt={coin.name} />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight leading-tight">{coin.name} <span className="text-alphabag-subtext text-lg md:text-xl font-normal">({coin.symbol.toUpperCase()})</span></h1>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className="bg-alphabag-black text-[11px] px-2 py-0.5 rounded text-alphabag-yellow border border-alphabag-gray font-medium uppercase tracking-wider">Rank #{coin.market_cap_rank}</span>
                                <span className="text-[11px] text-alphabag-subtext uppercase font-medium tracking-wider">Market Intelligence Feed</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" className="bg-alphabag-dark border border-alphabag-gray"><Star size={16} className="mr-2" /> Watchlist</Button>
                    <Button variant="ghost" className="bg-alphabag-dark border border-alphabag-gray"><Share2 size={16} /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <div className="lg:col-span-2 space-y-2">
                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-lg p-4 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
                            <div>
                                <p className="text-alphabag-subtext text-[11px] font-medium uppercase tracking-wider mb-1">Current Value</p>
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-3xl font-semibold text-white tracking-tight num">${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    <span className={`text-base font-semibold px-2 py-0.5 rounded num ${isPositive ? 'bg-alphabag-green/10 text-alphabag-green' : 'bg-alphabag-red/10 text-alphabag-red'}`}>
                                        {isPositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-right w-full md:w-auto">
                                <div>
                                    <p className="text-alphabag-subtext text-[11px] font-medium uppercase tracking-wider">24h High</p>
                                    <p className="text-white font-semibold text-sm num">{coin.current_price_24h_high != null ? `${coin.current_price_24h_high.toLocaleString()}` : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-alphabag-subtext text-[11px] font-medium uppercase tracking-wider">24h Low</p>
                                    <p className="text-white font-semibold text-sm num">{coin.current_price_24h_low != null ? `${coin.current_price_24h_low.toLocaleString()}` : '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-lg p-4 relative overflow-hidden group">
                        <div className="flex items-start space-x-3 relative z-10">
                            <div className="w-9 h-9 bg-alphabag-yellow/10 border border-alphabag-yellow/20 rounded-md flex items-center justify-center shrink-0">
                                <Zap size={18} className="text-alphabag-yellow fill-current" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2 mb-1.5">
                                    <h3 className="text-alphabag-yellow font-semibold uppercase text-[11px] tracking-wider">Market Intelligence Summary</h3>
                                </div>
                                <div className="text-[13px] text-alphabag-text leading-relaxed font-normal">
                                    {isFetchingAi ? (
                                        <div className="flex items-center space-x-2">
                                            <span className="italic text-alphabag-subtext text-xs">Aggregating market sentiment...</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <p>{aiInsight}</p>
                                            {groundingLinks.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-alphabag-gray">
                                                    <p className="text-[11px] text-alphabag-subtext uppercase font-semibold mb-2">Sources:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {groundingLinks.map((link, idx) => link.web && (
                                                            <a
                                                                key={idx}
                                                                href={link.web.uri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[11px] text-alphabag-yellow hover:underline bg-alphabag-yellow/5 px-2 py-0.5 rounded"
                                                            >
                                                                {link.web.title || 'Source'}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-lg p-4 h-[500px] flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 pb-4 border-b border-alphabag-gray/30">
                            <div className="flex space-x-1.5 bg-alphabag-black p-1 rounded-md border border-alphabag-gray">
                                {['15m', '1H', '4H', '1D', '1W', '1M'].map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all uppercase tracking-wider ${timeframe === tf
                                            ? 'bg-alphabag-yellow text-alphabag-black'
                                            : 'text-alphabag-subtext hover:text-white hover:bg-alphabag-gray'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] font-medium text-alphabag-subtext uppercase tracking-wider">
                                <span>{hasRealChart ? '7-Day Price History' : 'Live sparkline unavailable — showing current price only'}</span>
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isPositive ? '#0ECB81' : '#F6465D'} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={isPositive ? '#0ECB81' : '#F6465D'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" vertical={false} strokeOpacity={0.2} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        orientation="right"
                                        tick={{ fill: '#848E9C', fontSize: 11, fontWeight: '500' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0B0E11', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '4px' }}
                                        itemStyle={{ color: '#EAECEF', fontWeight: '500' }}
                                        cursor={{ stroke: '#848E9C', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Market Price']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="price"
                                        stroke={isPositive ? '#0ECB81' : '#F6465D'}
                                        fillOpacity={1}
                                        fill="url(#colorPrice)"
                                        strokeWidth={2}
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-lg p-4 relative overflow-hidden">
                        <h3 className="text-xs font-semibold mb-2 text-alphabag-text flex items-center uppercase tracking-wider">
                            <Wallet size={16} className="mr-2 text-alphabag-yellow" /> Wallet Position
                        </h3>

                        {isConnected && holding ? (
                            <div className="space-y-2 relative z-10">
                                <div>
                                    <p className="text-alphabag-subtext text-[11px] font-medium uppercase tracking-wider mb-1">Position Value</p>
                                    <div className="text-3xl font-semibold text-white tracking-tight num">${holding.value.toLocaleString()}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-alphabag-gray/50">
                                    <div>
                                        <p className="text-alphabag-subtext text-[11px] font-medium uppercase tracking-wider mb-1">Balance</p>
                                        <p className="font-semibold text-white text-base num">{holding.amount.toLocaleString()} {coin.symbol.toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-alphabag-subtext text-[11px] font-medium uppercase tracking-wider mb-1">Total P&L</p>
                                        <p className={`font-semibold text-base num ${holding.pnl >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                            {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Button variant="danger" size="sm" className="w-full font-semibold uppercase tracking-wider" onClick={() => navigate('/settings')} title="Remove Connection Tracking">Remove Tracking</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 relative z-10">
                                <p className="text-alphabag-subtext text-xs mb-3 leading-relaxed">Connect your wallet to track your <b>{coin.name}</b> holdings and analyze entry performance.</p>
                                <Button variant="primary" size="sm" className="w-full font-semibold uppercase tracking-wider" onClick={() => navigate('/settings')}>Connect & Track</Button>
                            </div>
                        )}
                    </div>

                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-lg p-4">
                        <h3 className="text-xs font-semibold mb-2 text-alphabag-text uppercase tracking-wider">Asset Intelligence</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b border-alphabag-gray/30">
                                <span className="text-alphabag-subtext text-xs font-medium uppercase">Market Cap</span>
                                <span className="font-semibold text-white text-sm num">{coin.market_cap ? `${(coin.market_cap / 1e9).toFixed(2)}B` : 'Unavailable'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-alphabag-gray/30">
                                <span className="text-alphabag-subtext text-xs font-medium uppercase">Volume (24h)</span>
                                <span className="font-semibold text-white text-sm num">{coin.total_volume ? `${(coin.total_volume / 1e9).toFixed(2)}B` : 'Unavailable'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-alphabag-gray/30">
                                <span className="text-alphabag-subtext text-xs font-medium uppercase">Circ. Supply</span>
                                <span className="font-semibold text-white text-sm num">
                                    {(coin as any).circulating_supply
                                        ? `${((coin as any).circulating_supply as number).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${coin.symbol.toUpperCase()}`
                                        : 'Unavailable'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-alphabag-subtext text-xs font-medium uppercase">All Time High</span>
                                <span className="font-semibold text-white text-sm num">
                                    {(coin as any).ath != null
                                        ? `$${Number((coin as any).ath).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : 'Unavailable'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-lg p-4 relative">
                        <h3 className="text-xs font-semibold mb-2 text-alphabag-text uppercase tracking-wider flex items-center">
                            <ShieldCheck size={16} className={`mr-2 ${audit ? audit.color : 'text-alphabag-subtext'}`} /> Smart Audit Score
                        </h3>
                        {audit && audit.score > 0 ? (
                            <>
                                <div className="flex items-end space-x-2 mb-2">
                                    <div className="text-4xl font-semibold text-white tracking-tight num">{audit.score}<span className="text-base text-alphabag-subtext ml-1">/100</span></div>
                                    <div className={`text-[11px] ${audit.color} font-semibold uppercase tracking-wider pb-1`}>{audit.label}</div>
                                </div>
                                <div className="w-full bg-alphabag-black h-2 rounded overflow-hidden border border-alphabag-gray">
                                    <div className={`bg-gradient-to-r ${audit.bgClass} h-full`} style={{ width: `${audit.score}%` }}></div>
                                </div>
                                <p className="text-[11px] text-alphabag-subtext mt-3 font-medium uppercase tracking-wider opacity-60">Score sourced from on-chain contract metrics</p>
                            </>
                        ) : (
                            <div className="py-2">
                                <p className="text-xs font-semibold text-white mb-1">Audit data unavailable</p>
                                <p className="text-[11px] text-alphabag-subtext leading-relaxed">Contract audit and security verification scores are not currently available for this asset.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
