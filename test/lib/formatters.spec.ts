import { describe, expect, it } from 'vitest';
import { formatAmount, formatPrice, formatUsd } from '../../src/lib/formatters';

describe('financial number formatting', () => {
  it('formats fiat with two decimals and grouping', () => {
    expect(formatUsd(12345.6)).toBe('$12,345.60');
  });

  it('formats standard crypto balances with grouping and four decimals', () => {
    expect(formatAmount('12345.678912')).toBe('12,345.6789');
  });

  it('preserves up to eight decimals for sub-unit crypto balances', () => {
    expect(formatAmount('0.00001234')).toBe('0.00001234');
    expect(formatAmount('0.5')).toBe('0.5000');
  });

  it('keeps adaptive USD price precision for small tokens', () => {
    expect(formatPrice(0.00001234)).toContain('0.00001234');
  });
});