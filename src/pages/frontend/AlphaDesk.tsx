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
  { id: 'tradingview', label: 'TradingView',   badge: 'CHART',     Icon: BarChart2   },
  { id: 'bubblemaps',  label: 'Bubblemaps',    badge: 'HOLDERS',   Icon: Share2      },
  { id: 'whales',      label: 'Wallet Flow',   badge: 'FLOW',      Icon: Eye         },
  { id: 'calls',       label: 'Trade Signals', badge: 'SIGNALS',   Icon: Target      },
  { id: 'ai',          label: 'Market AI',     badge: 'ASSISTANT', Icon: Bot         },
  { id: 'santiment',   label: 'Social Intel',  badge: 'METRICS',   Icon: Activity    },
  { id: 'security',    label: 'Approvals Scan',badge: 'SECURITY',  Icon: ShieldCheck },
];

// ─── Premium gate screen ──────────────────────────────────────────────────────
const GATE_TOOLS = [
  { Icon: BarChart2,   label: 'TradingView Suite', badge: 'CHART',     desc: 'Institutional technical analysis with custom timeframes and drawing tools' },
  { Icon: Share2,      label: 'Bubblemaps',        badge: 'HOLDERS',   desc: 'Interactive token holder clustering and concentration risk analysis' },
  { Icon: Eye,         label: 'Wallet Flow',       badge: 'FLOW',      desc: 'Real-time multi-chain large transaction telemetry and smart wallet flows' },
  { Icon: Target,      label: 'Trade Signals',     badge: 'SIGNALS',   desc: 'Structured market entries, multi-tier profit targets, and invalidation stops' },
  { Icon: Bot,         label: 'Market AI',         badge: 'ASSISTANT', desc: 'Quantitative market assistant with token context and historical memory' },
  { Icon: Activity,    label: 'Social Intel',      badge: 'METRICS',   desc: 'Santiment on-chain social volume, net sentiment balance, and keyword velocity' },
  { Icon: ShieldCheck, label: 'Security Approvals',badge: 'SECURITY',  desc: 'Wallet token allowance audit and contract approval revocation terminal' },
];

function AlphaDeskGate() {
  const handleUpgrade = () => window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center gap-3.5 mb-8 text-center max-w-lg">
        <div className="w-12 h-12 rounded-[6px] bg-[#181A20] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow">
          <Lock size={22} />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-alphabag-yellow/10 border border-alphabag-yellow/20 text-alphabag-yellow text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-[2px]">
            Institutional Terminal Suite
          </div>
          <h1 className="text-2xl font-bold text-alphabag-text tracking-tight uppercase">Alpha Desk Pro</h1>
          <p className="text-alphabag-subtext text-xs leading-relaxed max-w-md">
            Integrated quantitative workstation aggregating charting, holder topology, smart wallet flows, and on-chain security.
          </p>
        </div>

        <Button onClick={handleUpgrade} size="md" className="w-full max-w-xs font-semibold">
          <Zap size={14} className="mr-1.5" /> Access Alpha Desk Pro
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 w-full max-w-5xl">
        {GATE_TOOLS.map(({ Icon, label, badge, desc }) => (
          <div
            key={label}
            className="bg-[#181A20] border border-[#2B313A] rounded-[6px] p-3.5 flex flex-col gap-2 transition-colors hover:border-[#3E4552]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow">
                  <Icon size={14} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-alphabag-text block">{label}</span>
                  <span className="text-[11px] font-semibold text-alphabag-subtext uppercase">{badge}</span>
                </div>
              </div>
              <Lock size={12} className="text-alphabag-subtext/60" />
            </div>
            <p className="text-xs text-alphabag-subtext leading-relaxed">{desc}</p>
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
    <div className="flex flex-col w-full min-h-[calc(100vh-4.5rem)] bg-[#181A20] rounded-[6px] border border-[#2B313A] overflow-hidden">
      
      {/* ── Top Command Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 px-3.5 py-2.5 bg-[#14171D] border-b border-[#2B313A]">
        
        {/* Brand & Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow">
            <BarChart2 size={16} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-alphabag-text tracking-wide uppercase">Alpha Desk</h1>
              <span className="text-[11px] font-semibold bg-alphabag-yellow/10 border border-alphabag-yellow/20 text-alphabag-yellow px-1.5 py-0.2 rounded-[2px] uppercase">
                PRO TERMINAL
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-alphabag-subtext">
              <span className="flex items-center gap-1 text-alphabag-green font-medium">
                <Radio size={10} /> LIVE FEED
              </span>
              <span>·</span>
              <span>7 Institutional Engines</span>
            </div>
          </div>
        </div>

        {/* Global Token Quick-Switch Bar (Preset chips + address bar) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Chips */}
          <div className="flex items-center bg-[#0B0E11] border border-[#2B313A] rounded p-0.5 gap-0.5">
            {PRESETS.map((p) => {
              const active = preset.label === p.label;
              return (
                <button
                  key={p.label}
                  onClick={() => handlePresetSelect(p)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#202630] text-alphabag-text font-semibold'
                      : 'text-alphabag-subtext hover:text-alphabag-text'
                  }`}
                >
                  <span className="text-[11px] opacity-75">{p.iconSymbol}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Monospace Address Input */}
          <div className="flex items-center bg-[#0B0E11] border border-[#2B313A] rounded px-2.5 py-1 gap-1.5 min-w-[220px] flex-1 sm:flex-initial">
            <span className="text-[11px] font-semibold text-alphabag-yellow uppercase px-1 py-0.2 rounded-[2px] bg-alphabag-yellow/10">
              {preset.chain}
            </span>
            <input
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="Contract address..."
              className="bg-transparent text-xs text-alphabag-text placeholder:text-alphabag-subtext/40 num outline-none w-32 sm:w-44"
            />
            <button
              onClick={handleCopyAddress}
              className="text-alphabag-subtext hover:text-alphabag-text transition-colors p-0.5"
              title="Copy Address"
            >
              {copied ? <Check size={12} className="text-alphabag-green" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sleek Segmented Terminal Tabs ───────────────────────────────────── */}
      <div className="flex items-center px-3.5 py-1.5 bg-[#14171D]/60 border-b border-[#2B313A] overflow-x-auto no-scrollbar gap-1">
        {TABS.map(({ id, label, badge, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 ${
                active
                  ? 'bg-[#202630] text-alphabag-yellow font-semibold border border-[#2B313A]'
                  : 'text-alphabag-subtext hover:text-alphabag-text hover:bg-[#202630]/40 border border-transparent'
              }`}
            >
              <Icon size={13} className={active ? 'text-alphabag-yellow' : 'text-alphabag-subtext'} />
              <span>{label}</span>
              <span
                className={`text-[11px] num px-1.5 py-0.2 rounded-[2px] ${
                  active ? 'bg-alphabag-yellow/15 text-alphabag-yellow' : 'bg-white/5 text-alphabag-subtext'
                }`}
              >
                {badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Active Tab Workstation ───────────────────────────────────────────── */}
      <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar bg-[#0B0E11]">
        
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
