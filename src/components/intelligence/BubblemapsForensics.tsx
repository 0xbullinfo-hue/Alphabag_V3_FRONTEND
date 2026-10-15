import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import type { BubblemapsMapResponse } from '../../types/bubblemaps';

interface BubblemapsForensicsProps {
  data: BubblemapsMapResponse | null;
  loading?: boolean;
}

export const BubblemapsForensics: React.FC<BubblemapsForensicsProps> = ({ data, loading }) => {
  const [showClusters, setShowClusters] = useState(false);

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
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 font-medium">Supply Allocation Telemetry</span>
          <div className="flex items-center gap-3 text-[11px] font-mono">
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
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              {clusters.map((c, idx) => (
                <div
                  key={idx}
                  className="bg-[#0B0E11] border border-[#2B313A] rounded-lg p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-sans">Cluster #{idx + 1}</span>
                    <span className="text-alphabag-yellow font-bold">{c.share.toFixed(1)}% of supply</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span>{c.holder_count} wallets</span>
                    <span>•</span>
                    <span>{c.magic_node_count} funding magic nodes</span>
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    Funding source: {c.magic_nodes?.[0] || 'Direct cluster transfer'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default BubblemapsForensics;
