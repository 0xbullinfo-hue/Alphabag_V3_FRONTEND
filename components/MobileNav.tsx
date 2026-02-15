
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Radio, Bot, BarChart3 } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/assets', icon: Wallet, label: 'Portfolio' },
    { to: '/alpha-calls', icon: Radio, label: 'Calls' },
    { to: '/alpha-ai', icon: Bot, label: 'Ai' },
    { to: '/analytics', icon: BarChart3, label: 'Markets' },
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
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-alphabag-yellow' : 'text-alphabag-subtext'
              }`}
            >
              <item.icon size={20} className={isActive ? 'animate-pulse' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
              {isActive && <div className="w-1 h-1 bg-alphabag-yellow rounded-full absolute bottom-1"></div>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
