import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { store } from '../services/storeService.js';

// Admin Wallets (Mirroring Frontend)
const ADMIN_WALLETS = [
    '0x1234567890123456789012345678901234567890', // Placeholder
    '0x42916A998c6Bff7F36bE61749Bd1BBA9f473dB96', // Added per user request for dev
];

export const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    const bearer = token.split(' ');
    const tokenValue = bearer[1];

    try {
        // Wallet-Only Auth Handler
        if (tokenValue.startsWith('wallet-auth:')) {
            const address = tokenValue.split(':')[1];
            if (!address) throw new Error("Invalid wallet token");

            const isWhitelistedAdmin = ADMIN_WALLETS.some(a => a.toLowerCase() === address.toLowerCase());

            req.user = {
                id: address,
                email: `${address.substring(0, 6)}...`,
                tier: isWhitelistedAdmin ? 'ULTIMATE' : 'FREE',
                isAdmin: isWhitelistedAdmin
            };

            // Track Live Activity (Lightweight)
            // We can skip heavy file I/O for every request or optimize it later.
            // For now, let's just proceed.
            return next();
        }

        // Legacy JWT Handler (if needed for old sessions, otherwise likely unused now)
        const decoded = jwt.verify(tokenValue, config.jwtSecret);
        req.user = decoded;
        next();

    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

export const optionalAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        req.user = null; // Ensure req.user is null if no token
        return next();
    }

    const bearer = token.split(' ');
    const tokenValue = bearer[1];

    try {
        if (tokenValue.startsWith('wallet-auth:')) {
            const address = tokenValue.split(':')[1];
            const isWhitelistedAdmin = ADMIN_WALLETS.some(a => a.toLowerCase() === address.toLowerCase());
            req.user = { id: address, tier: isWhitelistedAdmin ? 'ULTIMATE' : 'FREE', isAdmin: isWhitelistedAdmin };
            return next();
        }
        const decoded = jwt.verify(tokenValue, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        req.user = null; // Ensure req.user is null if token is invalid
        next();
    }
};

export const requireAuth = verifyToken;
export const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ error: 'Require basic auth to access Admin.' });
    }
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }
    next();
};
