import React, { useState, useEffect } from 'react';
import { 
    Gift, Twitter, Send, CheckCircle2, Lock, Timer, MousePointer2, 
    ArrowRight, Shield, ShieldAlert, Zap, ExternalLink, Users, BarChart3, Copy, Star, ChevronRight, Bell, X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TGECountdown } from '../components/TGECountdown';
import Swal from 'sweetalert2';

export const Airdrop: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [isTaskLoading, setIsTaskLoading] = useState(false);
    const [missionPaused, setMissionPaused] = useState(false);
    // Local live ITEMS and TGE reserve balance — syncs from user context, updated immediately on claim
    const [bagBalance, setBagBalance] = useState<number>(0);
    const [itemsBalance, setItemsBalance] = useState<number>(0);
    const [itemsToBagRate, setItemsToBagRate] = useState<number | null>(null);
    const [campaignEnded, setCampaignEnded] = useState(false);



    // Live countdowns for daily/weekly reset
    const [dailyCountdown, setDailyCountdown] = useState('00:00:00:00');
    const [weeklyCountdown, setWeeklyCountdown] = useState('00:00:00:00');
    const formatCountdown = (ms: number) => {
        if (ms <= 0) return '00:00:00:00';
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((ms % (1000 * 60)) / 1000);
        return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };



    // Submission Form State
    const [bscWallet, setBscWallet] = useState('');
    const [xLink, setXLink] = useState('');
    const [review, setReview] = useState('');
    const [taskLinks, setTaskLinks] = useState<Record<string, string>>({});
    const [taskFeedback, setTaskFeedback] = useState<Record<string, string>>({});
    const handleTaskLinkChange = (id: string, value: string) => setTaskLinks(prev => ({ ...prev, [id]: value }));
    const handleTaskFeedbackChange = (id: string, value: string) => setTaskFeedback(prev => ({ ...prev, [id]: value }));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isFounderApplication, setIsFounderApplication] = useState(false);
    
    // Founder Project Fields
    const [projectName, setProjectName] = useState('');
    const [projectTicker, setProjectTicker] = useState('');
    const [projectManifesto, setProjectManifesto] = useState('');
    const [projectSocial, setProjectSocial] = useState('');
    const [projectWebsite, setProjectWebsite] = useState('');
    const [projectContract, setProjectContract] = useState('');
    const [projectGoals, setProjectGoals] = useState('');
    const [founderSocial, setFounderSocial] = useState('');


    // Live countdown interval for daily/weekly missions
    useEffect(() => {
        const tick = () => {
            const hasDaily = tasks.some((t: any) => t.frequency?.toUpperCase() === 'DAILY' || t.type?.toUpperCase() === 'DAILY');
            const hasWeekly = tasks.some((t: any) => t.frequency?.toUpperCase() === 'WEEKLY' || t.type?.toUpperCase() === 'WEEKLY');

            if (hasDaily && (user as any)?.lastDailyTaskAt) {
                const lastDaily = new Date((user as any).lastDailyTaskAt).getTime();
                const diff = (lastDaily + 24 * 60 * 60 * 1000) - Date.now();
                setDailyCountdown(formatCountdown(diff));
            } else {
                setDailyCountdown('00:00:00:00');
            }

            if (hasWeekly && (user as any)?.lastWeeklyTaskAt) {
                const lastWeekly = new Date((user as any).lastWeeklyTaskAt).getTime();
                const diff = (lastWeekly + 7 * 24 * 60 * 60 * 1000) - Date.now();
                setWeeklyCountdown(formatCountdown(diff));
            } else {
                setWeeklyCountdown('00:00:00:00');
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [tasks, user]);

    // Load data
    useEffect(() => {
        if (user?.bagTokens !== undefined) {
            setBagBalance(user.bagTokens);
        }
        if ((user as any)?.items !== undefined) {
            setItemsBalance((user as any).items);
        }
    }, [user?.bagTokens, (user as any)?.items]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/airdrop/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch airdrop stats", err);
            }
        };
        
        const fetchTasks = async () => {
            try {
                const res = await api.get('/api/airdrop/tasks');
                // Backend returns { missions: [], total: X, ... }
                const taskData = Array.isArray(res.data) ? res.data : (res.data.missions || []);
                setTasks(taskData);
            } catch (err) {
                console.error("Failed to fetch mission hub tasks", err);
                setTasks([]);
            }
        };

        const fetchReferrals = async () => {
            try {
                const res = await api.get('/api/auth/referrals');
                setReferrals(Array.isArray(res.data) ? res.data : []);
            } catch {}
        };

        // Check mission pause state and itemsToBagRate (public)
        const checkMissionStatus = async () => {
            try {
                const res = await api.get('/api/airdrop/status');
                if (res.data.settings?.isPaused) {
                    setMissionPaused(true);
                }
                if (res.data.settings?.itemsToBagRate) {
                    setItemsToBagRate(res.data.settings.itemsToBagRate);
                }
            } catch {}
        };

        // Always fetch tasks — public endpoint, needed for mission card rendering
        fetchStats();
        fetchTasks();
        checkMissionStatus();

        if (user) {
            fetchReferrals();
            
            // Check submission status
            const checkStatus = async () => {
                try {
                    const res = await api.get('/api/airdrop/status');
                    if (res.data.userStatus?.walletSubmitted) {
                        setSubmitted(true);
                    }
                    if (res.data.settings?.isPaused) {
                        setMissionPaused(true);
                    }
                    if (res.data.settings?.itemsToBagRate) {
                        setItemsToBagRate(res.data.settings.itemsToBagRate);
                    }
                } catch {}
            };
            checkStatus();
        }
    }, [user]);

    // Live TGE end checker
    useEffect(() => {
        if (!stats?.tgeDate) return;

        const checkTGE = () => {
            const now = new Date().getTime();
            const tge = new Date(stats.tgeDate).getTime();
            if (now >= tge && !campaignEnded) {
                setCampaignEnded(true);
            }
        };

        checkTGE();
        const interval = setInterval(checkTGE, 1000);
        return () => clearInterval(interval);
    }, [stats?.tgeDate, campaignEnded]);

    const handleCompleteTask = async (taskId: string, requiresLink?: boolean) => {
        if (!user) {
            window.dispatchEvent(new CustomEvent('open-login-modal'));
            return;
        }

        const link = taskLinks[taskId];
        if (requiresLink && !link) {
            Swal.fire({
                title: 'MISSING PROOF',
                text: 'Please paste your proof link before claiming this mission.',
                icon: 'warning',
                background: '#0a0a0a',
                color: '#fff'
            });
            return;
        }

        setIsTaskLoading(true);
        try {
            const res = await api.post('/api/airdrop/tasks/complete', { 
                taskId, 
                taskLink: link,
                feedback: taskFeedback[taskId] 
            });
            if (res.data.success) {
                Swal.fire({
                    title: 'MISSION COMPLETE',
                    text: res.data.message,
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff',
                    confirmButtonColor: '#fcd535'
                });
                // Optimistically update the live balance immediately
                if (res.data.items !== undefined) {
                    setItemsBalance(res.data.items);
                }
                // Refresh tasks and stats in-place
                const [newTasks, newStats] = await Promise.all([
                    api.get('/api/airdrop/tasks').then(r => r.data.missions || []).catch(() => tasks),
                    api.get('/api/airdrop/stats').then(r => r.data).catch(() => stats),
                ]);
                setTasks(newTasks);
                setStats(newStats);
                setTaskLinks(prev => ({ ...prev, [taskId]: '' }));
                setTaskFeedback(prev => ({ ...prev, [taskId]: '' }));
                // Sync user context in the background
                await refreshUser();
            }
        } catch (err: any) {
             Swal.fire({
                title: 'SYNC FAILED',
                text: err.response?.data?.error || 'Failed to verify mission completion.',
                icon: 'error',
                background: '#0a0a0a',
                color: '#fff'
            });
        } finally {
            setIsTaskLoading(false);
        }
    };

    const handleConvertItems = async () => {
        if (!user) return;
        if (!itemsToBagRate || itemsToBagRate <= 0) {
            Swal.fire('Conversion Closed', 'The conversion rate has not been set yet. Please check back later.', 'info');
            return;
        }
        if (itemsBalance <= 0) {
            Swal.fire('No ITEMS', 'You have no ITEMS to convert.', 'warning');
            return;
        }

        try {
            const res = await api.post('/api/airdrop/convert');
            if (res.data.success) {
                Swal.fire('Success', res.data.message, 'success');
                setItemsBalance(res.data.items);
                setBagBalance(res.data.bagTokens);
                await refreshUser();
            }
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.error || 'Failed to convert ITEMS', 'error');
        }
    };

    const handleRequestPayout = async () => {
        if (!user) return;
        if (bagBalance <= 0) {
            Swal.fire('Empty Balance', 'You have no reserved rewards to withdraw.', 'warning');
            return;
        }

        try {
            const res = await api.post('/api/airdrop/payout');
            if (res.data.success) {
                Swal.fire({
                    title: 'AIRDROP REQUESTED',
                    text: 'Your withdrawal request has been queued for admin approval.',
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff',
                    confirmButtonColor: '#fcd535'
                });
                setBagBalance(0);
                await refreshUser();
            }
        } catch (err: any) {
            Swal.fire({
                title: 'REQUEST FAILED',
                text: err.response?.data?.error || 'Failed to submit withdrawal request.',
                icon: 'error',
                background: '#0a0a0a',
                color: '#fff'
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            window.dispatchEvent(new CustomEvent('open-login-modal'));
            return;
        }
        
        setIsSubmitting(true);
        try {
            const res = await api.post('/api/airdrop/submit-wallet', {
                bscWallet,
                xLink,
                reviewComment: review,
                isFounderRequest: isFounderApplication,
                projectName,
                projectTicker,
                projectManifesto,
                projectSocial,
                projectWebsite,
                projectContract,
                projectGoals,
                founderSocial,
                grantReward: true // Triggers +5000 ITEMS +10000 bagTokens
            });

            if (res.data.success) {
                setSubmitted(true);
                setSubmitted(true);
                
                // Immediately apply the 5000 Reserve ITEMS reward
                if (res.data.bagTokens !== undefined) {
                    setBagBalance(res.data.bagTokens);
                }
                await refreshUser();

                Swal.fire({
                    title: 'DATA SYNCED',
                    text: 'Your mission details have been submitted successfully.',
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff',
                    confirmButtonColor: '#fcd535'
                });
            }
        } catch (err: any) {
            Swal.fire({
                title: 'TRANSMISSION FAILED',
                text: err.response?.data?.error || 'Failed to submit mission data.',
                icon: 'error',
                background: '#0a0a0a',
                color: '#fff'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyReferralLink = () => {
        const link = `https://alphabag.com/?ref=${user?.referralCode || ''}`;
        navigator.clipboard.writeText(link);
        Swal.fire({
            title: 'LINK COPIED',
            text: 'Your Protocol invite link is ready to share.',
            icon: 'success',
            background: '#0a0a0a',
            color: '#fff',
            timer: 2000,
            showConfirmButton: false
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-white/10 gap-4 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-alphabag-yellow to-yellow-600 flex items-center justify-center text-black shadow-glow-yellow/20">
                            <Gift size={20} fill="currentColor" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative flex items-center">
                            Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">Control</span>
                        </h1>
                        <span className="badge-yellow">v1.0 Testnet</span>
                    </div>
                    <p className="text-alphabag-subtext text-xs max-w-2xl mt-1 font-medium leading-relaxed">
                        Task-to-Earn (T2E) protocol. Complete missions to accumulate **ITEMS** for future utility rewards.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-alphabag-yellow/10 border border-alphabag-yellow/30 px-4 py-2 rounded-2xl text-[10px] text-alphabag-yellow font-black uppercase tracking-[0.2em] shadow-glow-yellow/5 flex items-center gap-2">
                        <Zap size={14} fill="currentColor" className="animate-pulse" /> Live Tracking
                    </div>
                </div>
            </div>

            {/* Mission Paused Banner */}
            {missionPaused && (
                <div className="flex items-center gap-4 p-5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl animate-in slide-in-from-top-4 duration-500">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Lock size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Mission Temporarily Paused</div>
                        <p className="text-xs text-alphabag-subtext mt-0.5">The Alpha Mission is currently paused by the core team. All ITEMS claims are disabled. Check back soon — we'll be back online shortly.</p>
                    </div>
                </div>
            )}

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                    const myTeamSize = user?.referralCount || 0;
                    const progress = Math.min(100, Math.round((myTeamSize / 100) * 100));

                    return (
                        <div className="glass-panel p-6 transition-all group relative overflow-hidden border border-alphabag-yellow/20 flex flex-col h-full">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-2xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>
                            <div className="flex justify-between items-start mb-4">
                                <span className="section-label">My Team</span>
                                <Users size={16} className="text-alphabag-yellow opacity-50" />
                            </div>
                            <div className="text-3xl font-black text-white tracking-tight mb-4">{myTeamSize}</div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-alphabag-yellow">CAPACITY</span>
                                    <span className="text-[9px] text-alphabag-muted font-bold">{100 - myTeamSize} slots left</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000 bg-alphabag-yellow shadow-glow-yellow" style={{width: `${progress}%`}}></div>
                                </div>
                                <div className="text-[9px] text-alphabag-muted font-bold">{myTeamSize} / 100 MAX</div>
                            </div>

                            {/* Status Row */}
                            <div className="mt-auto pt-6 border-t border-white/5">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center h-[52px]">
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400">Strike Protocol</div>
                                    <div className="text-lg font-black text-red-400">
                                        {(user as any)?.strikes || 0}/5
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="glass-panel p-6 border-alphabag-yellow/20 shadow-[0_0_20px_rgba(252,213,53,0.1)] transition-all group relative overflow-hidden flex flex-col h-full">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-alphabag-yellow/5 rounded-full blur-2xl group-hover:bg-alphabag-yellow/10 transition-all duration-700"></div>

                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                        <span className="section-label text-alphabag-yellow">Earned ITEMS</span>
                        <span className="badge-yellow">ELIGIBLE</span>
                    </div>

                    {/* Main Balance (Total) */}
                    <div className="mb-6">
                        <div className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest mb-1.5 opacity-70">Total Portfolio ITEMS</div>
                        <div className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                            {(itemsBalance + bagBalance).toLocaleString()}
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="flex gap-6 mb-6 pb-6 border-b border-white/5">
                        <div className="flex-1">
                            <div className="text-[9px] text-alphabag-muted font-black uppercase tracking-widest mb-1 opacity-70">Earned</div>
                            <div className="text-xl font-black text-white/90 tabular-nums">{itemsBalance.toLocaleString()}</div>
                        </div>
                        <div className="flex-1">
                            <div className="text-[9px] text-alphabag-yellow font-black uppercase tracking-widest mb-1 opacity-70">Reserve</div>
                            <div className="text-xl font-black text-alphabag-yellow drop-shadow-[0_0_8px_rgba(252,213,53,0.3)] tabular-nums">{bagBalance.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Actions + Footer — grouped as single pinned-bottom block */}
                    <div className="mt-auto pt-6 border-t border-white/5">
                        <div className="flex gap-3">
                            {campaignEnded ? (
                                <>
                                    <button onClick={handleConvertItems} className="flex-1 bg-alphabag-yellow text-black px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all z-10 relative shadow-glow-yellow/20">
                                        CONVERT
                                    </button>
                                    {bagBalance > 0 && (
                                        <button
                                            onClick={handleRequestPayout}
                                            className="flex-1 bg-white/5 border border-alphabag-yellow/50 text-alphabag-yellow px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-alphabag-yellow/10 active:scale-[0.98] transition-all"
                                        >
                                            WITHDRAWAL
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-[52px] px-4 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[9px] text-alphabag-muted font-black uppercase tracking-[0.2em] opacity-60">
                                    Locked until campaign end
                                </div>
                            )}
                        </div>
                        {itemsToBagRate && itemsToBagRate > 0 && (
                            <div className="mt-3 text-center text-[9px] text-alphabag-muted font-black uppercase tracking-widest opacity-50">
                                Rate: {itemsToBagRate} ITEMS = 1 utility token
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel p-6 border-alphabag-green/20 relative overflow-hidden shadow-[0_4px_30px_rgba(0,255,163,0.05)] flex flex-col h-full transition-all group">
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-alphabag-green/10 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="section-label">TGE EVENT</span>
                        <Gift size={16} className="text-alphabag-green opacity-50" />
                    </div>
                    {stats ? (
                        <div className="flex flex-col flex-1">
                        <div className="mb-6">
                            {campaignEnded ? (
                                <div className="animate-in fade-in zoom-in duration-500">
                                    <div className="text-[10px] text-alphabag-yellow font-black uppercase tracking-[0.2em] text-center mb-3">Wallet Distribution Protocol</div>
                                    <TGECountdown targetDate={new Date(new Date(stats.tgeDate).getTime() + 72 * 60 * 60 * 1000).toISOString()} />
                                </div>
                            ) : (
                                <>
                                    <TGECountdown targetDate={stats?.tgeDate || new Date().toISOString()} />
                                    <div className="mt-3 text-center">
                                        <span className="badge-blue">
                                            Target: {stats?.tgeDate ? new Date(stats.tgeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Q4 2026'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                            <div className="mt-auto pt-6 border-t border-alphabag-green/20">
                                <div className={`text-[8px] font-black uppercase tracking-[0.2em] text-center mb-1 ${campaignEnded ? 'text-alphabag-yellow animate-pulse' : 'text-alphabag-green'}`}>
                                    {campaignEnded ? "Final Allocation" : "Projected Allocation"}
                                </div>
                                <div className={`text-center font-black transition-all duration-700 tracking-tight py-2 ${campaignEnded ? 'text-3xl text-alphabag-yellow drop-shadow-[0_0_10px_rgba(252,213,53,0.5)]' : 'text-2xl tracking-[0.2em] relative flex justify-center'}`}>
                                    {campaignEnded ? (
                                        (bagBalance + (itemsBalance * (itemsToBagRate || 0))).toLocaleString()
                                    ) : (
                                        <div className="group relative w-fit flex justify-center items-center cursor-help">
                                            <span className="text-white/10 blur-[8px] select-none">
                                                {(bagBalance + (itemsBalance * (itemsToBagRate || 1))).toLocaleString()}
                                            </span>
                                            <div className="absolute inset-0 flex items-center justify-center font-black text-alphabag-yellow text-[10px] uppercase whitespace-nowrap bg-alphabag-black/90 rounded px-2 backdrop-blur-md border border-alphabag-yellow/20 z-10 pointer-events-none">
                                                Unlocks at TGE
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2 text-center mt-6">
                            <div className="text-lg font-black text-alphabag-green/60 tracking-tight">TBA</div>
                            <div className="text-[8px] text-alphabag-muted font-bold uppercase tracking-widest mt-0.5">Announcement incoming</div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Protocol Notice --- */}
            <div className="mb-12 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15 relative flex items-start gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0 mt-0.5">
                    <ShieldAlert size={20} className="text-blue-400" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Protocol Verification</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        All mission tasks are verified for authenticity. Maintain good standing to keep earning. A 5/5 status strike would result in a complete ban from the AlphaBAG T2E platform.
                    </p>
                </div>
            </div>

            {/* Team Referral Hub */}
            <div className="glass-panel p-6 bg-[#0a0a0a] border border-alphabag-yellow/20 rounded-3xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-alphabag-yellow/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <Users className="text-alphabag-yellow" /> Network Hub
                            </h2>
                            <p className="text-xs text-alphabag-subtext mt-1">Recruit new members and earn <span className="text-alphabag-yellow font-bold">100 ITEMS</span> per successful sync.</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                            <div className="text-[9px] text-alphabag-muted font-black uppercase tracking-widest pr-2">Your Invite Link</div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="flex-1 md:w-64 bg-black border border-white/10 rounded-xl px-4 py-3 font-mono text-[10px] text-gray-400 truncate">
                                    https://alphabag.com/?ref={user?.referralCode || 'ACCESS_LOCKED'}
                                </div>
                                <button 
                                    onClick={copyReferralLink}
                                    title="Copy referral link"
                                    className="p-3 bg-alphabag-yellow text-black rounded-xl hover:bg-white transition-all active:scale-95 shrink-0"
                                >
                                    <Copy size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        const refUrl = `https://alphabag.com/?ref=${user?.referralCode || ''}`;
                                        const tweet = encodeURIComponent(`🚀 Join me on AlphaBAG — complete missions & earn ITEMS for future utility rewards!\n\nSign up here 👇\n${refUrl}\n\n#AlphaBAG #Crypto`);
                                        window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank');
                                    }}
                                    title="Share on X"
                                    className="p-3 bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] rounded-xl hover:bg-[#1DA1F2]/20 transition-all active:scale-95 shrink-0"
                                >
                                    <Twitter size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
            </div>

            {/* Mission Section */}
            <div className="space-y-8">
                <div className="glass-panel p-8 space-y-6 bg-gradient-to-b from-[#0c0c0c] to-black border border-alphabag-yellow/20 rounded-3xl">
                    <div className="flex justify-between items-center border-b border-white/5 pb-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Shield className="text-alphabag-yellow" /> Mission Hub
                        </h2>
                        <div className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                            Available Missions: {tasks.filter((t: any) => t.type !== 'unlimited').length}
                        </div>
                    </div>

                                        

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tasks.filter((t: any) => t.type !== 'unlimited').map((task: any) => {
                            const isCompleted = (() => {
                                if (!user) return false;
                                const freq = (task.frequency || '').toUpperCase();
                                const taskId = task.id;

                                // Aggressive check for DAILY/WEEKLY tasks
                                if (freq === 'DAILY') {
                                    const lastClaimAt = (user as any).lastDailyTaskAt;
                                    if (!lastClaimAt) return false;
                                    const lastTime = new Date(lastClaimAt).getTime();
                                    const timeDiff = Date.now() - lastTime;
                                    return timeDiff >= 0 && timeDiff < (24 * 60 * 60 * 1000);
                                }
                                
                                if (freq === 'WEEKLY') {
                                    const lastClaimAt = (user as any).lastWeeklyTaskAt;
                                    if (!lastClaimAt) return false;
                                    const lastTime = new Date(lastClaimAt).getTime();
                                    const timeDiff = Date.now() - lastTime;
                                    return timeDiff >= 0 && timeDiff < (7 * 24 * 60 * 60 * 1000);
                                }

                                return (user as any).completedTasks?.includes(taskId) || (user as any).completedMissions?.includes(taskId);
                            })();
                            const type = task.frequency?.toLowerCase() || task.type?.toLowerCase();
                            return (
                                <div key={task.id} className={`flex flex-col justify-between h-full p-6 transition-all group relative overflow-hidden border ${isCompleted ? 'bg-alphabag-green/5 border-alphabag-green/20 rounded-2xl' : 'bg-[#0d0d11]/60 backdrop-blur-xl border-alphabag-yellow/20 rounded-2xl hover:border-alphabag-yellow/40 hover:bg-white/[0.04]'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${isCompleted ? 'bg-alphabag-green/20 text-alphabag-green shadow-glow-green/10' : 'bg-alphabag-yellow/10 text-alphabag-yellow shadow-glow-yellow/10'}`}>
                                            <Zap size={20} fill="currentColor" className={!isCompleted ? 'animate-pulse' : ''} />
                                        </div>
                                        {isCompleted ? (
                                            <div className="flex items-center gap-1.5 text-[9px] text-alphabag-green font-black uppercase tracking-widest">
                                                <CheckCircle2 size={14} /> Completed
                                            </div>
                                        ) : (
                                            <div className="badge-yellow">
                                                +{task.rewardTokens || 0} ITEMS
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="section-title text-base mb-1.5">{task.title}</h3>
                                        <p className="text-xs text-alphabag-muted mb-4 leading-relaxed font-medium opacity-80">{task.description}</p>
                                    </div>


                                    {task.actionUrl && !isCompleted && (
                                        <div className="mb-3">
                                            <Button
                                                onClick={() => window.open(task.actionUrl, '_blank')}
                                                className="w-full py-2 bg-white/5 text-white/70 hover:text-white border border-white/10 hover:border-alphabag-yellow/50 text-[9px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                                                variant="secondary"
                                                size="sm"
                                            >
                                                {task.title.toLowerCase().includes('telegram') ? <Send size={12} className="text-[#229ED9]" /> : <X size={12} className="text-white" />}
                                                Execute Mission ↗
                                            </Button>
                                        </div>
                                    )}

                                    {task.id === 't2e_daily_claim' && (
                                        <div className="mb-4">
                                            <div className="text-[8px] text-alphabag-muted font-black uppercase tracking-[0.2em] mb-2 text-center opacity-50">Next Transmission Window</div>
                                            <div className="flex gap-2 justify-center">
                                                {(task.frequency?.toUpperCase() === 'DAILY' ? dailyCountdown : weeklyCountdown).split(':').map((val, idx) => (
                                                    <div key={idx} className="flex flex-col items-center">
                                                        <div className="bg-black/60 border border-white/10 rounded-lg w-12 h-12 flex items-center justify-center mb-1 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                                            <span className="text-xl font-black text-alphabag-yellow tabular-nums drop-shadow-[0_0_15px_rgba(252,213,53,0.6)]">
                                                                {val || '00'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] font-black text-alphabag-muted uppercase tracking-widest">
                                                            {idx === 0 ? 'Day' : idx === 1 ? 'Hrs' : idx === 2 ? 'Min' : 'Sec'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {task.requiresLink && !isCompleted && (
                                        <div className="mb-4">
                                            <input 
                                                type="text" 
                                                placeholder={task.title.toLowerCase().includes('telegram') ? "@Telegram_Username" : "Activity Proof Link: https://..."}
                                                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-[10px] text-white focus:border-alphabag-yellow/50 outline-none transition-all"
                                                value={taskLinks[task.id] || ''}
                                                onChange={(e) => handleTaskLinkChange(task.id, e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {task.requiresFeedback && !isCompleted && (
                                        <div className="mb-4">
                                            <textarea 
                                                placeholder="Provide your mission feedback here..."
                                                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-[10px] text-white h-20 resize-none focus:border-alphabag-yellow/50 outline-none transition-all"
                                                value={taskFeedback[task.id] || ''}
                                                onChange={(e) => handleTaskFeedbackChange(task.id, e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {!isCompleted ? (
                                        <Button
                                            onClick={() => {
                                                handleCompleteTask(task.id, task.requiresLink);
                                            }}
                                            className={`w-full py-2.5 text-[10px] font-black tracking-[0.2em] uppercase transition-all ${missionPaused || (task.requiresLink && !taskLinks[task.id]) || (task.requiresFeedback && !taskFeedback[task.id]) ? 'bg-white/5 text-alphabag-muted cursor-not-allowed opacity-50' : task.frequency?.toUpperCase() === 'DAILY' ? 'bg-green-500 text-black hover:scale-[1.02] shadow-[0_5px_15px_rgba(34,197,94,0.3)]' : 'bg-alphabag-yellow text-black hover:scale-[1.02] shadow-[0_5px_15px_rgba(252,213,53,0.3)]'}`}
                                            size="sm"
                                            disabled={isTaskLoading || missionPaused || (task.requiresLink && !taskLinks[task.id]) || (task.requiresFeedback && !taskFeedback[task.id])}
                                        >
                                            {missionPaused ? '⏸ MISSION PAUSED' : isTaskLoading ? 'Syncing...' : `CLAIM ${task.rewardTokens || 50} ITEMS`}
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full py-2.5 text-[10px] font-black tracking-[0.2em] uppercase bg-white/5 text-alphabag-muted cursor-not-allowed border border-white/10"
                                            size="sm"
                                            disabled
                                        >
                                            {'MISSION COMPLETE ✓'}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Submission Section (Founder & Social) */}
            {!submitted ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    {/* Mission Proof Submission */}
                    <div className="glass-panel p-8 bg-gradient-to-b from-[#0c0c0c] to-black border border-white/5 rounded-3xl relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-alphabag-yellow/5 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <Send className="text-alphabag-yellow" /> Submission Hub
                            </h2>
                            <p className="text-xs text-alphabag-subtext mt-1 font-bold uppercase tracking-widest">Connect your final social identity and mission proof.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest pl-1">Distribution Wallet (BSC)</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="0x..."
                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-alphabag-yellow/50 outline-none transition-all"
                                    value={bscWallet}
                                    onChange={(e) => setBscWallet(e.target.value)}
                                />
                                <p className="text-[8px] text-alphabag-muted uppercase font-bold tracking-widest pl-1">The wallet where you will receive your tokens.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest pl-1">Final Mission Feedback (Compulsory)</label>
                                <textarea 
                                    required
                                    className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white h-24 resize-none focus:border-alphabag-yellow/50 outline-none transition-all"
                                    placeholder="Please provide your feedback on the platform UI/UX and features. This is required for final verification."
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !review}
                                className="w-full py-4 bg-alphabag-yellow text-black font-black uppercase tracking-[0.4em] rounded-2xl hover:scale-[1.01] transition-all shadow-[0_20px_80px_rgba(252,213,53,0.15)] flex items-center justify-center gap-4 group"
                            >
                                {isSubmitting ? 'SYNCING DATA...' : (
                                    <div className="flex flex-col items-center text-center">
                                        <span className="text-xs md:text-sm font-black tracking-[0.2em] mb-1">INITIALIZE FINAL SYNC</span>
                                        <span className="text-[9px] font-bold opacity-80 group-hover:opacity-100 group-hover:text-black transition-all uppercase tracking-[0.1em]">
                                            Earn 5,000 ITEMS for Feedback
                                        </span>
                                    </div>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="glass-panel p-12 bg-gradient-to-b from-green-900/10 to-black border border-alphabag-green/20 rounded-3xl text-center space-y-6 animate-in zoom-in duration-700">
                    <div className="w-20 h-20 bg-alphabag-green/20 rounded-full flex items-center justify-center mx-auto border border-alphabag-green/40 shadow-[0_0_30px_rgba(0,255,163,0.2)]">
                        <CheckCircle2 size={40} className="text-alphabag-green" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Identity Synchronized</h2>
                        <p className="text-alphabag-subtext mt-2">Your mission data and founder application have been secured by the community.</p>
                    </div>
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 inline-block mx-auto">
                        <span className="text-[10px] text-alphabag-muted uppercase font-black tracking-widest mr-3">Status:</span>
                        <span className="text-[10px] text-alphabag-green uppercase font-black tracking-widest">DATA RECEIVED 🔒</span>
                    </div>
                </div>
            )}

            {!submitted && (
                <>
                {/* ── AlphaBAG Allocation ── */}
                <div className="glass-panel p-6 bg-gradient-to-br from-alphabag-yellow/5 to-black border border-alphabag-yellow/20 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-alphabag-yellow/5 rounded-full blur-[80px] pointer-events-none"></div>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/5 pb-6">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <BarChart3 className="text-alphabag-yellow" /> AlphaBAG Allocation
                            </h2>
                            <p className="text-xs text-alphabag-subtext">Strategic token distribution for sustainable ecosystem growth.</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-alphabag-yellow text-black border border-alphabag-yellow/30 rounded-lg shadow-[0_0_15px_rgba(252,213,53,0.2)]">
                            <Zap size={16} fill="currentColor" className="animate-pulse"/>
                            <span className="text-xs font-black uppercase tracking-widest">Total Supply: 21,000,000</span>
                        </div>
                    </div>

                    {/* Allocation Grid with Mask */}
                    <div className="relative group/allocation">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 filter blur-[2px] transition-all duration-700 group-hover/allocation:blur-[1px] opacity-40">
                            {[
                                { label: 'Liquidity Pool', pct: '30%', tokens: '6.3M', color: 'from-alphabag-yellow to-yellow-600', desc: 'Locked Forever. Stable trading pool.' },
                                { label: 'Task-to-Earn', pct: '35%', tokens: '7.35M', color: 'from-blue-500 to-blue-700', desc: 'Mined through engagement (4-5y)' },
                                { label: 'Dev & Ecosystem', pct: '15%', tokens: '3.15M', color: 'from-alphabag-green to-emerald-700', desc: '6m cliff + 24m linear release' },
                                { label: 'Marketing', pct: '10%', tokens: '2.1M', color: 'from-orange-400 to-orange-600', desc: 'Partnerships & Growth milestones' },
                                { label: 'Team & Advisors', pct: '10%', tokens: '2.1M', color: 'from-purple-500 to-purple-700', desc: '12m cliff + 36m linear release' },
                            ].map((item) => (
                                <div key={item.label} className="flex flex-col items-center p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex flex-col items-center justify-center mb-3 shadow-lg`}>
                                        <span className="text-black font-black text-xs leading-none">{item.pct}</span>
                                        <span className="text-black/70 font-bold text-[8px] leading-none mt-0.5">{item.tokens}</span>
                                    </div>
                                    <div className="text-white font-black text-xs uppercase tracking-tight leading-tight mb-1">{item.label}</div>
                                    <div className="text-alphabag-muted text-[8px] font-medium leading-snug">{item.desc}</div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Translucent Mask Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="bg-alphabag-black/20 backdrop-blur-sm border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                                <Lock size={16} className="text-alphabag-yellow animate-pulse" />
                                <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Allocation Locked • Verification in Progress</span>
                            </div>
                        </div>
                    </div>



                    {/* Utility & Key Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-3 p-3 bg-black/30 border border-white/5 rounded-lg">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><Zap size={14} className="text-alphabag-yellow"/></div>
                            <div>
                                <div className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest">Utility</div>
                                <div className="text-xs font-bold text-white mt-0.5 leading-snug">Portfolio Manager · T2E · Degen Calculator · AI Analyst</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-black/30 border border-white/5 rounded-lg">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"><Gift size={14} className="text-alphabag-green"/></div>
                            <div>
                                <div className="text-[8px] text-alphabag-muted font-black uppercase tracking-widest">TGE Distribution</div>
                                <div className="text-xs font-black text-white mt-0.5">Proportional to future utility reward conversion</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Founder Protocol Module */}
                <div className="glass-panel p-8 bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/20 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-8">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <Shield className="text-blue-400" /> Founder Application
                            </h2>
                            <p className="text-xs text-alphabag-subtext">Apply for one of the <span className="text-white font-bold">100 Alpha Founder</span> slots for elite priority access.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                            <div className="text-right">
                                <div className="text-[9px] text-alphabag-muted font-black uppercase tracking-widest">Slots Remaining</div>
                                <div className="text-xl font-black text-white">{Math.max(0, 100 - (stats?.founderEntries || 0))}</div>
                            </div>
                            <div className="relative flex items-center justify-center">
                                <input 
                                type="checkbox" 
                                className="w-8 h-8 rounded-xl appearance-none bg-black border-2 border-white/10 checked:bg-blue-500 checked:border-blue-500 transition-all cursor-pointer peer"
                                checked={isFounderApplication}
                                onChange={(e) => setIsFounderApplication(e.target.checked)}
                                />
                                <CheckCircle2 size={18} className="absolute text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </div>

                    {isFounderApplication && (
                        <div className="space-y-6 pt-2 animate-in slide-in-from-top-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest pl-1">Project Name</label>
                                <input required type="text" placeholder="Project Alpha" className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-blue-500/50 outline-none" value={projectName} onChange={e => setProjectName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest pl-1">Ticker</label>
                                <input required type="text" placeholder="$ALPHA" className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-blue-500/50 outline-none" value={projectTicker} onChange={e => setProjectTicker(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest pl-1">Project Vision</label>
                                <textarea required placeholder="What is your singular vision for the space?" className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-blue-500/50 outline-none h-24 resize-none" value={projectManifesto} onChange={e => setProjectManifesto(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest pl-1">Project X Link</label>
                                <input required type="url" placeholder="https://x.com/..." className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-blue-500/50 outline-none" value={projectSocial} onChange={e => setProjectSocial(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest pl-1">Official Website</label>
                                <input required type="url" placeholder="https://..." className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-blue-500/50 outline-none" value={projectWebsite} onChange={e => setProjectWebsite(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest pl-1">Project Contract Address</label>
                                <input required type="text" placeholder="0x..." className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-blue-500/50 outline-none" value={projectContract} onChange={e => setProjectContract(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest pl-1">Key Project Goals</label>
                                <textarea required placeholder="What are the next 3 major milestones for your project?" className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-blue-500/50 outline-none h-24 resize-none" value={projectGoals} onChange={e => setProjectGoals(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-alphabag-muted font-black uppercase tracking-widest pl-1">Founder Personal Social / Telegram</label>
                                <input required type="text" placeholder="@username" className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-blue-500/50 outline-none" value={founderSocial} onChange={e => setFounderSocial(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>
                </>
            )}
        </div>
    );
};
