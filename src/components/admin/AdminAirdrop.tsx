import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { 
    Zap, AlertTriangle, Plus, Trash2, Shield, Users, 
    Download, Target, ExternalLink, Globe, CheckCircle2,
    PauseCircle, PlayCircle, RefreshCw, DatabaseBackup,
    XCircle, DollarSign, BarChart3, Settings, AlertCircle,
    Eye, ShieldCheck, UserCheck, Trash
} from 'lucide-react';
import Swal from 'sweetalert2';

export const AdminAirdrop: React.FC = () => {
    // Shared State
    const [tasks, setTasks] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'campaign' | 'missions' | 'proofs' | 'founders' | 'payouts'>('campaign');
    const [isLoading, setIsLoading] = useState(false);
    const [missionPaused, setMissionPaused] = useState(false);
    const [tgeDate, setTgeDate] = useState('');
    const [isSettingTge, setIsSettingTge] = useState(false);

    // New Mission Form State
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        rewardTokens: 100,
        type: 'SOCIAL',
        frequency: 'ONCE',
        requiresLink: false,
        actionUrl: ''
    });

    // Campaign Configuration State
    const [treasury, setTreasury] = useState<any>(null);
    const [minClaim, setMinClaim] = useState<string>('500');
    const [itemsToBagRate, setItemsToBagRate] = useState<string>('10');
    const [tokenTicker, setTokenTicker] = useState('BAG');
    const [genesisReward, setGenesisReward] = useState(5000);
    const [phaseDuration, setPhaseDuration] = useState(10);

    // Verification Desk State
    const [activity, setActivity] = useState<any[]>([]);
    const [strikeLogs, setStrikeLogs] = useState<any[]>([]);

    // Airdrop Queue State
    const [requests, setRequests] = useState<any[]>([]);
    const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch configuration/treasury stats on mount or mode change
            const resTreasury = await api.get('/api/v1/t2e/treasury-status');
            setTreasury(resTreasury.data);
            if (resTreasury.data) {
                setMinClaim(resTreasury.data.minimumClaimBalance?.toString() || '500');
                setItemsToBagRate(resTreasury.data.itemsToBagRate?.toString() || '10');
            }

            // Fetch general mission status (TGE countdown, paused)
            const resStatus = await api.get('/api/airdrop/admin/mission-status');
            setMissionPaused(!!resStatus.data.isPaused);
            if (resStatus.data.tgeDate) {
                const dt = new Date(resStatus.data.tgeDate);
                const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
                    .toISOString().slice(0, 16);
                setTgeDate(local);
            }

            // Fetch specific view data
            if (viewMode === 'missions') {
                const resTasks = await api.get('/api/airdrop/admin/tasks');
                setTasks(Array.isArray(resTasks.data) ? resTasks.data : (resTasks.data.missions || []));
            } else if (viewMode === 'proofs') {
                const [resParts, resAct, resStrikes] = await Promise.all([
                    api.get('/api/airdrop/admin/wallets'),
                    api.get('/api/v1/t2e/admin/activity'),
                    api.get('/api/airdrop/admin/strikes')
                ]);
                setParticipants(resParts.data || []);
                setActivity(resAct.data || []);
                setStrikeLogs(resStrikes.data || []);
            } else if (viewMode === 'founders') {
                const resParts = await api.get('/api/airdrop/admin/wallets');
                setParticipants(resParts.data || []);
            } else if (viewMode === 'payouts') {
                const resReqs = await api.get('/api/v1/t2e/admin/token-requests');
                setRequests(resReqs.data || []);
                setSelectedRequestIds([]);
            }
        } catch (error) {
            console.error("Failed to fetch admin workspace data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [viewMode]);

    // ────────────────────────────────────────────────────────────────────────
    // CAMPAIGN ACTIVATOR ACTIONS
    // ────────────────────────────────────────────────────────────────────────
    
    const handleStartCampaign = async () => {
        if (!tgeDate) {
            Swal.fire({
                title: 'Date Required',
                text: 'Please select a TGE Target Date & Time first.',
                icon: 'warning',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#fcd535'
            });
            return;
        }

        setIsLoading(true);
        try {
            const isoDate = new Date(tgeDate).toISOString();
            
            // Synchronize all campaign activation properties in parallel
            await Promise.all([
                api.post('/api/airdrop/admin/tge-date', { tgeDate: isoDate }),
                api.patch('/api/v1/t2e/admin/adjust-balance', {
                    minimumClaimBalance: parseInt(minClaim),
                    itemsToBagRate: itemsToBagRate === '' ? null : parseFloat(itemsToBagRate),
                    campaignEnded: false
                }),
                api.post('/api/airdrop/admin/campaigns', {
                    tokenTicker,
                    pointsPerClaim: genesisReward,
                    durationDays: phaseDuration,
                    status: 'ACTIVE',
                    isSubmissionActive: true
                })
            ]);

            Swal.fire({
                title: '🚀 CAMPAIGN LAUNCHED',
                text: `Active campaign for $${tokenTicker} has been successfully initialized and started!`,
                icon: 'success',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#10b981'
            });

            fetchData();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.error || 'Failed to initialize campaign', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveT2EConfig = async (e?: any, campaignEnded?: boolean) => {
        setIsLoading(true);
        try {
            const res = await api.patch('/api/v1/t2e/admin/adjust-balance', {
                minimumClaimBalance: parseInt(minClaim),
                itemsToBagRate: itemsToBagRate === '' ? null : parseFloat(itemsToBagRate),
                ...(campaignEnded !== undefined ? { campaignEnded } : {})
            });
            if (res.data.success) {
                if (campaignEnded) {
                    Swal.fire({ title: 'CAMPAIGN ENDED', text: 'Conversions have been halted.', icon: 'warning', background: '#0a0a0a', color: '#fff' });
                } else {
                    Swal.fire({ title: 'CONFIG SYNCED', text: 'Protocol parameters updated.', icon: 'success', background: '#0a0a0a', color: '#fff' });
                }
                setTreasury(prev => prev ? { ...prev, ...res.data.config } : null);
            }
        } catch (e) {
            Swal.fire({ title: 'SYNC FAILED', text: 'Failed to update protocol settings.', icon: 'error', background: '#0a0a0a', color: '#fff' });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePauseMission = async () => {
        const action = missionPaused ? 'RESUME' : 'PAUSE';
        const result = await Swal.fire({
            title: `${action} MISSION?`,
            text: missionPaused
                ? 'Resume the mission and allow users to claim ITEMS again?'
                : 'Pause the mission? All ITEMS claims will be disabled until resumed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: missionPaused ? '#22c55e' : '#f59e0b',
            confirmButtonText: `YES, ${action}`,
            background: '#0a0a0a',
            color: '#fff'
        });
        if (result.isConfirmed) {
            try {
                const res = await api.post('/api/airdrop/admin/pause-mission', { paused: !missionPaused });
                setMissionPaused(res.data.isPaused);
                Swal.fire({ title: res.data.message, icon: 'success', background: '#0a0a0a', color: '#fff' });
            } catch (error) {
                Swal.fire('Error', 'Failed to update mission state', 'error');
            }
        }
    };

    const handleExportData = async () => {
        try {
            const res = await api.get('/api/airdrop/admin/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `alphabag_snapshot_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            Swal.fire({ title: 'EXPORT COMPLETE', text: 'Member ITEMS snapshot downloaded.', icon: 'success', background: '#0a0a0a', color: '#fff' });
        } catch (error) {
            Swal.fire('Error', 'Export failed', 'error');
        }
    };

    const handleFullWipe = async () => {
        const result = await Swal.fire({
            title: '⚠️ FULL MISSION WIPE',
            html: '<p style="color:#ccc">This permanently deletes all ITEMS, tasks, campaigns and resets every member. User accounts are preserved but all mission progress is erased.</p><p style="color:#fcd535; margin-top:12px"><strong>Download the export first before proceeding.</strong></p>',
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'WIPE ALL MISSION DATA',
            cancelButtonText: 'CANCEL',
            background: '#0a0a0a',
            color: '#fff'
        });
        if (result.isConfirmed) {
            try {
                await api.post('/api/airdrop/admin/full-wipe');
                Swal.fire({ title: 'MISSION WIPED', text: 'All data cleared. Ready to restart.', icon: 'success', background: '#0a0a0a', color: '#fff' });
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'Wipe failed', 'error');
            }
        }
    };

    const handleReset = async () => {
        const result = await Swal.fire({
            title: 'CRITICAL WIPE?',
            text: "Reset ALL AlphaBAG data, tasks, and balances? UNAUTHORIZED ENTRIES WILL BE LOST.",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'WIPE CORE',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await api.post('/api/airdrop/admin/reset', {});
                Swal.fire('CORE WIPED', 'All data neutralized.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'Wipe failed', 'error');
            }
        }
    };

    // ────────────────────────────────────────────────────────────────────────
    // MISSION DEPLOYMENT ACTIONS
    // ────────────────────────────────────────────────────────────────────────

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/api/airdrop/admin/tasks', {
                ...newTask,
                rewardTokens: Number(newTask.rewardTokens)
            });
            Swal.fire({
                title: 'MISSION DEPLOYED',
                text: 'The task is now live in the Reward Hub.',
                icon: 'success',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#fcd535'
            });
            setShowTaskForm(false);
            setNewTask({
                title: '',
                description: '',
                rewardTokens: 100,
                type: 'SOCIAL',
                frequency: 'ONCE',
                requiresLink: false,
                actionUrl: ''
            });
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'Failed to deploy mission', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        const result = await Swal.fire({
            title: 'REMOVE MISSION?',
            text: "This hub entry will be terminated.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/api/airdrop/admin/tasks/${id}`);
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'Termination failed', 'error');
            }
        }
    };

    // ────────────────────────────────────────────────────────────────────────
    // MEMBER AUDIT ACTIONS
    // ────────────────────────────────────────────────────────────────────────

    const handleApproveFounder = async (userId: string, currentStatus: boolean) => {
        try {
            const apiStatus = currentStatus ? 'REJECTED' : 'APPROVED';
            await api.post('/api/airdrop/admin/approve-founder', { userId, status: apiStatus });
            Swal.fire({
                title: apiStatus === 'APPROVED' ? 'MEMBER ACTIVATED' : 'MEMBER DEACTIVATED',
                text: `Founder status has been ${apiStatus.toLowerCase()}.`,
                icon: 'success',
                background: '#0a0a0a',
                color: '#fff'
            });
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'Action failed', 'error');
        }
    };

    const handleGrantBonus = async (userId: string, currentWallet: string) => {
        const { value: result } = await Swal.fire({
            title: 'MEMBER CORRECTION',
            html: `
                <div class="text-[10px] text-zinc-500 mb-4 uppercase font-bold">Adjust balance for ${currentWallet || userId}</div>
                <div class="flex flex-col gap-4">
                    <button id="btn-award" class="swal2-confirm swal2-styled bg-alphabag-yellow text-[#000] font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-lg">AWARD ITEMS</button>
                    <button id="btn-deduct" class="swal2-deny swal2-styled bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-lg">DEDUCT & STRIKE</button>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'CANCEL',
            background: '#0a0a0a',
            color: '#fff',
            didOpen: () => {
                const awardBtn = document.getElementById('btn-award');
                const deductBtn = document.getElementById('btn-deduct');
                
                awardBtn?.addEventListener('click', () => Swal.clickConfirm());
                deductBtn?.addEventListener('click', () => Swal.clickDeny());
            }
        });

        const isDeduction = result === false;
        if (result === undefined && !isDeduction) return;

        const { value: amount } = await Swal.fire({
            title: isDeduction ? 'DEDUCT ITEMS' : 'AWARD ITEMS',
            input: 'number',
            inputLabel: isDeduction ? 'Enter deduction amount (will add 1 strike)' : 'Enter award amount',
            inputPlaceholder: 'e.g. 500',
            showCancelButton: true,
            confirmButtonText: 'EXECUTE',
            confirmButtonColor: isDeduction ? '#ef4444' : '#fcd535',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (amount) {
            try {
                const finalAmount = isDeduction ? -Math.abs(parseInt(amount)) : parseInt(amount);
                const res = await api.post('/api/airdrop/admin/bonus-xp', { userId, bonusTokens: finalAmount });
                Swal.fire({
                    title: isDeduction ? 'DEDUCTION APPLIED' : 'BONUS GRANTED',
                    text: res.data.message,
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff'
                });
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'Action failed', 'error');
            }
        }
    };

    const handleIssueStrike = async (userId: string, currentWallet: string) => {
        const { value: reason } = await Swal.fire({
            title: 'ISSUE STRIKE PROTOCOL',
            text: `Describe the violation for node: ${currentWallet || userId}`,
            input: 'text',
            inputPlaceholder: 'Reason for strike (e.g. invalid proof link, spam)',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ISSUE STRIKE',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (reason !== undefined) {
            try {
                const res = await api.post('/api/airdrop/admin/strike', { userId, reason });
                Swal.fire({
                    title: 'STRIKE ISSUED',
                    text: res.data.message,
                    icon: 'warning',
                    background: '#0a0a0a',
                    color: '#fff'
                });
                fetchData();
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.error || 'Failed to issue strike', 'error');
            }
        }
    };

    const handleUnbanUser = async (userId: string, currentWallet: string) => {
        const confirm = await Swal.fire({
            title: 'UNBAN MEMBER',
            text: `Are you sure you want to reinstate node: ${currentWallet || userId}? This resets their strikes to 0.`,
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'REINSTATE',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (confirm.isConfirmed) {
            try {
                const res = await api.post('/api/airdrop/admin/unban', { userId });
                Swal.fire({
                    title: 'REINSTATED',
                    text: res.data.message,
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff'
                });
                fetchData();
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.error || 'Failed to unban user', 'error');
            }
        }
    };


    const exportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Account ID/Email,BSC Wallet,ITEMS,Converted BAG,Referrals,Tier,Feedback\n";
        const rate = parseFloat(itemsToBagRate) || 10;
        participants.forEach(p => {
            const wallet = p.wallet || p.submittedWallet || 'NOT SUBMITTED';
            const feedback = p.reviewComment ? p.reviewComment.replace(/"/g, '""') : '';
            const convertedBAG = Number((p.points || 0) / rate).toFixed(2);
            csvContent += `"${p.email || p.id}","${wallet}",${p.points},${convertedBAG},${p.referralCount},${p.accountType},"${feedback}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `alphabag_snapshot_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleExportFoundersCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,BSC Wallet,Project Name,Ticker,Vision,Website,X Link,Contract,Goals,Founder Social,Feedback\n";
        participants.filter(p => p.isFounderRequest || p.projectName).forEach(p => {
            const wallet = p.wallet || p.submittedWallet || 'NOT SUBMITTED';
            const feedback = p.reviewComment ? p.reviewComment.replace(/"/g, '""') : '';
            csvContent += `"${wallet}","${p.projectName || ''}","${p.projectTicker || ''}","${p.projectManifesto?.replace(/"/g, '""') || ''}","${p.projectWebsite || ''}","${p.projectSocial || ''}","${p.projectContract || ''}","${p.projectGoals?.replace(/"/g, '""') || ''}","${p.founderSocial || ''}","${feedback}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `founders_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        Swal.fire({ title: 'EXPORT SUCCESS', text: 'Founders data downloaded.', icon: 'success', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
    };

    // ────────────────────────────────────────────────────────────────────────
    // PAYOUT QUEUE & BULK ACTIONS
    // ────────────────────────────────────────────────────────────────────────

    const handleApprovePayout = async (id: string, decision: 'APPROVED' | 'REJECTED' = 'APPROVED') => {
        const isApprove = decision === 'APPROVED';
        const result = await Swal.fire({
            title: isApprove ? 'AUTHORIZE AIRDROP' : 'DENY PAYOUT REQUEST',
            text: isApprove 
                ? "This will approve the payout request and calculate live token conversions."
                : "Are you sure you want to reject this payout request?",
            icon: isApprove ? 'warning' : 'error',
            showCancelButton: true,
            confirmButtonColor: isApprove ? '#fcd535' : '#ef4444',
            confirmButtonText: isApprove ? 'APPROVE PAYOUT' : 'DENY REQUEST',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                const res = await api.post(`/api/v1/t2e/admin/token-requests/${id}/approve`, { status: decision });
                Swal.fire({
                    title: isApprove ? 'PAYOUT APPROVED' : 'REQUEST DENIED',
                    html: isApprove ? `<p class="text-xs text-zinc-400">Status updated to APPROVED</p>` : `<p class="text-xs text-zinc-400">Request has been marked as rejected.</p>`,
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff'
                });
                fetchData();
            } catch (err: any) {
                Swal.fire('ERROR', err.response?.data?.error || 'Action failed', 'error');
            }
        }
    };

    const handleMarkDone = async (id: string) => {
        const result = await Swal.fire({
            title: 'CONFIRM TRANSFER DONE',
            html: `<p class="text-xs text-zinc-400">Enter manual TX reference or leave blank. This tells the user their $BAG has been sent to their BSC wallet.</p>`,
            input: 'text',
            inputPlaceholder: 'TX Hash / reference (optional)',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            confirmButtonText: '✓ MARK AS SENT',
            background: '#0a0a0a',
            color: '#fff'
        });
        if (!result.isConfirmed) return;
        try {
            await api.post(`/api/v1/t2e/admin/token-requests/${id}/mark-done`, { txReference: result.value || null });
            Swal.fire({ title: 'MARKED AS SENT', text: 'User dashboard will now show reward delivered.', icon: 'success', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
            fetchData();
        } catch (err: any) {
            Swal.fire('ERROR', err.response?.data?.error || 'Failed', 'error');
        }
    };

    const handleApproveAll = async () => {
        const result = await Swal.fire({
            title: 'APPROVE ALL PENDING?',
            text: "This will approve all pending token payouts in the queue.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#fcd535',
            confirmButtonText: 'APPROVE ALL',
            background: '#0a0a0a',
            color: '#fff'
        });
        if (!result.isConfirmed) return;
        setIsLoading(true);
        try {
            await api.post('/api/v1/t2e/admin/token-requests/approve-all', {});
            Swal.fire('SUCCESS', 'All pending requests have been approved.', 'success');
            fetchData();
        } catch (error: any) {
            Swal.fire('ERROR', error.response?.data?.error || 'Failed to approve all requests', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAllDone = async () => {
        const result = await Swal.fire({
            title: 'MARK ALL APPROVED AS SENT?',
            text: "This will mark all approved payout requests as complete and SENT.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'MARK ALL SENT',
            background: '#0a0a0a',
            color: '#fff'
        });
        if (!result.isConfirmed) return;
        setIsLoading(true);
        try {
            await api.post('/api/v1/t2e/admin/token-requests/mark-all-done', {});
            Swal.fire('SUCCESS', 'All approved payouts have been marked as SENT.', 'success');
            fetchData();
        } catch (error: any) {
            Swal.fire('ERROR', error.response?.data?.error || 'Failed to mark all as sent', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportApprovedCSV = async () => {
        try {
            const res = await api.get('/api/v1/t2e/admin/token-requests/export-approved', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `approved_payouts_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            Swal.fire({ title: 'EXPORT SUCCESS', text: 'Approved payouts list downloaded.', icon: 'success', background: '#0a0a0a', color: '#fff' });
        } catch (error) {
            Swal.fire('Error', 'Export failed', 'error');
        }
    };

    const handleRejectSelected = async () => {
        if (selectedRequestIds.length === 0) return;
        const result = await Swal.fire({
            title: `REJECT ${selectedRequestIds.length} ITEMS?`,
            text: "This will mark all selected payout requests as REJECTED.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'REJECT SELECTED',
            background: '#0a0a0a',
            color: '#fff'
        });
        if (!result.isConfirmed) return;
        setIsLoading(true);
        try {
            await api.post('/api/v1/t2e/admin/token-requests/reject-bulk', { ids: selectedRequestIds });
            Swal.fire('SUCCESS', `${selectedRequestIds.length} requests have been rejected.`, 'success');
            fetchData();
        } catch (error: any) {
            Swal.fire('ERROR', error.response?.data?.error || 'Failed to reject requests', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSelectRequest = (id: string) => {
        setSelectedRequestIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleToggleSelectAllPending = () => {
        const pendingIds = requests.filter(r => r.status === 'PENDING').map(r => r.id);
        const allPendingSelected = pendingIds.every(id => selectedRequestIds.includes(id));
        
        if (allPendingSelected) {
            setSelectedRequestIds(prev => prev.filter(id => !pendingIds.includes(id)));
        } else {
            setSelectedRequestIds(prev => Array.from(new Set([...prev, ...pendingIds])));
        }
    };

    // ────────────────────────────────────────────────────────────────────────
    // RENDER FUNCTIONS
    // ────────────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-alphabag-yellow/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                {/* Header Section */}
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Target className="text-alphabag-yellow" /> Campaign & Missions Command Center
                    </h2>
                    <div className="flex gap-4">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={exportCSV}
                            className="bg-alphabag-yellow !text-black font-black tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-alphabag-yellow/5"
                        >
                            <Download size={14} className="mr-2" /> EXPORT CAMPAIGN SNAPSHOT
                        </Button>
                    </div>
                </div>

                {/* Sub-navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 bg-black/40 p-1.5 rounded-xl border border-white/5 w-max">
                    {[
                        { id: 'campaign', label: 'Campaign Activator' },
                        { id: 'missions', label: 'Deploy Missions' },
                        { id: 'proofs', label: 'Verification & Audits' },
                        { id: 'founders', label: 'Founder Elite' },
                        { id: 'payouts', label: 'Airdrop Payout Queue' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id as any)}
                            className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === tab.id ? 'bg-white/10 text-white border border-white/10' : 'text-alphabag-muted hover:text-white'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Render: Campaign Activator */}
                {viewMode === 'campaign' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        
                        {/* Live Treasury Intelligence Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[1.5rem] hover:border-alphabag-yellow/30 transition-all group/card">
                                <p className="text-[10px] text-alphabag-muted uppercase font-black tracking-widest mb-2 opacity-60">Total ITEMS Earned</p>
                                <h4 className="text-3xl font-black text-white font-mono group-hover/card:scale-105 transition-transform origin-left">{Number(treasury?.intelligence?.totalEarned || 0).toLocaleString()} <span className="text-[12px] text-zinc-500 font-bold ml-1">ITEMS</span></h4>
                            </div>
                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[1.5rem] hover:border-alphabag-yellow/30 transition-all group/card">
                                <p className="text-[10px] text-alphabag-muted uppercase font-black tracking-widest mb-2 opacity-60">BAG Conversion Liability</p>
                                <h4 className="text-3xl font-black text-alphabag-yellow font-mono group-hover/card:scale-105 transition-transform origin-left">{Number(treasury?.intelligence?.totalPending || 0).toLocaleString()} <span className="text-[12px] text-alphabag-yellow/50 font-bold ml-1">BAG</span></h4>
                            </div>
                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[1.5rem] relative overflow-hidden hover:border-alphabag-green/30 transition-all group/card">
                                <div className="absolute top-0 right-0 px-3 py-1 bg-alphabag-green/20 text-alphabag-green text-[8px] font-black uppercase tracking-tighter rounded-bl-xl border-l border-b border-alphabag-green/30">Live Distro</div>
                                <p className="text-[10px] text-alphabag-muted uppercase font-black tracking-widest mb-2 opacity-60">Total Disbursed</p>
                                <h4 className="text-3xl font-black text-alphabag-green font-mono group-hover/card:scale-105 transition-transform origin-left">{Number(treasury?.intelligence?.totalDisbursed || 0).toLocaleString()} <span className="text-[12px] text-alphabag-green/50 font-bold ml-1">BAG</span></h4>
                            </div>
                        </div>

                        {/* Combined Campaign Settings Form */}
                        <div className="bg-[#0a0a0a] border border-alphabag-yellow/20 rounded-2xl p-8 space-y-6 relative">
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                        <Zap className="text-alphabag-yellow" size={20} /> Setup Live Campaign & TGE Sync
                                    </h3>
                                    <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest mt-1">
                                        Define your token configuration, countdown target, payout floor, and rates to initialize the campaign lifecycle.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-alphabag-green/20 bg-alphabag-green/10 text-alphabag-green text-[10px] font-black uppercase tracking-widest">
                                    <span className="w-2 h-2 rounded-full bg-alphabag-green animate-pulse"></span>
                                    {treasury?.campaignEnded ? 'CAMPAIGN HALTED' : 'OPERATIONAL STATE'}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Token Ticker</label>
                                    <input type="text" value={tokenTicker} onChange={e => setTokenTicker(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-alphabag-yellow outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Genesis User Reward (ITEMS)</label>
                                    <input type="number" value={genesisReward} onChange={e => setGenesisReward(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-alphabag-yellow outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Phase Duration (Days)</label>
                                    <input type="number" value={phaseDuration} onChange={e => setPhaseDuration(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-alphabag-yellow outline-none transition-all" />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Conversion Rate (ITEMS per 1 $BAG)</label>
                                    <input type="number" value={itemsToBagRate} onChange={e => setItemsToBagRate(e.target.value)} placeholder="e.g. 10" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-alphabag-yellow outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Minimum User Payout Floor ($BAG)</label>
                                    <input type="number" value={minClaim} onChange={e => setMinClaim(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-alphabag-yellow outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">TGE Countdown Date & Time</label>
                                    <input type="datetime-local" value={tgeDate} onChange={e => setTgeDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-alphabag-yellow outline-none transition-all [color-scheme:dark]" />
                                </div>
                            </div>

                            <div className="flex justify-center gap-4 pt-6 border-t border-white/5">
                                <Button 
                                    onClick={handleSaveT2EConfig} 
                                    className="bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 h-14 rounded-2xl hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
                                >
                                    SAVE CONFIG VALUES
                                </Button>
                                <Button 
                                    onClick={handleStartCampaign} 
                                    className="bg-alphabag-green !text-black font-black uppercase tracking-[0.3em] text-[11px] px-12 h-14 rounded-2xl shadow-[0_0_30px_rgba(0,255,163,0.2)] hover:scale-105 active:scale-95 transition-all"
                                >
                                    START CAMPAIGN
                                </Button>
                            </div>
                        </div>

                        {/* Lifecycle Control & Pause Block */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                        <RefreshCw className="text-alphabag-yellow" size={20} /> Mission Lifecycle Control
                                    </h3>
                                    <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest mt-1">Pause, export, wipe, and restart the Alpha Mission for TGE.</p>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${missionPaused ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                    <span className={`w-2 h-2 rounded-full ${missionPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`}></span>
                                    {missionPaused ? 'PAUSED' : 'LIVE'}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={handlePauseMission}
                                    className={`flex items-center justify-center gap-3 p-5 rounded-2xl border font-black text-[11px] uppercase tracking-[0.2em] transition-all ${missionPaused ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'}`}
                                >
                                    {missionPaused ? <><PlayCircle size={18} /> RESUME MISSION</> : <><PauseCircle size={18} /> PAUSE MISSION</>}
                                </button>
                                <button
                                    onClick={handleExportData}
                                    className="flex items-center justify-center gap-3 p-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-black text-[11px] uppercase tracking-[0.2em] transition-all"
                                >
                                    <DatabaseBackup size={18} /> EXPORT ALL USER EARNED
                                </button>
                                <button
                                    onClick={handleFullWipe}
                                    className="flex items-center justify-center gap-3 p-5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-black text-[11px] uppercase tracking-[0.2em] transition-all"
                                >
                                    <Trash2 size={18} /> FULL CAMPAIGN WIPE
                                </button>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleSaveT2EConfig(undefined, true)}
                                    className="flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-955/20 text-red-400 hover:bg-red-900/20 font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                                >
                                    <XCircle size={16} /> END CURRENT CAMPAIGN (HALT CONVERSIONS)
                                </button>
                            </div>
                            <p className="text-[9px] text-alphabag-muted text-center font-bold uppercase tracking-widest">Always export user data before executing a full campaign wipe. Ending a campaign will halt payouts without deleting progress.</p>
                        </div>

                        {/* Critical Hub Reset */}
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <AlertTriangle size={32} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Ecosystem Reset</h3>
                                    <p className="text-xs text-alphabag-muted mt-1 uppercase tracking-widest font-bold">This eliminates ALL missions, balances, tasks, and network data.</p>
                                </div>
                            </div>
                            <Button onClick={handleReset} variant="danger" className="bg-red-600 hover:bg-red-500 text-white font-black uppercase px-8 h-12 text-[10px]">EXECUTE RESET</Button>
                        </div>
                    </div>
                )}

                {/* Tab Render: Deploy Missions */}
                {viewMode === 'missions' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                            <div>
                                <h3 className="font-black text-white uppercase tracking-widest text-sm">Task Deployment Console</h3>
                                <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest mt-1">Active Missions: {tasks.length}</p>
                            </div>
                            <Button onClick={() => setShowTaskForm(!showTaskForm)} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px]">
                                {showTaskForm ? 'ABORT' : <><Plus size={16} className="mr-2" /> CREATE MISSION</>}
                            </Button>
                        </div>

                        {showTaskForm && (
                            <form onSubmit={handleCreateTask} className="bg-black/40 border border-alphabag-yellow/50 rounded-2xl p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Mission Title</label>
                                        <input required type="text" placeholder="e.g. Follow on X" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-alphabag-yellow outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">ITEMS Reward</label>
                                        <input required type="number" value={newTask.rewardTokens} onChange={e => setNewTask({ ...newTask, rewardTokens: Number(e.target.value) })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-alphabag-yellow outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Mission Description</label>
                                    <textarea required placeholder="Explain the criteria..." value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white h-24 resize-none focus:border-alphabag-yellow outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Category</label>
                                        <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-sm text-white outline-none focus:border-alphabag-yellow">
                                            <option value="SOCIAL">SOCIAL</option>
                                            <option value="TECHNICAL">TECHNICAL</option>
                                            <option value="GROWTH">GROWTH</option>
                                            <option value="REVIEW">REVIEW</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Frequency</label>
                                        <select value={newTask.frequency} onChange={e => setNewTask({ ...newTask, frequency: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-sm text-white outline-none focus:border-alphabag-yellow">
                                            <option value="ONCE">ONCE</option>
                                            <option value="DAILY">DAILY</option>
                                            <option value="WEEKLY">WEEKLY</option>
                                            <option value="UNLIMITED">UNLIMITED</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Action URL (Optional)</label>
                                        <input type="url" placeholder="https://..." value={newTask.actionUrl} onChange={e => setNewTask({ ...newTask, actionUrl: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-alphabag-yellow outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                    <input type="checkbox" id="requiresLink" checked={newTask.requiresLink} onChange={e => setNewTask({ ...newTask, requiresLink: e.target.checked })} className="w-5 h-5 rounded border-white/10 bg-black text-alphabag-yellow" />
                                    <label htmlFor="requiresLink" className="text-xs font-bold text-white uppercase tracking-widest cursor-pointer">Require Proof Link for validation</label>
                                </div>
                                <div className="flex justify-center pt-4">
                                    <Button type="submit" isLoading={isLoading} className="bg-alphabag-yellow text-black uppercase font-black px-12 h-12 tracking-[0.2em] shadow-[0_0_30px_rgba(252,213,53,0.2)] hover:scale-105 transition-all text-[11px] rounded-xl">
                                        DEPLOY MISSION
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {tasks.map(t => (
                                <div key={t.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-white/20 transition-all">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                            <Zap size={24} className="text-alphabag-yellow" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-white uppercase tracking-wider text-xs">{t.title}</h4>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-alphabag-yellow/10 text-alphabag-yellow">{t.frequency}</span>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-alphabag-blue">{t.type}</span>
                                            </div>
                                            <p className="text-xs text-alphabag-muted mt-1">{t.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <div className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest">Reward</div>
                                            <div className="text-base font-black text-white">{Number(t.rewardTokens).toLocaleString()} <span className="text-[9px] text-alphabag-yellow tracking-tighter">ITEMS</span></div>
                                        </div>
                                        <button onClick={() => handleDeleteTask(t.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && <div className="text-center p-12 text-alphabag-muted italic bg-black/20 rounded-2xl border border-white/5 border-dashed">No missions active.</div>}
                        </div>
                    </div>
                )}

                {/* Tab Render: Verification & Audits */}
                {viewMode === 'proofs' && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        
                        {/* Section A: Proof Inspections */}
                        <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-black text-white uppercase tracking-widest text-xs">Proof Audits (Submitted Tasks)</h3>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-[9px] uppercase text-alphabag-muted font-black tracking-widest">
                                        <tr>
                                            <th className="p-6">Participant</th>
                                            <th className="p-6">Task</th>
                                            <th className="p-6">Reward</th>
                                            <th className="p-6">Proof Link</th>
                                            <th className="p-6">Feedback</th>
                                            <th className="p-6 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs">
                                        {activity.map((a, i) => (
                                            <tr key={i} className="hover:bg-white/[0.01]">
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-[10px] font-bold text-white font-mono">{a.user?.walletAddress ? `${a.user.walletAddress.slice(0, 8)}...` : (a.userId || 'Unknown').slice(0, 10) + '...'}</div>
                                                        <div className="flex gap-1.5 items-center">
                                                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${a.user?.isBanned ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                                                {a.user?.isBanned ? 'BANNED' : 'ACTIVE'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="text-[10px] font-bold text-white uppercase mb-0.5">{a.mission?.title}</div>
                                                    <div className="text-[8px] text-alphabag-muted uppercase font-bold">{a.mission?.type}</div>
                                                </td>
                                                <td className="p-6 font-mono text-alphabag-green text-[10px] font-bold">+{Number(a.rewardTokens).toLocaleString()} ITEMS</td>
                                                <td className="p-6">
                                                    {a.proofLink ? (
                                                        <a href={a.proofLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-alphabag-yellow hover:underline text-[9px] font-bold uppercase">
                                                            View Proof <ExternalLink size={10} />
                                                        </a>
                                                    ) : <span className="text-[9px] text-alphabag-muted italic">Self-Verified</span>}
                                                </td>
                                                <td className="p-6">
                                                    {a.feedback ? (
                                                        <button 
                                                            onClick={() => Swal.fire({ title: 'Task Feedback', text: a.feedback, background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' })}
                                                            className="text-[10px] text-alphabag-yellow hover:underline text-left max-w-[150px] truncate block"
                                                        >
                                                            {a.feedback}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-zinc-500 italic">No feedback</span>
                                                    )}
                                                </td>
                                                <td className="p-6 text-right font-mono text-[9px] text-alphabag-muted">
                                                    {new Date(a.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {activity.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-alphabag-muted italic">No task submissions logged yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section B: Registered Member database with Strikes/Warnings */}
                        <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="font-black text-white uppercase tracking-widest text-xs">Member Database & Balance Corrections</h3>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-[9px] uppercase text-alphabag-muted font-black tracking-widest">
                                        <tr>
                                            <th className="p-6">Wallet (Alias)</th>
                                            <th className="p-6">Recruits</th>
                                            <th className="p-6">Status / Strikes</th>
                                            <th className="p-6">Feedback</th>
                                            <th className="p-6 text-right">Power (ITEMS)</th>
                                            <th className="p-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs">
                                        {participants.map((p, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-mono text-zinc-400 text-[10px] truncate max-w-[180px]">{p.wallet || p.email}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 font-black text-white">
                                                    {p.referralCount || 0}
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`w-max px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${p.isBanned ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                                            {p.isBanned ? 'BANNED' : 'COMPLIANT'}
                                                        </span>
                                                        <span className="text-[8px] text-zinc-500 font-bold">Strikes: {p.strikes || 0}/5</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    {p.reviewComment ? (
                                                        <button 
                                                            onClick={() => Swal.fire({ title: 'User Feedback', text: p.reviewComment, background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' })}
                                                            className="text-[10px] text-alphabag-yellow hover:underline text-left max-w-[150px] truncate block"
                                                        >
                                                            {p.reviewComment}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-zinc-600 italic">None</span>
                                                    )}
                                                </td>
                                                <td className="p-6 text-right font-black text-alphabag-yellow">
                                                    {Number(p.points || 0).toLocaleString()} ITEMS
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => handleGrantBonus(p.id, p.wallet)} className="px-3 py-1 bg-alphabag-yellow text-black rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                            BONUS
                                                        </button>
                                                        {p.isBanned ? (
                                                            <button onClick={() => handleUnbanUser(p.id, p.wallet)} className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-[9px] font-black uppercase">
                                                                UNBAN
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleIssueStrike(p.id, p.wallet)} className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[9px] font-black uppercase">
                                                                STRIKE
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section C: Strike Audit Logs */}
                        <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="font-black text-white uppercase tracking-widest text-xs">Strike Audit Log</h3>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-[9px] uppercase text-alphabag-muted font-black tracking-widest">
                                        <tr>
                                            <th className="p-6">Node Target</th>
                                            <th className="p-6">Issued By</th>
                                            <th className="p-6">Violation Reason</th>
                                            <th className="p-6 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs">
                                        {strikeLogs.map((log, i) => (
                                            <tr key={i} className="hover:bg-white/[0.01]">
                                                <td className="p-6 font-mono text-zinc-400 text-[10px]">{log.userId}</td>
                                                <td className="p-6 font-mono text-zinc-400 text-[10px]">{log.adminId}</td>
                                                <td className="p-6 text-zinc-300 font-medium">{log.reason}</td>
                                                <td className="p-6 text-right text-zinc-500 font-semibold">{new Date(log.timestamp).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {strikeLogs.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-alphabag-muted italic">No violations logged.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Render: Founder Elite */}
                {viewMode === 'founders' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Founder Elite Roster</h3>
                            <button 
                                onClick={handleExportFoundersCSV}
                                className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-1.5"
                            >
                                <Download size={12} /> Export Founders Data
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {participants.filter(p => p.isFounderRequest || p.projectName).map((p, i) => (
                                <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col">
                                    <div className="absolute top-0 right-0 p-4">
                                        <button 
                                            onClick={() => handleApproveFounder(p.id, p.isFounderAirdrop)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${p.isFounderAirdrop ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-600 text-white'}`}
                                        >
                                            {p.isFounderAirdrop ? 'REVOKE STATUS' : 'APPROVE FOUNDER'}
                                        </button>
                                    </div>
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 overflow-hidden shrink-0">
                                            {p.projectLogo ? <img src={p.projectLogo} alt="Logo" className="w-full h-full object-cover" /> : <Shield className="text-blue-400" />}
                                        </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight">{p.projectName || 'Unnamed Project'}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10">{p.projectTicker || 'TBA'}</span>
                                            <span className="text-[10px] text-zinc-500 font-medium">via {p.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 flex-1 flex flex-col justify-end">
                                    {p.projectBanner && (
                                        <div className="rounded-xl overflow-hidden border border-white/5 h-32 w-full">
                                            <img src={p.projectBanner} alt="Banner" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                        <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Project Vision</div>
                                        <p className="text-xs text-zinc-300 leading-relaxed italic line-clamp-3">"{p.projectManifesto || 'No manifesto provided.'}"</p>
                                    </div>
                                    <div className="flex gap-4">
                                        {p.projectWebsite && (
                                            <a href={p.projectWebsite} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                                                <Globe size={14} /> Website
                                            </a>
                                        )}
                                        {p.projectSocial && (
                                            <a href={p.projectSocial} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                                                <ExternalLink size={14} /> View Socials
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                            {participants.filter(p => p.isFounderRequest || p.projectName).length === 0 && (
                                <div className="md:col-span-2 text-center p-20 text-alphabag-muted italic bg-black/20 rounded-2xl border border-white/5 border-dashed">
                                    No founder applications submitted.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab Render: Payout Queue */}
                {viewMode === 'payouts' && (
                    <div className="glass-panel p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-6 animate-in fade-in duration-500">
                        
                        {/* Bulk Action Panel */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="selectAllPending" 
                                    checked={requests.length > 0 && requests.filter(r => r.status === 'PENDING').every(r => selectedRequestIds.includes(r.id))}
                                    onChange={handleToggleSelectAllPending}
                                    className="w-5 h-5 rounded border-white/10 bg-black text-alphabag-yellow"
                                />
                                <label htmlFor="selectAllPending" className="text-xs font-black text-white uppercase tracking-wider cursor-pointer">
                                    Select All Pending ({requests.filter(r => r.status === 'PENDING').length})
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={handleApproveAll}
                                    disabled={isLoading}
                                    className="px-5 py-2.5 bg-alphabag-yellow text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    Approve All Pending
                                </button>
                                <button 
                                    onClick={handleExportApprovedCSV}
                                    className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-1.5"
                                >
                                    <Download size={12} /> Export Approved Payouts (CSV)
                                </button>
                                <button 
                                    onClick={handleMarkAllDone}
                                    disabled={isLoading}
                                    className="px-5 py-2.5 bg-green-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    Mark All Approved SENT
                                </button>
                                <button 
                                    onClick={handleRejectSelected}
                                    disabled={selectedRequestIds.length === 0 || isLoading}
                                    className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${
                                        selectedRequestIds.length > 0 
                                            ? 'bg-red-600 text-white hover:bg-red-500' 
                                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    }`}
                                >
                                    Reject Selected ({selectedRequestIds.length})
                                </button>
                            </div>
                        </div>

                        {/* Request Cards List */}
                        <div className="grid grid-cols-1 gap-3">
                            {requests.map(r => {
                                const status = r.status as string;
                                const isPending = status === 'PENDING';
                                const isApproved = status === 'APPROVED';
                                const isSent = status === 'SENT';
                                const isRejected = status === 'REJECTED';

                                return (
                                    <div key={r.id} className={`p-5 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                        isSent ? 'bg-green-500/[0.03] border-green-500/20' :
                                        isApproved ? 'bg-blue-500/[0.03] border-blue-500/20' :
                                        isPending ? 'bg-white/[0.02] border-white/5 hover:border-alphabag-yellow/20' :
                                        'bg-red-500/[0.03] border-red-500/10 opacity-60'
                                    }`}>
                                        <div className="flex items-start gap-4 flex-1">
                                            {isPending && (
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedRequestIds.includes(r.id)}
                                                    onChange={() => handleToggleSelectRequest(r.id)}
                                                    className="w-5 h-5 rounded border-white/10 bg-black text-alphabag-yellow mt-1.5"
                                                />
                                            )}
                                            <div className="w-9 h-9 bg-alphabag-yellow/10 rounded-xl flex items-center justify-center text-alphabag-yellow shrink-0">
                                                <DollarSign size={16} />
                                            </div>
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-mono text-white text-xs font-bold truncate">
                                                        {r.walletAddress}
                                                    </p>
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${
                                                        isSent ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                                                        isApproved ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                                        isPending ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                                                        'text-red-400 bg-red-500/10 border-red-500/20'
                                                    }`}>{status}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-[10px]">
                                                    <span className="text-alphabag-muted">
                                                        <span className="font-bold text-white">{Number(r.expectedTokens).toLocaleString()}</span> ITEMS earned
                                                    </span>
                                                    <span className="text-alphabag-yellow font-bold">
                                                        → {(Number(r.expectedTokens) / parseFloat(itemsToBagRate)).toFixed(2)} $BAG payout
                                                    </span>
                                                </div>
                                                <div className="text-[9px] font-mono text-alphabag-muted">
                                                    Requested: {new Date(r.createdAt).toLocaleString()}
                                                    {r.sentAt && <span className="ml-3 text-green-400">• Sent: {new Date(r.sentAt).toLocaleString()}</span>}
                                                    {r.txReference && <span className="ml-3 text-alphabag-subtext">TX: {r.txReference}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {isPending && (
                                                <>
                                                    <button onClick={() => handleApprovePayout(r.id, 'REJECTED')} className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all border border-red-500/20">
                                                        <XCircle size={12} /> Reject
                                                    </button>
                                                    <button onClick={() => handleApprovePayout(r.id, 'APPROVED')} className="flex items-center gap-1.5 px-5 py-2 bg-alphabag-yellow text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                                        <CheckCircle2 size={12} /> Approve
                                                    </button>
                                                </>
                                            )}
                                            {isApproved && (
                                                <button onClick={() => handleMarkDone(r.id)} className="flex items-center gap-1.5 px-5 py-2 bg-green-500/10 text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all border border-green-500/20">
                                                    <CheckCircle2 size={12} /> Mark DONE
                                                </button>
                                            )}
                                            {isSent && (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                                                    <CheckCircle2 size={14} className="text-green-400" />
                                                    <span className="text-[10px] font-black text-green-400 uppercase">Delivered</span>
                                                </div>
                                            )}
                                            {isRejected && (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
                                                    <XCircle size={14} className="text-red-400" />
                                                    <span className="text-[10px] font-black text-red-400 uppercase">Rejected</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {requests.length === 0 && (
                                <div className="py-20 text-center opacity-30 select-none">
                                    <AlertCircle size={48} className="mx-auto mb-4 text-alphabag-muted" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-alphabag-muted">Withdrawal queue is currently empty.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAirdrop;
