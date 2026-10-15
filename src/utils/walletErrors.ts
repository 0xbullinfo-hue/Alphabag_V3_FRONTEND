export type WalletErrorCode =
  | 'USER_REJECTED'
  | 'WRONG_CHAIN'
  | 'INSUFFICIENT_FUNDS'
  | 'RPC_TIMEOUT'
  | 'DISCONNECTED'
  | 'REVERTED'
  | 'UNKNOWN';

export interface ParsedWalletError {
  code: WalletErrorCode;
  title: string;
  message: string;
  action?: 'RETRY' | 'SWITCH_CHAIN' | 'CONNECT_WALLET' | 'GET_FUNDS';
}

export function parseWalletError(error: unknown): ParsedWalletError {
  if (!error) {
    return {
      code: 'UNKNOWN',
      title: 'Unexpected Error',
      message: 'An unknown wallet error occurred. Please try again.',
      action: 'RETRY'
    };
  }

  const err = error as Record<string, any>;
  const rawMsg = err.message || err.details || err.shortMessage || '';
  const msg = rawMsg.toLowerCase();
  const code = err.code ?? err.cause?.code;
  const name = err.name || '';

  // 1. User rejection
  if (
    code === 4001 ||
    code === 'ACTION_REJECTED' ||
    name === 'UserRejectedRequestError' ||
    msg.includes('user rejected') ||
    msg.includes('user denied') ||
    msg.includes('rejected transaction') ||
    msg.includes('user cancelled')
  ) {
    return {
      code: 'USER_REJECTED',
      title: 'Signature Rejected',
      message: 'You declined the transaction or signature request in your wallet.',
      action: 'RETRY'
    };
  }

  // 2. Chain mismatch / Wrong network
  if (
    name === 'ChainMismatchError' ||
    msg.includes('chain mismatch') ||
    msg.includes('wrong network') ||
    msg.includes('switch chain') ||
    msg.includes('unsupported chain')
  ) {
    return {
      code: 'WRONG_CHAIN',
      title: 'Wrong Network',
      message: 'Your wallet is connected to an unsupported network. Please switch to the required chain.',
      action: 'SWITCH_CHAIN'
    };
  }

  // 3. Insufficient gas or funds
  if (
    name === 'InsufficientFundsError' ||
    msg.includes('insufficient funds') ||
    msg.includes('gas required exceeds allowance') ||
    msg.includes('exceeds balance') ||
    msg.includes('balance too low')
  ) {
    return {
      code: 'INSUFFICIENT_FUNDS',
      title: 'Insufficient Balance',
      message: 'Your wallet does not have enough balance to cover the amount and required gas fees.',
      action: 'GET_FUNDS'
    };
  }

  // 4. Timeout
  if (
    name === 'TimeoutError' ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('etimedout')
  ) {
    return {
      code: 'RPC_TIMEOUT',
      title: 'Network Timeout',
      message: 'The RPC node took too long to respond. Please check your connection and retry.',
      action: 'RETRY'
    };
  }

  // 5. Disconnection
  if (
    name === 'ConnectorNotFoundError' ||
    msg.includes('connector not found') ||
    msg.includes('wallet disconnected') ||
    msg.includes('not connected')
  ) {
    return {
      code: 'DISCONNECTED',
      title: 'Wallet Disconnected',
      message: 'Your wallet is not currently connected. Please reconnect and try again.',
      action: 'CONNECT_WALLET'
    };
  }

  // 6. Execution reverted
  if (
    name === 'ContractFunctionRevertedError' ||
    msg.includes('execution reverted') ||
    msg.includes('revert')
  ) {
    const reasonMatch = rawMsg.match(/reason:\s*([^.\n]+)/i);
    const reason = reasonMatch ? reasonMatch[1].trim() : 'Contract call was reverted by the network.';
    return {
      code: 'REVERTED',
      title: 'Transaction Failed',
      message: reason,
      action: 'RETRY'
    };
  }

  // Fallback
  return {
    code: 'UNKNOWN',
    title: 'Wallet Error',
    message: err.shortMessage || err.message || 'An unexpected transaction error occurred.',
    action: 'RETRY'
  };
}
