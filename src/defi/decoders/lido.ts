import { Contract, JsonRpcProvider } from 'ethers';
import type { DecodeContext, Position, ProtocolDecoder } from '../types';
import { addressesFor } from '../protocolRegistry';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function symbol() view returns (string)',
] as const;

export const lido: ProtocolDecoder = {
  protocol: 'lido',
  chainIds: [1],

  async probe(ctx: DecodeContext): Promise<boolean> {
    const addrs = addressesFor('lido', ctx.chainId);
    if (!addrs?.vaults?.length) return false;
    const provider = ctx.multicall as unknown as JsonRpcProvider;
    for (const token of addrs.vaults) {
      try {
        const c = new Contract(token, ERC20_ABI, provider);
        if ((await c.balanceOf(ctx.wallet)) > 0n) return true;
      } catch { /* skip */ }
    }
    return false;
  },

  async decode(ctx: DecodeContext): Promise<Position[]> {
    const addrs = addressesFor('lido', ctx.chainId);
    if (!addrs?.vaults?.length) return [];
    const provider = ctx.multicall as unknown as JsonRpcProvider;
    const out: Position[] = [];
    for (const token of addrs.vaults) {
      try {
        const c = new Contract(token, ERC20_ABI, provider);
        const [bal, symbol] = await Promise.all([c.balanceOf(ctx.wallet), c.symbol()]);
        if (bal > 0n) {
          out.push({
            id: `${ctx.chainId}:lido:${symbol}:${ctx.wallet}`,
            chainId: ctx.chainId,
            protocol: 'lido',
            kind: 'stake',
            assets: [{ address: token, symbol, decimals: 18, amount: bal.toString() }],
            usd: null,
            valuationStatus: 'UNAVAILABLE',
            meta: { symbol },
          });
        }
      } catch (err) {
        console.warn('[lido] decode failed', token, err);
      }
    }
    return out;
  },
};
