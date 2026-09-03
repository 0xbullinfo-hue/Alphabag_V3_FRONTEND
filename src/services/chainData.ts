import { DefiPosition,TokenBalance,Transaction } from '../types';
import { api } from './api';

export async function fetchTokenBalances(walletAddress: string, chainId: string | number = 1): Promise<TokenBalance[]> {
  try {
    const res = await api.get('/api/portfolio/balances', {
      params: { address: walletAddress, chain: chainId, chainId }
    });
    const items = res.data?.items || res.data?.tokens || res.data?.data?.items || (Array.isArray(res.data) ? res.data : []);
    return items.map((item: any): TokenBalance => ({
      tokenAddress: item.contract_address || '',
      symbol: item.contract_ticker_symbol || 'UNK',
      name: item.contract_name || 'Unknown Token',
      decimals: item.contract_decimals || 18,
      balance: item.balance ? String(item.balance) : '0',
      guiBalance: Number(item.balance || 0) / Math.pow(10, item.contract_decimals || 18),
      price: item.quote_rate || 0,
      value: (Number(item.balance || 0) / Math.pow(10, item.contract_decimals || 18)) * (item.quote_rate || 0),
      logo: item.logo_url,
      chain: String(chainId) === '56' ? 'BSC' : String(chainId) === '1399811149' ? 'SOL' : 'ETH',
      isMockData: !!item._is_mock
    }));
  } catch (err) {
    console.error('[chainData] Failed to fetch balances:', err);
    return [];
  }
}

export const chainData = {
    async getTransactionHistory(address: string, chainId: number = 1): Promise<Transaction[]> {
        try {
            const response = await api.get('/api/portfolio/transactions', {
                params: { address, chainId }
            });
            const items = response.data?.items || response.data?.data?.items || [];

            return items.map((item: any): Transaction => ({
                id: item.tx_hash,
                type: 'TRANSFER',
                coin: 'ETH',
                price: 0,
                amount: 0,
                date: item.block_signed_at,
                value: item.value_quote || 0,
                hash: item.tx_hash,
                from: item.from_address,
                to: item.to_address,
                fee: item.gas_quote || 0,
                status: item.successful ? 'CONFIRMED' : 'FAILED',
                chain: chainId === 56 ? 'BSC' : chainId === 1399811149 ? 'SOL' : 'ETH'
            }));
        } catch (e) {
            console.error("Transaction Fetch Error - Using Mock Data", e);
            return this._getMockTransactions().map(tx => ({ ...tx, isMockData: true }));
        }
    },

    async getBalances(address: string, chainId: number = 1): Promise<any[]> {
        try {
            const response = await api.get('/api/portfolio/balances', {
                params: { address, chainId }
            });
            const items = response.data?.items || response.data?.tokens || response.data?.data?.items || [];
            return Array.isArray(items) ? items : [];
        } catch (e) {
            console.warn(`Balance Fetch Error (${chainId}) - Using Mock Data`, e);
            return this._getMockBalances(chainId).map(item => ({ ...item, _is_mock: true }));
        }
    },

    async getMultiChainBalances(address: string): Promise<TokenBalance[]> {
        const chains = [1, 56, 137, 42161, 43114, 8453, 10, 1399811149];

        try {
            const perChainResults = await Promise.all(
                chains.map(async chainId => {
                    const items = await this.getBalances(address, chainId);
                    return items.map(item => ({ ...item, chainId }));
                })
            );
            const allItems = perChainResults.flat();

            const tokens: TokenBalance[] = allItems.map((item: any) => {
                return {
                    symbol: item.contract_ticker_symbol || 'UNK',
                    name: item.contract_name || 'Unknown',
                    decimals: item.contract_decimals || 18,
                    balance: item.balance,
                    guiBalance: Number(item.balance) / Math.pow(10, item.contract_decimals || 18),
                    tokenAddress: item.contract_address,
                    logo: item.logo_url,
                    price: item.quote_rate || 0,
                    value: item.quote || 0,
                    chain: item.chainId === 1 ? 'ETH' :
                        item.chainId === 56 ? 'BSC' :
                            item.chainId === 1399811149 ? 'SOL' :
                                item.chainId === 8453 ? 'BASE' :
                                    item.chainId === 43114 ? 'AVAX' :
                                        item.chainId === 42161 ? 'ARB' : 'ETH',
                    isMockData: !!item._is_mock,
                };
            });
            return tokens;

        } catch (e) {
            console.error("Multi-Chain Fetch Error", e);
            return [];
        }
    },

    async getDefiPositions(address: string): Promise<DefiPosition[]> {
        const allTokens = await this.getMultiChainBalances(address);

        return allTokens.filter(t => {
            const name = t.name.toLowerCase();
            const symbol = t.symbol.toLowerCase();
            return name.includes('aave') ||
                name.includes('curve') ||
                name.includes('uniswap') ||
                name.includes('pancakeswap') ||
                name.includes('lido') ||
                name.includes('staked') ||
                symbol.startsWith('a') ||
                symbol.startsWith('c') ||
                symbol.includes('lp');
        }).map((t, idx) => {
            let type: 'Lending' | 'Liquidity' | 'Staking' | 'Farming' | 'Governance' = 'Staking';
            let protocol = 'Unknown';
            let apy = 0;

            if (t.name.toLowerCase().includes('aave') || t.symbol.startsWith('a')) {
                type = 'Lending';
                protocol = 'Aave V3';
                apy = 4.5;
            } else if (t.name.toLowerCase().includes('uniswap') || t.symbol.includes('lp')) {
                type = 'Liquidity';
                protocol = 'Uniswap V3';
                apy = 12.5;
            } else if (t.name.toLowerCase().includes('lido') || t.symbol.includes('st')) {
                type = 'Staking';
                protocol = 'Lido';
                apy = 3.8;
            } else if (t.name.toLowerCase().includes('pancake')) {
                type = 'Farming';
                protocol = 'PancakeSwap';
                apy = 42.0;
            }

            return {
                id: `defi-${idx}-${t.tokenAddress}`,
                protocol,
                name: t.name,
                icon: t.logo || '',
                chain: (t.chain || 'ETH') as any,
                type,
                apy,
                balance: t.value || 0,
                healthFactor: type === 'Lending' ? 1.65 : undefined
            };
        });
    },

    _getMockTransactions(): Transaction[] {
        const now = new Date();
        return [
            {
                id: '0x123...abc',
                type: 'SWAP',
                coin: 'ETH',
                price: 3200,
                amount: 0.5,
                date: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
                value: 1600,
                hash: '0x712...982',
                from: '0xUserWallet...123',
                to: '0xUniswap...Router',
                fee: 12.50,
                status: 'CONFIRMED',
                chain: 'ETH'
            },
            {
                id: '0x456...def',
                type: 'BUY',
                coin: 'ETH',
                price: 3200,
                amount: 0.1,
                date: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
                value: 320,
                hash: '0x891...231',
                from: '0xUserWallet...123',
                to: '0xOpenSea...Market',
                fee: 8.20,
                status: 'CONFIRMED',
                chain: 'ETH'
            },
            {
                id: '0x789...ghi',
                type: 'TRANSFER',
                coin: 'USDC',
                price: 1,
                amount: 5000,
                date: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
                value: 5000,
                hash: '0x555...111',
                from: '0xCoinbase...Hot',
                to: '0xUserWallet...123',
                fee: 0,
                status: 'CONFIRMED',
                chain: 'ETH'
            }
        ];
    },

    _getMockBalances(chainId: number): any[] {
        if (chainId === 1) {
            return [
                { contract_ticker_symbol: 'ETH', contract_name: 'Ethereum', contract_decimals: 18, balance: '1250000000000000000', quote: 4000, logo_url: 'https://logos.covalenthq.com/tokens/1/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png' },
                { contract_ticker_symbol: 'USDC', contract_name: 'USD Coin', contract_decimals: 6, balance: '5000000000', quote: 5000, logo_url: 'https://logos.covalenthq.com/tokens/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png' },
                { contract_ticker_symbol: 'PEPE', contract_name: 'Pepe', contract_decimals: 18, balance: '5000000000000000000000000', quote: 850, logo_url: 'https://logos.covalenthq.com/tokens/1/0x6982508145454ce325ddbe47a25d4ec3d2311933.png' }
            ];
        }
        if (chainId === 1399811149) {
            return [
                { contract_ticker_symbol: 'SOL', contract_name: 'Solana', contract_decimals: 9, balance: '15500000000', quote: 2200, logo_url: 'https://logos.covalenthq.com/tokens/1399811149/0x11111111111111111111111111111111.png' },
                { contract_ticker_symbol: 'JUP', contract_name: 'Jupiter', contract_decimals: 6, balance: '5000000000', quote: 600, logo_url: 'https://logos.covalenthq.com/tokens/1399811149/JUPyiwrYJFskUPiHa7hkeR8VUtkCwH93orp1bnwi3Q5.png' }
            ];
        }
        return [];
    }
};
