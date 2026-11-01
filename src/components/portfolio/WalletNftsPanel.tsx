import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import React from 'react';
import { fetchWalletNfts } from '../../services/walletNfts';

export const WalletNftsPanel: React.FC<{ address: string }> = ({ address }) => {
  const {
    data: nfts = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['portfolio', 'nfts', address],
    queryFn: () => fetchWalletNfts(address),
    enabled: Boolean(address),
    retry: false,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  return (
    <section className="rounded-lg border border-alphabag-gray bg-alphabag-darkgray overflow-hidden">
      <header className="px-6 py-3 border-b border-alphabag-gray flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-alphabag-text">Wallet NFTs</h2>
          <p className="text-[11px] text-alphabag-subtext mt-1">Tracked wallet across supported EVM networks and Solana</p>
        </div>
        {isError && (
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 rounded-md border border-alphabag-gray px-3 py-1.5 text-xs font-semibold text-alphabag-text hover:bg-alphabag-gray"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        )}
      </header>

      <div aria-live="polite" className="p-4">
        {isLoading ? (
          <p className="text-xs text-alphabag-subtext">Checking NFT holdings for this wallet…</p>
        ) : isError ? (
          <p role="alert" className="text-xs text-alphabag-subtext">
            NFT holdings could not be verified. The wallet NFT service is unavailable.
          </p>
        ) : nfts.length === 0 ? (
          <p className="text-xs text-alphabag-subtext">No NFTs detected for this wallet across supported networks.</p>
        ) : (
          <>
            <p className="text-xs text-alphabag-text font-semibold mb-3">
              {nfts.length} NFT{nfts.length === 1 ? '' : 's'} detected
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {nfts.map((nft) => (
                <li key={nft.id} className="rounded-md border border-alphabag-gray bg-alphabag-black p-3">
                  <p className="text-sm font-semibold text-alphabag-text truncate">
                    {nft.name || `Token ${nft.tokenId || '—'}`}
                  </p>
                  <p className="text-xs text-alphabag-subtext mt-1 truncate">
                    {nft.collectionName || 'Unlabelled collection'}
                  </p>
                  <p className="text-[11px] text-alphabag-subtext mt-2 font-mono uppercase">
                    {nft.chain} · {nft.standard}{nft.tokenId ? ` · #${nft.tokenId}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
};
