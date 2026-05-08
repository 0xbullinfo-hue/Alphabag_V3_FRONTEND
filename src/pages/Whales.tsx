
import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Eye, Plus, ArrowRight, Trash2, AlertCircle, ShieldAlert, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { UpgradeCmd } from '../components/UpgradeCmd';


// Sub-component to handle individual whale data fetching
const WhaleListItem: React.FC<{ whale: any, removeTrackedWallet: (id: string) => void, hasAlerts: boolean }> = ({ whale, removeTrackedWallet, hasAlerts }) => {
    const [netWorth, setNetWorth] = React.useState<number | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let isMounted = true;
        const fetchValue = async () => {
            try {
                // Use the same multi-chain fetch as the detail view
                const balances = await import('../services/ChainService').then(m => m.ChainService.getMultiChainBalances(whale.address));

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
        <div key={whale.id} className="glass-panel rounded-xl p-6 hover:border-alphabag-yellow/40 transition-all group relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Eye size={100} />
            </div>

            <div className="flex justify-between items-start mb-6">
                <div className="flex space-x-2">
                    <div className="w-12 h-12 bg-alphabag-black rounded-xl flex items-center justify-center border border-alphabag-gray group-hover:bg-alphabag-yellow/10 transition-colors">
                        <Eye size={24} className="text-alphabag-yellow" />
                    </div>
                    {hasAlerts && (
                        <div className="w-12 h-12 bg-alphabag-green/10 rounded-xl flex items-center justify-center border border-alphabag-green/20 text-alphabag-green animate-pulse">
                            <Bell size={20} />
                        </div>
                    )}
                </div>
                <button
                    onClick={() => removeTrackedWallet(whale.id)}
                    className="text-alphabag-subtext hover:text-alphabag-red transition-colors p-2"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-alphabag-yellow transition-colors">{whale.label}</h3>
                <p className="text-xs font-mono text-alphabag-subtext bg-alphabag-black px-2 py-1 rounded inline-block">
                    {whale.address.substring(0, 10)}...{whale.address.substring(whale.address.length - 8)}
                </p>
            </div>

            <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1">
                    <div className="text-[10px] text-alphabag-subtext uppercase font-bold tracking-wider">Status</div>
                    <div className="flex items-center text-alphabag-green text-sm font-medium">
                        <div className="w-1.5 h-1.5 bg-alphabag-green rounded-full mr-2 animate-pulse"></div>
                        Live Tracking
                    </div>
                </div>
                <div className="flex-1">
                    <div className="text-[10px] text-alphabag-subtext uppercase font-bold tracking-wider">Net Worth</div>
                    <div className="text-white text-sm font-bold">
                        {loading ? (
                            <span className="animate-pulse text-alphabag-subtext">Scanning...</span>
                        ) : (
                            `$${(netWorth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        )}
                    </div>
                </div>
            </div>

            <Link to={`/whales/${whale.address}`}>
                <Button variant="secondary" className="w-full group/btn font-bold">
                    View Full Analytics <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
            </Link>
        </div>
    );
};

export const Whales: React.FC = () => {
    const { trackedWallets, removeTrackedWallet, getLimits, tier, whaleAlerts } = useWallet();
    const whaleWallets = trackedWallets.filter(w => w.type === 'WHALE');
    const limits = getLimits();

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-[2rem] bg-alphabag-black/50 border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.35)] p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-alphabag-yellow/10 via-transparent to-transparent blur-3xl pointer-events-none"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative flex items-center">
                        <Eye className="mr-3 text-alphabag-yellow" size={28} />
                        Whale <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">Watch</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <p className="text-alphabag-subtext mt-1">Monitor high-conviction wallet movements across chains.</p>
                        <UpgradeCmd />
                    </div>
                </div>
                <div className="mt-4 md:mt-0">
                    <Link to="/settings">
                        <Button variant="primary">
                            <Plus size={18} className="mr-2" /> Add Whale Wallet
                        </Button>
                    </Link>
                </div>
            </div>
            </div>

            {/* Info Banner */}
            <div className="glass-panel p-4 rounded-xl flex items-start space-x-3 border-blue-500/20 bg-blue-500/10 shadow-[0_10px_40px_rgba(96,165,250,0.08)]">
                <ShieldAlert className="text-blue-400 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-blue-100/80">
                    Whale Watch allows you to track major and retail "whales". Our AI engine alerts you when these addresses make significant trades.
                    <span className="text-blue-300 ml-1 font-medium">Currently watching {whaleWallets.length} addresses.</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {whaleWallets.length === 0 ? (
                    <div className="col-span-full py-20 glass-panel rounded-xl border-dashed border-alphabag-gray/40 text-center">
                        <Eye size={48} className="mx-auto mb-4 text-alphabag-subtext opacity-30" />
                        <h3 className="text-lg font-bold text-white mb-2">No Whales Tracked</h3>
                        <p className="text-alphabag-subtext max-w-xs mx-auto mb-6">Start following smart money by adding a wallet address to your watch list.</p>
                        <Link to="/settings">
                            <Button variant="secondary">Go to Settings</Button>
                        </Link>
                    </div>
                ) : (
                    whaleWallets.map(whale => (
                        <WhaleListItem
                            key={whale.id}
                            whale={whale}
                            removeTrackedWallet={removeTrackedWallet}
                            hasAlerts={whaleAlerts.includes(whale.address)}
                        />
                    ))
                )}

                {/* Limit Card if Basic/Premium */}
                {whaleWallets.length < limits.maxWhales && (
                    <Link to="/settings" className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-alphabag-yellow/30 transition-all group">
                        <div className="w-10 h-10 bg-alphabag-gray rounded-full flex items-center justify-center text-alphabag-subtext mb-3 group-hover:bg-alphabag-yellow group-hover:text-black transition-all">
                            <Plus size={20} />
                        </div>
                        <span className="text-sm font-bold text-white group-hover:text-alphabag-yellow">Add Whale Slot</span>
                        <span className="text-xs text-alphabag-subtext mt-1">{whaleWallets.length} of {limits.maxWhales} used</span>
                    </Link>
                )}
            </div>

            {tier === 'BASIC' && (
                <div className="bg-gradient-to-r from-alphabag-yellow/20 to-alphabag-dark border border-alphabag-yellow/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between shadow-lg">
                    <div className="mb-4 md:mb-0">
                        <h4 className="text-lg font-bold text-white">Unlock More Whale Slots</h4>
                        <p className="text-sm text-alphabag-subtext">Premium members can track up to 10 whales simultaneously.</p>
                    </div>
                    <Link to="/settings">
                        <Button variant="primary" className="font-bold px-8">Upgrade to Pro</Button>
                    </Link>
                </div>
            )}
        </div>
    );
};
