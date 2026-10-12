/**
 * Shared formatting and URL resolution utilities for AlphaBAG V3
 * Institutional Terminal Standards (Binance Pro / Bybit)
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

/**
 * Format USD values with fixed precision (e.g. $1,245.50)
 */
export function formatUsd(val: number | null | undefined, minDecimals = 2, maxDecimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(val);
}

/**
 * Format cryptocurrency prices adaptively:
 * - >= $1,000 -> 2 decimals
 * - >= $1 -> 2-4 decimals
 * - < $1 -> up to 6-8 decimals
 */
export function formatPrice(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '$0.00';
  const abs = Math.abs(val);
  if (abs === 0) return '$0.00';
  if (abs >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  }
  if (abs >= 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(val);
  }
  if (abs >= 0.0001) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(val);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 6,
    maximumFractionDigits: 8,
  }).format(val);
}

/**
 * Format percentages (e.g. +14.25% or -3.10%)
 */
export function formatPct(val: number | null | undefined, includeSign = true, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return '0.00%';
  const prefix = includeSign && val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(decimals)}%`;
}

/**
 * Formats a PnL structure with delta icon, text, and flags
 */
export function formatPnl(usdValue: number, pctValue?: number): {
  text: string;
  isPositive: boolean;
  isNegative: boolean;
  symbol: string;
} {
  const isPositive = usdValue > 0;
  const isNegative = usdValue < 0;
  const symbol = isPositive ? '▲' : isNegative ? '▼' : '–';
  const usdFormatted = formatUsd(usdValue);
  const pctFormatted = pctValue !== undefined ? ` (${formatPct(pctValue, true)})` : '';

  return {
    text: `${usdFormatted}${pctFormatted}`,
    isPositive,
    isNegative,
    symbol,
  };
}

/**
 * Format large numbers compactly: e.g. 1.2M, 450K, 12.5B
 */
export function formatCompact(val: number | null | undefined, prefix = '$'): string {
  if (val === null || val === undefined || isNaN(val)) return `${prefix}0`;
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (abs >= 1e9) {
    return `${sign}${prefix}${(abs / 1e9).toFixed(2)}B`;
  }
  if (abs >= 1e6) {
    return `${sign}${prefix}${(abs / 1e6).toFixed(2)}M`;
  }
  if (abs >= 1e3) {
    return `${sign}${prefix}${(abs / 1e3).toFixed(1)}K`;
  }
  return `${sign}${prefix}${abs.toFixed(2)}`;
}
