import React, { useEffect, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { chainData } from '../../services/chainData';
import { Transaction } from '../../types';
import { History, ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const getExplorerLink = (chain: string, hash: string) => {
    if (chain.includes('bsc')) return `https://bscscan.com/tx/${hash}`;
    if (chain.includes('sol')) return `https://solscan.io/tx/${hash}`;
    return `https://etherscan.io/tx/${hash}`;
};

export const HistoryPage: React.FC = () => {
    const { trackedWallets } = useWallet();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterChain, setFilterChain] = useState<string>('ALL');

    useEffect(() => {
        const loadHistory = async () => {
            setLoading(true);
            try {
                // Deduplicate addresses
                const uniqueAddresses = Array.from(new Set(trackedWallets.map(w => w.address))).slice(0, 3);

                // Fetch from all chains (chainData handles multi-chain internally per address)
                const results = await Promise.all(uniqueAddresses.map(address => chainData.getTransactionHistory(address)));
                const allTx = results.flat();

                // Sort by date desc
                allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setTransactions(allTx);
            } catch (e) {
                console.error("Failed to load history", e);
            } finally {
                setLoading(false);
            }
        };

        if (trackedWallets.length > 0) {
            loadHistory();
        }
    }, [trackedWallets]);

    const safeTxs = Array.isArray(transactions) ? transactions : [];
    const filteredTxs = filterChain === 'ALL' ? safeTxs : safeTxs.filter(tx => tx?.chain?.includes(filterChain.toLowerCase()));
    const hasMockData = safeTxs.some(tx => tx?.isMockData);

    return (
        <div className="space-y-2 animate-in fade-in duration-700 pb-20">
            {hasMockData && (
                <div className="rounded-lg border border-alphabag-yellow/30 bg-alphabag-yellow/10 px-4 py-2.5 text-xs text-alphabag-yellow font-bold uppercase tracking-wide">
                    Demo data shown — live transaction sync is unavailable right now. These entries are not your real transaction history.
                </div>
            )}
            <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-black">
                            <History size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">Transaction History</h1>
                    </div>
                    <p className="text-alphabag-subtext text-xs font-medium mt-0.5">Immutable ledger of all portfolio activity</p>
                </div>
                <div className="flex space-x-2">
                    <select
                        value={filterChain}
                        onChange={(e) => setFilterChain(e.target.value)}
                        className="bg-alphabag-black border border-alphabag-gray rounded-md px-3 py-1.5 text-xs text-alphabag-text focus:border-alphabag-yellow outline-none uppercase font-semibold"
                    >
                        <option value="ALL">All Networks</option>
                        <option value="eth">Ethereum</option>
                        <option value="bsc">BSC</option>
                        <option value="sol">Solana</option>
                    </select>
                    <button onClick={() => window.location.reload()} className="bg-alphabag-gray text-alphabag-text border border-alphabag-muted rounded-md px-3 py-1.5 hover:bg-alphabag-muted transition-all">
                        <RefreshCw size={13} />
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-alphabag-gray bg-alphabag-darkgray overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-alphabag-black text-alphabag-subtext text-[10px] uppercase tracking-wider font-semibold border-b border-alphabag-gray">
                            <tr>
                                <th className="p-3 pl-6">Type</th>
                                <th className="p-3">Hash</th>
                                <th className="p-3 text-right">Value</th>
                                <th className="p-3 text-right">Fee</th>
                                <th className="p-3 text-right">Date</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                                <tbody className="divide-y divide-alphabag-gray text-[13px]">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="p-3 pl-6"><div className="h-4 w-16 bg-alphabag-gray rounded"></div></td>
                                                <td className="p-3"><div className="h-4 w-24 bg-alphabag-gray rounded"></div></td>
                                                <td className="p-3 text-right"><div className="h-4 w-12 bg-alphabag-gray rounded ml-auto"></div></td>
                                                <td className="p-3 text-right"><div className="h-4 w-10 bg-alphabag-gray rounded ml-auto"></div></td>
                                                <td className="p-3 text-right"><div className="h-4 w-16 bg-alphabag-gray rounded ml-auto"></div></td>
                                                <td className="p-3"><div className="h-5 w-12 bg-alphabag-gray rounded mx-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : filteredTxs.length > 0 ? (
                                        filteredTxs.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-alphabag-gray/40 transition-colors group">
                                                <td className="p-3 pl-6">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`p-1.5 rounded-md ${tx.type === 'TRANSFER' ? 'bg-blue-500/10 text-blue-400' : 'bg-alphabag-gray/20 text-alphabag-subtext'}`}>
                                                            {tx.type === 'TRANSFER' ? <ArrowUpRight size={14} /> : <History size={14} />}
                                                        </div>
                                                        <span className="font-bold text-white uppercase tracking-wider text-[11px]">{tx.type}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-mono text-alphabag-subtext text-[11px]">{tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}</span>
                                                        <a href={getExplorerLink(tx.chain, tx.hash)} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity text-alphabag-yellow"><ExternalLink size={10} /></a>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right font-black text-white">
                                                    ${tx.value.toFixed(2)}
                                                </td>
                                                <td className="p-3 text-right text-alphabag-subtext text-[11px] font-mono">
                                                    ${tx.fee.toFixed(4)}
                                                </td>
                                                <td className="p-3 text-right text-alphabag-subtext text-[11px] font-bold uppercase tracking-wide">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${tx.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            'bg-red-500/10 text-red-500 border-red-500/20'
                                                            }`}>
                                                            {tx.status}
                                                        </span>
                                                        {tx.isMockData && (
                                                            <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/20">
                                                                Demo
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-alphabag-subtext">
                                        <History size={48} className="mx-auto mb-2 opacity-20" />
                                        <p className="font-bold uppercase tracking-widest text-xs">No transactions found for the selected filter.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
