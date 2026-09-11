import { z } from 'zod';
import { getDefiPositions } from '../defi';
import { getPortfolio } from '../portfolio';
import { getPrices } from '../prices';
import { getCexBalances } from '../cex/balances';
import { getTokenRisk } from '../risk';

export const TOOL_SCHEMAS = {
  get_portfolio: z.object({}),
  get_defi_positions: z.object({ chainId: z.number().int() }),
  get_prices: z.object({ assetIds: z.array(z.string()).max(50) }),
  get_cex_balances: z.object({ exchangeId: z.string().optional() }),
  get_token_risk: z.object({ chainId: z.number().int(), address: z.string() }),
} as const;

export type ToolName = keyof typeof TOOL_SCHEMAS;

/** Facts returned to the model. Every fact carries source + age. */
export interface Fact {
  key: string;
  value: unknown;
  source: string;
  fetchedAt: string;
  ageMs: number;
  stale: boolean;
}

export async function runTool(
  name: ToolName,
  args: unknown,
  userId: string,
): Promise<Fact[]> {
  const parsed = TOOL_SCHEMAS[name].parse(args ?? {});
  const now = () => new Date().toISOString();

  switch (name) {
    case 'get_portfolio': {
      const p = await getPortfolio(userId);
      return [
        { key: 'portfolio.totalUsd', value: p.totalUsd, source: p.provenance.source, fetchedAt: p.provenance.fetchedAt, ageMs: p.provenance.ageMs, stale: p.provenance.stale },
        { key: 'portfolio.positions', value: p.positions, source: p.provenance.source, fetchedAt: p.provenance.fetchedAt, ageMs: p.provenance.ageMs, stale: p.provenance.stale },
        { key: 'portfolio.netWorthIsNetOfDebt', value: true, source: 'system', fetchedAt: now(), ageMs: 0, stale: false },
      ];
    }
    case 'get_defi_positions': {
      const { chainId } = parsed as { chainId: number };
      const r = await getDefiPositions(chainId, (await getPortfolio(userId)).wallet, {} as never);
      return [{ key: `defi.${chainId}.positions`, value: r.positions, source: `rpc:${chainId}`, fetchedAt: now(), ageMs: 0, stale: false }];
    }
    case 'get_prices': {
      const { assetIds } = parsed as { assetIds: string[] };
      const prices = await getPrices(assetIds);
      return Object.entries(prices).map(([k, v]) => ({
        key: `price.${k}`, value: v.value, source: v.source, fetchedAt: v.fetchedAt, ageMs: v.ageMs, stale: v.stale,
      }));
    }
    case 'get_cex_balances': {
      const b = await getCexBalances(userId, (parsed as { exchangeId?: string }).exchangeId);
      return [{ key: 'cex.balances', value: b.rows, source: b.source, fetchedAt: b.fetchedAt, ageMs: b.ageMs, stale: b.stale }];
    }
    case 'get_token_risk': {
      const { chainId, address } = parsed as { chainId: number; address: string };
      const r = await getTokenRisk(chainId, address);
      return [{ key: `risk.${chainId}.${address}`, value: r, source: 'risk-engine', fetchedAt: now(), ageMs: 0, stale: false }];
    }
  }
}
