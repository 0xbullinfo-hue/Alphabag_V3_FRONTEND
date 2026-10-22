import { ArrowLeft,Bell,BellOff,Check,Copy,DollarSign,Share2,ShieldCheck } from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import { Link,useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useWallet } from '../../context/WalletContext';
import { ChainService } from '../../services/ChainService';
import { WalletLabels } from '../../services/WalletLabels';
import { WhaleService,WhaleTransaction } from '../../services/WhaleService';
import { PortfolioItem } from '../../types';

const COLORS = ['#FCD535', '#0ECB81', '#3B82F6', '#8B5CF6', '#F6465D', '#848E9C'];

export const WhaleDetail: React.FC = () => {
    const { address } = useParams<{ address: string }>();
    const { trackedWallets, whaleAlerts, toggleWhaleAlert, hideSmallBalances, toggleHideSmallBalances } = useWallet();
    const [holdings, setHoldings] = useState<PortfolioItem[]>([]);
    const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [actionNotice, setActionNotice] = useState<string | null>(null);

    const whaleInfo = trackedWallets.find(w => w.address === address);
    const totalValue = holdings.reduce((acc, h) => acc + h.value, 0);
    const alertsEnabled = address ? whaleAlerts.includes(address) : false;

    useEffect(() => {
        if (!actionNotice) return;
        const timer = window.setTimeout(() => setActionNotice(null), 2500);
        return () => window.clearTimeout(timer);
    }, [actionNotice]);

    useEffect(() => {
        let cancelled = false;
        if (!address || !whaleInfo) {
            setHoldings([]);
            setTransactions([]);
            setLoading(false);
            return () => { cancelled = true; };
        }

        setLoading(true);
        const fetchData = async () => {
            try {
                const [balances, txs] = await Promise.all([
                    ChainService.getMultiChainBalances(address),
                    WhaleService.getMultiChainTransactions(address)
                ]);

                const mappedHoldings = balances.map(t => ({
                    coinId: t.tokenAddress || t.contractAddress || t.symbol,
                    symbol: t.symbol,
                    name: t.name,
                    image: t.logo || '',
                    amount: t.guiBalance || 0,
                    currentPrice: t.price || 0,
                    value: t.value || 0,
                    priceChange24h: 0,
                    avgBuyPrice: 0,
                    pnl: 0,
                    pnlPercent: 0,
                    costBasisKnown: false,
                    isMockData: !!t.isMockData
                })).sort((a, b) => b.value - a.value);

                if (!cancelled) {
                    setHoldings(mappedHoldings);
                    setTransactions(txs);
                }
            } catch (e) {
                if (!cancelled) console.error('Whale data fetch failed', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void fetchData();
        return () => { cancelled = true; };
    }, [address, whaleInfo]);

    const filteredHoldings = hideSmallBalances ? holdings.filter(h => h.value >= 1) : holdings;

    const handleToggle = () => {
        if (address) {
            toggleWhaleAlert(address);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const handleShare = async () => {
        const shareData = { title: `${whaleInfo?.label || 'Whale'} analytics`, url: window.location.href };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                setActionNotice('Page link copied');
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            setActionNotice('Unable to share this page');
        }
    };

    const handleCopyAddress = async () => {
        if (!address) return;
        try {
            await navigator.clipboard.writeText(address);
            setActionNotice('Wallet address copied');
        } catch {
            setActionNotice('Clipboard access is unavailable');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96">
            <div className="w-10 h-10 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-alphabag-subtext font-medium uppercase tracking-wider text-[11px]">Scanning whale wallet...</span>
        </div>
    );

    if (!address || !whaleInfo) return (
        <section className="flex min-h-64 flex-col items-center justify-center gap-3 text-center" role="status">
            <h1 className="text-xl font-semibold text-alphabag-text">Whale wallet not found</h1>
            <p className="text-sm text-alphabag-subtext">This wallet is not in your tracked whale list.</p>
            <Link to="/whales" className="text-sm font-semibold text-alphabag-yellow hover:underline">Back to tracked whales</Link>
        </section>
    );

    return (
        <div className="space-y-2 transition-opacity relative">
            {actionNotice && <div role="status" className="fixed top-20 right-4 z-[60] rounded-md border border-alphabag-gray bg-alphabag-darkgray px-3 py-2 text-sm text-alphabag-text">{actionNotice}</div>}
            {showToast && (
                <div className="fixed top-20 right-8 z-[60] bg-alphabag-darkgray border border-alphabag-yellow/30 px-4 py-3 rounded-md shadow-2xl flex items-center space-x-2">
                    <div className={`p-1.5 rounded-full ${alertsEnabled ? 'bg-alphabag-green/20 text-alphabag-green' : 'bg-alphabag-red/20 text-alphabag-red'}`}>
                        {alertsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-alphabag-text">Alerts {alertsEnabled ? 'Enabled' : 'Disabled'}</div>
                        <div className="text-[11px] text-alphabag-subtext uppercase tracking-wider">For {whaleInfo?.label || 'this whale'}</div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between py-3 border-b border-alphabag-gray">
                <div className="flex items-center space-x-2">
                    <Link to="/whales" className="p-1.5 bg-alphabag-gray hover:bg-alphabag-muted text-alphabag-text rounded-md transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h1 className="text-2xl font-semibold text-alphabag-text tracking-tight">{whaleInfo?.label || 'Unknown Whale'}</h1>
                            <span className="bg-alphabag-yellow/10 text-alphabag-yellow text-[11px] font-medium px-2 py-0.5 rounded uppercase tracking-wider border border-alphabag-yellow/20">Verified Whale</span>
                        </div>
                        <div className="text-[11px] font-mono text-alphabag-subtext mt-0.5">{address}</div>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button type="button" aria-label="Share whale analytics" onClick={() => void handleShare()} className="p-2 bg-alphabag-gray text-alphabag-subtext hover:text-alphabag-text rounded-md transition-colors"><Share2 size={16} /></button>
                    <button type="button" aria-label="Copy wallet address" title="Copy wallet address" onClick={() => void handleCopyAddress()} className="p-2 bg-alphabag-gray text-alphabag-subtext hover:text-alphabag-text rounded-md transition-colors"><Copy size={16} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <div className="lg:col-span-2 space-y-2">
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg p-4 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-alphabag-subtext text-[11px] font-medium mb-1 uppercase tracking-wider">Total estimated balance</p>
                            <h2 className="text-3xl font-semibold text-white mb-3 tracking-tight leading-none num">
                                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </h2>
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                                    <div className="text-alphabag-subtext font-medium">Estimated from available balances</div>
                                    <div className="text-alphabag-subtext font-medium">Assets: <span className="text-white tabular-nums">{holdings.length}</span></div>
                                    <div className="text-alphabag-subtext font-medium">Network: <span className="text-white">Multi-Chain</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg overflow-hidden">
                        <div className="p-3 border-b border-alphabag-gray flex justify-between items-center bg-alphabag-black">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-alphabag-text uppercase tracking-wider text-[11px]">Holdings Distribution</h3>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={toggleHideSmallBalances}
                                    className={`text-[11px] h-6 font-semibold uppercase tracking-wider px-2 py-0 border ${hideSmallBalances ? 'bg-alphabag-yellow/10 border-alphabag-yellow text-alphabag-yellow' : 'bg-transparent border-alphabag-gray text-alphabag-subtext'}`}
                                >
                                    {hideSmallBalances ? 'Dust' : 'Dust (<$1)'}
                                </Button>
                            </div>
                            <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider opacity-60">{filteredHoldings.length} Assets</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-alphabag-black text-alphabag-subtext text-[11px] uppercase font-semibold tracking-wider border-b border-alphabag-gray">
                                    <tr>
                                        <th className="p-3 pl-6">Asset</th>
                                        <th className="p-3 text-right">Price</th>
                                        <th className="p-3 text-right">Balance</th>
                                        <th className="p-3 text-right pr-6">Value (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-alphabag-gray text-[13px]">
                                    {filteredHoldings.map((h) => (
                                        <tr key={h.coinId} className="hover:bg-alphabag-gray/30 transition-colors">
                                            <td className="p-3 pl-6">
                                                <div className="flex items-center space-x-2.5">
                                                    {h.image && <img src={h.image} alt="" aria-hidden="true" className="w-7 h-7 rounded-full" />}
                                                    <div>
                                                        <div className="font-semibold text-white leading-none">{h.symbol}</div>
                                                        <div className="text-[11px] text-alphabag-muted font-medium mt-1 uppercase tracking-wider">{h.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right text-white font-medium num">
                                                ${h.currentPrice.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right text-alphabag-subtext font-medium num">
                                                {h.amount.toLocaleString()} <span className="opacity-50">{h.symbol}</span>
                                            </td>
                                            <td className="p-3 text-right font-semibold text-white pr-6 num">
                                                ${h.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg p-4 h-[400px] flex flex-col">
                        <h3 className="font-semibold text-white mb-2 flex items-center uppercase tracking-wider text-xs">
                            <ShieldCheck className="mr-2 text-alphabag-yellow" size={18} />
                            Asset allocation
                        </h3>
                        <div className="flex-1 flex flex-col justify-center relative z-10 px-4">
                            {/* Legend / List */}
                            <div className="space-y-2 mb-2">
                                {filteredHoldings.slice(0, 5).map((item, index) => (
                                    <div key={item.coinId} className="flex justify-between items-center group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-xs font-semibold text-white uppercase tracking-wider">{item.symbol}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-mono text-alphabag-subtext group-hover:text-white transition-colors num">
                                                {totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0'}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {filteredHoldings.length > 5 && (
                                    <div className="flex justify-between items-center opacity-60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-alphabag-gray"></div>
                                            <span className="text-xs font-semibold text-white uppercase tracking-wider">Others</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-mono text-alphabag-subtext num">
                                                {totalValue > 0 ? ((filteredHoldings.slice(5).reduce((acc, i) => acc + i.value, 0) / totalValue) * 100).toFixed(1) : '0.0'}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bullet Chart Track */}
                            <div className="h-4 w-full bg-alphabag-black/50 rounded overflow-hidden flex relative border border-alphabag-gray">
                                {filteredHoldings.map((item, index) => (
                                    <div
                                        key={item.coinId}
                                        className="h-full relative group transition-all duration-700 ease-out hover:brightness-110"
                                        style={{
                                            width: `${totalValue > 0 ? (item.value / totalValue) * 100 : 0}%`,
                                            backgroundColor: COLORS[index % COLORS.length]
                                        }}
                                        title={`${item.name}: ${totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0'}%`}
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 text-center">
                                <span className="text-[11px] text-alphabag-subtext uppercase font-semibold tracking-wider opacity-60">Asset Weight Distribution</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-2 uppercase tracking-wider text-xs">Whale insights</h3>
                        <div className="space-y-2">
                            <div className="p-3 bg-alphabag-black border border-alphabag-gray rounded-md">
                                <div className="text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-semibold">Accumulation strategy</div>
                                <div className="text-sm text-alphabag-subtext font-medium">Historical transaction coverage is not available to reliably infer this wallet’s strategy.</div>
                            </div>
                            <div className="p-3 bg-alphabag-black border border-alphabag-gray rounded-md">
                                <div className="text-xs text-alphabag-subtext mb-1 uppercase tracking-wider font-semibold">Risk profile</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-alphabag-subtext font-medium">Risk profile unavailable</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg border transition-all duration-300 ${
                        alertsEnabled
                            ? 'bg-alphabag-green/10 border-alphabag-green/30'
                            : 'bg-alphabag-yellow/10 border-alphabag-yellow/30'
                    }`}>
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="bg-alphabag-black/30 rounded-md p-1.5 flex items-center justify-center">
                                {alertsEnabled ? <Bell size={18} className="text-alphabag-green" /> : <DollarSign size={18} className="text-alphabag-yellow" />}
                            </div>
                            <h4 className="font-semibold text-base uppercase tracking-tight text-alphabag-text">
                                {alertsEnabled ? 'Alerts active' : 'Alpha alerts'}
                            </h4>
                        </div>
                        <p className="text-xs font-medium leading-tight opacity-80 mb-2 text-alphabag-subtext">
                            {alertsEnabled
                                ? "You'll receive notifications for significant transactions from this wallet."
                                : "Get notifications when this whale moves more than $100k USD in assets."}
                        </p>
                        <button
                            onClick={handleToggle}
                            className={`w-full py-2 rounded-md text-sm font-semibold uppercase transition-all border ${
                                alertsEnabled
                                    ? 'bg-alphabag-green/20 text-alphabag-green border-alphabag-green/30 hover:bg-alphabag-green/30'
                                    : 'bg-alphabag-yellow text-alphabag-dark border-alphabag-yellow hover:bg-[#e0bd2e]'
                            }`}
                        >
                            {alertsEnabled ? <span className="flex items-center justify-center"><Check size={16} className="mr-2" /> Monitoring active</span> : 'Enable alerts'}
                        </button>
                    </div>

                    {/* Recent Transactions Section */}
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg overflow-hidden mt-4">
                        <div className="p-3 border-b border-alphabag-gray">
                            <h3 className="font-semibold text-alphabag-text uppercase tracking-wider text-xs">Recent Movements</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-alphabag-black text-alphabag-subtext text-[11px] uppercase font-semibold tracking-wider border-b border-alphabag-gray">
                                    <tr>
                                        <th className="p-3 pl-6">Hash</th>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Entity</th>
                                        <th className="p-3">Time</th>
                                        <th className="p-3 text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-alphabag-gray text-xs">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-alphabag-subtext">No recent transactions found</td>
                                        </tr>
                                    ) : (
                                        transactions.slice(0, 10).map((tx) => {
                                            const isOut = tx.from.toLowerCase() === address?.toLowerCase();
                                            const otherAddr = isOut ? tx.to : tx.from;
                                            const label = WalletLabels.getLabel(otherAddr);

                                            return (
                                                <tr key={tx.hash} className="hover:bg-alphabag-gray/30 transition-colors">
                                                    <td className="p-3 pl-6 font-mono text-alphabag-yellow cursor-pointer" title={tx.hash}>
                                                        <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                            {tx.hash.substring(0, 8)}...
                                                        </a>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${isOut ? 'bg-alphabag-red/20 text-alphabag-red' : 'bg-alphabag-green/20 text-alphabag-green'}`}>
                                                            {isOut ? 'Send' : 'Receive'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        {label ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }}></div>
                                                                <span className="font-semibold" style={{ color: label.color }}>{label.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-alphabag-subtext font-mono text-[11px]">{otherAddr.substring(0, 6)}...{otherAddr.substring(otherAddr.length - 4)}</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-alphabag-subtext text-[11px]">
                                                        {new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3 text-right text-white font-semibold num">
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
