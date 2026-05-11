import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { Bot, Send, User, Zap, ExternalLink, Mic, MicOff, Clock, AlertTriangle, Sparkles, Briefcase, RefreshCw, ArrowDown, PieChart as PieChartIcon, TrendingUp, BarChart3, Shield, Lightbulb, ChevronRight, Wallet, Check, TerminalSquare, Trash2, Fingerprint } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ChatFeed } from '../components/ui/ChatFeed';
import { UpgradeCmd } from '../components/UpgradeCmd';
import { useNeuralCore } from '../components/hooks/useNeuralCore';

const SUGGESTIONS = [
  { label: "Market News", prompt: "Summarize the most important crypto news from the last 24 hours." },
  { label: "BTC Analysis", prompt: "Give me a professional technical analysis of Bitcoin's current price action." },
  { label: "Portfolio Tip", prompt: "Based on my current assets, suggest one diversification strategy." },
  { label: "Bullish Trends", prompt: "What are the trending narratives in the market right now?" }
];

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
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

export const AlphaAi: React.FC = () => {
  const { portfolioItems } = useWallet();
  const { user, updateAiUsage } = useAuth();
  const tier = user?.tier || 'FREE';
  const isUltimate = tier === 'ULTIMATE';

  const [cexTotal, setCexTotal] = useState(0);
  const [cexAssetCount, setCexAssetCount] = useState(0);

  useEffect(() => {
    const savedCex = localStorage.getItem('alphabag_cex_connections');
    if (savedCex) {
        try {
            const parsed = JSON.parse(savedCex);
            setCexAssetCount(parsed.length);
            const total = parsed.reduce((acc: number, item: any) => acc + (item.balance || 0), 0);
            setCexTotal(total);
        } catch (e) { console.error("Error parsing CEX data", e); }
    }
  }, []);

  const unifiedPortfolio = React.useMemo(() => {
      const unified: any[] = [...portfolioItems];
      if (cexTotal > 0) {
          unified.push({
              symbol: 'CEX',
              name: 'CEX Holdings',
              value: cexTotal,
              priceChange24h: 0
          });
      }
      return unified;
  }, [portfolioItems, cexTotal]);

  const {
    messages,
    inputText,
    setInputText,
    isStreaming,
    sendMessage,
    clearChat
  } = useNeuralCore(unifiedPortfolio, tier);

  const [isLiveMode, setIsLiveMode] = useState(false);
  const nextStartTimeRef = useRef<number>(0);
  const liveSessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const freeUsageSeconds = user?.alphaAiUsageSeconds || 0;
  const FREE_LIMIT_SECONDS = 24 * 60 * 60; // 24 hours (Unlimited for Beta)
  const hasLimitRemaining = isUltimate || freeUsageSeconds < FREE_LIMIT_SECONDS;

  useEffect(() => {
    let timer: any;
    if (isLiveMode && !isUltimate) {
      timer = setInterval(() => {
        updateAiUsage(1);
        if (freeUsageSeconds >= FREE_LIMIT_SECONDS) {
          stopLiveMode();
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLiveMode, isUltimate, freeUsageSeconds, updateAiUsage]);

  const stopLiveMode = () => {
    if (liveSessionRef.current) {
      try { liveSessionRef.current.close(); } catch (e) { }
      liveSessionRef.current = null;
    }
    sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) { } });
    sourcesRef.current.clear();
    setIsLiveMode(false);
  };

  const startLiveMode = async () => {
    setIsLiveMode(false);
  };

  const handleSendMessage = (userMsg: string) => {
    if (!hasLimitRemaining) return;
    if (!isUltimate) updateAiUsage(10);
    sendMessage(userMsg);
  };

  const handleQuickAction = (actionLabel: string) => {
    handleSendMessage(`Tell me more about ${actionLabel}`);
  };

  const formatTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const dexTotal = portfolioItems.reduce((acc, item) => acc + item.value, 0);
  const totalValue = dexTotal + cexTotal;
  const totalPnL24h = portfolioItems.reduce((acc, item) => acc + (item.value * (item.priceChange24h / 100)), 0);
  const totalPnLPercent24h = totalValue > 0 ? (totalPnL24h / totalValue) * 100 : 0;
  const numAssets = portfolioItems.length + cexAssetCount;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-700 max-w-7xl mx-auto text-[#eaecef] px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-[#2b3139] gap-4 mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
              <Bot size={20} />
            </div>
            <h1 className="text-3xl font-semibold text-[#eaecef] tracking-tight">Alpha Analyst</h1>
            <div className="bg-[#0ecb81]/10 border border-[#0ecb81]/20 px-2 py-1 rounded-md flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#0ecb81] rounded-full animate-pulse"></div>
              <span className="text-[9px] text-[#0ecb81] font-semibold uppercase tracking-wider">Link Active</span>
            </div>
          </div>
          <p className="text-[#848e9c] text-sm">Intelligence hub for on-chain analytics, portfolio modeling, and market forecasting.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">

        {/* Left Side: Chat Area */}
        <div className="lg:col-span-2 flex flex-col bg-[#1e2329] rounded-lg overflow-hidden border border-[#2b3139] relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-alphabag-yellow/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-1000 group-hover:opacity-100 opacity-50"></div>
          
          <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-black/20">
              <span className="text-[9px] text-alphabag-subtext uppercase font-black tracking-widest flex items-center gap-2">
                 <TerminalSquare size={11} className="text-alphabag-yellow" /> Interaction Terminal
              </span>
              <button 
                  onClick={clearChat}
                  className="flex items-center gap-1 text-[8px] uppercase font-bold tracking-widest text-zinc-500 hover:text-red-400 transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-transparent hover:border-red-500/20"
              >
                  <Trash2 size={9} /> Clear Cache
              </button>
          </div>

          <div className="flex-1 relative z-10 bg-gradient-to-b from-transparent to-black/20 custom-scrollbar overflow-hidden">
              <ChatFeed messages={messages} isTyping={isStreaming} />
          </div>

          <div className="p-3 bg-black/40 border-t border-white/5 relative z-10">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} className="relative flex items-center group/form">
              <span className="absolute left-4 text-alphabag-yellow font-mono text-xs font-bold opacity-70 cursor-default">{'>_'}</span>
              <input
                type="text"
                placeholder={hasLimitRemaining ? "Query the neural core..." : "Daily bandwidth exceeded..."}
                disabled={!hasLimitRemaining || isStreaming}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-xs font-mono text-zinc-50 focus:border-alphabag-yellow/50 focus:shadow-[0_0_15px_rgba(252,213,53,0.1)] outline-none transition-all placeholder:text-zinc-600 shadow-inner"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || isStreaming || !hasLimitRemaining}
                className={`absolute right-1.5 top-1.5 bottom-1.5 rounded-lg px-2.5 transition-colors ${!inputText.trim() || isStreaming || !hasLimitRemaining ? 'bg-white/5 text-zinc-500' : 'bg-alphabag-yellow text-black hover:bg-yellow-400 hover:shadow-[0_0_15px_rgba(252,213,53,0.3)]'}`}
                title="Send Command"
              >
                <Send size={12} />
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side: Sidebar */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">

          {/* Quick Actions (2-Column Dense Grid) */}
          <div className="bg-alphabag-dark/80 backdrop-blur-md border border-white/5 rounded-xl p-4 shadow-glass relative overflow-hidden">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext mb-3 flex items-center gap-2">
                <Zap size={12} className="text-alphabag-yellow"/> Neural Prompts
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <PieChartIcon size={12} />, label: "Analyze Port" },
                { icon: <TrendingUp size={12} />, label: "Pulse Check" },
                { icon: <BarChart3 size={12} />, label: "Strategies" },
                { icon: <Briefcase size={12} />, label: "Whale Moves" },
                { icon: <Shield size={12} />, label: "Risk Matrix" },
                { icon: <Lightbulb size={12} />, label: "Alpha Scans" },
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.label)}
                  className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-black/40 hover:bg-alphabag-yellow/10 border border-white/5 hover:border-alphabag-yellow/30 transition-all group"
                >
                  <div className="text-alphabag-muted group-hover:text-alphabag-yellow transition-colors">
                    {action.icon}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-alphabag-yellow transition-colors">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Portfolio Matrix */}
          <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg p-5 relative overflow-hidden">
            
            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext flex items-center gap-2">
                    <Wallet size={12} className="text-alphabag-green"/> Aggregate Assets
                </h3>
            </div>

            <div className="mb-4">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Total Net Worth</p>
                <div className="flex items-end gap-3">
                    <span className="text-xl font-black text-white tracking-tighter tabular-nums leading-none">
                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 mb-1 ${totalPnL24h >= 0 ? 'text-alphabag-green' : 'text-red-500'}`}>
                        {totalPnLPercent24h >= 0 ? '+' : ''}{totalPnLPercent24h.toFixed(2)}% (24H)
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex flex-col">
                    <span className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest mb-1">Active Connections</span>
                    <span className="text-lg font-bold text-white tabular-nums leading-none">{numAssets}</span>
                </div>
                <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex flex-col">
                    <span className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest mb-1">Risk Bias</span>
                    <span className="text-[10px] font-black text-alphabag-yellow uppercase tracking-widest mt-1">Moderate</span>
                </div>
            </div>
          </div>

          {/* Chat History */}
          <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg p-5 relative overflow-hidden">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext flex items-center gap-2 mb-4">
                <Clock size={12} className="text-alphabag-yellow"/> Chat History
            </h3>
            <div className="space-y-2">
                {[
                    { id: 1, title: 'Analysis: BTC 4H Trends', time: '2 hours ago' },
                    { id: 2, title: 'Portfolio Risk Assessment', time: 'Yesterday' },
                    { id: 3, title: 'Solana Ecosystem Review', time: '3 days ago' },
                ].map(chat => (
                    <div 
                      key={chat.id} 
                      onClick={() => setInputText(`Continue chat regarding: ${chat.title}`)}
                      className="p-3 bg-black/40 border border-white/5 rounded-xl hover:border-alphabag-yellow/30 hover:bg-alphabag-yellow/5 transition-all cursor-pointer group flex justify-between items-center"
                    >
                        <div className="overflow-hidden">
                            <div className="text-xs text-white font-bold truncate group-hover:text-alphabag-yellow transition-colors">{chat.title}</div>
                            <div className="text-[9px] text-alphabag-muted font-bold tracking-widest mt-0.5">{chat.time}</div>
                        </div>
                        <ChevronRight size={14} className="text-alphabag-muted group-hover:text-alphabag-yellow opacity-0 group-hover:opacity-100 transition-all -mr-2" />
                    </div>
                ))}
            </div>
            <button className="w-full mt-4 py-2 text-[9px] text-alphabag-muted hover:text-white font-bold uppercase tracking-widest transition-colors border border-transparent hover:border-white/10 rounded-lg">
                View All Archives
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
