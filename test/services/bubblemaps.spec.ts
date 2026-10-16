import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeBubblemapsChain,
  buildBubblemapsIframeUrl,
  getChains,
  getTokenBubbleMap,
} from '../../src/services/bubblemaps';

describe('Bubblemaps Service (Behind Backend Proxy)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes chain names to supported slugs', () => {
    expect(normalizeBubblemapsChain('ethereum')).toBe('eth');
    expect(normalizeBubblemapsChain('arbitrum')).toBe('arbi');
    expect(normalizeBubblemapsChain('binance')).toBe('bsc');
    expect(normalizeBubblemapsChain('sol')).toBe('solana');
    expect(normalizeBubblemapsChain('polygon')).toBe('polygon');
    expect(normalizeBubblemapsChain('base')).toBe('base');
  });

  it('builds iframe embed URL with partner ID and clean parameters', () => {
    const url = buildBubblemapsIframeUrl('ethereum', '0x1234567890123456789012345678901234567890');
    expect(url).toContain('https://iframe.bubblemaps.io/map?');
    expect(url).toContain('chain=eth');
    expect(url).toContain('address=0x1234567890123456789012345678901234567890');
    expect(url).toContain('partnerId=');
  });

  it('queries backend proxy without client-exposed API keys', async () => {
    let requestedUrl = '';
    let requestedHeaders: HeadersInit | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      requestedUrl = String(input);
      requestedHeaders = init?.headers;
      return {
        ok: true,
        status: 200,
        json: async () => [{ id: 'eth', name: 'Ethereum' }],
      } as Response;
    });

    const chains = await getChains();
    expect(chains).toHaveLength(1);
    expect(requestedUrl).toContain('/api/proxy/bubblemaps/chains');
    // Verify no X-ApiKey was sent from the client
    expect((requestedHeaders as Record<string, string>)?.[`X-ApiKey`]).toBeUndefined();
  });

  it('falls back to mock bubble map data when proxy request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const map = await getTokenBubbleMap('eth', '0x1234567890123456789012345678901234567890');
    expect(map).toBeDefined();
    expect(map.nodes.top_holders).toBeDefined();
    expect(map.metrics.scores.bubblemaps_score).toBeGreaterThan(0);
  });
});
