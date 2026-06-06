import { store } from '../services/storeService.js';

const recordActivity = async (username, action, points) => {
    try {
        const activity = await store.read('activity') || [];
        activity.unshift({
            id: Math.random().toString(36).substr(2, 9),
            username: username || 'Member',
            action,
            points,
            timestamp: new Date().toISOString()
        });
        await store.write('activity', activity.slice(0, 50));
    } catch (e) {}
};

// --- USER ROUTES ---

// Get Airdrop Status (For User)
export const getAirdropStatus = async (req, res) => {
    try {
        let campaigns = await store.read('airdrop');
        if (!Array.isArray(campaigns)) campaigns = []; // Handle migration from object to array

        const user = req.user && req.user.id ? await store.findOne('users', { id: req.user.id }) : null;
        const now = new Date();

        // Find the most recent campaign
        const sorted = [...campaigns].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        let currentCampaign = sorted.length > 0 ? sorted[0] : null;

        let campaignEnded = false;

        if (currentCampaign) {
            const start = new Date(currentCampaign.startDate || now);
            const end = new Date(start.getTime() + (currentCampaign.durationDays * 24 * 60 * 60 * 1000));
            const nextCycleDate = new Date(end.getTime() + (72 * 60 * 60 * 1000));

            if (currentCampaign.status === 'ACTIVE') {
                if (now < end) {
                    currentCampaign = { ...currentCampaign, status: 'ACTIVE', endDate: end.toISOString() };
                } else if (now >= end && now < nextCycleDate) {
                    currentCampaign = { ...currentCampaign, status: 'WAITING', nextCycleDate: nextCycleDate.toISOString() };
                    campaignEnded = true;
                } else {
                    currentCampaign = { ...currentCampaign, status: 'ENDED', endDate: end.toISOString() };
                    campaignEnded = true;
                }
            } else if (currentCampaign.status === 'ENDED') {
                campaignEnded = true;
                currentCampaign = { ...currentCampaign, endDate: end.toISOString() };
            } else {
                currentCampaign = { ...currentCampaign, endDate: end.toISOString() };
            }
        }

        const responseSettings = currentCampaign || {
            status: 'INACTIVE',
            tokenTicker: '🔒',
            pointsPerClaim: 0,
            durationDays: 0,
            isSubmissionActive: false
        };

        const revealData = await store.read('reveal') || { isRevealed: false };
        const missionSettings = await store.read('missionSettings') || { isPaused: false };
        const t2eConfig = await store.findOne('t2e_config', { id: 'global_config' }) || {};

        const response = {
            settings: {
                ...responseSettings,
                isPaused: !!missionSettings.isPaused,
                itemsToBagRate: t2eConfig.itemsToBagRate !== undefined ? t2eConfig.itemsToBagRate : null,
                campaignEnded  // ← server-authoritative flag
            },
            reveal: revealData,
            userStatus: null
        };

        if (user) {
            const history = user.claimsHistory || [];
            const totalPoints = user.bagTokens || history.reduce((sum, c) => sum + c.points, 0);

            let canClaim = false;
            let lastClaimTime = null;
            if (currentCampaign && currentCampaign.status === 'ACTIVE') {
                const campHistory = history.filter(h => h.campaignId === currentCampaign.id);
                const lastClaimObj = campHistory.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                if (lastClaimObj) {
                    lastClaimTime = lastClaimObj.date;
                    const lastClaim = new Date(lastClaimTime);
                    if (now.getTime() - lastClaim.getTime() >= 24 * 60 * 60 * 1000) {
                        canClaim = true;
                    }
                } else {
                    canClaim = true;
                }
            }

            // Fetch user's most recent payout request (all statuses)
            let payoutRequest = null;
            try {
                const allRequests = await store.read('t2e_payout_requests') || [];
                const userRequests = allRequests
                    .filter(r => r.userId === user.id)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                if (userRequests.length > 0) {
                    const r = userRequests[0];
                    payoutRequest = {
                        id: r.id,
                        status: r.status,
                        expectedTokens: r.expectedTokens,
                        walletAddress: r.walletAddress,
                        createdAt: r.createdAt,
                        sentAt: r.sentAt || null,
                        txReference: r.txReference || null
                    };
                }
            } catch (_) {}

            response.userStatus = {
                points: totalPoints,
                canClaim,
                lastClaimTime,
                walletSubmitted: user.submittedWallet || user.verifiedWallet || null,
                payoutRequest  // ← null if none, or { status, expectedTokens, sentAt, txReference }
            };
        }

        res.json(response);
    } catch (error) {
        console.error('[AIRDROP] getAirdropStatus Error:', error.stack || error);
        res.status(500).json({ error: 'Failed to fetch status', details: error.message });
    }
};


// Claim Points (User)
export const claimPoints = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });

        let campaigns = await store.read('airdrop');
        if (!Array.isArray(campaigns)) campaigns = [];

        const now = new Date();
        const activeCampaign = campaigns.find(c => {
            if (c.status !== 'ACTIVE') return false;
            const start = new Date(c.startDate);
            const end = new Date(start.getTime() + (c.durationDays * 24 * 60 * 60 * 1000));
            return now < end;
        });

        if (!activeCampaign) {
            return res.status(400).json({ error: 'No active airdrop campaign running' });
        }

        let updatedUser = await store.update('users', u => u.id === req.user.id, (user) => {
            const history = user.claimsHistory || [];
            const campHistory = history.filter(h => h.campaignId === activeCampaign.id);
            const lastClaimObj = campHistory.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            if (lastClaimObj) {
                const lastClaim = new Date(lastClaimObj.date);
                if (now.getTime() - lastClaim.getTime() < 24 * 60 * 60 * 1000) {
                    throw new Error('You must wait 24 hours between claims');
                }
            }

            const earnedPoints = activeCampaign.pointsPerClaim || 50;

            history.push({
                campaignId: activeCampaign.id,
                date: now.toISOString(),
                token: activeCampaign.tokenTicker,
                points: earnedPoints
            });

            return {
                claimsHistory: history,
                bagTokens: (user.bagTokens || 0) + earnedPoints
            };
        });

        if (!updatedUser) {
            // Auto-register Web3 wallet users dynamically upon their first airdrop claim
            const earnedPoints = activeCampaign.pointsPerClaim || 50;
            const newUser = {
                id: req.user.id,
                email: req.user.email || `${req.user.id.substring(0, 6)}...`,
                tier: req.user.tier || 'FREE',
                aipoints: 0,
                bagTokens: earnedPoints,
                claimsHistory: [{
                    campaignId: activeCampaign.id,
                    date: now.toISOString(),
                    token: activeCampaign.tokenTicker,
                    points: earnedPoints
                }]
            };
            updatedUser = await store.create('users', newUser);
        }

        res.json({
            success: true,
            points: updatedUser.bagTokens,
            items: updatedUser.items || 0,
            rewardTokens: activeCampaign.pointsPerClaim,
            lastClaimTime: now.toISOString(),
            message: `Claimed ${activeCampaign.pointsPerClaim} points!`
        });


    } catch (error) {
        console.error('[AIRDROP] claimPoints Error:', error.stack || error);
        if (error.message.includes('wait 24 hours')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Claim failed', details: error.message });
    }
};

export const submitWallet = async (req, res) => {
    try {
        const { 
            bscWallet, xLink, reviewComment, isFounderRequest,
            projectName, projectTicker, projectManifesto, projectSocial, projectWebsite,
            projectContract, projectGoals, founderSocial, projectLogo, projectBanner
        } = req.body;
        
        if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });
        if (!bscWallet) return res.status(400).json({ error: 'BSC Wallet is required' });

        if (isFounderRequest) {
            if (!projectName || !projectTicker || !projectManifesto || !projectContract || !projectGoals || !founderSocial) {
                return res.status(400).json({ error: 'Founder Applications require Project Name, Ticker, Vision, Contract, Goals, and Social details for filtering.' });
            }
        }

        const users = await store.read('users');
        const submittedCount = users.filter(u => u.airdropSubmitted).length;

        if (submittedCount >= 1000) {
            return res.status(400).json({ error: 'Airdrop Phase 1 is full. All 1000 spots claimed.' });
        }

        const existing = await store.findOne('users', { id: req.user.id });
        if (existing && existing.airdropSubmitted) {
            return res.status(400).json({ error: 'Airdrop already submitted for this account.' });
        }

        // Potential Founder spot check
        let founderApproved = false;
        if (isFounderRequest) {
            const founderCount = users.filter(u => u.isFounderAirdrop).length;
            if (founderCount < 100) {
                founderApproved = true;
            }
        }

        const updatedUser = await store.update('users', u => u.id === req.user.id, (user) => {
            return { 
                airdropSubmitted: true,
                submittedWallet: bscWallet,
                xLink: xLink,
                reviewComment: reviewComment || '',
                isFounderAirdrop: founderApproved,
                projectName: founderApproved ? projectName : null,
                projectTicker: founderApproved ? projectTicker : null,
                projectManifesto: founderApproved ? projectManifesto : null,
                projectSocial: founderApproved ? projectSocial : null,
                projectWebsite: founderApproved ? projectWebsite : null,
                projectContract: founderApproved ? projectContract : null,
                projectGoals: founderApproved ? projectGoals : null,
                founderSocial: founderApproved ? founderSocial : null,
                projectLogo: founderApproved ? projectLogo : null,
                projectBanner: founderApproved ? projectBanner : null,
                airdropSubmittedAt: new Date().toISOString(),
                bagTokens: (user.bagTokens || 0) + 5000 // Reserved allocation (Reserve ITEMS)
            };
        });

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });
        
        res.json({ 
            success: true, 
            message: 'Airdrop submission received! Welcome to AlphaBAG.',
            isFounder: founderApproved,
            bagTokens: updatedUser.bagTokens
        });
    } catch (error) {
        console.error("Airdrop Submit Error:", error);
        res.status(500).json({ error: 'Submission failed' });
    }
};

export const getAirdropStats = async (req, res) => {
    try {
        const users = await store.read('users');
        const submittedCount = users.filter(u => u.airdropSubmitted).length;
        const founderCount = users.filter(u => u.isFounderAirdrop).length;
        
        const missionSettings = await store.read('missionSettings') || {};
        const tgeDate = missionSettings.tgeDate || new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days
        
        res.json({
            totalEntries: submittedCount,
            totalLimit: 1000,
            founderEntries: founderCount,
            founderLimit: 100,
            remainingSpots: Math.max(0, 1000 - submittedCount),
            tgeDate
        });
    } catch (error) {
        console.error('[AIRDROP] getAirdropStats Error:', error.stack || error);
        res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
    }
};

// --- ADMIN ROUTES ---

export const getCampaigns = async (req, res) => {
    try {
        let campaigns = await store.read('airdrop');
        if (!Array.isArray(campaigns)) campaigns = [];

        const now = new Date();
        const enriched = campaigns.map(c => {
            const start = new Date(c.startDate);
            const end = new Date(start.getTime() + (c.durationDays * 24 * 60 * 60 * 1000));
            let calcStatus = c.status;
            if (c.status === 'ACTIVE' && now >= end) calcStatus = 'ENDED';
            return { ...c, endDate: end.toISOString(), calculatedStatus: calcStatus };
        });

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const createCampaign = async (req, res) => {
    try {
        const { tokenTicker, pointsPerClaim, durationDays, status, isSubmissionActive } = req.body;
        const newCamp = {
            id: Math.random().toString(36).substr(2, 9),
            tokenTicker: tokenTicker || '🔒',
            pointsPerClaim: pointsPerClaim || 50,
            durationDays: durationDays || 7,
            startDate: new Date().toISOString(),
            status: status || 'ACTIVE',
            isSubmissionActive: isSubmissionActive !== undefined ? isSubmissionActive : true
        };

        let campaigns = await store.read('airdrop');
        if (!Array.isArray(campaigns)) campaigns = [];
        campaigns.push(newCamp);
        await store.write('airdrop', campaigns);

        res.json({ success: true, item: newCamp });
    } catch (error) {
        console.error('[AIRDROP] createCampaign Error:', error.stack || error);
        res.status(500).json({ error: 'Failed to create campaign', details: error.message });
    }
};

export const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        let campaigns = await store.read('airdrop');
        if (!Array.isArray(campaigns)) campaigns = [];

        const index = campaigns.findIndex(c => c.id === id);
        if (index === -1) return res.status(404).json({ error: 'Campaign not found' });

        if (updates.status === 'ACTIVE' && campaigns[index].status !== 'ACTIVE') {
            updates.startDate = new Date().toISOString();
        }

        const updated = { ...campaigns[index], ...updates };
        campaigns[index] = updated;
        await store.write('airdrop', campaigns);

        res.json({ success: true, item: updated });
    } catch (error) {
        console.error('[AIRDROP] updateCampaign Error:', error.stack || error);
        res.status(500).json({ error: 'Failed to update campaign', details: error.message });
    }
};

export const deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        let campaigns = await store.read('airdrop');
        if (!Array.isArray(campaigns)) campaigns = [];

        const filtered = campaigns.filter(c => c.id !== id);
        await store.write('airdrop', filtered);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const getSubmittedWallets = async (req, res) => {
    try {
        const users = await store.read('users');
        const submissions = users
            .filter(u => u.airdropSubmitted || u.submittedWallet || (u.claimsHistory && u.claimsHistory.length > 0))
            .map(u => ({
                id: u.id,
                email: u.email,
                wallet: u.submittedWallet || 'Not Submitted',
                xLink: u.xLink || 'Not Provided',
                reviewComment: u.reviewComment || '',
                points: u.bagTokens || 0,
                history: u.claimsHistory || [],
                isFounderAirdrop: u.isFounderAirdrop || false,
                projectName: u.projectName || null,
                projectTicker: u.projectTicker || null,
                projectManifesto: u.projectManifesto || null,
                projectSocial: u.projectSocial || null,
                projectWebsite: u.projectWebsite || null,
                projectContract: u.projectContract || null,
                projectGoals: u.projectGoals || null,
                founderSocial: u.founderSocial || null,
                airdropSubmittedAt: u.airdropSubmittedAt || u.createdAt
            }));

        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

// Reset All Airdrop Data (Admin)
export const resetAirdrop = async (req, res) => {
    try {
        const users = await store.read('users');
        const resetUsers = users.map(u => ({
            ...u,
            bagTokens: 0,
            claimsHistory: []
        }));
        await store.write('users', resetUsers);
        await store.write('airdrop', []);

        res.json({ success: true, message: 'All campaigns and histories reset.' });
    } catch (error) {
        res.status(500).json({ error: 'Reset failed' });
    }
};

export const toggleReveal = async (req, res) => {
    try {
        const { isRevealed, officialTicker, conversionRate } = req.body;
        const current = await store.read('reveal') || {};
        const updated = {
            ...current,
            isRevealed: isRevealed !== undefined ? isRevealed : current.isRevealed,
            officialTicker: officialTicker || current.officialTicker,
            conversionRate: conversionRate || current.conversionRate
        };
        await store.write('reveal', updated);
        res.json({ success: true, reveal: updated });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

// Approve/Reject Founder Application
export const approveFounder = async (req, res) => {
    try {
        const { userId, status } = req.body; // status: 'APPROVED' or 'REJECTED'
        if (!userId || !status) return res.status(400).json({ error: 'User ID and Status required' });

        const updatedUser = await store.update('users', u => u.id === userId, (user) => {
            return {
                isFounderAirdrop: status === 'APPROVED',
                founderStatus: status,
                bagTokens: (user.bagTokens || 0) + (status === 'APPROVED' ? 5000 : 0) // Bonus points for approval if needed
            };
        });

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Founder Approval Error:", error);
        res.status(500).json({ error: 'Approval failed' });
    }
};

// --- MISSION PROTOCOL ---

export const getTasks = async (req, res) => {
    try {
        const tasks = await store.read('tasks') || [];
        const activeTasks = tasks.filter(t => t.status === 'ACTIVE');
        res.json(activeTasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch missions' });
    }
};

export const completeTask = async (req, res) => {
    try {
        const { taskId, taskLink } = req.body;
        if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });

        const tasks = await store.read('tasks') || [];
        const task = tasks.find(t => t.id === taskId);

        if (!task || task.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Mission invalid or expired' });
        }

        if (task.requiresLink && !taskLink) {
            return res.status(400).json({ error: 'A valid proof link is required for this mission' });
        }

        const user = await store.update('users', u => u.id === req.user.id, (u) => {
            if (u.isBanned) throw new Error('Your account has been permanently suspended from the T2E program due to protocol violations.');
            
            const completed = u.completedTasks || [];
            
            // Handle limits
            if (task.type === 'once' && completed.includes(taskId)) {
                throw new Error('Mission already completed');
            }
            
            if (task.type === 'daily') {
                const today = new Date().toISOString().split('T')[0];
                const lastDaily = u.lastDailyTaskAt;
                if (lastDaily === today) {
                    throw new Error('Daily mission already completed');
                }
                u.lastDailyTaskAt = today;
            }

            if (task.type === 'weekly') {
                const now = new Date();
                const lastWeeklyObj = u.weeklyTasks ? u.weeklyTasks[taskId] : null;
                if (lastWeeklyObj) {
                    const lastDate = new Date(lastWeeklyObj.date);
                    const diffTime = Math.abs(now - lastDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    if (diffDays <= 7) {
                        throw new Error('Weekly mission already completed. Come back next week.');
                    }
                }
                u.weeklyTasks = u.weeklyTasks || {};
                u.weeklyTasks[taskId] = { date: now.toISOString(), link: taskLink };
            }

            if (task.type !== 'unlimited' && task.type !== 'weekly') {
                completed.push(taskId);
            } else if (task.type === 'weekly') {
                if (!completed.includes(taskId)) {
                    completed.push(taskId);
                }
            }

            if (taskLink) {
                u.submittedLinks = u.submittedLinks || [];
                u.submittedLinks.push({ taskId, link: taskLink, date: new Date().toISOString() });
            }

            return {
                completedTasks: completed,
                items: (u.items || 0) + task.rewardTokens,
                lastDailyTaskAt: u.lastDailyTaskAt,
                weeklyTasks: u.weeklyTasks,
                submittedLinks: u.submittedLinks
            };
        });

        res.json({ success: true, points: user.bagTokens, items: user.items, message: `Mission Complete: +${task.rewardTokens} ITEMS` });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Mission failure' });
    }
};

// --- SYNDICATE INTELLIGENCE (ADMIN) ---

export const processReferralSnapshot = async (req, res) => {
    try {
        const { reward } = req.body;
        const bonusTokens = parseInt(reward) || 2000;
        const users = await store.read('users');
        
        // Find top 100 referrers
        const top100 = [...users]
            .filter(u => (u.referralCount || 0) > 0)
            .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
            .slice(0, 100);

        let awardedCount = 0;

        for (const user of top100) {
            await store.update('users', u => u.id === user.id, r => ({
                items: (r.items || 0) + bonusTokens,
                hasTopReferrerBonus: true
            }));
            awardedCount++;
        }

        res.json({ success: true, count: awardedCount, message: `Processed Elite Bonus for ${awardedCount} members.` });
    } catch (error) {
        res.status(500).json({ error: 'Snapshot processing failed' });
    }
};

export const getAdminTasks = async (req, res) => {
    try {
        const tasks = await store.read('tasks') || [];
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const upsertTask = async (req, res) => {
    try {
        const task = req.body;
        let tasks = await store.read('tasks') || [];

        if (!task.id) {
            task.id = 't' + Math.random().toString(36).substr(2, 5);
            tasks.push(task);
        } else {
            const index = tasks.findIndex(t => t.id === task.id);
            if (index !== -1) tasks[index] = task;
            else tasks.push(task);
        }

        await store.write('tasks', tasks);
        res.json({ success: true, task });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        let tasks = await store.read('tasks') || [];
        tasks = tasks.filter(t => t.id !== id);
        await store.write('tasks', tasks);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const grantBonusXP = async (req, res) => {
    try {
        const { userId, bonusTokens } = req.body;
        if (!userId || bonusTokens === undefined || isNaN(bonusTokens)) {
            return res.status(400).json({ error: 'Valid Target Member and amount are required' });
        }

        const amount = parseInt(bonusTokens);
        const updatedUser = await store.update('users', u => u.id === userId, (user) => {
            const newStrikes = amount < 0 ? (user.strikes || 0) + 1 : (user.strikes || 0);
            return {
                items: (user.items || 0) + amount,
                strikes: newStrikes,
                isBanned: newStrikes >= 5
            };
        });

        if (!updatedUser) return res.status(404).json({ error: 'Member not found' });
        
        if (amount < 0) {
            try {
                const newLog = {
                    id: Math.random().toString(36).substr(2, 9),
                    userId,
                    adminId: req.user?.id || 'admin',
                    reason: `Balance Deduction: ${amount} ITEMS`,
                    timestamp: new Date().toISOString()
                };
                await store.create('strike_log', newLog);
            } catch (logErr) {
                console.error('Failed to log strike in grantBonusXP:', logErr);
            }
        }
        
        let message = amount >= 0 
            ? `Successfully injected ${amount} ITEMS into member profile.`
            : `Deducted ${Math.abs(amount)} ITEMS. Strike count: ${updatedUser.strikes}/5.`;
        
        if (updatedUser.isBanned) message += " MEMBER PERMANENTLY BANNED.";

        res.json({ 
            success: true, 
            message, 
            newTotal: updatedUser.items, 
            strikes: updatedUser.strikes,
            isBanned: updatedUser.isBanned 
        });
    } catch (error) {
        console.error("Grant Bonus Error:", error);
        res.status(500).json({ error: 'Failed to process balance correction' });
    }
};

// --- MISSION LIFECYCLE ADMIN ---

// PAUSE: freeze the mission so users can't claim $BAG but data is preserved
export const pauseMission = async (req, res) => {
    try {
        const { paused } = req.body; // true = pause, false = resume
        let settings = await store.read('missionSettings') || {};
        settings.isPaused = paused !== undefined ? paused : true;
        settings.pausedAt = paused ? new Date().toISOString() : null;
        await store.write('missionSettings', settings);
        res.json({
            success: true,
            isPaused: settings.isPaused,
            message: settings.isPaused ? 'Mission PAUSED. All claims disabled.' : 'Mission RESUMED. All claims re-enabled.'
        });
    } catch (error) {
        console.error('Pause Mission Error:', error);
        res.status(500).json({ error: 'Failed to update mission state' });
    }
};

// GET STATUS: check if mission is paused
export const getMissionStatus = async (req, res) => {
    try {
        const settings = await store.read('missionSettings') || {};
        res.json({ 
            isPaused: !!settings.isPaused, 
            pausedAt: settings.pausedAt || null,
            tgeDate: settings.tgeDate || null
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get mission status' });
    }
};

export const updateTgeDate = async (req, res) => {
    try {
        const { tgeDate } = req.body;
        if (!tgeDate) return res.status(400).json({ error: 'TGE Date required' });

        const current = await store.read('missionSettings') || {};
        const updated = {
            ...current,
            tgeDate
        };
        await store.write('missionSettings', updated);
        res.json({ success: true, tgeDate });
    } catch (error) {
        console.error('Update TGE Date Error:', error);
        res.status(500).json({ error: 'Failed to update TGE date' });
    }
};

// EXPORT: generate downloadable user $BAG snapshot
export const exportMissionData = async (req, res) => {
    try {
        const users = await store.read('users');
        let config = await store.findOne('t2e_config', { id: 'global_config' });
        if (Array.isArray(config)) config = config[0];
        const rate = config?.itemsToBagRate || 1;

        const snapshot = users
            .filter(u => u.bagTokens || u.submittedWallet)
            .map(u => ({
                id: u.id,
                email: u.email || '',
                username: u.username || '',
                wallet: u.submittedWallet || 'NOT_SET',
                totalXP: u.bagTokens || 0,
                convertedBAG: Number((u.bagTokens || 0) / rate).toFixed(2),
                referralCount: u.referralCount || 0,
                dailyStreak: u.lastDailyTaskAt || null,
                completedTasks: (u.completedTasks || []).join(';'),
                submittedAt: u.airdropSubmittedAt || null,
                isFounder: u.isFounderAirdrop || false,
                feedback: u.reviewComment || ''
            }));

        const headers = ['id','email','username','wallet','totalXP','convertedBAG','referralCount','dailyStreak','completedTasks','submittedAt','isFounder', 'feedback'];
        const csv = [
            headers.join(','),
            ...snapshot.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="alphabag_snapshot_${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
};

// FULL WIPE: wipe all $BAG, tasks, campaigns - but keep user accounts intact
export const fullMissionWipe = async (req, res) => {
    try {
        const users = await store.read('users');
        const wipedUsers = users.map(u => ({
            ...u,
            bagTokens: 0,
            claimsHistory: [],
            completedTasks: [],
            submittedWallet: null,
            airdropSubmitted: false,
            airdropSubmittedAt: null,
            lastDailyTaskAt: null,
            weeklyTasks: [],
            referralCount: 0,
            hasTopReferrerBonus: false,
            isFounderAirdrop: false
        }));
        await store.write('users', wipedUsers);
        await store.write('airdrop', []);
        await store.write('missionSettings', { isPaused: false });
        res.json({ success: true, message: 'Full mission data wiped. User accounts preserved. Ready for restart.' });
    } catch (error) {
        console.error('Full Wipe Error:', error);
        res.status(500).json({ error: 'Full wipe failed' });
    }
};

// Convert User ITEMS to BAG Tokens
export const convertItemsToBag = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });

        const user = await store.findOne('users', { id: req.user.id });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const t2eConfig = await store.findOne('t2e_config', { id: 'global_config' }) || {};
        const itemsToBagRate = t2eConfig.itemsToBagRate;

        if (!itemsToBagRate || itemsToBagRate <= 0) {
            return res.status(400).json({ error: 'The conversion rate has not been set yet. Please check back later.' });
        }

        const itemsBalance = user.items || 0;
        if (itemsBalance <= 0) {
            return res.status(400).json({ error: 'You have no ITEMS to convert.' });
        }

        const convertedBag = itemsBalance * itemsToBagRate;
        const newBagTokens = (user.bagTokens || 0) + convertedBag;

        const updatedUser = await store.update('users', u => u.id === req.user.id, (u) => {
            return {
                items: 0,
                bagTokens: newBagTokens
            };
        });

        if (!updatedUser) return res.status(500).json({ error: 'Failed to update user balances' });

        res.json({
            success: true,
            message: `Successfully converted ${itemsBalance} ITEMS to ${convertedBag} $BAG at a 1:${itemsToBagRate} rate.`,
            items: 0,
            bagTokens: newBagTokens
        });
    } catch (error) {
        console.error('Convert ITEMS to BAG Error:', error);
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
};

// Issue Strike to User
export const issueStrike = async (req, res) => {
    try {
        const { userId, reason } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID is required' });

        const adminId = req.user?.id || 'admin';

        const updatedUser = await store.update('users', u => u.id === userId, (user) => {
            const newStrikes = (user.strikes || 0) + 1;
            return {
                strikes: newStrikes,
                isBanned: newStrikes >= 5
            };
        });

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        // Log strike
        const newLog = {
            id: Math.random().toString(36).substr(2, 9),
            userId,
            adminId,
            reason: reason || 'Protocol violation',
            timestamp: new Date().toISOString()
        };
        await store.create('strike_log', newLog);

        res.json({
            success: true,
            message: `Strike issued to user. Strikes: ${updatedUser.strikes}/5.${updatedUser.isBanned ? ' User is banned.' : ''}`,
            strikes: updatedUser.strikes,
            isBanned: updatedUser.isBanned
        });
    } catch (error) {
        console.error('Issue Strike Error:', error);
        res.status(500).json({ error: 'Failed to issue strike' });
    }
};

// Unban User
export const unbanUser = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID is required' });

        const updatedUser = await store.update('users', u => u.id === userId, (user) => {
            return {
                isBanned: false,
                strikes: 0 // Reset strikes to allow a fresh start
            };
        });

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        res.json({
            success: true,
            message: 'User unbanned successfully and strikes reset to 0.',
            user: updatedUser
        });
    } catch (error) {
        console.error('Unban User Error:', error);
        res.status(500).json({ error: 'Failed to unban user' });
    }
};

// Get Strike Log
export const getStrikeLog = async (req, res) => {
    try {
        const logs = await store.read('strike_log') || [];
        const sorted = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(sorted);
    } catch (error) {
        console.error('Get Strike Log Error:', error);
        res.status(500).json({ error: 'Failed to fetch strike logs' });
    }
};
