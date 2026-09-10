import { SEO } from '../../components/common/SEO';
import React from 'react';
import {
  Crown,
  Diamond,
  Gem,
  Image as ImageIcon,
  Layers,
  Lock,
  Palette,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Users,
  Wallet,
  Zap
} from 'lucide-react';

// ── Alpha-Access Page ────────────────────────────────────────────────────────
// Exclusive NFT art collection for AlphaBAG utility access.
// Entire page is masked with a translucent "Coming Soon" overlay.

const COLLECTION_STATS = [
  { label: 'Total Supply', value: '4,000', icon: <Layers size={20} /> },
  { label: 'Unique Traits', value: '200+', icon: <Palette size={20} /> },
  { label: 'Blockchain', value: 'BNB Chain', icon: <Shield size={20} /> },
  { label: 'Mint Price', value: '0.07 BNB', icon: <Diamond size={20} /> },
];

const UTILITY_FEATURES = [
  {
    icon: <Zap size={24} />,
    title: 'Platform Access',
    desc: 'Unlock premium features, advanced analytics, and exclusive trading tools within the AlphaBAG ecosystem.',
  },
  {
    icon: <Crown size={24} />,
    title: 'Tier-Based Perks',
    desc: 'Rarity determines your tier — higher rarity grants elevated platform privileges and priority access.',
  },
  {
    icon: <Trophy size={24} />,
    title: 'T2E Boosters',
    desc: 'NFT holders receive multiplied Trade-to-Earn rewards, stacking with platform engagement.',
  },
  {
    icon: <Users size={24} />,
    title: 'DAO Governance',
    desc: 'Vote on platform proposals, feature requests, and ecosystem fund allocations.',
  },
  {
    icon: <Star size={24} />,
    title: 'Airdrop Priority',
    desc: 'Holders are first in line for future token airdrops, partner project drops, and exclusive events.',
  },
  {
    icon: <Sparkles size={24} />,
    title: 'Alpha Signals',
    desc: 'Access private alpha channels with institutional-grade trade signals and whale movement alerts.',
  },
];

const RARITY_TIERS = [
  { name: 'Common', pct: '50%', color: '#94a3b8' },
  { name: 'Rare', pct: '25%', color: '#3b82f6' },
  { name: 'Epic', pct: '15%', color: '#a855f7' },
  { name: 'Legendary', pct: '8%', color: '#f59e0b' },
  { name: 'Mythic', pct: '2%', color: '#ef4444' },
];

export const AlphaAccess: React.FC = () => {
  return (
    <div className="min-h-screen text-alphabag-text overflow-x-hidden bg-alphabag-black relative" style={{ backgroundImage: 'radial-gradient(circle at 18% 12%, rgba(245, 203, 66, 0.08), transparent 26%), radial-gradient(circle at 86% 8%, rgba(255, 255, 255, 0.05), transparent 22%), linear-gradient(180deg, rgba(22,26,34,1) 0%, rgba(22,26,34,1) 100%)' }}>
      <SEO
        title="Alpha-Access | AlphaBAG NFT Collection"
        description="Explore the Alpha-Access NFT collection — exclusive art pieces that unlock premium utility within the AlphaBAG platform."
        canonicalUrl="/alpha-access"
      />

      {/* ── Coming Soon translucent mask ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(22,26,34,0.78)' }}>
        <div className="flex flex-col items-center gap-5 select-none px-6">
          <div className="w-20 h-20 rounded-full border-2 border-alphabag-yellow/60 flex items-center justify-center bg-alphabag-darkgray/80 shadow-lg shadow-yellow-900/30 animate-pulse">
            <Lock size={36} className="text-alphabag-yellow" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-alphabag-yellow drop-shadow-lg text-center">Coming Soon</h1>
          <p className="text-alphabag-subtext text-sm md:text-lg max-w-lg text-center leading-relaxed">
            The Alpha-Access NFT collection is under development.<br />exclusive art pieces granting utility access to AlphaBAG.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-alphabag-subtext/60 uppercase tracking-widest font-semibold">
            <Gem size={14} className="text-alphabag-yellow/60" />
            Art &bull; Utility &bull; Access
          </div>
        </div>
      </div>

      {/* ── Page Content (visible behind the mask) ── */}
      <div className="relative z-10 pt-24 pb-20">

        {/* Hero / Mint Section */}
        <section className="px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left: Collection Info */}
              <div className="space-y-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-alphabag-yellow/10 border border-alphabag-yellow/30 mb-6">
                    <Sparkles size={14} className="text-alphabag-yellow" />
                    <span className="text-xs font-bold uppercase tracking-wider text-alphabag-yellow">NFT Collection</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight text-alphabag-text leading-[1.1] mb-4">
                    Alpha<span className="text-alphabag-yellow">-</span>Access
                  </h1>
                  <p className="text-alphabag-subtext text-base md:text-lg leading-relaxed max-w-xl">
                    A curated collection of <span className="text-alphabag-yellow font-semibold">exclusive NFT art pieces</span> designed 
                    to serve as your key to the AlphaBAG ecosystem. Each piece unlocks platform utility,
                    governance rights, and enhanced earning potential.
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {COLLECTION_STATS.map((stat) => (
                    <div key={stat.label} className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-4 flex items-center gap-3 hover:border-alphabag-muted transition-all group">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-alphabag-black border border-alphabag-gray flex items-center justify-center text-alphabag-yellow group-hover:scale-110 transition-transform">
                        {stat.icon}
                      </div>
                      <div>
                        <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider">{stat.label}</div>
                        <div className="text-lg font-bold text-alphabag-text">{stat.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mint Button (placeholder) */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button disabled className="flex-1 px-8 py-4 rounded-xl bg-alphabag-yellow/20 text-alphabag-yellow font-bold text-base border border-alphabag-yellow/30 cursor-not-allowed flex items-center justify-center gap-2">
                    <Wallet size={18} /> Mint Coming Soon
                  </button>
                  <button disabled className="px-6 py-4 rounded-xl bg-alphabag-darkgray text-alphabag-subtext font-semibold text-base border border-alphabag-gray cursor-not-allowed flex items-center justify-center gap-2">
                    <ImageIcon size={18} /> View Gallery
                  </button>
                </div>
              </div>

              {/* Right: Mint Dashboard Card */}
              <div className="relative">
                <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-3xl p-6 md:p-8 shadow-2xl">
                  {/* Mint Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-alphabag-text uppercase tracking-wider">Mint Progress</span>
                      <span className="text-sm font-mono font-bold text-alphabag-yellow">0 / 4,000</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-alphabag-black border border-alphabag-gray overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-alphabag-yellow to-yellow-600 transition-all" style={{ width: '0%' }} />
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider">
                      <span>0% Minted</span>
                      <span>Phase 1</span>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-alphabag-black rounded-xl p-4 border border-alphabag-gray text-center">
                      <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-1">Price</div>
                      <div className="text-xl font-black text-alphabag-yellow">0.07 BNB</div>
                    </div>
                    <div className="bg-alphabag-black rounded-xl p-4 border border-alphabag-gray text-center">
                      <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-1">Max Per Wallet</div>
                      <div className="text-xl font-black text-alphabag-text">5</div>
                    </div>
                  </div>

                  {/* Quantity Selector (disabled) */}
                  <div className="mb-6">
                    <div className="text-xs text-alphabag-subtext font-semibold uppercase tracking-wider mb-2">Quantity</div>
                    <div className="flex items-center gap-3">
                      <button disabled className="w-10 h-10 rounded-xl bg-alphabag-black border border-alphabag-gray text-alphabag-subtext font-bold text-lg cursor-not-allowed">-</button>
                      <div className="flex-1 h-10 rounded-xl bg-alphabag-black border border-alphabag-gray flex items-center justify-center text-lg font-bold text-alphabag-text">1</div>
                      <button disabled className="w-10 h-10 rounded-xl bg-alphabag-black border border-alphabag-gray text-alphabag-subtext font-bold text-lg cursor-not-allowed">+</button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center mb-6 py-3 border-t border-b border-alphabag-gray">
                    <span className="text-sm font-semibold text-alphabag-subtext">Total</span>
                    <span className="text-lg font-black text-alphabag-yellow">0.07 BNB</span>
                  </div>

                  {/* Mint Button */}
                  <button disabled className="w-full py-4 rounded-xl bg-alphabag-yellow/20 text-alphabag-yellow font-bold text-base border border-alphabag-yellow/30 cursor-not-allowed flex items-center justify-center gap-2 text-lg">
                    <Lock size={18} /> Connect Wallet to Mint
                  </button>

                  {/* Status */}
                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs text-alphabag-subtext font-semibold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-yellow-500/60 animate-pulse" />
                      Minting Not Active
                    </span>
                  </div>
                </div>

                {/* Decorative glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-alphabag-yellow/5 via-transparent to-transparent rounded-3xl -z-10 blur-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Utility Section */}
        <section className="px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-alphabag-text mb-3">
                NFT <span className="text-alphabag-yellow">Utility</span>
              </h2>
              <p className="text-alphabag-subtext text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                Every Alpha-Access NFT is more than art — it's your gateway to the AlphaBAG ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {UTILITY_FEATURES.map((feat) => (
                <div key={feat.title} className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-6 hover:border-alphabag-muted transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-alphabag-black border border-alphabag-gray flex items-center justify-center text-alphabag-yellow mb-4 group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h3 className="text-base font-bold text-alphabag-text mb-2">{feat.title}</h3>
                  <p className="text-sm text-alphabag-subtext leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rarity Tiers */}
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-alphabag-text mb-3">
                Rarity <span className="text-alphabag-yellow">Tiers</span>
              </h2>
              <p className="text-alphabag-subtext text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                5 rarity levels determine your tier and unlock escalating platform benefits.
              </p>
            </div>

            <div className="space-y-3">
              {RARITY_TIERS.map((tier) => (
                <div key={tier.name} className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5 flex items-center justify-between hover:border-alphabag-muted transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: tier.color + '60', background: tier.color + '15' }}>
                      <Gem size={20} style={{ color: tier.color }} />
                    </div>
                    <div>
                      <div className="text-base font-bold text-alphabag-text">{tier.name}</div>
                      <div className="text-xs text-alphabag-subtext">{tier.pct} Allocation</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* Rarity bar */}
                    <div className="hidden sm:block w-32 h-2 rounded-full bg-alphabag-black border border-alphabag-gray overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: tier.pct, background: tier.color }} />
                    </div>
                    <div className="text-lg font-black min-w-[50px] text-right" style={{ color: tier.color }}>{tier.pct}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
