const BUBBLEMAPS_API_BASE = 'https://api.bubblemaps.io/v0';

function getPartnerId(): string {
  return import.meta.env.VITE_BUBBLEMAPS_PARTNER_ID ?? 'demo';
}

/**
 * Build the iframe embed URL for Bubblemaps.
 * Partner ID is safe to expose (it's just branding, not auth).
 * Docs: https://docs.bubblemaps.io
 */
export function buildBubblemapsIframeUrl(
  chain: string,
  address: string,
  partnerId: string = getPartnerId(),
): string {
  const params = new URLSearchParams({ chain, address, partnerId });
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
