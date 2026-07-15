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

// Helper for Solana
const fetchSolanaTransactions = async (address: string): Promise<WhaleTransaction[]> => {
    const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY;
    if (!MORALIS_API_KEY) return [];

    try {
        const splUrl = `https://solana-gateway.moralis.io/account/mainnet/${address}/transfers?limit=20`;
        const response = await fetch(splUrl, {
            headers: { 'accept': 'application/json', 'X-API-Key': MORALIS_API_KEY }
        });

        if (response.ok) {
            const data = await response.json();
            return data.map((tx: any) => ({
                hash: tx.signature,
                from: tx.from_address || 'System',
                to: tx.to_address || 'System',
                value: (Number(tx.value) / 1e9).toFixed(4),
                timeStamp: (new Date(tx.blockTime * 1000).getTime() / 1000).toString(),
                tokenSymbol: 'SOL',
                tokenDecimal: '9'
            }));
        }
        return [];
    } catch (e) {
        console.warn("Moralis Solana TX Fetch Failed", e);
        return [];
    }
};

export const WhaleService = {
    /**
     * Get recent transactions for a wallet address
     */
    getRecentTransactions: async (address: string, chainId: number = 56): Promise<WhaleTransaction[]> => {
        const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY;

        // Handle Solana Specifically
        if (chainId === 1399811149) {
            return fetchSolanaTransactions(address);
        }

        // 1. Try Moralis (Preferred as we have the key)
        if (MORALIS_API_KEY) {
            try {
                const chainHex = `0x${chainId.toString(16)}`;
                // Fetch ERC20 Transfers
                const url = `https://deep-index.moralis.io/api/v2.2/${address}/erc20/transfers?chain=${chainHex}&order=DESC&limit=20`;

                const response = await fetch(url, {
                    headers: { 'accept': 'application/json', 'X-API-Key': MORALIS_API_KEY }
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.result.map((tx: any) => ({
                        hash: tx.transaction_hash,
                        from: tx.from_address,
                        to: tx.to_address,
                        value: (Number(tx.value) / Math.pow(10, Number(tx.token_decimals))).toFixed(4),
                        timeStamp: (new Date(tx.block_timestamp).getTime() / 1000).toString(),
                        tokenSymbol: tx.token_symbol,
                        tokenDecimal: tx.token_decimals
                    }));
                }
            } catch (e) {
                console.warn("Moralis TX Fetch Failed, trying explorers...", e);
            }
        }

        // 2. Fallback to Etherscan/BscScan (Legacy)
        let url = '';
        const baseUrl = '/api/proxy';

        if (chainId === 56) {
            url = `${baseUrl}/bscscan?module=account&action=tokentx&address=${address}&page=1&offset=20&sort=desc`;
        } else if (chainId === 1) {
            url = `${baseUrl}/etherscan?module=account&action=tokentx&address=${address}&page=1&offset=20&sort=desc`;
        }

        try {
            const { api } = await import('./api');
            const response = await api.get(url);
            const data = response.data;

            if (data.status === '1' && Array.isArray(data.result)) {
                return data.result.map((tx: any) => ({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: tx.value,
                    timeStamp: tx.timeStamp,
                    tokenSymbol: tx.tokenSymbol,
                    tokenDecimal: tx.tokenDecimal
                }));
            }
            return [];
        } catch (error) {
            console.error("WhaleService Error:", error);
            return [];
        }
    },

    getMultiChainTransactions: async (address: string): Promise<WhaleTransaction[]> => {
        // Detect Solana
        if (!address.startsWith('0x')) {
            return fetchSolanaTransactions(address);
        }

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
