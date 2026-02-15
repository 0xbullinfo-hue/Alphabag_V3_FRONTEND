import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useAccount, useDisconnect } from 'wagmi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, pass: string, remember: boolean) => Promise<void>;
  register: (email: string, pass: string, remember: boolean) => Promise<void>;
  loginWithGoogle: () => void;
  loginWithGithub: () => void;
  logout: () => void;
  upgradeToUltimate: (walletAddress: string) => Promise<boolean>;
  updateAiUsage: (seconds: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Admin Allowlist (Add your wallet address here)
  const ADMIN_WALLETS = [
    '0x1234567890123456789012345678901234567890', // Placeholder
    // Add User's Wallet Here
  ];

  // Auto-login with wallet: Aggressive Polling for Address
  useEffect(() => {
    const checkLogin = () => {
      // If we have an address but no user session, LOG IN IMMEDIATELY
      if (address && !user && !isLoading) {
        console.log("Auto-login triggered for:", address);

        const isWhitelistedAdmin = ADMIN_WALLETS.includes(address) || ADMIN_WALLETS.some(a => a.toLowerCase() === address.toLowerCase());

        const walletUser: User = {
          id: address,
          email: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
          tier: isWhitelistedAdmin ? 'ULTIMATE' : 'FREE',
          alphaAiUsageSeconds: 0,
          lastAlphaAiReset: new Date().toISOString(),
          isAdmin: isWhitelistedAdmin,
          verifiedWallet: address
        };

        setUser(walletUser);
        setToken('wallet-auth-token');
        sessionStorage.setItem('alphabag_token', 'wallet-auth-token');
        sessionStorage.setItem('alphabag_user', JSON.stringify(walletUser));
        setIsLoading(false);
      }
    };

    const interval = setInterval(checkLogin, 1000); // Check every 1s
    checkLogin(); // Run immediately

    return () => clearInterval(interval);
  }, [address, user, isLoading]);

  // Session Restoration
  useEffect(() => {
    const savedToken = localStorage.getItem('alphabag_token') || sessionStorage.getItem('alphabag_token');
    const savedUser = localStorage.getItem('alphabag_user') || sessionStorage.getItem('alphabag_user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        const lastReset = new Date(parsed.lastAlphaAiReset).getTime();
        const now = new Date().getTime();

        if (now - lastReset > 24 * 60 * 60 * 1000) {
          parsed.alphaAiUsageSeconds = 0;
          parsed.lastAlphaAiReset = new Date().toISOString();
          const storage = localStorage.getItem('alphabag_token') ? localStorage : sessionStorage;
          storage.setItem('alphabag_user', JSON.stringify(parsed));
        }

        setToken(savedToken);
        setUser(parsed);
      } catch (e) {
        console.error("Session restoration failed", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string, remember: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setToken(data.token);
      setUser(data.user);

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('alphabag_token', data.token);
      storage.setItem('alphabag_user', JSON.stringify(data.user));
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, remember: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setToken(data.token);
      setUser(data.user);

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('alphabag_token', data.token);
      storage.setItem('alphabag_user', JSON.stringify(data.user));
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = () => {
    performLogin('admin@alphabag.pro', true);
  };

  const loginWithGithub = () => {
    performLogin('dev@alphabag.pro', true);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('alphabag_token');
    localStorage.removeItem('alphabag_user');
    sessionStorage.removeItem('alphabag_token');
    sessionStorage.removeItem('alphabag_user');
    disconnect();
    window.location.reload();
  };

  const upgradeToUltimate = async (walletAddress: string): Promise<boolean> => {
    if (!user) return false;
    const updatedUser: User = { ...user, tier: 'ULTIMATE', verifiedWallet: walletAddress };
    setUser(updatedUser);

    sessionStorage.setItem('alphabag_user', JSON.stringify(updatedUser));
    const currentStorage = localStorage.getItem('alphabag_token') ? localStorage : sessionStorage;
    currentStorage.setItem('alphabag_user', JSON.stringify(updatedUser));

    return true;
  };

  const updateAiUsage = (seconds: number) => {
    if (!user || user.tier === 'ULTIMATE') return;
    const updated = { ...user, alphaAiUsageSeconds: user.alphaAiUsageSeconds + seconds };
    setUser(updated);
    const storage = localStorage.getItem('alphabag_token') ? localStorage : sessionStorage;
    storage.setItem('alphabag_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, token,
      login, register, loginWithGoogle, loginWithGithub, logout, upgradeToUltimate, updateAiUsage
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