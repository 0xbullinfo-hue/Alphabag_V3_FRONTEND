import { Bell, Briefcase, ChevronDown, LogOut, Menu, Search, Settings, Wallet, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
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
  const { open } = useWeb3Modal();
  const { isConnected, address } = useAccount();
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Do not show a fabricated unread alert when no notification feed is connected.
  const notifications: any[] = [];
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
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#181A20] border-b border-[#2B313A] z-[60] px-4 flex items-center justify-between">
        <div className="flex items-center flex-1">
          <button
            onClick={toggleSidebar}
            className="mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-alphabag-subtext hover:text-white hover:bg-[#202630] md:hidden transition-colors"
            aria-label="Toggle Navigation"
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="AlphaBAG Logo" className="w-6 h-6 object-contain rounded-full" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-alphabag-yellow tracking-wider">ALPHABAG</span>
            </div>
          </Link>
        </div>

        <form role="search" onSubmit={handleSearch} aria-label="Search markets" className="hidden md:flex flex-1 max-w-sm mx-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-alphabag-subtext" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search coin, pair, or contract..."
            className="w-full bg-[#0B0E11] border border-[#2B313A] text-alphabag-text text-xs rounded focus:border-alphabag-yellow block pl-9 pr-3 py-1.5 outline-none transition-colors placeholder:text-alphabag-subtext/60"
          />
        </form>

        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <div className="relative">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors relative ${showNotifications ? 'bg-alphabag-yellow/10 text-alphabag-yellow' : 'text-alphabag-subtext hover:text-white hover:bg-[#202630]'}`}
                  aria-label="Notifications"
                  aria-haspopup="true"
                  aria-expanded={showNotifications}
                  aria-controls="notification-center"
                >
                  <Bell size={18} />
                  {notifications.some(n => !n.read) && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-alphabag-red rounded-full border border-[#181A20]"></div>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center space-x-2 px-2.5 py-1 rounded hover:bg-[#202630] transition-colors"
                  aria-label="Account menu"
                  aria-haspopup="true"
                  aria-expanded={showUserMenu}
                  aria-controls="account-menu"
                >
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-medium text-alphabag-text leading-none mb-0.5">{user?.email?.split('@')[0]}</div>
                    <div className="text-[11px] font-semibold text-alphabag-yellow uppercase">{user?.tier || 'STANDARD'}</div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#202630] border border-[#2B313A] text-alphabag-yellow flex items-center justify-center text-xs font-semibold">
                    {user?.email ? user.email.slice(0, 1).toUpperCase() : 'U'}
                  </div>
                  <ChevronDown size={13} className={`text-alphabag-subtext transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <NotificationCenter 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
                notifications={notifications} 
              />

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#181A20] border border-[#2B313A] rounded-[4px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] p-1.5 z-[100]">
                  <div className="px-3 py-2 border-b border-[#2B313A] mb-1">
                    <p className="text-[11px] text-alphabag-subtext font-semibold uppercase">Account</p>
                    <p className="text-xs text-alphabag-text font-medium truncate mt-0.5">{user?.email}</p>
                    <div className="mt-1.5">
                      <span className="px-1.5 py-0.5 bg-alphabag-yellow/10 text-alphabag-yellow text-[11px] font-semibold rounded-[2px] border border-alphabag-yellow/20">
                        {user?.tier || 'Standard User'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-alphabag-text hover:bg-[#202630] rounded flex items-center mb-0.5 transition-colors"
                  >
                    <Briefcase size={14} className="mr-2 text-alphabag-subtext" />
                    Account Profile
                  </button>

                  <button
                    onClick={handleNavigateToSettings}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-alphabag-text hover:bg-[#202630] rounded flex items-center mb-0.5 transition-colors"
                  >
                    <Settings size={14} className="mr-2 text-alphabag-subtext" />
                    Terminal Settings
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); logout(); navigate('/'); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-alphabag-red hover:bg-rose-500/10 rounded flex items-center transition-colors"
                  >
                    <LogOut size={14} className="mr-2" /> Disconnect Session
                  </button>
                </div>
              )}
            </div>
          ) : isConnected && address ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}
              leftIcon={<Wallet size={14} />}
              className="font-semibold transition-all"
            >
              Sign In ({address.slice(0, 6)}...{address.slice(-4)})
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => open()}
              leftIcon={<Wallet size={14} />}
              className="font-semibold transition-all"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </header>
    </>
  );
};
