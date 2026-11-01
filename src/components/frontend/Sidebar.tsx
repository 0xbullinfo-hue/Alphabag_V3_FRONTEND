import { ChevronDown, LogOut } from 'lucide-react';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFeatures } from '../../hooks/useFeatures';
import { alert } from '../../lib/alert';
import { DISABLED_PAGES } from '../../services/config';
import { PageIcon, PageIconName } from '../ui/PageIcon';

interface NavItemProps {
  to: string;
  icon?: any;
  customIcon?: PageIconName;
  label: string;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  icon: Icon,
  customIcon,
  label,
  active,
}) => {
  const { data: features } = useFeatures();
  const disabledPages = features?.disabledPages || DISABLED_PAGES;
  const isDisabled = disabledPages.includes(to);

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      alert.fire({
        title: 'COMING SOON',
        text: `${label} feature is in final testing.`,
        icon: 'info',
        confirmButtonText: 'ACKNOWLEDGE',
      });
      return;
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

interface PortfolioNavDropdownProps {
  onClose: () => void;
}

const PortfolioNavDropdown: React.FC<PortfolioNavDropdownProps> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isPortfolioRoute = ['/', '/my-alphabag', '/portfolio', '/dex-bag', '/cex-bag'].includes(location.pathname);
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div className="mb-0.5 select-none">
      <div
        className={`flex items-center justify-between px-3 py-2.5 rounded transition-colors duration-150 mx-2 relative cursor-pointer ${
          isPortfolioRoute
            ? 'bg-[#202630] text-alphabag-text font-medium border-l-2 border-alphabag-yellow'
            : 'text-alphabag-subtext hover:bg-[#202630]/60 hover:text-alphabag-text border-l-2 border-transparent'
        }`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (location.pathname !== '/my-alphabag' && location.pathname !== '/') {
            navigate('/my-alphabag');
            onClose();
          }
        }}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <PageIcon
            name="bag"
            size={20}
            framed={false}
            className={`transition-opacity duration-150 shrink-0 ${isPortfolioRoute ? 'opacity-100' : 'opacity-70'}`}
          />
          <span className="text-[17px] font-medium truncate tracking-tight">Portfolio</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 text-alphabag-subtext hover:text-alphabag-text rounded"
          aria-label="Toggle portfolio sub-menu"
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="pl-6 pr-2 py-1 space-y-0.5">
          <Link
            to="/my-alphabag"
            onClick={onClose}
            className={`flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
              location.pathname === '/my-alphabag' || location.pathname === '/'
                ? 'text-alphabag-yellow font-semibold bg-alphabag-yellow/10'
                : 'text-alphabag-subtext hover:text-alphabag-text hover:bg-[#202630]/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              Overview
            </span>
            <span className="text-[11px] uppercase font-semibold text-alphabag-muted">Overview</span>
          </Link>

          <Link
            to="/portfolio"
            onClick={onClose}
            className={`flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
              location.pathname === '/portfolio' || location.pathname === '/history'
                ? 'text-alphabag-yellow font-semibold bg-alphabag-yellow/10'
                : 'text-alphabag-subtext hover:text-alphabag-text hover:bg-[#202630]/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              Performance & History
            </span>
          </Link>

          <Link
            to="/dex-bag"
            onClick={onClose}
            className={`flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
              location.pathname === '/dex-bag'
                ? 'text-alphabag-yellow font-semibold bg-alphabag-yellow/10'
                : 'text-alphabag-subtext hover:text-alphabag-text hover:bg-[#202630]/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              DEX Portfolio
            </span>
            <span className="text-[11px] uppercase font-semibold bg-alphabag-yellow/10 text-alphabag-yellow px-1 py-0.2 rounded border border-alphabag-yellow/20">On-Chain</span>
          </Link>

          <Link
            to="/cex-bag"
            onClick={onClose}
            className={`flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
              location.pathname === '/cex-bag'
                ? 'text-alphabag-yellow font-semibold bg-alphabag-yellow/10'
                : 'text-alphabag-subtext hover:text-alphabag-text hover:bg-[#202630]/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              CEX Portfolio
            </span>
            <span className="text-[11px] uppercase font-semibold bg-blue-500/10 text-blue-400 px-1 py-0.2 rounded border border-blue-500/20">Exchanges</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();
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
            <PortfolioNavDropdown onClose={onClose} />

            {!disabledPages.includes('/airdrop') && (
              <NavItem to="/airdrop" customIcon="airdrop" label="Alpha Missions" active={location.pathname === '/airdrop'} />
            )}
            <NavItem to="/alphas-feed" customIcon="feed" label="Alpha Feed" active={location.pathname === '/alphas-feed' || location.pathname === '/alpha-feed'} />
            <NavItem to="/calculator" customIcon="calculator" label="Position Calculator" active={location.pathname === '/calculator'} />
            <NavItem to="/settings" customIcon="settings" label="Membership" active={location.pathname === '/settings'} />
            <NavItem to="/integrations" customIcon="integrations" label="Integrations" active={location.pathname === '/integrations'} />
          </NavGroup>

          <NavGroup title="Market Intelligence">
            <NavItem to="/alpha-desk" customIcon="desk" label="Alpha Desk" active={location.pathname === '/alpha-desk'} />
            <NavItem to="/alpha-screener" customIcon="screener" label="Alpha Screener" active={location.pathname === '/alpha-screener'} />
            <NavItem to="/markets" customIcon="markets" label="Global Markets" active={location.pathname === '/markets'} />
            <NavItem to="/defi" customIcon="defi" label="DeFi Tracker" active={location.pathname === '/defi'} />
            <NavItem to="/news" customIcon="news" label="Market News" active={location.pathname === '/news'} />
          </NavGroup>
        </div>

        <div className="px-3">
          <div className="border-t border-[#2B313A] pt-3 space-y-0.5">
            <NavItem to="/profile" customIcon="profile" label="Account Profile" active={location.pathname === '/profile'} />
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded transition-colors text-alphabag-subtext hover:bg-rose-500/10 hover:text-alphabag-red mx-2"
              >
                <LogOut size={20} />
                <span className="font-medium text-[17px]">Disconnect</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-login-modal'));
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded transition-colors text-alphabag-yellow hover:bg-alphabag-yellow/10 mx-2"
              >
                <span className="font-medium text-[17px]">Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
