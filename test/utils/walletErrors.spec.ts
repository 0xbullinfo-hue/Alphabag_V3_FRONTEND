import { describe, it, expect } from 'vitest';
import { parseWalletError } from '../../src/utils/walletErrors';

describe('parseWalletError', () => {
  it('maps standard user rejection (code 4001, ACTION_REJECTED, UserRejectedRequestError) correctly', () => {
    const err4001 = parseWalletError({ code: 4001, message: 'User rejected the request' });
    expect(err4001.code).toBe('USER_REJECTED');
    expect(err4001.message).toBeTruthy();
    expect(err4001.action).toBe('retry');

    const errActionRejected = parseWalletError({ code: 'ACTION_REJECTED', message: 'User denied request' });
    expect(errActionRejected.code).toBe('USER_REJECTED');
    expect(errActionRejected.message).toBeTruthy();
    expect(errActionRejected.action).toBe('retry');

    const errNamed = parseWalletError({ name: 'UserRejectedRequestError' });
    expect(errNamed.code).toBe('USER_REJECTED');
    expect(errNamed.message).toBeTruthy();
    expect(errNamed.action).toBe('retry');

    const errMsg = parseWalletError({ message: 'MetaMask Tx Signature: User denied transaction signature.' });
    expect(errMsg.code).toBe('USER_REJECTED');
    expect(errMsg.message).toBeTruthy();
  });

  it('maps chain mismatch to WRONG_CHAIN and action switch-chain', () => {
    const err = parseWalletError({ name: 'ChainMismatchError', message: 'The current chain 1 does not match expected 56' });
    expect(err.code).toBe('WRONG_CHAIN');
    expect(err.action).toBe('switch-chain');
    expect(err.message).toBeTruthy();

    const err4902 = parseWalletError({ code: 4902, message: 'Unrecognized chain' });
    expect(err4902.code).toBe('WRONG_CHAIN');
    expect(err4902.action).toBe('switch-chain');
  });

  it('maps insufficient gas and funds errors', () => {
    const err = parseWalletError({ name: 'InsufficientFundsError', message: 'gas required exceeds allowance (0)' });
    expect(err.code).toBe('INSUFFICIENT_FUNDS');
    expect(err.action).toBe('get-funds');
    expect(err.message).toBeTruthy();
  });

  it('maps RPC timeout errors', () => {
    const err = parseWalletError({ name: 'TimeoutError', message: 'request timed out' });
    expect(err.code).toBe('RPC_TIMEOUT');
    expect(err.action).toBe('retry');
    expect(err.message).toBeTruthy();
  });

  it('maps disconnected connector errors', () => {
    const err = parseWalletError({ name: 'ConnectorNotFoundError', message: 'connector not found' });
    expect(err.code).toBe('DISCONNECTED');
    expect(err.action).toBe('connect');
    expect(err.message).toBeTruthy();
  });

  it('maps contract execution reverts with reason', () => {
    const err = parseWalletError({ name: 'ContractFunctionRevertedError', message: 'execution reverted with reason: Max supply exceeded.' });
    expect(err.code).toBe('REVERTED');
    expect(err.message).toBe('Max supply exceeded');
    expect(err.action).toBe('retry');
  });

  it('gracefully handles empty or unknown errors', () => {
    const errNull = parseWalletError(null);
    expect(errNull.code).toBe('UNKNOWN');
    expect(errNull.message).toBeTruthy();
    expect(errNull.action).toBe('retry');

    const errCustom = parseWalletError({ message: 'Something completely custom' });
    expect(errCustom.code).toBe('UNKNOWN');
    expect(errCustom.message).toBe('Something completely custom');
    expect(errCustom.action).toBe('retry');
  });
});
