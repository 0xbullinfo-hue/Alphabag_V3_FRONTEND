
import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { fetchDefiPositions } from '../services/covalent';
import { DefiPosition } from '../types';
import { Layers, Lock, ShieldCheck, TrendingUp, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const DeFi: React.FC = () => {
    const { trackedWallets } = useWallet();
    const [positions, setPositions] = useState<DefiPosition[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalValue, setTotalValue] = useState(0);

    useEffect(() => {
        const loadPositions = async () => {
            setLoading(true);
            let allPos: DefiPosition[] = [];
            let total = 0;

            // Limit to first 3 wallets to avoid rate limits on public API/Mock generator
            const nodes = trackedWallets.slice(0, 3);

            await Promise.all(nodes.map(async (wallet) => {
                const chainName = wallet.chain === 'BSC' ? 'bsc-mainnet' :
                    wallet.chain === 'SOL' ? 'solana-mainnet' :
                        'eth-mainnet';

                const pos = await fetchDefiPositions(chainName, wallet.address);
                allPos = [...allPos, ...pos];
            }));

            allPos.forEach(p => total += p.balance);
            setPositions(allPos);
            setTotalValue(total);
            setLoading(false);
        };

        if (trackedWallets.length > 0) {
            loadPositions();
        }
    }, [trackedWallets]);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">DeFi Dashboard</h1>
                    <p className="text-alphabag-subtext text-sm font-medium">Yield farming, lending, and liquidity positions</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right hidden md:block">
                        <div className="text-[10px] text-alphabag-subtext uppercase tracking-widest font-bold">Total DeFi Value</div>
                        <div className="text-xl font-black text-alphabag-green">${totalValue.toLocaleString()}</div>
                    </div>
                    <Button variant="secondary" onClick={() => window.location.reload()}><RefreshCw size={16} /></Button>
                </div>
            </div>

            <div className="bg-alphabag-dark border border-alphabag-gray rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-alphabag-black/40 text-alphabag-subtext text-[10px] uppercase tracking-[0.2em] font-black border-b border-alphabag-gray">
                            <tr>
                                <th className="p-6 pl-8">Protocol</th>
                                <th className="p-6">Chain</th>
                                <th className="p-6">Type</th>
                                <th className="p-6 text-right">APY</th>
                                <th className="p-6 text-right">Balance</th>
                                <th className="p-6 text-center">Health</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-alphabag-gray/20 text-sm">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-6 pl-8"><div className="h-8 w-32 bg-alphabag-gray/20 rounded-lg"></div></td>
                                        <td className="p-6"><div className="h-4 w-16 bg-alphabag-gray/20 rounded"></div></td>
                                        <td className="p-6"><div className="h-4 w-20 bg-alphabag-gray/20 rounded"></div></td>
                                        <td className="p-6 text-right"><div className="h-4 w-12 bg-alphabag-gray/20 rounded ml-auto"></div></td>
                                        <td className="p-6 text-right"><div className="h-4 w-24 bg-alphabag-gray/20 rounded ml-auto"></div></td>
                                        <td className="p-6"><div className="h-4 w-16 bg-alphabag-gray/20 rounded mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : positions.length > 0 ? (
                                positions.map((pos) => (
                                    <tr key={pos.id} className="hover:bg-alphabag-gray/10 transition-colors group">
                                        <td className="p-6 pl-8">
                                            <div className="flex items-center space-x-4">
                                                <div className="relative">
                                                    <img src={pos.icon} alt={pos.protocol} className="w-10 h-10 rounded-xl" />
                                                    <div className="absolute -bottom-1 -right-1 bg-alphabag-black rounded-full p-0.5">
                                                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-alphabag-black"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-black text-white text-base">{pos.protocol}</div>
                                                    <div className="text-alphabag-subtext text-xs font-bold">{pos.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-white">
                                            <span className="bg-alphabag-gray/30 border border-alphabag-gray px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">{pos.chain}</span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center space-x-2">
                                                {pos.type === 'Lending' && <Layers size={14} className="text-blue-400" />}
                                                {pos.type === 'Liquidity' && <TrendingUp size={14} className="text-purple-400" />}
                                                {pos.type === 'Staking' && <ShieldCheck size={14} className="text-green-400" />}
                                                <span className="text-white font-bold text-xs uppercase tracking-wide">{pos.type}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right font-black text-alphabag-green">
                                            {pos.apy.toFixed(2)}%
                                        </td>
                                        <td className="p-6 text-right font-black text-white text-base">
                                            ${pos.balance.toLocaleString()}
                                        </td>
                                        <td className="p-6 text-center">
                                            {pos.healthFactor ? (
                                                <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg border ${pos.healthFactor < 1.1 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        pos.healthFactor < 1.5 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                            'bg-green-500/10 text-green-500 border-green-500/20'
                                                    }`}>
                                                    {pos.healthFactor < 1.1 && <AlertTriangle size={12} />}
                                                    <span className="font-bold text-xs">{pos.healthFactor.toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-alphabag-subtext text-[10px] font-bold uppercase disabled opacity-50">N/A</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <Layers size={48} className="mx-auto mb-4 text-alphabag-gray/30" />
                                        <p className="text-alphabag-subtext font-bold uppercase tracking-widest text-xs">No active DeFi positions detected.</p>
                                        <p className="text-alphabag-subtext/50 text-[10px] mt-2 max-w-xs mx-auto">Connect a wallet with active positions on supported protocols to see them here.</p>
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
