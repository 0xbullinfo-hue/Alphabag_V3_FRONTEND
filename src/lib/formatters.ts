/**
 * Shared formatting and URL resolution utilities for AlphaBAG V3
 */

/**
 * Returns the appropriate block explorer URL for a given chain and token contract address.
 */
export function getExplorerTokenUrl(chain: string = '', contractAddress: string = ''): string {
  if (!contractAddress) return '#';
  const c = chain.toLowerCase().trim();

  switch (c) {
    case 'eth':
    case 'ethereum':
    case 'homestead':
      return `https://etherscan.io/token/${contractAddress}`;
    case 'bsc':
    case 'binance':
    case 'bsc-mainnet':
      return `https://bscscan.com/token/${contractAddress}`;
    case 'sol':
    case 'solana':
      return `https://solscan.io/token/${contractAddress}`;
    case 'polygon':
    case 'matic':
      return `https://polygonscan.com/token/${contractAddress}`;
    case 'arb':
    case 'arbitrum':
      return `https://arbiscan.io/token/${contractAddress}`;
    case 'base':
      return `https://basescan.org/token/${contractAddress}`;
    case 'avax':
    case 'avalanche':
      return `https://snowtrace.io/token/${contractAddress}`;
    default:
      // Fallback based on address format: Solana addresses are base58, EVM is 0x...
      if (contractAddress.startsWith('0x')) {
        return `https://bscscan.com/token/${contractAddress}`;
      }
      return `https://solscan.io/token/${contractAddress}`;
  }
}

/**
 * Formats a timestamp into human-readable relative time (e.g. "just now", "2m ago").
 */
export function timeSince(timestamp: number | Date | null | undefined): string {
  if (!timestamp) return 'Never';
  const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  if (isNaN(time)) return 'Never';

  const diffMs = Math.max(0, Date.now() - time);
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
