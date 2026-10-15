/**
 * EIP-4361 compliant SIWE (Sign-In with Ethereum) message generator.
 * Eliminates accidental indentation or whitespace formatting errors that break ABNF parsing.
 */

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

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    statement,
    '',
    `URI: ${uri}`,
    `Version: ${version}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`
  ].join('\n');
}

export function parseSiweMessage(message: string): Partial<CreateSiweMessageParams> | null {
  try {
    const lines = message.split('\n');
    const headerMatch = lines[0]?.match(/^(.+?)\s+wants you to sign in with your Ethereum account:$/);
    if (!headerMatch) return null;
    const domain = headerMatch[1];
    const address = lines[1]?.trim();
    
    // Find fields
    const uriLine = lines.find(l => l.startsWith('URI: '));
    const versionLine = lines.find(l => l.startsWith('Version: '));
    const chainIdLine = lines.find(l => l.startsWith('Chain ID: '));
    const nonceLine = lines.find(l => l.startsWith('Nonce: '));
    const issuedAtLine = lines.find(l => l.startsWith('Issued At: '));

    return {
      domain,
      address,
      uri: uriLine ? uriLine.replace('URI: ', '').trim() : undefined,
      version: versionLine ? versionLine.replace('Version: ', '').trim() : undefined,
      chainId: chainIdLine ? parseInt(chainIdLine.replace('Chain ID: ', '').trim(), 10) : undefined,
      nonce: nonceLine ? nonceLine.replace('Nonce: ', '').trim() : undefined,
      issuedAt: issuedAtLine ? issuedAtLine.replace('Issued At: ', '').trim() : undefined
    };
  } catch {
    return null;
  }
}
