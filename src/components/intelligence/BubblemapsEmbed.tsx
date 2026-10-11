import { Copy, Check, ExternalLink, RefreshCw, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildBubblemapsIframeUrl } from '../../services/bubblemaps';

interface BubblemapsEmbedProps {
  chain: string;
  address: string;
  height?: number;
}

export function BubblemapsEmbed({ chain, address, height = 640 }: BubblemapsEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  const src = useMemo(() => buildBubblemapsIframeUrl(chain, address), [chain, address, key]);
  const externalUrl = `https://app.bubblemaps.io/${chain}/token/${address}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] shadow-2xl">
      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0e141f] border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-alphabag-yellow/10 border border-alphabag-yellow/30 flex items-center justify-center text-alphabag-yellow">
            <Share2 size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">Holder Cluster Intelligence</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-alphabag-subtext border border-white/10">
                {chain}
              </span>
            </div>
            <p className="text-[10px] text-alphabag-subtext font-mono truncate max-w-[260px] sm:max-w-md">
              {address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-alphabag-subtext hover:text-white border border-white/10 text-xs font-medium transition-all"
            title="Copy Contract Address"
          >
            {copied ? <Check size={12} className="text-alphabag-green" /> : <Copy size={12} />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => { setLoading(true); setKey((k) => k + 1); }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-alphabag-subtext hover:text-white border border-white/10 text-xs transition-all"
            title="Reload Embed"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>

          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-alphabag-yellow text-alphabag-dark hover:bg-[#deb53a] text-xs font-bold transition-all shadow-md"
          >
            <span>Open Bubblemaps</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="relative w-full" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0b0f17]/90 backdrop-blur-sm text-sm text-alphabag-subtext">
            <div className="w-10 h-10 border-2 border-alphabag-yellow/20 border-t-alphabag-yellow rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-xs font-bold text-white">Analyzing On-Chain Clusters…</p>
              <p className="text-[11px] text-alphabag-subtext mt-0.5">Calculating wallet connections and concentration risk</p>
            </div>
          </div>
        )}
        <iframe
          key={`${src}-${key}`}
          src={src}
          title={`Holder distribution map for ${address}`}
          allow="clipboard-write"
          loading="lazy"
          onLoad={() => setLoading(false)}
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
}

export default BubblemapsEmbed;
