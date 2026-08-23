import fs from 'fs';
import path from 'path';

const backendRoot = 'C:/Users/1/repos/alphabag_v3_backend';

// 1. env.js
const envJs = `import dotenv from 'dotenv';
dotenv.config();

export function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(\`[ENV] Missing required variables: \${missing.join(', ')}\`);
    if (process.env.NODE_ENV === 'production' || process.env.VITE_ENVIRONMENT === 'production') {
      process.exit(1);
    }
  }

  // Production security checks
  if (process.env.NODE_ENV === 'production' || process.env.VITE_ENVIRONMENT === 'production') {
    const weakSecrets = [
      'your_jwt_secret_key_here',
      'alphabag-secret-key-change-in-prod-urgent',
      'change-me-in-production',
      'default',
      'secret',
    ];

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || weakSecrets.includes(process.env.JWT_SECRET)) {
      console.error('[ENV] FATAL: JWT_SECRET must be at least 32 characters and not a default value');
      process.exit(1);
    }

    if (!process.env.CEX_ENCRYPTION_KEY || process.env.CEX_ENCRYPTION_KEY.length < 16) {
      console.error('[ENV] FATAL: CEX_ENCRYPTION_KEY must be at least 16 characters');
      process.exit(1);
    }

    if (process.env.FRONTEND_URL === '*') {
      console.error('[ENV] FATAL: FRONTEND_URL cannot be wildcard (*) in production');
      process.exit(1);
    }

    if (!process.env.COVALENT_API_KEY) {
      console.warn('[ENV] COVALENT_API_KEY not set — Security Scanner will use fallback mock data');
    }

    if (!process.env.ALCHEMY_API_KEY) {
      console.warn('[ENV] ALCHEMY_API_KEY not set — RPC proxy may fail');
    }
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production' || process.env.VITE_ENVIRONMENT === 'production',
  jwtSecret: process.env.JWT_SECRET || 'alphabag-dev-secret-key-32chars-min!!',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3005',
  dbUrl: process.env.DATABASE_URL || '',
  adminSetupSecret: process.env.ADMIN_SETUP_SECRET || null,
  adminPortalKey: process.env.ADMIN_PORTAL_KEY || '',
  localAdminPreviewEmail: process.env.LOCAL_ADMIN_PREVIEW_EMAIL || '',
  localAdminPreviewPassword: process.env.LOCAL_ADMIN_PREVIEW_PASSWORD || '',
  alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
  covalentApiKey: process.env.COVALENT_API_KEY || '',
  coingeckoApiKey: process.env.COINGECKO_API_KEY || '',
  moralisApiKey: process.env.MORALIS_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  cexEncryptionKey: process.env.CEX_ENCRYPTION_KEY || 'alphabag-cex-encryption-key-32ch',
};

export default config;
`;
fs.writeFileSync(path.join(backendRoot, 'src/config/env.js'), envJs, 'utf8');
console.log('✅ env.js written');

// 2. adminSeedRoutes.js
const adminSeedRoutes = `// SPDX-License-Identifier: MIT
// PATCH: adminSeedRoutes.js — Secure bootstrap for first admin
// Usage: POST /api/admin-seed with { wallet: "0x...", secret: "SETUP_SECRET_FROM_ENV" }
// This route is ONLY usable when zero admins exist in the database,
// OR when the correct ADMIN_SETUP_SECRET is provided.
// After the first admin is created, disable this route by removing it from app.js
// or by rotating/deleting the ADMIN_SETUP_SECRET env var.

import express from 'express';
import { config } from '../config/env.js';
import { store } from '../services/storeService.js';

const router = express.Router();

/**
 * POST /api/admin-seed
 * Body: { wallet: string, secret: string }
 * 
 * Creates the first admin record. Requires ADMIN_SETUP_SECRET env var.
 * Once at least one admin exists, the secret check still applies,
 * but you should remove this route from production after bootstrap.
 */
router.post('/', async (req, res) => {
    try {
        const { wallet, secret } = req.body;

        if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
            return res.status(400).json({ error: 'Valid wallet address required' });
        }

        if (!secret) {
            return res.status(400).json({ error: 'Setup secret required' });
        }

        // Verify setup secret
        if (!config.adminSetupSecret) {
            return res.status(503).json({ error: 'Admin setup is not configured on this server.' });
        }

        if (secret !== config.adminSetupSecret) {
            console.warn(\`[SECURITY] Invalid admin setup attempt from \${req.ip}\`);
            return res.status(401).json({ error: 'Invalid setup secret.' });
        }

        const normalizedWallet = wallet.toLowerCase();

        // Check if already admin
        const existing = await store.findOne('admins', { wallet: normalizedWallet });
        if (existing) {
            return res.status(409).json({ error: 'Wallet is already an admin' });
        }

        const newAdmin = await store.create('admins', {
            wallet: normalizedWallet,
            addedBy: 'SETUP_SECRET',
            addedAt: new Date(),
        });

        console.log(\`[ADMIN-SEED] Wallet \${normalizedWallet} promoted to admin via setup secret\`);

        res.status(201).json({ 
            success: true, 
            message: 'Admin created successfully. Remove ADMIN_SETUP_SECRET from env to disable this route.',
            admin: { id: newAdmin.id, wallet: newAdmin.wallet }
        });
    } catch (error) {
        console.error('Admin seed error:', error);
        res.status(500).json({ error: 'Failed to create admin' });
    }
});

export default router;
`;
fs.writeFileSync(path.join(backendRoot, 'src/routes/adminSeedRoutes.js'), adminSeedRoutes, 'utf8');
console.log('✅ adminSeedRoutes.js written');

// 3. authController.js
const authController = `// SPDX-License-Identifier: MIT
// PATCH: authController.js — Zero hardcoded wallets + full auth suite
// Fixes:
//   1. Removed ADMIN_WALLETS hardcoded array
//   2. Admin status determined by database \`admins\` table ONLY
//   3. Added promoteToAdmin() for existing admins to add new admins via dashboard
//   4. Added removeAdmin() for admin revocation
//   5. Preserved SIWE auth, referral tracking, and real on-chain upgrade verification

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateNonce, SiweMessage } from 'siwe';
import { verifyMessage, getAddress, createPublicClient, http, formatUnits } from 'viem';
import { bsc } from 'viem/chains';
import { store } from '../services/storeService.js';
import { config } from '../config/env.js';

const ERC20_BALANCE_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
];

const bscPublicClient = createPublicClient({
    chain: bsc,
    transport: http(config.alchemyApiKey ? \`https://bnb-mainnet.g.alchemy.com/v2/\${config.alchemyApiKey}\` : undefined),
});

const nonces = new Map();
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// ── Nonce Generation ───────────────────────────────────────────────────────
export const getNonce = async (req, res) => {
    try {
        const nonce = generateNonce();
        const expiresAt = Date.now() + NONCE_EXPIRY_MS;
        nonces.set(nonce, { expiresAt, used: false });
        if (nonces.size > 1000) {
            const now = Date.now();
            for (const [key, val] of nonces.entries()) {
                if (val.expiresAt < now) nonces.delete(key);
            }
        }
        res.status(200).json({ nonce });
    } catch (error) {
        console.error('Nonce generation error:', error);
        res.status(500).json({ error: 'Failed to generate nonce' });
    }
};

// ── Standard SIWE Verification ─────────────────────────────────────────────
export const verify = async (req, res) => {
    try {
        const { message, signature } = req.body;
        if (!message || !signature) {
            return res.status(400).json({ error: 'Message and signature are required' });
        }

        const siweMessage = new SiweMessage(message);
        const fields = await siweMessage.validate(signature);

        if (!fields.nonce || !nonces.has(fields.nonce)) {
            return res.status(400).json({ error: 'Invalid or expired nonce' });
        }

        const nonceData = nonces.get(fields.nonce);
        if (nonceData.used || nonceData.expiresAt < Date.now()) {
            nonces.delete(fields.nonce);
            return res.status(400).json({ error: 'Nonce already used or expired' });
        }

        nonceData.used = true;
        nonces.delete(fields.nonce);

        const adminRecord = await store.findOne('admins', { wallet: fields.address.toLowerCase() });
        const isAdmin = !!adminRecord;

        let user = await store.findOne('users', { wallet: fields.address.toLowerCase() });
        if (!user) {
            user = await store.create('users', {
                wallet: fields.address.toLowerCase(),
                tier: 'FREE',
                bagTokens: 0,
                itemsBalance: 0,
                totalEarned: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        const tokenPayload = {
            id: user.id,
            address: fields.address.toLowerCase(),
            wallet: fields.address.toLowerCase(),
            tier: user.tier,
            isAdmin: isAdmin,
        };

        const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '7d' });

        res.status(200).json({ token, user: tokenPayload });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(401).json({ error: 'Invalid signature or message' });
    }
};

// ── Legacy / Direct SIWE Auth Flow ──────────────────────────────────────────
export const siweAuth = async (req, res) => {
    const { address, signature, message, refCode } = req.body;

    try {
        if (!address || !signature || !message) {
            return res.status(400).json({ error: 'Missing authentication parameters' });
        }

        let checksummedAddress = address;
        try {
            if (address && address.startsWith('0x')) {
                checksummedAddress = getAddress(address);
            }
        } catch (addrErr) {
            checksummedAddress = address;
        }

        let isValid = false;
        try {
            isValid = await verifyMessage({
                address: checksummedAddress,
                message,
                signature,
            });
        } catch (vErr) {
            return res.status(401).json({ error: 'Invalid signature format' });
        }

        if (!isValid) {
            return res.status(401).json({ error: 'Signature verification failed' });
        }

        const normalizedId = address.toLowerCase();
        let userArr = await store.read('users');
        let user = userArr.find(u => u.id && typeof u.id === 'string' && u.id.toLowerCase() === normalizedId);
        let isNew = false;

        const adminRecord = await store.findOne('admins', { wallet: normalizedId });
        const isAdmin = !!adminRecord;

        if (!user) {
            isNew = true;
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            let referredBy = null;

            if (refCode && typeof refCode === 'string') {
                const referrer = userArr.find(u => u.referralCode === refCode.toUpperCase());
                if (referrer) {
                    referredBy = referrer.id;
                    const referrerCount = referrer.referralCount || 0;
                    if (referrerCount < 1000) {
                        await store.updateById('users', referrer.id, r => ({
                            items: (r.items || 0) + 100,
                            referralCount: referrerCount + 1
                        }));
                    }
                }
            }

            user = {
                id: normalizedId,
                email: \`\${address.substring(0, 6)}...\${address.substring(address.length - 4)}\`,
                verifiedWallet: address,
                wallet: normalizedId,
                items: 5000,
                bagTokens: 0,
                referralCode,
                referredBy,
                referralCount: 0,
                tier: 'FREE',
                isAdmin,
                lastActive: new Date().toISOString()
            };
            await store.create('users', user);
        } else {
            user = await store.updateById('users', normalizedId, u => ({
                lastActive: new Date().toISOString(),
                isAdmin
            }));
        }

        const { password: _, ...userSafe } = user;
        const token = jwt.sign({ 
            id: user.id, 
            email: user.email, 
            isAdmin,
            wallet: user.verifiedWallet || normalizedId 
        }, config.jwtSecret, { expiresIn: '7d' });

        res.json({ token, user: userSafe, isNew });
    } catch (error) {
        console.error("SIWE Auth Error:", error);
        res.status(500).json({ error: error.message || 'Authentication protocol failure' });
    }
};

export const register = async (req, res) => {
    return res.status(410).json({
        error: 'Email/password registration is disabled. Please connect your wallet to sign in.'
    });
};

export const login = async (req, res) => {
    const { email, password, portal, adminPortalKey } = req.body;
    const isAdminPortal = portal === 'admin';

    if (!isAdminPortal) {
        return res.status(410).json({
            error: 'Email/password login is not available for user accounts. Please connect your wallet to sign in.'
        });
    }

    if (!config.adminPortalKey) {
        return res.status(503).json({ error: 'Admin portal is not available.' });
    }
    if (adminPortalKey !== config.adminPortalKey) {
        return res.status(403).json({ error: 'Invalid credentials' });
    }

    const user = await store.findOne('admins', { email });
    if (!user || !user.password) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const updatedAdmin = await store.updateById('admins', user.id, u => ({
        updatedAt: new Date().toISOString()
    }));
    const { password: _, ...adminSafe } = updatedAdmin || user;
    const token = jwt.sign({ id: adminSafe.id, email: adminSafe.email, isAdmin: true }, config.jwtSecret, { expiresIn: '24h' });
    res.json({ token, user: { ...adminSafe, isAdmin: true } });
};

// ── Get Current User ───────────────────────────────────────────────────────
export const getMe = async (req, res) => {
    try {
        const user = await store.findOne('users', { id: req.user.id }) || await store.findOne('users', { wallet: req.user.wallet });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const walletToCheck = (user.wallet || user.verifiedWallet || req.user.wallet || '').toLowerCase();
        const adminRecord = walletToCheck ? await store.findOne('admins', { wallet: walletToCheck }) : null;
        const isAdmin = !!adminRecord;

        res.status(200).json({
            ...user,
            isAdmin,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

export const getReferrals = async (req, res) => {
    try {
        const userId = req.user?.id;
        const allUsers = await store.read('users');
        const user = allUsers.find(u => u.id === userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const directReferrals = allUsers.filter(u => u.referredBy === userId);
        res.json({
            referralCode: user.referralCode,
            totalReferrals: directReferrals.length,
            referrals: directReferrals.map(r => ({
                id: r.id,
                email: r.email,
                joinedAt: r.createdAt || r.lastActive
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch referrals' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { bio, twitter, telegram, avatar } = req.body;
        const updated = await store.updateById('users', userId, u => ({
            bio: bio !== undefined ? bio : u.bio,
            twitter: twitter !== undefined ? twitter : u.twitter,
            telegram: telegram !== undefined ? telegram : u.telegram,
            avatar: avatar !== undefined ? avatar : u.avatar,
            updatedAt: new Date().toISOString()
        }));
        res.json({ success: true, user: updated });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const verifyUpgrade = async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const userId = req.user?.id;
        const wallet = walletAddress || req.user?.wallet || req.user?.address;

        if (!wallet) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const bagTokenAddress = process.env.BAG_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
        let isEligible = false;

        if (bagTokenAddress !== '0x0000000000000000000000000000000000000000') {
            try {
                const balanceRaw = await bscPublicClient.readContract({
                    address: bagTokenAddress,
                    abi: ERC20_BALANCE_ABI,
                    functionName: 'balanceOf',
                    args: [wallet],
                });
                const balanceFormatted = Number(formatUnits(balanceRaw, 18));
                if (balanceFormatted >= 10000) isEligible = true;
            } catch (rpcErr) {
                console.error('[UPGRADE] RPC balance check failed:', rpcErr);
            }
        }

        if (!isEligible && (process.env.NODE_ENV || 'development') !== 'production' && process.env.VITE_ENABLE_DEV_ULTIMATE === 'true') {
            isEligible = true;
        }

        if (!isEligible) {
            return res.status(403).json({ error: 'Insufficient $BAG balance. 10,000 $BAG required for ULTIMATE tier.' });
        }

        const updatedUser = await store.updateById('users', userId, u => ({
            tier: 'ULTIMATE',
            updatedAt: new Date().toISOString()
        }));

        const token = jwt.sign({ 
            id: updatedUser.id, 
            wallet: updatedUser.wallet,
            tier: 'ULTIMATE',
            isAdmin: updatedUser.isAdmin 
        }, config.jwtSecret, { expiresIn: '7d' });

        res.json({ success: true, user: updatedUser, token });
    } catch (error) {
        console.error('Verify upgrade error:', error);
        res.status(500).json({ error: 'Failed to verify upgrade' });
    }
};

// ── Admin Management ───────────────────────────────────────────────────────
export const promoteToAdmin = async (req, res) => {
    try {
        const { wallet } = req.body;
        if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
            return res.status(400).json({ error: 'Valid wallet address required' });
        }

        const normalizedWallet = wallet.toLowerCase();
        const existing = await store.findOne('admins', { wallet: normalizedWallet });
        if (existing) {
            return res.status(409).json({ error: 'Wallet is already an admin' });
        }

        const newAdmin = await store.create('admins', {
            wallet: normalizedWallet,
            addedBy: req.user.address || req.user.wallet || 'ADMIN',
            addedAt: new Date(),
        });

        console.log(\`[ADMIN] Promoted \${normalizedWallet} to admin\`);
        res.status(201).json({ success: true, admin: newAdmin });
    } catch (error) {
        console.error('Promote admin error:', error);
        res.status(500).json({ error: 'Failed to promote admin' });
    }
};

export const removeAdmin = async (req, res) => {
    try {
        const { wallet } = req.body;
        if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
            return res.status(400).json({ error: 'Valid wallet address required' });
        }

        const normalizedWallet = wallet.toLowerCase();
        const callerWallet = (req.user.address || req.user.wallet || '').toLowerCase();

        if (normalizedWallet === callerWallet) {
            return res.status(400).json({ error: 'Cannot remove yourself. Use another admin account.' });
        }

        const existing = await store.findOne('admins', { wallet: normalizedWallet });
        if (!existing) {
            return res.status(404).json({ error: 'Wallet is not an admin' });
        }

        await store.delete('admins', existing.id);
        console.log(\`[ADMIN] Removed \${normalizedWallet} from admins\`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Remove admin error:', error);
        res.status(500).json({ error: 'Failed to remove admin' });
    }
};

export const listAdmins = async (req, res) => {
    try {
        const admins = await store.findMany('admins', {});
        res.status(200).json({ admins });
    } catch (error) {
        console.error('List admins error:', error);
        res.status(500).json({ error: 'Failed to list admins' });
    }
};
`;
fs.writeFileSync(path.join(backendRoot, 'src/controllers/authController.js'), authController, 'utf8');
console.log('✅ authController.js written');

// 4. authRoutes.js
const authRoutes = `// SPDX-License-Identifier: MIT
// PATCH: authRoutes.js — Wire admin management endpoints

import express from 'express';
import { 
    login, 
    register, 
    siweAuth, 
    getReferrals, 
    getMe, 
    updateProfile, 
    verifyUpgrade, 
    getNonce, 
    verify, 
    promoteToAdmin, 
    removeAdmin, 
    listAdmins 
} from '../controllers/authController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/nonce', getNonce);
router.post('/verify', verify);
router.post('/login', login);
router.post('/register', register);
router.post('/siwe', siweAuth);
router.get('/me', verifyToken, getMe);
router.get('/referrals', verifyToken, getReferrals);
router.post('/update-profile', verifyToken, updateProfile);
router.post('/verify-upgrade', verifyToken, verifyUpgrade);

// Admin management (protected by existing admin check)
router.post('/admin/promote', verifyToken, verifyAdmin, promoteToAdmin);
router.post('/admin/remove', verifyToken, verifyAdmin, removeAdmin);
router.get('/admin/list', verifyToken, verifyAdmin, listAdmins);

export default router;
`;
fs.writeFileSync(path.join(backendRoot, 'src/routes/authRoutes.js'), authRoutes, 'utf8');
console.log('✅ authRoutes.js written');

// 5. app.js
const appJs = `// SPDX-License-Identifier: MIT
// PATCH: app.js — Hardened CORS & security headers + secure admin seed wiring
// Fixes:
//   1. Removed wildcard CORS fallback
//   2. Added CSP, HSTS, body limits
//   3. Wired /api/admin-seed for one-time bootstrap (remove after first admin)

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import t2eRoutes from './routes/t2eRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminSeedRoutes from './routes/adminSeedRoutes.js';
import { verifyToken, verifyAdmin } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.frontendUrl],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: config.isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));

// ── CORS ───────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (config.isProduction) {
      if (origin === config.frontendUrl) return callback(null, true);
      console.warn(\`[CORS] Blocked origin: \${origin}\`);
      return callback(new Error('Not allowed by CORS'));
    }
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }
    console.warn(\`[CORS] Blocked origin in dev: \${origin}\`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// ── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ── Rate Limiting ──────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 500,
  message: { error: 'Too many admin requests, please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});

const seedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { error: 'Too many seed attempts. This endpoint is heavily rate-limited.' },
  standardHeaders: true, legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api/admin-seed', seedLimiter);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/t2e', t2eRoutes);
app.use('/api/admin', verifyToken, verifyAdmin, adminRoutes);

// SECURE BOOTSTRAP: One-time admin seed route.
// Remove this line after creating your first admin and redeploy.
app.use('/api/admin-seed', adminSeedRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ── Production Startup Guards ────────────────────────────────────────────────
if (config.isProduction) {
  if (config.frontendUrl === '*') {
    console.error('[FATAL] FRONTEND_URL cannot be wildcard (*) in production');
    process.exit(1);
  }
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    console.error('[FATAL] JWT_SECRET must be at least 32 characters in production');
    process.exit(1);
  }
  if (config.dbUrl && config.dbUrl.includes('localhost')) {
    console.warn('[WARN] Production is using a localhost database URL');
  }
  if (config.adminSetupSecret) {
    console.warn('[WARN] ADMIN_SETUP_SECRET is set. The /api/admin-seed route is active. Remove it after first admin creation.');
  }
}

export default app;
`;
fs.writeFileSync(path.join(backendRoot, 'src/app.js'), appJs, 'utf8');
console.log('✅ app.js written');

console.log('\n🎉 ALL BACKEND PATCHES APPLIED SUCCESSFULLY!');
