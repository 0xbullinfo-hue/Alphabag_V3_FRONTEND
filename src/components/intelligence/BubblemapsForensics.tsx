import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Network,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { getAddressMetadata, getAddressesSubgraph } from '../../services/bubblemaps';
import type {
  BubblemapsAddressMetadata,
  BubblemapsMapResponse,
  BubblemapsSubgraphResponse,
} from '../../types/bubblemaps';

interface BubblemapsForensicsProps {
  data: BubblemapsMapResponse | null;
  loading?: boolean;
  chain?: string;
  tokenAddress?: string;
}

export const BubblemapsForensics: React.FC<BubblemapsForensicsProps> = ({
  data,
  loading,
  chain = 'eth',
  tokenAddress,
}) => {
  const [showClusters, setShowClusters] = useState(false);
  const [activeClusterIndex, setActiveClusterIndex] = useState<number | null>(null);
  const [subgraphData, setSubgraphData] = useState<BubblemapsSubgraphResponse | null>(null);
  const [subgraphLoading, setSubgraphLoading] = useState(false);

  // Address Details Modal
  const [inspectAddress, setInspectAddress] = useState<string | null>(null);
  const [addressDetails, setAddressDetails] = useState<BubblemapsAddressMetadata | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3.5 bg-[#14171D] border-b border-[#2B313A] animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-[#0B0E11] rounded-lg border border-[#2B313A]" />
        ))}
      </div>
    );
  }

  const { metrics, clusters } = data;
  const score = metrics.scores.bubblemaps_score;
  const topCluster = clusters?.[0];
  const isHighRisk = score < 60 || (topCluster && topCluster.share > 25);
  const isModerateRisk = score >= 60 && score < 80;

  // Handle Trace Subgraph between cluster wallets
  const handleTraceCluster = async (clusterIdx: number, holders: string[]) => {
    if (activeClusterIndex === clusterIdx) {
      setActiveClusterIndex(null);
      setSubgraphData(null);
      return;
    }

    setActiveClusterIndex(clusterIdx);
    setSubgraphLoading(true);

    try {
      const res = await getAddressesSubgraph(holders, {
        chain,
        address: tokenAddress || '',
      });
      setSubgraphData(res);
    } catch (err) {
      console.warn('[Bubblemaps Forensics] Trace error:', err);
      setSubgraphData(null);
    } finally {
      setSubgraphLoading(false);
    }
  };

  // Handle Inspect Single Address
  const handleInspectAddress = async (addr: string) => {
    setInspectAddress(addr);
    setAddressLoading(true);
    setAddressDetails(null);

    try {
      const res = await getAddressMetadata(addr, chain);
      setAddressDetails(res);
    } catch (err) {
      console.warn('[Bubblemaps Forensics] Address metadata error:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  return (
    <div className="bg-[#14171D] border-b border-[#2B313A] p-3.5 space-y-3">
      {/* ── 4 Executive Risk Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Card 1: Score */}
        <div className="bg-[#0B0E11] border border-[#2B313A] rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Decentralization Score</span>
            {isHighRisk ? (
              <ShieldAlert size={14} className="text-[#F6465D]" />
            ) : isModerateRisk ? (
              <Shield size={14} className="text-alphabag-yellow" />
            ) : (
              <ShieldCheck size={14} className="text-[#0ECB81]" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span
              className={`text-2xl font-bold font-mono ${
                isHighRisk ? 'text-[#F6465D]' : isModerateRisk ? 'text-alphabag-yellow' : 'text-[#0ECB81]'
              }`}
            >
              {score}
            </span>
            <span className="text-xs text-gray-500 font-mono">/ 100</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {isHighRisk ? 'High insider concentration' : isModerateRisk ? 'Moderate cluster links' : 'Healthy distribution'}
          </p>
        </div>

        {/* Card 2: Top Connected Cluster */}
        <div className="bg-[#0B0E11] border border-[#2B313A] rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Top Insider Cluster</span>
            <Users size={14} className="text-alphabag-yellow" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {topCluster ? `${topCluster.share.toFixed(1)}%` : '0%'}
            </span>
            <span className="text-xs text-gray-400">
              ({topCluster?.holder_count || 0} wallets)
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {topCluster && topCluster.magic_node_count > 0
              ? `Linked by ${topCluster.magic_node_count} funding node`
              : 'Direct peer relationships'}
          </p>
        </div>

        {/* Card 3: Supply Defense Metrics */}
        <div className="bg-[#0B0E11] border border-[#2B313A] rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Nakamoto Coefficient</span>
            <Zap size={14} className="text-alphabag-yellow" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.scores.nakamoto_coefficient}
            </span>
            <span className="text-xs text-gray-400">entities</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 font-mono">
            Gini Index: {metrics.scores.gini_index.toFixed(2)}
          </p>
        </div>

        {/* Card 4: Sniper & Fresh Wallets */}
        <div className="bg-[#0B0E11] border border-[#2B313A] rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Sniper Bundles</span>
            <AlertTriangle size={14} className="text-gray-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.supply_stats.bundles.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">of supply</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Fresh Wallets: {metrics.supply_stats.fresh_wallets.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* ── Supply Allocation Proportional Bar ── */}
      <div className="bg-[#0B0E11] border border-[#2B313A] rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
          <span className="text-gray-400 font-medium">Supply Allocation Telemetry</span>
          <div className="flex items-center gap-3 text-[11px] font-mono flex-wrap">
            <span className="flex items-center gap-1 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              CEX: {metrics.supply_stats.cexs}%
            </span>
            <span className="flex items-center gap-1 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-[#0ECB81]" />
              DEX: {metrics.supply_stats.dexs}%
            </span>
            <span className="flex items-center gap-1 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
              Contracts: {metrics.supply_stats.contracts}%
            </span>
            <span className="flex items-center gap-1 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-[#F6465D]" />
              Top 10 Adjusted: {metrics.supply_stats.top_10_adjusted}%
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2 bg-[#181A20] rounded-full overflow-hidden flex">
          <div style={{ width: `${metrics.supply_stats.cexs}%` }} className="bg-[#3B82F6] h-full" title="CEX" />
          <div style={{ width: `${metrics.supply_stats.dexs}%` }} className="bg-[#0ECB81] h-full" title="DEX" />
          <div style={{ width: `${metrics.supply_stats.contracts}%` }} className="bg-[#8B5CF6] h-full" title="Contracts" />
          <div style={{ width: `${metrics.supply_stats.top_10_adjusted}%` }} className="bg-[#F6465D] h-full" title="Top 10" />
        </div>
      </div>

      {/* ── Clusters Drawer Toggle ── */}
      {clusters && clusters.length > 0 && (
        <div className="pt-1">
          <button
            onClick={() => setShowClusters(!showClusters)}
            className="flex items-center gap-1.5 text-xs text-alphabag-yellow hover:text-[#FCD535] font-semibold transition-colors"
          >
            <span>{showClusters ? 'Hide Identified Clusters' : `Inspect ${clusters.length} Identified Clusters`}</span>
            {showClusters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showClusters && (
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                {clusters.map((c, idx) => {
                  const isTracing = activeClusterIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`bg-[#0B0E11] border rounded-lg p-2.5 space-y-2 transition-colors ${
                        isTracing ? 'border-alphabag-yellow bg-[#14171D]' : 'border-[#2B313A]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-sans">Cluster #{idx + 1}</span>
                        <span className="text-alphabag-yellow font-bold">{c.share.toFixed(1)}% of supply</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span>{c.holder_count} wallets</span>
                        <span>•</span>
                        <span>{c.magic_node_count} funding nodes</span>
                      </div>

                      {/* Wallet Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.holders.slice(0, 4).map((h, hIdx) => (
                          <button
                            key={hIdx}
                            type="button"
                            onClick={() => handleInspectAddress(h)}
                            className="px-1.5 py-0.5 rounded bg-[#1C2028] hover:bg-[#2B313A] text-gray-300 hover:text-white border border-[#2B313A] text-[10px] font-mono transition-colors"
                            title="Click to inspect address metadata"
                          >
                            {h.length > 10 ? `${h.slice(0, 6)}...${h.slice(-4)}` : h}
                          </button>
                        ))}
                        {c.holders.length > 4 && (
                          <span className="text-[10px] text-gray-500">+{c.holders.length - 4} more</span>
                        )}
                      </div>

                      {/* Trace Money Trails CTA */}
                      <div className="pt-1 flex items-center justify-between border-t border-[#1C2028]">
                        <span className="text-[10px] text-gray-500 truncate max-w-[150px]">
                          {c.magic_nodes?.[0] ? `Source: ${c.magic_nodes[0].slice(0, 10)}...` : 'Direct links'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTraceCluster(idx, c.holders)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#202630] hover:bg-[#2B313A] text-alphabag-yellow text-[10px] font-semibold transition-colors"
                        >
                          <Network size={11} />
                          <span>{isTracing ? 'Hide Trail' : 'Trace Subgraph'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Subgraph Transfer Trail Results Drawer ── */}
              {activeClusterIndex !== null && (
                <div className="p-3 bg-[#0B0E11] border border-alphabag-yellow/40 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[#2B313A] pb-2">
                    <div className="flex items-center gap-2">
                      <Network size={14} className="text-alphabag-yellow" />
                      <span className="font-bold text-white">
                        Cluster #{activeClusterIndex + 1} Transfer Relationships Subgraph
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveClusterIndex(null);
                        setSubgraphData(null);
                      }}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {subgraphLoading ? (
                    <div className="py-4 flex items-center justify-center gap-2 text-gray-400 text-xs">
                      <div className="w-4 h-4 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin" />
                      <span>Tracing inter-wallet transfers via Bubblemaps Subgraph API...</span>
                    </div>
                  ) : subgraphData && subgraphData.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {subgraphData.map((edge, edgeIdx) => (
                        <div
                          key={edgeIdx}
                          className="flex items-center justify-between p-2 rounded bg-[#14171D] border border-[#2B313A] font-mono text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => handleInspectAddress(edge.from_address)}
                              className="text-gray-300 hover:text-alphabag-yellow cursor-pointer"
                            >
                              {edge.from_address.slice(0, 6)}...{edge.from_address.slice(-4)}
                            </span>
                            <ArrowRight size={12} className="text-alphabag-yellow" />
                            <span
                              onClick={() => handleInspectAddress(edge.to_address)}
                              className="text-gray-300 hover:text-alphabag-yellow cursor-pointer"
                            >
                              {edge.to_address.slice(0, 6)}...{edge.to_address.slice(-4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-400">
                            <span>{edge.data.total_transfers} transfers</span>
                            <span className="text-alphabag-yellow font-semibold">
                              {edge.data.total_value.toLocaleString()} units
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-2 text-center text-gray-500 text-xs">
                      No direct transfer edges recorded between these cluster nodes for this context token.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Single Address Metadata Modal ── */}
      {inspectAddress && (
        <div className="fixed inset-0 z-50 bg-[#0B0E11]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#14171D] border border-[#2B313A] rounded-xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#2B313A] pb-2.5">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-alphabag-yellow" />
                <span className="font-bold text-white text-sm">Address Forensics</span>
              </div>
              <button
                onClick={() => setInspectAddress(null)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#202630]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs font-mono text-gray-300 break-all bg-[#0B0E11] p-2 rounded border border-[#2B313A]">
              {inspectAddress}
            </div>

            {addressLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-gray-400 text-xs">
                <div className="w-4 h-4 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin" />
                <span>Fetching address metadata from Bubblemaps...</span>
              </div>
            ) : addressDetails ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0B0E11] p-2.5 rounded border border-[#2B313A]">
                    <span className="text-gray-500 block text-[10px] uppercase">Connection Degree</span>
                    <span className="text-white font-mono font-bold text-base">
                      {addressDetails.address_details?.degree ?? 'N/A'}
                    </span>
                  </div>
                  <div className="bg-[#0B0E11] p-2.5 rounded border border-[#2B313A]">
                    <span className="text-gray-500 block text-[10px] uppercase">Entity Type</span>
                    <span className="text-white font-semibold">
                      {addressDetails.address_details?.label ||
                        (addressDetails.address_details?.is_contract
                          ? 'Smart Contract'
                          : addressDetails.address_details?.is_cex
                          ? 'Centralized Exchange'
                          : addressDetails.address_details?.is_dex
                          ? 'DEX Pool'
                          : 'Standard Wallet')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="bg-[#0B0E11] p-2 rounded border border-[#2B313A] flex justify-between">
                    <span className="text-gray-400">Inward Links:</span>
                    <span className="text-white font-bold">
                      {addressDetails.address_details?.inward_relations ?? 0}
                    </span>
                  </div>
                  <div className="bg-[#0B0E11] p-2 rounded border border-[#2B313A] flex justify-between">
                    <span className="text-gray-400">Outward Links:</span>
                    <span className="text-white font-bold">
                      {addressDetails.address_details?.outward_relations ?? 0}
                    </span>
                  </div>
                </div>

                {addressDetails.address_details?.first_activity_date && (
                  <div className="flex items-center gap-1.5 text-gray-400 text-[11px] pt-1">
                    <Clock size={12} />
                    <span>First Activity: {new Date(addressDetails.address_details.first_activity_date).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-xs text-center py-4">
                No indexed metadata found for this address.
              </p>
            )}

            <button
              onClick={() => setInspectAddress(null)}
              className="w-full py-2 bg-[#202630] hover:bg-[#2B313A] text-white rounded-lg text-xs font-semibold transition-colors mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BubblemapsForensics;
