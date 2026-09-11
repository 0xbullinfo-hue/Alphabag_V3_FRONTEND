import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initCache, getFresh, set, readThrough } from '../../src/cache/tieredCache';

describe('Tiered cache and freshness guarantees', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    initCache(null);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('allows in-memory fallback in dev/test', () => {
    expect(() => initCache(null)).not.toThrow();
  });

  it('strictly rejects null Redis client in production mode', () => {
    process.env.NODE_ENV = 'production';
    expect(() => initCache(null)).toThrow(/FATAL: no Redis in production/);
  });

  it('tracks freshness metadata and staleness correctly', async () => {
    await set('price_hot', 'ETH', 3500, 'binance:ws');
    const fresh = await getFresh<number>('price_hot', 'ETH');

    expect(fresh).not.toBeNull();
    expect(fresh?.value).toBe(3500);
    expect(fresh?.source).toBe('binance:ws');
    expect(fresh?.ttlMs).toBe(500);
    expect(fresh?.stale).toBe(false);
  });

  it('readThrough executes loader and returns provenance envelope', async () => {
    const result = await readThrough('price_stable', 'BTC', async () => ({
      value: 65000,
      source: 'coingecko',
    }));

    expect(result.value).toBe(65000);
    expect(result.source).toBe('coingecko');
  });
});
