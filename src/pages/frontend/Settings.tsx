import {
    AlertCircle,
    CheckCircle2,
    Check,
    Crown,
    Database,
    ExternalLink,
    Eye,
    Key,
    Lock,
    Plus,
    Search,
    TrendingUp,
    Wallet,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { CexConnectModal } from '../../components/frontend/CexConnectModal';
import { Button } from '../../components/ui/Button';
import { PageIcon } from '../../components/ui/PageIcon';
import { useWallet } from '../../context/WalletContext';
import { useCexConnections } from '../../hooks/useCexConnections';
import { Chain } from '../../types';
import { SUPPORTED_CEX } from './CexBag';
import { DISABLED_PAGES } from '../../services/config';

export const Settings: React.FC = () => {
    const { trackedWallets, addTrackedWallet, premiumTokenBalance, getLimits } = useWallet();
    const navigate = useNavigate();

    const [newAddress, setNewAddress] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newChain, setNewChain] = useState<Chain>('BSC');
    const [addType, setAddType] = useState<'PORTFOLIO' | 'WHALE'>('PORTFOLIO');
    const [error, setError] = useState<string | null>(null);

    // CEX API State
    const { connections: connectedCex, connectExchange } = useCexConnections();
    const [isCexModalOpen, setIsCexModalOpen] = useState(false);
    const [activeCexId, setActiveCexId] = useState<string | null>(null);
    const [isConnectingCex, setIsConnectingCex] = useState(false);
    const MAX_CEX = 20;

    const limits = getLimits();
    const portfolioCount = trackedWallets.filter(w => w.type === 'PORTFOLIO').length;
    const whaleCount = trackedWallets.filter(w => w.type === 'WHALE').length;

    const handleAdd = async () => {
        if (!newAddress || !newLabel) return;
        setError(null);
        const result = await addTrackedWallet(newAddress, newLabel, newChain, addType);
        if (!result.success) {
            setError(result.error || 'Failed to add wallet');
        } else {
            setNewAddress('');
            setNewLabel('');
        }
    };

    const handleCexConnect = async (apiKey: string, secret: string) => {
        if (!activeCexId) return;
        setIsConnectingCex(true);
        try {
            const info = SUPPORTED_CEX.find(c => c.id === activeCexId);
            if (!info) return;
            await connectExchange(info, apiKey, secret);
            Swal.fire({ title: 'Connected', text: `${info.name} Read-Only API verified!`, icon: 'success', timer: 1500, showConfirmButton: false, background: '#1E2329', color: '#FFF' });
            setIsCexModalOpen(false);
            setActiveCexId(null);
        } catch (e: any) {
            Swal.fire({
                title: 'Connection Failed',
                text: e?.response?.data?.message || e?.message || 'Could not verify this exchange API key. Please check your key and try again.',
                icon: 'error',
                background: '#1E2329',
                color: '#FFF',
            });
        } finally {
            setIsConnectingCex(false);
        }
    };

    const availableCex = SUPPORTED_CEX.filter(c => !connectedCex.find(cc => cc.id === c.id));

    return (
        <div className="w-full space-y-4 animate-in fade-in duration-700 pb-6">
            {/* Page Header */}
            <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <PageIcon name="settings" size={32} />
                        <h1 className="text-2xl font-bold text-alphabag-text tracking-tight">Membership & Connections</h1>
                    </div>
                    <p className="text-alphabag-subtext text-xs">Configure professional data feeds and membership status.</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-alphabag-subtext text-[11px] font-semibold uppercase tracking-wider mb-1">Network Verified Balance</span>
                    <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-alphabag-text leading-none tracking-tight tabular-nums num">
                            {(premiumTokenBalance ?? 0).toLocaleString()} <span className="text-alphabag-yellow text-sm">BAG</span>
                        </div>
                        <button onClick={() => {}} disabled={true} className="h-7 bg-alphabag-yellow text-alphabag-dark text-[11px] font-semibold px-3 rounded-md transition-all opacity-50 cursor-not-allowed">Buy</button>
                    </div>
                </div>
            </div>

            <section className="rounded-lg border border-alphabag-border bg-alphabag-card p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold text-alphabag-text uppercase tracking-wider">Portfolio Connections</h2>
                    <button type="button" onClick={() => navigate('/integrations')} className="flex items-center gap-1.5 text-[11px] text-alphabag-yellow font-semibold uppercase tracking-wider transition-colors hover:text-white">
                        View All <ExternalLink size={12} />
                    </button>
                </div>

                {/* Count Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="bg-alphabag-panel border border-alphabag-border rounded-md p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-alphabag-green/10 flex items-center justify-center shrink-0">
                            <Wallet size={18} className="text-alphabag-green" />
                        </div>
                        <div>
                            <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-0.5">DEX Wallets</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-alphabag-text tabular-nums num">{portfolioCount}</span>
                                <span className="text-[11px] text-alphabag-subtext num">/ {limits.maxPortfolios} max</span>
                            </div>
                            <div className="text-[11px] text-alphabag-green font-semibold mt-0.5">Portfolio Wallets</div>
                        </div>
                    </div>
                    <div className="bg-alphabag-panel border border-alphabag-border rounded-md p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-alphabag-yellow/10 flex items-center justify-center shrink-0">
                            <Eye size={18} className="text-alphabag-yellow" />
                        </div>
                        <div>
                            <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-0.5">Whale Watch</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-alphabag-text tabular-nums num">{whaleCount}</span>
                                <span className="text-[11px] text-alphabag-subtext num">/ {limits.maxWhales} max</span>
                            </div>
                            <div className="text-[11px] text-alphabag-yellow font-semibold mt-0.5">Wallet Trackers</div>
                        </div>
                    </div>
                    <div className="bg-alphabag-panel border border-alphabag-border rounded-md p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Database size={18} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-0.5">Total Connected</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-alphabag-text tabular-nums num">{portfolioCount + whaleCount}</span>
                                <span className="text-[11px] text-alphabag-subtext">wallets</span>
                            </div>
                            <div className="text-[11px] text-blue-400 font-semibold mt-0.5">All Networks</div>
                        </div>
                    </div>
                </div>

                {/* Add New Wallet Form */}
                <div className="bg-alphabag-panel border border-alphabag-border p-4 rounded-md">
                    <h3 className="text-xs font-bold text-white mb-3 flex items-center">
                        <Search size={14} className="mr-2 text-alphabag-yellow" /> Add New Address Tracking
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 mb-2">
                        <input type="text" aria-label="Wallet address" placeholder="Wallet Address (0x...)" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="bg-alphabag-dark border border-alphabag-border rounded-md px-3.5 py-2 text-xs text-white focus:border-alphabag-yellow/40 outline-none md:col-span-1" />
                        <input type="text" aria-label="Wallet label" placeholder="Label (e.g. Binance Whale)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="bg-alphabag-dark border border-alphabag-border rounded-md px-3.5 py-2 text-xs text-white focus:border-alphabag-yellow/40 outline-none" />
                        <select aria-label="Wallet network" value={newChain} onChange={(e) => setNewChain(e.target.value as Chain)} className="bg-alphabag-dark border border-alphabag-border rounded-md px-3.5 py-2 text-xs text-white focus:border-alphabag-yellow/40 outline-none font-mono">
                            <option value="BSC">BSC</option>
                            <option value="ETH">ETH</option>
                            <option value="SOL">SOL</option>
                            <option value="BASE">BASE</option>
                            <option value="AVAX">AVAX</option>
                            <option value="ARB">ARB</option>
                        </select>
                        <select aria-label="Tracking type" value={addType} onChange={(e) => setAddType(e.target.value as any)} className="bg-alphabag-dark border border-alphabag-border rounded-md px-3.5 py-2 text-xs text-white focus:border-alphabag-yellow/40 outline-none">
                            <option value="PORTFOLIO">Portfolio</option>
                            <option value="WHALE">Whale Watch</option>
                        </select>
                        <Button onClick={handleAdd} disabled={!newAddress.trim() || !newLabel.trim()} className="font-semibold h-[38px] text-xs">
                            <Plus size={14} className="mr-1.5" /> Add Connection
                        </Button>
                    </div>
                    {error && <div className="text-alphabag-red text-xs mt-2 bg-alphabag-red/10 p-2 rounded flex items-center"><AlertCircle size={12} className="mr-2" /> {error}</div>}
                                    <p className="text-[11px] text-alphabag-subtext mt-3">To view or remove connected wallets, go to the <button type="button" onClick={() => navigate('/integrations')} className="text-alphabag-yellow underline hover:no-underline">Integrations page</button>.</p>
                </div>
            </section>

            {/* ─── CEX Exchange APIs ─── */}
            <section className="rounded-lg border border-alphabag-border bg-alphabag-card p-4 relative">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2"><Key size={16} className="text-alphabag-yellow" /> CEX Exchange APIs</h2>
                        <p className="text-alphabag-subtext text-xs mt-0.5">Connect read-only API keys to track centralized exchange balances. <span className="text-alphabag-yellow font-semibold">Max {MAX_CEX} exchanges.</span></p>
                    </div>
                    <button type="button" onClick={() => navigate('/integrations')} className="flex items-center gap-1.5 text-[11px] text-alphabag-yellow font-semibold uppercase tracking-wider transition-colors hover:text-white">
                        Manage <ExternalLink size={12} />
                    </button>
                </div>

                {/* CEX Count Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="bg-alphabag-panel border border-alphabag-border rounded-md p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-alphabag-yellow/10 flex items-center justify-center shrink-0">
                            <Key size={18} className="text-alphabag-yellow" />
                        </div>
                        <div>
                            <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-0.5">CEX APIs Connected</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-alphabag-text tabular-nums num">{connectedCex.length}</span>
                                <span className="text-[11px] text-alphabag-subtext num">/ {MAX_CEX} max</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-alphabag-green"></span>
                                <span className="text-[11px] text-alphabag-green font-semibold">{connectedCex.length > 0 ? 'Live Read-Only' : 'None Connected'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-alphabag-panel border border-alphabag-border rounded-md p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-alphabag-green/10 flex items-center justify-center shrink-0">
                            <TrendingUp size={18} className="text-alphabag-green" />
                        </div>
                        <div>
                            <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-0.5">Available Slots</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-alphabag-text tabular-nums num">{MAX_CEX - connectedCex.length}</span>
                                <span className="text-[11px] text-alphabag-subtext">remaining</span>
                            </div>
                            <div className="text-[11px] text-alphabag-subtext font-semibold mt-0.5">Add via Integrations page</div>
                        </div>
                    </div>
                </div>

                {/* Quick icons for connected exchanges */}
                {connectedCex.length > 0 && (
                    <div className="mb-3">
                        <div className="text-[11px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-2">Connected Exchanges</div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {connectedCex.map(cex => (
                                <div key={cex.id} className="flex items-center gap-2 bg-alphabag-panel border border-alphabag-border rounded-md px-3 py-1.5">
                                    <img src={cex.icon} alt={cex.name} className="w-5 h-5 rounded-full bg-white p-0.5" />
                                    <span className="text-[11px] font-semibold text-alphabag-text">{cex.name}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-alphabag-green"></span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Exchanges Grid */}
                <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-alphabag-muted mb-2.5">
                        {availableCex.length > 0 ? `Add Exchange (${availableCex.length} available)` : 'All Exchanges Connected'}
                    </h4>
                    {availableCex.length > 0 ? (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                            {availableCex.map(cex => (
                                <button
                                    key={cex.id}
                                    type="button"
                                    onClick={() => { setActiveCexId(cex.id); setIsCexModalOpen(true); }}
                                    className="flex flex-col items-center justify-center p-2.5 bg-alphabag-panel border border-alphabag-border rounded-md transition-all group gap-1 hover:border-alphabag-yellow/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-alphabag-yellow"
                                    title={`Connect ${cex.name}`}
                                >
                                    <img src={cex.icon} alt="" aria-hidden="true" className="w-6 h-6 rounded-full bg-white p-0.5 transition-all" />
                                    <span className="text-[11px] font-semibold text-alphabag-muted group-hover:text-alphabag-text truncate w-full text-center">{cex.name}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-4 border border-dashed border-alphabag-border rounded-md">
                            <p className="text-alphabag-green font-semibold text-sm">All {MAX_CEX} slots filled!</p>
                        </div>
                    )}
                                    <p className="text-[11px] text-alphabag-subtext mt-3">To remove a connected exchange, go to the <button type="button" onClick={() => navigate('/integrations')} className="text-alphabag-yellow underline hover:no-underline">Integrations page</button>.</p>
                </div>
            </section>

            {/* ─── Membership Status (3-Tier Comparison Matrix) ─── */}
            <section className="rounded-lg border border-alphabag-border bg-alphabag-card p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-alphabag-border">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Crown className="text-alphabag-yellow" size={18} />
                            <h2 className="text-lg font-bold text-white tracking-tight">Membership Status & Tier Access</h2>
                        </div>
                        <p className="text-alphabag-subtext text-xs">
                            Hold $BAG tokens and Genesis Utility Passes to unlock multi-network intelligence and VIP multipliers.
                        </p>
                    </div>
                    {!DISABLED_PAGES.includes('/alpha-passes') && (
                        <button
                            onClick={() => navigate('/alpha-passes')}
                            className="bg-alphabag-panel hover:bg-alphabag-hover text-alphabag-text border border-alphabag-border px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all w-fit"
                        >
                            <Zap size={14} className="text-alphabag-yellow" />
                            <span>Alpha Passes Hub</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch pt-1">
                    {/* Free Tier */}
                    <div className={`bg-alphabag-panel border rounded-md p-4 flex flex-col justify-between relative transition-all ${
                        premiumTokenBalance < 2000 ? 'border-alphabag-yellow/50' : 'border-alphabag-border opacity-80'
                    }`}>
                        {premiumTokenBalance < 2000 && (
                            <div className="absolute top-3.5 right-3.5">
                                <span className="bg-alphabag-dark text-alphabag-yellow border border-alphabag-yellow/30 px-2 py-0.5 rounded text-[11px] font-semibold uppercase">
                                    Current Tier
                                </span>
                            </div>
                        )}
                        <div>
                            <div className="text-[11px] uppercase font-semibold text-alphabag-subtext">Base Public</div>
                            <h3 className="text-base font-bold text-alphabag-text mt-0.5">FREE TIER</h3>
                            <div className="text-lg font-bold text-alphabag-subtext mt-1.5 num">0 $BAG</div>
                            <div className="h-px bg-alphabag-border my-3" />
                            <div className="space-y-2 text-xs text-alphabag-subtext">
                                <div className="flex items-center gap-2 text-alphabag-text">
                                    <Check size={14} className="text-alphabag-subtext shrink-0" />
                                    <span><strong>Standard Dashboard Access</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-alphabag-text">
                                    <Check size={14} className="text-alphabag-subtext shrink-0" />
                                    <span><strong>1.0x Base</strong> ITEMS Earning</span>
                                </div>
                                <div className="flex items-center gap-2 text-alphabag-text">
                                    <Check size={14} className="text-alphabag-subtext shrink-0" />
                                    <span>Alpha Screener & Global Markets</span>
                                </div>
                                <div className="flex items-center gap-2 text-alphabag-text">
                                    <Check size={14} className="text-alphabag-subtext shrink-0" />
                                    <span>Alpha Calculator & Mission Control</span>
                                </div>
                                <div className="flex items-center gap-2 text-alphabag-text">
                                    <Check size={14} className="text-alphabag-subtext shrink-0" />
                                    <span>Alpha Passes, News & Connections</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4">
                            <span className="block text-center text-[11px] font-semibold text-alphabag-subtext uppercase">
                                Default Access
                            </span>
                        </div>
                    </div>

                    {/* Premium Tier */}
                    <div className={`bg-alphabag-panel border rounded-md p-4 flex flex-col justify-between relative transition-all ${
                        premiumTokenBalance >= 2000 ? 'border-alphabag-yellow' : 'border-alphabag-border'
                    }`}>
                        <div className="absolute top-3.5 right-3.5">
                            <span className="bg-alphabag-yellow/10 text-alphabag-yellow px-2 py-0.5 rounded text-[11px] font-semibold uppercase border border-alphabag-yellow/20">
                                {premiumTokenBalance >= 2000 ? 'Active Holder' : 'Token Holder'}
                            </span>
                        </div>
                        <div>
                            <div className="text-[11px] uppercase font-semibold text-alphabag-yellow">Pro Analytics</div>
                            <h3 className="text-base font-bold text-alphabag-text mt-0.5">PREMIUM TIER</h3>
                            <div className="text-lg font-bold text-alphabag-yellow mt-1.5 num">2,000 $BAG + 1 NFT</div>
                            <div className="h-px bg-alphabag-border my-3" />
                            <div className="space-y-2 text-xs text-alphabag-text">
                                <div className="flex items-center gap-2">
                                    <Check size={14} className="text-alphabag-yellow shrink-0" />
                                    <span><strong>All features of Free Tier</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={14} className="text-alphabag-yellow shrink-0" />
                                    <span>Real-time BSC Whale Radar</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={14} className="text-alphabag-yellow shrink-0" />
                                    <span><strong>1.25x Multiplier</strong> on ITEMS</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={14} className="text-alphabag-yellow shrink-0" />
                                    <span>Alpha Feeds & DeFi Tracker</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={14} className="text-alphabag-yellow shrink-0" />
                                    <span>5hr AlphaAI Queries</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4">
                            <button
                                disabled={true}
                                className="w-full bg-alphabag-dark text-alphabag-subtext py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"
                            >
                                Hold 10k $BAG
                            </button>
                        </div>
                    </div>

                    {/* Alpha VIP Tier */}
                    <div className="bg-alphabag-panel border-2 border-alphabag-yellow rounded-md p-4 flex flex-col justify-between relative shadow-sm">
                        <div className="absolute top-3.5 right-3.5">
                            <span className="bg-alphabag-yellow text-alphabag-dark px-2 py-0.5 rounded text-[11px] font-bold uppercase">
                                All Unlocked
                            </span>
                        </div>
                        <div>
                            <div className="text-[11px] uppercase font-semibold text-alphabag-yellow flex items-center gap-1">
                                <Crown size={12} fill="currentColor" /> Apex Level
                            </div>
                            <h3 className="text-base font-bold text-alphabag-text mt-0.5">ALPHA VIP</h3>
                            <div className="text-lg font-bold text-alphabag-yellow mt-1.5 num">2,000 $BAG + 10 NFT</div>
                            <div className="h-px bg-alphabag-border my-3" />
                            <div className="space-y-2 text-xs text-alphabag-text font-medium">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-alphabag-green shrink-0" />
                                    <span><strong>All features of Free Tier</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-alphabag-green shrink-0" />
                                    <span><strong>100% Platform Unlocks</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-alphabag-green shrink-0" />
                                    <span><strong>Alpha Mission & 1.5x MAXIMUM Multiplier</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-alphabag-green shrink-0" />
                                    <span>VIP Telegram Bot Real-time Alerts</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-alphabag-green shrink-0" />
                                    <span>Private Founder, AlphaCall, Alpha Analysts & Alpha Feeds</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-alphabag-green shrink-0" />
                                    <span>DeFi Tracker, Security Radar & All Dashboard Features</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4">
                            <button
                                disabled={true}
                                className="w-full bg-alphabag-dark text-alphabag-subtext py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"
                            >
                                <Lock size={14} />
                                <span>Get Alpha Pass</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <CexConnectModal
                isOpen={isCexModalOpen}
                onClose={() => { setIsCexModalOpen(false); setActiveCexId(null); }}
                exchangeName={activeCexId ? SUPPORTED_CEX.find(c => c.id === activeCexId)?.name || 'Exchange' : 'Exchange'}
                onConnect={handleCexConnect}
                isConnecting={isConnectingCex}
            />
        </div>
    );
};
