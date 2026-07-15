import { api } from './api';
import { TokenBalance } from '../types';
import { chainData } from './chainData';

export const ChainService = {
    /**
     * Get multi-chain balances via Covalent (loads all ERC-20 tokens, not just native assets)
     */
    getMultiChainBalances: async (address: string): Promise<TokenBalance[]> => {
        try {
            if (!address || !address.trim()) {
                console.warn("ChainService: Invalid address provided");
                return [];
            }

            console.log(`[ChainService] Fetching multi-chain balances for address: ${address.substring(0, 10)}...`);
            
            // Query Covalent directly on client-side for full ERC-20 and native tokens
            const tokens = await chainData.getMultiChainBalances(address);
            
            console.log(`[ChainService] Successfully retrieved ${tokens.length} balances via Covalent`);
            return tokens;
        } catch (e: any) {
            console.error("[ChainService] Multi-chain balance fetch failed:", e?.message);
            return [];
        }
    }
};
