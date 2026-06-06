import { store } from '../services/storeService.js';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const t2eEmitter = new EventEmitter();

// ─── TREASURY / CONFIG ────────────────────────────────────────────────────────

export const getTreasuryStatus = async (req, res) => {
    try {
        let config = await store.findOne('t2e_config', { id: 'global_config' });
        if (!config) {
            config = { id: 'global_config', minimumClaimBalance: 500 };
            await store.create('t2e_config', config);
        }
        
        // Intelligence Aggregation (Simulated for JSON store)
        const allClaims = await store.read('t2e_claims');
        const allUsers = await store.read('users');
        const requests = await store.read('t2e_payout_requests');

        const totalEarned = allClaims.reduce((sum, c) => sum + (Number(c.rewardTokens) || 0), 0);
        const totalPending = allUsers.reduce((sum, u) => sum + (Number(u.t2eBagBalance) || 0), 0);
        const totalDisbursed = requests
            .filter(r => r.status === 'APPROVED')
            .reduce((sum, r) => sum + (Number(r.expectedTokens) || 0), 0);

        res.json({
            ...config,
            intelligence: {
                totalEarned,
                totalPending,
                totalDisbursed
            }
        });
    } catch (error) {
        console.error('[T2E] Treasury Fetch Failed:', error);
        res.status(500).json({ error: 'Failed to fetch treasury status' });
    }
};

// ─── USER EARN PROFILE ────────────────────────────────────────────────────────

export const getUserEarnProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await store.read('users');
        const user = users.find(u => u.id && typeof u.id === 'string' && userId && typeof userId === 'string' && u.id.toLowerCase() === userId.toLowerCase());
        const config = await store.findOne('t2e_config', { id: 'global_config' });
        const claims = await store.read('t2e_claims');

        if (!user) return res.status(404).json({ error: 'User not found in T2E Registry' });

        const userClaims = claims.filter(c => c.userId === userId).map(c => c.missionId);

        res.json({
            id: user.id,
            items: user.items || 0,
            lifetimeEarned: user.lifetimeEarned || 0,
            bagTokens: user.bagTokens || 0,
            preferredWallet: user.preferredWallet || user.verifiedWallet || '',
            syndicateRank: user.syndicateRank || 'RECRUIT',
            referralCount: user.referralCount || 0,
            claimedMissionIds: userClaims,
            minimumClaimBalance: config?.minimumClaimBalance ?? 500
        });
    } catch (error) {
        console.error('[T2E] Profile Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch user earn profile' });
    }
};

// ─── MISSIONS (PAGINATED) ─────────────────────────────────────────────────────

export const getMissions = async (req, res) => {
    try {
        const { type, status, page = 1, limit = 20 } = req.query;
        let missions = await store.read('t2e_missions');

        // Seed tasks if empty
        if (missions.length === 0) {
            try {
                const tasksFile = path.join(__dirname, '../../data/t2e_tasks.json');
                if (fs.existsSync(tasksFile)) {
                    const defaultTasks = JSON.parse(fs.readFileSync(tasksFile, 'utf-8'));
                    missions = defaultTasks.map(t => ({
                        ...t,
                        rewardTokens: t.rewardTokens || t.rewardXP, // Normalizing field
                        status: t.status || 'ACTIVE',
                        createdAt: new Date().toISOString()
                    }));
                    await store.write('t2e_missions', missions);
                }
            } catch (seedErr) {
                console.error('[T2E] Seeding tasks failed:', seedErr);
            }
        }

        // Deactivation Check
        const config = await store.findOne('t2e_config', { id: 'global_config' });
        if (config?.isDeactivated) {
            return res.json({ 
                missions: [], 
                total: 0, 
                page: 1, 
                limit: parseInt(limit), 
                totalPages: 0,
                isDeactivated: true,
                message: 'T2E Module is currently suspended for the Airdrop phase.'
            });
        }

        // Apply filters
        let filtered = missions.filter(m => {
            const typeMatch = !type || type === 'ALL' || m.type === type;
            const statusMatch = m.status === (status || 'ACTIVE');
            return typeMatch && statusMatch;
        });

        const total = filtered.length;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginated = filtered.slice(skip, skip + parseInt(limit));

        res.json({ 
            missions: paginated, 
            total, 
            page: parseInt(page), 
            limit: parseInt(limit), 
            totalPages: Math.ceil(total / parseInt(limit)) 
        });
    } catch (error) {
        console.error('[T2E] Fetch Missions Error:', error.stack || error);
        res.status(500).json({ error: 'Failed to fetch missions', details: error.message });
    }
};

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────

export const getActivityFeed = async (req, res) => {
    try {
        const activities = await store.read('t2e_activity');
        // Sort descending by date and take 20
        const sorted = activities.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
        res.json(sorted);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
};

// SSE Stream for real-time activity
export const streamActivity = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    t2eEmitter.on('activityUpdate', sendEvent);
    req.on('close', () => t2eEmitter.off('activityUpdate', sendEvent));
};

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────

export const getLeaderboard = async (req, res) => {
    try {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const claims = await store.read('t2e_claims');
        const users = await store.read('users');

        // Filter and Group by userId
        const stats = claims
            .filter(c => new Date(c.createdAt) >= last24h)
            .reduce((acc, c) => {
                acc[c.userId] = (acc[c.userId] || 0) + (Number(c.rewardTokens) || 0);
                return acc;
            }, {});

        const sorted = Object.entries(stats)
            .map(([userId, points]) => ({ userId, points }))
            .sort((a,b) => b.points - a.points)
            .slice(0, 10);

        const formatted = sorted.map(s => {
            const user = users.find(u => u.id && typeof u.id === 'string' && s.userId && typeof s.userId === 'string' && u.id.toLowerCase() === s.userId.toLowerCase());
            const address = user?.verifiedWallet || user?.id || 'Unknown Node';
            return {
                handle: address.startsWith('0x') ? `${address.slice(0, 6)}...${address.slice(-4)}` : address,
                points: s.points
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error('[T2E] Leaderboard Error:', error);
        res.status(500).json({ error: 'Leaderboard fetch failed' });
    }
};

// ─── CLAIM MISSION ────────────────────────────────────────────────────────────

export const claimMission = async (req, res) => {
    try {
        const userId = req.user.id;
        let { missionId, proofLink, feedback, taskId, taskLink } = req.body;
        
        const userObj = await store.findOne('users', { id: userId });
        if (userObj && userObj.isBanned) {
            return res.status(403).json({ error: 'Your account has been permanently suspended from the T2E program due to protocol violations.' });
        }
        
        // Aliases for backward compatibility with Airdrop.tsx
        missionId = missionId || taskId;
        proofLink = proofLink || taskLink;

        const [mission, config] = await Promise.all([
            store.findOne('t2e_missions', { id: missionId }),
            store.findOne('t2e_config', { id: 'global_config' })
        ]);

        if (config?.isDeactivated) {
            return res.status(403).json({ error: 'T2E Module is currently suspended for the Airdrop phase.' });
        }

        if (!mission) return res.status(404).json({ error: 'Mission not found' });
        if (mission.status !== 'ACTIVE') return res.status(400).json({ error: 'Mission is not active' });

        // Mandatory Feedback for Final Review or specific missions
        if ((mission.id === 't2e_final_feedback' || mission.type === 'FINAL_REVIEW') && !feedback) {
            return res.status(400).json({ error: 'Final feedback is compulsory for this mission.' });
        }

        const claims = await store.read('t2e_claims');
        const userClaims = claims.filter(c => c.userId.toLowerCase() === userId.toLowerCase() && c.missionId === missionId);

        // Check frequency limits
        const now = new Date();
        if (mission.frequency === 'ONCE' && userClaims.length > 0) {
            return res.status(400).json({ error: 'Mission already claimed' });
        }

        if (mission.frequency === 'DAILY' && userClaims.length > 0) {
            const lastClaim = new Date(userClaims.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt);
            if (now.getTime() - lastClaim.getTime() < 24 * 60 * 60 * 1000) {
                return res.status(400).json({ error: 'Daily mission already completed. Come back in 24 hours.' });
            }
        }

        if (mission.frequency === 'WEEKLY' && userClaims.length > 0) {
            const lastClaim = new Date(userClaims.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt);
            if (now.getTime() - lastClaim.getTime() < 7 * 24 * 60 * 60 * 1000) {
                return res.status(400).json({ error: 'Weekly mission already completed. Come back in 7 days.' });
            }
        }

        // Processing Claim
        const newClaim = {
            id: Math.random().toString(36).substr(2, 9),
            userId,
            missionId,
            proofLink,
            feedback,
            rewardTokens: mission.rewardTokens,
            rewardXP: mission.rewardXP || mission.rewardTokens,
            createdAt: now.toISOString()
        };
        await store.create('t2e_claims', newClaim);

        // Update User Balance (ITEMS) & Legacy Fields for Frontend
        const fullNow = now.toISOString();
        await store.update('users', u => u.id && typeof u.id === 'string' && userId && typeof userId === 'string' && u.id.toLowerCase() === userId.toLowerCase(), (u) => {
            const updates = {
                items: (Number(u.items) || 0) + Number(mission.rewardTokens),
                lifetimeEarned: (Number(u.lifetimeEarned) || 0) + Number(mission.rewardTokens)
            };

            // Strict binding for the Daily Terminal Reward timer
            if (mission.id === 't2e_daily_claim') {
                updates.lastDailyTaskAt = fullNow;
            }
            if (mission.frequency === 'WEEKLY') {
                updates.lastWeeklyTaskAt = fullNow;
                const weeklyTasks = u.weeklyTasks || {};
                weeklyTasks[mission.id] = { date: fullNow };
                updates.weeklyTasks = weeklyTasks;
            }
            if (mission.frequency === 'ONCE') {
                updates.completedTasks = [...(u.completedTasks || []), mission.id];
            }

            return updates;
        });

        const users = await store.read('users');
        const user = users.find(u => u.id && typeof u.id === 'string' && userId && typeof userId === 'string' && u.id.toLowerCase() === userId.toLowerCase());
        const activity = {
            id: Math.random().toString(36).substr(2, 9),
            userHandle: user?.verifiedWallet?.slice(0, 8) || userId.slice(0, 8),
            taskType: mission.type,
            pointsEarned: Number(mission.rewardTokens),
            createdAt: new Date().toISOString()
        };
        await store.create('t2e_activity', activity);

        t2eEmitter.emit('activityUpdate', { type: 'MISSION_CLAIM', data: activity });
        res.json({ 
            success: true, 
            rewardTokens: mission.rewardTokens,
            rewardXP: mission.rewardXP || mission.rewardTokens
        });
    } catch (error) {
        console.error('[T2E] Claim Error:', error.stack || error);
        res.status(500).json({ error: 'Mission claim failed', details: error.message });
    }
};

export const requestBagPayout = async (req, res) => {
    try {
        const userId = req.user.id;
        const config = await store.findOne('t2e_config', { id: 'global_config' });
        const minimum = config?.minimumClaimBalance ?? 500;

        const users = await store.read('users');
        const user = users.find(u => u.id && typeof u.id === 'string' && userId && typeof userId === 'string' && u.id.toLowerCase() === userId.toLowerCase());
        if (!user) return res.status(404).json({ error: 'User not found in T2E Registry' });

        if ((Number(user.items) || 0) < minimum) {
            return res.status(400).json({ error: `Minimum payout of ${minimum.toLocaleString()} ITEMS required.` });
        }

        const amount = user.items;
        const payoutWallet = user.preferredWallet || user.verifiedWallet || userId;

        const request = {
            id: Math.random().toString(36).substr(2, 9),
            userId,
            expectedTokens: Number(amount),
            walletAddress: payoutWallet,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };
        await store.create('t2e_payout_requests', request);

        // Deduct from Balance
        await store.update('users', u => u.id === userId, () => ({ items: 0 }));

        t2eEmitter.emit('activityUpdate', {
            type: 'TOKEN_PAYOUT_REQUEST',
            data: { userHandle: payoutWallet.slice(0, 8), amount }
        });

        res.json({ success: true, message: 'Payout requested successfully.', requestId: request.id });
    } catch (error) {
        console.error('[T2E] Payout Request Error:', error);
        res.status(500).json({ error: 'Payout request failed' });
    }
};

export const updatePreferredWallet = async (req, res) => {
    try {
        const { wallet } = req.body;
        if (!wallet) return res.status(400).json({ error: 'Wallet address required' });

        await store.update('users', u => u.id === req.user.id, () => ({ preferredWallet: wallet }));

        res.json({ success: true, message: 'Preferred wallet updated' });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
};

// ─── ADMIN CONTROLS ───────────────────────────────────────────────────────────

export const adjustTreasuryBalance = async (req, res) => {
    try {
        const { minimumClaimBalance, itemsToBagRate, campaignEnded } = req.body;
        const current = await store.findOne('t2e_config', { id: 'global_config' }) || { id: 'global_config', minimumClaimBalance: 500 };
        
        const data = { ...current };
        if (minimumClaimBalance !== undefined) data.minimumClaimBalance = parseInt(minimumClaimBalance);
        if (itemsToBagRate !== undefined) data.itemsToBagRate = itemsToBagRate;
        if (campaignEnded !== undefined) data.campaignEnded = campaignEnded;

        // Store config is likely an object or an array with one item based on write call
        await store.write('t2e_config', [data]); 
        res.json({ success: true, config: data });
    } catch (error) {
        res.status(500).json({ error: 'Adjust failed' });
    }
};

export const getAdminMissions = async (req, res) => {
    try {
        const missions = await store.read('t2e_missions') || [];
        res.json(missions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin missions' });
    }
};

export const upsertMission = async (req, res) => {
    try {
        const { id, title, description, rewardTokens, type, frequency, requiresLink, actionUrl, platform, category } = req.body;
        let missions = await store.read('t2e_missions') || [];

        const mission = {
            id: id || 't2e_' + Math.random().toString(36).substr(2, 9),
            title,
            description,
            rewardTokens: parseFloat(rewardTokens),
            type: (type || frequency || 'ONCE').toUpperCase(),
            frequency: (frequency || type || 'ONCE').toUpperCase(),
            requiresLink: !!requiresLink,
            actionUrl: actionUrl || '',
            platform: platform || 'SOCIAL',
            category: category || 'GENERAL',
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
        };

        const index = missions.findIndex(m => m.id === mission.id);
        if (index !== -1) {
            missions[index] = { ...missions[index], ...mission };
        } else {
            missions.push(mission);
        }

        await store.write('t2e_missions', missions);
        res.json({ success: true, mission });
    } catch (error) {
        console.error('[T2E] Upsert Mission Error:', error);
        res.status(500).json({ error: 'Failed to deploy mission' });
    }
};

export const deleteMission = async (req, res) => {
    try {
        const { id } = req.params;
        let missions = await store.read('t2e_missions') || [];
        missions = missions.filter(m => m.id !== id);
        await store.write('t2e_missions', missions);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete mission' });
    }
};

export const getAdminTokenRequests = async (req, res) => {
    try {
        const requests = await store.read('t2e_payout_requests');
        const users = await store.read('users');
        
        const enriched = requests.map(r => ({
            ...r,
            user: users.find(u => u.id === r.userId) || { walletAddress: r.walletAddress }
        })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
};

export const approveTokenRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'APPROVED' or 'REJECTED'

        const request = await store.findOne('t2e_payout_requests', { id });
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request already processed' });

        if (status === 'REJECTED') {
            await store.update('t2e_payout_requests', r => r.id === id, () => ({ status: 'REJECTED' }));
            return res.json({ success: true, message: 'Request rejected' });
        }

        // Simulating Live Transaction for Beta
        const txHash = '0x' + Math.random().toString(16).substr(2, 64);

        await store.update('t2e_payout_requests', r => r.id === id, () => ({ 
            status: 'APPROVED',
            txHash
        }));

        res.json({ success: true, txHash });
    } catch (error) {
        console.error('[T2E] Approve Request Error:', error);
        res.status(500).json({ error: 'Approval failed' });
    }
};

// Admin marks a payout request as SENT (reward physically sent to user BSC wallet)
export const markPayoutDone = async (req, res) => {
    try {
        const { id } = req.params;
        const { txReference } = req.body; // optional manual tx reference

        const request = await store.findOne('t2e_payout_requests', { id });
        if (!request) return res.status(404).json({ error: 'Payout request not found' });
        if (request.status === 'SENT') return res.status(400).json({ error: 'Already marked as SENT' });

        await store.update('t2e_payout_requests', r => r.id === id, () => ({
            status: 'SENT',
            sentAt: new Date().toISOString(),
            txReference: txReference || null,
            processedBy: req.user?.id || 'admin'
        }));

        res.json({ success: true, message: 'Payout marked as SENT. User will see updated status on their dashboard.' });
    } catch (error) {
        console.error('[T2E] Mark Done Error:', error);
        res.status(500).json({ error: 'Failed to mark payout as done' });
    }
};

export const getAdminActivity = async (req, res) => {
    try {
        const claims = await store.read('t2e_claims');
        const users = await store.read('users');
        const missions = await store.read('t2e_missions');

        const enriched = claims.map(c => ({
            ...c,
            user: users.find(u => u.id === c.userId) || { walletAddress: c.userId },
            mission: missions.find(m => m.id === c.missionId) || { title: 'Unknown', type: 'SYSTEM' },
            pointsEarned: Number(c.rewardTokens)
        })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100);

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
};

export const approveAllTokenRequests = async (req, res) => {
    try {
        const requests = await store.read('t2e_payout_requests') || [];
        let updatedCount = 0;

        const updatedRequests = requests.map(r => {
            if (r.status === 'PENDING') {
                updatedCount++;
                return {
                    ...r,
                    status: 'APPROVED',
                    txHash: '0x' + Math.random().toString(16).substr(2, 64)
                };
            }
            return r;
        });

        if (updatedCount > 0) {
            await store.write('t2e_payout_requests', updatedRequests);
        }

        res.json({ success: true, message: `Approved ${updatedCount} pending requests.` });
    } catch (error) {
        console.error('[T2E] Approve All Error:', error);
        res.status(500).json({ error: 'Failed to approve all requests' });
    }
};

export const markAllPayoutsDone = async (req, res) => {
    try {
        const { txReference } = req.body;
        const requests = await store.read('t2e_payout_requests') || [];
        let updatedCount = 0;

        const updatedRequests = requests.map(r => {
            if (r.status === 'APPROVED') {
                updatedCount++;
                return {
                    ...r,
                    status: 'SENT',
                    sentAt: new Date().toISOString(),
                    txReference: txReference || 'Bulk Manual Airdrop',
                    processedBy: req.user?.id || 'admin'
                };
            }
            return r;
        });

        if (updatedCount > 0) {
            await store.write('t2e_payout_requests', updatedRequests);
        }

        res.json({ success: true, message: `Marked ${updatedCount} approved requests as SENT.` });
    } catch (error) {
        console.error('[T2E] Mark All Done Error:', error);
        res.status(500).json({ error: 'Failed to mark requests as SENT' });
    }
};

export const rejectBulkTokenRequests = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'Request body must contain an array of ids' });
        }

        const requests = await store.read('t2e_payout_requests') || [];
        let updatedCount = 0;

        const updatedRequests = requests.map(r => {
            if (ids.includes(r.id) && r.status === 'PENDING') {
                updatedCount++;
                return {
                    ...r,
                    status: 'REJECTED'
                };
            }
            return r;
        });

        if (updatedCount > 0) {
            await store.write('t2e_payout_requests', updatedRequests);
        }

        res.json({ success: true, message: `Rejected ${updatedCount} selected requests.` });
    } catch (error) {
        console.error('[T2E] Reject Bulk Error:', error);
        res.status(500).json({ error: 'Failed to reject selected requests' });
    }
};

export const exportApprovedPayouts = async (req, res) => {
    try {
        const requests = await store.read('t2e_payout_requests') || [];
        const approved = requests.filter(r => r.status === 'APPROVED');
        
        let config = await store.findOne('t2e_config', { id: 'global_config' });
        // Handle config stored in array format by adjustTreasuryBalance
        if (Array.isArray(config)) config = config[0];
        const rate = config?.itemsToBagRate || 1;

        let csvContent = "Wallet,ITEMS_Earned,BAG_Tokens\n";
        approved.forEach(r => {
            const bagTokens = Number(r.expectedTokens) / rate;
            csvContent += `${r.walletAddress},${r.expectedTokens},${bagTokens.toFixed(2)}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=approved_payouts_${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csvContent);
    } catch (error) {
        console.error('[T2E] Export Approved Error:', error);
        res.status(500).json({ error: 'Failed to export approved payouts' });
    }
};
