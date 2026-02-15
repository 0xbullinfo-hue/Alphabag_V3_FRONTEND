import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Activity, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface TrackedUser {
    address: string;
    lastActive: string;
    tier: string;
}

export const Admin: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<TrackedUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:3001/api/admin/users');
            setUsers(response.data.users);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // Poll every 30 seconds
        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-tighter flex items-center">
                        <Shield className="mr-3 text-alphabag-yellow" size={32} />
                        System Admin
                    </h1>
                    <p className="text-alphabag-subtext mt-1 text-sm font-medium">
                        Monitoring active nodes and user sessions.
                    </p>
                </div>
                <Button onClick={fetchUsers} size="sm" variant="secondary" className="border-alphabag-gray">
                    <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-alphabag-subtext uppercase tracking-widest">Active Users</p>
                            <h3 className="text-3xl font-black text-white mt-2">{users.length}</h3>
                        </div>
                        <div className="bg-alphabag-yellow/10 p-3 rounded-xl">
                            <Users className="text-alphabag-yellow" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-alphabag-subtext uppercase tracking-widest">System Status</p>
                            <h3 className="text-3xl font-black text-green-500 mt-2">ONLINE</h3>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded-xl">
                            <Activity className="text-green-500" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* User Table */}
            <div className="bg-alphabag-dark border border-alphabag-gray rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-alphabag-gray">
                    <h3 className="font-bold text-white uppercase tracking-widest text-sm">Active Sessions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-black/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-alphabag-subtext uppercase tracking-wider">Wallet Address</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-alphabag-subtext uppercase tracking-wider">Tier</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-alphabag-subtext uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-alphabag-subtext uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-alphabag-gray">
                            {users.map((u, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-sm font-mono text-white">
                                        {u.address}
                                        {u.address.toLowerCase() === user?.id.toLowerCase() && <span className="ml-2 text-[10px] bg-alphabag-yellow text-black px-2 py-0.5 rounded font-bold">YOU</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-white border border-white/20">
                                            {u.tier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-alphabag-subtext">
                                        {new Date(u.lastActive).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a
                                            href={`https://zerion.io/${u.address}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center text-alphabag-yellow hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                                        >
                                            Inspect <ExternalLink size={12} className="ml-1" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-alphabag-subtext">
                                        No active users found recently.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
