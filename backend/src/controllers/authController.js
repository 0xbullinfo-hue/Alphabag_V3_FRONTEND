import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyMessage, getAddress } from 'viem';
import { store } from '../services/storeService.js';
import { config } from '../config/env.js';

export const register = async (req, res) => {
    const { email, password } = req.body;

    // Prevent Admin Registration via UI entirely
    if (email.toLowerCase() === 'adminbx1p@alphabagpro.com' || email.toLowerCase().includes('admin')) {
        return res.status(403).json({ error: 'Restricted Domain. Please contact system administrator.' });
    }

    const existing = await store.findOne('users', { email });
    if (existing) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await store.create('users', {
        email,
        password: hashedPassword,
        tier: 'FREE',
        isAdmin: false
    });

    const token = jwt.sign({ id: newUser.id, email: newUser.email, isAdmin: false }, config.jwtSecret, { expiresIn: '24h' });
    const { password: _, ...userSafe } = newUser;

    res.json({ token, user: userSafe });
};

export const login = async (req, res) => {
    const { email, password, portal } = req.body; // portal: 'main' | 'admin'

    const user = await store.findOne('users', { email });
    console.log(`[LOGIN ATTEMPT] Email: ${email}, Portal: ${portal}`);

    if (!user) {
        console.log(`[LOGIN FAIL] User not found: ${email}`);
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    // --- STRICT SEPARATION LOGIC ---
    if (user.isAdmin) {
        if (portal !== 'admin') {
            return res.status(403).json({ error: 'Admin accounts must use the Command Portal.' });
        }
    } else {
        // Regular User
        if (portal === 'admin') {
            return res.status(403).json({ error: 'Access Denied. Admins Only.' });
        }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[LOGIN CHECK] User: ${user.email}, IsAdmin: ${user.isAdmin}, PasswordMatch: ${isMatch}`);

    if (!isMatch) {
        console.log(`[LOGIN FAIL] Password mismatch for ${user.email}`);
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Atomic Update
    const updatedUser = await store.update('users', u => u.email === email, u => ({
        visits: (u.visits || 0) + 1,
        lastLoginIp: req.ip || req.connection.remoteAddress,
        lastActive: new Date().toISOString()
    }));

    if (!updatedUser) {
        // Should not happen as we found it before
        return res.status(500).json({ error: 'Failed to update user stats' });
    }

    const { password: _, ...userSafe } = updatedUser;
    const token = jwt.sign({ id: updatedUser.id, email: updatedUser.email, isAdmin: updatedUser.isAdmin }, config.jwtSecret, { expiresIn: '24h' });

    res.json({ token, user: userSafe });
};

export const siweAuth = async (req, res) => {
    const { address, signature, message, refCode } = req.body;

    try {
        if (!address || !signature || !message) {
            console.warn(`[SIWE DEBUG] Missing parameters:`, { address, signature: !!signature, message: !!message });
            return res.status(400).json({ error: 'Missing authentication parameters' });
        }

        console.log(`[SIWE DEBUG] Attempting Auth for: ${address}`);
        
        // Normalize and Checksum Address
        let checksummedAddress = address;
        try {
            if (address && address.startsWith('0x')) {
                checksummedAddress = getAddress(address);
            }
        } catch (addrErr) {
            console.warn(`[SIWE DEBUG] Address Checksum Failure (Proceeding with raw): ${address}`);
            checksummedAddress = address;
        }

        // 1. Verify Signature
        let isValid = false;
        try {
            isValid = await verifyMessage({
                address: checksummedAddress,
                message,
                signature,
            });
        } catch (vErr) {
            console.error("[SIWE DEBUG] Cryptographic Verification Crash:", vErr.stack);
            return res.status(401).json({ error: 'Invalid signature format or protocol mismatch' });
        }

        console.log(`[SIWE DEBUG] Signature Valid: ${isValid}`);

        if (!isValid) {
            console.warn(`[SIWE] Unauthorized signature for: ${address}`);
            return res.status(401).json({ error: 'Signature verification failed' });
        }

        // 2. Find or Create User (Normalize to Lowercase)
        const normalizedId = address.toLowerCase();
        let userArr = await store.read('users');
        let user = userArr.find(u => u.id.toLowerCase() === normalizedId);
        let isNew = false;

        if (!user) {
            isNew = true;
            console.log(`[SYNDICATE] Initializing new Node: ${normalizedId}`);
            
            const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            let referredBy = null;

            if (refCode && typeof refCode === 'string') {
                const referrer = userArr.find(u => u.referralCode === refCode.toUpperCase());
                if (referrer) {
                    referredBy = referrer.id;
                    const referrerCount = referrer.referralCount || 0;
                    
                    if (referrerCount < 1000) {
                        await store.update('users', u => u.id === referrer.id, r => ({
                            items: (r.items || 0) + 100,
                            referralCount: referrerCount + 1
                        }));
                    }
                }
            }

            user = {
                id: normalizedId,
                email: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
                verifiedWallet: address,
                items: 5000,
                bagTokens: 0,
                referralCode,
                referredBy,
                referralCount: 0,
                tier: 'ULTIMATE', 
                isAdmin: false,
                lastActive: new Date().toISOString()
            };
            await store.create('users', user);
        } else {
            user = await store.update('users', u => u.id.toLowerCase() === normalizedId, u => ({
                lastActive: new Date().toISOString()
            }));
        }

        if (!user) {
            throw new Error(`Critical: User object lost during synchronization for ${address}`);
        }

        const { password: _, ...userSafe } = user;
        const token = jwt.sign({ 
            id: user.id, 
            email: user.email, 
            isAdmin: user.isAdmin,
            wallet: user.verifiedWallet 
        }, config.jwtSecret, { expiresIn: '24h' });

        res.json({ token, user: userSafe, isNew });

    } catch (error) {
        console.error("SIWE Auth Error Stack:", error.stack);
        res.status(500).json({ error: error.message || 'Authentication protocol failure' });
    }
};

export const getReferrals = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });
        
        const users = await store.read('users');
        const referrals = users
            .filter(u => u.referredBy === req.user.id)
            .map(u => ({
                id: u.id,
                email: u.email,
                pointsEarned: 100,
                joinedAt: u.createdAt || u.lastActive
            }));

        res.json(referrals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch network' });
    }
};

export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await store.read('users');
        const user = users.find(u => u.id.toLowerCase() === userId.toLowerCase());
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Remove sensitive data
        const { password, salt, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        console.error('[AUTH] getMe Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req, res) => {
    const { bio, website, location, logoUrl, bannerUrl } = req.body;
    const userId = req.user.id;

    try {
        const updatedUser = await store.update('users', 
            u => u.id.toLowerCase() === userId.toLowerCase(), 
            u => ({
                bio: bio !== undefined ? bio : u.bio,
                website: website !== undefined ? website : u.website,
                location: location !== undefined ? location : u.location,
                logoUrl: logoUrl !== undefined ? logoUrl : u.logoUrl,
                bannerUrl: bannerUrl !== undefined ? bannerUrl : u.bannerUrl,
                updatedAt: new Date().toISOString()
            })
        );

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        const { password, salt, ...safeUser } = updatedUser;
        res.json({ success: true, user: safeUser });
    } catch (error) {
        console.error('[AUTH] updateProfile Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
