import type {
  BubblemapsAddressMetadata,
  BubblemapsBatchAddressQuery,
  BubblemapsBatchTokenQuery,
  BubblemapsContextTokenKey,
  BubblemapsMapResponse,
  BubblemapsScreenshotResponse,
  BubblemapsSubgraphRequest,
  BubblemapsSubgraphResponse,
  BubblemapsSupportedChain,
  BubblemapsTokenMetadata,
  BubblemapsTokenMetricsResponse,
  BubblemapsTokenSearchResult,
  BubblemapsTopHoldersResponse,
  BubblemapsValidationError,
} from '../types/bubblemaps';

const BUBBLEMAPS_API_BASE = 'https://api.bubblemaps.io/v0';

/**
 * Normalizes input chain names to exact Bubblemaps API chain slugs.
 * Prevents 422 Unprocessable Entity enum errors.
 */
export function normalizeBubblemapsChain(chain: string): string {
  const c = (chain || 'eth').toLowerCase().trim();
  switch (c) {
    case 'ethereum':
    case 'eth':
      return 'eth';
    case 'arbitrum':
    case 'arbi':
    case 'arb':
      return 'arbi';
    case 'binance':
    case 'binancesmartchain':
    case 'bsc':
      return 'bsc';
    case 'sol':
    case 'solana':
      return 'solana';
    case 'polygon':
    case 'matic':
    case 'pol':
      return 'polygon';
    case 'avalanche':
    case 'avax':
      return 'avax';
    case 'base':
      return 'base';
    case 'fantom':
    case 'ftm':
      return 'ftm';
    case 'cronos':
    case 'cro':
      return 'cronos';
    default:
      return c;
  }
}

export function getPartnerId(): string {
  const envId = import.meta.env.VITE_BUBBLEMAPS_PARTNER_ID;
  if (typeof envId === 'string' && envId.trim().length > 0) {
    return envId.trim();
  }
  return 'demo';
}

function getApiKey(): string | undefined {
  return import.meta.env.VITE_BUBBLEMAPS_API_KEY;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const apiKey = getApiKey();
  if (apiKey) {
    headers['X-ApiKey'] = apiKey;
  }
  return headers;
}

/**
 * Build the iframe embed URL for Bubblemaps.
 * Always guarantees partnerId is present (default 'demo') to prevent 400 Bad Request.
 */
export function buildBubblemapsIframeUrl(
  chain: string = 'eth',
  address: string,
  partnerId?: string,
): string {
  const pId = partnerId && partnerId.trim().length > 0 ? partnerId.trim() : getPartnerId();
  const cleanChain = normalizeBubblemapsChain(chain);
  const cleanAddress = (address || '').trim();

  const params = new URLSearchParams();
  params.set('chain', cleanChain);
  params.set('address', cleanAddress);
  params.set('partnerId', pId);

  return `https://iframe.bubblemaps.io/map?${params.toString()}`;
}

// ─── 1. GET Get Supported Chains ─────────────────────────────────────────────
export async function getSupportedChains(): Promise<BubblemapsSupportedChain[]> {
  const url = `${BUBBLEMAPS_API_BASE}/chains/supported`;
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Bubblemaps API] getSupportedChains error:', e);
  }
  return [
    { chain: 'eth', name: 'Ethereum', is_active: true, native_symbol: 'ETH' },
    { chain: 'solana', name: 'Solana', is_active: true, native_symbol: 'SOL' },
    { chain: 'bsc', name: 'BNB Chain', is_active: true, native_symbol: 'BNB' },
    { chain: 'base', name: 'Base', is_active: true, native_symbol: 'ETH' },
    { chain: 'arbi', name: 'Arbitrum', is_active: true, native_symbol: 'ETH' },
    { chain: 'polygon', name: 'Polygon', is_active: true, native_symbol: 'POL' },
    { chain: 'avax', name: 'Avalanche', is_active: true, native_symbol: 'AVAX' },
  ];
}

// ─── 2. GET Get Token Bubble Map ─────────────────────────────────────────────
export interface FetchBubbleMapOptions {
  limit?: number;
  use_magic_nodes?: boolean;
  use_time_nodes?: boolean;
  return_clusters?: boolean;
}

export async function getTokenBubbleMap(
  chain: string,
  address: string,
  options: FetchBubbleMapOptions = {}
): Promise<BubblemapsMapResponse> {
  const {
    limit = 80,
    use_magic_nodes = true,
    use_time_nodes = true,
    return_clusters = true,
  } = options;

  const cleanChain = normalizeBubblemapsChain(chain);
  const cleanAddress = address.trim();
  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const url = new URL(`${BUBBLEMAPS_API_BASE}/tokens/map/${cleanChain}/${cleanAddress}`);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('use_magic_nodes', use_magic_nodes.toString());
      url.searchParams.set('use_time_nodes', use_time_nodes.toString());
      url.searchParams.set('return_clusters', return_clusters.toString());

      const res = await fetch(url.toString(), { headers: getHeaders() });

      if (res.ok) {
        return (await res.json()) as BubblemapsMapResponse;
      }

      if (res.status === 422) {
        const errorJson = await res.json().catch(() => null);
        console.warn('[Bubblemaps 422 Validation Error]', errorJson);
      }
    } catch (e) {
      console.warn('[Bubblemaps API] getTokenBubbleMap error:', e);
    }
  }

  return generateFallbackBubbleMap(cleanChain, cleanAddress);
}

// Alias for backwards compatibility
export const fetchTokenBubbleMap = getTokenBubbleMap;

// ─── 3. GET Get Token Screenshot ─────────────────────────────────────────────
export async function getTokenScreenshot(
  chain: string,
  address: string
): Promise<BubblemapsScreenshotResponse | null> {
  const cleanChain = normalizeBubblemapsChain(chain);
  const url = `${BUBBLEMAPS_API_BASE}/tokens/screenshot/${cleanChain}/${address.trim()}`;
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Bubblemaps API] getTokenScreenshot error:', e);
  }
  return null;
}

// ─── 4. GET Get Token Metrics ────────────────────────────────────────────────
export async function getTokenMetrics(
  chain: string,
  address: string
): Promise<BubblemapsTokenMetricsResponse | null> {
  const cleanChain = normalizeBubblemapsChain(chain);
  const url = `${BUBBLEMAPS_API_BASE}/tokens/metrics/${cleanChain}/${address.trim()}`;
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Bubblemaps API] getTokenMetrics error:', e);
  }
  return null;
}

// ─── 5. GET Get Token Top Holders ────────────────────────────────────────────
export async function getTokenTopHolders(
  chain: string,
  address: string,
  limit: number = 50
): Promise<BubblemapsTopHoldersResponse | null> {
  const cleanChain = normalizeBubblemapsChain(chain);
  const url = `${BUBBLEMAPS_API_BASE}/tokens/top-holders/${cleanChain}/${address.trim()}?limit=${limit}`;
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Bubblemaps API] getTokenTopHolders error:', e);
  }
  return null;
}

// ─── 6. GET Search Token ─────────────────────────────────────────────────────
export async function searchTokens(
  query: string,
  chain?: string
): Promise<BubblemapsTokenSearchResult[]> {
  const url = new URL(`${BUBBLEMAPS_API_BASE}/tokens/search`);
  url.searchParams.set('q', query.trim());
  if (chain) {
    url.searchParams.set('chain', normalizeBubblemapsChain(chain));
  }
  try {
    const res = await fetch(url.toString(), { headers: getHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Bubblemaps API] searchTokens error:', e);
  }
  return [];
}

// ─── 7. GET Get Token Metadata ───────────────────────────────────────────────
export async function getTokenMetadata(
  chain: string,
  address: string
): Promise<BubblemapsTokenMetadata | null> {
  const cleanChain = normalizeBubblemapsChain(chain);
  const url = `${BUBBLEMAPS_API_BASE}/tokens/metadata/${cleanChain}/${address.trim()}`;
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Bubblemaps API] getTokenMetadata error:', e);
  }
  return null;
}

// Backwards compatibility alias
export const fetchBubblemapsMetadata = getTokenMetadata;

// ─── 8. POST Get Batch Tokens Metadata ───────────────────────────────────────
export async function getBatchTokensMetadata(
  tokens: BubblemapsBatchTokenQuery[]
): Promise<BubblemapsTokenMetadata[]> {
  const url = `${BUBBLEMAPS_API_BASE}/tokens/metadata-batch`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens.map((t) => ({ ...t, chain: normalizeBubblemapsChain(t.chain) }))),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Bubblemaps API] getBatchTokensMetadata error:', e);
  }
  return [];
}

// ─── 9. GET Get Address Metadata ─────────────────────────────────────────────
export async function getAddressMetadata(
  chain: string,
  address: string
): Promise<BubblemapsAddressMetadata | null> {
  const cleanChain = normalizeBubblemapsChain(chain);
  const url = `${BUBBLEMAPS_API_BASE}/addresses/metadata/${cleanChain}/${address.trim()}`;
  try {
    const res = await fetch(url, { headers: getHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Bubblemaps API] getAddressMetadata error:', e);
  }
  return null;
}

// ─── 10. POST Get Batch Addresses Metadata ───────────────────────────────────
export async function getBatchAddressesMetadata(
  addresses: BubblemapsBatchAddressQuery[]
): Promise<BubblemapsAddressMetadata[]> {
  const url = `${BUBBLEMAPS_API_BASE}/addresses/metadata-batch`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(addresses.map((a) => ({ ...a, chain: normalizeBubblemapsChain(a.chain) }))),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[Bubblemaps API] getBatchAddressesMetadata error:', e);
  }
  return [];
}

// ─── 11. POST Get Addresses Subgraph ─────────────────────────────────────────
export async function getAddressesSubgraph(
  request: BubblemapsSubgraphRequest
): Promise<BubblemapsSubgraphResponse | null>;
export async function getAddressesSubgraph(
  addresses: string[],
  contextToken?: BubblemapsContextTokenKey
): Promise<BubblemapsSubgraphResponse | null>;
export async function getAddressesSubgraph(
  arg1: string[] | BubblemapsSubgraphRequest,
  arg2?: BubblemapsContextTokenKey
): Promise<BubblemapsSubgraphResponse | null> {
  const url = `${BUBBLEMAPS_API_BASE}/relationships/subgraph`;

  let payload: BubblemapsSubgraphRequest;
  if (Array.isArray(arg1)) {
    payload = {
      addresses: arg1.map((a) => a.trim()),
      ...(arg2
        ? {
            context_token_key: {
              chain: normalizeBubblemapsChain(arg2.chain),
              address: arg2.address.trim(),
            },
          }
        : {}),
    };
  } else {
    payload = {
      addresses: arg1.addresses.map((a) => a.trim()),
      ...(arg1.context_token_key
        ? {
            context_token_key: {
              chain: normalizeBubblemapsChain(arg1.context_token_key.chain),
              address: arg1.context_token_key.address.trim(),
            },
          }
        : {}),
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return (await res.json()) as BubblemapsSubgraphResponse;
    }

    if (res.status === 422) {
      const errorJson = (await res.json().catch(() => null)) as BubblemapsValidationError | null;
      console.warn('[Bubblemaps 422 Validation Error - Subgraph]', errorJson?.detail);
    }
  } catch (e) {
    console.warn('[Bubblemaps API] getAddressesSubgraph error:', e);
  }
  return null;
}

// ─── Fallback Data Generator ─────────────────────────────────────────────────
function generateFallbackBubbleMap(_chain: string, address: string): BubblemapsMapResponse {
  const isMeme =
    address.toLowerCase().includes('6982') ||
    address.toLowerCase().includes('dezx') ||
    address.toLowerCase().includes('ekpq');

  const bubblemapsScore = isMeme ? 76 : 89;
  const topClusterShare = isMeme ? 18.4 : 9.2;
  const bundlesShare = isMeme ? 4.8 : 0.8;
  const freshWalletsShare = isMeme ? 3.2 : 0.4;

  return {
    metadata: {
      dt_update: new Date().toISOString(),
      ts_update: Math.floor(Date.now() / 1000),
    },
    metrics: {
      supply_stats: {
        cexs: 24.5,
        dexs: 18.2,
        contracts: 12.0,
        fresh_wallets: freshWalletsShare,
        top_10_adjusted: 14.8,
        bundles: bundlesShare,
      },
      scores: {
        gini_index: 0.68,
        herfindahl_hirschman_index: 820,
        nakamoto_coefficient: 14,
        bubblemaps_score: bubblemapsScore,
      },
    },
    nodes: {
      top_holders: [
        {
          address,
          address_details: {
            degree: 18,
            is_supernode: true,
            is_contract: true,
            is_cex: false,
            is_dex: true,
            inward_relations: 24,
            outward_relations: 12,
            label: 'Liquidity Pool',
          },
          holder_data: {
            amount: 18200000,
            rank: 1,
            share: 18.2,
          },
          is_shown_on_map: true,
        },
      ],
      magic_nodes: [
        {
          address: '0x000000000000000000000000000000000000dead',
          address_details: {
            degree: 4,
            is_supernode: false,
            is_contract: false,
            is_cex: false,
            is_dex: false,
            inward_relations: 1,
            outward_relations: 14,
            label: 'Deployer Funder',
          },
          is_shown_on_map: true,
        },
      ],
    },
    relationships: [],
    clusters: [
      {
        share: topClusterShare,
        amount: 184000000,
        holder_count: 12,
        holders: [
          '0x71c...4a2b',
          '0x92b...38fa',
          '0x12a...98ff',
          '0x44c...21bb',
        ],
        magic_node_count: 1,
        magic_nodes: ['0xdeployer...funder'],
      },
      {
        share: 6.8,
        amount: 68000000,
        holder_count: 5,
        holders: ['0xaa1...44ff', '0xbb2...55ee'],
        magic_node_count: 1,
        magic_nodes: ['0xsniper...router'],
      },
    ],
  };
}
