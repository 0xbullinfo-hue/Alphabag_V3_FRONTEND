
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Radio, Bot, BarChart3 } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/airdrop', icon: LayoutDashboard, label: 'Missions' },
    { to: '/portfolio', icon: Wallet, label: 'Portfolio' },
    { to: '/alpha-calls', icon: Radio, label: 'Calls' },
    { to: '/alpha-ai', icon: Bot, label: 'AI' },
    { to: '/markets', icon: BarChart3, label: 'Markets' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-alphabag-dark/95 backdrop-blur-md border-t border-alphabag-gray z-[50] safe-pb">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-alphabag-yellow' : 'text-alphabag-subtext'
                }`}
            >
              <item.icon size={20} className={isActive ? 'animate-pulse' : ''} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{item.label}</span>
              {isActive && <div className="absolute bottom-2 w-2 h-2 bg-alphabag-yellow rounded-full"></div>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
