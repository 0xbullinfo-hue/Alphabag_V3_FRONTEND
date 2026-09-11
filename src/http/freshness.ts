/**
 * Every price/balance/position response MUST carry provenance.
 * The frontend renders <FreshnessBadge/> from these fields.
 */
import type { Response } from 'express';
import type { Fresh } from '../cache/tieredCache';

export interface Provenance {
  fetchedAt: string;   // ISO
  ageMs: number;
  ttlMs: number;
  stale: boolean;
  source: string;
  blockNumber?: number;
}

export function provenanceOf<T>(f: Fresh<T>): Provenance {
  return {
    fetchedAt: new Date(f.fetchedAt).toISOString(),
    ageMs: f.ageMs,
    ttlMs: f.ttlMs,
    stale: f.stale,
    source: f.source,
    blockNumber: f.blockNumber,
  };
}

/** Sets standard headers so caching layers and clients agree on freshness. */
export function applyFreshnessHeaders<T>(res: Response, f: Fresh<T>) {
  res.setHeader('X-Data-Fetched-At', new Date(f.fetchedAt).toISOString());
  res.setHeader('X-Data-Age-Ms', String(f.ageMs));
  res.setHeader('X-Data-Source', f.source);
  res.setHeader('X-Data-Stale', String(f.stale));
  if (f.blockNumber != null) res.setHeader('X-Data-Block', String(f.blockNumber));

  // Stale data must not be cached by intermediaries.
  res.setHeader(
    'Cache-Control',
    f.stale ? 'no-store' : `private, max-age=${Math.max(0, Math.floor((f.ttlMs - f.ageMs) / 1000))}`,
  );
}

/** Guard for endpoints where stale data is unacceptable (order preview, PnL). */
export function requireFresh<T>(f: Fresh<T>, maxAgeMs: number): void {
  if (f.ageMs > maxAgeMs) {
    const e = new Error('DATA_TOO_STALE') as Error & { code: string; ageMs: number };
    e.code = 'DATA_TOO_STALE';
    e.ageMs = f.ageMs;
    throw e;
  }
}
