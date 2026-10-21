import {
  Camera,
  ExternalLink,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildBubblemapsIframeUrl,
  fetchTokenBubbleMap,
  getChains,
  getTokenScreenshot,
  searchTokens,
} from '../../services/bubblemaps';
import { BubblemapsForensics } from './BubblemapsForensics';
import type {
  BubblemapsChainInfo,
  BubblemapsMapResponse,
  BubblemapsScreenshotResponse,
  BubblemapsTokenSearchResult,
} from '../../types/bubblemaps';

export interface ChainOption {
  id: string;
  name: string;
  icon: string;
}

export const DEFAULT_CHAINS: ChainOption[] = [
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [key, setKey] = useState(0);
  const [forensicsRefreshKey, setForensicsRefreshKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [forensicsData, setForensicsData] = useState<BubblemapsMapResponse | null>(null);
  const [forensicsLoading, setForensicsLoading] = useState(false);

  // Chains from API
  const [chainOptions, setChainOptions] = useState<ChainOption[]>(DEFAULT_CHAINS);

  // Live Token Search Autocomplete
  const [searchResults, setSearchResults] = useState<BubblemapsTokenSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Screenshot Snapshot Modal
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotData, setSnapshotData] = useState<BubblemapsScreenshotResponse | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // Fetch dynamic chains on mount
  useEffect(() => {
    getChains().then((chains: BubblemapsChainInfo[]) => {
      if (chains && chains.length > 0) {
        setChainOptions(
          chains.map((c) => ({
            id: c.id,
            name: c.name,
            icon:
              c.id === 'eth'
                ? 'Ξ'
                : c.id === 'solana'
                ? '◎'
                : c.id === 'bsc'
                ? '⬡'
                : c.id === 'base'
                ? '🔵'
                : c.id === 'arbi'
                ? '🔷'
                : c.id === 'polygon'
                ? '🟣'
                : c.id === 'avax'
                ? '🔺'
                : '🌐',
          }))
        );
      }
    });
  }, []);

  // Load raw B2B API Forensics Data
  useEffect(() => {
    let isMounted = true;
    setForensicsData(null);
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
  }, [selectedChain, activeAddress, forensicsRefreshKey]);

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

  // Handle Autocomplete Live Search
  const handleInputChange = (val: string) => {
    setInputAddress(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length >= 2 && !val.startsWith('0x') && val.length < 35) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchTokens(val, selectedChain);
        setSearchResults(results.slice(0, 6));
        setShowSearchDropdown(results.length > 0);
        setIsSearching(false);
      }, 300);
    } else {
      setShowSearchDropdown(false);
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: BubblemapsTokenSearchResult) => {
    const targetChain = result.token_key?.chain || result.chain || selectedChain;
    const targetAddr = result.token_key?.address || result.address || '';
    if (!targetAddr) return;

    setSelectedChain(targetChain);
    setActiveAddress(targetAddr);
    setInputAddress(targetAddr);
    setShowSearchDropdown(false);
    setLoading(true);
    setKey((k) => k + 1);
    onAddressChange?.(targetChain, targetAddr);
  };

  // Open Screenshot Snapshot Modal
  const handleOpenSnapshot = async () => {
    setShowSnapshotModal(true);
    setSnapshotLoading(true);
    try {
      const res = await getTokenScreenshot(selectedChain, activeAddress);
      setSnapshotData(res);
    } catch (e) {
      console.warn('[Bubblemaps Snapshot] Error:', e);
      setSnapshotData(null);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const src = useMemo(
    () => buildBubblemapsIframeUrl(selectedChain, activeAddress),
    [selectedChain, activeAddress, key]
  );

  const externalUrl = `https://app.bubblemaps.io/${selectedChain}/token/${activeAddress}`;

  const handleApplyAddress = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowSearchDropdown(false);
    const clean = inputAddress.trim();
    if (!clean) return;
    setActiveAddress(clean);
    setLoading(true);
    setKey((k) => k + 1);
    onAddressChange?.(selectedChain, clean);
  };

  const handleSelectQuickPick = (pick: PopularTokenPick) => {
    setShowSearchDropdown(false);
    setSelectedChain(pick.chain);
    setActiveAddress(pick.address);
    setInputAddress(pick.address);
    setLoading(true);
    setKey((k) => k + 1);
    onAddressChange?.(pick.chain, pick.address);
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

            {/* Actions: In-App Expand, External, and Overflow (Snapshot, Reload) */}
            <div className="flex items-center gap-1.5 self-end md:self-auto relative">
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-alphabag-yellow border border-[#2B313A] text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm"
                title="Expand to Full In-App Terminal"
              >
                <Maximize2 size={13} />
                <span>Open in App</span>
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

              {/* Overflow Menu for Secondary Actions */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                  className="p-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-gray-300 hover:text-white border border-[#2B313A] transition-colors"
                  title="More actions"
                >
                  <MoreHorizontal size={14} />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#14171D] border border-[#2B313A] rounded-lg p-1.5 shadow-xl z-30 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleOpenSnapshot();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#202630] rounded transition-colors text-left font-medium"
                    >
                      <Camera size={13} className="text-alphabag-yellow" />
                      <span>Verified Snapshot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setLoading(true);
                        setKey((k) => k + 1);
                        setForensicsRefreshKey((k) => k + 1);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#202630] rounded transition-colors text-left font-medium"
                    >
                      <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                      <span>Reload Embed</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Prominent Search & Custom Address Input Bar ── */}
          <div className="relative">
            <form
              onSubmit={handleApplyAddress}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
            >
              {/* Chain Selector Dropdown */}
              <div className="flex items-center bg-[#0B0E11] border border-[#2B313A] rounded-lg px-2.5 py-1.5 gap-2 shrink-0">
                <span className="text-xs text-alphabag-yellow font-bold">
                  {chainOptions.find((c) => c.id === selectedChain)?.icon || '🌐'}
                </span>
                <select
                  value={selectedChain}
                  onChange={(e) => {
                    setSelectedChain(e.target.value);
                    onAddressChange?.(e.target.value, activeAddress);
                  }}
                  className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer pr-1"
                >
                  {chainOptions.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#14171D] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address / Token Search Input */}
              <div className="flex-1 flex items-center bg-[#0B0E11] border border-[#2B313A] focus-within:border-alphabag-yellow/50 rounded-lg px-3 py-1.5 gap-2 transition-colors">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={inputAddress}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchDropdown(true);
                  }}
                  placeholder="Enter token address or search token name (e.g. PEPE, Trump, 0x6982...)..."
                  className="w-full bg-transparent text-xs text-white placeholder-gray-500 font-mono outline-none"
                />
                {isSearching && (
                  <div className="w-3.5 h-3.5 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                {inputAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputAddress('');
                      setShowSearchDropdown(false);
                    }}
                    className="text-gray-500 hover:text-gray-300 p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
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

            {/* ── Autocomplete Search Dropdown ── */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#14171D] border border-[#2B313A] rounded-lg shadow-2xl overflow-hidden divide-y divide-[#202630]">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="flex items-center justify-between p-2.5 hover:bg-[#202630] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.metadata?.img_url ? (
                        <img
                          src={item.metadata.img_url}
                          alt={item.metadata.name}
                          className="w-6 h-6 rounded-full border border-[#2B313A]"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#0B0E11] flex items-center justify-center text-[11px] text-alphabag-yellow font-bold border border-[#2B313A]">
                          {item.metadata?.symbol?.slice(0, 2) || 'TK'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {item.metadata?.name || item.name}
                          </span>
                          <span className="text-alphabag-yellow font-mono text-[11px]">
                            ${item.metadata?.symbol || item.symbol}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-500">
                          {item.token_key?.address || item.address}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[11px] bg-[#0B0E11] text-gray-400 uppercase font-mono border border-[#2B313A]">
                        {item.token_key?.chain || item.chain || selectedChain}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                    <span className="opacity-60 text-[11px] uppercase">({token.chain})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bubblemaps B2B API Forensics HUD ── */}
        <BubblemapsForensics
          data={forensicsData}
          loading={forensicsLoading}
          chain={selectedChain}
          tokenAddress={activeAddress}
        />

        {/* ── Frame Container ── */}
        <div className="relative w-full bg-[#0B0E11]" style={{ height }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0B0E11]/95 text-xs text-gray-300 ">
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

      {/* ── Screenshot Snapshot Modal ── */}
      {showSnapshotModal && (
        <div className="fixed inset-0 z-50 bg-[#0B0E11]/85 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#14171D] border border-[#2B313A] rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-[#181A20] border-b border-[#2B313A]">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-alphabag-yellow" />
                <span className="font-bold text-white text-sm">Verified Snapshot</span>
                <span className="text-xs text-gray-400 font-mono">
                  ({selectedChain.toUpperCase()})
                </span>
              </div>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#202630]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center justify-center min-h-[300px] bg-[#0B0E11]">
              {snapshotLoading ? (
                <div className="flex flex-col items-center gap-2 text-gray-400 text-xs">
                  <div className="w-6 h-6 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin" />
                  <span>Loading official verified screenshot...</span>
                </div>
              ) : snapshotData?.image_url || snapshotData?.screenshot_url ? (
                <div className="space-y-3 w-full flex flex-col items-center">
                  <img
                    src={snapshotData.image_url || snapshotData.screenshot_url}
                    alt="Bubblemaps Snapshot"
                    className="max-h-[500px] w-auto rounded border border-[#2B313A] shadow-md object-contain"
                  />
                  <div className="text-xs text-gray-400 font-mono">
                    Captured at:{' '}
                    {snapshotData.updated_at
                      ? new Date(snapshotData.updated_at).toLocaleString()
                      : 'Latest Index'}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-xs">
                  No static screenshot available yet for this token. View interactive map below.
                </p>
              )}
            </div>

            <div className="px-4 py-3 bg-[#181A20] border-t border-[#2B313A] flex justify-end">
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#202630] hover:bg-[#2B313A] text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-Screen In-App Workstation Modal ── */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[#0B0E11]/90 flex flex-col p-4 md:p-6 animate-in fade-in duration-200">
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
