import React, { useEffect, Suspense, lazy, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { WagmiConfig, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './lib/wagmi';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WalletProvider } from './context/WalletContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { recordVisitor } from './services/mockData';
import { AuthModal } from './components/AuthModal';
import { UpgradeModal } from './components/UpgradeModal';
import { AirdropOnboarding } from './components/AirdropOnboarding';

// Solana Imports
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles for Solana wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();

// Lazy pages

const CexBag = lazy(() => import('./pages/CexBag').then(m => ({ default: m.CexBag })));
const DexBag = lazy(() => import('./pages/DexBag').then(m => ({ default: m.DexBag })));
const Calculator = lazy(() => import('./pages/Calculator').then(m => ({ default: m.Calculator })));
const AlphasFeed = lazy(() => import('./pages/AlphasFeed').then(m => ({ default: m.AlphasFeed })));
const AdminProjectDashboard = lazy(() => import('./pages/AdminProjectDashboard').then(m => ({ default: m.AdminProjectDashboard })));
const LivePairs = lazy(() => import('./pages/LivePairs').then(m => ({ default: m.LivePairs })));

const Markets = lazy(() => import('./pages/Markets').then(m => ({ default: m.Markets })));
const CoinDetail = lazy(() => import('./pages/CoinDetail').then(m => ({ default: m.CoinDetail })));
const News = lazy(() => import('./pages/News').then(m => ({ default: m.News })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const DeFi = lazy(() => import('./pages/DeFi').then(m => ({ default: m.DeFi })));
const Integrations = lazy(() => import('./pages/Integrations').then(m => ({ default: m.Integrations })));
const AlphaAi = lazy(() => import('./pages/AlphaAi').then(m => ({ default: m.AlphaAi })));
const AlphaCalls = lazy(() => import('./pages/AlphaCalls').then(m => ({ default: m.AlphaCalls })));
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Whales = lazy(() => import('./pages/Whales').then(m => ({ default: m.Whales })));
const WhaleDetail = lazy(() => import('./pages/WhaleDetail').then(m => ({ default: m.WhaleDetail })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const History = lazy(() => import('./pages/History').then(m => ({ default: m.HistoryPage })));
const GenesisLanding = lazy(() => import('./pages/GenesisLanding').then(m => ({ default: m.GenesisLanding })));
const GenesisManifesto = lazy(() => import('./pages/GenesisManifesto').then(m => ({ default: m.GenesisManifesto })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Airdrop = lazy(() => import('./pages/Airdrop').then(m => ({ default: m.Airdrop })));

const GlobalLoader = () => (
  <div className="min-h-screen bg-alphabag-black flex flex-col items-center justify-center space-y-6">
    <div className="w-12 h-12 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
    <p className="text-[10px] text-alphabag-yellow font-black uppercase tracking-[0.4em] animate-pulse">Synchronizing Protocol Hub...</p>
  </div>
);

// Fix: Correctly typing PrivateRoute props to include children using React.PropsWithChildren
const PrivateRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <GlobalLoader />;

  // STRICT ADMIN SEPARATION: Admins cannot access user routes
  if (isAuthenticated && user?.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
};

// Fix: Correctly typing AdminRoute props to include children using React.PropsWithChildren
const AdminRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <GlobalLoader />;
  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AirdropTracker = () => {
  const location = useLocation();

  // Track page visits for airdrop
  useEffect(() => {
    if (!localStorage.getItem('airdrop_timer_start')) {
        localStorage.setItem('airdrop_timer_start', Date.now().toString());
    }
    const path = location.pathname;
    if (path !== '/' && path !== '/airdrop') {
      window.dispatchEvent(new CustomEvent('airdrop-page-visit', { detail: { page: path } }));
    }
  }, [location]);

  return null;
};

const AppContent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { isConnected } = useAccount();

  // Automatic SIWE Trigger after connection — but skip if already authenticated
  useEffect(() => {
    if (isConnected && !isAuthenticated && !isLoading) {
      setIsAuthModalOpen(true);
    }
    // Close modal when authentication completes
    if (isAuthenticated) {
      setIsAuthModalOpen(false);
    }
  }, [isConnected, isAuthenticated, isLoading]);

  useEffect(() => {
    recordVisitor();
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    const handleOpenUpgrade = () => setIsUpgradeModalOpen(true);

    window.addEventListener('open-login-modal', handleOpenAuth);
    window.addEventListener('open-upgrade-modal', handleOpenUpgrade);

    // Capture Referral Code
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      console.log("[NETWORK] Storing referral code:", refCode);
      sessionStorage.setItem('alphabag_ref_code', refCode);
    }

    return () => {
      window.removeEventListener('open-login-modal', handleOpenAuth);
      window.removeEventListener('open-upgrade-modal', handleOpenUpgrade);
    };
  }, []);

  return (
    <>
      <AirdropTracker />
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          <Route path="/" element={
            isLoading ? <GlobalLoader /> :
            isAuthenticated ? (
              user?.isAdmin ? <Navigate to="/admin" replace /> : <Layout><Airdrop /></Layout>
            ) : <Landing />
          } />
          <Route path="/genesis" element={<GenesisLanding />} />
          <Route path="/genesis-manifesto" element={<PrivateRoute><GenesisManifesto /></PrivateRoute>} />
          <Route path="/cex-bag" element={<PrivateRoute><CexBag /></PrivateRoute>} />
          <Route path="/dex-bag" element={<PrivateRoute><DexBag /></PrivateRoute>} />
          <Route path="/calculator" element={<PrivateRoute><Calculator /></PrivateRoute>} />

          <Route path="/markets" element={<Layout><Markets /></Layout>} />
          <Route path="/markets/:id" element={<Layout><CoinDetail /></Layout>} />
          <Route path="/whales" element={<PrivateRoute><Whales /></PrivateRoute>} />
          <Route path="/whales/:address" element={<PrivateRoute><WhaleDetail /></PrivateRoute>} />
          <Route path="/defi" element={<Layout><DeFi /></Layout>} />
          <Route path="/integrations" element={<Layout><Integrations /></Layout>} />
          <Route path="/news" element={<PrivateRoute><News /></PrivateRoute>} />
          <Route path="/alpha-ai" element={<PrivateRoute><AlphaAi /></PrivateRoute>} />
          <Route path="/alpha-calls" element={<Layout><AlphaCalls /></Layout>} />
          <Route path="/alphas-feed" element={<PrivateRoute><AlphasFeed /></PrivateRoute>} />
          <Route path="/admin/projects" element={<AdminRoute><AdminProjectDashboard /></AdminRoute>} />
          <Route path="/live-pairs" element={<PrivateRoute><LivePairs /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/airdrop" element={<Layout><Airdrop /></Layout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />

    </>
  );
};

function App() {
  // Solana config
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = import.meta.env.VITE_ALCHEMY_API_KEY 
    ? `https://solana-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    : clusterApiUrl(network);
    
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ErrorBoundary>
      <WagmiConfig config={config as any}>
        <ConnectionProvider endpoint={endpoint}>
          <SolanaWalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  <WalletProvider>
                    <HashRouter>
                      <AppContent />
                    </HashRouter>
                  </WalletProvider>
                </AuthProvider>
              </QueryClientProvider>
            </WalletModalProvider>
          </SolanaWalletProvider>
        </ConnectionProvider>
      </WagmiConfig>
    </ErrorBoundary>
  );
}

export default App;