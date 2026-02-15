import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI, Modality } from "@google/genai";
import { Bot, Send, User, Zap, ExternalLink, Mic, MicOff, Clock, AlertTriangle, Sparkles, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MessageRenderer } from '../components/MessageRenderer';

interface Message {
  role: 'user' | 'ai';
  content: string;
  groundingMetadata?: any[];
}

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
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hello, I am AlphaAi. I can analyze global crypto markets in real-time or look over your portfolio to provide professional insights. What's on your mind?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const tier = user?.tier || 'FREE';
  const isUltimate = tier === 'ULTIMATE';
  const freeUsageSeconds = user?.alphaAiUsageSeconds || 0;
  const FREE_LIMIT_SECONDS = 4 * 60 * 60; // 4 hours
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

  useEffect(() => {
    if (scrollRef.current) { scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }
  }, [messages, isTyping]);

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
    if (!hasLimitRemaining) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
      setMessages(prev => [...prev, { role: 'ai', content: "Critical: Neural Gateway API Key missing. Interface cannot initialize voice link." }]);
      return;
    }

    setIsLiveMode(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.error("AudioContext init failed", e);
        }
      }
      const outputCtx = audioContextRef.current;
      nextStartTimeRef.current = 0;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are AlphaAi. Provide tidy, clear professional crypto narratives. Avoid excessive symbols or heavy markdown bolding. Use natural speech.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        },
        callbacks: {
          onopen: async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const source = inputCtx.createMediaStreamSource(stream);
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                sessionPromise.then((session) => {
                  if (session) {
                    session.sendRealtimeInput({
                      media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
                    });
                  }
                });
              };
              source.connect(processor);
              processor.connect(inputCtx.destination);
            } catch (err) {
              stopLiveMode();
            }
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const bytes = decode(base64Audio);
              const buffer = await decodeAudioData(bytes, outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: () => stopLiveMode(),
          onclose: () => stopLiveMode(),
        }
      });
      sessionPromise.then(session => { liveSessionRef.current = session; });
    } catch (e) {
      setIsLiveMode(false);
    }
  };

  const handleSendMessage = async (userMsg: string) => {
    if (!userMsg.trim() || isTyping || !hasLimitRemaining) return;

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    if (!isUltimate) updateAiUsage(10);

    try {
      // Prepare context safely
      const safePortfolio = portfolioItems.length > 0
        ? portfolioItems.map(p => ({
          symbol: p.symbol,
          amount: p.amount,
          value: p.value,
          pnl: p.pnl,
          allocation: (p.value / portfolioItems.reduce((a, b) => a + b.value, 0)) * 100
        }))
        : [];

      // Call Backend Proxy
      const response = await fetch('http://localhost:3001/api/ai/briefing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assets: safePortfolio, // Renaming for backend compatibility
          tier: tier,
          userMessage: userMsg // Ensure backend handles this new field
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Neural connection error.");
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.briefing || data.response || "Neural analysis complete.",
        groundingMetadata: [] // Backend can passthrough if needed
      }]);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Neural core gateway connection timed out. Using failover protocol." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-alphabag-yellow text-alphabag-black rounded-xl flex items-center justify-center shadow-lg font-black"><Bot size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center tracking-tighter uppercase leading-none">AlphaAi Intelligence</h1>
            <div className="flex items-center text-[10px] text-alphabag-subtext font-bold tracking-widest mt-1 opacity-70">
              <Clock size={10} className="mr-1" />
              {isUltimate ? 'Unlimited neural access' : `${formatTime(FREE_LIMIT_SECONDS - freeUsageSeconds)} capacity remaining`}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isUltimate ? (
            <Button variant="secondary" size="sm" onClick={isLiveMode ? stopLiveMode : startLiveMode} className={`font-black border transition-all ${isLiveMode ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-alphabag-yellow bg-alphabag-yellow/10 text-alphabag-yellow'}`}>
              {isLiveMode ? <MicOff size={16} className="mr-2" /> : <Mic size={16} className="mr-2" />}
              {isLiveMode ? 'Terminate Link' : 'Initialize Voice Link'}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))} className="text-alphabag-yellow border border-alphabag-yellow/20 text-[10px] font-black uppercase tracking-widest px-4">
              <Zap size={14} className="mr-2" /> Unlock Voice Pulse
            </Button>
          )}
        </div>
      </div>

      {!isUltimate && (
        <div className="mb-4 mx-2 bg-alphabag-black/50 border border-alphabag-gray rounded-xl p-3 flex items-center justify-between shadow-lg">
          <div className="flex-1 mr-6">
            <div className="flex justify-between text-[8px] font-black text-alphabag-subtext uppercase tracking-[0.2em] mb-1">
              <span>Daily neural allocation</span>
              <span>{Math.round((freeUsageSeconds / FREE_LIMIT_SECONDS) * 100)}%</span>
            </div>
            <div className="w-full bg-alphabag-gray/30 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div
                className="bg-alphabag-yellow h-full transition-all duration-1000 shadow-[0_0_10px_rgba(252,213,53,0.5)]"
                style={{ width: `${(freeUsageSeconds / FREE_LIMIT_SECONDS) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="text-[9px] text-alphabag-subtext font-bold italic opacity-60 uppercase">Auto-reset 00:00 UTC</div>
        </div>
      )}

      <div className="flex-1 bg-alphabag-dark border border-alphabag-gray rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
        {!hasLimitRemaining && (
          <div className="absolute inset-0 z-50 bg-alphabag-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <AlertTriangle size={48} className="text-alphabag-yellow mb-6" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Neural link exhausted</h2>
            <p className="text-alphabag-subtext text-sm max-w-sm mb-8 leading-relaxed font-medium">You have consumed your 4-hour daily quota for the basic intelligence node. Upgrade to ULTIMATE for unlimited priority access.</p>
            <Button variant="primary" size="lg" className="px-10 font-black uppercase" onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}>Authorize Elite Membership</Button>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {!isLiveMode && messages.map((msg, i) => (
            <MessageRenderer key={i} message={msg} />
          ))}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex space-x-3">
                <div className="w-9 h-9 rounded-xl bg-alphabag-yellow text-black flex items-center justify-center animate-pulse"><Bot size={20} /></div>
                <div className="bg-alphabag-black border border-alphabag-gray p-4 rounded-2xl flex space-x-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-alphabag-yellow rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-alphabag-yellow rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-alphabag-yellow rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          {isLiveMode && (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-alphabag-yellow/20 rounded-full animate-ping"></div>
                <div className="w-24 h-24 bg-alphabag-yellow text-black rounded-full flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(252,213,53,0.4)] border border-white/10">
                  <Mic size={40} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-black uppercase tracking-[0.4em] mb-2">Voice Transmission Active</p>
                <p className="text-alphabag-subtext text-xs font-bold tracking-widest opacity-60">Audio protocol engaged for institutional queries</p>
              </div>
            </div>
          )}
        </div>

        {!isLiveMode && (
          <div className="p-4 border-t border-alphabag-gray bg-alphabag-black/50">
            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.prompt)}
                  className="px-3 py-1.5 rounded-lg bg-alphabag-dark border border-alphabag-gray text-[10px] text-alphabag-subtext hover:text-white hover:border-alphabag-yellow transition-all flex items-center gap-1.5 font-bold uppercase tracking-tighter"
                >
                  <Sparkles size={10} className="text-alphabag-yellow" />
                  {s.label}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="flex space-x-4">
              <input
                type="text"
                placeholder={hasLimitRemaining ? "Query AlphaAi Node regarding market sentiment..." : "Daily capacity reached..."}
                disabled={!hasLimitRemaining}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-alphabag-dark border border-alphabag-gray rounded-xl px-4 py-3 text-sm text-white focus:border-alphabag-yellow outline-none transition-all placeholder:text-alphabag-subtext/40 font-medium"
              />
              <Button type="submit" disabled={!input.trim() || isTyping || !hasLimitRemaining} className="rounded-xl px-6 bg-alphabag-yellow hover:bg-alphabag-yellowHover shadow-lg uppercase font-black">
                <Send size={18} />
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};