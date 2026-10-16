/**
 * EIP-4361 compliant SIWE (Sign-In with Ethereum) message generator.
 * Uses official SiweMessage from 'siwe' and viem getAddress checksumming.
 */
import { SiweMessage } from 'siwe';
import { getAddress } from 'viem';

export interface CreateSiweMessageParams {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version?: string;
  chainId: number;
  nonce: string;
  issuedAt?: string;
}

export function createSiweMessage(params: CreateSiweMessageParams): string {
  const {
    domain,
    address,
    statement = 'Sign in to AlphaBAG Protocol Hub.',
    uri,
    version = '1',
    chainId,
    nonce,
    issuedAt = new Date().toISOString()
  } = params;

  const checksummedAddress = getAddress(address);

  const siweMessage = new SiweMessage({
    domain,
    address: checksummedAddress,
    statement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt
  });

  return siweMessage.prepareMessage();
}

export function parseSiweMessage(message: string): Partial<CreateSiweMessageParams> | null {
  try {
    const siwe = new SiweMessage(message);
    return {
      domain: siwe.domain,
      address: siwe.address,
      statement: siwe.statement,
      uri: siwe.uri,
      version: siwe.version,
      chainId: siwe.chainId,
      nonce: siwe.nonce,
      issuedAt: siwe.issuedAt
    };
  } catch {
    return null;
  }
}
