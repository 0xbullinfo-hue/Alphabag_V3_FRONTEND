
import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Button } from '../components/ui/Button';
import { Trash2, Plus, Shield, Crown, Zap, AlertCircle, Radio, Loader2, Search, Eye, Key, ShieldCheck } from 'lucide-react';
import { UserTier, Chain } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCexConnections } from '../hooks/useCexConnections';
import { SUPPORTED_CEX } from './CexBag';
import { CexConnectModal } from '../components/CexConnectModal';
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
        <section className="glass-panel p-6 rounded-xl shadow-xl">
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
            <div className="glass-panel p-5 rounded-xl border-white/10 mb-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Search size={14} className="text-alphabag-yellow" /> Add Holding
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                    <input
                        type="text" placeholder="Coin Name (e.g. Bitcoin)" value={coin}
                        onChange={e => setCoin(e.target.value)}
                        className="bg-alphabag-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-alphabag-yellow/40 outline-none"
                    />
                    <input
                        type="text" placeholder="Ticker (e.g. BTC)" value={symbol}
                        onChange={e => setSymbol(e.target.value)}
                        className="bg-alphabag-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-alphabag-yellow/40 outline-none uppercase"
                    />
                    <input
                        type="number" placeholder="Amount held" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="bg-alphabag-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-alphabag-yellow/40 outline-none"
                    />
                    <input
                        type="number" placeholder="Avg Buy Price ($)" value={buyPrice}
                        onChange={e => setBuyPrice(e.target.value)}
                        className="bg-alphabag-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-alphabag-yellow/40 outline-none"
                    />
                    <input
                        type="text" placeholder="Notes (optional)" value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="bg-alphabag-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-alphabag-yellow/40 outline-none"
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
            <div className={`border rounded-xl p-6 relative overflow-hidden transition-all ${current ? 'border-alphabag-yellow bg-alphabag-yellow/10' : 'border-alphabag-gray bg-alphabag-dark opacity-60'}`}>
                {current && <div className="absolute top-2 right-2 text-[8px] bg-alphabag-yellow text-black font-extrabold px-2 py-1 rounded tracking-widest">ACTIVE TIER</div>}
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
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 animate-fade-in">
            <div className="relative overflow-hidden rounded-[2rem] bg-alphabag-black/50 border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.35)] p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-alphabag-yellow/10 via-transparent to-transparent blur-3xl pointer-events-none"></div>
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative">Membership & Connection <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">Hub</span></h1>
                    <p className="text-alphabag-subtext mt-1">Configure your professional data feeds and membership status.</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-alphabag-subtext text-[10px] font-black uppercase tracking-widest mb-1">Network Verified Balance</span>
                    <div className="flex items-center gap-3">
                        <div className="text-3xl font-extrabold text-white leading-none tracking-tighter">
                            {premiumTokenBalance.toLocaleString()} <span className="text-alphabag-yellow text-lg">BAG</span>
                        </div>
                        <Button variant="primary" size="xs" onClick={() => window.open('https://pancakeswap.finance', '_blank')} className="h-8">Buy</Button>
                    </div>
                </div>
            </div>
            </div>

            <section className="glass-panel p-6 rounded-xl shadow-xl">
                <h2 className="text-lg font-bold text-white mb-6">Portfolio Connections</h2>
                <div className="glass-panel p-6 rounded-xl border-white/10 mb-8">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                        <Search size={16} className="mr-2 text-alphabag-yellow" /> Add New Address Tracking
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <input type="text" placeholder="Wallet Address (0x...)" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="bg-alphabag-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-alphabag-yellow/40 outline-none md:col-span-1" />
                        <input type="text" placeholder="Label (e.g. Binance Whale)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="bg-alphabag-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-alphabag-yellow/40 outline-none" />
                        <select value={newChain} onChange={(e) => setNewChain(e.target.value as Chain)} className="bg-alphabag-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-alphabag-yellow/40 outline-none font-mono">
                            <option value="BSC">BSC</option>
                            <option value="ETH">ETH</option>
                            <option value="SOL">SOL</option>
                            <option value="BASE">BASE</option>
                            <option value="AVAX">AVAX</option>
                            <option value="ARB">ARB</option>
                        </select>
                        <select value={addType} onChange={(e) => setAddType(e.target.value as any)} className="bg-alphabag-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-alphabag-yellow/40 outline-none">
                            <option value="PORTFOLIO">Portfolio</option>
                            <option value="WHALE">Whale Watch</option>
                        </select>
                        <Button onClick={handleAdd} disabled={isSyncing} className="font-bold">
                            {isSyncing ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                            {isSyncing ? 'Verifying...' : 'Add Connection'}
                        </Button>
                    </div>
                    {error && <div className="text-alphabag-red text-xs mt-2 bg-alphabag-red/10 p-2 rounded flex items-center"><AlertCircle size={12} className="mr-2" /> {error}</div>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-white font-black text-sm mb-4 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-alphabag-green" /> Portfolio Connections ({portfolioCount}/{limits.maxPortfolios})</h4>
                        <div className="space-y-3">
                            {trackedWallets.filter(w => w.type === 'PORTFOLIO').map(w => (
                                <div key={w.id} className="flex justify-between items-center p-4 glass-panel rounded-xl hover:border-alphabag-subtext transition-all">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-white font-bold text-sm">{w.label}</div>
                                            <div className="text-[10px] bg-alphabag-yellow/10 text-alphabag-yellow px-1.5 py-0.5 rounded font-mono font-bold">{w.chain || 'ETH'}</div>
                                        </div>
                                        <div className="text-alphabag-subtext text-[10px] font-mono">{w.address}</div>
                                    </div>
                                    <button onClick={() => removeTrackedWallet(w.id)} className="text-alphabag-subtext hover:text-alphabag-red transition-colors"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-widest flex items-center"><Eye size={14} className="mr-2 text-alphabag-yellow" /> Whale Watch Slots ({whaleCount}/{limits.maxWhales})</h4>
                        <div className="space-y-3">
                            {trackedWallets.filter(w => w.type === 'WHALE').map(w => (
                                <div key={w.id} className="flex justify-between items-center p-4 glass-panel rounded-xl hover:border-alphabag-green/30 transition-all">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-white font-bold text-sm">{w.label}</div>
                                            <div className="text-[10px] bg-alphabag-yellow/10 text-alphabag-yellow px-1.5 py-0.5 rounded font-mono font-bold">{w.chain || 'ETH'}</div>
                                        </div>
                                        <div className="text-alphabag-subtext text-[10px] font-mono">{w.address}</div>
                                    </div>
                                    <button onClick={() => removeTrackedWallet(w.id)} className="text-alphabag-subtext hover:text-alphabag-red transition-colors"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CEX Exchange APIs ─── */}
            <section className="glass-panel p-6 rounded-xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Key size={18} className="text-alphabag-yellow" /> CEX Exchange APIs</h2>
                        <p className="text-alphabag-subtext text-xs mt-1">Connect read-only API keys to track centralized exchange balances. <span className="text-alphabag-yellow font-bold">Max {MAX_CEX} exchanges.</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-alphabag-muted text-[10px] font-black uppercase tracking-widest">{connectedCex.length}/{MAX_CEX}</span>
                        <ShieldCheck size={14} className="text-alphabag-green" />
                    </div>
                </div>

                {/* Connected List */}
                {connectedCex.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                        {connectedCex.map(cex => (
                            <div key={cex.id} className="flex items-center justify-between p-4 glass-panel rounded-xl hover:border-alphabag-yellow/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <img src={cex.icon} alt={cex.name} className="w-8 h-8 rounded-full bg-white p-0.5" />
                                    <div>
                                        <div className="font-bold text-white text-sm flex items-center gap-2">
                                            {cex.name}
                                            <span className="flex items-center text-[9px] text-alphabag-green font-bold uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 rounded-full bg-alphabag-green mr-1 shadow-[0_0_4px_rgba(52,211,153,0.8)]"></span>Live
                                            </span>
                                        </div>
                                        <div className="text-alphabag-muted text-[10px] font-mono">Key: {cex.apiKey}</div>
                                    </div>
                                </div>
                                <button onClick={() => removeCex(cex.id)} className="text-alphabag-subtext hover:text-alphabag-red transition-colors p-2"><Trash2 size={14} /></button>
                            </div>
                        ))}
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
                </div>
            </section>

            {/* ─── Manual Holdings ─── */}
            <ManualHoldingsSection />

            {/* ─── Membership Status ─── */}
            <section>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Crown className="text-alphabag-yellow" size={20} /> Membership Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TierCard level="FREE" minTokens="0" current={tier === 'FREE'} />
                    <TierCard level="ULTIMATE" minTokens="100k" current={tier === 'ULTIMATE'} />
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
