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
    <div className="relative w-full overflow-hidden rounded-[6px] border border-[#2B313A] bg-[#181A20]">
      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 bg-[#14171D] border-b border-[#2B313A]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#202630] border border-[#2B313A] flex items-center justify-center text-alphabag-yellow">
            <Share2 size={13} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-alphabag-text">Holder Distribution Topology</span>
              <span className="text-[11px] uppercase font-semibold px-1.5 py-0.2 rounded-[2px] bg-white/5 text-alphabag-subtext border border-white/10">
                {chain}
              </span>
            </div>
            <p className="text-[11px] text-alphabag-subtext num truncate max-w-[240px] sm:max-w-md">
              {address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#202630] hover:bg-[#2B313A] text-alphabag-subtext hover:text-white border border-[#2B313A] text-xs font-medium transition-colors"
            title="Copy Contract Address"
          >
            {copied ? <Check size={12} className="text-alphabag-green" /> : <Copy size={12} />}
            <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => { setLoading(true); setKey((k) => k + 1); }}
            className="p-1.5 rounded bg-[#202630] hover:bg-[#2B313A] text-alphabag-subtext hover:text-white border border-[#2B313A] text-xs transition-colors"
            title="Reload Embed"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>

          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-alphabag-yellow text-[#0B0E11] hover:bg-[#FCD535] text-xs font-semibold transition-colors"
          >
            <span>External View</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="relative w-full" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#181A20]/95 text-xs text-alphabag-subtext">
            <div className="w-8 h-8 border-2 border-alphabag-yellow/20 border-t-alphabag-yellow rounded-full animate-spin" />
            <p className="text-xs font-medium text-alphabag-text mt-1">Analyzing On-Chain Clusters...</p>
            <p className="text-[11px] text-alphabag-subtext">Loading wallet clusters and concentration map</p>
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
