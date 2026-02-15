import React, { useState } from 'react';
import { X, Mail, Lock, Briefcase, Github, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loginWithGoogle, loginWithGithub } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) await login(email, password, remember);
      else await register(email, password, remember);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    loginWithGoogle();
    onClose();
  };

  const handleGithub = () => {
    loginWithGithub();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-alphabag-dark border border-alphabag-gray w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative border-t-alphabag-yellow/50">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-alphabag-yellow text-alphabag-black flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(252,213,53,0.3)]">
                  <Briefcase size={22} fill="currentColor" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                Alpha<span className="text-alphabag-yellow">BAG</span> <span className="block text-[10px] text-alphabag-subtext tracking-[0.2em] mt-1 font-bold">Initialize Portfolio Node</span>
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-alphabag-subtext hover:text-white transition-colors bg-alphabag-black/50 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="mb-8 flex p-1 bg-alphabag-black rounded-xl border border-alphabag-gray">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase ${isLogin ? 'bg-alphabag-yellow text-black' : 'text-alphabag-subtext'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all uppercase ${!isLogin ? 'bg-alphabag-yellow text-black' : 'text-alphabag-subtext'}`}
            >
              Create Portfolio
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-alphabag-subtext font-bold uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-subtext" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-alphabag-yellow outline-none transition-all font-bold placeholder:font-normal" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-alphabag-subtext font-bold uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-subtext" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-alphabag-yellow outline-none transition-all font-bold" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <button 
                type="button"
                onClick={() => setRemember(!remember)}
                className="flex items-center space-x-2 group cursor-pointer"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${remember ? 'bg-alphabag-yellow border-alphabag-yellow' : 'border-alphabag-gray group-hover:border-alphabag-subtext'}`}>
                  {remember && <Check size={10} className="text-black font-black" />}
                </div>
                <span className="text-[10px] text-alphabag-subtext font-bold uppercase tracking-widest group-hover:text-alphabag-text">Remember Login</span>
              </button>
              <button type="button" className="text-[10px] text-alphabag-yellow font-bold uppercase tracking-widest hover:underline opacity-60">Reset Access</button>
            </div>

            <Button 
              type="submit" 
              isLoading={isLoading} 
              className="w-full py-4 text-sm font-black tracking-widest shadow-xl mt-4 uppercase"
            >
              {isLogin ? 'Authenticate Node' : 'Start Portfolio'}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-alphabag-gray/50"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-alphabag-dark px-4 text-alphabag-subtext">or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleGoogle}
              className="flex items-center justify-center space-x-2 py-3 bg-alphabag-black border border-alphabag-gray rounded-xl hover:border-white transition-all group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-xs font-bold uppercase">Google</span>
            </button>
            <button 
              onClick={handleGithub}
              className="flex items-center justify-center space-x-2 py-3 bg-alphabag-black border border-alphabag-gray rounded-xl hover:border-white transition-all group"
            >
              <Github size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase">Github</span>
            </button>
          </div>

          <p className="mt-8 text-center text-[9px] text-alphabag-subtext font-bold uppercase tracking-[0.3em] opacity-50">
            AlphaBAG Professional Node Auth Protocol
          </p>
        </div>
      </div>
    </div>
  );
};