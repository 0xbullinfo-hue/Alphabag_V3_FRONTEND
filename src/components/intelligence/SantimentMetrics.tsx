import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCw, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchSocialMetrics, getSantimentDateRange } from '../../services/santiment';
import type { SantimentRange } from '../../types/intelligence';
import { ONE_MINUTE } from '../../services/config';

interface SantimentMetricsProps {
  assetSlug: string;
}

const RANGES: { label: string; value: SantimentRange }[] = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
];

function SentimentGauge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-alphabag-subtext text-2xl font-bold num">—</span>;
  const color = value > 0.2 ? 'text-alphabag-green' : value < -0.2 ? 'text-alphabag-red' : 'text-alphabag-yellow';
  const label = value > 0.4 ? 'Strong Bullish' : value > 0.2 ? 'Bullish' : value > -0.2 ? 'Neutral' : value > -0.4 ? 'Bearish' : 'Strong Bearish';
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-2xl font-bold num ${color}`}>{value > 0 ? '+' : ''}{value.toFixed(2)}</span>
      <span className={`text-[11px] font-semibold uppercase tracking-wider ${color}`}>{label}</span>
    </div>
  );
}

export function SantimentMetrics({ assetSlug }: SantimentMetricsProps) {
  const [range, setRange] = useState<SantimentRange>('24h');
  const { from, to } = getSantimentDateRange(range);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['santiment', 'social-metrics', assetSlug, range],
    queryFn: () => fetchSocialMetrics(assetSlug, from, to),
    staleTime: 5 * ONE_MINUTE,
    retry: 1,
  });

  const chartData = (data?.socialVolume ?? []).map((p) => ({
    time: new Date(p.datetime).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    volume: Math.round(p.value),
  }));

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-alphabag-yellow" />
          <h2 className="text-sm font-semibold text-alphabag-text">Social Intelligence & Metrics</h2>
          <span className="text-[11px] text-alphabag-subtext bg-[#202630] border border-[#2B313A] px-2 py-0.5 rounded-[2px] uppercase">{assetSlug}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex bg-[#0B0E11] border border-[#2B313A] rounded p-0.5 gap-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  range === r.value
                    ? 'bg-[#202630] text-alphabag-text font-semibold'
                    : 'text-alphabag-subtext hover:text-alphabag-text'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded border border-[#2B313A] bg-[#202630] text-alphabag-subtext hover:text-alphabag-text transition-colors disabled:opacity-50"
            title="Refresh Social Data"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error / not configured */}
      {isError && (
        <div className="rounded-[6px] border border-alphabag-yellow/20 bg-alphabag-yellow/5 p-5 text-center">
          <Activity size={24} className="text-alphabag-yellow/60 mx-auto mb-2" />
          <p className="text-alphabag-text text-xs font-semibold mb-1">Social Telemetry Offline</p>
          <p className="text-alphabag-subtext text-xs max-w-sm mx-auto leading-relaxed">
            Configure <code className="text-alphabag-yellow">SANTIMENT_API_KEY</code> in environment to activate live social volume, net sentiment, and trending keywords.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-[6px] bg-[#181A20] border border-[#2B313A] animate-pulse" />
          ))}
          <div className="md:col-span-3 h-48 rounded-[6px] bg-[#181A20] border border-[#2B313A] animate-pulse" />
        </div>
      )}

      {/* Data */}
      {data && !isLoading && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Sentiment Balance */}
            <div className="rounded-[6px] border border-[#2B313A] bg-[#181A20] p-4 flex flex-col items-center justify-center gap-1.5 text-center">
              <p className="text-[11px] uppercase tracking-wider text-alphabag-subtext font-semibold">Net Sentiment Balance</p>
              <SentimentGauge value={data.sentimentBalance} />
              <p className="text-[11px] text-alphabag-subtext">Calculated positive vs. negative mentions</p>
            </div>

            {/* Trending Words */}
            <div className="md:col-span-2 rounded-[6px] border border-[#2B313A] bg-[#181A20] p-4">
              <p className="text-[11px] uppercase tracking-wider text-alphabag-subtext font-semibold mb-3 flex items-center gap-1.5">
                <TrendingUp size={12} /> Emerging Social Keywords ({range})
              </p>
              {data.trendingWords.length === 0 ? (
                <p className="text-xs text-alphabag-subtext">No emerging social signals detected in this window.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.trendingWords.map((w, i) => (
                    <span
                      key={w.word}
                      className={`px-2.5 py-1 rounded-[3px] text-xs font-medium border transition-colors ${
                        i === 0
                          ? 'border-alphabag-yellow/40 bg-alphabag-yellow/10 text-alphabag-yellow'
                          : 'border-[#2B313A] bg-[#202630] text-alphabag-text'
                      }`}
                    >
                      {w.word}
                      <span className="ml-1.5 text-[11px] text-alphabag-subtext num">{w.score.toFixed(1)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Social Volume Chart */}
          {chartData.length > 0 && (
            <div className="rounded-[6px] border border-[#2B313A] bg-[#181A20] p-4">
              <p className="text-[11px] uppercase tracking-wider text-alphabag-subtext font-semibold mb-3 flex items-center gap-1.5">
                <Activity size={12} /> Social Mention Frequency ({range})
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="santimentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F0B90B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2B313A" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#848E9C' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#848E9C' }} tickLine={false} axisLine={false} width={36} />
                  <Tooltip
                    contentStyle={{ background: '#181A20', border: '1px solid #2B313A', borderRadius: '4px', fontSize: '11px' }}
                    labelStyle={{ color: '#EAECEF' }}
                    itemStyle={{ color: '#F0B90B' }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#F0B90B" strokeWidth={1.5} fill="url(#santimentGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SantimentMetrics;
