import { LogOut } from 'lucide-react';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { useFeatures } from '../../hooks/useFeatures';
import { DISABLED_PAGES } from '../../services/config';
import { PageIcon, PageIconName } from '../ui/PageIcon';

interface NavItemProps {
  to: string;
  icon?: any;
  customIcon?: PageIconName;
  label: string;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, customIcon, label, active }) => {
  const { data: features } = useFeatures();
  const disabledPages = features?.disabledPages || DISABLED_PAGES;
  const isDisabled = disabledPages.includes(to);

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      Swal.fire({
        title: 'COMING SOON',
        text: `${label} feature is in final testing. Launching in Phase 2.0.`,
        icon: 'info',
        confirmButtonText: 'ACKNOWLEDGE',
        confirmButtonColor: '#fcd535',
        background: 'var(--panel-color)',
        color: 'var(--text-color)',
        customClass: {
          popup: 'border border-alphabag-gray rounded-2xl',
          confirmButton: 'text-black font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg text-xs'
        }
      });
    }
  };

  return (
    <Link
      to={isDisabled ? '#' : to}
      onClick={handleClick}
      className={`flex items-center justify-between px-3.5 py-2 rounded-lg transition-all duration-200 mb-1 mx-2 relative group ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${active
        ? 'bg-alphabag-gray/90 text-alphabag-text border-l-2 border-alphabag-yellow shadow-inner shadow-alphabag-yellow/5'
        : 'text-alphabag-subtext hover:bg-alphabag-gray/50 hover:text-alphabag-text border-l-2 border-transparent'
      }`}
    >
      <div className="flex items-center space-x-2.5 relative z-10 min-w-0">
        {customIcon ? (
          <PageIcon
            name={customIcon}
            size={18}
            framed={false}
            className={`transition-all duration-200 shrink-0 ${
              active
                ? 'scale-105 filter drop-shadow-[0_0_6px_rgba(255,210,0,0.45)]'
                : 'opacity-75 group-hover:opacity-100 group-hover:scale-105'
            }`}
          />
        ) : Icon ? (
          <Icon size={18} className={`shrink-0 ${active ? 'text-alphabag-yellow' : 'group-hover:text-alphabag-text'}`} />
        ) : null}
        <span className="font-medium text-sm truncate">{label}</span>
      </div>
      {isDisabled && (
        <span className="text-[7px] font-black bg-alphabag-yellow/10 text-alphabag-yellow px-1.5 py-0.5 rounded border border-alphabag-yellow/20 shrink-0 ml-1">SOON</span>
      )}
    </Link>
  );
};



const NavGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-2">
    <div className="px-6 mb-1.5 text-[10px] font-semibold text-alphabag-muted uppercase tracking-wider">
      {title}
    </div>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

export const Sidebar: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: features } = useFeatures();
  const disabledPages = features?.disabledPages || DISABLED_PAGES;

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-fade-in"
        />
      )}

      <aside className={`
        fixed left-2 bottom-2 top-[84px] w-60 bg-alphabag-dark border border-alphabag-gray rounded-2xl z-40 transition-transform duration-300 ease-in-out
        md:translate-x-0 pt-6 pb-2 flex flex-col justify-between overflow-y-auto custom-scrollbar
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="py-2">
          <NavGroup title="Personal">
            <NavItem to="/my-alphabag" customIcon="bag" label="My AlphaBAG" active={location.pathname === '/' || location.pathname === '/my-alphabag'} />

            {/* Alpha Passes hidden until ready for public launch */}

            {!disabledPages.includes('/airdrop') && (
              <div className="relative">
                <NavItem to="/airdrop" customIcon="airdrop" label="Alpha Missions" active={location.pathname === '/airdrop'} />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-alphabag-yellow text-black text-[7px] font-black rounded uppercase pointer-events-none">LIVE</div>
              </div>
            )}
            <NavItem to="/alphas-feed" customIcon="feed" label="Alphas Feed" active={location.pathname === '/alphas-feed'} />
            <NavItem to="/alpha-ai" customIcon="ai" label="Alpha Analyst" active={location.pathname === '/alpha-ai'} />
            <NavItem to="/calculator" customIcon="calculator" label="Alpha Calculator" active={location.pathname === '/calculator'} />
            <NavItem to="/settings" customIcon="settings" label="Setup Connections" active={location.pathname === '/settings'} />
            <NavItem to="/integrations" customIcon="integrations" label="Integrations" active={location.pathname === '/integrations'} />
            
            <NavItem to="/whales" customIcon="whales" label="Alpha Radar" active={location.pathname.startsWith('/whales')} />
            <NavItem to="/security" customIcon="security" label="Security Radar" active={location.pathname === '/security'} />
            <NavItem to="/alpha-calls" customIcon="calls" label="AlphaCalls" active={location.pathname === '/alpha-calls'} />
          </NavGroup>

          <NavGroup title="Market Analytics">
            <NavItem to="/alpha-screener" customIcon="screener" label="Alpha Screener" active={location.pathname === '/alpha-screener'} />
            <NavItem to="/markets" customIcon="markets" label="Global Markets" active={location.pathname === '/markets'} />
            <NavItem to="/defi" customIcon="defi" label="DeFi Tracker" active={location.pathname === '/defi'} />
            <NavItem to="/news" customIcon="news" label="News" active={location.pathname === '/news'} />
          </NavGroup>


        </div>

        <div className="px-4">
          <div className="border-t border-alphabag-gray pt-6 mb-2 space-y-1">
            <NavItem to="/profile" customIcon="profile" label="My Profile" active={location.pathname === '/profile'} />
            <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-4 py-2.5 rounded-md transition-all duration-200 text-alphabag-subtext hover:bg-alphabag-red/10 hover:text-alphabag-red mx-2">
              <LogOut size={18} />
              <span className="font-medium text-xs uppercase">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
