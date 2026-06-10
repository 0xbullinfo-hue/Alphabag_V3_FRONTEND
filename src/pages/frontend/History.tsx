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

    const filteredTxs = filterChain === 'ALL' ? transactions : transactions.filter(tx => tx.chain.includes(filterChain.toLowerCase()));

    return (
        <div className="space-y-4 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-[#eaecef] tracking-tight flex items-center gap-2">
                        <History size={22} className="text-[#fcd535]" /> Transaction History
                    </h1>
                    <p className="text-[#848e9c] text-xs font-medium mt-0.5">Immutable ledger of all portfolio activity</p>
                </div>
                <div className="flex space-x-2">
                    <select
                        value={filterChain}
                        onChange={(e) => setFilterChain(e.target.value)}
                        className="bg-[#0b0e11] border border-[#2b3139] rounded-md px-3 py-1.5 text-xs text-[#eaecef] focus:border-[#fcd535] outline-none uppercase font-semibold"
                    >
                        <option value="ALL">All Networks</option>
                        <option value="eth">Ethereum</option>
                        <option value="bsc">BSC</option>
                        <option value="sol">Solana</option>
                    </select>
                    <button onClick={() => window.location.reload()} className="bg-[#2b3139] text-[#eaecef] border border-[#474d57] rounded-md px-3 py-1.5 hover:bg-[#474d57] transition-all">
                        <RefreshCw size={13} />
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#0b0e11] text-[#848e9c] text-[10px] uppercase tracking-wider font-semibold border-b border-[#2b3139]">
                            <tr>
                                <th className="p-3 pl-6">Type</th>
                                <th className="p-3">Hash</th>
                                <th className="p-3 text-right">Value</th>
                                <th className="p-3 text-right">Fee</th>
                                <th className="p-3 text-right">Date</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                                <tbody className="divide-y divide-[#2b3139] text-[13px]">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="p-3 pl-6"><div className="h-4 w-16 bg-[#2b3139] rounded"></div></td>
                                                <td className="p-3"><div className="h-4 w-24 bg-[#2b3139] rounded"></div></td>
                                                <td className="p-3 text-right"><div className="h-4 w-12 bg-[#2b3139] rounded ml-auto"></div></td>
                                                <td className="p-3 text-right"><div className="h-4 w-10 bg-[#2b3139] rounded ml-auto"></div></td>
                                                <td className="p-3 text-right"><div className="h-4 w-16 bg-[#2b3139] rounded ml-auto"></div></td>
                                                <td className="p-3"><div className="h-5 w-12 bg-[#2b3139] rounded mx-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : filteredTxs.length > 0 ? (
                                        filteredTxs.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-[#2b3139]/40 transition-colors group">
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
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${tx.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
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
