// WhaleService.ts - Fetch transactions and alerts for watched wallets



export interface WhaleTransaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    timeStamp: string;
    tokenSymbol?: string;
    tokenDecimal?: string;
}

export const WhaleService = {
    /**
     * Get recent transactions for a wallet address
     */
    getRecentTransactions: async (address: string, chainId: number = 56): Promise<WhaleTransaction[]> => {
        try {
            const { api } = await import('./api');
            return (await api.get(`/api/whales/address/${address}/transactions`, { params: { chainId } })).data;
        } catch (error) {
            console.error("WhaleService Error:", error);
            return [];
        }
    },

    getMultiChainTransactions: async (address: string): Promise<WhaleTransaction[]> => {
        if (!address.startsWith('0x')) return [];

        const supportedChains = [1, 56, 137, 42161, 43114, 8453];
        const results = await Promise.all(
            supportedChains.map(chainId => WhaleService.getRecentTransactions(address, chainId))
        );

        // Flatten and Sort by Timestamp Descending
        return results.flat().sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp));
    },

    /**
     * Analyze transactions for "Whale Alerts" (Large movements)
     */
    analyzeForAlerts: (transactions: WhaleTransaction[], thresholdUsd: number = 10000) => {
        const ESTIMATED_PRICES: Record<string, number> = {
            ETH: 3400,
            BNB: 580,
            SOL: 160,
            USDT: 1.0,
            USDC: 1.0,
            DAI: 1.0,
            BUSD: 1.0,
            FDUSD: 1.0,
            BTC: 65000,
            WBTC: 65000,
            BAG: 0.1 // Estimated price of BAG token
        };

        return transactions.filter(tx => {
            const symbol = tx.tokenSymbol?.toUpperCase() || 'ETH';
            const valueNum = parseFloat(tx.value) || 0;
            const price = ESTIMATED_PRICES[symbol] || 1.0; // Default to $1 if unknown token
            const usdValue = valueNum * price;
            return usdValue >= thresholdUsd;
        });
    }
};
