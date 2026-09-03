import { describe,expect,it } from 'vitest';
import { TokenBalanceService } from './TokenBalanceService';

describe('TokenBalanceService.isQualifiedForPremium', () => {
  it('does not grant premium access while token gating is disabled', () => {
    expect(TokenBalanceService.isQualifiedForPremium(1_000_000)).toBe(false);
  });
});