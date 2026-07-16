import React, { useState } from 'react';
import { LayoutDashboard, Newspaper, Wallet, Layers, BarChart3, Bot, Link as LinkIcon, Settings, LogOut, Calculator, Eye, Radio, ShieldCheck, Briefcase, PieChart, FileClock, Flame, Zap, ChevronDown, Gift, Trophy, UserCircle, Target, Wallet2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DISABLED_PAGES, IS_DEMO_MODE } from '../../services/config';
import Swal from 'sweetalert2';

interface NavItemProps {
  to: string;
  icon?: any;
  label: string;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, active }) => {
  const isDisabled = DISABLED_PAGES.includes(to);

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
      className={`flex items-center justify-between px-4 py-2.5 rounded-md transition-all duration-300 mb-1 mx-2 relative group ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${active
        ? 'bg-[#2b3139] text-alphabag-text border-l-2 border-[#fcd535]'
        : 'text-alphabag-subtext hover:bg-[#2b3139] hover:text-alphabag-text border-l-2 border-transparent'
      }`}
    >
      <div className="flex items-center space-x-2 relative z-10">
        {Icon && <Icon size={18} className={active ? 'text-[#fcd535]' : 'group-hover:text-alphabag-text'} />}
        <span className="font-medium text-sm">{label}</span>
      </div>
      {isDisabled && (
        <span className="text-[7px] font-black bg-[#fcd535]/10 text-alphabag-yellow px-1.5 py-0.5 rounded border border-[#fcd535]/20 shrink-0">SOON</span>
      )}
    </Link>
  );
};


const NavDropdown: React.FC<{ icon: any, label: string, activePaths: string[], children: React.ReactNode }> = ({ icon: Icon, label, activePaths, children }) => {
  const location = useLocation();
  const isActive = activePaths.some(path => location.pathname === path || (path !== '/' && location.pathname.startsWith(path)));
  const [isOpen, setIsOpen] = useState(isActive);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-[calc(100%-1rem)] flex items-center justify-between px-4 py-2.5 rounded-md transition-all duration-200 mx-2 ${isActive
          ? 'bg-[#2b3139] text-alphabag-text'
          : 'text-alphabag-subtext hover:bg-[#2b3139] hover:text-alphabag-text'
          }`}
      >
        <div className="flex items-center space-x-2">
          <Icon size={18} />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-1 ml-4 border-l border-white/5 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const NavGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-2">
    <div className="px-6 mb-1.5 text-[10px] font-semibold text-[#474d57] uppercase tracking-wider">
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
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-alphabag-black bg-opacity-50 z-20 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed left-0 bottom-0 w-64 bg-alphabag-dark border-r border-alphabag-gray z-40 transition-transform duration-300 ease-in-out
        md:translate-x-0 pt-6 pb-2 flex flex-col justify-between overflow-y-auto custom-scrollbar
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${IS_DEMO_MODE ? 'top-[92px]' : 'top-16'}
      `}>
        <div className="py-2">
          <NavGroup title="Personal">
            <NavItem to="/my-alphabag" icon={PieChart} label="My AlphaBAG" active={location.pathname === '/' || location.pathname === '/my-alphabag'} />

            {!DISABLED_PAGES.includes('/airdrop') && (
              <div className="relative">
                <NavItem to="/airdrop" icon={Gift} label="Alpha Missions" active={location.pathname === '/airdrop'} />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-alphabag-yellow text-black text-[7px] font-black rounded uppercase pointer-events-none">LIVE</div>
              </div>
            )}
            <NavItem to="/alphas-feed" icon={Zap} label="Alphas Feed" active={location.pathname === '/alphas-feed'} />
            <NavItem to="/alpha-ai" icon={Bot} label="Alpha Analyst" active={location.pathname === '/alpha-ai'} />
            <NavItem to="/calculator" icon={Calculator} label="Alpha Calculator" active={location.pathname === '/calculator'} />
            <NavItem to="/settings" icon={LinkIcon} label="Setup Connections" active={location.pathname === '/settings'} />
            <NavItem to="/integrations" icon={Zap} label="Integrations" active={location.pathname === '/integrations'} />
            
            <NavItem to="/whales" icon={Eye} label="Alpha Radar" active={location.pathname.startsWith('/whales')} />
            <NavItem to="/security" icon={ShieldCheck} label="Security Radar" active={location.pathname === '/security'} />
            <NavItem to="/alpha-calls" icon={Radio} label="AlphaCalls" active={location.pathname === '/alpha-calls'} />
          </NavGroup>

          <NavGroup title="Market Analytics">
            <NavItem to="/alpha-screener" icon={Flame} label="ALPHA SCREENER" active={location.pathname === '/alpha-screener'} />
            <NavItem to="/markets" icon={BarChart3} label="Global Markets" active={location.pathname === '/markets'} />
            <NavItem to="/defi" icon={Layers} label="DeFi Tracker" active={location.pathname === '/defi'} />
            <NavItem to="/news" icon={Newspaper} label="News" active={location.pathname === '/news'} />
          </NavGroup>


        </div>

        <div className="px-4">
          <div className="border-t border-alphabag-gray pt-6 mb-2 space-y-1">
            <NavItem to="/profile" icon={UserCircle} label="My Profile" active={location.pathname === '/profile'} />
            <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-4 py-2.5 rounded-md transition-all duration-200 text-alphabag-subtext hover:bg-[#f6465d]/10 hover:text-[#f6465d] mx-2">
              <LogOut size={18} />
              <span className="font-medium text-xs uppercase">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
