
import React, { useEffect, useState } from 'react';
import { Menu, Search, X, TrendingUp, Briefcase, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchGlobalStats } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { TierBadge } from './ui/TierBadge';
import { Button } from './ui/Button';
import { useWeb3Modal } from '@web3modal/wagmi/react';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [stats, setStats] = useState<any>(null);
  const { user, logout, isAuthenticated } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { open } = useWeb3Modal();

  const attemptConnect = async () => {
    try {
      await open();
    } catch (e) {
      console.error("Failed to open Web3Modal", e);
    }
  };

  useEffect(() => {
    fetchGlobalStats().then(setStats);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/markets?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  };

  const handleNavigateToSettings = () => {
    setShowUserMenu(false);
    navigate('/settings');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-alphabag-dark border-b border-alphabag-gray z-50 px-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-4 p-2 rounded-md text-alphabag-subtext hover:text-alphabag-text hover:bg-alphabag-gray md:hidden transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 bg-alphabag-yellow text-alphabag-black flex items-center justify-center rounded-2xl group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(252,213,53,0.3)]">
              <Briefcase size={20} fill="currentColor" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-alphabag-text tracking-tight uppercase">Alpha<span className="text-alphabag-yellow">BAG</span></span>
          </Link>

          {stats && (
            <div className="hidden lg:flex items-center space-x-6 ml-8 text-xs text-alphabag-subtext border-l border-alphabag-gray pl-6">
              <div className="flex flex-col">
                <span className="uppercase tracking-wider font-bold opacity-70 text-[9px]">Market Cap</span>
                <span className="text-alphabag-text font-bold">${(stats.marketCap / 1e12).toFixed(2)}T <span className="text-alphabag-green">+1.2%</span></span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase tracking-wider font-bold opacity-70 text-[9px]">Gas Hub</span>
                <span className="text-alphabag-text font-bold flex items-center"><TrendingUp size={10} className="mr-1 text-alphabag-yellow" /> 12 Gwei</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-alphabag-subtext" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search coin, pair, or contract..."
            className="w-full bg-alphabag-black border border-alphabag-gray text-alphabag-text text-sm rounded-lg focus:ring-1 focus:ring-alphabag-yellow focus:border-alphabag-yellow block pl-10 p-2.5 placeholder:text-alphabag-subtext/50 outline-none"
          />
        </form>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-alphabag-black/50 border border-alphabag-gray px-3 py-1.5 rounded-xl hover:bg-alphabag-gray/20 transition-all"
              >
                <div className="hidden sm:block text-right">
                  <div className="text-[10px] font-black text-white leading-none mb-0.5">{user?.email.split('@')[0]}</div>
                  <div className="text-[8px] font-bold text-alphabag-subtext uppercase tracking-widest">{user?.tier} TIER</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-alphabag-yellow to-orange-500 shadow-inner"></div>
                <ChevronDown size={14} className={`text-alphabag-subtext transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-alphabag-dark border border-alphabag-gray rounded-2xl shadow-2xl p-2 animate-fade-in z-50">
                  <div className="p-4 border-b border-alphabag-gray mb-1">
                    <p className="text-[9px] text-alphabag-subtext font-bold uppercase mb-1 tracking-widest">Authenticated Node</p>
                    <p className="text-xs text-white font-bold truncate">{user?.email}</p>
                    <div className="mt-3">
                      <TierBadge tier={user?.tier || 'FREE'} size="sm" />
                    </div>
                  </div>

                  {user?.isAdmin && (
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/admin'); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-black text-alphabag-yellow hover:bg-alphabag-yellow/5 rounded-xl transition-all flex items-center"
                    >
                      <ShieldCheck size={14} className="mr-2" /> Admin Core Panel
                    </button>
                  )}

                  <button
                    onClick={handleNavigateToSettings}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-alphabag-text hover:bg-alphabag-gray rounded-xl transition-all"
                  >
                    Node Configuration
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); logout(); navigate('/'); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-alphabag-red hover:bg-alphabag-red/5 rounded-xl transition-all flex items-center"
                  >
                    <LogOut size={14} className="mr-2" /> Terminate Link
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => attemptConnect()}
              className="font-black px-6 uppercase tracking-widest"
              leftIcon={<Briefcase size={14} />}
            >
              Start Portfolio
            </Button>
          )}
        </div>
      </header>
    </>
  );
};
