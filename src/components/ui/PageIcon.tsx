import React from 'react';

export type PageIconName =
  | 'bag'
  | 'cex'
  | 'dex'
  | 'portfolio'
  | 'ai'
  | 'whales'
  | 'security'
  | 'calculator'
  | 'feed'
  | 'airdrop'
  | 'screener'
  | 'calls'
  | 'markets'
  | 'defi'
  | 'news'
  | 'history'
  | 'settings'
  | 'integrations'
  | 'profile';

export const PAGE_ICONS: Record<PageIconName, { src: string; alt: string }> = {
  bag: { src: '/icons/icon-bag.png', alt: 'My AlphaBAG' },
  cex: { src: '/icons/icon-bag.png', alt: 'CEX Portfolio' },
  dex: { src: '/icons/icon-bag.png', alt: 'DEX Portfolio' },
  portfolio: { src: '/icons/icon-bag.png', alt: 'Portfolio' },
  ai: { src: '/icons/icon-ai-analyst.png', alt: 'Alpha Analyst' },
  whales: { src: '/icons/icon-whales.png', alt: 'Alpha Radar' },
  security: { src: '/icons/icon-security.png', alt: 'Security Radar' },
  calculator: { src: '/icons/icon-calculator.svg', alt: 'Alpha Calculator' },
  feed: { src: '/icons/icon-alphas-feed.svg', alt: 'Alphas Feed' },
  airdrop: { src: '/icons/icon-airdrop.svg', alt: 'Alpha Missions' },
  screener: { src: '/icons/icon-screener.svg', alt: 'Alpha Screener' },
  calls: { src: '/icons/icon-calls.svg', alt: 'AlphaCalls' },
  markets: { src: '/icons/icon-markets.svg', alt: 'Global Markets' },
  defi: { src: '/icons/icon-defi.svg', alt: 'DeFi Tracker' },
  news: { src: '/icons/icon-news.svg', alt: 'Crypto News' },
  history: { src: '/icons/icon-history.svg', alt: 'Transaction History' },
  settings: { src: '/icons/icon-settings.svg', alt: 'Setup Connections' },
  integrations: { src: '/icons/icon-integrations.svg', alt: 'Integrations' },
  profile: { src: '/icons/icon-profile.svg', alt: 'My Profile' },
};

interface PageIconProps {
  name: PageIconName;
  size?: number | string;
  className?: string;
  framed?: boolean;
}

export const PageIcon: React.FC<PageIconProps> = ({
  name,
  size = 40,
  className = '',
  framed = true,
}) => {
  const icon = PAGE_ICONS[name] || PAGE_ICONS.bag;

  if (!framed) {
    return (
      <img
        src={icon.src}
        alt={icon.alt}
        style={{ width: size, height: size }}
        className={`object-contain shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-xl bg-alphabag-black border border-alphabag-yellow/30 flex items-center justify-center p-1.5 shrink-0 shadow-sm ${className}`}
    >
      <img src={icon.src} alt={icon.alt} className="w-full h-full object-contain" />
    </div>
  );
};
