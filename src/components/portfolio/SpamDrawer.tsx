/**
 * Spam is hidden by default but always discoverable + dismissible.
 * Hiding it entirely erodes trust ("where did my airdrop go?").
 */
export function SpamDrawer({ spam, onDismiss }: { spam: any[]; onDismiss: (id: string) => void }) {
  if (!spam.length) return null;
  return (
    <details className="rounded-xl border border-neutral-800">
      <summary className="cursor-pointer px-4 py-3 text-xs text-neutral-500 hover:text-neutral-300">
        {spam.length} suspected spam token{spam.length > 1 ? 's' : ''} hidden — excluded from totals
      </summary>
      <ul className="divide-y divide-neutral-800/70">
        {spam.map(p => (
          <li key={p.id} className="flex items-center justify-between px-4 py-2 text-xs">
            <div>
              <span className="font-mono">{p.assets[0]?.symbol || p.assets[0]?.address.slice(0, 8)}</span>
              <span className="ml-2 text-neutral-500">{p.risk?.reason}</span>
            </div>
            <button onClick={() => onDismiss(p.id)} className="text-neutral-500 hover:text-white">Dismiss</button>
          </li>
        ))}
      </ul>
    </details>
  );
}