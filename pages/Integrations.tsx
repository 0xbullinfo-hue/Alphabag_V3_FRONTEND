
import React, { useEffect, useState } from 'react';
import { fetchIntegrations } from '../services/mockData';
import { Integration } from '../types';
import { Button } from '../components/ui/Button';
import { Search, Plus, Lock } from 'lucide-react';

export const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    fetchIntegrations().then(setIntegrations);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Main Overlay Tag */}
      <div className="absolute top-0 right-0 z-10">
         <div className="bg-alphabag-yellow text-alphabag-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center">
            <Lock size={12} className="mr-1.5" /> Coming Soon for Pro Users
         </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div>
            <h1 className="text-2xl font-bold text-white">Integrations</h1>
            <p className="text-alphabag-subtext mt-1">Connect your wallets and exchanges to track your portfolio.</p>
        </div>
        <div className="mt-4 md:mt-0 relative opacity-50 pointer-events-none">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-alphabag-subtext" />
             </div>
             <input 
                type="text" 
                placeholder="Search exchanges..." 
                className="bg-alphabag-dark border border-alphabag-gray rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-alphabag-yellow w-full md:w-64"
                disabled
             />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-60">
        {integrations.map((item) => (
            <div key={item.id} className="bg-alphabag-dark border border-alphabag-gray rounded-xl p-6 flex flex-col items-center text-center transition-colors group cursor-not-allowed">
                <img src={item.icon} alt={item.name} className="w-16 h-16 mb-4 rounded-full bg-white p-1 grayscale" />
                <h3 className="font-bold text-white text-lg">{item.name}</h3>
                <span className="text-xs text-alphabag-subtext bg-alphabag-gray px-2 py-1 rounded mt-2 uppercase">{item.type}</span>
                <div className="mt-6 w-full pointer-events-none">
                    {item.status === 'CONNECTED' ? (
                        <Button variant="secondary" className="w-full text-alphabag-green border border-alphabag-green/30" disabled>Connected</Button>
                    ) : (
                        <Button className="w-full opacity-50" disabled>
                            <Plus size={16} className="mr-2" /> Connect
                        </Button>
                    )}
                </div>
            </div>
        ))}
        
        {/* Manual Add Card */}
        <div className="bg-alphabag-black border border-dashed border-alphabag-gray rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors min-h-[240px] relative group cursor-not-allowed">
            <div className="absolute top-4 right-4 bg-alphabag-yellow text-alphabag-black text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">
                Soon
            </div>
            <div className="w-16 h-16 bg-alphabag-gray rounded-full flex items-center justify-center mb-4 text-alphabag-yellow opacity-40">
                <Plus size={32} />
            </div>
            <h3 className="font-bold text-white">Add Manually</h3>
            <p className="text-sm text-alphabag-subtext mt-2">Enter address or transactions manually</p>
        </div>
      </div>
    </div>
  );
};
