import {
  Check,
  Copy,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { buildBubblemapsIframeUrl, fetchTokenBubbleMap } from '../../services/bubblemaps';
import { BubblemapsForensics } from './BubblemapsForensics';
import type { BubblemapsMapResponse } from '../../types/bubblemaps';

export interface ChainOption {
  id: string;
  name: string;
  icon: string;
}

export const SUPPORTED_CHAINS: ChainOption[] = [
  { id: 'eth', name: 'Ethereum', icon: 'Ξ' },
  { id: 'solana', name: 'Solana', icon: '◎' },
  { id: 'bsc', name: 'BNB Chain', icon: '⬡' },
  { id: 'base', name: 'Base', icon: '🔵' },
  { id: 'arbi', name: 'Arbitrum', icon: '🔷' },
  { id: 'polygon', name: 'Polygon', icon: '🟣' },
  { id: 'avax', name: 'Avalanche', icon: '🔺' },
];

export interface PopularTokenPick {
  symbol: string;
  chain: string;
  address: string;
  name: string;
}

export const POPULAR_BUBBLE_TOKENS: PopularTokenPick[] = [
  { symbol: 'PEPE', chain: 'eth', address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', name: 'Pepe (Ethereum)' },
  { symbol: 'SHIB', chain: 'eth', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', name: 'Shiba Inu (Ethereum)' },
  { symbol: 'BONK', chain: 'solana', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'Bonk (Solana)' },
  { symbol: 'WIF', chain: 'solana', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', name: 'dogwifhat (Solana)' },
  { symbol: 'FLOKI', chain: 'bsc', address: '0xfb5b838b6cffd8d28d237f43965a974cf260ee96', name: 'Floki (BNB Chain)' },
  { symbol: 'DEGEN', chain: 'base', address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed', name: 'Degen (Base)' },
  { symbol: 'BRETT', chain: 'base', address: '0x532f27101965dd16442e59d40670faf5ebb142e4', name: 'Brett (Base)' },
  { symbol: 'WBTC', chain: 'eth', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', name: 'Wrapped BTC (Ethereum)' },
];

interface BubblemapsEmbedProps {
  chain: string;
  address: string;
  height?: number;
  onAddressChange?: (chain: string, address: string) => void;
}

export function BubblemapsEmbed({
  chain: initialChain = 'eth',
  address: initialAddress = '0x6982508145454ce325ddbe47a25d4ec3d2311933',
  height = 660,
  onAddressChange,
}: BubblemapsEmbedProps) {
  const [selectedChain, setSelectedChain] = useState<string>(initialChain);
  const [activeAddress, setActiveAddress] = useState<string>(initialAddress);
  const [inputAddress, setInputAddress] = useState<string>(initialAddress);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [forensicsData, setForensicsData] = useState<BubblemapsMapResponse | null>(null);
  const [forensicsLoading, setForensicsLoading] = useState(false);

  // Load raw B2B API Forensics Data
  useEffect(() => {
    let isMounted = true;
    setForensicsLoading(true);
    fetchTokenBubbleMap(selectedChain, activeAddress)
      .then((data) => {
        if (isMounted) setForensicsData(data);
      })
      .catch((err) => {
        console.warn('[Bubblemaps Forensics] Load error:', err);
      })
      .finally(() => {
        if (isMounted) setForensicsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedChain, activeAddress]);

  // Sync if parent updates initial props
  useEffect(() => {
    if (initialChain && initialChain !== selectedChain) {
      setSelectedChain(initialChain);
    }
    if (initialAddress && initialAddress !== activeAddress) {
      setActiveAddress(initialAddress);
      setInputAddress(initialAddress);
    }
  }, [initialChain, initialAddress]);

  const src = useMemo(
    () => buildBubblemapsIframeUrl(selectedChain, activeAddress),
    [selectedChain, activeAddress, key]
  );

  const externalUrl = `https://app.bubblemaps.io/${selectedChain}/token/${activeAddress}`;

  const handleApplyAddress = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputAddress.trim();
    if (!clean) return;
    setActiveAddress(clean);
    setLoading(true);
    setKey((k) => k + 1);
    onAddressChange?.(selectedChain, clean);
  };

  const handleSelectQuickPick = (pick: PopularTokenPick) => {
    setSelectedChain(pick.chain);
    setActiveAddress(pick.address);
    setInputAddress(pick.address);
    setLoading(true);
    setKey((k) => k + 1);
    onAddressChange?.(pick.chain, pick.address);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-[8px] border border-[#2B313A] bg-[#181A20] shadow-xl">
        {/* ── Top Address & Chain Command Toolbar ── */}
        <div className="p-3.5 bg-[#14171D] border-b border-[#2B313A] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Header Title & Status */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow shadow-inner">
                <Share2 size={16} />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-wide uppercase">
                  Holder Distribution
                </span>
                <p className="text-xs text-gray-400">
                  Inspect wallet clusters, insider concentrations, and cross-wallet funding links.
                </p>
              </div>
            </div>

            {/* Actions: In-App Expand, Reload, External */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-alphabag-yellow border border-[#2B313A] text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm"
                title="Expand to Full In-App Terminal"
              >
                <Maximize2 size={13} />
                <span>Open in App</span>
              </button>

              <button
                onClick={() => {
                  setLoading(true);
                  setKey((k) => k + 1);
                }}
                className="p-2 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-gray-300 hover:text-white border border-[#2B313A] text-xs transition-colors"
                title="Reload Embed"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>

              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-gray-300 hover:text-white border border-[#2B313A] text-xs font-medium transition-colors"
                title="Open directly on Bubblemaps.io"
              >
                <span>External</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* ── Prominent Search & Custom Address Input Bar ── */}
          <form
            onSubmit={handleApplyAddress}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
          >
            {/* Chain Selector Dropdown */}
            <div className="flex items-center bg-[#0B0E11] border border-[#2B313A] rounded-lg px-2.5 py-1.5 gap-2 shrink-0">
              <span className="text-xs text-alphabag-yellow font-bold">
                {SUPPORTED_CHAINS.find((c) => c.id === selectedChain)?.icon || '🌐'}
              </span>
              <select
                value={selectedChain}
                onChange={(e) => {
                  setSelectedChain(e.target.value);
                  onAddressChange?.(e.target.value, activeAddress);
                }}
                className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer pr-1"
              >
                {SUPPORTED_CHAINS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#14171D] text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Address Input */}
            <div className="flex-1 flex items-center bg-[#0B0E11] border border-[#2B313A] focus-within:border-alphabag-yellow/50 rounded-lg px-3 py-1.5 gap-2 transition-colors">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                placeholder="Enter any token contract address (e.g. 0x6982... or Solana mint)..."
                className="w-full bg-transparent text-xs text-white placeholder-gray-500 font-mono outline-none"
              />
              {inputAddress && (
                <button
                  type="button"
                  onClick={() => setInputAddress('')}
                  className="text-gray-500 hover:text-gray-300 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={copyAddress}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Copy Active Address"
              >
                {copied ? <Check size={13} className="text-[#0ECB81]" /> : <Copy size={13} />}
              </button>
            </div>

            {/* Analyze CTA */}
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-alphabag-yellow hover:bg-[#FCD535] text-[#0B0E11] text-xs font-bold transition-all shadow-md shrink-0"
            >
              <Sparkles size={13} />
              <span>Inspect Map</span>
            </button>
          </form>

          {/* Quick-Pick Popular Tokens */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 text-xs">
            <span className="text-[11px] font-semibold text-gray-400 shrink-0 uppercase tracking-wider">
              Quick Picks:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {POPULAR_BUBBLE_TOKENS.map((token) => {
                const isActive = activeAddress.toLowerCase() === token.address.toLowerCase();
                return (
                  <button
                    key={`${token.chain}-${token.symbol}`}
                    type="button"
                    onClick={() => handleSelectQuickPick(token)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      isActive
                        ? 'bg-alphabag-yellow text-[#0B0E11] font-bold shadow'
                        : 'bg-[#202630] text-gray-300 hover:text-white hover:bg-[#2B313A] border border-[#2B313A]'
                    }`}
                  >
                    <span>{token.symbol}</span>
                    <span className="opacity-60 text-[10px] uppercase">({token.chain})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bubblemaps B2B API Forensics HUD ── */}
        <BubblemapsForensics data={forensicsData} loading={forensicsLoading} />

        {/* ── Frame Container ── */}
        <div className="relative w-full bg-[#0B0E11]" style={{ height }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0B0E11]/95 text-xs text-gray-300 backdrop-blur-sm">
              <div className="w-9 h-9 border-2 border-alphabag-yellow/20 border-t-alphabag-yellow rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Analyzing On-Chain Clusters...</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  {selectedChain.toUpperCase()} • {activeAddress.slice(0, 8)}...{activeAddress.slice(-6)}
                </p>
              </div>
            </div>
          )}
          <iframe
            key={`${src}-${key}`}
            src={src}
            title={`Holder distribution map for ${activeAddress}`}
            allow="clipboard-write"
            loading="lazy"
            onLoad={() => setLoading(false)}
            className="w-full h-full border-none"
          />
        </div>
      </div>

      {/* ── Full-Screen In-App Workstation Modal ── */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[#0B0E11]/90 backdrop-blur-md flex flex-col p-4 md:p-6 animate-in fade-in duration-200">
          <div className="w-full h-full flex flex-col bg-[#14171D] border border-[#2B313A] rounded-xl overflow-hidden shadow-2xl">
            {/* Modal Command Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#181A20] border-b border-[#2B313A]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow">
                  <Share2 size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide uppercase">
                    Bubblemaps Pro Station
                  </h2>
                  <p className="text-xs text-gray-400 font-mono truncate max-w-xl">
                    {activeAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-gray-300 hover:text-white border border-[#2B313A] text-xs font-semibold transition-colors"
                >
                  <Minimize2 size={14} />
                  <span>Exit Fullscreen</span>
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-gray-400 hover:text-white border border-[#2B313A] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Iframe Content */}
            <div className="flex-1 w-full bg-[#0B0E11] relative">
              <iframe
                src={src}
                title={`Fullscreen holder map for ${activeAddress}`}
                allow="clipboard-write"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BubblemapsEmbed;
