import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TradeSignal } from '../../types';
import {
    Radio, Lock, Rocket, Target, Gift, Clock,
    MessageSquare, Volume2, Copy, History, Layers, ExternalLink, Loader2, ShieldAlert
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Swal from 'sweetalert2';

const DEMO_SIGNALS: TradeSignal[] = [];
const CATEGORIES = ['ALL', 'DEGEN', 'SHORT', 'LONGTERM', 'AIRDROPS'];

export const AlphaCalls: React.FC = () => {
    const { user, token } = useAuth();
    const [signals, setSignals] = useState<TradeSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('ALL');

    useEffect(() => {
        const fetchSignals = async () => {
            try {
                const res = await api.get('/api/signals');
                const incoming = Array.isArray(res.data)
                    ? res.data
                    : (Array.isArray(res.data?.signals) ? res.data.signals : (Array.isArray(res.data?.data) ? res.data.data : []));
                setSignals(incoming);
            } catch (error) {
                console.error("Failed to fetch signals:", error);
                setSignals([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSignals();
    }, [token]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Copied to clipboard',
            showConfirmButton: false,
            timer: 1500,
            background: '#1E2329',
            color: '#FFF'
        });
    };

    const safeSignals = Array.isArray(signals) ? signals : DEMO_SIGNALS;
    const filteredSignals = safeSignals.filter(s => activeCategory === 'ALL' || s?.category === activeCategory);

    return (
        <div className="relative min-h-[calc(100vh-12rem)] flex flex-col pb-20 w-full animate-in fade-in duration-700">
            
            {/* Header */}
            <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-dark">
                            <Radio className="animate-pulse" size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">Classified Alphas</h1>
                    </div>
                    <p className="text-alphabag-subtext text-sm">High-conviction setups · Early Mems · Airdrops</p>
                </div>
                <div className="bg-alphabag-gray border border-alphabag-yellow/20 px-3 py-1.5 rounded-md flex items-center gap-2">
                    <ShieldAlert size={12} className="text-alphabag-yellow" />
                    <span className="text-[9px] text-alphabag-yellow font-semibold uppercase tracking-wider">E2E Encryption Active</span>
                </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex overflow-x-auto custom-scrollbar pb-3 mb-2 gap-2">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all ${
                            activeCategory === cat 
                            ? 'bg-alphabag-yellow text-alphabag-dark' 
                            : 'bg-alphabag-darkgray border border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text hover:border-alphabag-muted'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-32 flex flex-col items-center">
                    <div className="animate-spin w-8 h-8 border-2 border-alphabag-yellow border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-alphabag-subtext animate-pulse">Decrypting Alpha Stream...</p>
                </div>
            ) : filteredSignals.length === 0 ? (
                <div className="text-center py-32 rounded-lg border border-dashed border-alphabag-gray mx-2">
                    <Target size={40} className="mx-auto text-alphabag-subtext mb-2 opacity-30" />
                    <h3 className="text-base font-semibold text-alphabag-text mb-2">No Active Intelligence</h3>
                    <p className="text-xs font-semibold uppercase tracking-widest text-alphabag-subtext">The Alpha stream is currently silent. Stand by.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 w-full">
                    {filteredSignals.map((signal, index) => {
                        const theme = signal.category === 'DEGEN' 
                            ? { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)', icon: <Rocket size={18} /> }
                            : signal.category === 'LONGTERM'
                                ? { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)', icon: <Layers size={18} /> }
                                : { color: '#fcd535', bg: 'rgba(252,213,53,0.1)', border: 'rgba(252,213,53,0.2)', icon: <Gift size={18} /> };

                        return (
                            <div 
                                key={signal.id} 
                                className="bg-alphabag-darkgray border border-alphabag-gray p-4 rounded-lg relative overflow-hidden hover:border-alphabag-muted transition-all"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >

                                
                                {/* Header Section */}
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-${theme.border} bg-[#0c0c0c] text-${theme.color}`}>
                                            {React.cloneElement(theme.icon as React.ReactElement, { size: 14 })}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-base font-black text-white tracking-tight leading-none">{signal.pair}</h3>
                                                {signal.status === 'HIT' && (
                                                    <span className="text-[7px] px-1 py-0.5 rounded border border-green-500 text-green-500 font-bold uppercase tracking-widest">Target Hit</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[7px] px-1 py-0.5 rounded font-black uppercase tracking-[0.2em] bg-${theme.bg} text-${theme.color}`}>
                                                    {signal.category}
                                                </span>
                                                <span className="text-[8px] text-alphabag-muted font-bold uppercase tracking-widest flex items-center">
                                                    <Clock size={8} className="mr-1 opacity-70" /> {signal.timestamp}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => copyToClipboard(`${signal.pair} details`)}
                                        className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center text-alphabag-subtext hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>

                                {/* Narrative Section */}
                                <div className="mb-3 relative z-10">
                                    <p className={`text-xs text-zinc-300 font-medium leading-[1.5] line-clamp-2`}>
                                        {signal.narrative}
                                    </p>
                                </div>

                                {/* Metrics Matrix */}
                                <div className="grid grid-cols-3 gap-2 mb-2 relative z-10">
                                    <div className="bg-black/40 border border-white/5 p-1.5 rounded-lg flex flex-col justify-center">
                                        <span className="text-[7px] text-alphabag-muted font-black uppercase tracking-widest mb-0.5">Entry</span>
                                        <span className={`font-mono text-[11px] font-bold text-white truncate`}>{signal.entry}</span>
                                    </div>
                                    <div className="bg-black/40 border border-white/5 p-1.5 rounded-lg flex flex-col justify-center">
                                        <span className="text-[7px] text-alphabag-muted font-black uppercase tracking-widest mb-0.5">Target</span>
                                        <div className="flex flex-wrap gap-1">
                                            {signal.targets?.map((t, i) => (
                                                <span key={i} className={`font-mono text-[11px] font-bold text-${theme.color}`}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-black/40 border border-white/5 p-1.5 rounded-lg flex flex-col justify-center">
                                        <span className="text-[7px] text-alphabag-muted font-black uppercase tracking-widest mb-0.5">SL</span>
                                        <span className={`font-mono text-[11px] font-bold text-red-500 truncate`}>{signal.stopLoss}</span>
                                    </div>
                                </div>

                                {/* Footer Data */}
                                {(signal.contractAddress || signal.socialLinks) && (
                                    <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
                                        {signal.contractAddress && (
                                            <div className="flex gap-2 items-center flex-1 max-w-[70%]">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">CA:</span>
                                                <code className={`text-[9px] font-mono truncate px-1.5 py-0.5 rounded bg-[#111] border border-white/10 text-white`}>
                                                    {signal.contractAddress}
                                                </code>
                                            </div>
                                        )}
                                        
                                        {signal.socialLinks && (
                                            <div className="flex gap-1.5">
                                                {signal.socialLinks.twitter && (
                                                    <a href={signal.socialLinks.twitter} target="_blank" rel="noreferrer" className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors border border-blue-500/20"><ExternalLink size={10} /></a>
                                                )}
                                                {signal.socialLinks.telegram && (
                                                    <a href={signal.socialLinks.telegram} target="_blank" rel="noreferrer" className="w-6 h-6 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 transition-colors border border-cyan-500/20"><MessageSquare size={10} /></a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

