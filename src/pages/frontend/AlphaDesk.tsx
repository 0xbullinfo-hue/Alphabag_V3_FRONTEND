import {
  Activity,
  BarChart2,
  Bot,
  Copy,
  Check,
  Eye,
  Lock,
  LucideIcon,
  Share2,
  ShieldCheck,
  Target,
  Wallet,
  Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
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
  { label: 'DOGE', iconSymbol: 'Ð', tvSymbol: 'BINANCE:DOGEUSDT', chain: 'bsc',    address: '0xba2ae424d960c26247dd6c32edc70b295c744c43', assetSlug: 'dogecoin' },
  { label: 'PEPE', iconSymbol: '🐸', tvSymbol: 'BINANCE:PEPEUSDT', chain: 'eth',    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', assetSlug: 'pepe' },
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
  { Icon: BarChart2,   label: 'TradingView Suite', desc: 'Institutional technical analysis with custom timeframes and drawing tools' },
  { Icon: Share2,      label: 'Bubblemaps',        desc: 'Interactive token holder clustering and concentration risk analysis' },
  { Icon: Eye,         label: 'Wallet Flow',       desc: 'Real-time multi-chain large transaction telemetry and smart wallet flows' },
  { Icon: Target,      label: 'Trade Signals',     desc: 'Structured market entries, multi-tier profit targets, and invalidation stops' },
  { Icon: Bot,         label: 'Market AI',         desc: 'Quantitative market assistant with token context and historical memory' },
  { Icon: Activity,    label: 'Social Intel',      desc: 'Santiment on-chain social volume, net sentiment balance, and keyword velocity' },
  { Icon: ShieldCheck, label: 'Security Approvals',desc: 'Wallet token allowance audit and contract approval revocation terminal' },
];

function AlphaDeskGate() {
  const { user } = useAuth();
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();

  const handleAction = () => {
    if (!isConnected) {
      open();
    } else if (!user) {
      window.dispatchEvent(new CustomEvent('open-login-modal'));
    } else {
      window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center gap-3.5 mb-8 text-center max-w-lg">
        <div className="w-16 h-16 rounded-2xl bg-[#181A20] border border-[#2B313A] flex items-center justify-center p-2.5">
          <img src="/logo.png" alt="AlphaBAG Logo" className="w-full h-full object-contain rounded-full" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-alphabag-text tracking-tight uppercase">Alpha Desk Pro</h1>
          <p className="text-alphabag-subtext text-xs leading-relaxed max-w-md">
            Integrated quantitative workstation aggregating charting, holder topology, smart wallet flows, and on-chain security.
          </p>
        </div>

        <div className="w-full max-w-xs mt-1">
          <Button
            onClick={handleAction}
            size="md"
            className="w-full font-semibold shadow-[0_0_20px_rgba(240,185,11,0.25)] hover:shadow-[0_0_25px_rgba(240,185,11,0.35)] transition-all"
          >
            {!isConnected ? (
              <>
                <Wallet size={15} className="mr-1.5" /> Connect Wallet to Unlock
              </>
            ) : !user ? (
              <>
                <Lock size={15} className="mr-1.5" /> Sign In with Wallet
              </>
            ) : (
              <>
                <Zap size={15} className="mr-1.5" /> Mint Alpha Pass
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 w-full max-w-5xl">
        {GATE_TOOLS.map(({ Icon, label, desc }) => (
          <div
            key={label}
            className="group bg-[#181A20] border border-[#2B313A] rounded-[6px] p-3.5 flex flex-col gap-2 transition-all duration-200 hover:border-alphabag-yellow/40 hover:bg-[#1C2027] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow group-hover:border-alphabag-yellow/30 transition-colors shrink-0">
                <Icon size={15} />
              </div>
              <span className="text-sm font-semibold text-alphabag-text block">{label}</span>
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
              <h1 className="text-base font-bold text-alphabag-text tracking-wide uppercase">Alpha Desk</h1>
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
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
      <div className="flex items-center px-4 py-2.5 bg-[#14171D] border-b border-[#2B313A] overflow-x-auto no-scrollbar gap-2">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm md:text-base font-bold transition-all shrink-0 ${
                active
                  ? 'bg-[#202630] text-alphabag-yellow border border-[#2B313A] shadow-md ring-1 ring-alphabag-yellow/20'
                  : 'text-alphabag-subtext hover:text-alphabag-text hover:bg-[#202630]/60 border border-transparent'
              }`}
            >
              <Icon size={18} className={active ? 'text-alphabag-yellow' : 'text-alphabag-subtext'} />
              <span>{label}</span>
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
              <BubblemapsEmbed
                chain={preset.chain}
                address={customAddress}
                height={660}
                onAddressChange={(_chain, addr) => setCustomAddress(addr)}
              />
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
