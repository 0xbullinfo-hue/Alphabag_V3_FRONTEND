import { useQuery } from '@tanstack/react-query';
import { ChevronRight,ExternalLink,Layers,RefreshCw,TrendingDown,TrendingUp,Wallet2 } from 'lucide-react';
import React,{ useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { api } from '../../services/api';
import { TokenBalance } from '../../types';
import { getExplorerTokenUrl } from '../../lib/formatters';

const CHAIN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  eth: { label: 'ETH', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  bsc: { label: 'BSC', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  sol: { label: 'SOL', color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

const fetchDexBalances = async (address: string): Promise<TokenBalance[]> => {
  const res = await api.get('/api/portfolio/public-balances', { params: { address } });
  const data = res.data?.tokens || res.data || [];
  return Array.isArray(data) ? data : [];
};

export const DexBag: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [filterChain, setFilterChain] = useState('ALL');

  const {
    data: rawBalances = [],
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['portfolio', 'dex', address],
    queryFn: () => fetchDexBalances(address!),
    enabled: !!address && isConnected,
    staleTime: 60_000,
  });

  const safeBalances = isConnected && Array.isArray(rawBalances) ? rawBalances : [];
  const totalUSD = safeBalances.reduce((sum, t) => sum + (t?.valueUSD != null ? t.valueUSD : 0), 0);
  const filtered = filterChain === 'ALL' ? safeBalances : safeBalances.filter((t) => t?.chain === filterChain);
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();

  return (
    <div className="space-y-2 animate-in fade-in duration-700 pb-20">
      <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-black">
              <Wallet2 size={20} />
            </div>
            <h1 className="text-3xl font-black text-alphabag-text tracking-tight uppercase">DEX Portfolio</h1>
          </div>
          <p className="text-alphabag-subtext text-xs font-medium mt-0.5 uppercase tracking-widest">On-chain token holdings — read only</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterChain}
            onChange={(e) => setFilterChain(e.target.value)}
            className="bg-alphabag-black border border-alphabag-gray rounded-lg px-3 py-1.5 text-xs text-alphabag-text focus:border-alphabag-yellow outline-none font-semibold uppercase"
          >
            <option value="ALL">All Chains</option>
            <option value="eth">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="sol">Solana</option>
          </select>
          <button
            onClick={() => refetch()}
            disabled={isLoading || !isConnected}
            className="bg-alphabag-gray text-alphabag-text border border-alphabag-muted rounded-lg px-3 py-1.5 hover:bg-alphabag-muted transition-all disabled:opacity-40 flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5">
          <p className="text-alphabag-subtext text-[10px] font-black uppercase tracking-widest mb-1">Total DEX Value</p>
          <p className="text-2xl font-black text-alphabag-text">
            ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-alphabag-subtext text-[10px] mt-1 font-mono">
            {isConnected && address ? `${address.slice(0, 6)}···${address.slice(-4)}` : 'No wallet connected'}
          </p>
        </div>
        <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5">
          <p className="text-alphabag-subtext text-[10px] font-black uppercase tracking-widest mb-1">Token Count</p>
          <p className="text-2xl font-black text-alphabag-text">{filtered.length}</p>
          <p className="text-alphabag-subtext text-[10px] mt-1 font-medium uppercase">
            {isConnected ? 'Assets detected' : 'Connect wallet to view'}
          </p>
        </div>
        <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5">
          <p className="text-alphabag-subtext text-[10px] font-black uppercase tracking-widest mb-1">Last Synced</p>
          <p className="text-sm font-black text-alphabag-text">{isConnected && dataUpdatedAt ? lastUpdated.toLocaleTimeString() : '—'}</p>
          <p className="text-alphabag-subtext text-[10px] mt-1 font-medium uppercase">
            {isConnected ? 'Refreshes every 60s' : 'Waiting for connection'}
          </p>
        </div>
      </div>

      {!isConnected && (
        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-12 text-center">
          <Wallet2 size={48} className="mx-auto mb-4 text-alphabag-yellow opacity-40" />
          <h3 className="text-lg font-black text-alphabag-text uppercase tracking-tight mb-1">No Wallet Connected</h3>
          <p className="text-alphabag-subtext text-xs max-w-md mx-auto mb-6">
            Connect your Web3 wallet to inspect your real-time on-chain token balances, prices, and valuations across Ethereum, BSC, and Solana.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}
            className="bg-alphabag-yellow text-alphabag-black font-black text-xs uppercase px-6 py-3 rounded-lg hover:bg-yellow-400 transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-alphabag-yellow/10"
          >
            <Wallet2 size={16} /> Connect Wallet
          </button>
        </div>
      )}

      {isConnected && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-sm font-black text-red-400 uppercase tracking-wide">Failed to load DEX holdings</p>
          <p className="text-alphabag-subtext text-xs mt-1">Unable to connect to on-chain balance provider. Please check your network and try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 bg-alphabag-gray hover:bg-alphabag-muted text-alphabag-text font-bold text-xs uppercase px-4 py-2 rounded-lg transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {isConnected && !error && (
        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray overflow-hidden">
          <div className="px-6 py-4 border-b border-alphabag-gray flex items-center gap-2">
            <Layers size={16} className="text-alphabag-yellow" />
            <span className="text-xs font-black uppercase tracking-widest text-alphabag-text">On-Chain Holdings</span>
            <span className="ml-auto text-[10px] text-alphabag-subtext font-mono uppercase tracking-widest">Read-Only View</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-alphabag-black text-alphabag-subtext text-[10px] uppercase tracking-wider font-black border-b border-alphabag-gray">
                <tr>
                  <th className="p-4 pl-6">Asset</th>
                  <th className="p-4">Chain</th>
                  <th className="p-4 text-right">Balance</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4 text-right">24h</th>
                  <th className="p-4 text-right">Value</th>
                  <th className="p-4 text-center">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-alphabag-gray text-sm">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4 pl-6"><div className="h-4 w-24 bg-alphabag-gray rounded" /></td>
                      <td className="p-4"><div className="h-4 w-10 bg-alphabag-gray rounded" /></td>
                      <td className="p-4 text-right"><div className="h-4 w-16 bg-alphabag-gray rounded ml-auto" /></td>
                      <td className="p-4 text-right"><div className="h-4 w-14 bg-alphabag-gray rounded ml-auto" /></td>
                      <td className="p-4 text-right"><div className="h-4 w-10 bg-alphabag-gray rounded ml-auto" /></td>
                      <td className="p-4 text-right"><div className="h-4 w-16 bg-alphabag-gray rounded ml-auto" /></td>
                      <td className="p-4"><div className="h-4 w-8 bg-alphabag-gray rounded mx-auto" /></td>
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((token, i) => {
                    const chain = CHAIN_LABELS[token.chain || ''] || { label: token.chain?.toUpperCase() || '—', color: 'text-alphabag-subtext', bg: 'bg-white/5' };
                    const isPositive = (token.change24h || 0) >= 0;
                    return (
                      <tr key={`${token.contractAddress}-${i}`} className="hover:bg-alphabag-gray/40 transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-2">
                            {token.logo ? (
                              <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full bg-alphabag-gray" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-alphabag-yellow/10 flex items-center justify-center">
                                <span className="text-alphabag-yellow font-black text-[10px]">{token.symbol?.slice(0, 2)}</span>
                              </div>
                            )}
                            <div>
                              <div className="font-black text-alphabag-text text-xs uppercase">{token.symbol}</div>
                              <div className="text-alphabag-subtext text-[10px] font-medium truncate max-w-[120px]">{token.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${chain.bg} ${chain.color} uppercase`}>{chain.label}</span>
                        </td>
                        <td className="p-4 text-right font-mono text-alphabag-text text-xs font-bold">{parseFloat(token.balance || '0').toLocaleString()}</td>
                        <td className="p-4 text-right text-alphabag-subtext text-xs font-mono">{token.priceUSD != null ? `$${token.priceUSD.toFixed(4)}` : '—'}</td>
                        <td className="p-4 text-right">
                          <span className={`text-xs font-black flex items-center justify-end gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isPositive ? '+' : ''}{(token.change24h || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-alphabag-text text-xs">{token.valueUSD != null ? `$${token.valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</td>
                        <td className="p-4 text-center">
                          {token.contractAddress && (
                            <a href={getExplorerTokenUrl(token.chain || '', token.contractAddress || '')} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity text-alphabag-subtext hover:text-alphabag-yellow">
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <Wallet2 size={40} className="mx-auto mb-3 text-alphabag-subtext opacity-20" />
                      <p className="text-alphabag-subtext font-black uppercase tracking-widest text-xs">No DEX tokens found for this wallet.</p>
                      <p className="text-alphabag-subtext text-[10px] mt-1">Try switching chain filter or refreshing.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-alphabag-gray flex justify-between items-center">
              <span className="text-[10px] text-alphabag-subtext font-medium uppercase tracking-wider">{filtered.length} token{filtered.length !== 1 ? 's' : ''} · Read-only · Prices via Alchemy</span>
              <Link to="/portfolio" className="text-[10px] text-alphabag-yellow font-black uppercase tracking-widest hover:underline flex items-center gap-1">Full Portfolio View <ChevronRight size={11} /></Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
