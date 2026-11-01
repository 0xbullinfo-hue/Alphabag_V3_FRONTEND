import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosResponse } from 'axios';
import { api } from '../../src/services/api';
import { fetchWalletNfts } from '../../src/services/walletNfts';

vi.mock('../../src/services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('wallet NFT service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches NFTs for the selected wallet and validates EVM and Solana records', async () => {
    const nfts = [
      {
        id: 'ethereum:0xcollection:1',
        chain: 'Ethereum',
        standard: 'ERC721',
        name: 'Position One',
        collectionName: 'Example Collection',
        tokenId: '1',
      },
      {
        id: 'solana:mint-address',
        chain: 'Solana',
        standard: 'COMPRESSED',
        name: 'Compressed Asset',
      },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: { nfts } } as AxiosResponse);

    await expect(fetchWalletNfts('0x1234')).resolves.toEqual(nfts);
    expect(api.get).toHaveBeenCalledWith('/api/portfolio/nfts', {
      params: { address: '0x1234' },
    });
  });

  it.each([
    null,
    {},
    { nfts: 'not-an-array' },
    { nfts: [null] },
    { nfts: [{ id: 'missing-chain', standard: 'ERC721' }] },
    { nfts: [{ id: 'bad-name', chain: 'Ethereum', standard: 'ERC721', name: 7 }] },
  ])('rejects invalid NFT service responses', async (data) => {
    vi.mocked(api.get).mockResolvedValue({ data } as AxiosResponse);

    await expect(fetchWalletNfts('0x1234')).rejects.toThrow(/invalid/);
  });
});
