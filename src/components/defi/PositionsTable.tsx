import { Money } from '../ui/States';
import { FreshnessBadge, type Provenance } from '../ui/FreshnessBadge';

export interface Position {
  id: string; chainId: number; protocol: string;
  kind: 'wallet' | 'lp' | 'lending_supply' | 'lending_borrow' | 'stake' | 'vault' | 'reward';
  assets: Array<{ symbol: string; amount: string; decimals: number; address?: string }>;
  usd?: number;
  health?: { healthFactor: number; liquidationThreshold: number };
  claimable?: Array<{ symbol: string; amount: string }>;
  ref?: { url?: string };
  meta?: Record<string, unknown>;
}

const KIND_LABEL: Record<Position['kind'], string> = {
  wallet: 'Wallet', lp: 'LP', lending_supply: 'Supplied', lending_borrow: 'Borrowed',
  stake: 'Staked', vault: 'Vault', reward: 'Rewards',
};

function healthColor(hf: number) {
  if (!isFinite(hf)) return 'text-neutral-500';
  if (hf < 1.1) return 'text-red-400';
  if (hf < 1.5) return 'text-amber-400';
  return 'text-emerald-400';
}

export function PositionsTable({ positions, provenance }: { positions: Position[]; provenance?: Provenance }) {
  if (!positions.length) return null;

  const groups = positions.reduce<Record<string, Position[]>>((acc, p) => {
    (acc[p.protocol] ??= []).push(p);
    return acc;
  }, {});

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-300">DeFi Positions</h3>
        <FreshnessBadge p={provenance} />
      </header>

      {Object.entries(groups).map(([protocol, rows]) => (
        <div key={protocol} className="rounded-xl border border-neutral-800 overflow-hidden">
          <div className="bg-neutral-900/60 px-4 py-2 text-xs uppercase tracking-wide text-neutral-500">{protocol}</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-800/70">
              {rows.map(p => {
                const inRange = p.meta?.inRange as boolean | undefined;
                return (
                  <tr key={p.id} className="hover:bg-neutral-900/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">{KIND_LABEL[p.kind]}</span>
                        {p.kind === 'lp' && inRange === false && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">Out of range</span>
                        )}
                        {p.kind === 'lending_borrow' && p.health && (
                          <span className={`text-[10px] ${healthColor(p.health.healthFactor)}`}>
                            HF {isFinite(p.health.healthFactor) ? p.health.healthFactor.toFixed(2) : '∞'}
                          </span>
                        )}
                      </div>
                      {p.assets.length > 0 && (
                        <div className="mt-1 text-xs text-neutral-400">
                          {p.assets.filter(a => a.amount !== '0').map(a => `${a.symbol || a.address?.slice(0, 6) || ''}`).join(' / ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Money value={p.usd} className={p.kind === 'lending_borrow' ? 'text-red-300' : ''} />
                    </td>
                    <td className="px-4 py-3 text-right w-24">
                      {p.ref?.url && (
                        <a href={p.ref.url} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-neutral-500 hover:text-white">View ↗</a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}