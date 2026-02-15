import React from 'react';
import { LayoutDashboard, Newspaper, Wallet, Layers, BarChart3, Bot, Link as LinkIcon, Settings, LogOut, Calculator, Eye, Radio, ShieldCheck, Briefcase, PieChart, FileClock } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItemProps {
  to: string;
  icon: any;
  label: string;
  active: boolean;
  comingSoon?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, active, comingSoon }) => (
  <Link
    to={comingSoon ? '#' : to}
    className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors mb-1 mx-2 ${active
      ? 'bg-alphabag-yellow/10 text-alphabag-yellow'
      : 'text-alphabag-subtext hover:bg-alphabag-gray hover:text-alphabag-text'
      } ${comingSoon ? 'cursor-not-allowed opacity-80' : ''}`}
  >
    <div className="flex items-center space-x-3">
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </div>
    {comingSoon && (
      <span className="text-[8px] bg-alphabag-gray text-alphabag-subtext px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Soon</span>
    )}
  </Link>
);

const NavGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-4">
    <div className="px-6 mb-2 text-[10px] font-bold text-alphabag-subtext uppercase tracking-widest opacity-70">
      {title}
    </div>
    {children}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-alphabag-dark border-r border-alphabag-gray z-30 transition-transform duration-300 ease-in-out
        md:translate-x-0 pt-20 pb-4 flex flex-col justify-between overflow-y-auto custom-scrollbar
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="py-2">
          <NavGroup title="Personal">
            <NavItem to="/" icon={Briefcase} label="Portfolio" active={location.pathname === '/' || location.pathname === '/assets'} />
            <NavItem to="/history" icon={FileClock} label="History" active={location.pathname === '/history'} />
            <NavItem to="/alpha-calls" icon={Radio} label="AlphaCalls" active={location.pathname === '/alpha-calls'} />
            <NavItem to="/whales" icon={Eye} label="Whale Watch" active={location.pathname.startsWith('/whales')} />
            <NavItem to="/settings" icon={Settings} label="Settings" active={location.pathname === '/settings'} />
          </NavGroup>

          <NavGroup title="Market & Analysis">
            <NavItem to="/markets" icon={BarChart3} label="Global Markets" active={location.pathname === '/markets'} />
            <NavItem to="/analytics" icon={PieChart} label="Analytics" active={location.pathname === '/analytics'} />
            <NavItem to="/alpha-ai" icon={Bot} label="AlphaAi" active={location.pathname === '/alpha-ai'} />
            <NavItem to="/tools" icon={Calculator} label="Calculators" active={location.pathname === '/tools'} />
          </NavGroup>

          <NavGroup title="DeFi & Web3">
            <NavItem to="/defi" icon={Layers} label="DeFi Tracker" active={location.pathname === '/defi'} comingSoon />
            <NavItem to="/integrations" icon={LinkIcon} label="Integrations" active={location.pathname === '/integrations'} comingSoon />
          </NavGroup>

          <NavGroup title="Resources">
            <NavItem to="/news" icon={Newspaper} label="News" active={location.pathname === '/news'} />
          </NavGroup>

          {user?.isAdmin && (
            <NavGroup title="Management">
              <NavItem to="/admin" icon={ShieldCheck} label="Admin Center" active={location.pathname === '/admin'} />
            </NavGroup>
          )}
        </div>

        <div className="px-4">
          <div className="border-t border-alphabag-gray pt-4 mb-2">
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors text-alphabag-subtext hover:bg-alphabag-red/10 hover:text-alphabag-red">
              <LogOut size={18} />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};