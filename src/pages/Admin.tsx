
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Shield, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AdminSidebar } from '../components/AdminSidebar';

// Sub-components
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminNews } from '../components/admin/AdminNews';
import { AdminSignals } from '../components/admin/AdminSignals';
import { AdminSystem } from '../components/admin/AdminSystem';
import { AdminAirdrop } from '../components/admin/AdminAirdrop';
import { AdminT2E } from '../components/admin/AdminT2E';
import { AdminWhales } from '../components/admin/AdminWhales';

export const Admin: React.FC = () => {
    const { user, token } = useAuth();
    const location = useLocation();

    // View State
    const query = new URLSearchParams(location.search);
    const currentView = query.get('view') || 'overview';

    // Data State
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const timestamp = Date.now();
            const [usersRes, statsRes] = await Promise.all([
                api.get(`/api/admin/users?_t=${timestamp}`),
                api.get(`/api/admin/system?_t=${timestamp}`)
            ]);

            const responseData = usersRes.data.registered || usersRes.data;
            setUsers(Array.isArray(responseData) ? responseData : []); 
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
        const interval = setInterval(fetchAllData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Active Visitors count (mocked in stats usually, or from usersRes)
    const activeCount = users.filter(u => u.lastActive && (Date.now() - new Date(u.lastActive).getTime() < 15 * 60 * 1000)).length; // 15m window approx

    const renderContent = () => {
        switch (currentView) {
            case 'overview':
                return <AdminOverview stats={stats} registeredCount={users.length} activeCount={activeCount} />;
            case 'users':
                return <AdminUsers users={users} />;
            case 'news':
                return <AdminNews />;
            case 'signals':
                return <AdminSignals />;
            case 'airdrop':
                return <AdminAirdrop />;
            case 't2e':
                return <AdminT2E />;
            case 'whales':
                return <AdminWhales />;
            case 'system':
                return <AdminSystem onReboot={fetchAllData} />;
            default:
                return <AdminOverview stats={stats} registeredCount={users.length} activeCount={activeCount} />;
        }
    };

    return (
        <div className="flex h-screen bg-alphabag-black">
            <AdminSidebar />

            <div className="flex-1 md:pl-64 overflow-y-auto custom-scrollbar">
                <main className="p-3 md:p-5 lg:p-6 pb-20 max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center">
                                <Shield className="mr-2 text-alphabag-yellow" size={24} />
                                {currentView === 'overview' ? 'Admin Center' :
                                    currentView === 'users' ? 'Member Database' :
                                        currentView === 'news' ? 'Intelligence Deck' :
                                            currentView === 'signals' ? 'Alpha Signals' :
                                                currentView === 'airdrop' ? 'Missions Control' :
                                                currentView === 't2e' ? 'T2E Infrastructure' :
                                                    currentView === 'whales' ? 'Whale Watch' :
                                                        'System Integrity'}
                            </h1>
                            <p className="text-alphabag-subtext mt-0.5 text-[12px] font-bold tracking-wide">
                                ADMIN: <span className="text-white">{user?.email}</span> | STATUS: <span className="text-green-500">SECURE</span>
                            </p>
                        </div>
                        <Button onClick={fetchAllData} size="sm" variant="secondary" className="border-alphabag-gray bg-alphabag-dark hover:bg-white/5 h-8 text-xs">
                            <RefreshCw size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Content Area */}
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};
