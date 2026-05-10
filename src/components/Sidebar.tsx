import React, { useState } from 'react';
import { LayoutDashboard, Newspaper, Wallet, Layers, BarChart3, Bot, Link as LinkIcon, Settings, LogOut, Calculator, Eye, Radio, ShieldCheck, Briefcase, PieChart, FileClock, Flame, Zap, ChevronDown, Gift, Trophy, UserCircle, Target, Wallet2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItemProps {
  to: string;
  icon?: any;
  label: string;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 active:scale-[0.98] mb-1 mx-2 ${active
      ? 'bg-alphabag-yellow/10 text-alphabag-yellow shadow-glow-yellow'
      : 'text-alphabag-muted hover:bg-white/5 hover:text-zinc-50'
      }`}
  >
    <div className="flex items-center space-x-3">
      {Icon && <Icon size={18} />}
      <span className="font-black text-[11px] uppercase tracking-[0.2em]">{label}</span>
    </div>
  </Link>
);

const NavDropdown: React.FC<{ icon: any, label: string, activePaths: string[], children: React.ReactNode }> = ({ icon: Icon, label, activePaths, children }) => {
  const location = useLocation();
  const isActive = activePaths.some(path => location.pathname === path || (path !== '/' && location.pathname.startsWith(path)));
  const [isOpen, setIsOpen] = useState(isActive);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-[calc(100%-1rem)] flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 active:scale-[0.98] mx-2 ${isActive
          ? 'bg-alphabag-yellow/10 text-alphabag-yellow'
          : 'text-alphabag-muted hover:bg-white/5 hover:text-zinc-50'
          }`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={18} />
          <span className="font-black text-[11px] uppercase tracking-[0.2em]">{label}</span>
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
  <div className="mb-6">
    <div className="px-8 mb-2 text-[9px] font-semibold text-alphabag-subtext uppercase tracking-[0.28em] opacity-80">
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
        fixed top-0 left-0 h-full w-64 bg-[#0d0d11] border-r border-white/10 z-30 transition-transform duration-300 ease-in-out
        md:translate-x-0 pt-24 pb-8 flex flex-col justify-between overflow-y-auto custom-scrollbar shadow-[0_60px_120px_rgba(0,0,0,0.4)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="py-2">
          <NavGroup title="Personal">
            <NavItem to="/cex-bag" icon={Layers} label="CEX PORTFOLIO" active={location.pathname === '/cex-bag'} />
            <NavItem to="/dex-bag" icon={Wallet2} label="DEX PORTFOLIO" active={location.pathname === '/dex-bag'} />

            <div className="relative">
              <NavItem to="/airdrop" icon={Gift} label="Alpha Missions" active={location.pathname === '/airdrop'} />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-alphabag-yellow text-black text-[7px] font-black rounded uppercase pointer-events-none">LIVE</div>
            </div>
            <NavItem to="/settings" icon={LinkIcon} label="Setup Connections" active={location.pathname === '/settings'} />
            <NavItem to="/integrations" icon={Zap} label="Integrations" active={location.pathname === '/integrations'} />
            
            <NavItem to="/whales" icon={Eye} label="Whale Watch" active={location.pathname.startsWith('/whales')} />
            <NavItem to="/alpha-calls" icon={Radio} label="AlphaCalls" active={location.pathname === '/alpha-calls'} />
          </NavGroup>

          <NavGroup title="Radar Monitoring">
            <NavItem to="/alphas-feed" icon={Zap} label="Alphas Feed" active={location.pathname === '/alphas-feed'} />
            <NavItem to="/live-pairs" icon={Radio} label="Live Pairs" active={location.pathname === '/live-pairs'} />
          </NavGroup>

          <NavGroup title="Market Analytics">
            <NavItem to="/markets" icon={BarChart3} label="Global Markets" active={location.pathname === '/markets'} />
            <NavItem to="/alpha-ai" icon={Bot} label="Alpha Intelligence" active={location.pathname === '/alpha-ai'} />
            <NavItem to="/calculator" icon={Calculator} label="Alpha Calculator" active={location.pathname === '/calculator'} />
            <NavItem to="/defi" icon={Layers} label="DeFi Tracker" active={location.pathname === '/defi'} />
            <NavItem to="/news" icon={Newspaper} label="News" active={location.pathname === '/news'} />
          </NavGroup>


          {user?.isAdmin && (
            <NavGroup title="Management">
              <NavItem to="/admin" icon={ShieldCheck} label="Admin Command Center" active={location.pathname === '/admin'} />
              <NavItem to="/admin/projects" icon={Zap} label="Project Ads" active={location.pathname === '/admin/projects'} />
            </NavGroup>
          )}
        </div>

        <div className="px-6">
          <div className="border-t border-alphabag-border pt-6 mb-2 space-y-1">
            <NavItem to="/profile" icon={UserCircle} label="My Profile" active={location.pathname === '/profile'} />
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 active:scale-[0.98] text-alphabag-muted hover:bg-alphabag-red/10 hover:text-alphabag-red">
              <LogOut size={18} />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
