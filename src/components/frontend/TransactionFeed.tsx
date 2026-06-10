
import React, { useEffect, useState } from 'react';
import { chainData } from '../../services/chainData';
import { Transaction } from '../../types';
import { WalletLabels } from '../../services/WalletLabels';
import { RefreshCw, ExternalLink, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';

interface TransactionFeedProps {
    address: string;
    chainId?: number; // Default 1 (ETH)
}

export const TransactionFeed: React.FC<TransactionFeedProps> = ({ address, chainId = 1 }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (address) {
            fetchHistory();
        }
    }, [address, chainId]);

    const fetchHistory = async () => {
        setLoading(true);
        setError('');
        try {
            const txs = await chainData.getTransactionHistory(address, chainId);
            setTransactions(txs);
        } catch (e) {
            setError('Failed to load on-chain history.');
        } finally {
            setLoading(false);
        }
    };

    if (!address) return <div className="text-alphabag-subtext text-xs">No address monitored.</div>;

    return (
        <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-alphabag-gray flex justify-between items-center bg-alphabag-black/20">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Live Chain Feed (Chain ID: {chainId})
                </h3>
                <button onClick={fetchHistory} disabled={loading} className="text-alphabag-subtext hover:text-white transition-colors">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-alphabag-subtext text-xs space-y-2">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-alphabag-yellow" />
                        <p>Scanning mempool & blocks...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-alphabag-red text-xs flex flex-col items-center">
                        <AlertCircle size={20} className="mb-2" />
                        {error}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-8 text-center text-alphabag-subtext text-xs">No recent transactions found.</div>
                ) : (
                    <table className="w-full text-left text-[10px] md:text-xs">
                        <thead className="bg-alphabag-black/40 text-alphabag-subtext font-bold uppercase tracking-wider sticky top-0">
                            <tr>
                                <th className="p-3">Type</th>
                                <th className="p-3">Method</th>
                                <th className="p-3">From / To</th>
                                <th className="p-3 text-right">Value (USD)</th>
                                <th className="p-3 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-alphabag-gray/10">
                            {transactions.map((tx) => {
                                // Safety check for malformed transaction objects
                                if (!tx || !tx.from) return null;

                                const fromAddr = tx.from || '';
                                const toAddr = tx.to || '';

                                const isOut = fromAddr.toLowerCase() === address.toLowerCase();
                                const otherAddr = isOut ? toAddr : fromAddr;
                                const label = WalletLabels.getLabel(otherAddr || '');

                                return (
                                    <tr key={tx.hash || Math.random()} className="hover:bg-white/5 transition-colors font-mono">
                                        <td className="p-3">
                                            <div className={`flex items-center gap-1.5 ${isOut ? 'text-alphabag-red' : 'text-alphabag-green'}`}>
                                                {isOut ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                                <span className="font-bold">{isOut ? 'SEND' : 'RECV'}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-alphabag-subtext text-[10px]">
                                            <a
                                                href={`https://etherscan.io/tx/${tx.hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-white flex items-center gap-1"
                                            >
                                                {(tx.hash || '').substring(0, 6)}...
                                                <ExternalLink size={8} />
                                            </a>
                                        </td>
                                        <td className="p-3">
                                            {label ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }}></div>
                                                    <span className="text-white font-bold" style={{ color: label.color }}>{label.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-alphabag-subtext">{otherAddr.substring(0, 6)}...{otherAddr.substring(otherAddr.length - 4)}</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right text-white">
                                            ${tx.value?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="p-3 text-right text-alphabag-subtext">
                                            {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="p-2 bg-alphabag-yellow/5 border-t border-alphabag-yellow/10 text-center">
                <p className="text-[9px] text-alphabag-yellow font-bold uppercase tracking-widest">
                    Powered by GoldRush® API
                </p>
            </div>
        </div>
    );
};
