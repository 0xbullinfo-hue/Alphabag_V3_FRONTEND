import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WalletNftsPanel } from '../../src/components/portfolio/WalletNftsPanel';
import { fetchWalletNfts } from '../../src/services/walletNfts';

vi.mock('../../src/services/walletNfts', () => ({
  fetchWalletNfts: vi.fn(),
}));

const walletAddress = '0x1234567890123456789012345678901234567890';

const renderPanel = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WalletNftsPanel address={walletAddress} />
    </QueryClientProvider>,
  );
};

describe('WalletNftsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows NFTs detected for the selected wallet', async () => {
    vi.mocked(fetchWalletNfts).mockResolvedValue([{
      id: 'ethereum:0xcollection:1',
      chain: 'Ethereum',
      standard: 'ERC721',
      name: 'Position One',
      collectionName: 'Example Collection',
      tokenId: '1',
    }]);

    renderPanel();

    expect(await screen.findByText('Position One')).toBeInTheDocument();
    expect(screen.getByText('Example Collection')).toBeInTheDocument();
    expect(screen.getByText(/1 NFT detected/)).toBeInTheDocument();
    expect(fetchWalletNfts).toHaveBeenCalledWith(walletAddress);
  });

  it('shows a verified empty state when no NFTs are returned', async () => {
    vi.mocked(fetchWalletNfts).mockResolvedValue([]);

    renderPanel();

    expect(await screen.findByText(/No NFTs detected/)).toBeInTheDocument();
  });

  it('does not present a failed lookup as an empty wallet', async () => {
    vi.mocked(fetchWalletNfts).mockRejectedValue(new Error('service unavailable'));

    renderPanel();

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be verified/);
  });
});
