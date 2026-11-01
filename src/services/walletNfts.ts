import { api } from './api';

export interface WalletNft {
  id: string;
  chain: string;
  standard: string;
  name?: string;
  collectionName?: string;
  tokenId?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const optionalString = (value: unknown, field: string): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`The wallet NFT service returned an invalid ${field}.`);
  }
  return value;
};

export const fetchWalletNfts = async (address: string): Promise<WalletNft[]> => {
  const response = await api.get('/api/portfolio/nfts', { params: { address } });
  const payload: unknown = response.data;

  if (!isRecord(payload) || !Array.isArray(payload.nfts)) {
    throw new Error('The wallet NFT service returned an invalid response.');
  }

  return payload.nfts.map((entry, index) => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      !entry.id ||
      typeof entry.chain !== 'string' ||
      !entry.chain ||
      typeof entry.standard !== 'string' ||
      !entry.standard
    ) {
      throw new Error(`The wallet NFT service returned an invalid item at index ${index}.`);
    }

    return {
      id: entry.id,
      chain: entry.chain,
      standard: entry.standard,
      name: optionalString(entry.name, 'name'),
      collectionName: optionalString(entry.collectionName, 'collection name'),
      tokenId: optionalString(entry.tokenId, 'token ID'),
    };
  });
};
