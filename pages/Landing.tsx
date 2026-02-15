import React, { useState, useEffect } from 'react';
import { Shield, Zap, BarChart3, Lock, CheckCircle2, ArrowRight, Wallet, Briefcase, TrendingUp, Bot, Send, Crown, LayoutGrid, X, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Landing: React.FC = () => {
  const { open } = useWeb3Modal();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/portfolio');
    }
  }, [isAuthenticated, navigate]);

  const handleLaunchApp = () => {
    if (isAuthenticated) {
      navigate('/portfolio');
    } else {
      // Revert to Email/Login Modal
      window.dispatchEvent(new Event('open-login-modal'));
    }
  };
  const handleViewMarkets = () => navigate('/markets');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="bg-alphabag-black min-h-screen text-alphabag-text font-sans overflow-x-hidden selection:bg-alphabag-yellow selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-alphabag-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-alphabag-yellow to-orange-500 text-black flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(252,213,53,0.4)]">
              <Briefcase size={22} fill="currentColor" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-semibold tracking-tighter text-white">Alpha<span className="text-alphabag-yellow">BAG</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold tracking-widest text-alphabag-subtext">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors uppercase">Features</button>
            <button onClick={() => scrollToSection('membership')} className="hover:text-white transition-colors uppercase">Pricing</button>

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
            <button onClick={() => scrollToSection('features')} className="text-left py-2 font-semibold text-white uppercase tracking-widest">Features</button>
            <button onClick={() => scrollToSection('membership')} className="text-left py-2 font-semibold text-white uppercase tracking-widest">Pricing</button>
            <Button size="lg" onClick={handleLaunchApp} className="w-full uppercase font-semibold">{isAuthenticated ? 'Open App' : 'Get Started'}</Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
        {/* Background Gradients - Toned down for professional look */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-alphabag-yellow/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-alphabag-gray/30 border border-alphabag-gray rounded-full px-4 py-1.5 mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-alphabag-green"></span>
            </span>
            <span className="text-xs font-semibold text-alphabag-subtext uppercase tracking-wider">v2.0 Multi-Chain Live</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-semibold mb-6 tracking-tight text-white leading-tight">
            The Terminal <br />
            <span className="text-alphabag-yellow">For Smart Money</span>
          </h1>

          <p className="text-lg text-alphabag-subtext max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Manage diverse Web3 portfolios, track whale movements, and execute institutional-grade strategies from a single, AI-powered command center.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-alphabag-yellow text-black hover:bg-alphabag-yellowHover border-none shadow-none" onClick={handleLaunchApp}>
              {isAuthenticated ? 'Open Terminal' : 'Initialize Node'}
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-base border-alphabag-gray hover:bg-alphabag-gray text-white font-semibold" onClick={handleViewMarkets}>
              Live Markets
            </Button>
          </div>

          {/* 3D Dashboard Preview */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="bg-alphabag-dark rounded-[20px] overflow-hidden relative shadow-2xl border border-alphabag-gray/50">
              <img
                src="/hero-dashboard.png"
                alt="Dashboard Interface"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 uppercase tracking-tighter text-white">Engineered for <span className="text-alphabag-yellow">Alpha</span></h2>
            <p className="text-xl text-alphabag-subtext">Stop using spreadsheets. Upgrade to a terminal aimed at maximizing yield and minimizing latency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureHighlight
              icon={<Bot size={32} className="text-alphabag-yellow" />}
              title="AlphaAi Agent"
              desc="Your personal analyst. Ask about your PnL, request chart generation, or get real-time market sentiment analysis."
            />
            <FeatureHighlight
              icon={<ShieldCheck size={32} className="text-green-400" />}
              title="Multi-Chain Security"
              desc="Track assets across EVM and Solana chains without exposing your private keys. Read-only permissions by default."
            />
            <FeatureHighlight
              icon={<BarChart3 size={32} className="text-blue-400" />}
              title="Whale Watch"
              desc="Follow the smart money. Get alerted when high-net-worth wallets enter or exit positions in real-time."
            />
          </div>
        </div>
      </section>



      {/* Membership Tiers (unchanged logic, updated UI) */}
      <section id="membership" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4 uppercase tracking-tighter text-white">Membership Tiers</h2>
            <p className="text-alphabag-subtext font-medium text-lg">Scale your operation. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              tier="Free Node"
              tokens="Basic Access"
              price="$0"
              onAction={handleLaunchApp}
              features={["5 Portfolio Tracking Nodes", "5 Whale Watch Slots", "AlphaAi (4h Daily)", "Global News Feed"]}
            />
            <PricingCard
              tier="Ultimate Node"
              tokens="All Features Unlocked"
              price="Verified"
              recommended
              onAction={handleLaunchApp}
              features={["Unlimited Portfolios", "Unlimited Whale Watch", "AlphaAi (Unlimited)", "AlphaCalls Full Access", "Institutional PnL Data"]}
            />
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-alphabag-subtext text-xs font-semibold uppercase tracking-widest">
          <div className="mb-4 md:mb-0 flex items-center space-x-2">
            <div className="w-6 h-6 bg-alphabag-yellow text-black flex items-center justify-center rounded">
              <Briefcase size={14} fill="currentColor" />
            </div>
            <span className="text-white">Alpha<span className="text-alphabag-yellow">BAG</span> Systems © 2026</span>
          </div>
          <div className="flex flex-wrap justify-center space-x-8">
            <Link to="/news" className="hover:text-alphabag-yellow transition-colors">Intel</Link>
            <Link to="/markets" className="hover:text-alphabag-yellow transition-colors">Markets</Link>
            <span className="text-white/20">System Status: Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Component Helpers
const FeatureHighlight = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-alphabag-yellow/50 hover:bg-white/10 transition-all group cursor-default">
    <div className="mb-6 bg-black w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-2xl font-semibold text-white mb-3 uppercase tracking-tighter">{title}</h3>
    <p className="text-alphabag-subtext font-medium leading-relaxed">{desc}</p>
  </div>
);

const ComparisonRow = ({ label, spreadsheet, alphabag }: { label: string, spreadsheet: boolean, alphabag: boolean }) => (
  <div className="grid grid-cols-3 gap-4 py-4 border-b border-white/5 items-center">
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
  <div className={`relative flex flex-col p-8 rounded-3xl border ${recommended ? 'bg-alphabag-dark border-alphabag-yellow shadow-[0_0_40px_rgba(252,213,53,0.1)] scale-105 z-10' : 'bg-black border-white/10'}`}>
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-alphabag-yellow text-black text-[10px] font-semibold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg flex items-center">
        <Crown size={12} className="mr-1" fill="currentColor" /> Best Value
      </div>
    )}
    <div className="mb-8 text-center">
      <h3 className="text-alphabag-subtext text-[10px] font-semibold uppercase tracking-[0.3em] mb-2">{tier}</h3>
      <div className="text-4xl font-semibold mb-2 uppercase tracking-tighter text-white">{price}</div>
      {recommended && <div className="text-alphabag-yellow font-semibold text-[10px] uppercase tracking-widest mb-2">HODL 1,000,000+ $BAG</div>}
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