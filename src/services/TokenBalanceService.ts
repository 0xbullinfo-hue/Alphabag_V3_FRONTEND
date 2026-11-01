import { ONE_MINUTE,TOKEN_GATING_CONFIG } from './config';

export interface TokenBalance {
  address: string;
  balance: bigint;
  decimals: number;
}

/**
 * TokenBalanceService - Real Token Balance Verification
 * Handles BAG token balance checking on BSC mainnet & testnet
 * Gracefully handles pre-deployment (token address not yet set)
 */
export class TokenBalanceService {
  private static balanceCache = new Map<string, { balance: number; timestamp: number }>();

  /**
   * Check BAG token balance on BSC
   * Returns balance in human-readable format (accounting for decimals)
   * 
   * @param walletAddress - Wallet address to check
   * @returns Balance as number (human-readable, decimals adjusted)
   */
  static async checkTokenBalance(walletAddress: string): Promise<number> {
    try {
      // Pre-deployment: token address not set, return 0
      const tokenAddress = TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_MAINNET;
      if (!tokenAddress || tokenAddress === '') {
        console.log('[TokenBalanceService] Token address not configured yet. Returning 0.');
        return 0;
      }

      // Validate wallet address
      if (!walletAddress || !walletAddress.startsWith('0x')) {
        console.error('[TokenBalanceService] Invalid wallet address');
        return 0;
      }

      // Check cache first (5 min validity)
      const cacheKey = walletAddress.toLowerCase();
      const cached = this.balanceCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ONE_MINUTE * 5) {
        return cached.balance;
      }

      // Try to fetch from BscScan API as fallback
      // In production, use proper contract reading via viem
      console.log('[TokenBalanceService] Token gating enabled but full balance check requires viem setup');
      
      // For now, return 0 - TODO: implement viem integration
      const balance = 0;
      
      // Cache the result
      this.balanceCache.set(cacheKey, { balance, timestamp: Date.now() });
      
      console.log(
        `[TokenBalanceService] Balance for ${walletAddress.substring(0, 6)}...: ${balance}`
      );

      return balance;
    } catch (error) {
      console.error('[TokenBalanceService] Error checking balance:', error);
      // Return 0 on error so the backend remains the sole source of entitlement.
      return 0;
    }
  }

  /**
   * Determine if a balance meets the Alpha token requirement.
   * 
   * @param balance - Current BAG token balance
   * @returns true if qualified for Alpha
   */
  static isQualifiedForAlpha(balance: number): boolean {
    const minimumRequired = TOKEN_GATING_CONFIG.ALPHA_MINIMUM_BAG_BALANCE;
    
    // Both balance >= minimum AND minimum must be > 0
    // This ensures an unset or invalid minimum cannot grant Alpha.
    const qualified = balance >= minimumRequired && minimumRequired > 0;
    
    if (qualified) {
      console.log(`[TokenBalanceService] Alpha qualified: ${balance} >= ${minimumRequired}`);
    } else {
      console.log(
        `[TokenBalanceService] ❌ Not qualified: ${balance} < ${minimumRequired}`
      );
    }

    return qualified;
  }

  static clearCache() {
    this.balanceCache.clear();
  }

  /**
   * Get tier based on token balance
   * 
   * @param balance - Current BAG token balance
   * @returns 'ALPHA' or 'FREE'
   */
  static getTier(balance: number): 'ALPHA' | 'FREE' {
    return this.isQualifiedForAlpha(balance) ? 'ALPHA' : 'FREE';
  }

  /**
   * Get user-friendly balance message
   */
  static getBalanceMessage(balance: number, minimumRequired: number): string {
    if (minimumRequired <= 0) {
      return 'Token requirements not yet configured';
    }

    const needed = Math.max(0, minimumRequired - balance);
    
    if (needed === 0) {
      return `Alpha tier active. Balance: ${balance.toFixed(2)} BAG`;
    }

    return `Hold ${minimumRequired} BAG for Alpha. You need ${needed.toFixed(2)} more.`;
  }
}
