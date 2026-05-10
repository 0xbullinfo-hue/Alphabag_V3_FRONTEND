import { store } from '../services/storeService.js';

// ─── SERVER-SIDE CACHE ────────────────────────────────────────────────────────
// Caches trending data for 5 minutes to avoid hammering DexScreener
let trendingCache = { data: null, timestamp: 0 };
const TRENDING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── FIREHOSE (DexScreener Latest) ───────────────────────────
export const getTrendingPairs = async (req, res) => {
    const { chain = 'bsc' } = req.query;

    try {
        const now = Date.now();
        const cacheKey = chain;

        // Serve from cache if fresh
        if (
            trendingCache.data &&
            trendingCache.chain === cacheKey &&
            now - trendingCache.timestamp < TRENDING_CACHE_TTL
        ) {
            return res.json({ success: true, pairs: trendingCache.data, cached: true });
        }

        let firehosePairs = [];
        try {
            const chainQuery = chain === 'all' ? 'ethereum bsc solana' : chain;
            const fireRes = await fetch(
                `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(chainQuery)}`,
                { headers: { 'User-Agent': 'AlphaBAG-Terminal/2.0' } }
            );
            const fireData = await fireRes.json();
            firehosePairs = (fireData.pairs || [])
                .filter(p => chain === 'all' || p.chainId === chain)
                .filter(p => p.pairCreatedAt && p.liquidity?.usd > 1000) // min $1k liquidity
                .sort((a, b) => b.pairCreatedAt - a.pairCreatedAt)
                .slice(0, 24);
        } catch (e) {
            console.warn('[LIVE-PAIRS] Firehose fetch failed:', e.message);
        }

        // Cache result
        trendingCache = { data: firehosePairs, timestamp: now, chain: cacheKey };

        res.json({ success: true, pairs: firehosePairs, cached: false });
    } catch (error) {
        console.error('[LIVE-PAIRS] Trending fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch live pairs' });
    }
};

// ─── COMMUNITY SUBMITTED PAIRS ────────────────────────────────────────────────
export const getLivePairs = async (req, res) => {
    try {
        const pairs = await store.read('user_submitted_pairs') || [];
        const users = await store.read('users');

        const now = new Date();

        const enriched = pairs
            .map(p => {
                // Check if boost has expired
                let isBoosted = false;
                if (p.isBoosted && p.boostExpiry && new Date(p.boostExpiry) > now) {
                    isBoosted = true;
                }
                
                return {
                    ...p,
                    isBoosted,
                    user: users.find(u => u.id === p.userId) || { id: p.userId }
                };
            })
            .sort((a, b) => {
                // Pinned boosted pairs first
                if (a.isBoosted && !b.isBoosted) return -1;
                if (!a.isBoosted && b.isBoosted) return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            })
            .slice(0, 50);

        res.json({ success: true, pairs: enriched });
    } catch (error) {
        console.error('[LIVE-PAIRS] Fetch community pairs error:', error);
        res.status(500).json({ error: 'Server node error' });
    }
};

// ─── BOOST COMMUNITY PAIR ─────────────────────────────────────────────────────
export const boostPair = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const pairs = await store.read('user_submitted_pairs') || [];
        const pair = pairs.find(p => p.id === id);
        
        if (!pair) return res.status(404).json({ error: 'Token not found' });
        
        // Check maximum active boosts limit (21)
        const now = new Date();
        const activeBoosts = pairs.filter(p => p.isBoosted && p.boostExpiry && new Date(p.boostExpiry) > now).length;
        
        if (activeBoosts >= 21 && !pair.isBoosted) {
            return res.status(400).json({ error: 'Boost limit reached! Only 21 tokens can be boosted at a time. Please wait for an active boost to expire.' });
        }
        
        // In testnet, boosting is free/available to all authenticated users.
        const boostExpiry = new Date();
        boostExpiry.setDate(boostExpiry.getDate() + 3);
        
        await store.update('user_submitted_pairs', p => p.id === id, () => ({
            isBoosted: true,
            boostExpiry: boostExpiry.toISOString()
        }));
        
        res.json({ success: true, message: 'Token successfully boosted for 3 days!' });
    } catch (error) {
        console.error('[LIVE-PAIRS] Boost error:', error);
        res.status(500).json({ error: 'Internal error while boosting token' });
    }
};

// ─── GET COOLDOWN STATUS (for UI timer) ──────────────────────────────────────
export const getSubmissionCooldown = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const submissions = await store.read('user_submitted_pairs') || [];
        const recent = submissions
            .filter(s => s.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        if (!recent || new Date(recent.createdAt) < thirtyDaysAgo) {
            return res.json({ canSubmit: true, nextAvailableAt: null, lastSubmission: null });
        }

        const nextAvailableAt = new Date(recent.createdAt);
        nextAvailableAt.setDate(nextAvailableAt.getDate() + 30);

        res.json({
            canSubmit: false,
            nextAvailableAt: nextAvailableAt.toISOString(),
            lastSubmission: recent
        });
    } catch (error) {
        console.error('[LIVE-PAIRS] Cooldown check error:', error);
        res.status(500).json({ error: 'Failed to check cooldown' });
    }
};

// ─── SUBMIT COMMUNITY PAIR ────────────────────────────────────────────────────
export const submitPair = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { contractAddress } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!contractAddress || contractAddress.trim().length < 32) {
            return res.status(400).json({ error: 'Invalid Contract Address. Must be a raw CA (no URLs).' });
        }

        // ─── 1. Tier Gate — ULTIMATE only (all wallet-connected users qualify for testnet) ───
        const users = await store.read('users');
        const user = users.find(u => u.id.toLowerCase() === userId.toLowerCase());

        if (!user) return res.status(404).json({ error: 'User not found in registry.' });
        if (user.tier !== 'ULTIMATE') {
            return res.status(403).json({
                error: 'Premium Access Required. Connect your wallet to unlock Community Alpha submissions.'
            });
        }

        // ─── 2. Rate Limit — 1 per 30 days ───────────────────────────────────
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const submissions = await store.read('user_submitted_pairs') || [];
        const recentSubmission = submissions.find(
            s => s.userId === userId && new Date(s.createdAt) >= thirtyDaysAgo
        );

        if (recentSubmission) {
            const nextDate = new Date(recentSubmission.createdAt);
            nextDate.setDate(nextDate.getDate() + 30);
            return res.status(429).json({
                error: `Rate limited. Your next submission is available on ${nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
                nextAvailableAt: nextDate.toISOString()
            });
        }

        // ─── 3. Validate against DexScreener ─────────────────────────────────
        const ca = contractAddress.trim();
        let dexData;
        try {
            const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`, {
                headers: { 'User-Agent': 'AlphaBAG-Terminal/2.0' }
            });
            dexData = await dexRes.json();
        } catch (e) {
            return res.status(503).json({ error: 'DexScreener indexer unreachable. Try again shortly.' });
        }

        if (!dexData.pairs || dexData.pairs.length === 0) {
            return res.status(404).json({
                error: 'No live liquidity pairs found on DexScreener. The token may not have an active pair yet.'
            });
        }

        const primaryPair = dexData.pairs[0];

        // ─── 4. Anti-rug: minimum liquidity check ($5k) ───────────────────────
        const liquidity = primaryPair.liquidity?.usd || 0;
        if (liquidity < 5000) {
            return res.status(400).json({
                error: `Liquidity too low ($${liquidity.toLocaleString()}). Minimum $5,000 USD required to list.`
            });
        }

        // ─── 5. Duplicate check ───────────────────────────────────────────────
        const alreadyListed = submissions.find(
            s => s.contractAddress?.toLowerCase() === primaryPair.baseToken.address?.toLowerCase()
        );
        if (alreadyListed) {
            return res.status(400).json({ error: 'This token is already listed in the Community Alpha feed.' });
        }

        // ─── 6. Save submission ───────────────────────────────────────────────
        const submission = {
            id: 'pair_' + Math.random().toString(36).substr(2, 9),
            userId,
            contractAddress: primaryPair.baseToken.address,
            chainId: primaryPair.chainId,
            symbol: primaryPair.baseToken.symbol,
            name: primaryPair.baseToken.name,
            priceUsd: primaryPair.priceUsd,
            liquidity: primaryPair.liquidity?.usd,
            dexUrl: primaryPair.url,
            createdAt: new Date().toISOString()
        };

        await store.create('user_submitted_pairs', submission);

        res.json({
            success: true,
            message: `${primaryPair.baseToken.symbol} synced to Community Alpha via DexScreener.`,
            data: submission
        });
    } catch (error) {
        console.error('[LIVE-PAIRS] Submit pair error:', error);
        res.status(500).json({ error: 'Internal indexing error. Please try again.' });
    }
};
