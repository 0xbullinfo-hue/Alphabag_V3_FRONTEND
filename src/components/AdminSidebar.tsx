
import React from 'react';
import { Home, Users, Radio, Newspaper, Activity, LogOut, Shield, Zap, TrendingUp } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavItemProps {
    to: string;
    icon: any;
    label: string;
    active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, active }) => (
    <Link
        to={to}
        className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 active:scale-[0.98] mb-1 mx-2 ${active
            ? 'bg-alphabag-yellow/10 text-alphabag-yellow shadow-glow-yellow'
            : 'text-alphabag-muted hover:bg-white/5 hover:text-white'
            }`}
    >
        {Icon && <Icon size={18} />}
        <span className="font-black text-[11px] uppercase tracking-[0.2em]">{label}</span>
    </Link>
);

export const AdminSidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    // Helper to check active tab via query param or sub-route
    // For now assuming single page Admin with tabs, or sub-routes?
    // User planned "Admin.tsx to use Sidebar layout".
    // If Admin.tsx handles all views, we use query params or state.
    // But standard is routes. However, maintaining Admin.tsx as single file might get huge.
    // Let's assume Admin.tsx manages the "view" state for now to avoid routing complexity if not set up.
    // Actually, let's use query params: ?view=overview, ?view=users, etc.
    const query = new URLSearchParams(location.search);
    const currentView = query.get('view') || 'overview';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className="fixed top-0 left-0 h-full w-64 bg-[#0d0d11] border-r border-white/10 z-40 flex flex-col justify-between overflow-y-auto custom-scrollbar shadow-[0_60px_120px_rgba(0,0,0,0.4)]">
            <div>
                {/* Header - Aligned with global header height */}
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <div className="flex items-center text-alphabag-yellow gap-2">
                        <div className="w-8 h-8 bg-alphabag-yellow text-black flex items-center justify-center rounded-xl shadow-[0_0_15px_rgba(252,213,53,0.3)]">
                            <Shield size={18} fill="currentColor" />
                        </div>
                        <span className="font-black text-sm tracking-tighter uppercase text-white">Admin<span className="text-alphabag-yellow">HUB</span></span>
                    </div>
                </div>

                {/* Nav */}
                <div className="pt-10 pb-6 space-y-1">
                    <div className="px-6 mb-2 text-[10px] font-black text-alphabag-subtext uppercase tracking-widest opacity-50">
                        Main Operations
                    </div>
                    <NavItem to="/admin?view=overview" icon={Home} label="Overview" active={currentView === 'overview'} />
                    <NavItem to="/admin?view=users" icon={Users} label="Registered Member Database" active={currentView === 'users'} />
                    <NavItem to="/admin?view=whales" icon={Activity} label="Whale Watch" active={currentView === 'whales'} />

                    <div className="px-6 mb-2 mt-6 text-[10px] font-black text-alphabag-subtext uppercase tracking-widest opacity-50">
                        Broadcast Station
                    </div>
                    <NavItem to="/admin?view=news" icon={Newspaper} label="Newsroom" active={currentView === 'news'} />
                    <NavItem to="/admin?view=signals" icon={Radio} label="Alpha Signals" active={currentView === 'signals'} />
                    <NavItem to="/admin?view=airdrop" icon={Zap} label="Campaign & Missions" active={currentView === 'airdrop'} />

                    <div className="px-6 mb-2 mt-6 text-[10px] font-black text-alphabag-subtext uppercase tracking-widest opacity-50">
                        System
                    </div>
                    <NavItem to="/admin?view=system" icon={Activity} label="Server Health" active={currentView === 'system'} />
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-alphabag-gray/30">
                <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                    <LogOut size={18} />
                    <span className="font-bold text-sm">Disconnect</span>
                </button>
            </div>
        </aside>
    );
};
