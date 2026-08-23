import fs from 'fs';
import path from 'path';

const backendUiFile = 'C:/Users/1/repos/Alphabag_V3_Backend-UI/src/context/AuthContext.tsx';

const content = `// SPDX-License-Identifier: MIT
// PATCH: AuthContext.tsx — Secure session restoration
// Fixes:
//   1. Validates stored token via /api/auth/me on mount before restoring session
//   2. Only restores admin session if backend confirms isAdmin
//   3. Auto-clears invalid/expired sessions
//   4. Shows loading state during validation to prevent UI flash

import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // ── SECURE SESSION RESTORATION ───────────────────────────────────────────
  // Validates stored token with backend before restoring session.
  // Prevents UI leak from manually edited sessionStorage.
  useEffect(() => {
    const validateStoredSession = async () => {
      const savedToken = sessionStorage.getItem('alphabag_token');

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Set token for the validation request
        api.defaults.headers.common['Authorization'] = \`Bearer \${savedToken}\`;

        const res = await api.get('/api/auth/me');

        if (res.data && res.data.isAdmin) {
          // Backend confirmed admin status — safe to restore
          setUser(res.data);
          setToken(savedToken);
          console.log('[AUTH] Admin session validated and restored for:', res.data.email || res.data.id);
        } else {
          // Token valid but not admin, or user no longer admin — clear session
          console.warn('[AUTH] Stored session invalid or user is not admin. Clearing.');
          sessionStorage.removeItem('alphabag_user');
          sessionStorage.removeItem('alphabag_token');
          delete api.defaults.headers.common['Authorization'];
        }
      } catch (err: any) {
        // Token expired, invalid, or backend error — clear everything
        console.error('[AUTH] Session validation failed:', err?.response?.data?.error || err.message);
        sessionStorage.removeItem('alphabag_user');
        sessionStorage.removeItem('alphabag_token');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };

    validateStoredSession();
  }, []);

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
        api.defaults.headers.common['Authorization'] = \`Bearer \${res.data.token}\`;
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
        api.defaults.headers.common['Authorization'] = \`Bearer \${res.data.token}\`;
        setIsLoading(false);
        return true;
      }
      return false;
    } catch (e: any) {
      setIsLoading(false);
      throw e;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('alphabag_token');
    sessionStorage.removeItem('alphabag_user');
    delete api.defaults.headers.common['Authorization'];
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
        api.defaults.headers.common['Authorization'] = \`Bearer \${res.data.token}\`;
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

fs.writeFileSync(backendUiFile, content, 'utf8');
console.log('✅ Backend-UI AuthContext.tsx written successfully');
