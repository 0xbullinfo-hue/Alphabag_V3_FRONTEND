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

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Token Balance check for Pro status
  const tokenAddress = TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_TESTNET || TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000';
  
  const { data: bagBalance } = useBalance({
    address: address,
    token: tokenAddress as `0x${string}`,
    chainId: bsc.id,
    watch: true
  });

  // Tier and Pro status are decided entirely server-side and arrive on `user`
  // from /api/auth/siwe, /api/auth/login, and /api/auth/me. Do NOT locally
  // override them here — a client-side auto-upgrade defeats the paywall for
  // every user, since PremiumLock and wallet-tier limits both key off this
  // value. If you need a temporary beta promotion, do it in the backend
  // auth response, not in the frontend.

  // Admin status is evaluated entirely on the server side via JWT roles.
  const siweLogin = async (address: string, signature: string, message: string) => {
    try {
      setIsLoading(true);
      
      // Get referral code if exists
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
    let savedUserStr = sessionStorage.getItem('alphabag_user');
    let savedToken = sessionStorage.getItem('alphabag_token');

    if (savedUserStr && savedToken) {
      try {
        const savedUser = JSON.parse(savedUserStr);
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
    } else if (import.meta.env.DEV && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)) {
      // Localhost dev review session for dashboard inspection
      const devUser: User = {
        id: 'dev_user_001',
        email: 'dev@alphabag.com',
        tier: 'ULTIMATE',
        createdAt: new Date().toISOString()
      };
      setUser(devUser);
      setToken('mock_dev_jwt_token');
      sessionStorage.setItem('alphabag_user', JSON.stringify(devUser));
      sessionStorage.setItem('alphabag_token', 'mock_dev_jwt_token');
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []); // Run only once on mount

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('alphabag_token');
    sessionStorage.removeItem('alphabag_user');
    disconnect();
  };

  const upgradeToUltimate = async (walletAddress: string): Promise<boolean> => {
    if (!user) return false;

    // IMPORTANT: This must be verified server-side. The backend needs to
    // independently read the BAG token balance for `walletAddress` on-chain
    // (viem/ethers against BSC, NOT trust a client-supplied balance) and
    // only then issue a new JWT/user record with tier: 'ULTIMATE'.
    // Previously this function set tier locally with no verification at
    // all, which meant clicking "Upgrade" granted Ultimate access to any
    // user regardless of actual token holdings. Do not revert to that.
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
      throw e; // Let the caller (UpgradeModal) surface a real error to the user.
    }
  };

  const updateAiUsage = (seconds: number) => {
    if (!user || user.tier === 'ULTIMATE' || user.isPro) return;
    const updated = { ...user, alphaAiUsageSeconds: (user.alphaAiUsageSeconds || 0) + seconds };
    setUser(updated);
    // Must persist immediately — otherwise a page refresh resets usage to 0
    // and free-tier users get unlimited AlphaAI simply by reloading.
    sessionStorage.setItem('alphabag_user', JSON.stringify(updated));
    // Server is the source of truth for enforcement; this local counter is
    // only for optimistic UI. The backend must independently track and cap
    // usage per-user (e.g. on the AI request endpoint) since a determined
    // user can still clear sessionStorage. Do not rely on this value alone
    // to gate access server-side.
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
    
    // Simulate API update
    const updatedUser = { 
      ...user, 
      accountType, 
      onboardingComplete: true,
      // In a real app, profileData would be saved to DB/linked Project
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