import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChainService } from '../services/ChainService';
import { WhaleService, WhaleTransaction } from '../services/WhaleService';
import { PortfolioItem } from '../types';
import { useWallet } from '../context/WalletContext';
import { WalletLabels } from '../services/WalletLabels';
import { ArrowLeft, Eye, ShieldCheck, Share2, MoreHorizontal, TrendingUp, DollarSign, Bell, BellOff, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '../components/ui/Button';

const COLORS = ['#FCD535', '#0ECB81', '#3B82F6', '#8B5CF6', '#F6465D', '#848E9C'];

export const WhaleDetail: React.FC = () => {
    const { address } = useParams<{ address: string }>();
    const { trackedWallets, whaleAlerts, toggleWhaleAlert, hideSmallBalances, toggleHideSmallBalances } = useWallet();
    const [holdings, setHoldings] = useState<PortfolioItem[]>([]);
    const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);

    const whaleInfo = trackedWallets.find(w => w.address === address);
    const totalValue = holdings.reduce((acc, h) => acc + h.value, 0);
    const alertsEnabled = address ? whaleAlerts.includes(address) : false;

    useEffect(() => {
        if (address && whaleInfo) {
            setLoading(true);
            const fetchData = async () => {
                try {
                    // Parallel fetch across all supported chains
                    const [balances, txs] = await Promise.all([
                        ChainService.getMultiChainBalances(address),
                        WhaleService.getMultiChainTransactions(address)
                    ]);

                    console.log("WhaleDetail Balances Raw:", balances);

                    // Map balances to PortfolioItem
                    const mappedHoldings = balances.map(t => ({
                        coinId: t.tokenAddress,
                        symbol: t.symbol,
                        name: t.name,
                        image: t.logo || '',
                        amount: t.guiBalance,
                        currentPrice: t.price || 0,
                        value: t.value || 0, // Ensure value is populated
                        priceChange24h: 0,
                        avgBuyPrice: 0,
                        pnl: 0,
                        pnlPercent: 0
                    })).sort((a, b) => b.value - a.value); // Sort by Value Descending

                    // .filter(h => h.value > 10); // Temporarily disable dust filter for debugging

                    console.log("WhaleDetail Mapped Holdings:", mappedHoldings);

                    setHoldings(mappedHoldings);
                    setTransactions(txs);
                } catch (e) {
                    console.error("Whale Data Fetch Error", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [address, whaleInfo]);

    const filteredHoldings = hideSmallBalances ? holdings.filter(h => h.value >= 1) : holdings;

    const handleToggle = () => {
        if (address) {
            toggleWhaleAlert(address);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96">
            <div className="w-10 h-10 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-alphabag-subtext font-medium uppercase tracking-widest text-[10px]">Scanning whale wallet...</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in relative">
            {showToast && (
                <div className="fixed top-20 right-8 z-[60] bg-alphabag-dark border border-alphabag-yellow/50 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 animate-slide-in">
                    <div className={`p-1.5 rounded-full ${alertsEnabled ? 'bg-alphabag-green/20 text-alphabag-green' : 'bg-alphabag-red/20 text-alphabag-red'}`}>
                        {alertsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Alerts {alertsEnabled ? 'Enabled' : 'Disabled'}</div>
                        <div className="text-[10px] text-alphabag-subtext uppercase tracking-widest">For {whaleInfo?.label || 'this whale'}</div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/whales" className="p-2 bg-alphabag-gray hover:text-white rounded-lg transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">{whaleInfo?.label || 'Unknown Whale'}</h1>
                            <span className="bg-alphabag-yellow/10 text-alphabag-yellow text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-alphabag-yellow/20">Verified Whale</span>
                        </div>
                        <div className="text-sm font-mono text-alphabag-subtext mt-1">{address}</div>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="uppercase font-bold"><Share2 size={18} /></Button>
                    <Button variant="ghost" size="sm" className="uppercase font-bold"><MoreHorizontal size={18} /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <TrendingUp size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-alphabag-subtext text-sm font-medium mb-2 uppercase tracking-widest">Total estimated balance</p>
                            <h2 className="text-5xl font-bold text-white mb-4 tracking-tighter leading-none">
                                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </h2>
                            <div className="flex items-center space-x-6 text-sm">
                                <div className="flex items-center text-alphabag-green font-bold uppercase tracking-wider">
                                    <TrendingUp size={16} className="mr-1" />
                                    <span>+4.2% (24h)</span>
                                </div>
                                <div className="text-alphabag-subtext font-medium">
                                    Cost basis: <span className="text-white">$15.4M</span>
                                </div>
                                <div className="text-alphabag-subtext font-medium">
                                    Active chains: <span className="text-white">Ethereum, Solana</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-alphabag-gray flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-white uppercase tracking-widest text-xs">Holdings distribution</h3>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={toggleHideSmallBalances}
                                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border ${hideSmallBalances ? 'bg-alphabag-yellow/10 border-alphabag-yellow text-alphabag-yellow' : 'bg-transparent border-alphabag-gray text-alphabag-subtext'}`}
                                >
                                    {hideSmallBalances ? 'Show Dust' : 'Hide Dust (<$1)'}
                                </Button>
                            </div>
                            <div className="text-xs text-alphabag-subtext font-medium">{filteredHoldings.length} assets</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-alphabag-black/40 text-alphabag-subtext text-[10px] uppercase font-bold tracking-widest">
                                    <tr>
                                        <th className="p-4 pl-8">Asset</th>
                                        <th className="p-4 text-right">Price</th>
                                        <th className="p-6 text-right">Balance</th>
                                        <th className="p-4 text-right pr-8">Value (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-alphabag-gray/50 text-sm">
                                    {filteredHoldings.map((h, i) => (
                                        <tr key={h.coinId} className="hover:bg-alphabag-gray/20 transition-colors">
                                            <td className="p-4 pl-8">
                                                <div className="flex items-center space-x-3">
                                                    <img src={h.image} className="w-8 h-8 rounded-full" />
                                                    <div>
                                                        <div className="font-bold text-white">{h.symbol}</div>
                                                        <div className="text-xs text-alphabag-subtext font-medium">{h.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right text-white font-medium">
                                                ${h.currentPrice.toLocaleString()}
                                            </td>
                                            <td className="p-6 text-right text-alphabag-subtext font-medium">
                                                {h.amount.toLocaleString()} {h.symbol}
                                            </td>
                                            <td className="p-4 text-right font-bold text-white pr-8">
                                                ${h.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6 h-[400px] flex flex-col">
                        <h3 className="font-bold text-white mb-6 flex items-center uppercase tracking-widest text-xs">
                            <ShieldCheck className="mr-2 text-alphabag-yellow" size={18} />
                            Asset allocation
                        </h3>
                        <div className="flex-1 flex flex-col justify-center relative z-10 px-4">
                            {/* Legend / List */}
                            <div className="space-y-4 mb-8">
                                {filteredHoldings.slice(0, 5).map((item, index) => (
                                    <div key={item.coinId} className="flex justify-between items-center group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">{item.symbol}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-mono text-alphabag-subtext group-hover:text-white transition-colors">
                                                {totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0'}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {filteredHoldings.length > 5 && (
                                    <div className="flex justify-between items-center opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-alphabag-gray"></div>
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">Others</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-mono text-alphabag-subtext">
                                                {totalValue > 0 ? ((filteredHoldings.slice(5).reduce((acc, i) => acc + i.value, 0) / totalValue) * 100).toFixed(1) : '0.0'}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bullet Chart Track */}
                            <div className="h-6 w-full bg-alphabag-black/50 rounded-full overflow-hidden flex relative border border-alphabag-border shadow-inner">
                                {filteredHoldings.map((item, index) => (
                                    <div
                                        key={item.coinId}
                                        className="h-full relative group transition-all duration-700 ease-out hover:brightness-110"
                                        style={{
                                            width: `${totalValue > 0 ? (item.value / totalValue) * 100 : 0}%`,
                                            backgroundColor: COLORS[index % COLORS.length]
                                        }}
                                        title={`${item.name}: ${(item.value / totalValue * 100).toFixed(1)}%`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 text-center">
                                <span className="text-[10px] text-alphabag-subtext uppercase font-black tracking-[0.2em] opacity-50">Asset Weight Distribution</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6">
                        <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Whale insights</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-alphabag-black border border-alphabag-gray rounded-xl">
                                <div className="text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-bold">Accumulation strategy</div>
                                <div className="text-sm text-white font-medium">Buying ETH consistently below $3,500 over the last 30 days.</div>
                            </div>
                            <div className="p-4 bg-alphabag-black border border-alphabag-gray rounded-xl">
                                <div className="text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-bold">Risk profile</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white font-medium">Conservative / Large Cap</span>
                                    <span className="text-xs bg-alphabag-green/20 text-alphabag-green px-2 py-0.5 rounded font-bold uppercase">Low Risk</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 bg-gradient-to-br rounded-2xl transition-all duration-500 ${alertsEnabled ? 'from-alphabag-green to-emerald-600' : 'from-alphabag-yellow to-orange-500'}`}>
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="bg-alphabag-black/10 rounded-full p-1.5 flex items-center justify-center">
                                {alertsEnabled ? <Bell size={20} className="text-black" /> : <DollarSign size={20} className="text-black" />}
                            </div>
                            <h4 className="font-extrabold text-lg italic uppercase tracking-tighter text-black">
                                {alertsEnabled ? 'Alerts active' : 'Alpha alerts'}
                            </h4>
                        </div>
                        <p className="text-xs font-bold leading-tight opacity-90 mb-4 text-black">
                            {alertsEnabled
                                ? "You'll receive push notifications for significant transactions from this wallet."
                                : "Get push notifications when this whale moves more than $100k USD in assets."}
                        </p>
                        <Button
                            variant="secondary"
                            onClick={handleToggle}
                            className={`w-full font-bold shadow-lg transition-all uppercase ${alertsEnabled ? 'bg-white text-alphabag-green border-none hover:bg-white/90' : 'bg-alphabag-black text-white hover:bg-gray-800 border-none'}`}
                        >
                            {alertsEnabled ? (
                                <span className="flex items-center justify-center"><Check size={16} className="mr-2" /> Monitoring active</span>
                            ) : (
                                "Enable alerts"
                            )}
                        </Button>
                    </div>

                    {/* Recent Transactions Section */}
                    <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl overflow-hidden shadow-lg mt-6">
                        <div className="p-6 border-b border-alphabag-gray">
                            <h3 className="font-bold text-white uppercase tracking-widest text-xs">Recent Movements</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-alphabag-black/40 text-alphabag-subtext text-[10px] uppercase font-bold tracking-widest">
                                    <tr>
                                        <th className="p-4 pl-6">Hash</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Entity</th>
                                        <th className="p-4">Time</th>
                                        <th className="p-4 text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-alphabag-gray/50 text-xs">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-alphabag-subtext italic">No recent transactions found</td>
                                        </tr>
                                    ) : (
                                        transactions.slice(0, 10).map((tx) => {
                                            const isOut = tx.from.toLowerCase() === address?.toLowerCase();
                                            const otherAddr = isOut ? tx.to : tx.from;
                                            const label = WalletLabels.getLabel(otherAddr);

                                            return (
                                                <tr key={tx.hash} className="hover:bg-alphabag-gray/20 transition-colors">
                                                    <td className="p-4 pl-6 font-mono text-alphabag-yellow cursor-pointer" title={tx.hash}>
                                                        <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                            {tx.hash.substring(0, 8)}...
                                                        </a>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${isOut ? 'bg-alphabag-red/20 text-alphabag-red' : 'bg-alphabag-green/20 text-alphabag-green'}`}>
                                                            {isOut ? 'Send' : 'Receive'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {label ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }}></div>
                                                                <span className="font-bold" style={{ color: label.color }}>{label.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-alphabag-subtext font-mono">{otherAddr.substring(0, 6)}...{otherAddr.substring(otherAddr.length - 4)}</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-alphabag-subtext">
                                                        {new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 text-right text-white font-bold">
                                                        {tx.value.length > 10 ? 'High Value' : parseFloat(tx.value).toFixed(2)} {tx.tokenSymbol || 'ETH'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
