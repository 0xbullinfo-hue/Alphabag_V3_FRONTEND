import React, { useEffect, Suspense, lazy, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { WagmiConfig, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './lib/wagmi';
import { Layout } from './components/frontend/Layout';
import { ErrorBoundary } from './components/frontend/ErrorBoundary';
import { WalletProvider } from './context/WalletContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { recordVisitor } from './services/mockData';
import { AuthModal } from './components/frontend/AuthModal';
import { UpgradeModal } from './components/frontend/UpgradeModal';
import { AirdropOnboarding } from './components/frontend/AirdropOnboarding';

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

const CexBag = lazy(() => import('./pages/frontend/CexBag').then(m => ({ default: m.CexBag })));
const DexBag = lazy(() => import('./pages/frontend/DexBag').then(m => ({ default: m.DexBag })));
const Calculator = lazy(() => import('./pages/frontend/Calculator').then(m => ({ default: m.Calculator })));
const AlphasFeed = lazy(() => import('./pages/frontend/AlphasFeed').then(m => ({ default: m.AlphasFeed })));
// LivePairs removed

const Markets = lazy(() => import('./pages/frontend/Markets').then(m => ({ default: m.Markets })));
const CoinDetail = lazy(() => import('./pages/frontend/CoinDetail').then(m => ({ default: m.CoinDetail })));
const News = lazy(() => import('./pages/frontend/News').then(m => ({ default: m.News })));
const Settings = lazy(() => import('./pages/frontend/Settings').then(m => ({ default: m.Settings })));
const DeFi = lazy(() => import('./pages/frontend/DeFi').then(m => ({ default: m.DeFi })));
const Integrations = lazy(() => import('./pages/frontend/Integrations').then(m => ({ default: m.Integrations })));
const AlphaAi = lazy(() => import('./pages/frontend/AlphaAi').then(m => ({ default: m.AlphaAi })));
const AlphaCalls = lazy(() => import('./pages/frontend/AlphaCalls').then(m => ({ default: m.AlphaCalls })));
const Landing = lazy(() => import('./pages/frontend/Landing').then(m => ({ default: m.Landing })));
const Whales = lazy(() => import('./pages/frontend/Whales').then(m => ({ default: m.Whales })));
const WhaleDetail = lazy(() => import('./pages/frontend/WhaleDetail').then(m => ({ default: m.WhaleDetail })));
const History = lazy(() => import('./pages/frontend/History').then(m => ({ default: m.HistoryPage })));
const GenesisLanding = lazy(() => import('./pages/frontend/GenesisLanding').then(m => ({ default: m.GenesisLanding })));
const GenesisManifesto = lazy(() => import('./pages/frontend/GenesisManifesto').then(m => ({ default: m.GenesisManifesto })));
const Profile = lazy(() => import('./pages/frontend/Profile').then(m => ({ default: m.Profile })));
const Airdrop = lazy(() => import('./pages/frontend/Airdrop').then(m => ({ default: m.Airdrop })));
const Portfolio = lazy(() => import('./pages/frontend/Portfolio').then(m => ({ default: m.Portfolio })));
const AlphaScreener = lazy(() => import('./pages/frontend/AlphaScreener').then(m => ({ default: m.AlphaScreener })));

const GlobalLoader = () => (
  <div className="min-h-screen bg-alphabag-black flex flex-col items-center justify-center space-y-6">
    <div className="w-12 h-12 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
    <p className="text-[10px] text-alphabag-yellow font-black uppercase tracking-[0.4em] animate-pulse">Synchronizing Protocol Hub...</p>
  </div>
);

const PrivateRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <GlobalLoader />;
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
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
      console.log('[NETWORK] Storing referral code:', refCode);
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
            isAuthenticated ? <Layout><Airdrop /></Layout> : <Landing />
          } />
          <Route path="/genesis" element={<GenesisLanding />} />
          <Route path="/genesis-manifesto" element={<PrivateRoute><GenesisManifesto /></PrivateRoute>} />
          <Route path="/cex-bag" element={<PrivateRoute><CexBag /></PrivateRoute>} />
          <Route path="/dex-bag" element={<PrivateRoute><DexBag /></PrivateRoute>} />
          <Route path="/calculator" element={<PrivateRoute><Calculator /></PrivateRoute>} />
          <Route path="/portfolio" element={<PrivateRoute><Portfolio /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/alpha-screener" element={<PrivateRoute><AlphaScreener /></PrivateRoute>} />

          <Route path="/markets" element={<Layout><Markets /></Layout>} />
          <Route path="/markets/:id" element={<Layout><CoinDetail /></Layout>} />
          <Route path="/whales" element={<PrivateRoute><Whales /></PrivateRoute>} />
          <Route path="/whales/:address" element={<PrivateRoute><WhaleDetail /></PrivateRoute>} />
          <Route path="/defi" element={<Layout><DeFi /></Layout>} />
          <Route path="/integrations" element={<Layout><Integrations /></Layout>} />
          <Route path="/news" element={<PrivateRoute><News /></PrivateRoute>} />
          <Route path="/alpha-ai" element={<PrivateRoute><AlphaAi /></PrivateRoute>} />
          <Route path="/alpha-calls" element={<Layout><AlphaCalls /></Layout>} />
          <Route path="/alphas-feed" element={<Layout><AlphasFeed /></Layout>} />
          // LivePairs route removed
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

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