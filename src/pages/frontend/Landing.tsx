import React, { useState, useEffect } from 'react';
import { Shield, Zap, BarChart3, Lock, CheckCircle2, ArrowRight, Wallet, Briefcase, TrendingUp, Bot, Send, Crown, LayoutGrid, X, ShieldCheck, Rocket, Trophy, PieChart, BellRing, ChevronRight, Sun, Moon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calculator } from './Calculator';
import { Markets } from './Markets';

import { IS_DEMO_MODE } from '../../services/config';

// When VITE_LAUNCH_MODE=teaser, the app shows landing only — no auth, no backend required.
const IS_TEASER_MODE = import.meta.env.VITE_LAUNCH_MODE === 'teaser';

export const Landing: React.FC = () => {
  const { open } = useWeb3Modal();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'buy' | 'tokenomics' | 'roadmap' | 'faq' | 'calculator' | 'markets'>('home');
  const [showTeaserToast, setShowTeaserToast] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Only redirect to app if NOT in teaser mode and user is authenticated
    if (!IS_TEASER_MODE && isAuthenticated) {
      navigate('/airdrop');
    }
  }, [isAuthenticated, navigate]);

  const handleLaunchApp = () => {
    if (IS_TEASER_MODE) {
      // In teaser mode — show a "coming soon" notification instead of login
      setShowTeaserToast(true);
      setTimeout(() => setShowTeaserToast(false), 4000);
      return;
    }
    if (isAuthenticated) {
      navigate('/airdrop');
    } else {
      window.dispatchEvent(new Event('open-login-modal'));
    }
  };

  const handleDemoLogin = () => {
    sessionStorage.setItem('alphabag_token', 'mock_dev_token_2026');
    sessionStorage.setItem('alphabag_user', JSON.stringify({
      id: 'mock-user-id',
      email: 'alpha_tester@alphabag.pro',
      tier: 'ULTIMATE',
      alphaAiUsageSeconds: 0,
      lastAlphaAiReset: new Date().toISOString(),
      isAdmin: true,
      onboardingComplete: true
    }));
    window.location.reload();
  };

  const handleViewMarkets = () => {
    setActiveTab('markets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (tab: 'home' | 'features' | 'buy' | 'tokenomics' | 'roadmap' | 'faq' | 'calculator' | 'markets') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-alphabag-black min-h-screen text-alphabag-text overflow-x-hidden">

      {/* ── TEASER TOAST NOTIFICATION ── */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${
        showTeaserToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3 bg-alphabag-dark border border-alphabag-yellow/40 text-white px-5 py-3.5 rounded-xl shadow-[0_0_40px_rgba(252,213,53,0.2)] backdrop-blur-xl">
          <BellRing size={16} className="text-alphabag-yellow animate-bounce" />
          <span className="text-sm font-bold">Testnet is launching soon — <span className="text-alphabag-yellow">stay tuned on Telegram & X.</span></span>
          <button onClick={() => setShowTeaserToast(false)} className="ml-2 text-alphabag-subtext hover:text-white">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── ANNOUNCEMENT BANNER ── */}
      {IS_TEASER_MODE && !bannerDismissed && (
        <div className="w-full bg-gradient-to-r from-alphabag-yellow/10 via-alphabag-yellow/20 to-alphabag-yellow/10 border-b border-alphabag-yellow/20 py-2.5 px-4 flex items-center justify-center gap-3 relative">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alphabag-yellow opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-alphabag-yellow"></span>
          </span>
          <p className="text-xs font-medium text-white text-center">
            Testnet Launching Soon &mdash; Join our community for early access
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-alphabag-yellow text-xs font-medium hover:underline">
              <Send size={11} /> Telegram <ChevronRight size={11} />
            </a>
            <a href="https://x.com/alphabagpro" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-alphabag-yellow text-xs font-medium hover:underline">
              <X size={11} /> Follow <ChevronRight size={11} />
            </a>
          </div>
          <button onClick={() => setBannerDismissed(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-alphabag-subtext hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#181a20]/95 backdrop-blur-xl border-b border-[#2b3139]">
        <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavClick('home')}>
            <img src="/logo.png" alt="AlphaBAG Logo" className="w-6 h-6 object-contain rounded-full shadow-[0_0_20px_rgba(252,213,53,0.1)]" />
            <span className="text-lg font-bold tracking-tight text-[#fcd535]">ALPHABAG</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-[#848e9c]">
            <button onClick={() => handleNavClick('home')} className={`transition-colors ${activeTab === 'home' ? 'text-[#eaecef]' : 'hover:text-[#eaecef]'}`}>Home</button>
            <button onClick={() => handleNavClick('features')} className={`transition-colors ${activeTab === 'features' ? 'text-[#eaecef]' : 'hover:text-[#eaecef]'}`}>Features</button>
            <button onClick={() => handleNavClick('tokenomics')} className={`transition-colors ${activeTab === 'tokenomics' ? 'text-[#eaecef]' : 'hover:text-[#eaecef]'}`}>Tokenomics</button>
            {!IS_TEASER_MODE && <button onClick={() => handleNavClick('buy')} className={`transition-colors ${activeTab === 'buy' ? 'text-[#eaecef]' : 'hover:text-[#eaecef]'}`}>Buy</button>}
            <button onClick={() => handleNavClick('roadmap')} className={`transition-colors ${activeTab === 'roadmap' ? 'text-[#eaecef]' : 'hover:text-[#eaecef]'}`}>Roadmap</button>
            <button onClick={() => handleNavClick('calculator')} className={`transition-colors ${activeTab === 'calculator' ? 'text-[#eaecef]' : 'hover:text-[#eaecef]'}`}>Calculator</button>
            <button onClick={() => handleNavClick('faq')} className={`transition-colors ${activeTab === 'faq' ? 'text-[#eaecef]' : 'hover:text-[#eaecef]'}`}>FAQ</button>

            {/* Fallback Login Button for Debugging */}
            {!isAuthenticated ? (
              IS_DEMO_MODE ? (
                <Button size="sm" onClick={handleDemoLogin} className="font-semibold px-6 bg-alphabag-yellow text-black hover:bg-yellow-400">
                  Demo Login
                </Button>
              ) : (
                <Button size="sm" onClick={handleLaunchApp} className="font-semibold px-6">
                  Connect Wallet
                </Button>
              )
            ) : (
              <Button size="sm" onClick={handleLaunchApp} className="font-semibold px-6">
                Open App
              </Button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-all duration-300 active:scale-[0.98] bg-transparent text-[#848e9c] hover:text-[#eaecef] hover:bg-white/5 border border-transparent hover:border-white/10 shrink-0 ml-2"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[#848e9c]"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <LayoutGrid />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-alphabag-dark border-b border-alphabag-gray/50 p-6 flex flex-col space-y-4 animate-slide-in">
            <button onClick={() => handleNavClick('home')} className={`text-left py-2 text-sm font-medium ${activeTab === 'home' ? 'text-[#eaecef]' : 'text-[#848e9c]'}`}>Home</button>
            <button onClick={() => handleNavClick('features')} className={`text-left py-2 text-sm font-medium ${activeTab === 'features' ? 'text-[#eaecef]' : 'text-[#848e9c]'}`}>Features</button>
            <button onClick={() => handleNavClick('tokenomics')} className={`text-left py-2 text-sm font-medium ${activeTab === 'tokenomics' ? 'text-[#eaecef]' : 'text-[#848e9c]'}`}>Tokenomics</button>
            {!IS_TEASER_MODE && <button onClick={() => handleNavClick('buy')} className={`text-left py-2 text-sm font-medium ${activeTab === 'buy' ? 'text-[#eaecef]' : 'text-[#848e9c]'}`}>Buy</button>}
            <button onClick={() => handleNavClick('roadmap')} className={`text-left py-2 text-sm font-medium ${activeTab === 'roadmap' ? 'text-[#eaecef]' : 'text-[#848e9c]'}`}>Roadmap</button>
            <button onClick={() => handleNavClick('calculator')} className={`text-left py-2 text-sm font-medium ${activeTab === 'calculator' ? 'text-[#eaecef]' : 'text-[#848e9c]'}`}>Calculator</button>
            <button onClick={() => handleNavClick('faq')} className={`text-left py-2 text-sm font-medium ${activeTab === 'faq' ? 'text-[#eaecef]' : 'text-[#848e9c]'}`}>FAQ</button>
            {/* <button onClick={() => scrollToSection('membership')} className="text-left py-2 font-semibold text-white uppercase tracking-widest">Pricing</button> */}
            <Button size="lg" onClick={handleLaunchApp} className="w-full font-semibold">{isAuthenticated ? 'Open App' : 'Notify Me'}</Button>
          </div>
        )}
      </nav>

      {/* Dynamic Content Area */}
      <div className="flex flex-col w-full min-h-[85vh]">

        {/* Hero Section */}
        {activeTab === 'home' && (
          <section className="relative pt-24 pb-20 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center" >
            {/* Background Gradients - Toned down for professional look */}
            < div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-alphabag-yellow/5 blur-[120px] rounded-full pointer-events-none" ></div >

            <div className="max-w-7xl mx-auto text-center relative z-10">


              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-[#eaecef] leading-tight">
                Track Your Crypto <span className="text-transparent bg-clip-text bg-gradient-to-b from-alphabag-yellow to-[#B45309]">Total Stealth</span>
              </h1>

              <p className="text-lg md:text-xl text-alphabag-subtext max-w-2xl mx-auto mb-6 leading-relaxed font-normal animate-fade-in-up delay-100">
                Manage diverse Web3 portfolios, track whale movements, and simulate your ROE with real-time accuracy. Access Alpha-grade trade signals and explore ways to earn.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-8 animate-fade-in-up delay-150">
                {[
                  'Real-time market pulse',
                  'Multi-chain coverage',
                  'Institutional-grade insights'
                ].map((item) => (
                  <span key={item} className="inline-flex items-center rounded-full border border-[#2b3139] bg-[#1e2329] px-3 py-1.5 text-xs font-medium text-[#848e9c]">
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up delay-200">
                {IS_TEASER_MODE ? (
                  <>
                    <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-alphabag-yellow text-black hover:bg-alphabag-yellowHover border-none shadow-[0_0_20px_rgba(252,213,53,0.3)] transition-all" onClick={handleLaunchApp}>
                      Notify Me at Launch
                    </Button>
                    <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-base border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-md text-white font-medium transition-all flex items-center gap-2">
                        <Send size={16} /> Join Telegram
                      </Button>
                    </a>
                  </>
                ) : (
                  <>
                    <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-alphabag-yellow text-black hover:bg-alphabag-yellowHover border-none shadow-[0_0_20px_rgba(252,213,53,0.3)] transition-all" onClick={isAuthenticated ? handleLaunchApp : (IS_DEMO_MODE ? handleDemoLogin : handleLaunchApp)}>
                      {isAuthenticated ? 'Open Hub' : (IS_DEMO_MODE ? 'Enter Terminal (Demo)' : 'Connect Wallet')}
                    </Button>
                    <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-base border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-md text-white font-medium transition-all flex items-center gap-2">
                        <Send size={16} /> Join community
                      </Button>
                    </a>
                  </>
                )}
              </div>

              {/* Stats Section */}
              <div className="flex flex-wrap justify-center gap-10 md:gap-24 mt-20 text-center animate-fade-in-up delay-300">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-[#eaecef] mb-2">$100k+</div>
                  <div className="text-sm font-medium text-[#848e9c]">Assets tracked</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-[#eaecef] mb-2">100+</div>
                  <div className="text-sm font-medium text-[#848e9c]">Active members</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-[#eaecef] mb-2">250+</div>
                  <div className="text-sm font-medium text-[#848e9c]">Cryptocurrencies</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-[#eaecef] mb-2">99.9%</div>
                  <div className="text-sm font-medium text-[#848e9c]">System uptime</div>
                </div>
              </div>

              {/* 3D Dashboard Preview */}
              <div className="mt-24 relative max-w-5xl mx-auto opacity-40 hover:opacity-100 transition-opacity duration-1000 block">
                <div className="bg-alphabag-dark rounded-[20px] overflow-hidden relative shadow-2xl border border-alphabag-gray/50 mask-image-b">
                  <img
                    src="/hero-dashboard.png"
                    alt="Dashboard Interface"
                    className="w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-alphabag-black via-alphabag-black/50 to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Standalone Calculator Section */}
        {activeTab === 'calculator' && (
          <section className="relative pt-24 pb-16 px-6 min-h-[90vh] flex flex-col justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-alphabag-yellow/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="max-w-7xl mx-auto flex flex-col relative z-10 w-full">
              <div className="relative max-w-6xl mx-auto w-full">
                {/* Glow removed, width expanded to max-w-6xl to accommodate the full interactive calculator grid */}
                <Calculator />
              </div>
            </div>
          </section>
        )}

        {/* Features Grid */}
        {activeTab === 'features' && (
          <section id="features" className="py-32 px-6 min-h-[85vh] flex flex-col justify-center">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight text-[#eaecef]">Engineered for <span className="text-alphabag-yellow">Alpha</span></h2>
                <p className="text-xl text-alphabag-subtext">Stop using spreadsheets. Upgrade to a hub aimed at maximizing yield and minimizing latency.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureHighlight
                  icon={<Bot size={32} className="text-alphabag-yellow" />}
                  title="AlphaAi Agent"
                  desc="Your personal analyst. Ask about your PnL, request chart generation, or get real-time market sentiment analysis."
                />
                <FeatureHighlight
                  icon={<ShieldCheck size={32} className="text-green-400" />}
                  title="Multi-Network Security"
                  desc="Track assets across EVM and Solana networks without exposing your private keys. Read-only permissions by default."
                />
                <FeatureHighlight
                  icon={<BarChart3 size={32} className="text-blue-400" />}
                  title="Whale Watch"
                  desc="Follow the smart money. Get alerted when high-net-worth wallets enter or exit positions in real-time."
                />
                <FeatureHighlight
                  icon={<Wallet size={32} className="text-purple-400" />}
                  title="CEX/DEX HUB"
                  desc="Connect your DEX Wallets and exchange APIs for a truly unified overview of your crypto net worth across 20+ major platforms."
                />
                <FeatureHighlight
                  icon={<Rocket size={32} className="text-[#D8B4FE]" />}
                  title="Alpha Calculator"
                  desc="Simulate complex futures and spot trades with real-time accuracy before executing on-chain."
                />
                <FeatureHighlight
                  icon={<Trophy size={32} className="text-alphabag-yellow" />}
                  title="T2E REWARDS"
                  desc="Participate in the ecosystem through missions and social tasks to earn your share of the $BAG allocation."
                />
              </div>

              {/* Why AlphaBAG Section */}
              <div className="mt-32 pt-20 border-t border-white/5 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-alphabag-yellow/20 to-transparent"></div>
                
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-semibold mb-6 tracking-tight text-[#eaecef]">Why <span className="text-alphabag-yellow">AlphaBAG?</span></h2>
                  <p className="text-base text-alphabag-subtext max-w-2xl mx-auto">
                    Built by traders, for traders. We strip away the noise and deliver high-frequency intelligence directly to your terminal. No emotional biases, just raw, actionable data.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 shrink-0 bg-alphabag-yellow/10 text-alphabag-yellow flex items-center justify-center rounded-xl border border-alphabag-yellow/20">
                        <Zap size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#eaecef] tracking-tight mb-2">Zero Latency Execution</h4>
                        <p className="text-sm text-alphabag-subtext leading-relaxed">Unlike traditional dashboards that cache data for minutes, AlphaBAG connects directly to RPC nodes to provide split-second updates on whale movements and market shifts.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 shrink-0 bg-green-500/10 text-green-500 flex items-center justify-center rounded-xl border border-green-500/20">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#eaecef] tracking-tight mb-2">Absolute Privacy</h4>
                        <p className="text-sm text-alphabag-subtext leading-relaxed">We operate in a fully stealth, read-only environment. Your private keys never touch our servers. Monitor your wealth with total peace of mind.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 shrink-0 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-xl border border-blue-500/20">
                        <Bot size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#eaecef] tracking-tight mb-2">AlphaAi Integration</h4>
                        <p className="text-sm text-alphabag-subtext leading-relaxed">Stop manually parsing charts. Our proprietary LLM analyzes technical structures and order book flow to deliver institutional-grade trade setups directly to your inbox.</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-full min-h-[300px] rounded-3xl border border-white/10 bg-alphabag-dark overflow-hidden flex items-center justify-center group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-alphabag-yellow/5 to-transparent"></div>
                    <div className="w-24 h-24 bg-alphabag-black border border-white/5 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(252,213,53,0.1)] group-hover:scale-110 group-hover:shadow-[0_0_80px_rgba(252,213,53,0.2)] transition-all duration-700 relative z-10">
                      <Lock size={40} className="text-alphabag-yellow" />
                    </div>
                    <div className="absolute w-full h-full inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tokenomics Section */}
        {activeTab === 'tokenomics' && (
          <section className="relative pt-40 pb-24 px-6 min-h-[85vh] flex flex-col justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-alphabag-yellow/5 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto relative z-10 w-full">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-[#eaecef]">Alphabag <span className="text-alphabag-yellow">Tokenomics</span></h2>
                <p className="text-[#848e9c] text-sm max-w-4xl mx-auto leading-relaxed">Detailed token distribution and exact tokenomics for Alphabag ecosystem</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metrics */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <TokenMetricCard label="Token Name" value="AlphaBAG (Not Yet Live)" icon={<Briefcase />} />
                  <TokenMetricCard label="Ticker" value="$BAG" isMasked icon={<TrendingUp />} />
                  <TokenMetricCard label="Network" value="BNB Smart Chain" icon={<LayoutGrid />} />
                  <TokenMetricCard label="Total Supply" value="21,000,000" icon={<PieChart />} />
                  <TokenMetricCard label="Contract Address" value="TBA" icon={<Lock />} />
                </div>

                {/* Right Column: Allocations Unmasked */}
                <div className="lg:col-span-2 relative bg-alphabag-dark border border-white/5 rounded-3xl p-8 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full">
                    <TokenomicsDetailCard title="Liquidity Pool (LP)" percentage="30%" desc="Paired initially with BNB upon PancakeSwap deployment. burnt to secure the market floor." />
                    <TokenomicsDetailCard title="Trade-to-Earn (T2E)" percentage="35%" desc="Emission-based distribution. Tokens are systematically distributed to users through Our task-to-earn gamification and ecosystem engagement over an extended timeline, eliminating massive upfront supply shocks. Allocation locked for 3months. released to activate the Alpha-drops T2E dapp" />
                    <TokenomicsDetailCard title="Development & Ecosystem" percentage="15%" desc="Allocated for infrastructure upgrades, API integrations, and core platform development. Automated post-deployment allocation." />
                    <TokenomicsDetailCard title="Marketing & Strategic Growth" percentage="10%" desc="Distributed directly to designated marketing for ecosystem expansion and strategic partnerships." />
                    <TokenomicsDetailCard title="Team & Advisors" percentage="10%" desc="Distributed to team custody at deployment, guarded by strict multi-sig parameters and long-term ecosystem commitment thresholds. locked for 12months with stiff unlock strategy (more details soon)" />
                    <TokenomicsDetailCard title="TOTAL SUPPLY" percentage="100%" subtitle="21,000,000" desc="Strictly hard-capped supply. No mint function exists post-deployment." highlight />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* How to Buy Section */}
        {activeTab === 'buy' && (
          <section className="relative pt-40 pb-24 px-6 min-h-[85vh] flex flex-col justify-center">
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(252,213,53,0.05) 0%, transparent 70%)', backgroundSize: '100% 100%' }}></div>
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(252,213,53,0.4) 1px, transparent 0)', backgroundSize: '60px 60px' }}></div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-alphabag-yellow/5 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-alphabag-yellow/5 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-alphabag-yellow/5 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10 w-full">
              <div className="text-center md:text-left mb-20 relative">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                  <div className="h-px w-8 bg-alphabag-yellow"></div>
                  <span className="text-[10px] font-bold text-alphabag-yellow uppercase tracking-[0.3em]">Get Started</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-[#eaecef]">How to <span className="text-alphabag-yellow">Buy</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {/* Horizontal Connection Line */}
                <div className="hidden md:block absolute top-8 left-10 right-10 h-px bg-white/10 z-0"></div>

                <BuyStepCard 
                  step="01" 
                  title="CREATE WALLET" 
                  desc="Download Trust Wallet or MetaMask and create a new wallet. Save your seed phrase securely."
                />
                <BuyStepCard 
                  step="02" 
                  title="FUND WITH BNB" 
                  desc="Purchase BNB from any exchange (Binance, Coinbase) and transfer it to your wallet."
                />
                <BuyStepCard 
                  step="03" 
                  title="CONNECT TO DEX" 
                  desc="Visit PancakeSwap and connect your wallet to the BNB Smart Chain network."
                />
                <BuyStepCard 
                  step="04" 
                  title="PASTE CONTRACT" 
                  desc={
                    <span>
                      In the swap interface, paste the <span className="text-white/20 blur-[3px] select-none">$BAG</span> contract address to find the token. 
                      <span className="block mt-2 text-[10px] text-alphabag-yellow font-bold uppercase tracking-tight">
                        ONLY USE CA FROM OUR WEBSITE OR OFFICIAL COMMUNITY CHANELS/GROUPS WHEN WE ARE LIVE.
                      </span>
                    </span>
                  }
                />
                <BuyStepCard 
                  step="05" 
                  title={<span>SWAP FOR <span className="text-white/20 blur-[4px] select-none inline-block">$BAG</span></span>}
                  desc={<span>Enter the amount of BNB, confirm the swap, and welcome to the <span className="text-white/20 blur-[3px] select-none inline-block">$BAG</span> community.</span>}
                />
              </div>

              <div className="mt-24 flex justify-center">
                <div className="bg-[#1e2329] border border-alphabag-yellow text-alphabag-yellow font-semibold px-8 py-4 rounded cursor-not-allowed flex items-center gap-3">
                  <ArrowRight size={18} /> Swap on PancakeSwap (coming soon)
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Terminal Roadmap Section */}
        {activeTab === 'roadmap' && (
          <section id="roadmap" className="pt-40 pb-24 px-6 relative overflow-hidden bg-alphabag-black/40 min-h-[85vh] flex flex-col justify-center">
            <div className="absolute inset-0 bg-alphabag-yellow/5 blur-[120px] rounded-full w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="max-w-[1400px] mx-auto relative z-10 xl:px-8">
              <div className="text-center mb-8 mt-12">
                <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-[#eaecef]">Execution <span className="text-alphabag-yellow">Sequence</span></h2>
                <p className="text-[#848e9c] text-sm">Network Deployment Phases</p>
              </div>

              <div className="relative w-full overflow-x-auto pb-12 pt-12 custom-scrollbar snap-x snap-mandatory">
                {/* Main Horizontal Trace */}
                <div className="absolute top-[68px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-alphabag-yellow/50 to-alphabag-gray min-w-[max(100%,1200px)]"></div>

                <div className="flex flex-row gap-6 md:gap-8 w-max px-6 mx-auto min-w-full justify-between items-start mt-4">
                  <RoadmapStep
                    phase="PHASE_01"
                    title="CORE_INITIALIZATION"
                    status="VERIFIED"
                    points={[
                      "System Core Architecture Defined: Finalize full-stack infrastructure for high-frequency data.",
                      "Smart Contract Beta Deployment: Develop 21M fixed-supply $BAG contract with internal auto-tax logic.",
                      "Internal AlphaAi Logic Initialized: Develop core tracking and SocialFi algorithms for the Alpha Radar.",
                      "V1 Platform Launch & Stress Testing: Conduct internal testing of dashboard performance and security."
                    ]}
                  />
                  <RoadmapStep
                    phase="PHASE_02"
                    title="SYSTEM_EXPANSION & DEPLOYMENT"
                    status="EXECUTING"
                    points={[
                      "Community Onboarding & Genesis Campaign: Launch initial marketing to acquire high-conviction holders.",
                      "Smart Contract Finalization: Final audit of the automated protection and renounce logic.",
                      "Utility Token Launch: Deploy token on BSC with pre-set allocations. Execute contract renouncement post-launch for immutable security. Burn liquidity.",
                      "V1 Beta Deployment: Implement upgraded mechanics dashboard features launch for user testing."
                    ]}
                  />
                  <RoadmapStep
                    phase="PHASE_03"
                    title="LIQUIDITY_DEPLOYMENT"
                    status="PENDING"
                    points={[
                      "Synthetic Utility Token Implementation: Integrate Utility token as the primary engine for platform features access.",
                      "Strategic Community Collaborations: Partner with institutional data providers to scale all features in Alphabag.",
                      "Pro-Terminal Release: Launch top tier functions on Alphabag for tier holders"
                    ]}
                  />
                  <RoadmapStep
                    phase="PHASE_04"
                    title="GLOBAL_DOMINANCE"
                    status="QUEUED"
                    points={[
                      "Global Scaling: Expand narrative reach and platform infrastructure to international markets.",
                      "Future development: Expand use-case to adapt to mobile usage"
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {activeTab === 'faq' && (
          <section id="faq" className="py-24 px-6 border-y border-alphabag-border bg-alphabag-black min-h-[85vh] flex flex-col justify-center">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-[#eaecef]">System <span className="text-alphabag-yellow">FAQ</span></h2>
                <p className="text-lg text-alphabag-subtext max-w-2xl mx-auto">Everything you need to know about the AlphaBAG hub and ecosystem.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Column */}
                <div className="space-y-6">
                  <FaqItem
                    question="What is AlphaBAG?"
                    answer="AlphaBAG is an advanced centralized intelligence hub for smart investors. It aggregates portfolio tracking, whale watching, and AI-driven market analysis into a single, professional interface."
                  />
                  <FaqItem
                    question="Is my wallet data secure?"
                    answer="Absolutely. AlphaBAG operates on a strict read-only basis for portfolio tracking. We never ask for your private keys, and our hub cannot execute transactions on your behalf without explicit confirmation via your wallet provider."
                  />
                  <FaqItem
                    question="How does AlphaBAG conversion work?"
                    answer="AlphaBAG is the synthetic utility metric powering the hub ecosystem during the Genesis Phase. Upon official launch, top-tier AlphaBAG members who have verified their wallets holdings will be eligible to access Alphabag feature."
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <FaqItem
                    question="How does AlphaAI work?"
                    answer="AlphaAI utilizes fine-tuned large language models (LLMs) with access to real-time market data. It can analyze your specific portfolio composition against current market trends to provide actionable, natural-language insights."
                  />
                  <FaqItem
                    question="Which blockchain networks are supported?"
                    answer="Currently, tracking is fully integrated across all major EVM-compatible networks (Ethereum, BSC, Polygon, Arbitrum, Avalanche, Base) as well as the Solana network. We are actively developing support for more non-EVM ecosystems."
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Global Markets Section */}
        {activeTab === 'markets' && (
          <section className="relative pt-20 pb-20 px-6 min-h-[90vh]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-alphabag-yellow/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="max-w-7xl mx-auto relative z-10 w-full">
               <Markets />
            </div>
          </section>
        )}

      </div> {/* End Dynamic Content Area */}

      {/* Hidden Pricing for Beta */}
      {
        false && (
          <section id="membership" className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-semibold mb-4 uppercase tracking-tighter text-white">Membership Tiers</h2>
                <p className="text-alphabag-subtext font-medium text-lg">Scale your operation. Cancel anytime.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <PricingCard
                  tier="Free Tier"
                  tokens="Basic Access"
                  price="$0"
                  onAction={handleLaunchApp}
                  features={["5 Portfolio Connections", "5 Whale Watch Slots", "AlphaAi (4h Daily)", "Global News Feed"]}
                />
                <PricingCard
                  tier="Ultimate Tier"
                  tokens="All Features Unlocked"
                  price="Verified"
                  recommended
                  onAction={handleLaunchApp}
                  features={["Unlimited Portfolios", "Unlimited Whale Watch", "AlphaAi (Unlimited)", "AlphaCalls Full Access", "Institutional PnL Data"]}
                />
              </div>
            </div>
          </section>
        )
      }

      <footer className="py-12 px-6 border-t border-white/10 bg-alphabag-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-zinc-900 border border-white/10 text-alphabag-yellow flex items-center justify-center rounded">
              <Lock size={14} fill="currentColor" />
            </div>
            <span className="text-white text-xs font-semibold uppercase tracking-widest">ALPHABAG Systems © 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://x.com/alphabagpro" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-alphabag-muted hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2">
              <X size={14} /> Twitter
            </a>
            <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-alphabag-muted hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2">
              <Send size={14} /> Telegram
            </a>
          </div>

          <div className="text-[9px] text-alphabag-muted font-bold uppercase tracking-widest opacity-50">
            v1.0 Testnet Phase
          </div>
        </div>
      </footer>
    </div >
  );
};

// Component Helpers
const RoadmapStep = ({ phase, title, status, points }: { phase: string, title: string, status: 'VERIFIED' | 'EXECUTING' | 'PENDING' | 'QUEUED', points: string[] }) => {
  const statusColors = {
    VERIFIED: "text-green-500 bg-green-500/10 border-green-500/20",
    EXECUTING: "text-alphabag-yellow bg-alphabag-yellow/10 border-alphabag-yellow/20 animate-pulse",
    PENDING: "text-[#8BA1C9] bg-white/5 border-white/10",
    QUEUED: "text-alphabag-subtext bg-transparent border-alphabag-border"
  };

  const statusIndicatorColors = {
    VERIFIED: "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]",
    EXECUTING: "bg-alphabag-yellow shadow-[0_0_15px_rgba(252,213,53,0.5)]",
    PENDING: "bg-[#8BA1C9] border border-white/20",
    QUEUED: "bg-alphabag-gray"
  };

  return (
    <div className="relative flex flex-col items-center w-[280px] shrink-0 snap-center group">

      {/* Horizontal Timeline Indicator */}
      <div className={`absolute -top-12 w-4 h-4 rounded-full z-20 ${statusIndicatorColors[status]}`}>
        {status === 'EXECUTING' && (
          <div className="absolute inset-0 rounded-full border-2 border-alphabag-yellow animate-ping"></div>
        )}
      </div>

      {/* Vertical Connector Line (from horizontal trace to box) */}
      <div className={`absolute -top-12 w-px h-12 border-l border-dashed ${status === 'VERIFIED' ? 'border-green-500/30' : status === 'EXECUTING' ? 'border-alphabag-yellow/30' : 'border-white/10'}`}></div>

      {/* Content Box */}
      <div className="w-full">
        <div className={`p-[1px] rounded-xl bg-gradient-to-br transition-all duration-300 transform group-hover:-translate-y-2
            ${status === 'EXECUTING' ? 'from-alphabag-yellow/30 via-alphabag-yellow/5 to-transparent' : status === 'VERIFIED' ? 'from-green-500/20 via-green-500/5 to-transparent' : 'from-white/10 via-transparent to-transparent'}
          `}>
          <div className={`bg-[#0A0F1C]/90 backdrop-blur-xl border rounded-xl p-4 h-full flex flex-col min-h-[320px] transition-colors duration-300
               ${status === 'EXECUTING' ? 'border-alphabag-yellow/30 shadow-[0_0_30px_rgba(252,213,53,0.05)]' : 'border-alphabag-border'}
            `}>
            {/* Header Info */}
            <div className="flex justify-between items-start mb-4 gap-2">
              <div>
                <div className="text-[10px] font-mono text-alphabag-subtext mb-1 tracking-widest">{phase}</div>
                <h3 className={`text-sm font-bold font-mono tracking-tight uppercase ${status === 'EXECUTING' ? 'text-alphabag-yellow' : 'text-white'}`}>
                  {">"} {title}
                </h3>
              </div>
              <div className={`px-2 py-1 text-[9px] font-mono uppercase font-bold tracking-widest rounded border shrink-0 ${statusColors[status]}`}>
                {status}
              </div>
            </div>

            {/* Tasks List */}
            <ul className="space-y-2 font-mono text-[11px] leading-tight">
              {points.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`text-[9px] mt-0.5 shrink-0 ${status === 'VERIFIED' ? 'text-green-500' : 'text-alphabag-subtext'}`}>
                    {status === 'VERIFIED' ? '[✓]' : '[ ]'}
                  </span>
                  <span className={`${status === 'QUEUED' ? 'text-alphabag-subtext/50' : 'text-[#8BA1C9]'}`}>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-alphabag-yellow/50 bg-alphabag-yellow/5 shadow-[0_0_30px_rgba(252,213,53,0.05)]' : 'border-alphabag-gray bg-alphabag-dark hover:border-alphabag-gray/80 hover:bg-white/5'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-bold text-white uppercase tracking-wider text-sm">{question}</span>
        <div className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-alphabag-yellow text-black' : 'bg-white/10 text-white'}`}>
          {isOpen ? <X size={14} /> : <span className="text-lg leading-none font-light mb-1">+</span>}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 pt-0 text-[13px] text-alphabag-subtext leading-relaxed border-t border-alphabag-border mt-1 font-medium opacity-60">
          {answer}
        </div>
      </div>
    </div>
  );
};

// Component Helpers
const FeatureHighlight = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="bg-alphabag-darkgray/40 backdrop-blur-xl border border-white/5 p-4 rounded-xl hover:border-alphabag-yellow/20 hover:bg-white/5 transition-all group cursor-default shadow-glass">
    <div className="mb-2.5 bg-alphabag-black w-9 h-9 rounded-lg flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(252,213,53,0.15)] transition-all">
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <h3 className="text-lg font-black text-white mb-1.5 uppercase tracking-tighter leading-tight">{title}</h3>
    <p className="text-[13px] text-alphabag-subtext font-medium leading-relaxed opacity-60">{desc}</p>
  </div>
);

const BuyStepCard = ({ step, title, desc }: { step: string, title: React.ReactNode, desc: React.ReactNode }) => (
  <div className="relative flex flex-col items-center text-center group mt-8 md:mt-0">
    <div className="w-12 h-12 bg-alphabag-black border border-alphabag-yellow/30 text-alphabag-yellow text-base font-black rounded-lg flex items-center justify-center mb-3 relative z-10 shadow-[0_0_20px_rgba(252,213,53,0.1)] group-hover:shadow-[0_0_30px_rgba(252,213,53,0.3)] group-hover:scale-110 transition-all duration-300">
      {step}
    </div>
    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.1em] mb-2 h-8 flex items-center justify-center">{title}</h3>
    <p className="text-[10px] text-alphabag-subtext leading-relaxed font-medium px-2 opacity-60">{desc}</p>
  </div>
);

const TokenMetricCard = ({ label, value, icon, isMasked }: { label: string, value: string, icon: any, isMasked?: boolean }) => (
  <div className="bg-alphabag-dark border border-white/5 p-5 md:p-6 rounded-2xl flex items-center gap-4 md:gap-5 hover:border-alphabag-yellow/20 hover:bg-white/5 transition-all group h-full shadow-lg">
    <div className="w-12 h-12 shrink-0 bg-alphabag-black border border-white/5 rounded-xl flex items-center justify-center text-alphabag-yellow group-hover:scale-110 transition-transform shadow-inner">
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <div>
      <div className="text-xs text-alphabag-subtext font-black uppercase tracking-widest mb-1 opacity-80">{label}</div>
      <div className={`text-lg md:text-xl font-black text-white uppercase tracking-tighter leading-none ${isMasked ? 'text-transparent blur-[6px] select-none bg-clip-text bg-white' : ''}`}>
        {value}
      </div>
    </div>
  </div>
);

const TokenomicsDetailCard = ({ title, percentage, subtitle, desc, highlight }: { title: string, percentage: string, subtitle?: string, desc: string, highlight?: boolean }) => (
  <div className={`p-6 rounded-2xl border flex flex-col h-full ${highlight ? 'bg-alphabag-yellow/10 border-alphabag-yellow shadow-[0_0_30px_rgba(252,213,53,0.15)]' : 'bg-white/5 border-white/10 hover:border-alphabag-yellow/30'} transition-all`}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className={`text-sm md:text-base font-black uppercase tracking-tight ${highlight ? 'text-alphabag-yellow' : 'text-white'}`}>{title}</h4>
        {subtitle && <div className="text-xs md:text-sm font-bold text-alphabag-yellow mt-1">{subtitle}</div>}
      </div>
      <div className={`text-xl md:text-2xl font-black ${highlight ? 'text-alphabag-yellow' : 'text-white'}`}>{percentage}</div>
    </div>
    <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-medium">{desc}</p>
  </div>
);

const ComparisonRow = ({ label, spreadsheet, alphabag }: { label: string, spreadsheet: boolean, alphabag: boolean }) => (
  <div className="grid grid-cols-3 gap-4 py-4 border-b border-alphabag-border items-center">
    <div className="col-span-1 font-semibold text-white text-sm md:text-base">{label}</div>
    <div className="col-span-1 flex justify-center">
      {spreadsheet ? <CheckCircle2 className="text-green-500" size={20} /> : <X className="text-white/20" size={20} />}
    </div>
    <div className="col-span-1 flex justify-center">
      {alphabag ? <div className="bg-alphabag-yellow/20 p-1 rounded-full"><CheckCircle2 className="text-alphabag-yellow" size={20} /></div> : <X className="text-red-500" size={20} />}
    </div>
  </div>
);

const PricingCard = ({ tier, tokens, price, features, recommended = false, onAction }: { tier: string, tokens: string, price: string, features: string[], recommended?: boolean, onAction: () => void }) => (
  <div className={`relative flex flex-col p-6 rounded-xl border ${recommended ? 'bg-alphabag-dark border-alphabag-yellow shadow-[0_0_40px_rgba(252,213,53,0.1)] scale-105 z-10' : 'bg-alphabag-black border-white/10'}`}>
    {recommended && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-alphabag-yellow text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg flex items-center">
        <Crown size={10} className="mr-1" fill="currentColor" /> Best Value
      </div>
    )}
    <div className="mb-6 text-center">
      <h3 className="text-alphabag-subtext text-[9px] font-black uppercase tracking-[0.3em] mb-1.5 opacity-60">{tier}</h3>
      <div className="text-3xl font-black mb-1.5 uppercase tracking-tighter text-white">{price}</div>
      {recommended && <div className="text-alphabag-yellow font-black text-[9px] uppercase tracking-widest mb-1.5">ELIGIBILITY: GENESIS HOLDER</div>}
      <div className="text-alphabag-yellow font-black text-[9px] uppercase tracking-widest bg-alphabag-yellow/5 inline-block px-2.5 py-1 rounded border border-alphabag-yellow/20">{tokens}</div>
    </div>
    <ul className="space-y-3 mb-8 flex-1 text-[11px] font-bold">
      {features.map((f, i) => (
        <li key={i} className="flex items-center space-x-2.5 text-gray-400">
          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 size={8} className="text-green-400" />
          </div>
          <span className="uppercase tracking-widest opacity-80">{f}</span>
        </li>
      ))}
    </ul>
    <Button variant={recommended ? 'primary' : 'secondary'} size="lg" className="w-full font-black py-4 uppercase tracking-widest text-[11px] h-12 rounded-xl" onClick={onAction}>
      {tier.includes('Free') ? 'Start for Free' : 'Secure Ultimate Access'}
    </Button>
  </div>
);
