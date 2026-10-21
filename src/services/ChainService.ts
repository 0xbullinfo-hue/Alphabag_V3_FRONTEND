import { TokenBalance } from '../types';
import { api } from './api';

export const ChainService = {
    /**
     * Get multi-chain balances via Covalent / CoinStats (loads all ERC-20 tokens, not just native assets)
     */
    getMultiChainBalances: async (address: string, chain?: string): Promise<TokenBalance[]> => {
        try {
            if (!address || !address.trim()) {
                console.warn("ChainService: Invalid address provided");
                return [];
            }

            console.log(`[ChainService] Fetching multi-chain balances for address: ${address.substring(0, 10)}... (${chain || 'all'})`);
            
            const params: Record<string, string> = { address };
            if (chain && chain !== 'ALL') {
                params.chains = chain.toLowerCase();
            }

            const response = await api.get('/api/portfolio/public-balances', {
                params,
            });
            const tokens = (response.data?.tokens || []).map((token: any): TokenBalance => ({
                symbol: token.symbol || 'UNK',
                name: token.name || 'Unknown Token',
                decimals: token.decimals,
                balance: String(token.balance || '0'),
                guiBalance: Number(token.balance || 0),
                price: token.priceUSD != null ? Number(token.priceUSD) : undefined,
                value: token.valueUSD != null ? Number(token.valueUSD) : undefined,
                tokenAddress: token.contractAddress,
                contractAddress: token.contractAddress,
                logo: token.logo,
                chain: token.chain,
                priceUSD: token.priceUSD != null ? Number(token.priceUSD) : undefined,
                valueUSD: token.valueUSD != null ? Number(token.valueUSD) : undefined,
                change24h: token.change24h != null ? Number(token.change24h) : undefined,
            }));
            
            console.log(`[ChainService] Successfully retrieved ${tokens.length} balances via /public-balances`);
            return tokens;
        } catch (e: any) {
            console.error("[ChainService] Multi-chain balance fetch failed:", e?.message);
            return [];
        }
    }
};
