import { readThrough } from '../cache/tieredCache';
import { uniswapV3 } from './decoders/uniswapV3';
import { aaveV3 } from './decoders/aaveV3';
import { makeErc4626 } from './decoders/erc4626';
import type { DecodeContext, Position, ProtocolDecoder } from './types';

const REGISTRY: ProtocolDecoder[] = [
  uniswapV3,
  aaveV3,
  makeErc4626('yearn-v3', { 1: [/* vault addresses */] }),
];

export async function getDefiPositions(
  chainId: number,
  wallet: string,
  ctx: Omit<DecodeContext, 'chainId' | 'wallet'>,
): Promise<{ positions: Position[]; netUsd: number }> {
  const id = `${chainId}:${wallet.toLowerCase()}`;

  const fresh = await readThrough('position', id, async () => {
    const decoders = REGISTRY.filter(d => d.chainIds.includes(chainId));
    const all: Position[] = [];

    // Probes in parallel, decodes only for hits — keeps RPC cost bounded.
    const probes = await Promise.all(
      decoders.map(async d => ({ d, hit: await d.probe({ ...ctx, chainId, wallet }).catch(() => false) })),
    );
    for (const { d, hit } of probes) {
      if (!hit) continue;
      all.push(...await d.decode({ ...ctx, chainId, wallet }));
    }

    return { value: all, source: `rpc:${chainId}`, blockNumber: ctx.blockNumber };
  });

  // Valuation happens OUTSIDE the cache so prices stay fresh.
  let netUsd = 0;
  for (const p of fresh.value) {
    if (p.usd != null) { netUsd += p.usd; continue; }
    let sum = 0;
    for (const a of p.assets) {
      sum += await ctx.prices(a.address, a.amount, a.decimals);
    }
    p.usd = sum;
    netUsd += sum;
  }

  return { positions: fresh.value, netUsd };
}

export type { Position, ProtocolDecoder, DecodeContext } from './types';
