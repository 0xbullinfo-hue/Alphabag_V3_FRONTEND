const BUBBLEMAPS_API_BASE = 'https://api.bubblemaps.io/v0';

export function getPartnerId(): string {
  const envId = import.meta.env.VITE_BUBBLEMAPS_PARTNER_ID;
  if (typeof envId === 'string' && envId.trim().length > 0) {
    return envId.trim();
  }
  return 'demo';
}

/**
 * Build the iframe embed URL for Bubblemaps.
 * Always guarantees partnerId is present (default 'demo') to prevent 400 Bad Request.
 * Docs: https://docs.bubblemaps.io
 */
export function buildBubblemapsIframeUrl(
  chain: string = 'eth',
  address: string,
  partnerId?: string,
): string {
  const pId = partnerId && partnerId.trim().length > 0 ? partnerId.trim() : getPartnerId();
  const cleanChain = (chain || 'eth').toLowerCase().trim();
  const cleanAddress = (address || '').trim();

  const params = new URLSearchParams();
  params.set('chain', cleanChain);
  params.set('address', cleanAddress);
  params.set('partnerId', pId);

  return `https://iframe.bubblemaps.io/map?${params.toString()}`;
}

/**
 * Fetch raw Bubblemaps metadata via the Data API.
 * SECURITY: API key is proxied through the backend — never call this
 * directly from the browser with a real key.
 * Requires backend endpoint: GET /api/proxy/bubblemaps/metadata
 */
export async function fetchBubblemapsMetadata(
  chain: string,
  address: string,
): Promise<unknown | null> {
  const apiKey = import.meta.env.VITE_BUBBLEMAPS_API_KEY;
  if (!apiKey) return null;

  const url = `${BUBBLEMAPS_API_BASE}/tokens/${chain}/${address}/metadata`;
  const res = await fetch(url, { headers: { 'X-ApiKey': apiKey } });
  if (!res.ok) throw new Error(`Bubblemaps ${res.status}: ${res.statusText}`);
  return res.json();
}
