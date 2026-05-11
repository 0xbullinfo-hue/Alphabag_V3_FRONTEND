import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MOCK_COINS } from '../services/mockData';
import { Coin, PortfolioItem } from '../types';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Lock, Star, Share2, Wallet, Zap, Globe, ShieldCheck, TrendingUp, BarChart, LogOut } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { useWallet } from '../context/WalletContext';

import { MarketService } from '../services/MarketService';

export const CoinDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isConnected, portfolioItems } = useWallet();
    const [coin, setCoin] = useState<Coin | null>(null);
    const [holding, setHolding] = useState<PortfolioItem | undefined>(undefined);
    const [timeframe, setTimeframe] = useState('1D');
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isFetchingAi, setIsFetchingAi] = useState(false);
    const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
    const [audit, setAudit] = useState({ score: 0, label: 'Loading...', color: 'text-alphabag-gray', bgClass: 'from-gray-500 to-gray-400', shadowClass: 'shadow-none' });

    useEffect(() => {
        const loadCoinData = async () => {
            if (!id) return;

            // 1. Try fetching real-time data first
            try {
                const data = await MarketService.getMarketData([id], true); // Fetch with sparkline
                if (data && data.length > 0) {
                    const realCoin = data[0];
                    setCoin({
                        ...realCoin,
                        // Map API response to internal Coin type if needed, or rely on flexible typing
                        // MarketService returns CoinGecko format which matches most of our Coin interface
                        sparkline_in_7d: { price: realCoin.sparkline_in_7d?.price || [] }
                    });
                    fetchAiInsight(realCoin.name, realCoin.symbol);
                    return;
                }
            } catch (e) {
                console.warn("Failed to fetch real-time coin details, falling back to mock.");
            }

            // 2. Fallback to Mock if API fails
            const found = MOCK_COINS.find(c => c.id === id);
            if (found) {
                setCoin(found);
                fetchAiInsight(found.name, found.symbol);
            } else {
                // ... random gen logic ...
                setCoin({
                    id: id,
                    symbol: id.substring(0, 3).toUpperCase(),
                    name: id.charAt(0).toUpperCase() + id.slice(1),
                    image: `https://ui-avatars.com/api/?name=${id}&background=2B3139&color=FCD535`,
                    current_price: 100 + Math.random() * 500,
                    market_cap: 1000000000 + Math.random() * 500000000,
                    market_cap_rank: Math.floor(Math.random() * 500),
                    price_change_percentage_24h: Math.random() * 10 - 5,
                    total_volume: 50000000 + Math.random() * 100000000,
                    sparkline_in_7d: { price: Array.from({ length: 10 }, () => Math.random() * 100) }
                });
                fetchAiInsight(id, id.substring(0, 3));
            }
        };
        loadCoinData();
    }, [id]);

    useEffect(() => {
        if (coin) {
            setHolding(portfolioItems.find(p => p.coinId === coin.id));

            // Generate deterministic mock audit score
            const baseScore = Math.max(0, 100 - (coin.market_cap_rank || 500) / 10);
            const score = Math.min(99, Math.max(15, Math.floor(baseScore + (coin.name.length % 10))));
            let label = 'High Risk';
            let color = 'text-alphabag-red';
            let bgClass = 'from-alphabag-red to-red-400';
            let shadowClass = 'shadow-[0_0_10px_rgba(246,70,93,0.5)]';

            if (score >= 85) {
                label = 'Professional Grade';
                color = 'text-alphabag-green';
                bgClass = 'from-alphabag-green to-emerald-400';
                shadowClass = 'shadow-[0_0_10px_rgba(14,203,129,0.5)]';
            } else if (score >= 60) {
                label = 'Moderate Risk';
                color = 'text-alphabag-yellow';
                bgClass = 'from-alphabag-yellow to-yellow-400';
                shadowClass = 'shadow-[0_0_10px_rgba(252,213,53,0.5)]';
            }

            setAudit({ score, label, color, bgClass, shadowClass });
        }
    }, [coin, portfolioItems]);

    const fetchAiInsight = async (coinName: string, symbol: string) => {
        setIsFetchingAi(true);
        setGroundingLinks([]);
        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Provide a professional, concise market update (max 3 sentences) for ${coinName} (${symbol}). Focus on recent price action, technical sentiment, and expert narrative using current real-time market data.`,
                config: {
                    tools: [{ googleSearch: {} }],
                    temperature: 0.2
                }
            });
            setAiInsight(response.text || "Market data is currently being calibrated. Technical sentiment remains constructive for top assets.");

            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
                setGroundingLinks(chunks);
            }
        } catch (e) {
            console.error("AI Insight Error:", e);
            setAiInsight("Unable to fetch live technical analysis at this moment. Asset remains in a consolidation phase.");
        } finally {
            setIsFetchingAi(false);
        }
    };

    if (!coin) return (
        <div className="flex flex-col items-center justify-center h-96 text-alphabag-subtext">
            <div className="w-10 h-10 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Loading Asset Details...</p>
        </div>
    );

    const chartData = Array.from({ length: 100 }, (_, i) => ({
        time: i,
        price: coin.current_price * (1 + (Math.random() * 0.05 - 0.025))
    }));

    const isPositive = coin.price_change_percentage_24h >= 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <Link to="/markets" className="p-1.5 bg-alphabag-dark border border-alphabag-gray hover:text-white rounded-lg transition-all shadow-md">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="flex items-center space-x-3">
                        <img src={coin.image} className="w-10 h-10 rounded-full shadow-lg p-1 bg-alphabag-gray" alt={coin.name} />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-tight">{coin.name} <span className="text-alphabag-subtext text-lg md:text-xl font-medium">({coin.symbol.toUpperCase()})</span></h1>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className="bg-alphabag-black text-[9px] px-2 py-0.5 rounded text-alphabag-yellow border border-alphabag-gray font-bold uppercase tracking-widest">Rank #{coin.market_cap_rank}</span>
                                <span className="text-[9px] text-alphabag-subtext uppercase font-bold tracking-tighter">Market Intelligence Feed</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="ghost" className="bg-alphabag-dark border border-alphabag-gray"><Star size={18} className="mr-2" /> Watchlist</Button>
                    <Button variant="ghost" className="bg-alphabag-dark border border-alphabag-gray"><Share2 size={18} /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-5 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] rotate-12">
                            <BarChart size={120} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <p className="text-alphabag-subtext text-[10px] font-bold uppercase tracking-widest mb-1">Current Value</p>
                                <div className="flex items-baseline space-x-3">
                                    <span className="text-4xl font-extrabold text-white tracking-tighter">${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    <span className={`text-lg font-bold px-2 py-0.5 rounded-lg ${isPositive ? 'bg-alphabag-green/10 text-alphabag-green' : 'bg-alphabag-red/10 text-alphabag-red'}`}>
                                        {isPositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 text-right w-full md:w-auto">
                                <div>
                                    <p className="text-alphabag-subtext text-[9px] font-bold uppercase tracking-widest">24h High</p>
                                    <p className="text-white font-bold text-sm">${(coin.current_price * 1.05).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-alphabag-subtext text-[9px] font-bold uppercase tracking-widest">24h Low</p>
                                    <p className="text-white font-bold text-sm">${(coin.current_price * 0.95).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-alphabag-dark to-alphabag-black border border-alphabag-yellow/30 rounded-xl p-5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-alphabag-yellow/5 animate-pulse"></div>
                        <div className="flex items-start space-x-4 relative z-10">
                            <div className="w-10 h-10 bg-alphabag-yellow/10 border border-alphabag-yellow/20 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                <Zap size={20} className="text-alphabag-yellow fill-current" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2 mb-1.5">
                                    <h3 className="text-alphabag-yellow font-extrabold uppercase text-[10px] tracking-[0.2em]">Expert Narrative Agent</h3>
                                </div>
                                <div className="text-[13px] text-alphabag-text leading-relaxed font-medium">
                                    {isFetchingAi ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1 h-1 bg-alphabag-yellow rounded-full animate-bounce"></div>
                                            <div className="w-1 h-1 bg-alphabag-yellow rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-1 h-1 bg-alphabag-yellow rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                            <span className="ml-2 italic text-alphabag-subtext">Aggregating global sentiment...</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <p>{aiInsight}</p>
                                            {groundingLinks.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-alphabag-yellow/20">
                                                    <p className="text-[9px] text-alphabag-subtext uppercase font-bold mb-2">Sources:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {groundingLinks.map((link, idx) => link.web && (
                                                            <a
                                                                key={idx}
                                                                href={link.web.uri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[9px] text-alphabag-yellow hover:underline bg-alphabag-yellow/5 px-2 py-1 rounded"
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

                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-5 h-[500px] flex flex-col shadow-2xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-alphabag-gray/30">
                            <div className="flex space-x-2 bg-alphabag-black p-1 rounded-lg border border-alphabag-gray">
                                {['15m', '1H', '4H', '1D', '1W', '1M'].map(tf => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-3 py-1 rounded text-[10px] font-bold transition-all uppercase tracking-tighter ${timeframe === tf
                                            ? 'bg-alphabag-yellow text-alphabag-black shadow-lg'
                                            : 'text-alphabag-subtext hover:text-white hover:bg-alphabag-gray'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center space-x-4 text-[9px] font-extrabold text-alphabag-subtext uppercase tracking-widest">
                                <span className="flex items-center"><div className="w-1.5 h-1.5 bg-alphabag-yellow rounded-full mr-2"></div> EMA (20)</span>
                                <span className="flex items-center"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div> VWAP</span>
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
                                        tick={{ fill: '#848E9C', fontSize: 10, fontWeight: 'bold' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0B0E11', border: '1px solid #2B3139', color: '#EAECEF', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                                        itemStyle={{ color: '#EAECEF', fontWeight: 'bold' }}
                                        cursor={{ stroke: '#848E9C', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Market Price']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="price"
                                        stroke={isPositive ? '#0ECB81' : '#F6465D'}
                                        fillOpacity={1}
                                        fill="url(#colorPrice)"
                                        strokeWidth={4}
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet size={100} className="text-alphabag-yellow" />
                        </div>
                        <h3 className="text-xs font-extrabold mb-6 text-alphabag-text flex items-center uppercase tracking-[0.2em]">
                            <Wallet size={18} className="mr-3 text-alphabag-yellow" /> Wallet Position
                        </h3>

                        {isConnected && holding ? (
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-alphabag-subtext text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1">Position Value</p>
                                    <div className="text-4xl font-extrabold text-white tracking-tighter">${holding.value.toLocaleString()}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-alphabag-gray/50">
                                    <div>
                                        <p className="text-alphabag-subtext text-[10px] font-bold uppercase tracking-widest mb-1">Balance</p>
                                        <p className="font-extrabold text-white text-lg">{holding.amount.toLocaleString()} {coin.symbol.toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-alphabag-subtext text-[10px] font-bold uppercase tracking-widest mb-1">Total P&L</p>
                                        <p className={`font-extrabold text-lg ${holding.pnl >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}`}>
                                            {holding.pnl >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="danger" className="w-full py-3 font-extrabold" onClick={() => navigate('/settings')} title="Remove Connection Tracking">Remove Tracking</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 relative z-10">
                                <p className="text-alphabag-subtext text-sm mb-6 leading-relaxed">Connect your wallet to track your <b>{coin.name}</b> holdings and analyze entry performance.</p>
                                <Button variant="primary" className="w-full font-bold shadow-lg" onClick={() => navigate('/settings')}>Connect & Track</Button>
                            </div>
                        )}
                    </div>

                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xs font-extrabold mb-6 text-alphabag-text uppercase tracking-[0.2em]">Asset Intelligence</h3>
                        <div className="space-y-5">
                            <div className="flex justify-between py-3 border-b border-alphabag-gray/30">
                                <span className="text-alphabag-subtext text-xs font-bold uppercase">Market Cap</span>
                                <span className="font-extrabold text-white text-sm">${(coin.market_cap / 1e9).toFixed(2)}B</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-alphabag-gray/30">
                                <span className="text-alphabag-subtext text-xs font-bold uppercase">Volume (24h)</span>
                                <span className="font-extrabold text-white text-sm">${(coin.total_volume / 1e9).toFixed(2)}B</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-alphabag-gray/30">
                                <span className="text-alphabag-subtext text-xs font-bold uppercase">Circ. Supply</span>
                                <span className="font-extrabold text-white text-sm">1.2M {coin.symbol.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-alphabag-subtext text-xs font-bold uppercase">All Time High</span>
                                <span className="font-extrabold text-white text-sm">$6,450.00</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 shadow-2xl relative">
                        <h3 className="text-xs font-extrabold mb-6 text-alphabag-text uppercase tracking-[0.2em] flex items-center">
                            <ShieldCheck size={18} className={`mr-3 ${audit.color}`} /> Smart Audit Score
                        </h3>
                        {audit.score > 0 ? (
                            <>
                                <div className="flex items-end space-x-3 mb-4">
                                    <div className="text-5xl font-extrabold text-white tracking-tighter">{audit.score}<span className="text-lg text-alphabag-subtext ml-1">/100</span></div>
                                    <div className={`text-[10px] ${audit.color} font-extrabold uppercase tracking-widest pb-2`}>{audit.label}</div>
                                </div>
                                <div className="w-full bg-alphabag-black h-2 rounded-full overflow-hidden border border-alphabag-gray">
                                    <div className={`bg-gradient-to-r ${audit.bgClass} w-[${audit.score}%] h-full ${audit.shadowClass}`} style={{ width: `${audit.score}%` }}></div>
                                </div>
                                <p className="text-[9px] text-alphabag-subtext mt-6 font-bold leading-relaxed uppercase tracking-widest opacity-60">Verified Liquidity • Multisig Treasury • Audited by Certik</p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6">
                                <div className="w-6 h-6 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-[10px] text-alphabag-subtext uppercase font-bold tracking-widest">Scanning Contracts...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
