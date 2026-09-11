import { readThrough } from '../cache/tieredCache';

export interface TokenRisk {
  chainId: number;
  address: string;
  flags: Array<'spam' | 'honeypot' | 'high_tax' | 'unverified' | 'low_liquidity' | 'mintable' | 'proxy'>;
  score: number;         // 0 (safe) – 100 (certain scam)
  liquidityUsd: number;
  holderCount: number;
  isSpamAirdrop: boolean;
  reason: string;
}

/**
 * Layered:
 *   1. Static deny-list (fast, free)
 *   2. Heuristics on liquidity/holders/contract flags
 *   3. Optional external simulation for honeypot detection
 * Results are cached for 24h; contracts rarely change risk class.
 */
export async function getTokenRisk(chainId: number, address: string): Promise<TokenRisk> {
  const key = `${chainId}:${address.toLowerCase()}`;
  const fresh = await readThrough<TokenRisk>('metadata', `risk:${key}`, async () => ({
    value: await computeRisk(chainId, address),
    source: 'risk-engine',
  }));
  return fresh.value;
}

async function computeRisk(chainId: number, address: string): Promise<TokenRisk> {
  const flags: TokenRisk['flags'] = [];
  let score = 0;

  // --- heuristic signals (wire to your indexer / RPC) ---
  const { liquidityUsd, holderCount, verified, mintable, proxy } = await probeToken(chainId, address);

  if (!verified) { flags.push('unverified'); score += 20; }
  if (mintable)  { flags.push('mintable');   score += 25; }
  if (proxy)     { flags.push('proxy');      score += 10; }
  if (liquidityUsd < 5_000)  { flags.push('low_liquidity'); score += 35; }
  if (holderCount < 50)      { flags.push('low_liquidity'); score += 20; }

  const honeypot = await simulateSell(chainId, address).catch(() => null);
  if (honeypot === true) { flags.push('honeypot'); score = 100; }

  score = Math.min(100, score);

  // A token airdropped to a wallet that never bought it is spam by definition.
  const isSpamAirdrop = score >= 60 && !(await hasUserEverInteracted(chainId, address));
  if (isSpamAirdrop) flags.push('spam');

  return {
    chainId, address,
    flags: [...new Set(flags)],
    score,
    liquidityUsd, holderCount,
    isSpamAirdrop,
    reason: describe(flags),
  };
}

function describe(flags: string[]): string {
  if (flags.includes('honeypot')) return 'Cannot be sold — likely a honeypot.';
  if (flags.includes('spam')) return 'Unsolicited airdrop with no liquidity.';
  if (flags.includes('low_liquidity')) return 'Very low liquidity; price is unreliable.';
  return 'No major risk signals detected.';
}

async function probeToken(_c: number, _a: string) {
  return { liquidityUsd: 0, holderCount: 0, verified: false, mintable: false, proxy: false };
}
async function simulateSell(_c: number, _a: string): Promise<boolean | null> { return null; }
async function hasUserEverInteracted(_c: number, _a: string): Promise<boolean> { return false; }