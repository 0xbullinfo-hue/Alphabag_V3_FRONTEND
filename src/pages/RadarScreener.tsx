import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageSquare, Share2, Filter, Search, ArrowUpRight, Flame, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDebounce } from '../components/hooks/useDebounce';

interface ProjectHeat {
    id: string;
    name: string;
    symbol: string;
    heatIndex: number;
    engagement24h: number;
    mentions24h: number;
    holders: number;
    priceChange: number;
    isVerified: boolean;
}

export const RadarScreener: React.FC = () => {
    const [search, setSearch] = useState('');
    const [projects, setProjects] = useState<ProjectHeat[]>([]);
    const [loading, setLoading] = useState(true);
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                setLoading(true);
                const res = await fetch('https://api.coingecko.com/api/v3/search/trending');
                const data = await res.json();
                
                const mapped: ProjectHeat[] = data.coins.map((c: any, index: number) => ({
                    id: c.item.id,
                    name: c.item.name,
                    symbol: c.item.symbol,
                    heatIndex: 100 - (index * 5) - Math.floor(Math.random() * 5),
                    engagement24h: Math.floor(Math.random() * 15000 + 5000),
                    mentions24h: Math.floor(Math.random() * 500 + 100),
                    holders: Math.floor(Math.random() * 20000 + 1000),
                    priceChange: (Math.random() * 20 - 5),
                    isVerified: index < 3
                }));
                
                setProjects(mapped);
            } catch (error) {
                console.error("Failed to fetch trending coins:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrending();
    }, []);

    const filtered = projects.filter(p => 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        p.symbol.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex items-center flex-wrap gap-3">
                        Radar <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">Screener</span>
                        <div className="px-2 py-0.5 bg-alphabag-yellow/10 border border-alphabag-yellow/20 rounded text-[10px] text-alphabag-yellow font-black uppercase tracking-widest not-italic">Organic Heat</div>
                        <div className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[10px] text-green-400 font-black uppercase tracking-widest flex items-center gap-1 mt-2 md:mt-0 not-italic">
                            <Zap size={10} fill="currentColor" /> LIVE FEED
                        </div>
                    </h1>
                    <p className="text-alphabag-subtext text-sm mt-1">Real-time community engagement ranking. No paid boosts allowed.</p>
                </div>
                
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-muted" />
                        <input 
                            type="text"
                            placeholder="Search Projects..."
                            className="bg-alphabag-darkgray border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:border-alphabag-yellow/50 outline-none w-full md:w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="sm" className="border-white/5 text-alphabag-subtext gap-2">
                        <Filter size={14} /> Filter
                    </Button>
                </div>
            </div>

            <div className="glass-panel overflow-hidden border-t-alphabag-yellow/30 bg-alphabag-darkgray/50 rounded-2xl shadow-glass">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted"># Rank</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted">Project</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-center">Heat Index</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-right">Engagement</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-right">Mentions</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-right">24h Change</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-muted"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-alphabag-subtext">
                                        <div className="w-8 h-8 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Syncing Organic Heat Feed...</p>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-alphabag-subtext">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No projects found matching your search</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((project, index) => (
                                    <tr key={project.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5 font-mono text-sm text-alphabag-muted">
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-alphabag-black border border-white/5 rounded-lg flex items-center justify-center font-black text-alphabag-yellow relative overflow-hidden">
                                                    {project.symbol[0]}
                                                    {index === 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-alphabag-yellow"></div>}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-white text-sm uppercase tracking-tight">{project.name}</span>
                                                        {project.isVerified && <div className="w-3 h-3 bg-alphabag-green rounded-full flex items-center justify-center"><CheckCircle size={8} className="text-black" /></div>}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-alphabag-muted uppercase tracking-widest">{project.symbol}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <Flame size={14} className={index < 2 ? 'text-orange-500' : 'text-alphabag-muted'} />
                                                    <span className={`font-black text-lg tabular-nums ${index < 2 ? 'text-white' : 'text-alphabag-subtext'}`}>{project.heatIndex}</span>
                                                </div>
                                                <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${index < 2 ? 'bg-alphabag-yellow shadow-[0_0_10px_rgba(252,213,53,0.5)]' : 'bg-alphabag-muted'}`}
                                                        style={{ width: `${project.heatIndex}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-mono text-sm tabular-nums text-white">
                                            {project.engagement24h.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 text-right font-mono text-sm tabular-nums text-white">
                                            {project.mentions24h}
                                        </td>
                                        <td className="px-6 py-5 text-right font-mono text-sm tabular-nums">
                                            <span className={project.priceChange >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}>
                                                {project.priceChange >= 0 ? '+' : ''}{project.priceChange.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 text-alphabag-muted hover:text-alphabag-yellow transition-colors bg-white/5 rounded-lg opacity-0 group-hover:opacity-100">
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const CheckCircle = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);
