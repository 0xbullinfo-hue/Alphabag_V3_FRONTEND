import {
  Activity,
  BarChart2,
  Bot,
  Copy,
  Check,
  Eye,
  Lock,
  LucideIcon,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { BubblemapsEmbed } from '../../components/intelligence/BubblemapsEmbed';
import { SantimentMetrics } from '../../components/intelligence/SantimentMetrics';
import { TradingViewChart } from '../../components/intelligence/TradingViewChart';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { AlphaCalls } from './AlphaCalls';
import { AlphaAi } from './AlphaAi';
import { SecurityScanner } from './SecurityScanner';
import { Whales } from './Whales';
import type { TokenContext } from '../../types/intelligence';

// ─── Token presets ────────────────────────────────────────────────────────────
const PRESETS: (TokenContext & { iconSymbol: string })[] = [
  { label: 'BTC',  iconSymbol: '₿', tvSymbol: 'BINANCE:BTCUSDT',  chain: 'eth',    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', assetSlug: 'bitcoin' },
  { label: 'ETH',  iconSymbol: 'Ξ', tvSymbol: 'BINANCE:ETHUSDT',  chain: 'eth',    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', assetSlug: 'ethereum' },
  { label: 'SOL',  iconSymbol: '◎', tvSymbol: 'BINANCE:SOLUSDT',  chain: 'solana', address: 'So11111111111111111111111111111111111111112',              assetSlug: 'solana' },
  { label: 'BNB',  iconSymbol: '⬡', tvSymbol: 'BINANCE:BNBUSDT',  chain: 'bsc',    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', assetSlug: 'binancecoin' },
  { label: 'XRP',  iconSymbol: '✕', tvSymbol: 'BINANCE:XRPUSDT',  chain: 'eth',    address: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', assetSlug: 'ripple' },
];

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId = 'tradingview' | 'bubblemaps' | 'whales' | 'calls' | 'ai' | 'santiment' | 'security';

interface TabConfig {
  id: TabId;
  label: string;
  badge: string;
  Icon: LucideIcon;
}

const TABS: TabConfig[] = [
  { id: 'tradingview', label: 'TradingView',   badge: 'CHART',   Icon: BarChart2   },
  { id: 'bubblemaps',  label: 'Bubblemaps',    badge: 'HOLDERS', Icon: Share2      },
  { id: 'whales',      label: 'Whale Tracker', badge: 'RADAR',   Icon: Eye         },
  { id: 'calls',       label: 'Alpha Calls',   badge: 'SIGNALS', Icon: Target      },
  { id: 'ai',          label: 'Alpha AI',      badge: 'NEURAL',  Icon: Bot         },
  { id: 'santiment',   label: 'Social Intel',  badge: 'SENTIMENT', Icon: Activity  },
  { id: 'security',    label: 'Security Scan', badge: 'AUDIT',   Icon: ShieldCheck },
];

// ─── Premium gate screen ──────────────────────────────────────────────────────
const GATE_TOOLS = [
  { Icon: BarChart2,   label: 'TradingView',        badge: 'PRO CHARTS', desc: 'Full TradingView indicator suite, drawing tools & multiple timeframes' },
  { Icon: Share2,      label: 'Bubblemaps',          badge: 'ON-CHAIN',   desc: 'Interactive token holder clustering and concentration risk map' },
  { Icon: Eye,         label: 'Whale Tracker',       badge: 'SMART MONEY', desc: 'Track high-conviction multi-chain wallet moves in real time' },
  { Icon: Target,      label: 'Alpha Calls',         badge: 'SIGNALS',    desc: 'Curated trade setups with entry, multi-target TPs & stop loss' },
  { Icon: Bot,         label: 'Alpha AI',            badge: '24/7 AI',    desc: 'Portfolio-aware neural assistant for live market insights' },
  { Icon: Activity,    label: 'Social Intel',        badge: 'SENTIMENT',  desc: 'Santiment on-chain social volume, net sentiment & trending topics' },
  { Icon: ShieldCheck, label: 'Security Scanner',    badge: 'PROTECTION', desc: 'One-click wallet token allowance audit & contract approval revocation' },
];

function AlphaDeskGate() {
  const handleUpgrade = () => window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-12 animate-in fade-in duration-700">
      <div className="flex flex-col items-center gap-4 mb-10 text-center max-w-xl">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-alphabag-yellow/10 border border-alphabag-yellow/40 flex items-center justify-center shadow-[0_0_30px_rgba(252,213,53,0.15)]">
            <Lock size={36} className="text-alphabag-yellow" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-alphabag-black border border-alphabag-yellow flex items-center justify-center text-[10px] text-alphabag-yellow font-black">
            PRO
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-alphabag-yellow/10 border border-alphabag-yellow/20 text-alphabag-yellow text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            <Sparkles size={11} /> Premium Terminal
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Alpha Desk</h1>
          <p className="text-alphabag-subtext text-sm leading-relaxed max-w-md">
            The premier command centre for pro traders. 7 mission-critical intelligence tools in one cohesive workspace.
          </p>
        </div>

        <Button onClick={handleUpgrade} size="md" className="w-full max-w-xs uppercase font-black tracking-widest shadow-xl">
          <Zap size={14} className="mr-2" /> Unlock Alpha Desk
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full max-w-5xl">
        {GATE_TOOLS.map(({ Icon, label, badge, desc }) => (
          <div
            key={label}
            className="bg-[#0b0f17]/80 border border-white/5 rounded-2xl p-4 flex flex-col gap-2.5 backdrop-blur-md opacity-75 hover:opacity-100 transition-opacity"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-alphabag-yellow/10 border border-alphabag-yellow/20 flex items-center justify-center text-alphabag-yellow">
                  <Icon size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">{label}</span>
                  <span className="text-[9px] font-bold text-alphabag-yellow uppercase tracking-wider">{badge}</span>
                </div>
              </div>
              <Lock size={12} className="text-alphabag-subtext" />
            </div>
            <p className="text-[11px] text-alphabag-subtext leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export const AlphaDesk: React.FC = () => {
  const { user } = useAuth();
  const isPremium = user && ['PREMIUM', 'ALPHA_VIP', 'ULTIMATE'].includes(user.tier);

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabId>('tradingview');
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(new Set(['tradingview']));

  // Shared token state
  const [preset, setPreset] = useState(PRESETS[0]);
  const [customAddress, setCustomAddress] = useState(PRESETS[0].address);
  const [copied, setCopied] = useState(false);

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setMountedTabs((prev) => new Set([...prev, id]));
  };

  const handlePresetSelect = (p: typeof PRESETS[0]) => {
    setPreset(p);
    setCustomAddress(p.address);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(customAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isPremium) return <AlphaDeskGate />;

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-5rem)] bg-[#080b11] rounded-2xl border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500">
      
      {/* ── Top Command Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 py-3 bg-[#0d121c] border-b border-white/5">
        
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-alphabag-yellow/10 border border-alphabag-yellow/30 flex items-center justify-center shadow-[0_0_15px_rgba(252,213,53,0.2)]">
              <BarChart2 size={20} className="text-alphabag-yellow" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alphabag-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-alphabag-green"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-wide uppercase">Alpha Desk</h1>
              <span className="text-[9px] font-black bg-gradient-to-r from-alphabag-yellow to-amber-500 text-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                PRO TERMINAL
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-alphabag-subtext">
              <span className="flex items-center gap-1 text-alphabag-green font-medium">
                <Radio size={10} className="animate-pulse" /> ONLINE
              </span>
              <span>·</span>
              <span>7 Pro Intelligence Engines</span>
            </div>
          </div>
        </div>

        {/* Global Token Quick-Switch Bar (Preset chips + address bar) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Chips */}
          <div className="flex items-center bg-[#090d14] border border-white/5 rounded-xl p-1 gap-1">
            {PRESETS.map((p) => {
              const active = preset.label === p.label;
              return (
                <button
                  key={p.label}
                  onClick={() => handlePresetSelect(p)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-alphabag-yellow text-black shadow-[0_0_12px_rgba(252,213,53,0.25)]'
                      : 'text-alphabag-subtext hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-[11px] opacity-75">{p.iconSymbol}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Monospace Address Input */}
          <div className="flex items-center bg-[#090d14] border border-white/10 rounded-xl px-2.5 py-1 gap-2 min-w-[240px] flex-1 sm:flex-initial">
            <span className="text-[9px] font-bold text-alphabag-yellow uppercase px-1.5 py-0.5 rounded bg-alphabag-yellow/10">
              {preset.chain}
            </span>
            <input
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="Contract address..."
              className="bg-transparent text-xs text-white placeholder-alphabag-subtext/40 font-mono outline-none w-36 sm:w-48"
            />
            <button
              onClick={handleCopyAddress}
              className="text-alphabag-subtext hover:text-white transition-colors p-1"
              title="Copy Address"
            >
              {copied ? <Check size={12} className="text-alphabag-green" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sleek Segmented Terminal Tabs ───────────────────────────────────── */}
      <div className="flex items-center px-4 py-2 bg-[#0a0e16] border-b border-white/5 overflow-x-auto scrollbar-none gap-1.5">
        {TABS.map(({ id, label, badge, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                active
                  ? 'bg-alphabag-yellow/15 text-alphabag-yellow border border-alphabag-yellow/40 shadow-[0_0_15px_rgba(252,213,53,0.15)]'
                  : 'text-alphabag-subtext hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={14} className={active ? 'text-alphabag-yellow' : 'text-alphabag-subtext'} />
              <span>{label}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded transition-opacity ${
                  active ? 'bg-alphabag-yellow/20 text-alphabag-yellow' : 'bg-white/5 text-alphabag-subtext/60'
                }`}
              >
                {badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Active Tab Workstation ───────────────────────────────────────────── */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[#080b11]">
        
        {/* Tab 1: TradingView Chart */}
        <div className={activeTab === 'tradingview' ? 'block' : 'hidden'}>
          {mountedTabs.has('tradingview') && (
            <div className="space-y-3">
              <TradingViewChart symbol={preset.tvSymbol} height={660} />
            </div>
          )}
        </div>

        {/* Tab 2: Bubblemaps Embed */}
        <div className={activeTab === 'bubblemaps' ? 'block' : 'hidden'}>
          {mountedTabs.has('bubblemaps') && (
            <div className="space-y-3">
              <BubblemapsEmbed chain={preset.chain} address={customAddress} height={660} />
            </div>
          )}
        </div>

        {/* Tab 3: Whale Tracker */}
        <div className={activeTab === 'whales' ? 'block' : 'hidden'}>
          {mountedTabs.has('whales') && <Whales embedded={true} />}
        </div>

        {/* Tab 4: Alpha Calls */}
        <div className={activeTab === 'calls' ? 'block' : 'hidden'}>
          {mountedTabs.has('calls') && <AlphaCalls embedded={true} />}
        </div>

        {/* Tab 5: Alpha AI (Keep-Alive) */}
        <div className={activeTab === 'ai' ? 'block' : 'hidden'}>
          {mountedTabs.has('ai') && <AlphaAi embedded={true} />}
        </div>

        {/* Tab 6: Santiment Social Intelligence */}
        <div className={activeTab === 'santiment' ? 'block' : 'hidden'}>
          {mountedTabs.has('santiment') && (
            <SantimentMetrics assetSlug={preset.assetSlug} />
          )}
        </div>

        {/* Tab 7: Security Scanner */}
        <div className={activeTab === 'security' ? 'block' : 'hidden'}>
          {mountedTabs.has('security') && <SecurityScanner embedded={true} />}
        </div>
      </div>
    </div>
  );
};

export default AlphaDesk;
