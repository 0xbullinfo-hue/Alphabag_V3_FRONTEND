import { Bell,Briefcase,ChevronDown,LogOut,Menu,Search,Settings,X } from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import { Link,useLocation,useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IS_TEASER_MODE } from '../../services/config';
import { Button } from '../ui/Button';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications] = useState<any[]>([
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
  const location = useLocation();
  useEffect(() => {
    if (IS_TEASER_MODE && !['/', '/airdrop'].includes(location.pathname)) {
      navigate('/');
      return;
    }

  }, [location.pathname, navigate]);

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
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0e16]/90 backdrop-blur-xl border-b border-white/5 z-[60] px-4 flex items-center justify-between transition-all shadow-lg">
        <div className="flex items-center flex-1">
          <button
            onClick={toggleSidebar}
            className="mr-3 p-2 rounded-lg text-alphabag-subtext hover:text-white hover:bg-white/5 md:hidden transition-all duration-200"
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="flex items-center space-x-2.5 group">
            <img src="/logo.png" alt="AlphaBAG Logo" className="w-7 h-7 object-contain rounded-full group-hover:scale-105 transition-transform shadow-md" />
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-alphabag-yellow tracking-wider">ALPHABAG</span>
              <span className="hidden sm:inline-block text-[9px] font-bold text-alphabag-subtext bg-white/5 px-1.5 py-0.5 rounded border border-white/10 uppercase">v3.0</span>
            </div>
          </Link>
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={15} className="text-alphabag-subtext" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search coin, pair, or contract..."
            className="w-full bg-[#080b11] border border-white/10 text-alphabag-text text-xs rounded-xl focus:border-alphabag-yellow/50 focus:ring-1 focus:ring-alphabag-yellow/30 block pl-9 pr-3 py-2 outline-none transition-all duration-200 placeholder:text-alphabag-subtext/50"
          />
        </form>

        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowUserMenu(false);
                    }}
                    className={`p-2 rounded-xl transition-all duration-300 active:scale-[0.98] relative ${showNotifications ? 'bg-alphabag-yellow/10 text-alphabag-yellow ' : 'bg-transparent text-alphabag-muted hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'}`}
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
                    className="flex items-center space-x-2 bg-transparent px-3 py-1.5 rounded-md hover:bg-alphabag-gray transition-all duration-300"
                >
                    <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-alphabag-text leading-none mb-0.5">{user?.email?.split('@')[0]}</div>
                    <div className="text-[10px] font-medium text-alphabag-yellow uppercase">Verified</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-alphabag-yellow to-orange-500"></div>
                    <ChevronDown size={14} className={`text-alphabag-subtext transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <NotificationCenter 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                notifications={notifications} 
              />

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-alphabag-darkgray border border-alphabag-gray rounded-lg shadow-lg p-2 animate-fade-in z-[100]">
                  <div className="p-4 border-b border-alphabag-gray mb-1">
                    <p className="text-[10px] text-alphabag-subtext font-medium uppercase mb-1">Account</p>
                    <p className="text-sm text-alphabag-text font-medium truncate">{user?.email}</p>
                    <div className="mt-2">
                      <span className="px-2 py-1 bg-alphabag-yellow/10 text-alphabag-yellow text-[10px] font-medium rounded-md">
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
