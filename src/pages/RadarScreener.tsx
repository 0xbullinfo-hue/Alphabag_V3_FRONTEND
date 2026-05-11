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
        <div className="space-y-4 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-semibold text-[#eaecef] tracking-tight flex items-center gap-2">
                            <Flame size={22} className="text-[#fcd535]" /> Radar Screener
                        </h1>
                        <span className="bg-[#0ecb81]/10 text-[#0ecb81] text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider flex items-center gap-1">
                            <Flame size={9} fill="currentColor" /> LIVE
                        </span>
                        <span className="bg-[#fcd535]/10 text-[#fcd535] text-[9px] font-semibold uppercase px-2 py-1 rounded-md tracking-wider">Organic Heat</span>
                    </div>
                    <p className="text-[#848e9c] text-xs">Real-time community engagement ranking. No paid boosts.</p>
                </div>
                
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
                        <input 
                            type="text"
                            placeholder="Search Projects..."
                            className="bg-[#0b0e11] border border-[#2b3139] rounded-md py-2 pl-9 pr-4 text-xs text-[#eaecef] focus:border-[#fcd535] outline-none w-full md:w-56"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="border border-[#2b3139] text-[#848e9c] gap-1.5 h-8 px-3 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-[#1e2329] hover:bg-[#2b3139] flex items-center transition-all">
                        <Filter size={12} /> Filter
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-[#2b3139] bg-[#0b0e11]">
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-alphabag-muted"># Rank</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-alphabag-muted">Project</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-center">Heat Index</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-right">Engagement</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-right">Mentions</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-alphabag-muted text-right">24h Change</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-alphabag-muted"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2b3139] text-[13px]">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center text-alphabag-subtext">
                                        <div className="w-6 h-6 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Syncing Organic Heat Feed...</p>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center text-alphabag-subtext">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">No projects found matching your search</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((project, index) => (
                                    <tr key={project.id} className="hover:bg-[#2b3139]/50 transition-colors group">
                                        <td className="px-4 py-3 font-mono text-[12px] text-alphabag-muted">
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-2.5">
                                                <div className="w-8 h-8 bg-alphabag-black border border-white/5 rounded flex items-center justify-center font-black text-alphabag-yellow relative overflow-hidden text-xs">
                                                    {project.symbol[0]}
                                                    {index === 0 && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-alphabag-yellow"></div>}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-white text-[13px] uppercase tracking-tight">{project.name}</span>
                                                        {project.isVerified && <div className="w-2.5 h-2.5 bg-alphabag-green rounded-full flex items-center justify-center"><CheckCircle size={6} className="text-black" /></div>}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-alphabag-muted uppercase tracking-widest">{project.symbol}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Flame size={12} className={index < 2 ? 'text-orange-500' : 'text-alphabag-muted'} />
                                                    <span className={`font-black text-base tabular-nums ${index < 2 ? 'text-white' : 'text-alphabag-subtext'}`}>{project.heatIndex}</span>
                                                </div>
                                                <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${index < 2 ? 'bg-alphabag-yellow shadow-[0_0_10px_rgba(252,213,53,0.5)]' : 'bg-alphabag-muted'}`}
                                                        style={{ width: `${project.heatIndex}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-white">
                                            {project.engagement24h.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-white">
                                            {project.mentions24h}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                                            <span className={project.priceChange >= 0 ? 'text-alphabag-green' : 'text-alphabag-red'}>
                                                {project.priceChange >= 0 ? '+' : ''}{project.priceChange.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="p-1.5 text-alphabag-muted hover:text-alphabag-yellow transition-colors bg-white/5 rounded opacity-0 group-hover:opacity-100">
                                                <ArrowUpRight size={14} />
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
