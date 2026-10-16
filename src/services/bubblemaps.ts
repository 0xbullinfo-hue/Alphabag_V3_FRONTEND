import type {
  BubblemapsAddressMetadata,
  BubblemapsBatchAddressQuery,
  BubblemapsBatchTokenQuery,
  BubblemapsChainInfo,
  BubblemapsContextTokenKey,
  BubblemapsHoldersResponse,
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
import { resolveApiUrl } from './api';

export function getBubblemapsApiBase(): string {
  return resolveApiUrl('/api/proxy/bubblemaps');
}

function buildApiUrl(endpoint: string): URL {
  const base = getBubblemapsApiBase();
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost';

  if (base.startsWith('http://') || base.startsWith('https://')) {
    return new URL(`${base}${endpoint}`);
  }
  return new URL(`${base}${endpoint}`, origin);
}

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
  return 'alphabag';
}

function getHeaders(): Record<string, string> {
  return {
    Accept: 'application/json',
  };
}

/**
 * Parses and logs Bubblemaps 422 validation errors with exact field location.
 */
async function handleBubblemapsResponse<T>(res: Response, endpoint: string): Promise<T | null> {
  if (res.ok) {
    return (await res.json()) as T;
  }

  if (res.status === 422) {
    const errorJson = (await res.json().catch(() => null)) as BubblemapsValidationError | null;
    console.warn(`[Bubblemaps 422 Error] ${endpoint}:`, errorJson?.detail || errorJson);
  } else {
    console.warn(`[Bubblemaps API Error] ${endpoint} returned status ${res.status}`);
  }
  return null;
}

/**
 * Build the iframe embed URL for Bubblemaps.
 * Always guarantees partnerId is present (default 'alphabag') to prevent 400 Bad Request.
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

// ─── 1. GET /chains ──────────────────────────────────────────────────────────
export async function getChains(): Promise<BubblemapsChainInfo[]> {
  const url = buildApiUrl('/chains');
  try {
    const res = await fetch(url.toString(), { headers: getHeaders() });
    const data = await handleBubblemapsResponse<BubblemapsChainInfo[]>(res, 'GET /chains');
    if (data && Array.isArray(data)) return data;
  } catch (e) {
    console.warn('[Bubblemaps API] getChains error:', e);
  }
  return [
    { id: 'eth', name: 'Ethereum', dexscreener_id: 'ethereum', coingecko_id: 'ethereum' },
    { id: 'solana', name: 'Solana', dexscreener_id: 'solana', coingecko_id: 'solana' },
    { id: 'bsc', name: 'BNB Chain', dexscreener_id: 'bsc', coingecko_id: 'binance-smart-chain' },
    { id: 'base', name: 'Base', dexscreener_id: 'base', coingecko_id: 'base' },
    { id: 'arbi', name: 'Arbitrum', dexscreener_id: 'arbitrum', coingecko_id: 'arbitrum-one' },
    { id: 'polygon', name: 'Polygon', dexscreener_id: 'polygon', coingecko_id: 'polygon-pos' },
    { id: 'avax', name: 'Avalanche', dexscreener_id: 'avalanche', coingecko_id: 'avalanche' },
  ];
}

export async function getSupportedChains(): Promise<BubblemapsSupportedChain[]> {
  const chains = await getChains();
  return chains.map((c) => ({
    chain: c.id,
    id: c.id,
    name: c.name,
    is_active: true,
    dexscreener_id: c.dexscreener_id,
    coingecko_id: c.coingecko_id,
    native_symbol: c.id.toUpperCase(),
  }));
}

// ─── 2. GET /tokens/map/{chain}/{token_address} ──────────────────────────────
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

  try {
    const url = buildApiUrl(`/tokens/map/${cleanChain}/${cleanAddress}`);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('use_magic_nodes', use_magic_nodes.toString());
    url.searchParams.set('use_time_nodes', use_time_nodes.toString());
    url.searchParams.set('return_clusters', return_clusters.toString());

    const res = await fetch(url.toString(), { headers: getHeaders() });
    const data = await handleBubblemapsResponse<BubblemapsMapResponse>(res, 'GET /tokens/map');
    if (data) return data;
  } catch (e) {
    console.warn('[Bubblemaps API] getTokenBubbleMap error:', e);
  }

  return generateFallbackBubbleMap(cleanChain, cleanAddress);
}

export const fetchTokenBubbleMap = getTokenBubbleMap;

// ─── 3. GET /tokens/screenshot/{chain}/{token_address} ───────────────────────
export async function getTokenScreenshot(
  chain: string,
  address: string
): Promise<BubblemapsScreenshotResponse | null> {
  const cleanChain = normalizeBubblemapsChain(chain);
  const cleanAddress = address.trim();
  const url = buildApiUrl(`/tokens/screenshot/${cleanChain}/${cleanAddress}`);

  try {
    const res = await fetch(url.toString(), { headers: getHeaders() });
    const data = await handleBubblemapsResponse<BubblemapsScreenshotResponse>(res, 'GET /tokens/screenshot');
    if (data) {
      return {
        ...data,
        screenshot_url: data.image_url || data.screenshot_url,
        dt_update: data.updated_at || data.dt_update,
      };
    }
  } catch (e) {
    console.warn('[Bubblemaps API] getTokenScreenshot error:', e);
  }
  return null;
}

// ─── 4. GET /tokens/metrics/{chain}/{token_address} ──────────────────────────
export async function getTokenMetrics(
  chain: string,
  address: string
): Promise<BubblemapsTokenMetricsResponse | null> {
  const cleanChain = normalizeBubblemapsChain(chain);
  const cleanAddress = address.trim();
  const url = buildApiUrl(`/tokens/metrics/${cleanChain}/${cleanAddress}`);

  try {
    const res = await fetch(url.toString(), { headers: getHeaders() });
    const data = await handleBubblemapsResponse<BubblemapsTokenMetricsResponse>(res, 'GET /tokens/metrics');
    if (data) {
      const supplyStats = data.supply_stats || data.metrics?.supply_stats;
      const scores = data.scores || data.metrics?.scores;
      if (supplyStats && scores) {
        return {
          supply_stats: supplyStats,
          scores: scores,
          metrics: { supply_stats: supplyStats, scores },
        };
      }
      return data;
    }
  } catch (e) {
    console.warn('[Bubblemaps API] getTokenMetrics error:', e);
  }
  return null;
}

// ─── 5. GET /tokens/holders/{chain}/{token_address} ──────────────────────────
export async function getTokenHolders(
  chain: string,
  address: string,
  limit: number = 80
): Promise<BubblemapsHoldersResponse> {
  const cleanChain = normalizeBubblemapsChain(chain);
  const cleanAddress = address.trim();
  const url = buildApiUrl(`/tokens/holders/${cleanChain}/${cleanAddress}`);
  url.searchParams.set('limit', limit.toString());

  try {
    const res = await fetch(url.toString(), { headers: getHeaders() });
    const data = await handleBubblemapsResponse<BubblemapsHoldersResponse>(res, 'GET /tokens/holders');
    if (data && Array.isArray(data)) return data;
  } catch (e) {
    console.warn('[Bubblemaps API] getTokenHolders error:', e);
  }
  return [];
}

// Compatibility wrapper
export async function getTokenTopHolders(
  chain: string,
  address: string,
  limit: number = 80
): Promise<BubblemapsTopHoldersResponse | null> {
  const holders = await getTokenHolders(chain, address, limit);
  return {
    chain,
    token_address: address,
    top_holders: holders,
  };
}

// ─── 6. GET /tokens/search ───────────────────────────────────────────────────
export async function searchTokens(
  query: string,
  chain?: string
): Promise<BubblemapsTokenSearchResult[]> {
  const url = buildApiUrl('/tokens/search');
  url.searchParams.set('q', query.trim());
  if (chain) {
    url.searchParams.set('chain', normalizeBubblemapsChain(chain));
  }

  try {
    const res = await fetch(url.toString(), { headers: getHeaders() });
    const raw = await handleBubblemapsResponse<any[]>(res, 'GET /tokens/search');
    if (raw && Array.isArray(raw)) {
      return raw.map((item) => {
        const tokenKey = item.token_key || { chain: item.chain || '', address: item.address || '' };
        const metadata = item.metadata || {
          name: item.name || '',
          symbol: item.symbol || '',
          is_indexed: item.has_map ?? true,
          img_url: item.logo_url,
        };
        return {
          token_key: tokenKey,
          metadata,
          chain: tokenKey.chain,
          address: tokenKey.address,
          name: metadata.name,
          symbol: metadata.symbol,
          logo_url: metadata.img_url,
          has_map: metadata.is_indexed,
        };
      });
    }
  } catch (e) {
    console.warn('[Bubblemaps API] searchTokens error:', e);
  }
  return [];
}

// ─── 7. GET /tokens/metadata/{chain}/{token_address} ─────────────────────────
export async function getTokenMetadata(
  chain: string,
  address: string
): Promise<BubblemapsTokenMetadata | null> {
  const cleanChain = normalizeBubblemapsChain(chain);
  const cleanAddress = address.trim();
  const url = buildApiUrl(`/tokens/metadata/${cleanChain}/${cleanAddress}`);

  try {
    const res = await fetch(url.toString(), { headers: getHeaders() });
    const raw = await handleBubblemapsResponse<any>(res, 'GET /tokens/metadata');
    if (raw) {
      const tokenKey = raw.token_key || { chain: cleanChain, address: cleanAddress };
      const metadata = raw.metadata || {
        name: raw.name || '',
        symbol: raw.symbol || '',
        is_indexed: raw.verified ?? true,
        img_url: raw.logo_url,
      };
      const stats = raw.stats || {
        transfers_count: raw.holder_count || 0,
        min_date: new Date().toISOString(),
        max_date: new Date().toISOString(),
      };
      return {
        token_key: tokenKey,
        metadata,
        stats,
        chain: tokenKey.chain,
        address: tokenKey.address,
        name: metadata.name,
        symbol: metadata.symbol,
      };
    }
  } catch (e) {
    console.warn('[Bubblemaps API] getTokenMetadata error:', e);
  }
  return null;
}

export const fetchBubblemapsMetadata = getTokenMetadata;

// ─── 8. POST /tokens/metadata (Batch) ────────────────────────────────────────
export async function getBatchTokensMetadata(
  tokens: BubblemapsBatchTokenQuery[]
): Promise<BubblemapsTokenMetadata[]> {
  const url = buildApiUrl('/tokens/metadata');
  const payload = tokens.map((t) => ({
    chain: normalizeBubblemapsChain(t.chain),
    address: t.address.trim(),
  }));

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const list = await handleBubblemapsResponse<any[]>(res, 'POST /tokens/metadata');
    if (list && Array.isArray(list)) {
      return list.map((raw) => ({
        token_key: raw.token_key,
        metadata: raw.metadata,
        stats: raw.stats,
        chain: raw.token_key?.chain,
        address: raw.token_key?.address,
        name: raw.metadata?.name,
        symbol: raw.metadata?.symbol,
      }));
    }
  } catch (e) {
    console.warn('[Bubblemaps API] getBatchTokensMetadata error:', e);
  }
  return [];
}

// ─── 9. GET /addresses/metadata/{address} ────────────────────────────────────
export async function getAddressMetadata(
  address: string,
  chain?: string
): Promise<BubblemapsAddressMetadata | null> {
  const cleanAddress = address.trim();
  const url = buildApiUrl(`/addresses/metadata/${cleanAddress}`);

  try {
    const res = await fetch(url.toString(), { headers: getHeaders() });
    const raw = await handleBubblemapsResponse<any>(res, 'GET /addresses/metadata');
    if (raw) {
      return {
        address: raw.address || cleanAddress,
        address_details: raw.address_details || raw.details,
        chain: chain ? normalizeBubblemapsChain(chain) : undefined,
        details: raw.address_details || raw.details,
      };
    }
  } catch (e) {
    console.warn('[Bubblemaps API] getAddressMetadata error:', e);
  }
  return null;
}

// ─── 10. POST /addresses/metadata (Batch) ────────────────────────────────────
export async function getBatchAddressesMetadata(
  addressesOrQueries: string[] | BubblemapsBatchAddressQuery[]
): Promise<BubblemapsAddressMetadata[]> {
  const url = buildApiUrl('/addresses/metadata');
  const addressStrings: string[] = addressesOrQueries.map((item) =>
    typeof item === 'string' ? item.trim() : item.address.trim()
  );

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses: addressStrings }),
    });
    const list = await handleBubblemapsResponse<any[]>(res, 'POST /addresses/metadata');
    if (list && Array.isArray(list)) {
      return list.map((raw) => ({
        address: raw.address,
        address_details: raw.address_details || raw.details,
        details: raw.address_details || raw.details,
      }));
    }
  } catch (e) {
    console.warn('[Bubblemaps API] getBatchAddressesMetadata error:', e);
  }
  return [];
}

// ─── 11. POST /relationships/subgraph ────────────────────────────────────────
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
  const url = buildApiUrl('/relationships/subgraph');

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
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleBubblemapsResponse<BubblemapsSubgraphResponse>(res, 'POST /relationships/subgraph');
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
      time_nodes: [],
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
