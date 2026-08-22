import React, { useEffect, Suspense, lazy, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { WagmiConfig, useAccount } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { config } from './lib/wagmi';
import { Layout } from './components/frontend/Layout';
import { ErrorBoundary } from './components/frontend/ErrorBoundary';
import { WalletProvider } from './context/WalletContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { recordVisitor } from './services/mockData';
import { AuthModal } from './components/frontend/AuthModal';
import { UpgradeModal } from './components/frontend/UpgradeModal';
import { AirdropOnboarding } from './components/frontend/AirdropOnboarding';
import { ComingSoonOverlay } from './components/ui/ComingSoonOverlay';
import { getDisabledPages, IS_TEASER_MODE } from './services/config';
import { usePortfolioStream } from './hooks/usePortfolioStream';
import { useFeatures } from './hooks/useFeatures';

// When VITE_LAUNCH_MODE=teaser, only the landing page is reachable — no
// wallet-connect auto-trigger, no other routes, regardless of what URL a
// visitor types or clicks. Landing.tsx already hides its own login CTA in
// this mode, but every other route (including some like /markets that
// aren't behind PrivateRoute at all) was still fully live before this,
// and the wallet-connect effect below would still pop the SIWE auth
// modal and try to hit a backend that isn't deployed yet during a
// pre-launch campaign.
const IS_LOCALHOST_DEV = import.meta.env.DEV && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
// NOTE: Solana wallet-adapter support previously lived here, wrapping the
// entire app unconditionally. Nothing in the codebase calls
// useWallet()/useConnection() from those packages, yet every page load
// fetched and parsed ~383KB (minified) / ~117KB (gzip) of Solana SDK for
// zero functional benefit. The provider setup still exists at
// src/lib/SolanaProviders.tsx; wrap only the specific feature that needs
// it when one is actually built, rather than restoring it here at the root.


// Lazy pages

const CexBag = lazy(() => import('./pages/frontend/CexBag').then(m => ({ default: m.CexBag })));
const DexBag = lazy(() => import('./pages/frontend/DexBag').then(m => ({ default: m.DexBag })));
const Calculator = lazy(() => import('./pages/frontend/Calculator').then(m => ({ default: m.Calculator })));
const AlphasFeed = lazy(() => import('./pages/frontend/AlphasFeed').then(m => ({ default: m.AlphasFeed })));
const MyAlphabag = lazy(() => import('./pages/frontend/MyAlphabag').then(m => ({ default: m.MyAlphabag })));
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
const SecurityScanner = lazy(() => import('./pages/frontend/SecurityScanner').then(m => ({ default: m.SecurityScanner })));

const GlobalLoader = () => null;

const PrivateRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading && !IS_LOCALHOST_DEV) return <GlobalLoader />;
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
};

const RouteGuard = ({ path, title, description, children }: { path: string; title: string; description: string; children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { data: features, isLoading } = useFeatures();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-alphabag-yellow border-t-transparent rounded-full" />
      </div>
    );
  }

  const disabledPages = features?.disabledPages || getDisabledPages();
  if (disabledPages.includes(path)) {
    return (
      <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <ComingSoonOverlay
          title={title}
          description={description}
          onClose={() => navigate('/')}
        />
      </div>
    );
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
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { isConnected, address } = useAccount();
  usePortfolioStream(token, address);

  // Automatic SIWE Trigger after connection — but skip if already authenticated
  useEffect(() => {
    if (IS_TEASER_MODE) return;
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

  if (IS_TEASER_MODE) {
    return (
      <>
        <Suspense fallback={null}>
          <Routes>
            <Route path="*" element={<Landing />} />
          </Routes>
        </Suspense>
      </>
    );
  }

  return (
    <>
      <AirdropTracker />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={
            isLoading && !IS_LOCALHOST_DEV ? <GlobalLoader /> :
            isAuthenticated ? <Layout><MyAlphabag /></Layout> : <Landing />
          } />
          <Route path="/genesis" element={<GenesisLanding />} />
          <Route path="/genesis-manifesto" element={<PrivateRoute><GenesisManifesto /></PrivateRoute>} />
          <Route path="/cex-bag" element={<PrivateRoute><RouteGuard path="/cex-bag" title="CEX Portfolio" description="Centralized exchange balance tracking is in final staging. Launching in Phase 2.0."><CexBag /></RouteGuard></PrivateRoute>} />
          <Route path="/dex-bag" element={<PrivateRoute><RouteGuard path="/dex-bag" title="DEX Portfolio" description="Decentralized wallet tracking is in final staging. Launching in Phase 2.0."><DexBag /></RouteGuard></PrivateRoute>} />
          <Route path="/calculator" element={<PrivateRoute><Calculator /></PrivateRoute>} />
          <Route path="/portfolio" element={<PrivateRoute><RouteGuard path="/portfolio" title="DEX Portfolio" description="Decentralized wallet tracking is in final staging. Launching in Phase 2.0."><Portfolio /></RouteGuard></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/alpha-screener" element={<PrivateRoute><RouteGuard path="/alpha-screener" title="Alpha Screener" description="Real-time multi-chain token screening is in final staging. Launching in Phase 2.0."><AlphaScreener /></RouteGuard></PrivateRoute>} />
          <Route path="/my-alphabag" element={<PrivateRoute><MyAlphabag /></PrivateRoute>} />

          <Route path="/markets" element={<Layout><Markets /></Layout>} />
          <Route path="/markets/:id" element={<Layout><CoinDetail /></Layout>} />
          <Route path="/whales" element={<PrivateRoute><RouteGuard path="/whales" title="Alpha Radar" description="Smart money wallet tracking is in staging. Launching in Phase 2.0."><Whales /></RouteGuard></PrivateRoute>} />
          <Route path="/whales/:address" element={<PrivateRoute><RouteGuard path="/whales" title="Alpha Radar" description="Smart money wallet tracking is in staging. Launching in Phase 2.0."><WhaleDetail /></RouteGuard></PrivateRoute>} />
          <Route path="/defi" element={<Layout><RouteGuard path="/defi" title="DeFi Operations" description="Real-time multi-chain protocol yield and pool tracking is in final staging. Launching in Phase 2.0."><DeFi /></RouteGuard></Layout>} />
          <Route path="/security" element={<PrivateRoute><RouteGuard path="/security" title="Security Radar" description="Real-time approval scanning and risk audit tools are in staging. Launching in Phase 2.0."><SecurityScanner /></RouteGuard></PrivateRoute>} />
          <Route path="/integrations" element={<Layout><RouteGuard path="/integrations" title="Integrations Hub" description="API connections and integrations are in staging. Launching in Phase 2.0."><Integrations /></RouteGuard></Layout>} />
          <Route path="/news" element={<PrivateRoute><News /></PrivateRoute>} />
          <Route path="/alpha-ai" element={<PrivateRoute><RouteGuard path="/alpha-ai" title="Alpha Analyst" description="AI analytics and insight terminal is in staging. Launching in Phase 2.0."><AlphaAi /></RouteGuard></PrivateRoute>} />
          <Route path="/alpha-calls" element={<Layout><RouteGuard path="/alpha-calls" title="Alpha Calls" description="Alpha Calls board is in staging. Launching in Phase 2.0."><AlphaCalls /></RouteGuard></Layout>} />
          <Route path="/alphas-feed" element={<Layout><RouteGuard path="/alphas-feed" title="Alphas Feed" description="Classified community alpha feeds are in staging. Launching in Phase 2.0."><AlphasFeed /></RouteGuard></Layout>} />

          {/* LivePairs route removed */}
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
  return (
    <ErrorBoundary>
      <WagmiConfig config={config as any}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <WalletProvider>
              <HashRouter>
                <AppContent />
              </HashRouter>
            </WalletProvider>
          </AuthProvider>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
</QueryClientProvider>
      </WagmiConfig>
    </ErrorBoundary>
  );
}

export default App;