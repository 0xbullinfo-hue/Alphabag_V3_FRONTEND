
import React, { useEffect, useState } from 'react';
import { Menu, Search, X, TrendingUp, Briefcase, LogOut, ChevronDown, ShieldCheck, Layers, Settings, Bell, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchGlobalStats } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { TierBadge } from '../ui/TierBadge';
import { Button } from '../ui/Button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { NotificationCenter } from './NotificationCenter';
import { useWallet } from '../../context/WalletContext';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}


export const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [stats, setStats] = useState<any>(null);
  const { user, logout, isAuthenticated } = useAuth();
  const { portfolioItems } = useWallet();
  const [cexTotal, setCexTotal] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: '1',
      type: 'SYSTEM',
      title: 'Phase 1 Active',
      message: 'AlphaBAG Protocol Hub is live. Complete missions to secure your TGE allocation.',
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);
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
    
    // Calculate CEX Total
    const savedCex = localStorage.getItem('alphabag_cex_connections');
    if (savedCex) {
        try {
            const parsed = JSON.parse(savedCex);
            const total = parsed.reduce((acc: number, item: any) => acc + (item.balance || 0), 0);
            setCexTotal(total);
        } catch (e) { console.error("Error parsing CEX data in Header", e); }
    }
  }, []);

  const dexTotal = portfolioItems?.reduce((acc, item) => acc + (item.value || 0), 0) || 0;
  const totalAssets = dexTotal + cexTotal;

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
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#181a20] border-b border-[#2b3139] z-[60] px-6 flex items-center justify-between transition-all">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-4 p-2 rounded-md text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] md:hidden transition-all duration-200"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="flex items-center space-x-2 group">
            <img src="/logo.png" alt="AlphaBAG Logo" className="w-8 h-8 object-contain rounded-full group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold text-[#eaecef] tracking-tight">AlphaBAG</span>
          </Link>

          <nav className="hidden md:flex items-center ml-10 space-x-8">

            <Link to="/markets" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-alphabag-muted hover:text-white transition-colors">
              Markets
            </Link>
            <Link to="/airdrop" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-alphabag-muted hover:text-white transition-colors">
              EARN
            </Link>
          </nav>

          {isAuthenticated && (
            <div className="hidden lg:flex items-center space-x-6 ml-8 text-xs text-alphabag-subtext border-l border-white/10 pl-6">
              <div className="flex flex-col bg-alphabag-black/50 rounded-2xl px-4 py-2 border border-white/10 shadow-glow-yellow">
                <span className="uppercase tracking-[0.2em] font-semibold opacity-80 text-[9px] flex items-center gap-1"><Briefcase size={10} className="text-alphabag-yellow"/> Total Holding Assets</span>
                <span className="text-white font-bold tabular-nums text-[13px]">${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-[#848e9c]" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search coin, pair, or contract..."
            className="w-full bg-[#1e2329] border border-[#2b3139] text-[#eaecef] text-sm rounded-md focus:border-[#fcd535] focus:ring-1 focus:ring-[#fcd535] block pl-10 p-2 outline-none transition-all duration-200"
          />
        </form>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowUserMenu(false);
                    }}
                    className={`p-2 rounded-xl transition-all duration-300 active:scale-[0.98] relative ${showNotifications ? 'bg-alphabag-yellow/10 text-alphabag-yellow shadow-[0_0_15px_rgba(252,213,53,0.3)]' : 'bg-transparent text-alphabag-muted hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'}`}
                >
                    <Bell size={20} />
                    {notifications.some(n => !n.read) && (
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-alphabag-red rounded-full border-2 border-alphabag-black animate-pulse"></div>
                    )}
                </button>

                <button
                    onClick={() => {
                        setShowUserMenu(!showUserMenu);
                        setShowNotifications(false);
                    }}
                    className="flex items-center space-x-3 bg-transparent px-3 py-1.5 rounded-md hover:bg-[#2b3139] transition-all duration-300"
                >
                    <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-[#eaecef] leading-none mb-0.5">{user?.email?.split('@')[0]}</div>
                    <div className="text-[10px] font-medium text-[#fcd535] uppercase">Verified</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fcd535] to-orange-500"></div>
                    <ChevronDown size={14} className={`text-[#848e9c] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <NotificationCenter 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                notifications={notifications} 
              />

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1e2329] border border-[#2b3139] rounded-lg shadow-lg p-2 animate-fade-in z-[100]">
                  <div className="p-4 border-b border-[#2b3139] mb-1">
                    <p className="text-[10px] text-[#848e9c] font-medium uppercase mb-1">Account</p>
                    <p className="text-sm text-[#eaecef] font-medium truncate">{user?.email}</p>
                    <div className="mt-2">
                      <span className="px-2 py-1 bg-[#fcd535]/10 text-[#fcd535] text-[10px] font-medium rounded-md">
                        Standard User
                      </span>
                    </div>
                  </div>


                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-50 hover:bg-white/5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center mb-1 group"
                  >
                    <div className="mr-2 p-1.5 bg-alphabag-yellow/10 rounded-lg group-hover:bg-alphabag-yellow text-alphabag-yellow group-hover:text-black transition-colors">
                      <Briefcase size={14} />
                    </div>
                    My Timeline
                  </button>

                  <button
                    onClick={handleNavigateToSettings}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-50 hover:bg-white/5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center mb-1 group"
                  >
                    <div className="mr-2 p-1.5 bg-white/5 rounded-lg group-hover:bg-white/20 transition-colors">
                      <Settings size={14} />
                    </div>
                    Hub Settings
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); logout(); navigate('/'); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-alphabag-red hover:bg-alphabag-red/10 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center"
                  >
                    <LogOut size={14} className="mr-2" /> Disconnect Hub
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/settings')}
              className="font-black px-6 uppercase tracking-widest transition-all duration-200 active:scale-[0.98]"
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
