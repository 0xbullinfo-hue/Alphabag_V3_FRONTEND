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
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        const res = await api.get('/api/auth/me');

        if (res.data) {
          let userData = res.data;
          
          setUser(userData);
          setToken(savedToken);
          sessionStorage.setItem('alphabag_user', JSON.stringify(userData));
        } else {
          sessionStorage.removeItem('alphabag_token');
          sessionStorage.removeItem('alphabag_user');
          delete api.defaults.headers.common['Authorization'];
        }
      } catch (err: any) {
        console.error('[AUTH] Session validation failed:', err?.response?.data?.error || err.message);
        sessionStorage.removeItem('alphabag_token');
        sessionStorage.removeItem('alphabag_user');
        delete api.defaults.headers.common['Authorization'];
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
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('alphabag_token');
    sessionStorage.removeItem('alphabag_user');
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