import express from 'express';
import { 
    getTreasuryStatus, getUserEarnProfile, getMissions, 
    getActivityFeed, streamActivity, getLeaderboard, claimMission,
    requestBagPayout, updatePreferredWallet,
    adjustTreasuryBalance, getAdminMissions, upsertMission, deleteMission,
    getAdminTokenRequests, approveTokenRequest, markPayoutDone, getAdminActivity,
    approveAllTokenRequests, markAllPayoutsDone, rejectBulkTokenRequests, exportApprovedPayouts
} from '../controllers/t2eController.js';
import { verifyToken, verifyAdmin, optionalAuth } from '../middleware/authMiddleware.js';
const router = express.Router();

// Public / Guest Routes
router.get('/treasury-status', optionalAuth, getTreasuryStatus);
router.get('/missions',         optionalAuth, getMissions);        // ?page=1&limit=20&type=SOCIAL
router.get('/activity-feed',    optionalAuth, getActivityFeed);
router.get('/activity-stream',  optionalAuth, streamActivity);
router.get('/leaderboard',      optionalAuth, getLeaderboard);

// Protected User Routes
router.get('/user/profile',   verifyToken, getUserEarnProfile);
router.post('/claim',         verifyToken, claimMission);
router.post('/request-payout', verifyToken, requestBagPayout);
router.patch('/user/wallet',  verifyToken, updatePreferredWallet);

// Admin Routes
router.patch('/admin/adjust-balance', verifyToken, verifyAdmin, adjustTreasuryBalance);
router.get('/admin/missions',        verifyToken, verifyAdmin, getAdminMissions);
router.post('/admin/missions',       verifyToken, verifyAdmin, upsertMission);
router.delete('/admin/missions/:id', verifyToken, verifyAdmin, deleteMission);
router.get('/admin/token-requests',   verifyToken, verifyAdmin, getAdminTokenRequests);
router.post('/admin/token-requests/approve-all', verifyToken, verifyAdmin, approveAllTokenRequests);
router.post('/admin/token-requests/mark-all-done', verifyToken, verifyAdmin, markAllPayoutsDone);
router.post('/admin/token-requests/reject-bulk', verifyToken, verifyAdmin, rejectBulkTokenRequests);
router.get('/admin/token-requests/export-approved', verifyToken, verifyAdmin, exportApprovedPayouts);
router.post('/admin/token-requests/:id/approve', verifyToken, verifyAdmin, approveTokenRequest);
router.post('/admin/token-requests/:id/mark-done', verifyToken, verifyAdmin, markPayoutDone);
router.get('/admin/activity',         verifyToken, verifyAdmin, getAdminActivity);

export default router;
