
import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Button } from '../../components/ui/Button';
import { 
  Trash2, 
  Plus, 
  Shield, 
  Crown, 
  Zap, 
  AlertCircle, 
  Radio, 
  Loader2, 
  Search, 
  Eye, 
  Key, 
  ShieldCheck, 
  Link as LinkIcon, 
  ExternalLink, 
  Database, 
  TrendingUp, 
  Wallet,
  Check,
  X,
  CheckCircle2,
  Layers,
  Lock
} from 'lucide-react';
import { UserTier, Chain } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCexConnections } from '../../hooks/useCexConnections';
import { SUPPORTED_CEX } from './CexBag';
import { CexConnectModal } from '../../components/frontend/CexConnectModal';
import { useNavigate } from 'react-router-dom';
import { NFT_CONFIG } from '../../services/config';
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
        <section className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4">
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
            <div className="bg-alphabag-black border border-alphabag-gray/60 p-5 rounded-xl mb-2">
                <h3 className="text-sm font-semibold text-alphabag-text mb-2 flex items-center gap-2">
                    <Search size={14} className="text-alphabag-yellow" /> Add Holding
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
                    <input
                        type="text" placeholder="Name" value={coin}
                        onChange={e => setCoin(e.target.value)}
                        disabled={true}
                        className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none opacity-50 cursor-not-allowed"
                    />
                    <input
                        type="text" placeholder="Ticker" value={symbol}
                        onChange={e => setSymbol(e.target.value)}
                        disabled={true}
                        className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none uppercase opacity-50 cursor-not-allowed"
                    />
                    <input
                        type="number" placeholder="Amount" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        disabled={true}
                        className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none opacity-50 cursor-not-allowed"
                    />
                    <input
                        type="number" placeholder="Price ($)" value={buyPrice}
                        onChange={e => setBuyPrice(e.target.value)}
                        disabled={true}
                        className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none opacity-50 cursor-not-allowed"
                    />
                    <input
                        type="text" placeholder="Notes" value={notes}
                        onChange={e => setNotes(e.target.value)}
                        disabled={true}
                        className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none opacity-50 cursor-not-allowed"
                    />
                </div>
                {formError && <div className="text-alphabag-red text-xs mb-3 flex items-center gap-2"><AlertCircle size={12} />{formError}</div>}
                <Button onClick={handleAdd} disabled={true} className="w-full sm:w-auto font-bold opacity-50 cursor-not-allowed">
                    <Plus size={16} className="mr-2" /> Add Holding
                </Button>
            </div>

            {/* Holdings List */}
            {holdings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 border border-dashed border-alphabag-gray/40 rounded-2xl text-center px-4">
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
                                        <button onClick={() => {}} disabled={true} className="text-alphabag-subtext p-1 opacity-30 cursor-not-allowed">
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
    const { connections: connectedCex, removeConnection: removeCex, connectExchange } = useCexConnections();
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

    const handleCexConnect = async (apiKey: string, secret: string) => {
        if (!activeCexId) return;
        setIsConnectingCex(true);
        try {
            const info = SUPPORTED_CEX.find(c => c.id === activeCexId);
            if (!info) return;
            await connectExchange(info, apiKey, secret);
            Swal.fire({ title: 'Connected', text: `${info.name} Read-Only API verified!`, icon: 'success', timer: 1500, showConfirmButton: false, background: '#1E2329', color: '#FFF' });
            setIsCexModalOpen(false);
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
        <div className="w-full space-y-2 animate-in fade-in duration-700 pb-2">
            {/* Page Header */}
            <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-dark">
                            <LinkIcon size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">Membership & Connections</h1>
                    </div>
                    <p className="text-alphabag-subtext text-sm">Configure professional data feeds and membership status.</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-alphabag-subtext text-[9px] font-semibold uppercase tracking-widest mb-1">Network Verified Balance</span>
                    <div className="flex items-center gap-2">
                        <div className="text-2xl font-semibold text-alphabag-text leading-none tracking-tight tabular-nums">
                            {premiumTokenBalance.toLocaleString()} <span className="text-alphabag-yellow text-base">BAG</span>
                        </div>
                        <button onClick={() => {}} disabled={true} className="h-7 bg-alphabag-yellow text-alphabag-dark text-[10px] font-semibold px-3 rounded-md transition-all opacity-50 cursor-not-allowed">Buy</button>
                    </div>
                </div>
            </div>

            <section className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-alphabag-text uppercase tracking-wider">Portfolio Connections</h2>
                    <button
                        onClick={() => {}}
                        disabled={true}
                        className="flex items-center gap-1.5 text-[10px] text-alphabag-yellow font-semibold uppercase tracking-wider transition-colors opacity-50 cursor-not-allowed"
                    >
                        View All <ExternalLink size={11} />
                    </button>
                </div>

                {/* Count Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <div className="bg-alphabag-black border border-alphabag-gray/60 rounded-xl p-4 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-md bg-alphabag-green/10 flex items-center justify-center shrink-0">
                            <Wallet size={18} className="text-alphabag-green" />
                        </div>
                        <div>
                            <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-0.5">DEX Wallets</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold text-alphabag-text tabular-nums">{portfolioCount}</span>
                                <span className="text-[10px] text-alphabag-subtext">/ {limits.maxPortfolios} max</span>
                            </div>
                            <div className="text-[9px] text-alphabag-green font-semibold mt-0.5">Portfolio Wallets</div>
                        </div>
                    </div>
                    <div className="bg-alphabag-black border border-alphabag-gray/60 rounded-xl p-4 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-md bg-alphabag-yellow/10 flex items-center justify-center shrink-0">
                            <Eye size={18} className="text-alphabag-yellow" />
                        </div>
                        <div>
                            <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-0.5">Whale Watch</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold text-alphabag-text tabular-nums">{whaleCount}</span>
                                <span className="text-[10px] text-alphabag-subtext">/ {limits.maxWhales} max</span>
                            </div>
                            <div className="text-[9px] text-alphabag-yellow font-semibold mt-0.5">Wallet Trackers</div>
                        </div>
                    </div>
                    <div className="bg-alphabag-black border border-alphabag-gray/60 rounded-xl p-4 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Database size={18} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-0.5">Total Connected</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold text-alphabag-text tabular-nums">{portfolioCount + whaleCount}</span>
                                <span className="text-[10px] text-alphabag-subtext">wallets</span>
                            </div>
                            <div className="text-[9px] text-blue-400 font-semibold mt-0.5">All Networks</div>
                        </div>
                    </div>
                </div>

                {/* Add New Wallet Form */}
                <div className="bg-alphabag-black border border-alphabag-gray/60 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center">
                        <Search size={16} className="mr-2 text-alphabag-yellow" /> Add New Address Tracking
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
                        <input type="text" placeholder="Wallet Address (0x...)" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} disabled={true} className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none md:col-span-1 opacity-50 cursor-not-allowed" />
                        <input type="text" placeholder="Label (e.g. Binance Whale)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} disabled={true} className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none opacity-50 cursor-not-allowed" />
                        <select value={newChain} onChange={(e) => setNewChain(e.target.value as Chain)} disabled={true} className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none font-mono opacity-50 cursor-not-allowed">
                            <option value="BSC">BSC</option>
                            <option value="ETH">ETH</option>
                            <option value="SOL">SOL</option>
                            <option value="BASE">BASE</option>
                            <option value="AVAX">AVAX</option>
                            <option value="ARB">ARB</option>
                        </select>
                        <select value={addType} onChange={(e) => setAddType(e.target.value as any)} disabled={true} className="bg-alphabag-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-alphabag-yellow/40 outline-none opacity-50 cursor-not-allowed">
                            <option value="PORTFOLIO">Portfolio</option>
                            <option value="WHALE">Whale Watch</option>
                        </select>
                        <Button onClick={handleAdd} disabled={true} className="font-bold h-[42px] text-xs opacity-50 cursor-not-allowed">
                            <Plus size={14} className="mr-2" /> Add Connection
                        </Button>
                    </div>
                    {error && <div className="text-alphabag-red text-xs mt-2 bg-alphabag-red/10 p-2 rounded flex items-center"><AlertCircle size={12} className="mr-2" /> {error}</div>}
                    <p className="text-[10px] text-alphabag-subtext mt-3">To view or remove connected wallets, go to the <button onClick={() => {}} disabled={true} className="text-alphabag-yellow underline hover:no-underline cursor-not-allowed">Integrations page</button>.</p>
                </div>
            </section>

            {/* ─── CEX Exchange APIs ─── */}
            <section className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 shadow-xl relative">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Key size={18} className="text-alphabag-yellow" /> CEX Exchange APIs</h2>
                        <p className="text-alphabag-subtext text-xs mt-1">Connect read-only API keys to track centralized exchange balances. <span className="text-alphabag-yellow font-bold">Max {MAX_CEX} exchanges.</span></p>
                    </div>
                    <button
                        onClick={() => {}}
                        disabled={true}
                        className="flex items-center gap-1.5 text-[10px] text-alphabag-yellow font-semibold uppercase tracking-wider transition-colors opacity-50 cursor-not-allowed"
                    >
                        Manage <ExternalLink size={11} />
                    </button>
                </div>

                {/* CEX Count Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div className="bg-alphabag-black border border-alphabag-gray/60 rounded-xl p-4 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-md bg-alphabag-yellow/10 flex items-center justify-center shrink-0">
                            <Key size={18} className="text-alphabag-yellow" />
                        </div>
                        <div>
                            <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-0.5">CEX APIs Connected</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold text-alphabag-text tabular-nums">{connectedCex.length}</span>
                                <span className="text-[10px] text-alphabag-subtext">/ {MAX_CEX} max</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-alphabag-green"></span>
                                <span className="text-[9px] text-alphabag-green font-semibold">{connectedCex.length > 0 ? 'Live Read-Only' : 'None Connected'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-alphabag-black border border-alphabag-gray/60 rounded-xl p-4 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-md bg-alphabag-green/10 flex items-center justify-center shrink-0">
                            <TrendingUp size={18} className="text-alphabag-green" />
                        </div>
                        <div>
                            <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-0.5">Available Slots</div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold text-alphabag-text tabular-nums">{MAX_CEX - connectedCex.length}</span>
                                <span className="text-[10px] text-alphabag-subtext">remaining</span>
                            </div>
                            <div className="text-[9px] text-alphabag-subtext font-semibold mt-0.5">Add via Integrations page</div>
                        </div>
                    </div>
                </div>

                {/* Quick icons for connected exchanges */}
                {connectedCex.length > 0 && (
                    <div className="mb-2">
                        <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-3">Connected Exchanges</div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {connectedCex.map(cex => (
                                <div key={cex.id} className="flex items-center gap-2 bg-alphabag-black border border-alphabag-gray/60 rounded-lg px-3 py-2">
                                    <img src={cex.icon} alt={cex.name} className="w-5 h-5 rounded-full bg-white p-0.5" />
                                    <span className="text-[10px] font-semibold text-alphabag-text">{cex.name}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-alphabag-green"></span>
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
                                    onClick={() => {}}
                                    disabled={true}
                                    className="flex flex-col items-center justify-center p-3 bg-alphabag-black border border-alphabag-gray/60 rounded-xl transition-all group gap-1 opacity-50 cursor-not-allowed"
                                    title={`Connect ${cex.name}`}
                                >
                                    <img src={cex.icon} alt={cex.name} className="w-7 h-7 rounded-full bg-white p-0.5 grayscale opacity-30 transition-all" />
                                    <span className="text-[8px] font-bold text-alphabag-muted truncate w-full text-center">{cex.name}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-4 border border-dashed border-alphabag-gray/40 rounded-xl">
                            <p className="text-alphabag-green font-bold text-sm">All {MAX_CEX} slots filled!</p>
                        </div>
                    )}
                    <p className="text-[10px] text-alphabag-subtext mt-3">To remove a connected exchange, go to the <button onClick={() => {}} disabled={true} className="text-alphabag-yellow underline hover:no-underline cursor-not-allowed">Integrations page</button>.</p>
                </div>
            </section>

            {/* ─── Membership Status (3-Tier Comparison Matrix) ─── */}
            <section className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-alphabag-gray">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Crown className="text-alphabag-yellow" size={20} />
                            <h2 className="text-xl font-bold text-white tracking-tight">Membership Status & Tier Access</h2>
                        </div>
                        <p className="text-alphabag-subtext text-xs">
                            Hold $BAG tokens and Genesis Utility Passes to unlock multi-network intelligence and VIP multipliers.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/alpha-passes')}
                        className="bg-alphabag-gray hover:bg-alphabag-gray/80 text-alphabag-text border border-alphabag-gray px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all w-fit"
                    >
                        <Zap size={14} className="text-alphabag-yellow" />
                        <span>Alpha Passes Hub</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch pt-2">
                    {/* Free Tier */}
                    <div className={`bg-alphabag-black border rounded-xl p-5 flex flex-col justify-between relative transition-all ${
                        premiumTokenBalance < 10000 ? 'border-alphabag-yellow/50 shadow-sm' : 'border-alphabag-gray opacity-80'
                    }`}>
                        {premiumTokenBalance < 10000 && (
                            <div className="absolute top-4 right-4">
                                <span className="bg-alphabag-gray text-alphabag-yellow border border-alphabag-yellow/30 px-2 py-0.5 rounded text-[9px] font-semibold uppercase">
                                    Current Tier
                                </span>
                            </div>
                        )}
                        <div>
                            <div className="text-[10px] uppercase font-semibold text-alphabag-subtext">Base Public</div>
                            <h3 className="text-lg font-semibold text-alphabag-text mt-0.5">FREE TIER</h3>
                            <div className="text-xl font-semibold text-alphabag-subtext mt-2">0 $BAG</div>
                            <div className="h-px bg-alphabag-gray my-4" />
                            <div className="space-y-2.5 text-xs text-alphabag-subtext">
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
                        <div className="pt-6">
                            <span className="block text-center text-[10px] font-semibold text-alphabag-subtext uppercase">
                                Default Access
                            </span>
                        </div>
                    </div>

                    {/* Premium Tier */}
                    <div className={`bg-alphabag-black border rounded-xl p-5 flex flex-col justify-between relative transition-all ${
                        premiumTokenBalance >= 10000 ? 'border-alphabag-yellow shadow-md' : 'border-alphabag-gray'
                    }`}>
                        <div className="absolute top-4 right-4">
                            <span className="bg-alphabag-yellow/10 text-alphabag-yellow px-2 py-0.5 rounded text-[9px] font-semibold uppercase border border-alphabag-yellow/20">
                                {premiumTokenBalance >= 10000 ? 'Active Holder' : 'Token Holder'}
                            </span>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-semibold text-alphabag-yellow">Pro Analytics</div>
                            <h3 className="text-lg font-semibold text-alphabag-text mt-0.5">PREMIUM TIER</h3>
                            <div className="text-xl font-semibold text-alphabag-yellow mt-2">10,000 $BAG</div>
                            <div className="h-px bg-alphabag-gray my-4" />
                            <div className="space-y-2.5 text-xs text-alphabag-text">
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
                        <div className="pt-6">
                            <button
                                disabled={true}
                                className="w-full bg-alphabag-gray text-alphabag-subtext py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"
                            >
                                Hold 10k $BAG
                            </button>
                        </div>
                    </div>

                    {/* Alpha VIP Tier */}
                    <div className="bg-alphabag-black border-2 border-alphabag-yellow rounded-xl p-5 flex flex-col justify-between relative shadow-sm">
                        <div className="absolute top-4 right-4">
                            <span className="bg-alphabag-yellow text-alphabag-dark px-2 py-0.5 rounded text-[9px] font-black uppercase">
                                All Unlocked
                            </span>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-semibold text-alphabag-yellow flex items-center gap-1">
                                <Crown size={12} fill="currentColor" /> Apex Level
                            </div>
                            <h3 className="text-lg font-semibold text-alphabag-text mt-0.5">ALPHA VIP</h3>
                            <div className="text-xl font-semibold text-alphabag-yellow mt-2">10,000 $BAG + 10 NFT</div>
                            <div className="h-px bg-alphabag-gray my-4" />
                            <div className="space-y-2.5 text-xs text-alphabag-text font-medium">
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
                        <div className="pt-6">
                            <button
                                disabled={true}
                                className="w-full bg-alphabag-gray text-alphabag-subtext py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"
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
                onClose={() => setIsCexModalOpen(false)}
                exchangeName={activeCexId ? SUPPORTED_CEX.find(c => c.id === activeCexId)?.name || 'Exchange' : 'Exchange'}
                onConnect={handleCexConnect}
                isConnecting={isConnectingCex}
            />
        </div>
    );
};
