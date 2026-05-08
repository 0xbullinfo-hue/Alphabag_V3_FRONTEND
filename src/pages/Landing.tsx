import React, { useState, useEffect } from 'react';
import { Shield, Zap, BarChart3, Lock, CheckCircle2, ArrowRight, Wallet, Briefcase, TrendingUp, Bot, Send, Crown, LayoutGrid, X, ShieldCheck, Rocket, Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calculator } from '../pages/Calculator';
import { Markets } from '../pages/Markets';

export const Landing: React.FC = () => {
  const { open } = useWeb3Modal();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'roadmap' | 'faq' | 'calculator' | 'markets'>('home');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/airdrop');
    }
  }, [isAuthenticated, navigate]);

  const handleLaunchApp = () => {
    if (isAuthenticated) {
      navigate('/airdrop');
    } else {
      window.dispatchEvent(new Event('open-login-modal'));
    }
  };

  const handleViewMarkets = () => {
    setActiveTab('markets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (tab: 'home' | 'features' | 'roadmap' | 'faq' | 'calculator' | 'markets') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-alphabag-black min-h-screen text-alphabag-text font-sans overflow-x-hidden selection:bg-alphabag-yellow selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-alphabag-black/80 backdrop-blur-xl border-b border-white/5 shadow-glass">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavClick('home')}>
            <div className="w-10 h-10 bg-zinc-900 border border-white/10 text-alphabag-yellow flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(252,213,53,0.1)]">
              <Lock size={22} fill="currentColor" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-semibold tracking-tighter text-white">Alpha<span className="text-alphabag-yellow">BAG</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold tracking-widest text-alphabag-subtext">
            <button onClick={() => handleNavClick('home')} className={`transition-colors uppercase ${activeTab === 'home' ? 'text-white' : 'hover:text-white'}`}>Home</button>
            <button onClick={() => handleNavClick('features')} className={`transition-colors uppercase ${activeTab === 'features' ? 'text-white' : 'hover:text-white'}`}>Features</button>
            <button onClick={() => handleNavClick('roadmap')} className={`transition-colors uppercase ${activeTab === 'roadmap' ? 'text-white' : 'hover:text-white'}`}>Roadmap</button>
            <button onClick={() => handleNavClick('faq')} className={`transition-colors uppercase ${activeTab === 'faq' ? 'text-white' : 'hover:text-white'}`}>FAQ</button>
            {/* Pricing hidden for beta
            <button onClick={() => scrollToSection('membership')} className="hover:text-white transition-colors uppercase">Pricing</button>
             */}

            {/* Fallback Login Button for Debugging */}
            {!isAuthenticated && (window as any).wagmiAddress ? (
              <Button size="sm" onClick={() => window.location.reload()} className="uppercase font-bold px-6 bg-green-500 text-black animate-pulse">
                Complete Login
              </Button>
            ) : (
              <Button size="sm" onClick={handleLaunchApp} className="uppercase font-semibold px-6 shadow-[0_0_15px_rgba(252,213,53,0.3)] hover:shadow-[0_0_25px_rgba(252,213,53,0.5)] transition-all">
                {isAuthenticated ? 'Open App' : 'Get Started'}
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <LayoutGrid />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-alphabag-dark border-b border-alphabag-gray/50 p-6 flex flex-col space-y-4 animate-slide-in">
            <button onClick={() => handleNavClick('home')} className={`text-left py-2 font-semibold uppercase tracking-widest ${activeTab === 'home' ? 'text-white' : 'text-alphabag-subtext'}`}>Home</button>
            <button onClick={() => handleNavClick('features')} className={`text-left py-2 font-semibold uppercase tracking-widest ${activeTab === 'features' ? 'text-white' : 'text-alphabag-subtext'}`}>Features</button>
            <button onClick={() => handleNavClick('roadmap')} className={`text-left py-2 font-semibold uppercase tracking-widest ${activeTab === 'roadmap' ? 'text-white' : 'text-alphabag-subtext'}`}>Roadmap</button>
            <button onClick={() => handleNavClick('faq')} className={`text-left py-2 font-semibold uppercase tracking-widest ${activeTab === 'faq' ? 'text-white' : 'text-alphabag-subtext'}`}>FAQ</button>
            {/* <button onClick={() => scrollToSection('membership')} className="text-left py-2 font-semibold text-white uppercase tracking-widest">Pricing</button> */}
            <Button size="lg" onClick={handleLaunchApp} className="w-full uppercase font-semibold">{isAuthenticated ? 'Open App' : 'Get Started'}</Button>
          </div>
        )}
      </nav>

      {/* Dynamic Content Area */}
      <div className="flex flex-col w-full min-h-[85vh]">

        {/* Hero Section */}
        {activeTab === 'home' && (
          <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center" >
            {/* Background Gradients - Toned down for professional look */}
            < div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-alphabag-yellow/5 blur-[120px] rounded-full pointer-events-none" ></div >

            <div className="max-w-7xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center space-x-2 bg-alphabag-gray/30 border border-alphabag-gray rounded-full px-4 py-1.5 mb-8 backdrop-blur-md">
                <span className="flex h-2 w-2 relative">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-alphabag-green"></span>
                </span>
                <span className="text-xs font-semibold text-alphabag-subtext uppercase tracking-wider">v1.0 Testnet</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-500 leading-tight">
                Track Your Crypto <span className="text-transparent bg-clip-text bg-gradient-to-b from-alphabag-yellow to-[#B45309]">Total Stealth</span>
              </h1>

              <p className="text-lg md:text-xl text-alphabag-subtext max-w-2xl mx-auto mb-10 leading-relaxed font-normal animate-fade-in-up delay-100">
                Manage diverse Web3 portfolios, track whale movements, and simulate your ROE with real-time accuracy. Access Alpha-grade trade signals and explore ways to earn.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up delay-200">
                <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-alphabag-yellow text-black hover:bg-alphabag-yellowHover border-none shadow-[0_0_20px_rgba(252,213,53,0.3)] transition-all" onClick={handleLaunchApp}>
                  {isAuthenticated ? 'Open Hub' : 'Start Tracking Free'}
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-base border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-md text-white font-medium transition-all" onClick={handleViewMarkets}>
                  Explore Markets
                </Button>
              </div>

              {/* Stats Section */}
              <div className="flex flex-wrap justify-center gap-10 md:gap-24 mt-20 text-center animate-fade-in-up delay-300">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">$100k+</div>
                  <div className="text-xs font-semibold text-alphabag-subtext uppercase tracking-widest">Assets Tracked</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">100+</div>
                  <div className="text-xs font-semibold text-alphabag-subtext uppercase tracking-widest">Active Members</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">250+</div>
                  <div className="text-xs font-semibold text-alphabag-subtext uppercase tracking-widest">Cryptocurrencies</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">99.9%</div>
                  <div className="text-xs font-semibold text-alphabag-subtext uppercase tracking-widest">Uptime</div>
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
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">
                  Alpha <span className="text-alphabag-yellow">Calculator</span>
                </h2>
                <p className="text-alphabag-subtext mt-2 text-sm">Simulate your ROE with real-time accuracy.</p>
              </div>
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
                <h2 className="text-4xl md:text-5xl font-semibold mb-6 uppercase tracking-tighter text-white">Engineered for <span className="text-alphabag-yellow">Alpha</span></h2>
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
                  title="CEX HUB"
                  desc="Connect your exchange APIs for a truly unified overview of your crypto net worth across 20+ major platforms."
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
            </div>
          </section>
        )}

        {/* Terminal Roadmap Section */}
        {activeTab === 'roadmap' && (
          <section id="roadmap" className="py-20 px-6 relative overflow-hidden bg-alphabag-black/40 min-h-[85vh] flex flex-col justify-center">
            <div className="absolute inset-0 bg-alphabag-yellow/5 blur-[120px] rounded-full w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="max-w-[1400px] mx-auto relative z-10 xl:px-8">
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-[0.2em] text-white">Execution <span className="text-alphabag-yellow">Sequence</span></h2>
                <p className="text-alphabag-subtext font-mono text-sm uppercase tracking-widest">// Network_Deployment_Phases</p>
              </div>

              <div className="relative w-full overflow-x-auto pb-12 pt-12 custom-scrollbar snap-x snap-mandatory">
                {/* Main Horizontal Trace */}
                <div className="absolute top-[68px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-alphabag-yellow/50 to-alphabag-gray min-w-[max(100%,1200px)]"></div>

                <div className="flex flex-row gap-6 md:gap-8 w-max px-6 mx-auto min-w-full justify-between items-start mt-10">
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
                      "Beta Member Feedback Integration: Release V1 Web App for community review and UI/UX optimization.",
                      "V2 Beta Deployment: Implement upgraded SocialFi mechanics and premium dashboard features.",
                      "Smart Contract Finalization: Final audit of the automated protection and renounce logic.",
                      "Utility Token Launch: Deploy $BAG on BSC with pre-set allocations."
                    ]}
                  />
                  <RoadmapStep
                    phase="PHASE_03"
                    title="LIQUIDITY_DEPLOYMENT"
                    status="PENDING"
                    points={[
                      "Synthetic Utility Token Implementation: Integrate $BAG as the primary engine for platform access.",
                      "Liquidity Generation Event (LGE): Official PancakeSwap listing with 2-year liquidity lock.",
                      "Protocol Renunciation: Execute contract renouncement post-launch for immutable security.",
                      "Strategic Community Collaborations: Partner with institutional data providers to scale the Alpha Radar.",
                      "Pro-Terminal Release: Launch institutional-grade whale-tracking and SocialFi premium tiers."
                    ]}
                  />
                  <RoadmapStep
                    phase="PHASE_04"
                    title="GLOBAL_DOMINANCE"
                    status="QUEUED"
                    points={["Global Scaling: Expand narrative reach and platform infrastructure to international markets."]}
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
                <h2 className="text-4xl md:text-5xl font-semibold mb-4 uppercase tracking-tighter text-white">System <span className="text-alphabag-yellow">FAQ</span></h2>
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
          <section className="relative pt-24 pb-16 px-6 min-h-[90vh]">
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
        <div className="max-w-7xl mx-auto flex flex-col justify-center items-center text-alphabag-subtext text-xs font-semibold uppercase tracking-widest">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-zinc-900 border border-white/10 text-alphabag-yellow flex items-center justify-center rounded">
              <Lock size={14} fill="currentColor" />
            </div>
            <span className="text-white">Alpha<span className="text-alphabag-yellow">BAG</span> Systems © 2026</span>
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
          <div className={`bg-[#0A0F1C]/90 backdrop-blur-xl border rounded-lg p-5 h-full flex flex-col min-h-[340px] transition-colors duration-300
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
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-alphabag-yellow/50 bg-alphabag-yellow/5 shadow-[0_0_30px_rgba(252,213,53,0.05)]' : 'border-alphabag-gray bg-alphabag-dark hover:border-alphabag-gray/80 hover:bg-white/5'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-bold text-white uppercase tracking-wider text-base">{question}</span>
        <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-alphabag-yellow text-black' : 'bg-white/10 text-white'}`}>
          {isOpen ? <X size={16} /> : <span className="text-xl leading-none font-light mb-1">+</span>}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 pt-0 text-base text-alphabag-subtext leading-relaxed border-t border-alphabag-border mt-2 font-medium">
          {answer}
        </div>
      </div>
    </div>
  );
};

// Component Helpers
const FeatureHighlight = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="bg-alphabag-darkgray/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl hover:border-alphabag-yellow/20 hover:bg-white/5 transition-all group cursor-default shadow-glass">
    <div className="mb-6 bg-alphabag-black w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(252,213,53,0.15)] transition-all">
      {icon}
    </div>
    <h3 className="text-2xl font-semibold text-white mb-3 uppercase tracking-tighter">{title}</h3>
    <p className="text-alphabag-subtext font-medium leading-relaxed">{desc}</p>
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
  <div className={`relative flex flex-col p-8 rounded-3xl border ${recommended ? 'bg-alphabag-dark border-alphabag-yellow shadow-[0_0_40px_rgba(252,213,53,0.1)] scale-105 z-10' : 'bg-alphabag-black border-white/10'}`}>
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-alphabag-yellow text-black text-[10px] font-semibold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg flex items-center">
        <Crown size={12} className="mr-1" fill="currentColor" /> Best Value
      </div>
    )}
    <div className="mb-8 text-center">
      <h3 className="text-alphabag-subtext text-[10px] font-semibold uppercase tracking-[0.3em] mb-2">{tier}</h3>
      <div className="text-4xl font-semibold mb-2 uppercase tracking-tighter text-white">{price}</div>
      {recommended && <div className="text-alphabag-yellow font-semibold text-[10px] uppercase tracking-widest mb-2">ELIGIBILITY: GENESIS HOLDER</div>}
      <div className="text-alphabag-yellow font-semibold text-[10px] uppercase tracking-widest bg-alphabag-yellow/5 inline-block px-3 py-1 rounded border border-alphabag-yellow/20">{tokens}</div>
    </div>
    <ul className="space-y-4 mb-10 flex-1 text-sm font-medium">
      {features.map((f, i) => (
        <li key={i} className="flex items-center space-x-3 text-gray-300">
          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 size={10} className="text-green-400" />
          </div>
          <span className="uppercase text-[11px] tracking-wider font-semibold">{f}</span>
        </li>
      ))}
    </ul>
    <Button variant={recommended ? 'primary' : 'secondary'} size="lg" className="w-full font-semibold py-6 uppercase tracking-widest text-sm" onClick={onAction}>
      {tier.includes('Free') ? 'Start for Free' : 'Secure Ultimate Access'}
    </Button>
  </div>
);
