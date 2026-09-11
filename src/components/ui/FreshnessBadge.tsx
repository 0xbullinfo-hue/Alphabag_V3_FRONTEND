import { useEffect, useState } from 'react';

export interface Provenance {
  fetchedAt: string;
  ageMs: number;
  ttlMs: number;
  stale: boolean;
  source: string;
  blockNumber?: number;
}

function humanAge(ms: number): string {
  if (ms < 1000) return 'just now';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  return `${Math.round(ms / 3_600_000)}h ago`;
}

/**
 * Renders data provenance. In a trading product, users MUST be able to see
 * how old a number is. Never hide this.
 */
export function FreshnessBadge({ p, className = '' }: { p?: Provenance; className?: string }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 1000); return () => clearInterval(t); }, []);
  if (!p) return null;

  const age = Date.now() - new Date(p.fetchedAt).getTime();
  const isStale = p.stale || age > p.ttlMs;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] ${isStale ? 'text-amber-400' : 'text-neutral-500'} ${className}`}
      title={`Source: ${p.source}${p.blockNumber ? ` · block ${p.blockNumber}` : ''}\nFetched: ${p.fetchedAt}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isStale ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} aria-hidden />
      <span>{isStale ? `Stale · ${humanAge(age)}` : `Live · ${humanAge(age)}`}</span>
    </span>
  );
}