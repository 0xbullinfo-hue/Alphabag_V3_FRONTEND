import { describe, it, expect } from 'vitest';
import { NFT_CONFIG } from '../../src/services/config';

describe('Genesis Pass Mint Gating', () => {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  it('exposes collection parameters matching governance specifications', () => {
    expect(NFT_CONFIG.TOTAL_SUPPLY).toBe(4000);
    expect(NFT_CONFIG.MINT_PRICE_BNB).toBe(0.07);
    expect(NFT_CONFIG.MAX_MINT_PER_WALLET).toBe(10);
  });

  it('determines whether minting is enabled based on environment and contract address', () => {
    const isDev = false;
    const contractAddress = ZERO_ADDRESS;

    // In production without a valid mainnet/testnet contract address, minting must be gated
    const isMintLive = Boolean(contractAddress && contractAddress !== ZERO_ADDRESS);
    const canMintSimulated = isDev && contractAddress === ZERO_ADDRESS;
    const canMint = isMintLive || canMintSimulated;

    expect(isMintLive).toBe(false);
    expect(canMintSimulated).toBe(false);
    expect(canMint).toBe(false);
  });

  it('allows simulated minting only in development mode', () => {
    const isDev = true;
    const contractAddress = ZERO_ADDRESS;

    const canMintSimulated = isDev && contractAddress === ZERO_ADDRESS;
    expect(canMintSimulated).toBe(true);
  });
});
