import { TokenBalance } from '../types';
import { api } from './api';

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
            
            const response = await api.get('/api/portfolio/public-balances', {
                params: { address },
            });
            const tokens = (response.data?.tokens || []).map((token: any): TokenBalance => ({
                symbol: token.symbol || 'UNK',
                name: token.name || 'Unknown Token',
                decimals: token.decimals,
                balance: String(token.balance || '0'),
                guiBalance: Number(token.balance || 0),
                price: Number(token.priceUSD || 0),
                value: Number(token.valueUSD || 0),
                tokenAddress: token.contractAddress,
                contractAddress: token.contractAddress,
                logo: token.logo,
                chain: token.chain,
                priceUSD: Number(token.priceUSD || 0),
                valueUSD: Number(token.valueUSD || 0),
                change24h: Number(token.change24h || 0),
            }));
            
            console.log(`[ChainService] Successfully retrieved ${tokens.length} balances via Covalent`);
            return tokens;
        } catch (e: any) {
            console.error("[ChainService] Multi-chain balance fetch failed:", e?.message);
            return [];
        }
    }
};
