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
  if (value === null) return <span className="text-alphabag-subtext text-2xl font-bold">—</span>;
  const color = value > 0.2 ? 'text-alphabag-green' : value < -0.2 ? 'text-alphabag-red' : 'text-alphabag-yellow';
  const label = value > 0.4 ? 'Very Bullish' : value > 0.2 ? 'Bullish' : value > -0.2 ? 'Neutral' : value > -0.4 ? 'Bearish' : 'Very Bearish';
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-3xl font-black ${color}`}>{value > 0 ? '+' : ''}{value.toFixed(2)}</span>
      <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{label}</span>
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
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-alphabag-yellow" />
          <h2 className="text-base font-semibold text-alphabag-text">Social Intelligence</h2>
          <span className="text-xs text-alphabag-subtext bg-alphabag-gray px-2 py-0.5 rounded-full capitalize">{assetSlug}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex bg-alphabag-dark border border-alphabag-gray rounded-lg overflow-hidden">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                  range === r.value
                    ? 'bg-alphabag-yellow text-alphabag-black font-bold'
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
            className="p-1.5 rounded-lg border border-alphabag-gray text-alphabag-subtext hover:text-alphabag-yellow transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error / not configured */}
      {isError && (
        <div className="rounded-xl border border-alphabag-yellow/20 bg-alphabag-yellow/5 p-6 text-center">
          <Activity size={32} className="text-alphabag-yellow/50 mx-auto mb-3" />
          <p className="text-alphabag-text font-semibold mb-1">Social data unavailable</p>
          <p className="text-alphabag-subtext text-xs max-w-sm mx-auto">
            Configure <code className="text-alphabag-yellow">SANTIMENT_API_KEY</code> in your backend environment
            to enable real-time social volume, sentiment, and trending word data.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-alphabag-gray/20 animate-pulse" />
          ))}
          <div className="md:col-span-3 h-48 rounded-xl bg-alphabag-gray/20 animate-pulse" />
        </div>
      )}

      {/* Data */}
      {data && !isLoading && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sentiment Balance */}
            <div className="rounded-xl border border-alphabag-gray bg-alphabag-darkgray p-4 flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-[10px] uppercase tracking-widest text-alphabag-subtext font-semibold">Sentiment Balance</p>
              <SentimentGauge value={data.sentimentBalance} />
              <p className="text-[10px] text-alphabag-subtext">Net positive/negative discussion</p>
            </div>

            {/* Trending Words */}
            <div className="md:col-span-2 rounded-xl border border-alphabag-gray bg-alphabag-darkgray p-4">
              <p className="text-[10px] uppercase tracking-widest text-alphabag-subtext font-semibold mb-3 flex items-center gap-1.5">
                <TrendingUp size={11} /> Trending Words ({range})
              </p>
              {data.trendingWords.length === 0 ? (
                <p className="text-sm text-alphabag-subtext">No trending words in this period.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.trendingWords.map((w, i) => (
                    <span
                      key={w.word}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                        i === 0
                          ? 'border-alphabag-yellow/50 bg-alphabag-yellow/10 text-alphabag-yellow'
                          : 'border-alphabag-gray bg-alphabag-gray/40 text-alphabag-text'
                      }`}
                    >
                      {w.word}
                      <span className="ml-1.5 opacity-60">{w.score.toFixed(1)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Social Volume Chart */}
          {chartData.length > 0 && (
            <div className="rounded-xl border border-alphabag-gray bg-alphabag-darkgray p-4">
              <p className="text-[10px] uppercase tracking-widest text-alphabag-subtext font-semibold mb-4 flex items-center gap-1.5">
                <Activity size={11} /> Social Volume ({range})
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="santimentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FCD535" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FCD535" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#848E9C' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#848E9C' }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: '#1E2329', border: '1px solid #2B3139', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#F0F0F0' }}
                    itemStyle={{ color: '#FCD535' }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#FCD535" strokeWidth={1.5} fill="url(#santimentGrad)" dot={false} />
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
