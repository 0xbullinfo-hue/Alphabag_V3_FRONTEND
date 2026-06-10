import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, Loader, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { emailLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated as admin, redirect
  React.useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await emailLogin(email, password, 'admin');
      if (success) {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-alphabag-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-alphabag-yellow/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-alphabag-blue/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-alphabag-dark/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-inner">
              <Shield className="text-alphabag-yellow" size={32} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
              Command <span className="text-alphabag-yellow">Portal</span>
            </h1>
            <p className="text-xs text-alphabag-subtext font-medium mt-2 uppercase tracking-widest opacity-60">
              Restricted Access
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-alphabag-subtext font-black uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext/50" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-alphabag-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-alphabag-yellow/50 transition-colors placeholder:text-white/20"
                  placeholder="admin@alphabagpro.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-alphabag-subtext font-black uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext/50" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-alphabag-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-alphabag-yellow/50 transition-colors placeholder:text-white/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-6 bg-gradient-to-r from-alphabag-yellow to-yellow-600 text-black font-black uppercase tracking-[0.2em] rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <>
                  Authenticate <ArrowRight size={16} strokeWidth={3} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[9px] text-alphabag-subtext font-medium opacity-40">
              Unauthorized access attempts will be logged and reported.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
