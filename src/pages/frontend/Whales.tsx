
import { ArrowRight,Bell,Eye,Plus,ShieldAlert,Trash2 } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { UpgradeCmd } from '../../components/frontend/UpgradeCmd';
import { Button } from '../../components/ui/Button';
import { DataSourceBadge } from '../../components/ui/DataSourceBadge';
import { PageIcon } from '../../components/ui/PageIcon';
import { useWallet } from '../../context/WalletContext';


import { X } from 'lucide-react';
import { Chain } from '../../types';

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
        <div key={whale.id} className="rounded-lg border border-alphabag-gray bg-alphabag-darkgray p-5 hover:border-alphabag-yellow/30 transition-all">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-alphabag-black rounded-md flex items-center justify-center border border-alphabag-gray">
                        <Eye size={18} className="text-alphabag-yellow" />
                    </div>
                    {hasAlerts && (
                        <div className="bg-alphabag-green/10 text-alphabag-green px-2 py-0.5 rounded text-[11px] font-medium uppercase flex items-center gap-1">
                            <Bell size={10} /> Alert
                        </div>
                    )}
                </div>
                <button type="button" aria-label={`Remove ${whale.label} from tracked whales`} onClick={() => removeTrackedWallet(whale.id)} className="text-alphabag-subtext hover:text-alphabag-red transition-colors p-1.5">
                    <Trash2 size={15} />
                </button>
            </div>

            <div className="mb-2">
                <h3 className="text-sm font-semibold text-alphabag-text mb-1">{whale.label}</h3>
                <p className="text-[11px] font-mono text-alphabag-subtext bg-alphabag-black px-2 py-0.5 rounded inline-block border border-alphabag-gray">
                    {whale.address.substring(0, 10)}...{whale.address.substring(whale.address.length - 8)}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-alphabag-black border border-alphabag-gray rounded-md p-2.5">
                    <div className="text-[11px] text-alphabag-subtext uppercase font-medium tracking-wider mb-1">Status</div>
                    <div className="flex items-center text-alphabag-green text-xs font-semibold">
                        <div className="w-1.5 h-1.5 bg-alphabag-green rounded-full mr-1.5"></div>
                        Live
                    </div>
                </div>
                <div className="bg-alphabag-black border border-alphabag-gray rounded-md p-2.5">
                    <div className="text-[11px] text-alphabag-subtext uppercase font-medium tracking-wider mb-1">Value</div>
                    <div className="text-alphabag-text text-xs font-semibold tabular-nums num">
                        {loading ? <span className="text-alphabag-subtext animate-pulse">Scanning...</span> : `$${(netWorth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </div>
                </div>
            </div>

            <Link to={`/whales/${whale.address}`} className="w-full py-2 bg-alphabag-gray text-alphabag-text rounded-md text-xs font-semibold hover:bg-alphabag-muted transition-all flex items-center justify-center gap-2">
                View Analytics <ArrowRight size={13} />
            </Link>
        </div>
    );
};

export const Whales: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const { trackedWallets, removeTrackedWallet, addTrackedWallet, getLimits, whaleAlerts } = useWallet();
    const safeTrackedWallets = Array.isArray(trackedWallets) ? trackedWallets : [];
    const whaleWallets = safeTrackedWallets.filter(w => w?.type === 'WHALE');
    const activeWhales = whaleWallets;
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
                setErrorMsg(res.error || 'Failed to add whale wallet');
            }
        } catch (e: any) {
            setErrorMsg(e.message || 'Network error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`space-y-4 animate-in fade-in duration-500 ${embedded ? '' : 'pb-20'}`}>

            {/* Page Header */}
            {!embedded ? (
                <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <PageIcon name="whales" size={40} />
                            <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">Whale Watch</h1>
                            <DataSourceBadge />
                        </div>
                        <p className="text-alphabag-subtext text-sm font-medium">Monitor high-conviction wallet movements. Currently watching <span className="text-alphabag-text font-semibold">{activeWhales.length}</span> addresses.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <UpgradeCmd />
                        <button 
                            onClick={() => setIsAddOpen(true)}
                            className="flex items-center gap-2 bg-alphabag-yellow text-alphabag-dark px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#e0bd2e] transition-all"
                        >
                            <Plus size={15} /> Add Whale
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-alphabag-dark border border-alphabag-gray rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-alphabag-green" />
                        <p className="text-xs text-alphabag-subtext">Live multi-chain wallet radar · Watching <span className="text-alphabag-yellow font-semibold">{activeWhales.length}</span> addresses</p>
                    </div>
                    <button 
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-1.5 bg-alphabag-yellow text-alphabag-dark px-3.5 py-1.5 rounded text-xs font-semibold hover:bg-[#e0bd2e] transition-all shrink-0"
                    >
                        <Plus size={14} /> Add Whale Wallet
                    </button>
                </div>
            )}

            {!embedded && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-lg flex items-start gap-2">
                    <ShieldAlert className="text-blue-400 shrink-0 mt-0.5" size={17} />
                    <p className="text-sm text-alphabag-subtext">Whale Watch tracks major wallet addresses. Our AI engine alerts you when these addresses make significant trades.</p>
                </div>
            )}

            {activeWhales.length === 0 ? (
                <div className="rounded-lg border border-dashed border-alphabag-gray bg-alphabag-darkgray p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-alphabag-black border border-alphabag-gray mx-auto flex items-center justify-center mb-4">
                        <Eye size={24} className="text-alphabag-yellow" />
                    </div>
                    <h2 className="text-xl font-semibold text-alphabag-text mb-2">No whale wallets tracked yet</h2>
                    <p className="text-sm text-alphabag-subtext max-w-md mx-auto mb-5">
                        Add a wallet address to monitor whale activity, large flows, and alerts for real portfolio movement.
                    </p>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="inline-flex items-center gap-2 bg-alphabag-yellow text-alphabag-dark px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#e0bd2e] transition-all"
                    >
                        <Plus size={15} /> Add Whale Wallet
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {activeWhales.map(whale => (
                        <WhaleListItem key={whale.id} whale={whale} removeTrackedWallet={removeTrackedWallet} hasAlerts={whaleAlerts.includes(whale.address)} />
                    ))}

                    {!embedded && activeWhales.length < limits.maxWhales && (
                        <button 
                            onClick={() => setIsAddOpen(true)}
                            className="rounded-lg border border-dashed border-alphabag-gray p-4 flex flex-col items-center justify-center text-center hover:border-alphabag-yellow/30 transition-all group"
                        >
                            <div className="w-9 h-9 bg-alphabag-gray rounded-md flex items-center justify-center text-alphabag-subtext mb-3 group-hover:bg-alphabag-yellow group-hover:text-alphabag-dark transition-all">
                                <Plus size={18} />
                            </div>
                            <span className="text-sm font-semibold text-alphabag-text">Add Whale Slot</span>
                            <span className="text-xs text-alphabag-subtext mt-1">{whaleWallets.length} of {limits.maxWhales} used</span>
                        </button>
                    )}
                </div>
            )}

            {/* Inline Add Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 animate-in fade-in">
                    <div className="bg-alphabag-dark border border-alphabag-gray w-full max-w-md rounded-lg p-5 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                                <Eye size={18} className="text-alphabag-yellow" /> Add Whale Wallet
                            </h3>
                            <button 
                                onClick={() => { setIsAddOpen(false); setErrorMsg(null); }} 
                                className="text-alphabag-subtext hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs font-semibold">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-[11px] text-alphabag-subtext font-medium uppercase tracking-wider mb-1">Wallet Address</label>
                                <input 
                                    type="text" 
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    placeholder="0x... or Solana address" 
                                    className="w-full bg-alphabag-darkgray border border-alphabag-gray text-white text-xs rounded-md p-2.5 outline-none focus:border-alphabag-yellow transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] text-alphabag-subtext font-medium uppercase tracking-wider mb-1">Custom Label</label>
                                <input 
                                    type="text" 
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    placeholder="e.g. Vitalik, Binance Hot Wallet" 
                                    className="w-full bg-alphabag-darkgray border border-alphabag-gray text-white text-xs rounded-md p-2.5 outline-none focus:border-alphabag-yellow transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] text-alphabag-subtext font-medium uppercase tracking-wider mb-1">Primary Chain</label>
                                <select 
                                    value={newChain}
                                    onChange={(e) => setNewChain(e.target.value as Chain)}
                                    className="w-full bg-alphabag-darkgray border border-alphabag-gray text-white text-xs rounded-md p-2.5 outline-none focus:border-alphabag-yellow transition-all"
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
                                className="w-full py-2.5 mt-4 text-xs font-semibold tracking-wider uppercase bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e]"
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
