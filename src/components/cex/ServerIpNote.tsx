import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function ServerIpNote({ ip, note }: { ip: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  const isDynamic = ip === 'DYNAMIC_SERVER_EGRESS' || !ip;
  const displayIp = isDynamic ? 'Auto-managed by server (Contact admin if static IP required)' : ip;

  const copy = async () => {
    if (isDynamic) return;
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-sm">
      {note && <p className="mb-2 text-neutral-400">{note}</p>}
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-neutral-900 px-2 py-1 font-mono text-xs text-emerald-400">
          {displayIp}
        </code>
        {!isDynamic && (
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? 'Copied' : 'Copy server IP'}
            className="rounded-md border border-neutral-700 p-1.5 text-neutral-400 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
