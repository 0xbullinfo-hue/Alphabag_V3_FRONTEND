import { Contract, JsonRpcProvider } from 'ethers';
import type { DecodeContext, Position, ProtocolDecoder } from '../types';

const ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function convertToAssets(uint256 shares) view returns (uint256)',
  'function asset() view returns (address)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
] as const;

/**
 * Generic ERC-4626. `vaults` is a registry you control (Yearn, Beefy, Morpho, …).
 * Never enumerate arbitrary contracts — that is a DoS and a scam-token vector.
 */
export function makeErc4626(protocol: string, vaults: Record<number, string[]>): ProtocolDecoder {
  return {
    protocol,
    chainIds: Object.keys(vaults).map(Number),

    async probe(ctx) {
      const list = vaults[ctx.chainId] ?? [];
      for (const v of list) {
        const c = new Contract(v, ABI, ctx.multicall as unknown as JsonRpcProvider);
        if ((await c.balanceOf(ctx.wallet)) > 0n) return true;
      }
      return false;
    },

    async decode(ctx): Promise<Position[]> {
      const provider = ctx.multicall as unknown as JsonRpcProvider;
      const out: Position[] = [];
      for (const v of vaults[ctx.chainId] ?? []) {
        const c = new Contract(v, ABI, provider);
        const shares: bigint = await c.balanceOf(ctx.wallet);
        if (shares === 0n) continue;
        const assets: bigint = await c.convertToAssets(shares);
        const [asset, symbol, decimals] = await Promise.all([
          c.asset(), c.symbol().catch(() => ''), c.decimals().catch(() => 18),
        ]);
        out.push({
          id: `${ctx.chainId}:${protocol}:vault:${v}`,
          chainId: ctx.chainId,
          protocol,
          kind: 'vault',
          assets: [{ address: asset, symbol, decimals: Number(decimals), amount: assets.toString() }],
          ref: { type: 'pool', value: v },
          meta: { shares: shares.toString(), vault: v },
        });
      }
      return out;
    },
  };
}
