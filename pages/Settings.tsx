
import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Button } from '../components/ui/Button';
// Added Eye to imports
import { Trash2, Plus, Shield, Crown, Zap, AlertCircle, Radio, Loader2, Search, Eye } from 'lucide-react';
import { UserTier, Chain } from '../types';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
    const {
        trackedWallets,
        addTrackedWallet,
        removeTrackedWallet,
        premiumTokenBalance,
        getLimits,
        isSyncing
    } = useWallet();

    // Get tier from useAuth instead of useWallet which doesn't provide it
    const { user } = useAuth();
    const tier = user?.tier || 'FREE';

    const [newAddress, setNewAddress] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newChain, setNewChain] = useState<Chain>('BSC');
    const [addType, setAddType] = useState<'PORTFOLIO' | 'WHALE'>('PORTFOLIO');
    const [error, setError] = useState<string | null>(null);

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

    // Fixed TierCard to use FREE and ULTIMATE levels to match UserTier type defined in types.ts
    const TierCard = ({ level, minTokens, current }: { level: UserTier, minTokens: string, current: boolean }) => {
        // Fixed comparison types (BASIC/PREMIUM/DEGEN -> FREE/ULTIMATE)
        const label = level === 'FREE' ? 'Basic' : 'Ultimate (Elite)';
        return (
            <div className={`
            border rounded-xl p-6 relative overflow-hidden transition-all
            ${current ? 'border-alphabag-yellow bg-alphabag-yellow/10' : 'border-alphabag-gray bg-alphabag-dark opacity-60'}
        `}>
                {current && <div className="absolute top-2 right-2 text-[8px] bg-alphabag-yellow text-black font-extrabold px-2 py-1 rounded tracking-widest">ACTIVE TIER</div>}
                <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
                <p className="text-sm text-alphabag-subtext mb-4">Hold {minTokens} BAG Tokens</p>
                <ul className="space-y-2 text-sm">
                    {/* Updated feature list to match 2-tier system limits from WalletContext.tsx */}
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-alphabag-green rounded-full mr-2"></span> {level === 'FREE' ? '5' : '1000'} Portfolios</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-alphabag-green rounded-full mr-2"></span> {level === 'FREE' ? '5' : '1000'} Whale Watch Slots</li>
                    <li className="flex items-center"><span className="w-1.5 h-1.5 bg-alphabag-green rounded-full mr-2"></span> AlphaAi ({level === 'FREE' ? '4h Daily' : 'Unlimited'})</li>
                    {level === 'ULTIMATE' && <li className="flex items-center text-alphabag-yellow font-bold"><Radio size={12} className="mr-2" /> AlphaCalls Full Access</li>}
                </ul>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Membership & Sync Node Settings</h1>
                <p className="text-alphabag-subtext mt-1">Configure your professional data feeds and membership status.</p>
            </div>

            <section>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Crown className="mr-2 text-alphabag-yellow" size={20} /> Membership Status
                </h2>
                {/* Updated grid to match the strict 2-tier system (FREE and ULTIMATE) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TierCard level="FREE" minTokens="0" current={tier === 'FREE'} />
                    <TierCard level="ULTIMATE" minTokens="1M" current={tier === 'ULTIMATE'} />
                </div>
                <div className="mt-4 p-4 bg-alphabag-dark border border-alphabag-gray rounded-xl flex items-center justify-between">
                    <div>
                        <span className="text-alphabag-subtext text-xs font-bold uppercase tracking-widest">Network Verified Balance:</span>
                        <span className="ml-3 text-white font-extrabold">{premiumTokenBalance.toLocaleString()} $BAG</span>
                    </div>
                    {/* Replaced handleHoldTokensClick with direct link as it's missing from useWallet context */}
                    <Button variant="primary" size="sm" onClick={() => window.open('https://uniswap.org', '_blank')}>Buy BAG on DEX</Button>
                </div>
            </section>

            <section className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-6">Manage Tracking Nodes</h2>
                <div className="bg-alphabag-black/40 p-6 rounded-xl border border-alphabag-gray mb-8">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                        <Search size={16} className="mr-2 text-alphabag-yellow" /> Add New Address Tracking
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <input type="text" placeholder="Wallet Address (0x...)" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="bg-alphabag-black border border-alphabag-gray rounded px-3 py-2 text-sm text-white focus:border-alphabag-yellow outline-none md:col-span-1" />
                        <input type="text" placeholder="Label (e.g. Binance Whale)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="bg-alphabag-black border border-alphabag-gray rounded px-3 py-2 text-sm text-white focus:border-alphabag-yellow outline-none" />
                        <select value={newChain} onChange={(e) => setNewChain(e.target.value as Chain)} className="bg-alphabag-black border border-alphabag-gray rounded px-3 py-2 text-sm text-white focus:border-alphabag-yellow outline-none font-mono">
                            <option value="BSC">BSC</option>
                            <option value="ETH">ETH</option>
                            <option value="SOL">SOL</option>
                            <option value="BASE">BASE</option>
                            <option value="AVAX">AVAX</option>
                            <option value="ARB">ARB</option>
                        </select>
                        <select value={addType} onChange={(e) => setAddType(e.target.value as any)} className="bg-alphabag-black border border-alphabag-gray rounded px-3 py-2 text-sm text-white focus:border-alphabag-yellow outline-none">
                            <option value="PORTFOLIO">Portfolio</option>
                            <option value="WHALE">Whale Watch</option>
                        </select>
                        <Button onClick={handleAdd} disabled={isSyncing} className="font-bold">
                            {isSyncing ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                            {isSyncing ? 'Verifying...' : 'Add Node'}
                        </Button>
                    </div>
                    {error && <div className="text-alphabag-red text-xs mt-2 bg-alphabag-red/10 p-2 rounded flex items-center"><AlertCircle size={12} className="mr-2" /> {error}</div>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-widest flex items-center">
                            <Zap size={14} className="mr-2 text-alphabag-green" /> Portfolio Nodes ({portfolioCount}/{limits.maxPortfolios})
                        </h4>
                        <div className="space-y-2">
                            {trackedWallets.filter(w => w.type === 'PORTFOLIO').map(w => (
                                <div key={w.id} className="flex justify-between items-center p-4 bg-alphabag-black/50 rounded-xl border border-alphabag-gray hover:border-alphabag-subtext transition-colors">
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
                        <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-widest flex items-center">
                            <Eye size={14} className="mr-2 text-alphabag-yellow" /> Whale Watch Slots ({whaleCount}/{limits.maxWhales})
                        </h4>
                        <div className="space-y-2">
                            {trackedWallets.filter(w => w.type === 'WHALE').map(w => (
                                <div key={w.id} className="flex justify-between items-center p-4 bg-alphabag-black/50 rounded-xl border border-alphabag-gray hover:border-alphabag-subtext transition-colors">
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
        </div>
    );
};
