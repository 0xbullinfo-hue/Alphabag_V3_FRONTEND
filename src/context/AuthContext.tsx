import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { TOKEN_GATING_CONFIG } from '../services/config';

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

  // Beta period: auto-grant ULTIMATE to all users on first login
  useEffect(() => {
    if (user && !user.isPro) {
      const updatedUser = { ...user, isPro: true, tier: 'ULTIMATE' as const };
      setUser(updatedUser);
      sessionStorage.setItem('alphabag_user', JSON.stringify(updatedUser));
    }
  }, [user?.id]); // Only re-run when the user identity changes, not every state update

  // Admin Allowlist - Loaded from Config (Production-Safe)
  const ADMIN_WALLETS = TOKEN_GATING_CONFIG.ADMIN_WALLETS;

  const siweLogin = async (address: string, signature: string, message: string) => {
    try {
      setIsLoading(true);
      
      const { api } = await import('../services/api');
      
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

  useEffect(() => {
    let savedUserStr = sessionStorage.getItem('alphabag_user');
    let savedToken = sessionStorage.getItem('alphabag_token');

    // Auto-login as Admin for Dev Mode if no session exists
    if (!savedUserStr || !savedToken) {
      const mockAdminUser = {
        id: "0x42916a998c6bff7f36be61749bd1bba9f473db96",
        email: "admin@alphabagpro.com",
        verifiedWallet: "0x42916A998c6Bff7F36bE61749Bd1BBA9f473dB96",
        isAdmin: true,
        tier: "ULTIMATE"
      };
      const mockToken = "wallet-auth:0x42916A998c6Bff7F36bE61749Bd1BBA9f473dB96";
      
      sessionStorage.setItem('alphabag_user', JSON.stringify(mockAdminUser));
      sessionStorage.setItem('alphabag_token', mockToken);
      
      savedUserStr = JSON.stringify(mockAdminUser);
      savedToken = mockToken;
    }

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
    const updatedUser: User = { ...user, tier: 'ULTIMATE', verifiedWallet: walletAddress };
    setUser(updatedUser);
    sessionStorage.setItem('alphabag_user', JSON.stringify(updatedUser));
    return true;
  };

  const updateAiUsage = (seconds: number) => {
    if (!user || user.tier === 'ULTIMATE' || user.isPro) return;
    const updated = { ...user, alphaAiUsageSeconds: (user.alphaAiUsageSeconds || 0) + seconds };
    setUser(updated);
  };

  const refreshUser = async () => {
    try {
      const { api } = await import('../services/api');
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
      logout, upgradeToUltimate, updateAiUsage, siweLogin, completeOnboarding, refreshUser
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