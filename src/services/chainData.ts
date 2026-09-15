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
            console.error("Transaction Fetch Error", e);
            return [];
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
            console.warn(`Balance Fetch Error (${chainId})`, e);
            return [];
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
    }
};

