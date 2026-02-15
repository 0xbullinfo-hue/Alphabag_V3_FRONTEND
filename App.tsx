import React, { useEffect, Suspense, lazy, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './lib/wagmi';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WalletProvider } from './context/WalletContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { recordVisitor } from './services/mockData';
import { AuthModal } from './components/AuthModal';
import { UpgradeModal } from './components/UpgradeModal';

const queryClient = new QueryClient();

// Lazy pages
const Assets = lazy(() => import('./pages/Assets').then(m => ({ default: m.Assets })));
const Markets = lazy(() => import('./pages/Markets').then(m => ({ default: m.Markets })));
const CoinDetail = lazy(() => import('./pages/CoinDetail').then(m => ({ default: m.CoinDetail })));
const News = lazy(() => import('./pages/News').then(m => ({ default: m.News })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const DeFi = lazy(() => import('./pages/DeFi').then(m => ({ default: m.DeFi })));
const Integrations = lazy(() => import('./pages/Integrations').then(m => ({ default: m.Integrations })));
const Tools = lazy(() => import('./pages/Tools').then(m => ({ default: m.Tools })));
const AlphaAi = lazy(() => import('./pages/AlphaAi').then(m => ({ default: m.AlphaAi })));
const AlphaCalls = lazy(() => import('./pages/AlphaCalls').then(m => ({ default: m.AlphaCalls })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Whales = lazy(() => import('./pages/Whales').then(m => ({ default: m.Whales })));
const WhaleDetail = lazy(() => import('./pages/WhaleDetail').then(m => ({ default: m.WhaleDetail })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const History = lazy(() => import('./pages/History').then(m => ({ default: m.HistoryPage })));

const GlobalLoader = () => (
  <div className="min-h-screen bg-alphabag-black flex flex-col items-center justify-center space-y-6">
    <div className="w-12 h-12 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
    <p className="text-[10px] text-alphabag-yellow font-bold uppercase tracking-[0.4em] animate-pulse">Synchronizing neural core...</p>
  </div>
);

// Fix: Correctly typing PrivateRoute props to include children using React.PropsWithChildren
const PrivateRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <GlobalLoader />;
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
};

// Fix: Correctly typing AdminRoute props to include children using React.PropsWithChildren
const AdminRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <GlobalLoader />;
  if (!isAuthenticated || !user?.isAdmin) {
    console.warn("Admin access denied. Redirecting to hub.");
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    recordVisitor();
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    const handleOpenUpgrade = () => setIsUpgradeModalOpen(true);

    window.addEventListener('open-login-modal', handleOpenAuth);
    window.addEventListener('open-upgrade-modal', handleOpenUpgrade);

    return () => {
      window.removeEventListener('open-login-modal', handleOpenAuth);
      window.removeEventListener('open-upgrade-modal', handleOpenUpgrade);
    };
  }, []);

  return (
    <HashRouter>
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Layout><Assets /></Layout> : <Landing />} />
          <Route path="/markets" element={<Layout><Markets /></Layout>} />
          <Route path="/markets/:id" element={<Layout><CoinDetail /></Layout>} />
          <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />

          <Route path="/assets" element={<PrivateRoute><Assets /></PrivateRoute>} />
          <Route path="/whales" element={<PrivateRoute><Whales /></PrivateRoute>} />
          <Route path="/whales/:address" element={<PrivateRoute><WhaleDetail /></PrivateRoute>} />
          <Route path="/defi" element={<PrivateRoute><DeFi /></PrivateRoute>} />
          <Route path="/integrations" element={<PrivateRoute><Integrations /></PrivateRoute>} />
          <Route path="/news" element={<PrivateRoute><News /></PrivateRoute>} />
          <Route path="/tools" element={<PrivateRoute><Tools /></PrivateRoute>} />
          <Route path="/alpha-ai" element={<PrivateRoute><AlphaAi /></PrivateRoute>} />
          <Route path="/alpha-calls" element={<PrivateRoute><AlphaCalls /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
    </HashRouter>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <WagmiConfig config={config}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <WalletProvider>
              <AppContent />
            </WalletProvider>
          </AuthProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </ErrorBoundary>
  );
}

export default App;