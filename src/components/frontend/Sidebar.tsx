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
        text: `${label} feature is in final testing.`,
        icon: 'info',
        confirmButtonText: 'ACKNOWLEDGE',
        confirmButtonColor: '#F0B90B',
        background: '#181A20',
        color: '#EAECEF',
        customClass: {
          popup: 'border border-[#2B313A] rounded-[6px]',
          confirmButton: 'text-black font-semibold uppercase tracking-wider px-5 py-2 rounded text-xs'
        }
      });
    }
  };

  return (
    <Link
      to={isDisabled ? '#' : to}
      onClick={handleClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded transition-colors duration-150 mb-0.5 mx-2 relative select-none ${
        isDisabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${active
        ? 'bg-[#202630] text-alphabag-text font-medium border-l-2 border-alphabag-yellow'
        : 'text-alphabag-subtext hover:bg-[#202630]/60 hover:text-alphabag-text border-l-2 border-transparent'
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0">
        {customIcon ? (
          <PageIcon
            name={customIcon}
            size={20}
            framed={false}
            className={`transition-opacity duration-150 shrink-0 ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
          />
        ) : Icon ? (
          <Icon size={20} className={`shrink-0 ${active ? 'text-alphabag-yellow' : 'text-alphabag-subtext'}`} />
        ) : null}
        <span className="text-[17px] font-medium truncate tracking-tight">{label}</span>
      </div>
      {isDisabled && (
        <span className="text-xs font-semibold bg-white/5 text-alphabag-subtext px-2 py-0.5 rounded-[2px] border border-white/10 shrink-0 ml-1">SOON</span>
      )}
    </Link>
  );
};

const NavGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-3">
    <div className="px-5 mb-2 text-xs font-bold text-alphabag-subtext uppercase tracking-wider select-none">
      {title}
    </div>
    <div className="space-y-0.5">
      {children}
    </div>
  </div>
);

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
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
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        />
      )}

      <aside className={`
        fixed left-0 top-14 bottom-0 w-64 bg-[#181A20] border-r border-[#2B313A] z-40 transition-transform duration-200 ease-in-out
        md:translate-x-0 pt-3 pb-3 flex flex-col justify-between overflow-y-auto custom-scrollbar
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="py-1">
          <NavGroup title="Portfolio & Analytics">
            <NavItem to="/my-alphabag" customIcon="bag" label="Portfolio" active={location.pathname === '/' || location.pathname === '/my-alphabag'} />

            {!disabledPages.includes('/airdrop') && (
              <div className="relative">
                <NavItem to="/airdrop" customIcon="airdrop" label="Alpha Missions" active={location.pathname === '/airdrop'} />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-alphabag-yellow/15 border border-alphabag-yellow/30 text-alphabag-yellow text-xs font-semibold rounded-[2px] pointer-events-none">LIVE</div>
              </div>
            )}
            <NavItem to="/alphas-feed" customIcon="feed" label="Trade Signals" active={location.pathname === '/alphas-feed'} />
            <NavItem to="/calculator" customIcon="calculator" label="Position Calculator" active={location.pathname === '/calculator'} />
            <NavItem to="/whales" customIcon="whales" label="Wallet Flow" active={location.pathname.startsWith('/whales')} />
            <NavItem to="/settings" customIcon="settings" label="Setup Connections" active={location.pathname === '/settings'} />
            <NavItem to="/integrations" customIcon="integrations" label="Integrations" active={location.pathname === '/integrations'} />
          </NavGroup>

          <NavGroup title="Market Intelligence">
            <div className="relative">
              <NavItem to="/alpha-desk" customIcon="desk" label="Alpha Desk" active={location.pathname === '/alpha-desk'} />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-alphabag-yellow/15 border border-alphabag-yellow/30 text-alphabag-yellow text-xs font-semibold rounded-[2px] pointer-events-none">PRO</div>
            </div>
            <NavItem to="/alpha-screener" customIcon="screener" label="Alpha Screener" active={location.pathname === '/alpha-screener'} />
            <NavItem to="/markets" customIcon="markets" label="Global Markets" active={location.pathname === '/markets'} />
            <NavItem to="/defi" customIcon="defi" label="DeFi Tracker" active={location.pathname === '/defi'} />
            <NavItem to="/news" customIcon="news" label="Market News" active={location.pathname === '/news'} />
          </NavGroup>
        </div>

        <div className="px-3">
          <div className="border-t border-[#2B313A] pt-3 space-y-0.5">
            <NavItem to="/profile" customIcon="profile" label="Account Profile" active={location.pathname === '/profile'} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded transition-colors text-alphabag-subtext hover:bg-rose-500/10 hover:text-alphabag-red mx-2"
            >
              <LogOut size={20} />
              <span className="font-medium text-[17px]">Disconnect</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
