import { api } from './api';
import type { SocialMetrics } from '../types/intelligence';

/**
 * Santiment social intelligence service.
 *
 * SECURITY: All calls route through the backend proxy at
 * /api/proxy/santiment/social-metrics so the Santiment API key
 * stays server-side and never appears in the JS bundle.
 *
 * Backend must implement:
 *   GET /api/proxy/santiment/social-metrics
 *   Query params: slug (string), from (ISO string), to (ISO string)
 *   Response: SocialMetrics JSON
 *
 * The backend then calls Santiment's GraphQL API with SANTIMENT_API_KEY
 * (stored in backend .env, never VITE_ prefixed).
 */
export async function fetchSocialMetrics(
  assetSlug: string,
  fromISO: string,
  toISO: string,
): Promise<SocialMetrics> {
  const res = await api.get('/api/proxy/santiment/social-metrics', {
    params: { slug: assetSlug, from: fromISO, to: toISO },
  });
  return res.data as SocialMetrics;
}

/**
 * Helper: compute ISO date range strings from a human-readable range.
 */
export function getSantimentDateRange(range: '24h' | '7d' | '30d'): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  if (range === '24h') from.setHours(from.getHours() - 24);
  else if (range === '7d') from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}
