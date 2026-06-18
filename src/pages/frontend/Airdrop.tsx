import React, { useState, useEffect } from 'react';
import { 
    Gift, Twitter, Send, CheckCircle2, Lock, Timer, MousePointer2, 
    ArrowRight, Shield, ShieldAlert, Zap, ExternalLink, Users, BarChart3, Copy, Star, ChevronRight, Bell, X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { TGECountdown } from '../../components/frontend/TGECountdown';
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
    const [payoutRequest, setPayoutRequest] = useState<any>(null); // user's current payout request



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
    const [projectLogo, setProjectLogo] = useState('');
    const [projectBanner, setProjectBanner] = useState('');


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

        // Always fetch tasks — public endpoint, needed for mission card rendering
        fetchStats();
        fetchTasks();

        // Unified status check (works for both authed and public)
        const checkStatus = async () => {
            try {
                const res = await api.get('/api/airdrop/status');
                const settings = res.data.settings || {};
                if (settings.isPaused) setMissionPaused(true);
                if (settings.itemsToBagRate) setItemsToBagRate(settings.itemsToBagRate);
                // Server-authoritative campaign ended flag
                if (settings.campaignEnded) setCampaignEnded(true);

                if (user && res.data.userStatus) {
                    const us = res.data.userStatus;
                    if (us.walletSubmitted) setSubmitted(true);
                    if (us.payoutRequest) setPayoutRequest(us.payoutRequest);
                }
            } catch {}
        };
        checkStatus();

        if (user) fetchReferrals();
    }, [user]);

    // TGE date fallback: only triggers if backend hasn't already set campaignEnded
    useEffect(() => {
        if (!stats?.tgeDate || campaignEnded) return;
        const now = new Date().getTime();
        const tge = new Date(stats.tgeDate).getTime();
        if (now >= tge) setCampaignEnded(true);
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
                    api.get('/api/airdrop/tasks').then((r) => Array.isArray(r.data) ? r.data : (r.data.missions || [])).catch(() => tasks),
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
                projectLogo,
                projectBanner,
                grantReward: true // Triggers +5000 ITEMS +10000 bagTokens
            });

            if (res.data.success) {
                setSubmitted(true);
                
                // Immediately apply the 5000 Reserve ITEMS reward
                if (res.data.bagTokens !== undefined) {
                    setBagBalance(res.data.bagTokens);
                }
                if (res.data.items !== undefined) {
                    setItemsBalance(res.data.items);
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
        <div className="max-w-7xl mx-auto space-y-5 pb-12 px-4 md:px-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-[#2b3139] gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-[#fcd535] flex items-center justify-center text-[#181a20]">
                            <Gift size={20} />
                        </div>
                        <h1 className="text-3xl font-semibold text-[#eaecef] tracking-tight">
                            Mission Control
                        </h1>
                    </div>
                    <p className="text-[#848e9c] text-sm max-w-2xl mt-2 font-medium leading-relaxed">
                        Task-to-Earn (T2E) protocol. Complete missions to accumulate <span className="text-[#eaecef] font-semibold">ITEMS</span> for future utility rewards.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-[#2b3139] px-3 py-1.5 rounded-md text-[11px] text-[#fcd535] font-semibold uppercase tracking-wider flex items-center gap-2">
                        <Zap size={14} fill="currentColor" /> Live Tracking
                    </div>
                </div>
            </div>

            {/* Mission Paused Banner */}
            {missionPaused && (
                <div className="flex items-center gap-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl animate-in slide-in-from-top-4 duration-500">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(() => {
                    const myTeamSize = user?.referralCount || 0;
                    const progress = Math.min(100, Math.round((myTeamSize / 100) * 100));

                    return (
                        <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-6 flex flex-col h-full relative">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-semibold uppercase text-[#848e9c]">My Team</span>
                                <Users size={18} className="text-[#848e9c]" />
                            </div>
                            <div className="text-3xl font-semibold text-[#eaecef] mb-4">{myTeamSize}</div>
                            <div className="space-y-2 relative z-10">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-semibold text-[#848e9c]">CAPACITY</span>
                                    <span className="text-[10px] text-[#848e9c] font-medium">{100 - myTeamSize} slots left</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#0b0e11] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000 bg-[#fcd535]" style={{width: `${progress}%`}}></div>
                                </div>
                                <div className="text-[10px] text-[#848e9c] font-medium">{myTeamSize} / 100 MAX</div>
                            </div>
                            <div className="mt-auto pt-6">
                                <div className="bg-[#0ecb81]/10 px-4 rounded-md border border-[#0ecb81]/20 flex justify-between items-center h-10">
                                    <div className="text-[10px] font-semibold uppercase text-[#0ecb81]">Tasks Completed</div>
                                    <div className="text-sm font-semibold text-[#0ecb81]">
                                        {user?.completedTasks?.length || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-6 flex flex-col h-full relative">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#2b3139]">
                        <span className="text-xs font-semibold uppercase text-[#848e9c]">Earned ITEMS</span>
                        <span className="bg-[#0ecb81]/10 text-[#0ecb81] px-2 py-1 rounded-md text-[10px] font-semibold">ELIGIBLE</span>
                    </div>

                    {/* Main Balance (Total) */}
                    <div className="mb-4">
                        <div className="text-[10px] text-[#848e9c] font-semibold uppercase mb-1">Total Portfolio ITEMS</div>
                        <div className="text-3xl font-semibold text-[#eaecef]">
                            {(itemsBalance + bagBalance).toLocaleString()}
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="flex gap-6 mb-6 pb-6 border-b border-[#2b3139]">
                        <div className="flex-1">
                            <div className="text-[10px] text-[#848e9c] font-semibold uppercase mb-1">Earned</div>
                            <div className="text-xl font-semibold text-[#eaecef] tabular-nums">{itemsBalance.toLocaleString()}</div>
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] text-[#fcd535] font-semibold uppercase mb-1 flex items-center justify-between">
                                <span>Reserve</span>
                                {itemsToBagRate && itemsToBagRate > 0 && (
                                    <span className="text-[8px] text-[#848e9c] normal-case tracking-normal">({itemsToBagRate}:1 rate)</span>
                                )}
                            </div>
                            <div className="text-xl font-semibold text-[#fcd535] tabular-nums">{bagBalance.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Actions + Footer */}
                    <div className="mt-auto pt-6">
                        <div className="flex gap-3 h-10">
                            {campaignEnded ? (
                                <>
                                    {itemsBalance > 0 ? (
                                        <button 
                                            onClick={handleConvertItems} 
                                            className="w-full bg-[#fcd535] text-[#181a20] px-4 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#e0bd2e] active:scale-[0.98] transition-all h-full"
                                        >
                                            Convert Items to $BAG
                                        </button>
                                    ) : bagBalance > 0 && !payoutRequest ? (
                                        <button
                                            onClick={handleRequestPayout}
                                            className="w-full bg-[#0ecb81] text-[#181a20] px-4 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#0cba76] active:scale-[0.98] transition-all h-full"
                                        >
                                            Request Withdrawal
                                        </button>
                                    ) : (
                                        <div className="w-full bg-[#2b3139]/40 border border-[#2b3139] text-[#848e9c] rounded-md flex items-center justify-center text-[10px] font-bold uppercase tracking-wider h-full">
                                            Campaign Completed
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full bg-[#2b3139] rounded-md flex items-center justify-center text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider h-full">
                                    Locked until campaign end
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] p-6 relative flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-semibold uppercase text-[#848e9c]">TGE EVENT</span>
                        <Gift size={18} className="text-[#848e9c]" />
                    </div>
                    {stats ? (
                        <div className="flex flex-col flex-1">
                        <div className="mb-6">
                            {campaignEnded ? (
                                <div className="animate-in fade-in zoom-in duration-500">
                                    <div className="text-[10px] text-[#fcd535] font-semibold uppercase text-center mb-3">Wallet Distribution Protocol</div>
                                    <TGECountdown targetDate={new Date(new Date(stats.tgeDate).getTime() + 72 * 60 * 60 * 1000).toISOString()} />
                                </div>
                            ) : (
                                <>
                                    <TGECountdown targetDate={stats?.tgeDate || new Date().toISOString()} />
                                    <div className="mt-4 text-center">
                                        <span className="bg-[#2b3139] text-[#eaecef] px-3 py-1.5 rounded-md text-[10px] font-semibold border border-[#474d57]">
                                            Target: {stats?.tgeDate ? new Date(stats.tgeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Q4 2026'}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                            <div className="mt-auto pt-6 border-t border-[#2b3139]">
                                <div className={`text-[10px] font-semibold uppercase text-center mb-1 ${campaignEnded ? 'text-[#fcd535]' : 'text-[#848e9c]'}`}>
                                    {campaignEnded ? "Final Allocation" : "Final Allocation"}
                                </div>
                                <div className="text-center font-semibold transition-all duration-700 py-1 text-2xl text-[#eaecef] relative flex justify-center">
                                    {campaignEnded && itemsBalance === 0 ? (
                                        <span className="text-3xl text-[#fcd535]">{bagBalance.toLocaleString()} <span className="text-base">$BAG</span></span>
                                    ) : (
                                        <div className="relative w-fit mx-auto flex justify-center items-center select-none">
                                            <span className="text-[#848e9c] text-2xl blur-[5px] opacity-40 select-none">00000</span>
                                            <div className="absolute inset-0 flex items-center justify-center font-black tracking-widest text-[#848e9c] text-xs z-10 pointer-events-none whitespace-nowrap">
                                                <Lock size={12} className="mr-1 shrink-0" /> {campaignEnded ? 'CONVERT TO REVEAL' : 'LOCKED'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2 text-center mt-6">
                            <div className="text-2xl font-semibold text-[#848e9c]">TBA</div>
                            <div className="text-[10px] text-[#848e9c] font-medium uppercase mt-2">Announcement incoming</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── $BAG Withdrawal Status — always visible above protocol verification ── */}
            {user && (
                <div className={`rounded-lg border p-5 animate-in slide-in-from-top-2 duration-500 mb-0 ${
                    payoutRequest?.status === 'SENT'     ? 'bg-[#0ecb81]/10 border-[#0ecb81]/30' :
                    payoutRequest?.status === 'APPROVED' ? 'bg-blue-500/10 border-blue-500/20' :
                    payoutRequest?.status === 'REJECTED' ? 'bg-[#f6465d]/10 border-[#f6465d]/20' :
                    payoutRequest?.status === 'PENDING'  ? 'bg-[#fcd535]/5 border-[#fcd535]/20' :
                                                          'bg-[#1e2329] border-[#2b3139]'
                }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                payoutRequest?.status === 'SENT'     ? 'bg-[#0ecb81]/20 text-[#0ecb81]' :
                                payoutRequest?.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' :
                                payoutRequest?.status === 'REJECTED' ? 'bg-[#f6465d]/20 text-[#f6465d]' :
                                payoutRequest?.status === 'PENDING'  ? 'bg-[#fcd535]/10 text-[#fcd535]' :
                                                                       'bg-[#2b3139] text-[#848e9c]'
                            }`}>
                                {payoutRequest?.status === 'SENT' ? <CheckCircle2 size={20} /> :
                                 payoutRequest?.status === 'REJECTED' ? <Shield size={20} /> :
                                 payoutRequest?.status === 'PENDING' || payoutRequest?.status === 'APPROVED' ? <Timer size={20} /> :
                                 <Bell size={20} />}
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-[#848e9c] mb-0.5">$BAG Withdrawal Status</div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-lg font-semibold text-[#eaecef] tabular-nums">
                                        {payoutRequest ? Number(payoutRequest.expectedTokens).toLocaleString() : '0,000'} <span className="text-sm text-[#848e9c]">$BAG</span>
                                    </span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                                        payoutRequest?.status === 'SENT'     ? 'text-[#0ecb81] bg-[#0ecb81]/10 border-[#0ecb81]/30' :
                                        payoutRequest?.status === 'APPROVED' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                        payoutRequest?.status === 'REJECTED' ? 'text-[#f6465d] bg-[#f6465d]/10 border-[#f6465d]/20' :
                                        payoutRequest?.status === 'PENDING'  ? 'text-[#fcd535] bg-[#fcd535]/10 border-[#fcd535]/20' :
                                                                               'text-[#848e9c] bg-[#2b3139] border-[#2b3139]'
                                    }`}>{payoutRequest?.status || 'NO REQUEST'}</span>
                                </div>
                                <div className="text-[10px] text-[#848e9c] mt-1">
                                    {!payoutRequest && 'No withdrawal request submitted yet. Convert your ITEMS after campaign ends.'}
                                    {payoutRequest?.status === 'PENDING'  && 'Your request is queued for admin review. Processing typically takes 48–72hrs.'}
                                    {payoutRequest?.status === 'APPROVED' && 'Approved ✓ — Transfer to your BSC wallet is being prepared.'}
                                    {payoutRequest?.status === 'SENT'     && `Delivered to your BSC wallet.${payoutRequest.txReference ? ` TX: ${payoutRequest.txReference}` : ''}`}
                                    {payoutRequest?.status === 'REJECTED' && 'This request was not approved. Please contact support for details.'}
                                </div>
                            </div>
                        </div>
                        {payoutRequest && (
                            <div className="text-right text-[9px] text-[#848e9c] font-mono shrink-0">
                                <div>Requested: {new Date(payoutRequest.createdAt).toLocaleDateString()}</div>
                                {payoutRequest.sentAt && <div className="text-[#0ecb81] mt-0.5">Sent: {new Date(payoutRequest.sentAt).toLocaleDateString()}</div>}
                                <div className="mt-1 text-[8px] opacity-50">{payoutRequest.walletAddress?.slice(0, 10)}...</div>
                            </div>
                        )}
                    </div>
                    {payoutRequest && (payoutRequest.status === 'PENDING' || payoutRequest.status === 'APPROVED') && (
                        <div className="mt-4 flex items-center gap-2">
                            {['PENDING', 'APPROVED', 'SENT'].map((step, i) => (
                                <React.Fragment key={step}>
                                    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase ${
                                        (step === payoutRequest.status) ? 'text-[#fcd535]' :
                                        (['PENDING','APPROVED','SENT'].indexOf(step) < ['PENDING','APPROVED','SENT'].indexOf(payoutRequest.status)) ? 'text-[#0ecb81]' :
                                        'text-[#2b3139]'
                                    }`}>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[7px] ${
                                            (step === payoutRequest.status) ? 'border-[#fcd535] bg-[#fcd535]/20 text-[#fcd535]' :
                                            (['PENDING','APPROVED','SENT'].indexOf(step) < ['PENDING','APPROVED','SENT'].indexOf(payoutRequest.status)) ? 'border-[#0ecb81] bg-[#0ecb81]/20 text-[#0ecb81]' :
                                            'border-[#2b3139] text-[#2b3139]'
                                        }`}>{i + 1}</div>
                                        {step}
                                    </div>
                                    {i < 2 && <div className={`flex-1 h-px ${['PENDING','APPROVED','SENT'].indexOf(step) < ['PENDING','APPROVED','SENT'].indexOf(payoutRequest.status) - 1 ? 'bg-[#0ecb81]' : 'bg-[#2b3139]'}`} />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- Protocol Verification Notice --- */}
            <div className="mb-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0 mt-0.5">
                        <ShieldAlert size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Protocol Verification</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed max-w-2xl">
                            All mission tasks are verified for authenticity. Maintain good standing to keep earning. A 5/5 status strike would result in a complete ban from the AlphaBAG T2E platform.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto w-full md:w-auto">
                    <div className="bg-[#f6465d]/10 p-3 px-4 rounded-md border border-[#f6465d]/20 flex flex-col items-start md:items-end justify-center flex-1 md:flex-initial">
                        <div className="text-[10px] font-semibold uppercase text-[#f6465d] mb-0.5 whitespace-nowrap">Strike Protocol</div>
                        <div className="text-sm font-semibold text-[#f6465d]">
                            {(user as any)?.strikes || 0}/5
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Referral Hub */}
            <div className="rounded-lg p-6 bg-[#1e2329] border border-[#2b3139] mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h2 className="text-lg font-semibold text-[#eaecef] flex items-center gap-2">
                                <Users size={18} className="text-[#fcd535]" /> Network Hub
                            </h2>
                            <p className="text-xs text-[#848e9c] mt-1 font-medium">Recruit new members and earn <span className="text-[#fcd535] font-semibold">100 ITEMS</span> per successful sync.</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                            <div className="text-[10px] text-[#848e9c] font-semibold uppercase pr-1">Your Invite Link</div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="flex-1 md:w-64 bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 font-mono text-xs text-[#848e9c] truncate">
                                    https://alphabag.com/?ref={user?.referralCode || 'ACCESS_LOCKED'}
                                </div>
                                <button 
                                    onClick={copyReferralLink}
                                    title="Copy referral link"
                                    className="p-2 bg-[#2b3139] text-[#eaecef] rounded-md hover:bg-[#474d57] transition-all shrink-0"
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        const refUrl = `https://alphabag.com/?ref=${user?.referralCode || ''}`;
                                        const tweet = encodeURIComponent(`🚀 Join me on AlphaBAG — complete missions & earn ITEMS for future utility rewards!\n\nSign up here 👇\n${refUrl}\n\n#AlphaBAG #Crypto`);
                                        window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank');
                                    }}
                                    title="Share on X"
                                    className="p-2 bg-[#2b3139] text-[#eaecef] rounded-md hover:bg-[#474d57] transition-all shrink-0"
                                >
                                    <Twitter size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
            </div>

            {/* Mission Section */}
            <div className="space-y-8 mb-8">
                <div className="rounded-[32px] p-8 space-y-6 bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 relative overflow-hidden shadow-glass-premium backdrop-blur-[40px]">
                    <div className="flex justify-between items-center border-b border-white/5 pb-6 relative z-10">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Shield className="text-alphabag-yellow drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]" /> Mission Hub
                        </h2>
                        <div className="text-[10px] text-[#848e9c] font-semibold uppercase bg-[#2b3139] px-3 py-1.5 rounded-md border border-[#474d57]">
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
                                <div key={task.id} className={`flex flex-col justify-between h-full p-6 transition-all relative overflow-hidden border ${isCompleted ? 'bg-[#181a20] border-[#0ecb81]/30 rounded-lg' : 'bg-[#1e2329] border-[#2b3139] rounded-lg hover:border-[#fcd535] hover:bg-[#2b3139]'}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-2.5 rounded-md ${isCompleted ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#fcd535]/10 text-[#fcd535]'}`}>
                                            <Zap size={18} fill="currentColor" />
                                        </div>
                                        {isCompleted ? (
                                            <div className="flex items-center gap-1 text-[10px] text-[#0ecb81] font-semibold uppercase">
                                                <CheckCircle2 size={14} /> Completed
                                            </div>
                                        ) : (
                                            <div className="bg-[#fcd535]/10 text-[#fcd535] px-2 py-1 rounded-md text-[10px] font-semibold uppercase">
                                                +{task.rewardTokens || 0} ITEMS
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-[#eaecef] mb-2">{task.title}</h3>
                                        <p className="text-xs text-[#848e9c] mb-6 leading-relaxed">{task.description}</p>
                                    </div>


                                    {task.actionUrl && !isCompleted && (
                                        <div className="mb-4">
                                            <Button
                                                onClick={() => window.open(task.actionUrl, '_blank')}
                                                className="w-full py-2.5 bg-[#2b3139] text-[#eaecef] hover:bg-[#474d57] border-none text-[10px] font-semibold uppercase transition-all flex items-center justify-center gap-2 rounded-md"
                                                variant="secondary"
                                                size="sm"
                                            >
                                                {task.title.toLowerCase().includes('telegram') ? <Send size={14} className="text-[#229ED9]" /> : <X size={14} className="text-white" />}
                                                Execute Mission ↗
                                            </Button>
                                        </div>
                                    )}

                                    {(task.frequency?.toUpperCase() === 'DAILY' || task.frequency?.toUpperCase() === 'WEEKLY') && (
                                        <div className="mb-6">
                                            <div className="text-[10px] text-[#848e9c] font-semibold uppercase mb-3 text-center">Next Window</div>
                                            <div className="flex gap-2 justify-center">
                                                {(task.frequency?.toUpperCase() === 'DAILY' ? dailyCountdown : weeklyCountdown).split(':').map((val, idx) => (
                                                    <div key={idx} className="flex flex-col items-center">
                                                        <div className="bg-[#0b0e11] border border-[#2b3139] rounded-md w-12 h-12 flex items-center justify-center mb-1">
                                                            <span className="text-xl font-semibold text-[#fcd535] tabular-nums">
                                                                {val || '00'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] font-semibold text-[#848e9c] uppercase">
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
                                                className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-3 py-2.5 text-xs font-mono text-[#eaecef] focus:border-[#fcd535] outline-none transition-all"
                                                value={taskLinks[task.id] || ''}
                                                onChange={(e) => handleTaskLinkChange(task.id, e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {task.requiresFeedback && !isCompleted && (
                                        <div className="mb-4">
                                            <textarea 
                                                placeholder="Provide your mission feedback here..."
                                                className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-3 py-2.5 text-xs font-mono text-[#eaecef] h-20 resize-none focus:border-[#fcd535] outline-none transition-all"
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
                                            className={`w-full py-2.5 text-xs font-semibold uppercase transition-all rounded-md ${missionPaused || (task.requiresLink && !taskLinks[task.id]) || (task.requiresFeedback && !taskFeedback[task.id]) ? 'bg-[#2b3139] text-[#848e9c] cursor-not-allowed border-none' : 'bg-[#fcd535] text-[#181a20] hover:bg-[#e0bd2e]'}`}
                                            size="sm"
                                            disabled={isTaskLoading || missionPaused || (task.requiresLink && !taskLinks[task.id]) || (task.requiresFeedback && !taskFeedback[task.id])}
                                        >
                                            {missionPaused ? 'MISSION PAUSED' : isTaskLoading ? 'Syncing...' : `CLAIM ${task.rewardTokens || 50} ITEMS`}
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full py-2.5 text-xs font-semibold uppercase bg-[#2b3139] text-[#848e9c] cursor-not-allowed border-none rounded-md"
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
                <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                    {/* Mission Proof Submission */}
                    <div className="rounded-lg p-8 bg-[#1e2329] border border-[#2b3139]">
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-[#eaecef] flex items-center gap-2">
                                <Send className="text-[#fcd535]" size={20} /> Submission Hub
                            </h2>
                            <p className="text-xs text-[#848e9c] mt-2 font-medium">Connect your final social identity and mission proof.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Distribution Wallet (BSC)</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="0x..."
                                    className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2.5 text-sm text-[#eaecef] focus:border-[#fcd535] outline-none transition-all"
                                    value={bscWallet}
                                    onChange={(e) => setBscWallet(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">X Profile Link</label>
                                <input 
                                    type="url"
                                    placeholder="https://x.com/yourhandle"
                                    className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2.5 text-sm text-[#eaecef] focus:border-[#fcd535] outline-none transition-all"
                                    value={xLink}
                                    onChange={(e) => setXLink(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Final Mission Feedback (Compulsory)</label>
                                <textarea 
                                    required
                                    className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2.5 text-sm text-[#eaecef] h-24 resize-none focus:border-[#fcd535] outline-none transition-all"
                                    placeholder="Please provide your feedback on the platform UI/UX and features."
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                />
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !review}
                                className="w-full py-3 bg-[#fcd535] text-[#181a20] font-semibold uppercase rounded-md hover:bg-[#e0bd2e] transition-all flex flex-col items-center justify-center gap-1"
                            >
                                {isSubmitting ? 'SYNCING DATA...' : (
                                    <>
                                        <span className="text-sm">INITIALIZE FINAL SYNC</span>
                                        <span className="text-[10px] font-medium opacity-80 uppercase">
                                            Earn 5,000 ITEMS for Feedback
                                        </span>
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="p-8 bg-[#0ecb81]/10 border border-[#0ecb81]/30 rounded-lg text-center space-y-4">
                    <div className="w-12 h-12 bg-[#0ecb81]/20 rounded-full flex items-center justify-center mx-auto border border-[#0ecb81]/40">
                        <CheckCircle2 size={24} className="text-[#0ecb81]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-[#eaecef] uppercase">Identity Synchronized</h2>
                        <p className="text-sm text-[#848e9c] mt-1">Your mission data and BSC wallet have been secured. You will receive your $BAG once the campaign ends and admin confirms your transfer.</p>
                    </div>
                </div>
            )}

            {/* ── Payout Status Tracker moved above Protocol Verification — see above ── */}
            {user && payoutRequest && false && (
                <div className={`rounded-lg border p-6 animate-in slide-in-from-bottom-4 duration-500 ${
                    payoutRequest.status === 'SENT'     ? 'bg-[#0ecb81]/10 border-[#0ecb81]/30' :
                    payoutRequest.status === 'APPROVED' ? 'bg-blue-500/10 border-blue-500/20' :
                    payoutRequest.status === 'REJECTED' ? 'bg-[#f6465d]/10 border-[#f6465d]/20' :
                                                          'bg-[#fcd535]/5 border-[#fcd535]/20'
                }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                payoutRequest.status === 'SENT'     ? 'bg-[#0ecb81]/20 text-[#0ecb81]' :
                                payoutRequest.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' :
                                payoutRequest.status === 'REJECTED' ? 'bg-[#f6465d]/20 text-[#f6465d]' :
                                                                      'bg-[#fcd535]/10 text-[#fcd535]'
                            }`}>
                                {payoutRequest.status === 'SENT' ? <CheckCircle2 size={22} /> :
                                 payoutRequest.status === 'REJECTED' ? <Shield size={22} /> :
                                 <Timer size={22} />}
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-[#848e9c] mb-0.5">$BAG Withdrawal Status</div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-lg font-semibold text-[#eaecef]">
                                        {Number(payoutRequest.expectedTokens).toLocaleString()} $BAG
                                    </span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                                        payoutRequest.status === 'SENT'     ? 'text-[#0ecb81] bg-[#0ecb81]/10 border-[#0ecb81]/30' :
                                        payoutRequest.status === 'APPROVED' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                        payoutRequest.status === 'REJECTED' ? 'text-[#f6465d] bg-[#f6465d]/10 border-[#f6465d]/20' :
                                                                              'text-[#fcd535] bg-[#fcd535]/10 border-[#fcd535]/20'
                                    }`}>{payoutRequest.status}</span>
                                </div>
                                <div className="text-[10px] text-[#848e9c] mt-1">
                                    {payoutRequest.status === 'PENDING'  && 'Your request is queued for admin review. We typically process within 24–48hrs.'}
                                    {payoutRequest.status === 'APPROVED' && 'Approved ✓ — Transfer to your BSC wallet is in progress.'}
                                    {payoutRequest.status === 'SENT'     && `Delivered to your BSC wallet.${payoutRequest.txReference ? ` TX: ${payoutRequest.txReference}` : ''}`}
                                    {payoutRequest.status === 'REJECTED' && 'This request was not approved. Please contact support for details.'}
                                </div>
                            </div>
                        </div>
                        <div className="text-right text-[9px] text-[#848e9c] font-mono shrink-0">
                            <div>Requested: {new Date(payoutRequest.createdAt).toLocaleDateString()}</div>
                            {payoutRequest.sentAt && <div className="text-[#0ecb81] mt-0.5">Sent: {new Date(payoutRequest.sentAt).toLocaleDateString()}</div>}
                            <div className="mt-1 text-[8px] opacity-50">{payoutRequest.walletAddress?.slice(0, 10)}...</div>
                        </div>
                    </div>
                    {/* Progress bar for pending/approved */}
                    {(payoutRequest.status === 'PENDING' || payoutRequest.status === 'APPROVED') && (
                        <div className="mt-4 flex items-center gap-2">
                            {['PENDING', 'APPROVED', 'SENT'].map((step, i) => (
                                <React.Fragment key={step}>
                                    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase ${
                                        (step === payoutRequest.status) ? 'text-[#fcd535]' :
                                        (['PENDING','APPROVED','SENT'].indexOf(step) < ['PENDING','APPROVED','SENT'].indexOf(payoutRequest.status)) ? 'text-[#0ecb81]' :
                                        'text-[#2b3139]'
                                    }`}>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[7px] ${
                                            (step === payoutRequest.status) ? 'border-[#fcd535] bg-[#fcd535]/20 text-[#fcd535]' :
                                            (['PENDING','APPROVED','SENT'].indexOf(step) < ['PENDING','APPROVED','SENT'].indexOf(payoutRequest.status)) ? 'border-[#0ecb81] bg-[#0ecb81]/20 text-[#0ecb81]' :
                                            'border-[#2b3139] text-[#2b3139]'
                                        }`}>{i + 1}</div>
                                        {step}
                                    </div>
                                    {i < 2 && <div className={`flex-1 h-px ${
                                        ['PENDING','APPROVED','SENT'].indexOf(step) < ['PENDING','APPROVED','SENT'].indexOf(payoutRequest.status) - 1 ? 'bg-[#0ecb81]' : 'bg-[#2b3139]'
                                    }`} />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!submitted && (
                <>
                {/* ── AlphaBAG Allocation ── */}
                <div className="rounded-lg p-6 bg-[#1e2329] border border-[#2b3139] mb-6 relative">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-[#2b3139] pb-4">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-[#eaecef] flex items-center gap-2">
                                <BarChart3 className="text-[#fcd535]" size={20} /> AlphaBAG Allocation
                            </h2>
                            <p className="text-xs text-[#848e9c]">Strategic token distribution for sustainable ecosystem growth.</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#fcd535] text-[#181a20] rounded-md">
                            <Zap size={14} fill="currentColor" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Supply: 21,000,000</span>
                        </div>
                    </div>

                    {/* Allocation Grid with Mask */}
                    <div className="relative group/allocation">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 filter blur-[2px] transition-all duration-700 opacity-60">
                            {[
                                { label: 'Liquidity Pool', pct: '30%', tokens: '6.3M', color: 'bg-[#fcd535] text-black', desc: 'Locked Forever.' },
                                { label: 'Task-to-Earn', pct: '35%', tokens: '7.35M', color: 'bg-[#1DA1F2] text-white', desc: 'Mined (4-5y)' },
                                { label: 'Dev & Eco', pct: '15%', tokens: '3.15M', color: 'bg-[#0ecb81] text-black', desc: '6m cliff' },
                                { label: 'Marketing', pct: '10%', tokens: '2.1M', color: 'bg-[#f6465d] text-white', desc: 'Partnerships' },
                                { label: 'Team', pct: '10%', tokens: '2.1M', color: 'bg-[#9333EA] text-white', desc: '12m cliff' },
                            ].map((item) => (
                                <div key={item.label} className="flex flex-col items-center p-4 bg-[#0b0e11] border border-[#2b3139] rounded-md text-center">
                                    <div className={`w-10 h-10 rounded-md ${item.color} flex flex-col items-center justify-center mb-2`}>
                                        <span className="font-semibold text-[11px] leading-none">{item.pct}</span>
                                    </div>
                                    <div className="text-[#eaecef] font-semibold text-xs mb-1">{item.label}</div>
                                    <div className="text-[#848e9c] text-[9px]">{item.desc}</div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Translucent Mask Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="bg-[#181a20] border border-[#2b3139] px-4 py-2 rounded-md flex items-center gap-2">
                                <Lock size={14} className="text-[#fcd535]" />
                                <span className="text-[10px] text-[#eaecef] font-semibold uppercase tracking-wider">Allocation Locked • Verification in Progress</span>
                            </div>
                        </div>
                    </div>




                    {/* Utility & Key Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-3 p-4 bg-[#0b0e11] border border-[#2b3139] rounded-md">
                            <div className="w-8 h-8 rounded-md bg-[#2b3139] flex items-center justify-center shrink-0"><Zap size={14} className="text-[#fcd535]"/></div>
                            <div>
                                <div className="text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider">Utility</div>
                                <div className="text-xs font-semibold text-[#eaecef] mt-1 leading-snug">Portfolio Manager · T2E · Degen Calculator · AI Analyst</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-[#0b0e11] border border-[#2b3139] rounded-md">
                            <div className="w-8 h-8 rounded-md bg-[#2b3139] flex items-center justify-center shrink-0"><Gift size={14} className="text-[#0ecb81]"/></div>
                            <div>
                                <div className="text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider">TGE Distribution</div>
                                <div className="text-xs font-semibold text-[#eaecef] mt-1">Proportional to future utility reward conversion</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Founder Protocol Module */}
                <div className="rounded-lg p-6 bg-[#1e2329] border border-[#1DA1F2]/30 relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-[#2b3139] pb-4">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-[#eaecef] flex items-center gap-2">
                                <Shield className="text-[#1DA1F2]" size={20} /> Founder Application
                            </h2>
                            <p className="text-xs text-[#848e9c]">Apply for one of the <span className="text-[#eaecef] font-semibold">100 Alpha Founder</span> slots for elite priority access.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-[#0b0e11] p-3 rounded-md border border-[#2b3139]">
                            <div className="text-right">
                                <div className="text-[10px] text-[#848e9c] font-semibold uppercase tracking-wider">Slots Remaining</div>
                                <div className="text-lg font-semibold text-[#eaecef]">{Math.max(0, 100 - (stats?.founderEntries || 0))}</div>
                            </div>
                            <div className="relative flex items-center justify-center">
                                <input 
                                type="checkbox" 
                                className="w-6 h-6 rounded-md appearance-none bg-[#181a20] border border-[#474d57] checked:bg-[#1DA1F2] checked:border-[#1DA1F2] transition-all cursor-pointer peer"
                                checked={isFounderApplication}
                                onChange={(e) => setIsFounderApplication(e.target.checked)}
                                />
                                <CheckCircle2 size={14} className="absolute text-[#181a20] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </div>

                    {isFounderApplication && (
                        <div className="space-y-4 pt-2 animate-in slide-in-from-top-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Project Name</label>
                                <input required type="text" placeholder="Project Alpha" className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 text-sm text-[#eaecef] focus:border-[#1DA1F2] outline-none transition-colors" value={projectName} onChange={e => setProjectName(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Ticker</label>
                                <input required type="text" placeholder="$ALPHA" className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 text-sm text-[#eaecef] focus:border-[#1DA1F2] outline-none transition-colors" value={projectTicker} onChange={e => setProjectTicker(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Project Vision</label>
                                <textarea required placeholder="What is your singular vision for the space?" className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 text-sm text-[#eaecef] focus:border-[#1DA1F2] outline-none transition-colors h-20 resize-none" value={projectManifesto} onChange={e => setProjectManifesto(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Project X Link</label>
                                <input required type="url" placeholder="https://x.com/..." className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 text-sm text-[#eaecef] focus:border-[#1DA1F2] outline-none transition-colors" value={projectSocial} onChange={e => setProjectSocial(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Official Website</label>
                                <input required type="url" placeholder="https://..." className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 text-sm text-[#eaecef] focus:border-[#1DA1F2] outline-none transition-colors" value={projectWebsite} onChange={e => setProjectWebsite(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Project Logo URL</label>
                                <input required type="url" placeholder="https://..." className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 text-sm text-[#eaecef] focus:border-[#1DA1F2] outline-none transition-colors" value={projectLogo} onChange={e => setProjectLogo(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Project Banner URL</label>
                                <input required type="url" placeholder="https://..." className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 text-sm text-[#eaecef] focus:border-[#1DA1F2] outline-none transition-colors" value={projectBanner} onChange={e => setProjectBanner(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Project Contract Address</label>
                                <input required type="text" placeholder="0x..." className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 text-sm text-[#eaecef] focus:border-[#1DA1F2] outline-none transition-colors" value={projectContract} onChange={e => setProjectContract(e.target.value)} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Key Project Goals</label>
                                <textarea required placeholder="What are the next 3 major milestones for your project?" className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 text-sm text-[#eaecef] focus:border-[#1DA1F2] outline-none transition-colors h-20 resize-none" value={projectGoals} onChange={e => setProjectGoals(e.target.value)} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-[#848e9c] font-semibold">Founder Personal Social / Telegram</label>
                                <input required type="text" placeholder="@username" className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-md px-4 py-2 text-sm text-[#eaecef] focus:border-[#1DA1F2] outline-none transition-colors" value={founderSocial} onChange={e => setFounderSocial(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>
                </>
            )}
        </div>
    );
};
