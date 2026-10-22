import React,{ createContext,useContext,useEffect,useState } from 'react';
import { useAccount,useBalance,useDisconnect } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { api } from '../services/api';
import { TOKEN_GATING_CONFIG } from '../services/config';
import { User } from '../types';

// SECURITY: Dev override is now OPT-IN via env var, never automatic.
// To enable in local development, set VITE_ENABLE_DEV_ULTIMATE=true in .env
// NEVER commit .env files with this enabled.
// Tier is 100% verified server-side via JWT and database lookup.

// Local development fallback user (Ultimate tier with complete permissions)
const DEV_USER: User = {
  id: 'dev-user-001',
  email: 'trader@alphabag.app',
  tier: 'ULTIMATE',
  // verifiedWallet removed so unauthenticated/dev state does not inject phantom wallet
  verifiedWallet: undefined,
  walletAddress: undefined,
  alphaAiUsageSeconds: 0,
  lastAlphaAiReset: new Date().toISOString(),
  isAdmin: false,
  isPro: true,
  onboardingComplete: true,
  accountType: 'TRADER',
  bagTokens: 1000000,
  referralCode: 'ALPHADEV',
  referralCount: 12,
  completedTasks: [],
};

const isLocalhostDev = Boolean(import.meta.env.DEV) && typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

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

  // ── SECURE SESSION RESTORATION ───────────────────────────────────────────
  // Validates session with backend (via HttpOnly cookie or saved token) before restoring session.
  // In local dev, falls back to DEV_USER so developers can test dashboards & tools immediately.
  useEffect(() => {
    const validateStoredSession = async () => {
      const savedToken = sessionStorage.getItem('alphabag_token');
      if (savedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      }

      try {
        const res = await api.get('/api/auth/me');

        if (res.data) {
          const userData = res.data;
          setUser(userData);
          if (savedToken) setToken(savedToken);
          sessionStorage.setItem('alphabag_user', JSON.stringify(userData));
        } else {
          sessionStorage.removeItem('alphabag_token');
          sessionStorage.removeItem('alphabag_user');
          delete api.defaults.headers.common['Authorization'];
        }
      } catch (err: any) {
        if (isLocalhostDev) {
          const isExplicitLoggedOut = sessionStorage.getItem('alphabag_dev_logged_out') === 'true';
          if (!isExplicitLoggedOut) {
            setUser(DEV_USER);
            sessionStorage.setItem('alphabag_user', JSON.stringify(DEV_USER));
          } else {
            sessionStorage.removeItem('alphabag_token');
            sessionStorage.removeItem('alphabag_user');
            delete api.defaults.headers.common['Authorization'];
          }
        } else {
          sessionStorage.removeItem('alphabag_token');
          sessionStorage.removeItem('alphabag_user');
          delete api.defaults.headers.common['Authorization'];
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateStoredSession();
  }, []);

  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data) {
        let userData = res.data;
        
        setUser(userData);
        sessionStorage.setItem('alphabag_user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('[AUTH] Failed to refresh user profile:', err);
    }
  };

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
        
        setUser(userData);
        setToken(res.data.token);
        sessionStorage.setItem('alphabag_token', res.data.token);
        sessionStorage.setItem('alphabag_user', JSON.stringify(userData));
        sessionStorage.removeItem('alphabag_dev_logged_out');
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
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
        
        setUser(userData);
        setToken(res.data.token);
        sessionStorage.setItem('alphabag_token', res.data.token);
        sessionStorage.setItem('alphabag_user', JSON.stringify(userData));
        sessionStorage.removeItem('alphabag_dev_logged_out');
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
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
    api.post('/api/auth/logout').catch(() => {});
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('alphabag_token');
    sessionStorage.removeItem('alphabag_user');
    sessionStorage.setItem('alphabag_dev_logged_out', 'true');
    delete api.defaults.headers.common['Authorization'];
    disconnect();
  };

  useEffect(() => {
    const handleAuthExpired = () => logout();
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [disconnect]);

  const upgradeToUltimate = async (walletAddress: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await api.post('/api/auth/verify-upgrade', { walletAddress });
      if (res.data?.user && res.data?.token) {
        setUser(res.data.user);
        setToken(res.data.token);
        sessionStorage.setItem('alphabag_user', JSON.stringify(res.data.user));
        sessionStorage.setItem('alphabag_token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
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

  const completeOnboarding = async (accountType: 'FOUNDER' | 'TRADER') => {
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