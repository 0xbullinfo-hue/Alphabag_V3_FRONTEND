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
            <div className="w-10 h-10 border-2 border-[#fcd535] border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-[#848e9c] font-semibold uppercase tracking-widest text-[10px]">Scanning whale wallet...</span>
        </div>
    );

    return (
        <div className="space-y-4 animate-in fade-in duration-700 relative">
            {showToast && (
                <div className="fixed top-20 right-8 z-[60] bg-[#1e2329] border border-[#fcd535]/30 px-4 py-3 rounded-lg shadow-2xl flex items-center space-x-3">
                    <div className={`p-1.5 rounded-full ${alertsEnabled ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]'}`}>
                        {alertsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-[#eaecef]">Alerts {alertsEnabled ? 'Enabled' : 'Disabled'}</div>
                        <div className="text-[10px] text-[#848e9c] uppercase tracking-widest">For {whaleInfo?.label || 'this whale'}</div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between py-6 border-b border-[#2b3139]">
                <div className="flex items-center space-x-3">
                    <Link to="/whales" className="p-1.5 bg-[#2b3139] hover:bg-[#474d57] text-[#eaecef] rounded-md transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h1 className="text-2xl font-semibold text-[#eaecef] tracking-tight">{whaleInfo?.label || 'Unknown Whale'}</h1>
                            <span className="bg-[#fcd535]/10 text-[#fcd535] text-[9px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#fcd535]/20">Verified Whale</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#848e9c] mt-0.5">{address}</div>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button className="p-2 bg-[#2b3139] text-[#848e9c] hover:text-[#eaecef] rounded-md transition-colors"><Share2 size={16} /></button>
                    <button className="p-2 bg-[#2b3139] text-[#848e9c] hover:text-[#eaecef] rounded-md transition-colors"><MoreHorizontal size={16} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <TrendingUp size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-alphabag-subtext text-[11px] font-medium mb-1 uppercase tracking-widest">Total estimated balance</p>
                            <h2 className="text-4xl font-bold text-white mb-3 tracking-tighter leading-none">
                                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </h2>
                            <div className="flex items-center space-x-5 text-[12px]">
                                <div className="flex items-center text-alphabag-green font-bold uppercase tracking-wider">
                                    <TrendingUp size={14} className="mr-1" />
                                    <span>+4.2%</span>
                                </div>
                                <div className="text-alphabag-subtext font-medium">
                                    Cost basis: <span className="text-white">$15.4M</span>
                                </div>
                                <div className="text-alphabag-subtext font-medium">
                                    Network: <span className="text-white">Multi-Chain</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-[#2b3139] flex justify-between items-center bg-[#0b0e11]">
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-[#eaecef] uppercase tracking-wider text-[11px]">Holdings Distribution</h3>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={toggleHideSmallBalances}
                                    className={`text-[9px] h-6 font-bold uppercase tracking-widest px-2 py-0 border ${hideSmallBalances ? 'bg-alphabag-yellow/10 border-alphabag-yellow text-alphabag-yellow' : 'bg-transparent border-alphabag-gray text-alphabag-subtext'}`}
                                >
                                    {hideSmallBalances ? 'Dust' : 'Dust (<$1)'}
                                </Button>
                            </div>
                            <div className="text-[10px] text-alphabag-subtext font-black uppercase tracking-widest opacity-60">{filteredHoldings.length} Assets</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#0b0e11] text-[#848e9c] text-[10px] uppercase font-semibold tracking-wider border-b border-[#2b3139]">
                                    <tr>
                                        <th className="p-4 pl-8">Asset</th>
                                        <th className="p-4 text-right">Price</th>
                                        <th className="p-6 text-right">Balance</th>
                                        <th className="p-4 text-right pr-8">Value (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2b3139] text-[13px]">
                                    {filteredHoldings.map((h, i) => (
                                        <tr key={h.coinId} className="hover:bg-[#2b3139]/30 transition-colors">
                                            <td className="p-3 pl-6">
                                                <div className="flex items-center space-x-2.5">
                                                    <img src={h.image} className="w-7 h-7 rounded-full shadow-inner" />
                                                    <div>
                                                        <div className="font-bold text-white leading-none">{h.symbol}</div>
                                                        <div className="text-[10px] text-alphabag-muted font-medium mt-1 uppercase tracking-tighter">{h.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right text-white font-medium">
                                                ${h.currentPrice.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right text-alphabag-subtext font-medium">
                                                {h.amount.toLocaleString()} <span className="opacity-50">{h.symbol}</span>
                                            </td>
                                            <td className="p-3 text-right font-black text-white pr-6">
                                                ${h.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg p-6 h-[400px] flex flex-col">
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

                    <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg p-6">
                        <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">Whale insights</h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-[#0b0e11] border border-[#2b3139] rounded-md">
                                <div className="text-xs text-[#848e9c] mb-1 uppercase tracking-wider font-semibold">Accumulation strategy</div>
                                <div className="text-sm text-white font-medium">Buying ETH consistently below $3,500 over the last 30 days.</div>
                            </div>
                            <div className="p-4 bg-[#0b0e11] border border-[#2b3139] rounded-md">
                                <div className="text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-bold">Risk profile</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white font-medium">Conservative / Large Cap</span>
                                    <span className="text-xs bg-alphabag-green/20 text-alphabag-green px-2 py-0.5 rounded font-bold uppercase">Low Risk</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 rounded-lg border transition-all duration-500 ${
                        alertsEnabled
                            ? 'bg-[#0ecb81]/10 border-[#0ecb81]/30'
                            : 'bg-[#fcd535]/10 border-[#fcd535]/30'
                    }`}>
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="bg-[#0b0e11]/30 rounded-md p-1.5 flex items-center justify-center">
                                {alertsEnabled ? <Bell size={18} className="text-[#0ecb81]" /> : <DollarSign size={18} className="text-[#fcd535]" />}
                            </div>
                            <h4 className="font-semibold text-base uppercase tracking-tight text-[#eaecef]">
                                {alertsEnabled ? 'Alerts active' : 'Alpha alerts'}
                            </h4>
                        </div>
                        <p className="text-xs font-medium leading-tight opacity-80 mb-4 text-[#848e9c]">
                            {alertsEnabled
                                ? "You'll receive push notifications for significant transactions from this wallet."
                                : "Get push notifications when this whale moves more than $100k USD in assets."}
                        </p>
                        <button
                            onClick={handleToggle}
                            className={`w-full py-2 rounded-md text-sm font-semibold uppercase transition-all border ${
                                alertsEnabled
                                    ? 'bg-[#0ecb81]/20 text-[#0ecb81] border-[#0ecb81]/30 hover:bg-[#0ecb81]/30'
                                    : 'bg-[#fcd535] text-[#181a20] border-[#fcd535] hover:bg-[#e0bd2e]'
                            }`}
                        >
                            {alertsEnabled ? <span className="flex items-center justify-center"><Check size={16} className="mr-2" /> Monitoring active</span> : 'Enable alerts'}
                        </button>
                    </div>

                    {/* Recent Transactions Section */}
                    <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg overflow-hidden mt-4">
                        <div className="p-4 border-b border-[#2b3139]">
                            <h3 className="font-semibold text-[#eaecef] uppercase tracking-wider text-xs">Recent Movements</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#0b0e11] text-[#848e9c] text-[10px] uppercase font-semibold tracking-wider border-b border-[#2b3139]">
                                    <tr>
                                        <th className="p-4 pl-6">Hash</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Entity</th>
                                        <th className="p-4">Time</th>
                                        <th className="p-4 text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2b3139] text-xs">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-[#848e9c]">No recent transactions found</td>
                                        </tr>
                                    ) : (
                                        transactions.slice(0, 10).map((tx) => {
                                            const isOut = tx.from.toLowerCase() === address?.toLowerCase();
                                            const otherAddr = isOut ? tx.to : tx.from;
                                            const label = WalletLabels.getLabel(otherAddr);

                                            return (
                                                <tr key={tx.hash} className="hover:bg-[#2b3139]/30 transition-colors">
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
