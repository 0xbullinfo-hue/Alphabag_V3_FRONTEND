/**
 * Shared, tiered cache with explicit freshness metadata.
 * Backed by Redis when REDIS_URL is set; falls back to an in-process Map
 * ONLY in development (never in production — see assert).
 */
declare const process: any;

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<unknown>;
}

export type Redis = RedisClient;

export type Tier = 'price_hot' | 'price_stable' | 'balance' | 'position' | 'metadata';

const TTL_MS: Record<Tier, number> = {
  price_hot:    500,      // top-50 assets, actively traded
  price_stable: 2_000,    // everything else
  balance:      6_000,
  position:     15_000,   // DeFi decodes are expensive
  metadata:     86_400_000,
};

export interface Envelope<T> {
  value: T;
  fetchedAt: number;   // epoch ms
  source: string;      // 'binance:ws' | 'coingecko' | 'rpc:alchemy' | ...
  blockNumber?: number;
}

export interface Fresh<T> extends Envelope<T> {
  ageMs: number;
  ttlMs: number;
  stale: boolean;      // ageMs > ttlMs
}

let redis: Redis | null = null;
const mem = new Map<string, Envelope<unknown>>();

export function initCache(client: Redis | null) {
  redis = client;
  if (!redis && typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: no Redis in production. A per-process cache produces ' +
      'inconsistent prices across instances. Set REDIS_URL.'
    );
  }
}

const key = (tier: Tier, id: string) => `ab:${tier}:${id}`;

export async function getFresh<T>(tier: Tier, id: string): Promise<Fresh<T> | null> {
  const raw = redis
    ? await redis.get(key(tier, id))
    : (mem.get(key(tier, id)) ? JSON.stringify(mem.get(key(tier, id))) : null);
  if (!raw) return null;

  const env = JSON.parse(raw) as Envelope<T>;
  const ageMs = Date.now() - env.fetchedAt;
  const ttlMs = TTL_MS[tier];
  return { ...env, ageMs, ttlMs, stale: ageMs > ttlMs };
}

export async function set<T>(
  tier: Tier,
  id: string,
  value: T,
  source: string,
  blockNumber?: number,
): Promise<Envelope<T>> {
  const env: Envelope<T> = { value, fetchedAt: Date.now(), source, blockNumber };
  const payload = JSON.stringify(env);
  const ttlSec = Math.ceil(TTL_MS[tier] / 1000) * 4; // keep 4x TTL so we can serve stale + warn

  if (redis) await redis.set(key(tier, id), payload, 'EX', ttlSec);
  else mem.set(key(tier, id), env);

  return env;
}

/** Read-through helper: never lets a stale value silently masquerade as fresh. */
export async function readThrough<T>(
  tier: Tier,
  id: string,
  loader: () => Promise<{ value: T; source: string; blockNumber?: number }>,
): Promise<Fresh<T>> {
  const hit = await getFresh<T>(tier, id);
  if (hit && !hit.stale) return hit;

  try {
    const { value, source, blockNumber } = await loader();
    const env = await set(tier, id, value, source, blockNumber);
    return { ...env, ageMs: 0, ttlMs: TTL_MS[tier], stale: false };
  } catch (err) {
    if (hit) return hit;           // serve stale, flagged
    throw err;
  }
}
