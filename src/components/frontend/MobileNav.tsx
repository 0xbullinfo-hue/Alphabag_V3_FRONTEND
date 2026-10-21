
import { BarChart3,LayoutDashboard,MessageSquare,PanelsTopLeft,Wallet } from 'lucide-react';
import React from 'react';
import { Link,useLocation } from 'react-router-dom';

export const MobileNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/my-alphabag', icon: LayoutDashboard, label: 'Home' },
    { to: '/alpha-desk', icon: PanelsTopLeft, label: 'Desk' },
    { to: '/markets', icon: BarChart3, label: 'Markets' },
    { to: '/alphas-feed', icon: MessageSquare, label: 'Feed' },
    { to: '/portfolio', icon: Wallet, label: 'Portfolio' },
  ];

  return (
    <nav aria-label="Primary mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-alphabag-dark border-t border-alphabag-gray z-[50] safe-pb">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
            || (item.to === '/my-alphabag' && location.pathname === '/dashboard')
            || (item.to === '/alphas-feed' && location.pathname === '/alpha-feed');
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-w-0 w-full h-full space-y-1 transition-colors ${isActive ? 'text-alphabag-yellow' : 'text-alphabag-subtext'
                }`}
            >
              <item.icon size={20} aria-hidden="true" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
