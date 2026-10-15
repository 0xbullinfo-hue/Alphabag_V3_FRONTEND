import { describe, it, expect } from 'vitest';
import { parseWalletError } from '../../src/utils/walletErrors';

describe('parseWalletError', () => {
  it('maps standard user rejection (code 4001 and names) correctly', () => {
    expect(parseWalletError({ code: 4001, message: 'User rejected the request' })).toEqual({
      code: 'USER_REJECTED',
      title: 'Signature Rejected',
      message: 'You declined the transaction or signature request in your wallet.',
      action: 'RETRY'
    });

    expect(parseWalletError({ name: 'UserRejectedRequestError' })).toEqual({
      code: 'USER_REJECTED',
      title: 'Signature Rejected',
      message: 'You declined the transaction or signature request in your wallet.',
      action: 'RETRY'
    });

    expect(parseWalletError({ message: 'MetaMask Tx Signature: User denied transaction signature.' })).toEqual({
      code: 'USER_REJECTED',
      title: 'Signature Rejected',
      message: 'You declined the transaction or signature request in your wallet.',
      action: 'RETRY'
    });
  });

  it('maps chain mismatch to WRONG_CHAIN and prompts switch chain', () => {
    expect(parseWalletError({ name: 'ChainMismatchError', message: 'The current chain 1 does not match expected 56' })).toEqual({
      code: 'WRONG_CHAIN',
      title: 'Wrong Network',
      message: 'Your wallet is connected to an unsupported network. Please switch to the required chain.',
      action: 'SWITCH_CHAIN'
    });
  });

  it('maps insufficient gas and funds errors', () => {
    expect(parseWalletError({ name: 'InsufficientFundsError', message: 'gas required exceeds allowance (0)' })).toEqual({
      code: 'INSUFFICIENT_FUNDS',
      title: 'Insufficient Balance',
      message: 'Your wallet does not have enough balance to cover the amount and required gas fees.',
      action: 'GET_FUNDS'
    });
  });

  it('maps RPC timeout errors', () => {
    expect(parseWalletError({ name: 'TimeoutError', message: 'request timed out' })).toEqual({
      code: 'RPC_TIMEOUT',
      title: 'Network Timeout',
      message: 'The RPC node took too long to respond. Please check your connection and retry.',
      action: 'RETRY'
    });
  });

  it('maps disconnected connector errors', () => {
    expect(parseWalletError({ name: 'ConnectorNotFoundError', message: 'connector not found' })).toEqual({
      code: 'DISCONNECTED',
      title: 'Wallet Disconnected',
      message: 'Your wallet is not currently connected. Please reconnect and try again.',
      action: 'CONNECT_WALLET'
    });
  });

  it('maps contract execution reverts with reason', () => {
    expect(parseWalletError({ name: 'ContractFunctionRevertedError', message: 'execution reverted with reason: Max supply exceeded.' })).toEqual({
      code: 'REVERTED',
      title: 'Transaction Failed',
      message: 'Max supply exceeded',
      action: 'RETRY'
    });
  });

  it('gracefully handles empty or unknown errors', () => {
    expect(parseWalletError(null)).toEqual({
      code: 'UNKNOWN',
      title: 'Unexpected Error',
      message: 'An unknown wallet error occurred. Please try again.',
      action: 'RETRY'
    });

    expect(parseWalletError({ message: 'Something completely custom' })).toEqual({
      code: 'UNKNOWN',
      title: 'Wallet Error',
      message: 'Something completely custom',
      action: 'RETRY'
    });
  });
});
