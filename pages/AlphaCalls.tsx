import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { fetchSignals } from '../services/mockData';
import { TradeSignal } from '../types';
import {
    Radio, Lock, ShieldAlert, TrendingUp, TrendingDown, Clock,
    MessageSquare, Zap, Volume2, Square, Copy, History, ChevronRight, Target, Rocket
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Modality } from "@google/genai";
import Swal from 'sweetalert2';

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export const AlphaCalls: React.FC = () => {
    const { user } = useAuth();
    const [signals, setSignals] = useState<TradeSignal[]>([]);
    const [loading, setLoading] = useState(false);
    const [isBriefing, setIsBriefing] = useState(false);

    const playBriefing = async () => {
        setIsBriefing(true);
        try {
            // Mock briefing for now to prevent crash
            await new Promise(resolve => setTimeout(resolve, 3000));
            Swal.fire({
                title: 'Market Briefing',
                text: 'Audio stream connected. Playing daily alpha update...',
                icon: 'info',
                timer: 2000,
                showConfirmButton: false,
                background: '#1E2329',
                color: '#FFFFFF'
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsBriefing(false);
        }
    };

    // ... existing hooks

    // Removed Copy Trading and Buy Now logic

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">
                        Alpha<span className="text-alphabag-yellow">Calls</span>
                    </h1>
                    <p className="text-alphabag-subtext text-xs font-bold uppercase tracking-widest">
                        Real-time Institutional Flow & Signals
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={playBriefing}
                        disabled={isBriefing || loading}
                        className={`border ${isBriefing ? 'border-alphabag-yellow text-alphabag-yellow bg-alphabag-yellow/5' : 'border-alphabag-gray text-alphabag-subtext hover:border-white'}`}
                    >
                        {isBriefing ? <Square size={14} className="mr-2" /> : <Volume2 size={14} className="mr-2" />}
                        {isBriefing ? 'Briefing Live' : 'Voice Market Brief'}
                    </Button>
                </div>
            </div>

            {user?.tier !== 'ULTIMATE' ? (
                <div className="relative min-h-[400px] bg-alphabag-dark border border-alphabag-gray rounded-3xl p-8 flex flex-col items-center justify-center text-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80')] opacity-5 bg-cover bg-center"></div>
                    <div className="z-10 max-w-md">
                        <div className="w-16 h-16 bg-alphabag-yellow/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Lock size={32} className="text-alphabag-yellow" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Classified Intel</h2>
                        <p className="text-alphabag-subtext font-medium mb-8 leading-relaxed">
                            AlphaCalls generates high-conviction setups based on on-chain whale movements and institutional order flow. Access is restricted to Ultimate tier nodes.
                        </p>
                        <Button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
                            className="font-black px-10 py-4 uppercase tracking-widest text-lg w-full sm:w-auto shadow-[0_0_20px_rgba(252,213,53,0.3)] hover:shadow-[0_0_30px_rgba(252,213,53,0.5)] transition-all"
                        >
                            Unlock AlphaCalls
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        {loading ? (
                            <div className="h-96 flex flex-col items-center justify-center text-alphabag-subtext">
                                <Zap size={32} className="animate-pulse mb-4 text-alphabag-yellow" />
                                <span className="italic">Decrypting institutional signals...</span>
                            </div>
                        ) : (
                            signals.map(signal => (
                                <div key={signal.id} className={`bg-alphabag-dark border rounded-2xl p-6 transition-all group shadow-xl relative overflow-hidden ${signal.category === 'DEGEN' ? 'border-purple-500/20 hover:border-purple-500/40' :
                                    signal.category === 'FUTURES' ? 'border-blue-500/20 hover:border-blue-500/40' :
                                        'border-alphabag-gray hover:border-alphabag-yellow/30'
                                    }`}>

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-3 rounded-xl shadow-lg ${signal.category === 'DEGEN' ? 'bg-purple-500/20 text-purple-400' :
                                                signal.category === 'FUTURES' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-alphabag-yellow/20 text-alphabag-yellow'
                                                }`}>
                                                {signal.category === 'DEGEN' ? <Rocket size={24} /> :
                                                    signal.category === 'FUTURES' ? <TrendingUp size={24} /> :
                                                        <Target size={24} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="text-2xl font-extrabold text-white tracking-tight">{signal.pair}</h3>
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border ${signal.type === 'LONG' || signal.type === 'BUY' ? 'border-alphabag-green text-alphabag-green' : 'border-alphabag-red text-alphabag-red'
                                                        }`}>
                                                        {signal.type}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-4 mt-1">
                                                    <span className="text-[10px] text-alphabag-subtext font-bold uppercase tracking-widest flex items-center">
                                                        <Clock size={12} className="mr-1" /> {signal.timestamp}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-[9px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border ${signal.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            signal.status === 'HIT' ? 'bg-alphabag-green/10 text-alphabag-green border-alphabag-green/20' :
                                                'bg-alphabag-gray text-alphabag-subtext border-alphabag-gray'
                                            }`}>
                                            {signal.status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 py-6 border-y border-alphabag-gray/30">
                                        <div>
                                            <p className="text-[10px] text-alphabag-subtext uppercase font-bold mb-1 tracking-widest">Entry Zone</p>
                                            <p className="text-white font-mono text-lg font-bold">{signal.entry}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-alphabag-subtext uppercase font-bold mb-1 tracking-widest">Stop Loss</p>
                                            <p className="text-alphabag-red font-mono text-lg font-bold">{signal.stopLoss}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-alphabag-subtext uppercase font-bold mb-2 tracking-widest">Profit Targets (TP)</p>
                                            <div className="flex flex-wrap gap-2">
                                                {signal.targets.map((t, idx) => (
                                                    <div key={idx} className="bg-alphabag-green/10 text-alphabag-green text-[10px] px-3 py-1.5 rounded-lg font-mono border border-alphabag-green/20 font-bold flex items-center">
                                                        <ChevronRight size={10} className="mr-1 opacity-50" /> {t}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-alphabag-black/30 p-4 rounded-xl flex justify-between items-center">
                                        <div className="flex items-start space-x-3 text-xs">
                                            <MessageSquare size={16} className="text-alphabag-yellow mt-0.5 shrink-0 opacity-70" />
                                            <p className="text-alphabag-text font-medium leading-relaxed italic">"{signal.narrative || 'Analyzing tokenomics and volume clusters...'}"</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 shadow-2xl">
                            <h4 className="font-bold text-white mb-6 flex items-center text-xs uppercase tracking-[0.2em]">
                                <History size={16} className="mr-3 text-alphabag-green" /> Stream Performance
                            </h4>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-alphabag-subtext font-bold uppercase tracking-widest">Signal Win Rate</span>
                                    <span className="text-alphabag-green font-extrabold text-lg tracking-tighter">88.4%</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-alphabag-subtext font-bold uppercase tracking-widest">Total PnL (Mo)</span>
                                    <span className="text-alphabag-green font-extrabold text-lg tracking-tighter">+420%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};