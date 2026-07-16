
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useWallet } from '../../context/WalletContext';
import { X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '../ui/PageTransition';
import { IS_DEMO_MODE } from '../../services/config';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toasts, removeToast } = useWallet();

  return (
    <div className="min-h-screen text-alphabag-text font-sans bg-alphabag-black relative">
      <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className={`md:pl-64 min-h-screen transition-all duration-300 pb-20 md:pb-0 relative z-10 ${IS_DEMO_MODE ? 'pt-[100px]' : 'pt-[72px]'}`}>
        <AnimatePresence mode="wait">
          <PageTransition>
            <div className="pl-2 md:pl-0 pr-2 pb-2 w-full">
              {children}
            </div>
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* Mobile-only Bottom Navigation */}
      <MobileNav />

      {/* Global Toast Portal */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[100] flex flex-col space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto glass-panel px-4 py-3 rounded-xl  flex items-center space-x-2 min-w-[280px] animate-slide-in overflow-hidden"
          >
            <div className={`
                    w-1 h-full absolute left-0 top-0 
                    ${toast.type === 'SUCCESS' ? 'bg-alphabag-green' : toast.type === 'ERROR' ? 'bg-alphabag-red' : 'bg-blue-400'}
                `} />
            <div className={`
                    shrink-0 p-1.5 rounded-lg
                    ${toast.type === 'SUCCESS' ? 'bg-alphabag-green/10 text-alphabag-green' : toast.type === 'ERROR' ? 'bg-alphabag-red/10 text-alphabag-red' : 'bg-blue-400/10 text-blue-400'}
                `}>
              {toast.type === 'SUCCESS' ? <CheckCircle size={16} /> : toast.type === 'ERROR' ? <AlertCircle size={16} /> : <Info size={16} />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-alphabag-text">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-alphabag-subtext hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
