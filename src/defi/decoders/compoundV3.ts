import { Contract, JsonRpcProvider } from 'ethers';
import type { DecodeContext, Position, ProtocolDecoder } from '../types';
import { addressesFor } from '../protocolRegistry';

const ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function borrowBalanceOf(address) view returns (uint256)',
  'function baseToken() view returns (address)',
] as const;

export const compoundV3: ProtocolDecoder = {
  protocol: 'compound-v3',
  chainIds: [1, 137, 42161, 10, 8453],

  async probe(ctx: DecodeContext): Promise<boolean> {
    const addrs = addressesFor('compoundV3', ctx.chainId);
    if (!addrs?.comet) return false;
    const c = new Contract(addrs.comet, ABI, ctx.multicall as unknown as JsonRpcProvider);
    try {
      if ((await c.balanceOf(ctx.wallet)) > 0n) return true;
      return (await c.borrowBalanceOf(ctx.wallet)) > 0n;
    } catch {
      return false;
    }
  },

  async decode(ctx: DecodeContext): Promise<Position[]> {
    const addrs = addressesFor('compoundV3', ctx.chainId);
    if (!addrs?.comet) return [];
    const provider = ctx.multicall as unknown as JsonRpcProvider;
    const c = new Contract(addrs.comet, ABI, provider);
    const out: Position[] = [];
    try {
      const [supply, borrow, baseToken] = await Promise.all([
        c.balanceOf(ctx.wallet),
        c.borrowBalanceOf(ctx.wallet),
        c.baseToken(),
      ]);
      if (supply > 0n) {
        out.push({
          id: `${ctx.chainId}:compound-v3:supply:${ctx.wallet}`,
          chainId: ctx.chainId,
          protocol: 'compound-v3',
          kind: 'lending_supply',
          assets: [{ address: baseToken, symbol: 'COMET-BASE', decimals: 18, amount: supply.toString() }],
          usd: 0,
          meta: { comet: addrs.comet, baseToken },
        });
      }
      if (borrow > 0n) {
        out.push({
          id: `${ctx.chainId}:compound-v3:borrow:${ctx.wallet}`,
          chainId: ctx.chainId,
          protocol: 'compound-v3',
          kind: 'lending_borrow',
          assets: [{ address: baseToken, symbol: 'COMET-BASE', decimals: 18, amount: borrow.toString() }],
          usd: 0,
          meta: { comet: addrs.comet, baseToken },
        });
      }
    } catch (err) {
      console.warn('[compoundV3] decode failed', ctx.chainId, ctx.wallet, err);
    }
    return out;
  },
};
