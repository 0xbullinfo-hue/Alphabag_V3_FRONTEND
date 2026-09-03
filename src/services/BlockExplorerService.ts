import { api } from './api';

/**
 * BlockExplorerService - Real Transaction History
 * Fetches actual transaction data from Etherscan or BscScan APIs
 *
 * Features:
 * - Real transaction history (no more mocks)
 * - Support for multiple chains (ETH, BSC)
 * - Error handling with fallback
 * - Rate limiting considerations
 */
export class BlockExplorerService {
  /**
   * Get transaction history for a wallet address
   * @param address - Wallet address
   * @param chainId - Chain ID (1 for Ethereum, 56 for BSC)
   * @param limit - Max transactions to return (default: 20)
   * @returns Array of transaction objects
   */
  static async getTransactionHistory(
    address: string,
    chainId: number = 1,
    limit: number = 20
  ): Promise<any[]> {
    try {
      // Get appropriate proxy base URL
      const baseUrl = '/api/proxy';
      const proxyEndpoint = chainId === 56 ? 'bscscan' : 'etherscan';

      if (!address || !address.startsWith('0x')) {
        console.error('[BlockExplorerService] Invalid wallet address');
        return [];
      }

      console.log(`[BlockExplorerService] Fetching tx history for ${address.substring(0, 6)}... on chain ${chainId}`);

      const response = await api.get(
        `${baseUrl}/${proxyEndpoint}?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=${limit}`
      );

      const data = response.data;

      if (data.status === '1' && data.result) {
        const transactions = data.result.slice(0, limit);

        console.log(`[BlockExplorerService] Found ${transactions.length} transactions`);

        // Transform to consistent format
        return transactions.map((tx: any) => ({
          hash: tx.hash,
          timestamp: parseInt(tx.timeStamp),
          from: tx.from,
          to: tx.to,
          value: tx.value,
          gasUsed: tx.gasUsed,
          gasPrice: tx.gasPrice,
          isError: tx.isError,
          blockNumber: tx.blockNumber,
          confirmations: tx.confirmations,
          // Add USD value if available (would need price API integration)
          usd_value: null, // TODO: Integrate with price API
          symbol: chainId === 56 ? 'BNB' : 'ETH',
          chainId
        }));
      }

      console.log('[BlockExplorerService] No transactions found or API error');
      return [];
    } catch (error) {
      console.error('[BlockExplorerService] Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Get ERC20 token balance for an address
   * @param address - Wallet address
   * @param tokenAddress - Token contract address
   * @param chainId - Chain ID
   * @returns Token balance as string (wei format)
   */
  static async getTokenBalance(
    address: string,
    tokenAddress: string,
    chainId: number = 1
  ): Promise<string> {
    try {
      const baseUrl = '/api/proxy';
      const proxyEndpoint = chainId === 56 ? 'bscscan' : 'etherscan';

      console.log(`[BlockExplorerService] Fetching token balance for ${address.substring(0, 6)}...`);

      const response = await api.get(
        `${baseUrl}/${proxyEndpoint}?module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${address}&tag=latest`
      );

      const data = response.data;

      if (data.status === '1') {
        console.log(`[BlockExplorerService] Token balance: ${data.result}`);
        return data.result || '0';
      }

      return '0';
    } catch (error) {
      console.error('[BlockExplorerService] Error fetching token balance:', error);
      return '0';
    }
  }

  /**
   * Get ERC20 token transactions for an address
   * @param address - Wallet address
   * @param tokenAddress - Token contract address (optional)
   * @param chainId - Chain ID
   * @returns Array of ERC20 token transactions
   */
  static async getTokenTransactions(
    address: string,
    tokenAddress: string | null = null,
    chainId: number = 1
  ): Promise<any[]> {
    try {
      const baseUrl = '/api/proxy';
      const proxyEndpoint = chainId === 56 ? 'bscscan' : 'etherscan';

      let url = `${baseUrl}/${proxyEndpoint}?module=account&action=tokentx&address=${address}&sort=desc`;

      if (tokenAddress) {
        url += `&contractaddress=${tokenAddress}`;
      }

      console.log(`[BlockExplorerService] Fetching token tx for ${address.substring(0, 6)}...`);

      const response = await api.get(url);
      const data = response.data;

      if (data.status === '1' && data.result) {
        const transactions = data.result.slice(0, 50); // Limit to 50

        console.log(`[BlockExplorerService] Found ${transactions.length} token transactions`);

        return transactions.map((tx: any) => ({
          hash: tx.hash,
          timestamp: parseInt(tx.timeStamp),
          from: tx.from,
          to: tx.to,
          value: tx.value,
          tokenName: tx.tokenName,
          tokenSymbol: tx.tokenSymbol,
          tokenDecimal: tx.tokenDecimal,
          contractAddress: tx.contractAddress,
          usd_value: null, // Would need price API
          chainId
        }));
      }

      return [];
    } catch (error) {
      console.error('[BlockExplorerService] Error fetching token transactions:', error);
      return [];
    }
  }

  /**
   * Get account balance (native token)
   * @param address - Wallet address
   * @param chainId - Chain ID
   * @returns Balance in wei as string
   */
  static async getAccountBalance(address: string, chainId: number = 1): Promise<string> {
    try {
      const baseUrl = '/api/proxy';
      const proxyEndpoint = chainId === 56 ? 'bscscan' : 'etherscan';

      const response = await api.get(
        `${baseUrl}/${proxyEndpoint}?module=account&action=balance&address=${address}&tag=latest`
      );

      const data = response.data;

      if (data.status === '1') {
        return data.result || '0';
      }

      return '0';
    } catch (error) {
      console.error('[BlockExplorerService] Error fetching account balance:', error);
      return '0';
    }
  }
}
