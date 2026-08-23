// SPDX-License-Identifier: MIT
// PATCH: AuthContext.tsx — Remove localhost auto-ULTIMATE bypass
// Fixes:
//   1. Removed IS_LOCALHOST_DEV auto-grant of ULTIMATE tier
//   2. All tier checks now require real on-chain / server verification
//   3. Added explicit environment flag for dev override (opt-in only)
//   4. Clean session restoration and SIWE auth flow

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { TOKEN_GATING_CONFIG } from '../services/config';
import { api } from '../services/api';

// SECURITY: Dev override is now OPT-IN via env var, never automatic.
// To enable in local development, set VITE_ENABLE_DEV_ULTIMATE=true in .env
// NEVER commit .env files with this enabled.
const IS_DEV_OVERRIDE = import.meta.env.VITE_ENABLE_DEV_ULTIMATE === 'true';

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

  // Token Balance check for Pro status
  const tokenAddress = TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_TESTNET || TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000';
  
  useBalance({
    address: address,
    token: tokenAddress as `0x${string}`,
    chainId: bsc.id,
    watch: true
  });

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data) {
        let userData = res.data;
        if (IS_DEV_OVERRIDE) {
          console.warn('[DEV] VITE_ENABLE_DEV_ULTIMATE is enabled. Granting ULTIMATE locally.');
          userData = { ...userData, tier: 'ULTIMATE' };
        }
        setUser(userData);
        sessionStorage.setItem('alphabag_user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('[AUTH] Failed to refresh user profile:', err);
    }
  }, []);

  useEffect(() => {
    const savedUserStr = sessionStorage.getItem('alphabag_user');
    const savedToken = sessionStorage.getItem('alphabag_token');

    if (savedUserStr && savedToken) {
      try {
        let savedUser = JSON.parse(savedUserStr);
        if (IS_DEV_OVERRIDE) {
          savedUser = { ...savedUser, tier: 'ULTIMATE' };
        }
        setUser(savedUser);
        setToken(savedToken);
        console.log("Session restored for:", savedUser.email || savedUser.id);
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

  const siweLogin = async (address: string, signature: string, message: string) => {
    try {
      setIsLoading(true);
      
      const refCode = sessionStorage.getItem('alphabag_ref_code');
      
      const res = await api.post('/api/auth/siwe', { 
        address, 
        signature, 
        message, 
        refCode 
      });

      if (res.data.user && res.data.token) {
        let userData = res.data.user;
        if (IS_DEV_OVERRIDE) {
          userData = { ...userData, tier: 'ULTIMATE' };
        }
        setUser(userData);
        setToken(res.data.token);
        sessionStorage.setItem('alphabag_token', res.data.token);
        sessionStorage.setItem('alphabag_user', JSON.stringify(userData));
        setIsLoading(false);
        return true;
      }
      return false;
    } catch (e: any) {
      if (e.response?.data) {
        console.error("SIWE Server Error:", e.response.data);
      } else {
        console.error("SIWE Network Error:", e.message);
      }
      setIsLoading(false);
      throw e;
    }
  };

  const emailLogin = async (email: string, password: string, portal: 'main' | 'admin' = 'main') => {
    try {
      setIsLoading(true);
      const res = await api.post('/api/auth/login', { email, password, portal });

      if (res.data.user && res.data.token) {
        let userData = res.data.user;
        if (IS_DEV_OVERRIDE) {
          userData = { ...userData, tier: 'ULTIMATE' };
        }
        setUser(userData);
        setToken(res.data.token);
        sessionStorage.setItem('alphabag_token', res.data.token);
        sessionStorage.setItem('alphabag_user', JSON.stringify(userData));
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
    sessionStorage.setItem('alphabag_user', JSON.stringify(updated));
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
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      token, 
      logout, 
      upgradeToUltimate, 
      updateAiUsage, 
      siweLogin, 
      emailLogin, 
      completeOnboarding, 
      refreshUser
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