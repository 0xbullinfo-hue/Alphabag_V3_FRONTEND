import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { chainData } from '../services/chainData';
import { Transaction } from '../types';
import { History, ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';

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

    const filteredTxs = filterChain === 'ALL' ? transactions : transactions.filter(tx => tx.chain.includes(filterChain.toLowerCase()));

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative flex items-center">
                        Transaction <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">History</span>
                    </h1>
                    <p className="text-alphabag-subtext text-sm font-medium">Immutable ledger of all portfolio activity</p>
                </div>
                <div className="flex space-x-2">
                    <select
                        value={filterChain}
                        onChange={(e) => setFilterChain(e.target.value)}
                        className="bg-alphabag-dark border border-alphabag-gray rounded-xl px-4 py-2 text-sm text-white focus:border-alphabag-yellow outline-none uppercase font-bold"
                    >
                        <option value="ALL">All Networks</option>
                        <option value="eth">Ethereum</option>
                        <option value="bsc">BSC</option>
                        <option value="sol">Solana</option>
                    </select>
                    <Button variant="secondary" onClick={() => window.location.reload()}><RefreshCw size={16} /></Button>
                </div>
            </div>

            <div className="bg-alphabag-dark border border-alphabag-gray rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-alphabag-black/40 text-alphabag-subtext text-[10px] uppercase tracking-[0.2em] font-black border-b border-alphabag-gray">
                            <tr>
                                <th className="p-6 pl-8">Type</th>
                                <th className="p-6">Transaction Hash</th>
                                <th className="p-6 text-right">Value</th>
                                <th className="p-6 text-right">Gas Fee</th>
                                <th className="p-6 text-right">Time</th>
                                <th className="p-6 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-alphabag-gray/20 text-sm">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-6 pl-8"><div className="h-4 w-20 bg-alphabag-gray/20 rounded"></div></td>
                                        <td className="p-6"><div className="h-4 w-32 bg-alphabag-gray/20 rounded"></div></td>
                                        <td className="p-6 text-right"><div className="h-4 w-16 bg-alphabag-gray/20 rounded ml-auto"></div></td>
                                        <td className="p-6 text-right"><div className="h-4 w-12 bg-alphabag-gray/20 rounded ml-auto"></div></td>
                                        <td className="p-6 text-right"><div className="h-4 w-24 bg-alphabag-gray/20 rounded ml-auto"></div></td>
                                        <td className="p-6"><div className="h-6 w-16 bg-alphabag-gray/20 rounded mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredTxs.length > 0 ? (
                                filteredTxs.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-alphabag-gray/10 transition-colors group">
                                        <td className="p-6 pl-8">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg ${tx.type === 'TRANSFER' ? 'bg-blue-500/10 text-blue-400' : 'bg-alphabag-gray/20 text-alphabag-subtext'}`}>
                                                    {tx.type === 'TRANSFER' ? <ArrowUpRight size={16} /> : <History size={16} />}
                                                </div>
                                                <span className="font-bold text-white uppercase tracking-wider text-xs">{tx.type}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-mono text-alphabag-subtext text-xs">{tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}</span>
                                                <a href={getExplorerLink(tx.chain, tx.hash)} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity text-alphabag-yellow"><ExternalLink size={12} /></a>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right font-bold text-white">
                                            ${tx.value.toFixed(2)}
                                        </td>
                                        <td className="p-6 text-right text-alphabag-subtext text-xs font-mono">
                                            ${tx.fee.toFixed(4)}
                                        </td>
                                        <td className="p-6 text-right text-alphabag-subtext text-xs font-bold uppercase tracking-wide">
                                            {new Date(tx.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${tx.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-alphabag-subtext">
                                        <History size={48} className="mx-auto mb-4 opacity-20" />
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
