import express from 'express';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';
import {
    getTrendingPairs,
    getLivePairs,
    getSubmissionCooldown,
    submitPair,
    boostPair
} from '../controllers/livePairController.js';

const router = express.Router();

// Public — trending DexScreener pairs (server-cached, ?chain=bsc|eth|sol|all)
router.get('/trending', getTrendingPairs);

// Public — community submitted pairs
router.get('/', getLivePairs);

// Protected — check user's submission cooldown
router.get('/cooldown', verifyToken, getSubmissionCooldown);

// Protected — submit a CA (ULTIMATE tier + 30-day rate limit)
router.post('/submit', verifyToken, submitPair);

// Protected — boost a community pair
router.post('/boost/:id', verifyToken, boostPair);

export default router;
