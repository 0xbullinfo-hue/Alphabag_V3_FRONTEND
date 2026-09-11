import { getTokenRisk } from '../risk';
import type { Position } from '../defi/types';

/**
 * Spam tokens must never inflate net worth, but must also never be silently
 * deleted — users need to see and dismiss them.
 */
export async function partitionSpam(chainId: number, positions: Position[]) {
  const kept: Position[] = [];
  const spam: Array<Position & { risk: Awaited<ReturnType<typeof getTokenRisk>> }> = [];

  await Promise.all(positions.map(async p => {
    if (p.kind !== 'wallet' || !p.assets[0]) { kept.push(p); return; }
    const a = p.assets[0];
    const risk = await getTokenRisk(chainId, a.address);
    if (risk.isSpamAirdrop || risk.score >= 80) spam.push({ ...p, risk });
    else kept.push(p);
  }));

  return { kept, spam };
}

export function totalUsdExcludingSpam(kept: Position[]): number {
  return kept.reduce((s, p) => s + (p.usd ?? 0), 0);
}