import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { 
    Zap, AlertTriangle, Plus, Trash2, Shield, Users, 
    Download, Target, ExternalLink, Globe, CheckCircle2,
    PauseCircle, PlayCircle, RefreshCw, DatabaseBackup
} from 'lucide-react';
import Swal from 'sweetalert2';

export const AdminAirdrop: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'missions' | 'intelligence' | 'founders' | 'protocol'>('missions');
    const [isLoading, setIsLoading] = useState(false);
    const [missionPaused, setMissionPaused] = useState(false);
    const [tgeDate, setTgeDate] = useState('');
    const [isSettingTge, setIsSettingTge] = useState(false);

    // New Mission Form State
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({ 
        title: '', 
        description: '', 
        rewardTokens: 50, 
        actionUrl: '', 
        type: 'once' 
    });

    useEffect(() => {
        if (viewMode === 'missions') fetchTasks();
        else fetchParticipants();
        fetchMissionStatus();
    }, [viewMode]);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/api/airdrop/admin/tasks');
            // Support both direct array and paginated object responses
            const taskData = Array.isArray(res.data) ? res.data : (res.data.missions || []);
            setTasks(taskData);
        } catch (error) {
            console.error("Failed to fetch missions", error);
        }
    };

    const fetchParticipants = async () => {
        try {
            const res = await api.get('/api/airdrop/admin/wallets');
            // Backend returns users with $BAG and referral data
            setParticipants(res.data || []);
        } catch (error) {
            console.error("Failed to fetch network intelligence", error);
            setParticipants([]);
        }
    };

    const fetchMissionStatus = async () => {
        try {
            const res = await api.get('/api/airdrop/admin/mission-status');
            setMissionPaused(!!res.data.isPaused);
            if (res.data.tgeDate) {
                // Convert ISO string to datetime-local format
                const dt = new Date(res.data.tgeDate);
                const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
                    .toISOString().slice(0, 16);
                setTgeDate(local);
            }
        } catch (error) {
            console.error("Failed to fetch mission status", error);
        }
    };

    const handleSetTgeDate = async () => {
        if (!tgeDate) return;
        setIsSettingTge(true);
        try {
            const isoDate = new Date(tgeDate).toISOString();
            await api.post('/api/airdrop/admin/tge-date', { tgeDate: isoDate });
            Swal.fire({
                title: '🚀 TGE DATE SET',
                text: `Countdown is now live. Target: ${new Date(isoDate).toUTCString()}`,
                icon: 'success',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#fcd535'
            });
        } catch (error) {
            Swal.fire('Error', 'Failed to set TGE date', 'error');
        } finally {
            setIsSettingTge(false);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const taskToDeploy = {
                ...newTask,
                status: 'ACTIVE'
            };
            await api.post('/api/airdrop/admin/tasks', taskToDeploy);
            Swal.fire({
                title: 'MISSION DEPLOYED',
                icon: 'success',
                background: '#0a0a0a',
                color: '#fff'
            });
            setShowTaskForm(false);
            setNewTask({ title: '', description: '', rewardTokens: 50, actionUrl: '', type: 'once' });
            fetchTasks();
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
                fetchTasks();
            } catch (error) {
                Swal.fire('Error', 'Termination failed', 'error');
            }
        }
    };

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
            fetchParticipants();
        } catch (error) {
            Swal.fire('Error', 'Action failed', 'error');
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
                fetchTasks();
                fetchParticipants();
                setMissionPaused(false);
            } catch (error) {
                Swal.fire('Error', 'Wipe failed', 'error');
            }
        }
    };

    const triggerSnapshot = async () => {
        const { value: rewardAmount } = await Swal.fire({
            title: 'ELITE SNAPSHOT',
            text: "Set the ITEMS bonus amount to reward the Top 100 recruiters.",
            input: 'number',
            inputPlaceholder: 'e.g. 2000',
            showCancelButton: true,
            confirmButtonColor: '#fcd535',
            confirmButtonText: 'EXECUTE SNAPSHOT',
            background: '#0a0a0a',
            color: '#fff'
        });

        if (rewardAmount) {
            try {
                const res = await api.post('/api/airdrop/admin/snapshot-referrals', { reward: parseInt(rewardAmount) });
                Swal.fire('BONUS SYNCED', `${res.data.count} elite members rewarded with ${rewardAmount} ITEMS.`, 'success');
                fetchParticipants();
            } catch (error) {
                Swal.fire('Error', 'Snapshot failure', 'error');
            }
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

        const isDeduction = result === false; // clickDeny returns false
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
                fetchParticipants();
            } catch (error) {
                Swal.fire('Error', 'Action failed', 'error');
            }
        }
    };


    const exportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Wallet,ITEMS,Referrals,Tier\n";
        participants.forEach(p => {
            csvContent += `${p.email || p.id},${p.points},${p.referralCount},${p.accountType}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `alphabag_snapshot_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
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
                fetchTasks();
            } catch (error) {
                Swal.fire('Error', 'Wipe failed', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-alphabag-yellow/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Target className="text-alphabag-yellow" /> Network Hub
                    </h2>
                    <div className="flex gap-4">
                        <Button 
                            className="bg-alphabag-yellow !text-black font-black tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-alphabag-yellow/5"
                        >
                            AWARD TOP 100 REFERRALS
                        </Button>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={exportCSV}
                            className="bg-alphabag-yellow !text-black font-black tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-alphabag-yellow/5"
                        >
                            <Download size={14} className="mr-2" /> EXPORT ITEMS DATA
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-xl border border-white/5 w-max">
                    <button
                        onClick={() => setViewMode('missions')}
                        className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'missions' ? 'bg-white/10 text-white border border-white/10' : 'text-alphabag-muted hover:text-white'}`}
                    >
                        Mission Matrix
                    </button>
                    <button
                        onClick={() => setViewMode('intelligence')}
                        className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'intelligence' ? 'bg-white/10 text-white border border-white/10' : 'text-alphabag-muted hover:text-white'}`}
                    >
                        Network Intelligence
                    </button>
                    <button
                        onClick={() => setViewMode('founders')}
                        className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'founders' ? 'bg-white/10 text-white border border-white/10' : 'text-alphabag-muted hover:text-white'}`}
                    >
                        Founder Elite
                    </button>
                    <button
                        onClick={() => setViewMode('protocol')}
                        className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'protocol' ? 'bg-white/10 text-white border border-white/10' : 'text-alphabag-muted hover:text-white'}`}
                    >
                        Protocol Control
                    </button>
                </div>

                {viewMode === 'missions' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                            <div>
                                <h3 className="font-black text-white uppercase tracking-widest">Task Deployment</h3>
                                <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest mt-1">Active Missions: {tasks.length}</p>
                            </div>
                            <Button onClick={() => setShowTaskForm(!showTaskForm)} className="bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px]">
                                {showTaskForm ? 'ABORT' : <><Plus size={16} className="mr-2" /> CREATE MISSION</>}
                            </Button>
                        </div>

                        {showTaskForm && (
                            <form onSubmit={handleCreateTask} className="bg-black/40 border border-alphabag-yellow/50 rounded-2xl p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Mission Title</label>
                                        <input required type="text" placeholder="e.g. Daily Check-in" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">ITEMS Reward</label>
                                        <input required type="number" min="1" value={newTask.rewardTokens} onChange={e => setNewTask({ ...newTask, rewardTokens: parseInt(e.target.value) })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Mission Description</label>
                                    <textarea required value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white h-24 resize-none" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Action URL (Optional)</label>
                                        <input type="url" placeholder="https://..." value={newTask.actionUrl} onChange={e => setNewTask({ ...newTask, actionUrl: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-4 text-sm text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Mission Frequency</label>
                                        <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-sm text-white outline-none">
                                            <option value="once">Genesis (Once)</option>
                                            <option value="daily">Standard (Daily)</option>
                                            <option value="weekly">Elite (Weekly)</option>
                                            <option value="unlimited">Viral (Unlimited)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-center pt-4">
                                <Button type="submit" isLoading={isLoading} className="bg-alphabag-yellow !text-black uppercase font-black px-12 h-14 tracking-[0.3em] shadow-[0_0_40px_rgba(252,213,53,0.3)] hover:scale-105 transition-all text-[12px] rounded-2xl">
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
                                            <Zap size={24} className={t.type === 'daily' ? 'text-blue-400' : t.type === 'weekly' ? 'text-purple-400' : 'text-alphabag-yellow'} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-white uppercase tracking-wider">{t.title}</h4>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${t.type === 'daily' ? 'bg-blue-500/10 text-blue-400' : t.type === 'weekly' ? 'bg-purple-500/10 text-purple-400' : 'bg-alphabag-yellow/10 text-alphabag-yellow'}`}>{t.type}</span>
                                            </div>
                                            <p className="text-xs text-alphabag-muted mt-1">{t.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <div className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest">Reward</div>
                                            <div className="text-xl font-black text-white">{t.rewardTokens} <span className="text-[10px] text-alphabag-yellow tracking-tighter">ITEMS</span></div>
                                        </div>
                                        <button onClick={() => handleDeleteTask(t.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && <div className="text-center p-12 text-alphabag-muted italic bg-black/20 rounded-2xl border border-white/5 border-dashed">No missions active. Expand the hub core above.</div>}
                        </div>
                    </div>
                ) : viewMode === 'intelligence' ? (
                    <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="font-black text-white uppercase tracking-widest">User Intelligence Log</h3>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[9px] uppercase text-alphabag-muted font-black tracking-widest">
                                    <tr>
                                        <th className="p-6">Member Identity (Alias)</th>
                                        <th className="p-6">Feedback / Review</th>
                                        <th className="p-6">Recruits</th>
                                        <th className="p-6 text-center">Status</th>
                                        <th className="p-6 text-right">Power (ITEMS)</th>
                                        <th className="p-6 text-right">Admin Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs">
                                    {participants.map((p, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono text-zinc-400 text-[9px] truncate max-w-[150px]">{p.wallet || 'No Wallet'}</span>
                                                    {p.xLink && (
                                                        <a href={p.xLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-[9px] flex items-center gap-1">
                                                            Proof Link <ExternalLink size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="max-w-[200px] text-[10px] text-zinc-400 italic line-clamp-2" title={p.reviewComment}>
                                                    {p.reviewComment || <span className="text-zinc-600">Pending Feedback...</span>}
                                                </div>
                                            </td>
                                            <td className="p-6 font-black text-white">{p.referralCount || 0}</td>
                                            <td className="p-6">
                                                <div className="flex justify-center flex-col items-center gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${p.isFounderAirdrop ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-alphabag-green/10 text-alphabag-green border-alphabag-green/20'}`}>
                                                        {p.isFounderAirdrop ? 'FOUNDER' : 'MISSION READY'}
                                                    </span>
                                                    {p.airdropSubmittedAt && <span className="text-[7px] text-zinc-500 font-bold">{new Date(p.airdropSubmittedAt).toLocaleDateString()}</span>}
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <span className="text-lg font-black text-alphabag-yellow group-hover:drop-shadow-[0_0_10px_rgba(252,213,53,0.3)] transition-all">{(p.points || 0).toLocaleString()} ITEMS</span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button 
                                                    onClick={() => handleGrantBonus(p.id, p.wallet)}
                                                    className="px-4 py-2 bg-alphabag-yellow hover:bg-alphabag-yellowHover !text-black border border-alphabag-yellow/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-alphabag-yellow/10"
                                                >
                                                    + GRANT BONUS
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {participants.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-alphabag-muted italic">No network members found. Launch the hub to recruit.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : viewMode === 'founders' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {participants.filter(p => p.isFounderRequest || p.projectName).map((p, i) => (
                            <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                                <div className="absolute top-0 right-0 p-4">
                                    <button 
                                        onClick={() => handleApproveFounder(p.id, p.isFounderAirdrop)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${p.isFounderAirdrop ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-600 text-white'}`}
                                    >
                                        {p.isFounderAirdrop ? 'REVOKE STATUS' : 'APPROVE FOUNDER'}
                                    </button>
                                </div>
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                        <Shield className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight">{p.projectName || 'Unnamed Project'}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10">{p.projectTicker || 'TBA'}</span>
                                            <span className="text-[10px] text-zinc-500 font-medium">via {p.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
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
                                No founder applications submitted. Recruitment hub is currently idle.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Protocol Control Content */}
                        {/* TGE Countdown Timer */}
                        <div className="bg-[#0a0a0a] border border-alphabag-yellow/20 rounded-2xl p-8 space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                        <span className="text-alphabag-yellow text-xl">⏳</span> TGE Countdown Timer
                                    </h3>
                                    <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest mt-1">Set the target TGE date — all users will see a live countdown.</p>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${tgeDate ? 'bg-alphabag-yellow/10 border-alphabag-yellow/30 text-alphabag-yellow' : 'bg-white/5 border-white/10 text-alphabag-muted'}`}>
                                    <span className={`w-2 h-2 rounded-full ${tgeDate ? 'bg-alphabag-yellow animate-pulse' : 'bg-alphabag-muted'}`}></span>
                                    {tgeDate ? 'TGE SET' : 'NOT SET'}
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-[0.2em] ml-1">TGE Target Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={tgeDate}
                                        onChange={e => setTgeDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:border-alphabag-yellow/50 outline-none transition-all [color-scheme:dark]"
                                    />
                                </div>
                                <Button
                                    onClick={handleSetTgeDate}
                                    disabled={isSettingTge || !tgeDate}
                                    className="bg-alphabag-yellow !text-black font-black uppercase tracking-[0.2em] text-[11px] px-10 py-5 rounded-2xl hover:shadow-[0_0_30px_rgba(252,213,53,0.4)] transition-all whitespace-nowrap"
                                >
                                    {isSettingTge ? 'SYNCING...' : '🚀 SET TGE DATE'}
                                </Button>
                            </div>
                        </div>

                        {/* Campaign Activator */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                        <Zap className="text-alphabag-yellow" size={20} /> Campaign Activator
                                    </h3>
                                    <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest mt-1">Activate the mission lifecycle and define reward parameters.</p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-alphabag-green/20 bg-alphabag-green/10 text-alphabag-green text-[10px] font-black uppercase tracking-widest">
                                    <span className="w-2 h-2 rounded-full bg-alphabag-green animate-pulse"></span>
                                    TESTNET PHASE 1
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Token Ticker</label>
                                    <input type="text" defaultValue="BAG" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Genesis Reward (ITEMS)</label>
                                    <input type="number" defaultValue="5000" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-alphabag-muted uppercase tracking-widest pl-1">Phase Duration (Days)</label>
                                    <input type="number" defaultValue="10" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                </div>
                            </div>

                            <div className="flex justify-center pt-4">
                                <Button className="bg-alphabag-green !text-black font-black uppercase tracking-[0.3em] text-[11px] px-12 h-14 rounded-2xl shadow-[0_0_30px_rgba(0,255,163,0.2)]">
                                    START CAMPAIGN
                                </Button>
                            </div>
                        </div>

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
                                    className={`flex items-center justify-center gap-3 p-5 rounded-2xl border font-black text-[11px] uppercase tracking-[0.2em] transition-all flex-1 ${missionPaused ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'}`}
                                >
                                    {missionPaused ? <><PlayCircle size={18} /> RESUME MISSION</> : <><PauseCircle size={18} /> PAUSE MISSION</>}
                                </button>
                                <button
                                    onClick={handleExportData}
                                    className="flex items-center justify-center gap-3 p-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-black text-[11px] uppercase tracking-[0.2em] transition-all flex-1"
                                >
                                    <DatabaseBackup size={18} /> EXPORT DATA
                                </button>
                                <button
                                    onClick={handleFullWipe}
                                    className="flex items-center justify-center gap-3 p-5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-black text-[11px] uppercase tracking-[0.2em] transition-all flex-1"
                                >
                                    <Trash2 size={18} /> FULL WIPE
                                </button>
                            </div>
                            <p className="text-[9px] text-alphabag-muted text-center font-bold uppercase tracking-widest">Always export member data before executing a full wipe.</p>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <AlertTriangle size={32} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Hub Reset</h3>
                                    <p className="text-xs text-alphabag-muted mt-1 uppercase tracking-widest font-bold">This eliminates ALL missions, balances, and network data.</p>
                                </div>
                            </div>
                            <Button onClick={handleReset} variant="danger" className="bg-red-600 hover:bg-red-500 text-white font-black uppercase px-8 h-12 text-[10px]">EXECUTE RESET</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAirdrop;
