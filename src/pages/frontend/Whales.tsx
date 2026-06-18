
import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { Eye, Plus, ArrowRight, Trash2, AlertCircle, ShieldAlert, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { UpgradeCmd } from '../../components/frontend/UpgradeCmd';
import { DataSourceBadge } from '../../components/ui/DataSourceBadge';


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
        <div key={whale.id} className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-5 hover:border-[#fcd535]/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-[#0b0e11] rounded-md flex items-center justify-center border border-[#2b3139]">
                        <Eye size={18} className="text-[#fcd535]" />
                    </div>
                    {hasAlerts && (
                        <div className="bg-[#0ecb81]/10 text-[#0ecb81] px-2 py-1 rounded-md text-[9px] font-semibold uppercase flex items-center gap-1">
                            <Bell size={10} /> Alert
                        </div>
                    )}
                </div>
                <button onClick={() => removeTrackedWallet(whale.id)} className="text-[#848e9c] hover:text-[#f6465d] transition-colors p-1.5">
                    <Trash2 size={15} />
                </button>
            </div>

            <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#eaecef] mb-1">{whale.label}</h3>
                <p className="text-[10px] font-mono text-[#848e9c] bg-[#0b0e11] px-2 py-0.5 rounded-md inline-block border border-[#2b3139]">
                    {whale.address.substring(0, 10)}...{whale.address.substring(whale.address.length - 8)}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#0b0e11] border border-[#2b3139] rounded-md p-2.5">
                    <div className="text-[9px] text-[#848e9c] uppercase font-semibold tracking-wider mb-1">Status</div>
                    <div className="flex items-center text-[#0ecb81] text-xs font-semibold">
                        <div className="w-1.5 h-1.5 bg-[#0ecb81] rounded-full mr-1.5 animate-pulse"></div>
                        Live
                    </div>
                </div>
                <div className="bg-[#0b0e11] border border-[#2b3139] rounded-md p-2.5">
                    <div className="text-[9px] text-[#848e9c] uppercase font-semibold tracking-wider mb-1">Value</div>
                    <div className="text-[#eaecef] text-xs font-semibold tabular-nums">
                        {loading ? <span className="text-[#848e9c] animate-pulse">Scanning...</span> : `$${(netWorth || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </div>
                </div>
            </div>

            <Link to={`/whales/${whale.address}`}>
                <button className="w-full py-2 bg-[#2b3139] text-[#eaecef] rounded-md text-xs font-semibold hover:bg-[#474d57] transition-all flex items-center justify-center gap-2">
                    View Analytics <ArrowRight size={13} />
                </button>
            </Link>
        </div>
    );
};

export const Whales: React.FC = () => {
    const { trackedWallets, removeTrackedWallet, getLimits, tier, whaleAlerts } = useWallet();
    const whaleWallets = trackedWallets.filter(w => w.type === 'WHALE');
    const limits = getLimits();

    return (
        <div className="max-w-7xl mx-auto space-y-5 pb-12 px-4 md:px-8 animate-in fade-in duration-700">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-[#2b3139] gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                            <Eye size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-[#eaecef] tracking-tight">Whale Watch</h1>
                        <DataSourceBadge />
                    </div>
                    <p className="text-[#848e9c] text-sm font-medium">Monitor high-conviction wallet movements. Currently watching <span className="text-[#eaecef] font-semibold">{whaleWallets.length}</span> addresses.</p>
                </div>
                <div className="flex items-center gap-3">
                    <UpgradeCmd />
                    <Link to="/settings">
                        <button className="flex items-center gap-2 bg-[#fcd535] text-[#181a20] px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#e0bd2e] transition-all">
                            <Plus size={15} /> Add Whale
                        </button>
                    </Link>
                </div>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-lg flex items-start gap-3">
                <ShieldAlert className="text-blue-400 shrink-0 mt-0.5" size={17} />
                <p className="text-sm text-[#848e9c]">Whale Watch tracks major wallet addresses. Our AI engine alerts you when these addresses make significant trades.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {whaleWallets.length === 0 ? (
                    <div className="col-span-full py-20 rounded-lg border border-dashed border-[#2b3139] text-center">
                        <Eye size={40} className="mx-auto mb-4 text-[#848e9c] opacity-30" />
                        <h3 className="text-base font-semibold text-[#eaecef] mb-2">No Whales Tracked</h3>
                        <p className="text-[#848e9c] text-sm max-w-xs mx-auto mb-5">Start following smart money by adding a wallet address to your watch list.</p>
                        <Link to="/settings">
                            <button className="bg-[#2b3139] text-[#eaecef] px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#474d57] transition-all">Go to Settings</button>
                        </Link>
                    </div>
                ) : (
                    whaleWallets.map(whale => (
                        <WhaleListItem key={whale.id} whale={whale} removeTrackedWallet={removeTrackedWallet} hasAlerts={whaleAlerts.includes(whale.address)} />
                    ))
                )}

                {whaleWallets.length < limits.maxWhales && (
                    <Link to="/settings" className="rounded-lg border border-dashed border-[#2b3139] p-6 flex flex-col items-center justify-center text-center hover:border-[#fcd535]/30 transition-all group">
                        <div className="w-9 h-9 bg-[#2b3139] rounded-md flex items-center justify-center text-[#848e9c] mb-3 group-hover:bg-[#fcd535] group-hover:text-[#181a20] transition-all">
                            <Plus size={18} />
                        </div>
                        <span className="text-sm font-semibold text-[#eaecef]">Add Whale Slot</span>
                        <span className="text-xs text-[#848e9c] mt-1">{whaleWallets.length} of {limits.maxWhales} used</span>
                    </Link>
                )}
            </div>
        </div>
    );
};
