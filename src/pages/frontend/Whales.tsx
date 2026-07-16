
import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { Eye, Plus, ArrowRight, Trash2, AlertCircle, ShieldAlert, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { UpgradeCmd } from '../../components/frontend/UpgradeCmd';
import { DataSourceBadge } from '../../components/ui/DataSourceBadge';


import { Chain } from '../../types';
import { X } from 'lucide-react';

// Sub-component to handle individual whale data fetching
const WhaleListItem: React.FC<{ whale: any, removeTrackedWallet: (id: string) => void, hasAlerts: boolean }> = ({ whale, removeTrackedWallet, hasAlerts }) => {
    const [netWorth, setNetWorth] = React.useState<number | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let isMounted = true;
        const fetchValue = async () => {
            try {
                // Use the same multi-chain fetch as the detail view
                const balances = await import('../../services/ChainService').then(m => m.ChainService.getMultiChainBalances(whale.address));

                // Calculate total value
                const total = balances.reduce((acc, token) => acc + (token.value || 0), 0);

                if (isMounted) {
                    setNetWorth(total);
                    setLoading(false);
                }
            } catch (e) {
                console.error("Whale List Fetch Error", e);
                if (isMounted) setLoading(false);
            }
        };

        fetchValue();

        // Refresh every 60s
        const interval = setInterval(fetchValue, 60000);
        return () => { isMounted = false; clearInterval(interval); };
    }, [whale.address]);

    return (
        <div key={whale.id} className="rounded-lg border border-alphabag-gray bg-alphabag-darkgray p-5 hover:border-[#fcd535]/30 transition-all">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-alphabag-black rounded-md flex items-center justify-center border border-alphabag-gray">
                        <Eye size={18} className="text-[#fcd535]" />
                    </div>
                    {hasAlerts && (
                        <div className="bg-[#0ecb81]/10 text-[#0ecb81] px-2 py-1 rounded-md text-[9px] font-semibold uppercase flex items-center gap-1">
                            <Bell size={10} /> Alert
                        </div>
                    )}
                </div>
                <button onClick={() => removeTrackedWallet(whale.id)} className="text-alphabag-subtext hover:text-[#f6465d] transition-colors p-1.5">
                    <Trash2 size={15} />
                </button>
            </div>

            <div className="mb-2">
                <h3 className="text-sm font-semibold text-alphabag-text mb-1">{whale.label}</h3>
                <p className="text-[10px] font-mono text-alphabag-subtext bg-alphabag-black px-2 py-0.5 rounded-md inline-block border border-alphabag-gray">
                    {whale.address.substring(0, 10)}...{whale.address.substring(whale.address.length - 8)}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-alphabag-black border border-alphabag-gray rounded-md p-2.5">
                    <div className="text-[9px] text-alphabag-subtext uppercase font-semibold tracking-wider mb-1">Status</div>
                    <div className="flex items-center text-[#0ecb81] text-xs font-semibold">
                        <div className="w-1.5 h-1.5 bg-[#0ecb81] rounded-full mr-1.5 animate-pulse"></div>
                        Live
                    </div>
                </div>
                <div className="bg-alphabag-black border border-alphabag-gray rounded-md p-2.5">
                    <div className="text-[9px] text-alphabag-subtext uppercase font-semibold tracking-wider mb-1">Value</div>
                    <div className="text-alphabag-text text-xs font-semibold tabular-nums">
                        {loading ? <span className="text-alphabag-subtext animate-pulse">Scanning...</span> : `$${(netWorth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </div>
                </div>
            </div>

            <Link to={`/whales/${whale.address}`}>
                <button className="w-full py-2 bg-[#2b3139] text-alphabag-text rounded-md text-xs font-semibold hover:bg-[#474d57] transition-all flex items-center justify-center gap-2">
                    View Analytics <ArrowRight size={13} />
                </button>
            </Link>
        </div>
    );
};

export const Whales: React.FC = () => {
    const { trackedWallets, removeTrackedWallet, addTrackedWallet, getLimits, tier, whaleAlerts, balanceSource } = useWallet();
    const whaleWallets = trackedWallets.filter(w => w.type === 'WHALE');
    const limits = getLimits();

    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [newAddress, setNewAddress] = React.useState('');
    const [newLabel, setNewLabel] = React.useState('');
    const [newChain, setNewChain] = React.useState<Chain>('BSC');
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAddress.trim()) return;

        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const res = await addTrackedWallet(newAddress.trim(), newLabel.trim() || 'Unnamed Whale', newChain, 'WHALE');
            if (res.success) {
                setIsAddOpen(false);
                setNewAddress('');
                setNewLabel('');
            } else {
                setErrorMsg(res.error || 'Failed to track whale.');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full space-y-2 pb-2 animate-in fade-in duration-700">

            {/* Page Header */}
            <div className="bg-alphabag-darkgray border-y border-alphabag-gray -mx-2 rounded-none p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                            <Eye size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">Whale Watch</h1>
                        <DataSourceBadge source={balanceSource} />
                    </div>
                    <p className="text-alphabag-subtext text-sm font-medium">Monitor high-conviction wallet movements. Currently watching <span className="text-alphabag-text font-semibold">{whaleWallets.length}</span> addresses.</p>
                </div>
                <div className="flex items-center gap-2">
                    <UpgradeCmd />
                    <button 
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 bg-[#fcd535] text-[#181a20] px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#e0bd2e] transition-all"
                    >
                        <Plus size={15} /> Add Whale
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-lg flex items-start gap-2">
                <ShieldAlert className="text-blue-400 shrink-0 mt-0.5" size={17} />
                <p className="text-sm text-alphabag-subtext">Whale Watch tracks major wallet addresses. Our AI engine alerts you when these addresses make significant trades.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {whaleWallets.length === 0 ? (
                    <div className="col-span-full py-20 rounded-lg border border-dashed border-alphabag-gray text-center">
                        <Eye size={40} className="mx-auto mb-2 text-alphabag-subtext opacity-30" />
                        <h3 className="text-base font-semibold text-alphabag-text mb-2">No Whales Tracked</h3>
                        <p className="text-alphabag-subtext text-sm max-w-xs mx-auto mb-5">Start following smart money by adding a wallet address to your watch list.</p>
                        <button 
                            onClick={() => setIsAddOpen(true)}
                            className="bg-[#2b3139] text-alphabag-text px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#474d57] transition-all"
                        >
                            Add Whale Wallet
                        </button>
                    </div>
                ) : (
                    whaleWallets.map(whale => (
                        <WhaleListItem key={whale.id} whale={whale} removeTrackedWallet={removeTrackedWallet} hasAlerts={whaleAlerts.includes(whale.address)} />
                    ))
                )}

                {whaleWallets.length < limits.maxWhales && (
                    <button 
                        onClick={() => setIsAddOpen(true)}
                        className="rounded-lg border border-dashed border-alphabag-gray p-4 flex flex-col items-center justify-center text-center hover:border-[#fcd535]/30 transition-all group"
                    >
                        <div className="w-9 h-9 bg-[#2b3139] rounded-md flex items-center justify-center text-alphabag-subtext mb-3 group-hover:bg-[#fcd535] group-hover:text-[#181a20] transition-all">
                            <Plus size={18} />
                        </div>
                        <span className="text-sm font-semibold text-alphabag-text">Add Whale Slot</span>
                        <span className="text-xs text-alphabag-subtext mt-1">{whaleWallets.length} of {limits.maxWhales} used</span>
                    </button>
                )}
            </div>

            {/* Inline Add Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                    <div className="bg-alphabag-dark border border-alphabag-gray w-full max-w-md rounded-2xl p-4 shadow-2xl relative">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Eye size={18} className="text-[#fcd535]" /> Add Whale Wallet
                            </h3>
                            <button 
                                onClick={() => { setIsAddOpen(false); setErrorMsg(null); }} 
                                className="text-alphabag-subtext hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-2">
                            <div>
                                <label className="block text-[10px] text-alphabag-subtext font-bold uppercase tracking-wider mb-1">Wallet Address</label>
                                <input 
                                    type="text" 
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    placeholder="0x... or Solana address" 
                                    className="w-full bg-alphabag-darkgray border border-alphabag-gray text-white text-xs rounded-xl p-3 outline-none focus:border-[#fcd535] transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-alphabag-subtext font-bold uppercase tracking-wider mb-1">Custom Label</label>
                                <input 
                                    type="text" 
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    placeholder="e.g. Vitalik, Binance Hot Wallet" 
                                    className="w-full bg-alphabag-darkgray border border-alphabag-gray text-white text-xs rounded-xl p-3 outline-none focus:border-[#fcd535] transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-alphabag-subtext font-bold uppercase tracking-wider mb-1">Primary Chain</label>
                                <select 
                                    value={newChain}
                                    onChange={(e) => setNewChain(e.target.value as Chain)}
                                    className="w-full bg-alphabag-darkgray border border-alphabag-gray text-white text-xs rounded-xl p-3 outline-none focus:border-[#fcd535] transition-all"
                                >
                                    <option value="BSC">Binance Smart Chain (BSC)</option>
                                    <option value="ETH">Ethereum (ETH)</option>
                                    <option value="SOL">Solana (SOL)</option>
                                    <option value="BASE">Base (BASE)</option>
                                    <option value="ARB">Arbitrum (ARB)</option>
                                    <option value="AVAX">Avalanche (AVAX)</option>
                                </select>
                            </div>

                            <Button 
                                type="submit" 
                                isLoading={isSubmitting} 
                                className="w-full py-3 mt-4 text-xs font-black tracking-widest uppercase bg-[#fcd535] text-[#181a20] hover:bg-[#e0bd2e]"
                            >
                                Track Wallet
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
