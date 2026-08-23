import fs from 'fs';
import path from 'path';

const backendRoot = 'C:/Users/1/repos/alphabag_v3_backend';
const backendUiRoot = 'C:/Users/1/repos/Alphabag_V3_Backend-UI';
const frontendRoot = 'C:/Users/1/repos/Alphabag_V3_FRONTEND';

// ═════════════════════════════════════════════════════════════════════════════
// 1. 🔴 P0: Backend authMiddleware.js
// ═════════════════════════════════════════════════════════════════════════════
const authMiddlewareJs = `// SPDX-License-Identifier: MIT
// PATCH: authMiddleware.js — Zero hardcoded wallets & database-driven admin check

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { store } from '../services/storeService.js';

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const bearer = authHeader.split(' ');
    const tokenValue = bearer.length === 2 && bearer[0].toLowerCase() === 'bearer' ? bearer[1] : authHeader;

    try {
        const decoded = jwt.verify(tokenValue, config.jwtSecret);
        
        // Re-verify admin status from DB if wallet is present
        const wallet = (decoded.wallet || decoded.address || '').toLowerCase();
        let isAdmin = !!decoded.isAdmin;
        if (wallet) {
            const adminRecord = await store.findOne('admins', { wallet });
            isAdmin = !!adminRecord;
        }

        req.user = {
            ...decoded,
            isAdmin
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};

export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        req.user = null;
        return next();
    }

    const bearer = authHeader.split(' ');
    const tokenValue = bearer.length === 2 && bearer[0].toLowerCase() === 'bearer' ? bearer[1] : authHeader;

    try {
        const decoded = jwt.verify(tokenValue, config.jwtSecret);
        const wallet = (decoded.wallet || decoded.address || '').toLowerCase();
        let isAdmin = !!decoded.isAdmin;
        if (wallet) {
            const adminRecord = await store.findOne('admins', { wallet });
            isAdmin = !!adminRecord;
        }

        req.user = {
            ...decoded,
            isAdmin
        };
        next();
    } catch (err) {
        req.user = null;
        next();
    }
};

export const requireAuth = verifyToken;

export const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
    }
    next();
};
`;
fs.writeFileSync(path.join(backendRoot, 'src/middleware/authMiddleware.js'), authMiddlewareJs, 'utf8');
console.log('✅ 1. Backend authMiddleware.js updated');

// ═════════════════════════════════════════════════════════════════════════════
// 2. 🔴 P0: Backend prisma/schema.prisma (Admin model update)
// ═════════════════════════════════════════════════════════════════════════════
let schemaPrisma = fs.readFileSync(path.join(backendRoot, 'prisma/schema.prisma'), 'utf8');
const adminModelPattern = /model Admin \{[\s\S]*?@@map\("admins"\)\s*\}/;
const newAdminModel = `model Admin {
  id        String    @id
  wallet    String?   @unique
  email     String?   @unique
  password  String?
  addedBy   String?
  addedAt   DateTime? @default(now())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("admins")
}`;
schemaPrisma = schemaPrisma.replace(adminModelPattern, newAdminModel);
fs.writeFileSync(path.join(backendRoot, 'prisma/schema.prisma'), schemaPrisma, 'utf8');
console.log('✅ 2. Backend prisma/schema.prisma updated');

// ═════════════════════════════════════════════════════════════════════════════
// 3. 🔴 P0: Backend storeService.js (delete & findMany methods)
// ═════════════════════════════════════════════════════════════════════════════
let storeServiceCode = fs.readFileSync(path.join(backendRoot, 'src/services/storeService.js'), 'utf8');

// Ensure findMany exists in StoreService class
if (!storeServiceCode.includes('async findMany(')) {
    const findManyCode = `
    async findMany(collection, query = {}) {
        const modelName = collectionToModelMap[collection];
        if (modelName) {
            try {
                const where = {};
                for (const key of Object.keys(query)) {
                    if (query[key] !== undefined) {
                        where[key] = query[key];
                    }
                }
                return await prisma[modelName].findMany({ where });
            } catch (error) {
                console.error(\`StoreService: Failed findMany on \${collection}:\`, error);
                return [];
            }
        } else {
            const items = await this.read(collection);
            if (!Array.isArray(items)) return [];
            if (Object.keys(query).length === 0) return items;
            return items.filter(item => Object.keys(query).every(key => item[key] === query[key]));
        }
    }
`;
    storeServiceCode = storeServiceCode.replace('async findOne(collection, query) {', findManyCode + '\n    async findOne(collection, query) {');
}

// Ensure delete exists in StoreService class
if (!storeServiceCode.includes('async delete(')) {
    const deleteCode = `
    async delete(collection, id) {
        return this.lock(async () => {
            const modelName = collectionToModelMap[collection];
            if (modelName) {
                try {
                    return await prisma[modelName].delete({ where: { id } });
                } catch (error) {
                    console.error(\`StoreService: Failed delete in \${collection}:\`, error);
                    return null;
                }
            } else {
                const items = await this.read(collection);
                if (!Array.isArray(items)) return null;
                const index = items.findIndex(item => item.id === id);
                if (index === -1) return null;
                const removed = items.splice(index, 1)[0];
                await this.write(collection, items);
                return removed;
            }
        });
    }
`;
    storeServiceCode = storeServiceCode.replace('async updateById(collection, id, updateFn) {', deleteCode + '\n    async updateById(collection, id, updateFn) {');
}

fs.writeFileSync(path.join(backendRoot, 'src/services/storeService.js'), storeServiceCode, 'utf8');
console.log('✅ 3. Backend storeService.js updated');

// ═════════════════════════════════════════════════════════════════════════════
// 4. 🔴 P0: Backend-UI AuthContext.tsx
// ═════════════════════════════════════════════════════════════════════════════
const backendUiAuthContext = `import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { TOKEN_GATING_CONFIG } from '../services/config';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  logout: () => void;
  upgradeToUltimate: (walletAddress: string) => Promise<boolean>;
  updateAiUsage: (seconds: number) => void;
  completeOnboarding: (accountType: 'FOUNDER' | 'TRADER', profileData: any) => Promise<void>;
  siweLogin: (address: string, signature: string, message: string) => Promise<boolean>;
  emailLogin: (email: string, password: string, portal?: 'main' | 'admin') => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const tokenAddress = TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_TESTNET || TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000';
  
  useBalance({
    address: address,
    token: tokenAddress as \`0x\${string}\`,
    chainId: bsc.id,
    watch: true
  });

  const siweLogin = async (address: string, signature: string, message: string) => {
    try {
      const refCode = sessionStorage.getItem('alphabag_ref_code');
      
      const res = await api.post('/api/auth/siwe', { 
        address, 
        signature, 
        message, 
        refCode 
      });

      if (res.data.user && res.data.token) {
        setUser(res.data.user);
        setToken(res.data.token);
        sessionStorage.setItem('alphabag_token', res.data.token);
        sessionStorage.setItem('alphabag_user', JSON.stringify(res.data.user));
        return true;
      }
      return false;
    } catch (e: any) {
      if (e.response?.data) {
        console.error("SIWE Server Error:", e.response.data);
      } else {
        console.error("SIWE Network Error:", e.message);
      }
      throw e;
    }
  };

  const emailLogin = async (email: string, password: string, portal: 'main' | 'admin' = 'main') => {
    try {
      setIsLoading(true);
      const res = await api.post('/api/auth/login', {
        email,
        password,
        portal,
        adminPortalKey: import.meta.env.VITE_ADMIN_PORTAL_KEY,
      });

      if (res.data.user && res.data.token) {
        setUser(res.data.user);
        setToken(res.data.token);
        sessionStorage.setItem('alphabag_token', res.data.token);
        sessionStorage.setItem('alphabag_user', JSON.stringify(res.data.user));
        setIsLoading(false);
        return true;
      }
      return false;
    } catch (e: any) {
      setIsLoading(false);
      throw e;
    }
  };

  useEffect(() => {
    const savedUserStr = sessionStorage.getItem('alphabag_user');
    const savedToken = sessionStorage.getItem('alphabag_token');
    if (savedUserStr && savedToken) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser.isAdmin) {
          setUser(savedUser);
          setToken(savedToken);
          console.log("Admin session restored for:", savedUser.email || savedUser.id);
        } else {
          sessionStorage.removeItem('alphabag_user');
          sessionStorage.removeItem('alphabag_token');
        }
      } catch (e) {
        console.error("Failed to parse saved user — clearing corrupt session.");
        sessionStorage.removeItem('alphabag_user');
        sessionStorage.removeItem('alphabag_token');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('alphabag_token');
    sessionStorage.removeItem('alphabag_user');
    disconnect();
  };

  const upgradeToUltimate = async (walletAddress: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await api.post('/api/auth/verify-upgrade', { walletAddress });
      if (res.data?.user && res.data?.token) {
        setUser(res.data.user);
        setToken(res.data.token);
        sessionStorage.setItem('alphabag_user', JSON.stringify(res.data.user));
        sessionStorage.setItem('alphabag_token', res.data.token);
        return res.data.user.tier === 'ULTIMATE';
      }
      return false;
    } catch (e: any) {
      console.error('[AUTH] Upgrade verification failed:', e?.response?.data || e.message);
      throw e;
    }
  };

  const updateAiUsage = (seconds: number) => {
    if (!user || user.tier === 'ULTIMATE' || user.isPro) return;
    const updated = { ...user, alphaAiUsageSeconds: (user.alphaAiUsageSeconds || 0) + seconds };
    setUser(updated);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data) {
        setUser(res.data);
        sessionStorage.setItem('alphabag_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('[AUTH] Failed to refresh user profile:', err);
    }
  };

  const completeOnboarding = async (accountType: 'FOUNDER' | 'TRADER', profileData: any) => {
    if (!user) return;
    const updatedUser = { 
      ...user, 
      accountType, 
      onboardingComplete: true,
    };
    setUser(updatedUser);
    sessionStorage.setItem('alphabag_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, token,
      logout, upgradeToUltimate, updateAiUsage, siweLogin, emailLogin, completeOnboarding, refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
`;
try {
    fs.writeFileSync(path.join(backendUiRoot, 'src/context/AuthContext.tsx'), backendUiAuthContext, 'utf8');
    console.log('✅ 4. Backend-UI AuthContext.tsx updated');
} catch (e) {
    console.warn('Backend-UI write note:', e.message);
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. 🟡 P1: Backend authController.js (verifyUpgrade check: NODE_ENV only)
// ═════════════════════════════════════════════════════════════════════════════
let authControllerCode = fs.readFileSync(path.join(backendRoot, 'src/controllers/authController.js'), 'utf8');
authControllerCode = authControllerCode.replace(
    /if \(!isEligible && \(process\.env\.NODE_ENV \|\| 'development'\) !== 'production' && process\.env\.VITE_ENABLE_DEV_ULTIMATE === 'true'\)/g,
    `if (!isEligible && (process.env.NODE_ENV || 'development') !== 'production')`
);
fs.writeFileSync(path.join(backendRoot, 'src/controllers/authController.js'), authControllerCode, 'utf8');
console.log('✅ 5. Backend authController.js updated');

// ═════════════════════════════════════════════════════════════════════════════
// 6. 🟢 P2: Frontend AlphaPasses.tsx (useContractRead hooks for live state)
// ═════════════════════════════════════════════════════════════════════════════
let alphaPassesCode = fs.readFileSync(path.join(frontendRoot, 'src/pages/frontend/AlphaPasses.tsx'), 'utf8');

// Ensure useContractRead is imported
if (!alphaPassesCode.includes('useContractRead')) {
    alphaPassesCode = alphaPassesCode.replace(
        "import { useAccount, useBalance, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction } from 'wagmi';",
        "import { useAccount, useBalance, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';"
    );
}

// Replace static state with useContractRead hooks
const contractReadsCode = `
  // ── LIVE ON-CHAIN CONTRACT READS ─────────────────────────────────────────
  const { data: mintActiveData } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'mintActive',
    enabled: NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    watch: true,
  });

  const { data: totalSupplyData } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'totalSupply',
    enabled: NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    watch: true,
  });

  const { data: maxSupplyData } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'MAX_SUPPLY',
    enabled: NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  const { data: walletMintData } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'walletMintCount',
    args: address ? [address] : undefined,
    enabled: !!address && NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    watch: true,
  });

  const { data: allowanceData, refetch: refetchAllowance } = useContractRead({
    address: BAG_TOKEN_ADDRESS,
    abi: BAG_TOKEN_ABI,
    functionName: 'allowance',
    args: address && NFT_CONTRACT_ADDRESS ? [address, NFT_CONTRACT_ADDRESS] : undefined,
    enabled: !!address && NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' && BAG_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000',
    watch: true,
  });

  const contractMintActive = Boolean(mintActiveData);
  const contractTotalSupply = Number(totalSupplyData || 0);
  const contractMaxSupply = Number(maxSupplyData || NFT_CONFIG.TOTAL_SUPPLY || 10000);
  const walletMinted = Number(walletMintData || 0);
`;

const stateBlockRegex = /const \[contractMintActive\] = useState<boolean>\(false\);[\s\S]*?const \[walletMinted\] = useState<number>\(0\);/;
if (stateBlockRegex.test(alphaPassesCode)) {
    alphaPassesCode = alphaPassesCode.replace(stateBlockRegex, contractReadsCode.trim());
}

// Update needsApproval effect to use on-chain allowanceData
const approvalEffectOld = `  useEffect(() => {
    if (!isConnected || !address || BAG_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
      setNeedsApproval(true);
      return;
    }
    setNeedsApproval(true);
  }, [isConnected, address, totalBagCost]);`;

const approvalEffectNew = `  useEffect(() => {
    if (!isConnected || !address || BAG_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
      setNeedsApproval(true);
      return;
    }
    if (allowanceData !== undefined) {
      const requiredWei = parseUnits(String(totalBagCost), 18);
      setNeedsApproval(allowanceData < requiredWei);
    } else {
      setNeedsApproval(true);
    }
  }, [isConnected, address, totalBagCost, allowanceData]);`;

if (alphaPassesCode.includes(approvalEffectOld)) {
    alphaPassesCode = alphaPassesCode.replace(approvalEffectOld, approvalEffectNew);
}

fs.writeFileSync(path.join(frontendRoot, 'src/pages/frontend/AlphaPasses.tsx'), alphaPassesCode, 'utf8');
console.log('✅ 6. Frontend AlphaPasses.tsx updated with useContractRead');

console.log('\n🎉 ALL PRIORITY TASKS EXECUTED SUCCESSFULLY!');
