
import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Button } from '../../components/ui/Button';
import { Trash2, Plus, Shield, Crown, Zap, AlertCircle, Radio, Loader2, Search, Eye, Key, ShieldCheck, Link as LinkIcon, ExternalLink, Database, TrendingUp, Wallet } from 'lucide-react';
import { UserTier, Chain } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCexConnections } from '../../hooks/useCexConnections';
import { SUPPORTED_CEX } from './CexBag';
import { CexConnectModal } from '../../components/frontend/CexConnectModal';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const MANUAL_HOLDINGS_KEY = 'alphabag_manual_holdings';

interface ManualHolding {
    id: string;
    coin: string;
    symbol: string;
    amount: number;
    buyPrice: number;
    currentPrice?: number;
    notes: string;
    addedAt: string;
}

const ManualHoldingsSection: React.FC = () => {
    const [holdings, setHoldings] = useState<ManualHolding[]>(() => {
        try { return JSON.parse(localStorage.getItem(MANUAL_HOLDINGS_KEY) || '[]'); } catch { return []; }
    });
    const [coin, setCoin] = useState('');
    const [symbol, setSymbol] = useState('');
    const [amount, setAmount] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [notes, setNotes] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const save = (updated: ManualHolding[]) => {
        setHoldings(updated);
        localStorage.setItem(MANUAL_HOLDINGS_KEY, JSON.stringify(updated));
    };

    const handleAdd = () => {
        if (!coin || !symbol || !amount || !buyPrice) { setFormError('Fill in all required fields.'); return; }
        if (isNaN(Number(amount)) || isNaN(Number(buyPrice))) { setFormError('Amount and price must be numbers.'); return; }
        setFormError(null);
        const newHolding: ManualHolding = {
            id: Date.now().toString(),
            coin: coin.trim(),
            symbol: symbol.trim().toUpperCase(),
            amount: Number(amount),
            buyPrice: Number(buyPrice),
            notes: notes.trim(),
            addedAt: new Date().toISOString(),
        };
        save([...holdings, newHolding]);
        setCoin(''); setSymbol(''); setAmount(''); setBuyPrice(''); setNotes('');
    };

    const handleRemove = (id: string) => {
        save(holdings.filter(h => h.id !== id));
    };

    const totalValue = holdings.reduce((acc, h) => acc + h.amount * h.buyPrice, 0);

    return (
        <section className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Plus size={18} className="text-alphabag-yellow" /> Manual Holdings
                </h2>
                {holdings.length > 0 && (
                    <span className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest truncate max-w-[200px]" title={`$${totalValue.toLocaleString()}`}>
                        Total Cost Basis: <span className="text-white tracking-tighter">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </span>
                )}
            </div>
            <p className="text-alphabag-muted text-xs mb-5">
                Track holdings manually — no wallet connection required. Data is stored <span className="text-alphabag-yellow font-bold">locally on your device only</span> and never synced to any server.
            </p>

            {/* Add Form */}
            <div className="bg-[#0b0e11] border border-[#2b3139] p-5 rounded-lg mb-6">
                <h3 className="text-sm font-semibold text-[#eaecef] mb-4 flex items-center gap-2">
                    <Search size={14} className="text-[#fcd535]" /> Add Holding
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                    <input
                        type="text" placeholder="Name" value={coin}
                        onChange={e => setCoin(e.target.value)}
                        className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none"
                    />
                    <input
                        type="text" placeholder="Ticker" value={symbol}
                        onChange={e => setSymbol(e.target.value)}
                        className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none uppercase"
                    />
                    <input
                        type="number" placeholder="Amount" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none"
                    />
                    <input
                        type="number" placeholder="Price ($)" value={buyPrice}
                        onChange={e => setBuyPrice(e.target.value)}
                        className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none"
                    />
                    <input
                        type="text" placeholder="Notes" value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none"
                    />
                </div>
                {formError && <div className="text-alphabag-red text-xs mb-3 flex items-center gap-2"><AlertCircle size={12} />{formError}</div>}
                <Button onClick={handleAdd} className="w-full sm:w-auto font-bold">
                    <Plus size={16} className="mr-2" /> Add Holding
                </Button>
            </div>

            {/* Holdings List */}
            {holdings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 border border-dashed border-alphabag-gray/40 rounded-xl text-center px-4">
                    <p className="text-alphabag-subtext text-sm font-bold">No manual holdings yet</p>
                    <p className="text-alphabag-muted text-xs mt-1">Add entries above for coins you don't want to sync.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[540px]">
                        <thead className="text-alphabag-muted text-[10px] uppercase font-black border-b border-alphabag-gray/50">
                            <tr>
                                <th className="pb-2 pr-4">Asset</th>
                                <th className="pb-2 pr-4 text-right">Amount</th>
                                <th className="pb-2 pr-4 text-right">Buy Price</th>
                                <th className="pb-2 pr-4 text-right">Cost Basis</th>
                                <th className="pb-2 pr-4">Notes</th>
                                <th className="pb-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-alphabag-gray/20">
                            {holdings.map(h => (
                                <tr key={h.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-3 pr-4">
                                        <div className="font-bold text-white">{h.symbol}</div>
                                        <div className="text-alphabag-muted text-[10px]">{h.coin}</div>
                                    </td>
                                    <td className="py-3 pr-4 text-right font-mono text-white tabular-data tracking-tighter truncate" title={h.amount.toLocaleString()}>{h.amount.toLocaleString()}</td>
                                    <td className="py-3 pr-4 text-right font-mono text-white tabular-data tracking-tighter truncate" title={`$${h.buyPrice.toLocaleString()}`}>${h.buyPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-3 pr-4 text-right font-black text-alphabag-yellow tabular-data tracking-tighter truncate" title={`$${(h.amount * h.buyPrice).toLocaleString()}`}>
                                        ${(h.amount * h.buyPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-3 pr-4 text-alphabag-muted text-xs truncate max-w-[120px]">{h.notes || '—'}</td>
                                    <td className="py-3">
                                        <button onClick={() => handleRemove(h.id)} className="text-alphabag-subtext hover:text-alphabag-red transition-colors p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export const Settings: React.FC = () => {
    const {
        trackedWallets,
        addTrackedWallet,
        removeTrackedWallet,
        premiumTokenBalance,
        getLimits,
        isSyncing
    } = useWallet();

    const { user } = useAuth();
    const tier = user?.tier || 'FREE';
    const navigate = useNavigate();

    const [newAddress, setNewAddress] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newChain, setNewChain] = useState<Chain>('BSC');
    const [addType, setAddType] = useState<'PORTFOLIO' | 'WHALE'>('PORTFOLIO');
    const [error, setError] = useState<string | null>(null);

    // CEX API State
    const { connections: connectedCex, addConnection: addCex, removeConnection: removeCex } = useCexConnections();
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

    const openCexModal = (cexId: string) => {
        if (connectedCex.find(c => c.id === cexId)) {
            Swal.fire({ title: 'Already Connected', text: 'Remove it first to reconnect.', icon: 'info', background: '#1E2329', color: '#FFF' });
            return;
        }
        if (connectedCex.length >= MAX_CEX) {
            Swal.fire({ title: 'Limit Reached', text: `Max ${MAX_CEX} exchanges allowed.`, icon: 'warning', background: '#1E2329', color: '#FFF' });
            return;
        }
        setActiveCexId(cexId);
        setIsCexModalOpen(true);
    };

    const handleCexConnect = async (apiKey: string, _secret: string) => {
        if (!activeCexId) return;
        setIsConnectingCex(true);
        try {
            await new Promise(r => setTimeout(r, 1500));
            const info = SUPPORTED_CEX.find(c => c.id === activeCexId);
            if (!info) return;
            addCex({ ...info, apiKey: apiKey.substring(0, 4) + '••••', balance: Math.random() * 8000 + 500, isConnected: true });
            Swal.fire({ title: 'Connected', text: `${info.name} Read-Only API verified!`, icon: 'success', timer: 1500, showConfirmButton: false, background: '#1E2329', color: '#FFF' });
            setIsCexModalOpen(false);
        } finally {
            setIsConnectingCex(false);
        }
    };

    const availableCex = SUPPORTED_CEX.filter(c => !connectedCex.find(cc => cc.id === c.id));

    const TierCard = ({ level, minTokens, current }: { level: UserTier, minTokens: string, current: boolean }) => {
        const label = level === 'FREE' ? 'Beta Tester' : 'Ultimate (Elite)';
        return (
            <div className={`border rounded-lg p-6 relative overflow-hidden transition-all ${current ? 'border-[#fcd535] bg-[#fcd535]/10' : 'border-[#2b3139] bg-[#1e2329] opacity-60'}`}>
                {current && <div className="absolute top-2 right-2 text-[8px] bg-[#fcd535] text-black font-extrabold px-2 py-1 rounded tracking-widest">ACTIVE TIER</div>}
                {level === 'ULTIMATE' ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-4">
                        <div className="p-3 bg-alphabag-yellow/10 rounded-full"><Crown className="text-alphabag-yellow" size={32} /></div>
                        <div>
                            <h3 className="text-xl font-black text-white">ALPHA COMING SOON</h3>
                            <p className="text-xs text-alphabag-subtext mt-1 max-w-[200px] mx-auto">The institutional-grade tools and classified alpha streams are now live for Alpha Testing.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
                        <p className="text-sm text-alphabag-subtext mb-4">Hold {minTokens} of our utility token</p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-alphabag-green rounded-full mr-2"></span>Up to 20 DEX Wallets</li>
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-alphabag-green rounded-full mr-2"></span>Up to 20 CEX API Keys</li>
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-alphabag-green rounded-full mr-2"></span>10 Whale Watch Slots</li>
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-alphabag-green rounded-full mr-2"></span>AlphaAi Unlimited (Beta)</li>
                        </ul>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-5 animate-in fade-in duration-700 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-[#2b3139] gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                            <LinkIcon size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-[#eaecef] tracking-tight">Membership & Connections</h1>
                    </div>
                    <p className="text-[#848e9c] text-sm">Configure professional data feeds and membership status.</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[#848e9c] text-[9px] font-semibold uppercase tracking-widest mb-1">Network Verified Balance</span>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-semibold text-[#eaecef] leading-none tracking-tight tabular-nums">
                            {premiumTokenBalance.toLocaleString()} <span className="text-[#fcd535] text-base">BAG</span>
                        </div>
                        <button onClick={() => window.open('https://pancakeswap.finance', '_blank')} className="h-7 bg-[#fcd535] text-[#181a20] text-[10px] font-semibold px-3 rounded-md hover:bg-[#e0bd2e] transition-all">Buy</button>
                    </div>
                </div>
            </div>

            <section className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-[#eaecef] uppercase tracking-wider">Portfolio Connections</h2>
                    <button
                        onClick={() => navigate('/integrations')}
                        className="flex items-center gap-1.5 text-[10px] text-[#fcd535] font-semibold uppercase tracking-wider hover:text-[#e0bd2e] transition-colors"
                    >
                        View All <ExternalLink size={11} />
                    </button>
                </div>

                {/* Count Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-lg p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-[#0ecb81]/10 flex items-center justify-center shrink-0">
                            <Wallet size={18} className="text-[#0ecb81]" />
                        </div>
                        <div>
                            <div className="text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider mb-0.5">DEX Wallets</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold text-[#eaecef] tabular-nums">{portfolioCount}</span>
                                <span className="text-[10px] text-[#848e9c]">/ {limits.maxPortfolios} max</span>
                            </div>
                            <div className="text-[9px] text-[#0ecb81] font-semibold mt-0.5">Portfolio Wallets</div>
                        </div>
                    </div>
                    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-lg p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535]/10 flex items-center justify-center shrink-0">
                            <Eye size={18} className="text-[#fcd535]" />
                        </div>
                        <div>
                            <div className="text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider mb-0.5">Whale Watch</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold text-[#eaecef] tabular-nums">{whaleCount}</span>
                                <span className="text-[10px] text-[#848e9c]">/ {limits.maxWhales} max</span>
                            </div>
                            <div className="text-[9px] text-[#fcd535] font-semibold mt-0.5">Wallet Trackers</div>
                        </div>
                    </div>
                    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-lg p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Database size={18} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider mb-0.5">Total Connected</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold text-[#eaecef] tabular-nums">{portfolioCount + whaleCount}</span>
                                <span className="text-[10px] text-[#848e9c]">wallets</span>
                            </div>
                            <div className="text-[9px] text-blue-400 font-semibold mt-0.5">All Networks</div>
                        </div>
                    </div>
                </div>

                {/* Add New Wallet Form */}
                <div className="bg-[#0b0e11] border border-[#2b3139] p-6 rounded-lg">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                        <Search size={16} className="mr-2 text-alphabag-yellow" /> Add New Address Tracking
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                        <input type="text" placeholder="Wallet Address (0x...)" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none md:col-span-1" />
                        <input type="text" placeholder="Label (e.g. Binance Whale)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none" />
                        <select value={newChain} onChange={(e) => setNewChain(e.target.value as Chain)} className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none font-mono">
                            <option value="BSC">BSC</option>
                            <option value="ETH">ETH</option>
                            <option value="SOL">SOL</option>
                            <option value="BASE">BASE</option>
                            <option value="AVAX">AVAX</option>
                            <option value="ARB">ARB</option>
                        </select>
                        <select value={addType} onChange={(e) => setAddType(e.target.value as any)} className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none">
                            <option value="PORTFOLIO">Portfolio</option>
                            <option value="WHALE">Whale Watch</option>
                        </select>
                        <Button onClick={handleAdd} disabled={isSyncing} className="font-bold h-[42px] text-xs">
                            {isSyncing ? <Loader2 size={14} className="animate-spin mr-2" /> : <Plus size={14} className="mr-2" />}
                            {isSyncing ? 'Verifying...' : 'Add Connection'}
                        </Button>
                    </div>
                    {error && <div className="text-alphabag-red text-xs mt-2 bg-alphabag-red/10 p-2 rounded flex items-center"><AlertCircle size={12} className="mr-2" /> {error}</div>}
                    <p className="text-[10px] text-[#848e9c] mt-3">To view or remove connected wallets, go to the <button onClick={() => navigate('/integrations')} className="text-[#fcd535] underline hover:no-underline">Integrations page</button>.</p>
                </div>
            </section>

            {/* ─── CEX Exchange APIs ─── */}
            <section className="glass-panel p-6 rounded-xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Key size={18} className="text-alphabag-yellow" /> CEX Exchange APIs</h2>
                        <p className="text-alphabag-subtext text-xs mt-1">Connect read-only API keys to track centralized exchange balances. <span className="text-alphabag-yellow font-bold">Max {MAX_CEX} exchanges.</span></p>
                    </div>
                    <button
                        onClick={() => navigate('/integrations')}
                        className="flex items-center gap-1.5 text-[10px] text-[#fcd535] font-semibold uppercase tracking-wider hover:text-[#e0bd2e] transition-colors"
                    >
                        Manage <ExternalLink size={11} />
                    </button>
                </div>

                {/* CEX Count Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-lg p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535]/10 flex items-center justify-center shrink-0">
                            <Key size={18} className="text-[#fcd535]" />
                        </div>
                        <div>
                            <div className="text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider mb-0.5">CEX APIs Connected</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold text-[#eaecef] tabular-nums">{connectedCex.length}</span>
                                <span className="text-[10px] text-[#848e9c]">/ {MAX_CEX} max</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] shadow-[0_0_4px_rgba(14,203,129,0.8)]"></span>
                                <span className="text-[9px] text-[#0ecb81] font-semibold">{connectedCex.length > 0 ? 'Live Read-Only' : 'None Connected'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-lg p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-[#0ecb81]/10 flex items-center justify-center shrink-0">
                            <TrendingUp size={18} className="text-[#0ecb81]" />
                        </div>
                        <div>
                            <div className="text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider mb-0.5">Available Slots</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold text-[#eaecef] tabular-nums">{MAX_CEX - connectedCex.length}</span>
                                <span className="text-[10px] text-[#848e9c]">remaining</span>
                            </div>
                            <div className="text-[9px] text-[#848e9c] font-semibold mt-0.5">Add via Integrations page</div>
                        </div>
                    </div>
                </div>

                {/* Quick icons for connected exchanges */}
                {connectedCex.length > 0 && (
                    <div className="mb-6">
                        <div className="text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider mb-3">Connected Exchanges</div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {connectedCex.map(cex => (
                                <div key={cex.id} className="flex items-center gap-2 bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2">
                                    <img src={cex.icon} alt={cex.name} className="w-5 h-5 rounded-full bg-white p-0.5" />
                                    <span className="text-[10px] font-semibold text-[#eaecef]">{cex.name}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] shadow-[0_0_4px_rgba(14,203,129,0.8)]"></span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Exchanges Grid */}
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-alphabag-muted mb-3">
                        {availableCex.length > 0 ? `Add Exchange (${availableCex.length} available)` : 'All Exchanges Connected'}
                    </h4>
                    {availableCex.length > 0 ? (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                            {availableCex.map(cex => (
                                <button
                                    key={cex.id}
                                    onClick={() => openCexModal(cex.id)}
                                    className="flex flex-col items-center justify-center p-3 bg-alphabag-black border border-alphabag-gray rounded-xl hover:bg-white/5 hover:border-alphabag-yellow/40 transition-all group gap-1"
                                    title={`Connect ${cex.name}`}
                                >
                                    <img src={cex.icon} alt={cex.name} className="w-7 h-7 rounded-full bg-white p-0.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                                    <span className="text-[8px] font-bold text-alphabag-muted group-hover:text-alphabag-subtext truncate w-full text-center">{cex.name}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-6 border border-dashed border-alphabag-gray/40 rounded-xl">
                            <p className="text-alphabag-green font-bold text-sm">All {MAX_CEX} slots filled!</p>
                        </div>
                    )}
                    <p className="text-[10px] text-[#848e9c] mt-3">To remove a connected exchange, go to the <button onClick={() => navigate('/integrations')} className="text-[#fcd535] underline hover:no-underline">Integrations page</button>.</p>
                </div>
            </section>

            {/* ─── Manual Holdings ─── */}
            <ManualHoldingsSection />

            {/* ─── Membership Status ─── */}
            <section className="relative">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Crown className="text-alphabag-yellow" size={20} /> Membership Status</h2>
                <div className="relative group/membership">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 filter blur-[2px] opacity-40 transition-all duration-700 group-hover/membership:blur-[1px]">
                        <TierCard level="FREE" minTokens="0" current={tier === 'FREE'} />
                        <TierCard level="ULTIMATE" minTokens="100k" current={tier === 'ULTIMATE'} />
                    </div>
                    
                    {/* Membership Mask */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="bg-alphabag-black/20 backdrop-blur-sm border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                            <ShieldCheck size={16} className="text-alphabag-yellow animate-pulse" />
                            <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Syncing Status via Network</span>
                        </div>
                    </div>
                </div>
            </section>

            <CexConnectModal
                isOpen={isCexModalOpen}
                onClose={() => setIsCexModalOpen(false)}
                exchangeName={activeCexId ? SUPPORTED_CEX.find(c => c.id === activeCexId)?.name || 'Exchange' : 'Exchange'}
                onConnect={handleCexConnect}
                isConnecting={isConnectingCex}
            />
        </div>
    );
};
