import { Bot,ChevronRight,Fingerprint,Mic,Send,Trash2,Wallet,Zap } from 'lucide-react';
import React,{ useEffect,useRef,useState } from 'react';
import Swal from 'sweetalert2';
import { useNeuralCore } from '../../components/hooks/useNeuralCore';
import { Button } from '../../components/ui/Button';
import { ChatFeed } from '../../components/ui/ChatFeed';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';

const SUGGESTIONS = [
  { label: "Market News", prompt: "Summarize the most important crypto news from the last 24 hours." },
  { label: "BTC Analysis", prompt: "Give me a professional technical analysis of Bitcoin's current price action." },
  { label: "Portfolio Tip", prompt: "Based on my current assets, suggest one diversification strategy." },
  { label: "Bullish Trends", prompt: "What are the trending narratives in the market right now?" }
];



export const AlphaAi: React.FC = () => {
  const { portfolioItems } = useWallet();
  const { user, isAuthenticated, updateAiUsage } = useAuth();
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
    Swal.fire({
      title: 'VOICE ASSISTANT',
      text: 'AI Voice assistant is in final staging. Launching in Phase 2.0.',
      icon: 'info',
      confirmButtonText: 'ACKNOWLEDGE',
      confirmButtonColor: '#fcd535',
      background: '#181a20',
      color: '#ffffff',
      customClass: {
        popup: 'border border-alphabag-gray rounded-2xl',
        confirmButton: 'text-black font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg text-xs'
      }
    });
  };

  const handleSendMessage = (userMsg: string) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }
    if (!hasLimitRemaining) return;
    if (!isUltimate) updateAiUsage(10);
    sendMessage(userMsg);
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };


  const dexTotal = portfolioItems.reduce((acc, item) => acc + item.value, 0);
  const totalValue = dexTotal + cexTotal;
  const totalPnL24h = portfolioItems.reduce((acc, item) => acc + (item.value * (item.priceChange24h / 100)), 0);
  const totalPnLPercent24h = totalValue > 0 ? (totalPnL24h / totalValue) * 100 : 0;
  const numAssets = portfolioItems.length + cexAssetCount;

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] animate-in fade-in duration-700 w-full text-alphabag-text">
      {/* Header */}
      <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-dark">
              <Bot size={20} />
            </div>
            <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">Alpha Analyst</h1>
            <div className="bg-alphabag-green/10 border border-alphabag-green/20 px-2 py-1 rounded-md flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-alphabag-green rounded-full animate-pulse"></div>
              <span className="text-[9px] text-alphabag-green font-semibold uppercase tracking-wider">Link Active</span>
            </div>
          </div>
          <p className="text-alphabag-subtext text-sm">Ask about market structure, portfolio risk, and on-chain activity.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-2">

        {/* Left Side: Chat Area */}
        <div className="flex flex-col min-h-[620px] bg-alphabag-darkgray rounded-lg overflow-hidden border border-alphabag-gray relative">
          
          
           <div className="flex justify-between items-center px-4 py-3 border-b border-alphabag-gray bg-alphabag-black/30">
              <span className="text-[9px] text-alphabag-subtext uppercase font-black tracking-widest flex items-center gap-2">
                <Bot size={13} className="text-alphabag-yellow" /> Research Session
              </span>
              <button 
                  onClick={clearChat}
                  className="flex items-center gap-1 text-[8px] uppercase font-bold tracking-widest text-zinc-500 hover:text-red-400 transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-transparent hover:border-red-500/20"
              >
                  <Trash2 size={11} /> Clear chat
              </button>
          </div>

          <div className="flex-1 relative z-10 custom-scrollbar overflow-hidden">
              <ChatFeed messages={messages} isTyping={isStreaming} />
          </div>

          <div className="p-4 bg-alphabag-black/40 border-t border-alphabag-gray relative z-10">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} className="relative flex items-center group/form">
              <input
                type="text"
                placeholder={!isAuthenticated ? "Connect your wallet to start a research session" : hasLimitRemaining ? "Ask Alpha Analyst about a market, asset, or portfolio decision" : "Daily usage limit reached"}
                disabled={!isAuthenticated || !hasLimitRemaining || isStreaming}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-12 bg-alphabag-dark border border-alphabag-gray rounded-md pl-4 pr-24 py-3 text-sm text-alphabag-text focus:border-alphabag-yellow focus:ring-1 focus:ring-alphabag-yellow/20 focus:outline-none transition-colors placeholder:text-alphabag-muted"
              />
              <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={startLiveMode}
                  disabled={!isAuthenticated}
                  className="h-full px-2.5 rounded-md text-zinc-400 hover:text-alphabag-yellow transition-colors hover:bg-white/5"
                  title="Voice assistant"
                >
                  <Mic size={14} />
                </button>
                <Button
                  type="submit"
                  disabled={!isAuthenticated || !inputText.trim() || isStreaming || !hasLimitRemaining}
                  className={`h-full rounded-md px-3 transition-colors ${!isAuthenticated || !inputText.trim() || isStreaming || !hasLimitRemaining ? 'bg-white/5 text-zinc-500' : 'bg-alphabag-yellow text-black hover:bg-yellow-400'}`}
                  title="Send message"
                >
                  <Send size={12} />
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Sidebar */}
        <div className="space-y-2">

          {/* Quick Actions (2-Column Dense Grid) */}
          <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg p-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext mb-3 flex items-center gap-2">
                <Zap size={12} className="text-alphabag-yellow"/> Neural Prompts
            </h3>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={!isAuthenticated || isStreaming || !hasLimitRemaining}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md bg-alphabag-black border border-alphabag-gray hover:border-alphabag-yellow/60 hover:bg-alphabag-yellow/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="text-xs font-semibold text-alphabag-text group-hover:text-alphabag-yellow transition-colors">{action.label}</span>
                  <ChevronRight size={14} className="text-alphabag-muted group-hover:text-alphabag-yellow" />
                </button>
              ))}
            </div>
          </div>

          {/* Portfolio Matrix */}
          <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg p-4">
            
            <div className="flex items-center justify-between mb-2 relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext flex items-center gap-2">
                    <Wallet size={12} className="text-alphabag-green"/> Aggregate Assets
                </h3>
            </div>

            <div className="mb-2">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Total Net Worth</p>
                <div className="flex items-end gap-2">
                    <span className="text-xl font-black text-white tracking-tighter tabular-nums leading-none">
                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 mb-1 ${totalPnL24h >= 0 ? 'text-alphabag-green' : 'text-red-500'}`}>
                        {totalPnLPercent24h >= 0 ? '+' : ''}{totalPnLPercent24h.toFixed(2)}% (24H)
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 relative z-10">
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

            <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg p-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext flex items-center gap-2 mb-3">
              <Fingerprint size={12} className="text-alphabag-yellow"/> Session Context
            </h3>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-alphabag-subtext">Portfolio assets</dt><dd className="font-semibold text-alphabag-text">{numAssets}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-alphabag-subtext">Data scope</dt><dd className="font-semibold text-alphabag-text">Current session</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-alphabag-subtext">Messages</dt><dd className="font-semibold text-alphabag-text">{messages.length}</dd></div>
            </dl>
          </div>

        </div>
      </div>
    </div>
  );
};
