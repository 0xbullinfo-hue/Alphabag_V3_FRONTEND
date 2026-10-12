import React from 'react';
import {
  KeyRound,
  Link2,
  Activity,
  Target,
  AlertTriangle,
  Clock,
  EyeOff,
  ArrowRightLeft,
  Award,
  ShieldAlert,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   PROBLEM SECTION (100% Clean AlphaBAG Dark Architecture, No Slop, No Textures)
   ───────────────────────────────────────────────────────────────────────────── */
const PROBLEMS = [
  {
    num: 'PROBLEM 01',
    title: 'Scattered Across Exchanges',
    desc: 'Manual tab-switching across Binance, Bybit, DEXs, and cold wallets leads to delayed execution, fragmented UI, and lost alpha.',
    icon: AlertTriangle,
    badge: 'Fragmented Execution',
  },
  {
    num: 'PROBLEM 02',
    title: 'Wasting 10+ Hours Monthly',
    desc: 'Reconciling PnL, open leverage positions, and spread discrepancies manually through error-prone, static spreadsheets.',
    icon: Clock,
    badge: 'High Latency Sync',
  },
  {
    num: 'PROBLEM 03',
    title: 'Zero Portfolio Visibility',
    desc: 'No unified liquidation margin, unhedged delta exposure, and blind spots to live on-chain whale balance movements.',
    icon: EyeOff,
    badge: 'Blind Risk Exposure',
  },
];

export const ProblemSection: React.FC = () => (
  <section id="problem" aria-labelledby="problem-title" className="bg-[#0B0E11] py-20 px-6 border-t border-[#2B313A]">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <span className="inline-block text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-[#F0B90B] bg-[#F0B90B]/10 border border-[#F0B90B]/20 rounded px-3 py-1 mb-3">
          PROBLEM
        </span>
        <h2 id="problem-title" className="text-3xl md:text-5xl font-bold tracking-tight text-[#EAECEF]">
          Tracking crypto across exchanges is messy
        </h2>
        <p className="mt-3 text-base md:text-lg text-[#848E9C] max-w-2xl mx-auto leading-relaxed">
          Fragmented venues and manual spreadsheets create latency, blind leverage risks, and lost opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROBLEMS.map((p) => {
          const IconComp = p.icon;
          return (
            <div
              key={p.num}
              className="bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl p-7 md:p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono font-bold tracking-wider text-white bg-white/10 border border-white/15 px-2.5 py-1 rounded">
                    {p.num}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-[#F0B90B]/10 border border-[#F0B90B]/20 flex items-center justify-center text-[#F0B90B]">
                    <IconComp size={20} />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm md:text-base text-[#848E9C] leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);


/* ─────────────────────────────────────────────────────────────────────────────
   SOLUTION SECTION (Interactive Institutional UI Widgets from Screenshot)
   ───────────────────────────────────────────────────────────────────────────── */

// Widget 1: Performance Analytics (Bar Chart with timeframe pills)
const PerformanceAnalyticsWidget: React.FC = () => {
  const bars = [
    { h: '38%', active: false },
    { h: '55%', active: false },
    { h: '42%', active: false },
    { h: '78%', active: false },
    { h: '62%', active: false },
    { h: '48%', active: false },
    { h: '92%', active: true },
    { h: '72%', active: false },
  ];

  return (
    <div className="p-5 md:p-6 bg-[#14171D] border-b border-[#2B313A]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#848E9C]">Portfolio Growth</span>
        <button
          type="button"
          className="text-[11px] font-mono font-medium text-[#EAECEF] bg-[#202630] border border-[#2B313A] hover:border-[#848E9C]/50 px-2.5 py-1 rounded transition-colors"
        >
          Report
        </button>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl md:text-3xl font-bold font-mono text-[#EAECEF]">$47,382</span>
        <span className="text-xs font-mono font-bold text-[#0ECB81] bg-[#0ECB81]/15 px-2 py-0.5 rounded-full">
          +2%
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-5 bg-[#181A20] p-1 rounded-lg border border-[#2B313A] w-fit">
        {['1D', '1M', '1W', '3M', '1Y'].map((t) => (
          <span
            key={t}
            className={`text-xs font-mono px-2 py-0.5 rounded cursor-pointer transition-colors ${
              t === '1W'
                ? 'bg-[#2B313A] text-white font-bold'
                : 'text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      {/* 8 rounded bars */}
      <div className="h-24 flex items-end justify-between gap-2.5 px-2 pt-2 border-t border-[#2B313A]/50">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
            <div
              style={{ height: bar.h }}
              className={`w-full max-w-[14px] rounded-t-md transition-all duration-300 ${
                bar.active
                  ? 'bg-[#F0B90B] shadow-[0_0_12px_rgba(240,185,11,0.35)]'
                  : 'bg-[#F0B90B]/60 hover:bg-[#F0B90B]'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Widget 2: Portfolio Allocation
const PortfolioAllocationWidget: React.FC = () => {
  return (
    <div className="p-5 md:p-6 bg-[#14171D] border-b border-[#2B313A]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#848E9C]">Portfolio Allocation</span>
        <button
          type="button"
          className="text-[11px] font-mono font-medium text-[#EAECEF] bg-[#202630] border border-[#2B313A] hover:border-[#848E9C]/50 px-2.5 py-1 rounded transition-colors"
        >
          Report
        </button>
      </div>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-2xl md:text-3xl font-bold font-mono text-[#EAECEF]">$47,382</span>
        <span className="text-xs font-mono font-bold text-[#F6465D] bg-[#F6465D]/15 px-2 py-0.5 rounded-full">
          -1.4%
        </span>
      </div>

      {/* Allocation breakdown */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#2B313A]/50">
        <div>
          <div className="text-xs text-[#848E9C] mb-1">Bitcoin</div>
          <div className="text-lg font-bold font-mono text-[#EAECEF] mb-2">27%</div>
          <div className="h-1.5 w-full bg-[#F0B90B] rounded-full shadow-[0_0_8px_rgba(240,185,11,0.3)]" />
        </div>
        <div>
          <div className="text-xs text-[#848E9C] mb-1">Ethereum</div>
          <div className="text-lg font-bold font-mono text-[#EAECEF] mb-2">12%</div>
          <div className="h-1.5 w-full bg-[#38BDF8] rounded-full shadow-[0_0_8px_rgba(56,189,248,0.3)]" />
        </div>
        <div>
          <div className="text-xs text-[#848E9C] mb-1">Solana</div>
          <div className="text-lg font-bold font-mono text-[#EAECEF] mb-2">61%</div>
          <div className="h-1.5 w-full bg-[#A855F7] rounded-full shadow-[0_0_8px_rgba(168,85,247,0.3)]" />
        </div>
      </div>
    </div>
  );
};

// Widget 3: Smart Notifications
const SmartNotificationsWidget: React.FC = () => {
  return (
    <div className="p-5 md:p-6 bg-[#14171D] border-b border-[#2B313A] space-y-3">
      {/* 2FA alert */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#181A20] border border-[#2B313A]">
        <div className="w-8 h-8 rounded-full bg-[#F6465D]/15 text-[#F6465D] flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#EAECEF] truncate">Enable 2FA to secure your account</span>
            <span className="text-[11px] font-mono text-[#848E9C] shrink-0">5 min</span>
          </div>
          <p className="text-[11px] text-[#848E9C] mt-0.5">Chrome on macOS, USA</p>
        </div>
      </div>

      {/* Swap completed */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#181A20] border border-[#2B313A]">
        <div className="w-8 h-8 rounded-full bg-[#F0B90B]/15 text-[#F0B90B] flex items-center justify-center shrink-0 mt-0.5">
          <ArrowRightLeft size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#EAECEF] truncate">Swap completed</span>
            <span className="text-[11px] font-mono text-[#848E9C] shrink-0 flex items-center gap-1">
              Now <span className="w-1.5 h-1.5 rounded-full bg-[#0ECB81] inline-block animate-pulse" />
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#848E9C] mt-0.5">0.5 BTC → 12,350 USDC</p>
        </div>
      </div>

      {/* Reward notification */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#181A20] border border-[#2B313A]">
        <div className="w-8 h-8 rounded-full bg-[#0ECB81]/15 text-[#0ECB81] flex items-center justify-center shrink-0 mt-0.5">
          <Award size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#EAECEF] truncate">You earned 15 USDC in trading rewards</span>
            <span className="text-[11px] font-mono text-[#848E9C] shrink-0">1 hr</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Widget 4: Multi-Coin Tracking (Full list matching screenshot)
const MultiCoinTrackingWidget: React.FC = () => {
  const coins = [
    { name: 'Bitcoin', sym: 'BTC', price: '$116,236', change: '+2.5%', pos: true, color: 'text-[#F0B90B]' },
    { name: 'Ethereum', sym: 'ETC', price: '$2,348', change: '+1.3%', pos: true, color: 'text-[#38BDF8]' },
    { name: 'XRP', sym: 'XRP', price: '$1.55', change: '-0.2%', pos: false, color: 'text-[#A855F7]' },
    { name: 'TetherUS', sym: 'USDT', price: '$98.04', change: '+0.9%', pos: true, color: 'text-[#0ECB81]' },
    { name: 'Tron', sym: 'TRX', price: '$123.08', change: '-1.1%', pos: false, color: 'text-[#F6465D]' },
  ];

  return (
    <div className="p-5 md:p-6 bg-[#14171D] border-b border-[#2B313A] space-y-2.5">
      {coins.map((c) => (
        <div
          key={c.sym}
          className="flex items-center justify-between p-2.5 rounded-lg bg-[#181A20] border border-[#2B313A]/70 hover:border-[#848E9C]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full bg-[#202630] border border-[#2B313A] flex items-center justify-center text-xs font-bold font-mono ${c.color}`}>
              {c.sym.substring(0, 1)}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-[#EAECEF]">{c.name}</span>
              <span className="text-xs font-mono text-[#848E9C]">[{c.sym}]</span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <span className="text-sm font-semibold text-[#EAECEF]">{c.price}</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                c.pos ? 'text-[#0ECB81] bg-[#0ECB81]/15' : 'text-[#F6465D] bg-[#F6465D]/15'
              }`}
            >
              {c.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Widget 5: Seamless Integration (Wallets and Exchanges with Connect buttons)
const SeamlessIntegrationWidget: React.FC = () => {
  const venues = [
    { name: 'MetaMask', tag: 'Web3 Wallet', color: 'text-[#E2761B]' },
    { name: 'Binance', tag: 'Exchange CEX', color: 'text-[#F0B90B]' },
    { name: 'Coinbase', tag: 'Exchange CEX', color: 'text-[#0052FF]' },
    { name: 'WalletConnect', tag: 'Multi-Chain Protocol', color: 'text-[#3B99FC]' },
    { name: 'Phantom', tag: 'Solana Wallet', color: 'text-[#AB9FF2]' },
  ];

  return (
    <div className="p-5 md:p-6 bg-[#14171D] border-b border-[#2B313A] space-y-2.5">
      {venues.map((v) => (
        <div
          key={v.name}
          className="flex items-center justify-between p-2.5 rounded-lg bg-[#181A20] border border-[#2B313A]/70 hover:border-[#848E9C]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full bg-[#202630] border border-[#2B313A] flex items-center justify-center text-xs font-bold font-mono ${v.color}`}>
              {v.name.substring(0, 1)}
            </div>
            <div>
              <span className="text-sm font-semibold text-[#EAECEF] block">{v.name}</span>
            </div>
          </div>

          <button
            type="button"
            className="text-xs font-mono font-semibold px-3.5 py-1.5 rounded bg-[#202630] border border-[#2B313A] text-[#EAECEF] hover:bg-[#F0B90B] hover:text-black hover:border-[#F0B90B] transition-all"
          >
            CONNECT
          </button>
        </div>
      ))}
    </div>
  );
};

export const SolutionSection: React.FC = () => (
  <section id="solution" aria-labelledby="solution-title" className="bg-[#0B0E11] py-20 px-6 border-t border-[#2B313A]">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <span className="inline-block text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-[#0ECB81] bg-[#0ECB81]/10 border border-[#0ECB81]/20 rounded px-3 py-1 mb-3">
          SOLUTION
        </span>
        <h2 id="solution-title" className="text-3xl md:text-5xl font-bold tracking-tight text-[#EAECEF]">
          One Dashboard. All Your Crypto. Total Clarity.
        </h2>
        <p className="mt-3 text-base md:text-lg text-[#848E9C] max-w-2xl mx-auto leading-relaxed">
          Real-time cross-chain analytics, automated balance synchronization, and institutional risk oversight.
        </p>
      </div>

      {/* Row 1: 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl overflow-hidden flex flex-col justify-between">
          <PerformanceAnalyticsWidget />
          <div className="p-6 md:p-7">
            <h3 className="text-xl font-bold text-[#EAECEF] tracking-tight">Performance Analytics</h3>
            <p className="mt-2.5 text-sm md:text-base text-[#848E9C] leading-relaxed">
              Track your portfolio growth over time with clean charts and historical data.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl overflow-hidden flex flex-col justify-between">
          <PortfolioAllocationWidget />
          <div className="p-6 md:p-7">
            <h3 className="text-xl font-bold text-[#EAECEF] tracking-tight">Portfolio Allocation</h3>
            <p className="mt-2.5 text-sm md:text-base text-[#848E9C] leading-relaxed">
              Visual breakdown showing exactly where your money is invested across all your holdings.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl overflow-hidden flex flex-col justify-between">
          <SmartNotificationsWidget />
          <div className="p-6 md:p-7">
            <h3 className="text-xl font-bold text-[#EAECEF] tracking-tight">Smart Notifications</h3>
            <p className="mt-2.5 text-sm md:text-base text-[#848E9C] leading-relaxed">
              Get instant alerts for transactions, security updates, and critical account activity.
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: 2 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Card 4 */}
        <div className="bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl overflow-hidden flex flex-col justify-between">
          <MultiCoinTrackingWidget />
          <div className="p-6 md:p-7">
            <h3 className="text-xl font-bold text-[#EAECEF] tracking-tight">Multi-Coin Tracking</h3>
            <p className="mt-2.5 text-sm md:text-base text-[#848E9C] leading-relaxed">
              Track Bitcoin, Ethereum, Solana, and 100+ cryptocurrencies in one unified dashboard.
            </p>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl overflow-hidden flex flex-col justify-between">
          <SeamlessIntegrationWidget />
          <div className="p-6 md:p-7">
            <h3 className="text-xl font-bold text-[#EAECEF] tracking-tight">Seamless Integration</h3>
            <p className="mt-2.5 text-sm md:text-base text-[#848E9C] leading-relaxed">
              Connect your crypto wallets and exchanges with just a few clicks to automatically sync balances and transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);


/* ─────────────────────────────────────────────────────────────────────────────
   HOW IT WORKS SECTION (Clean Pipeline)
   ───────────────────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    n: '01',
    title: 'Create Wallet',
    body: 'Create a fresh custodial wallet on the Binance Smart Chain in seconds.',
    action: '< 15s Setup',
    Icon: KeyRound
  },
  {
    n: '02',
    title: 'Connect Wallet',
    body: 'Connect your wallet securely and access your crypto portfolio instantly.',
    action: 'Read-Only Security',
    Icon: Link2
  },
  {
    n: '03',
    title: 'Track & Analyze',
    body: 'Track your portfolio and gain insights to make smarter crypto decisions.',
    action: 'Live RPC Telemetry',
    Icon: Activity
  },
  {
    n: '04',
    title: 'Grow Your Crypto',
    body: 'Grow your crypto faster with smart insights, analytics, and earning tools.',
    action: 'Smart Analytics',
    Icon: Target
  },
];

export const OnboardingPipeline: React.FC = () => (
  <section id="how-it-works" aria-labelledby="pipeline-title" className="bg-[#0B0E11] py-20 px-6 border-t border-[#2B313A]">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <span className="inline-block text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-[#F0B90B] bg-[#F0B90B]/10 border border-[#F0B90B]/20 rounded px-3 py-1 mb-3">
          HOW IT WORKS
        </span>
        <h2 id="pipeline-title" className="text-3xl md:text-5xl font-bold tracking-tight text-[#EAECEF]">
          Simple Steps to Manage Your Crypto
        </h2>
        <p className="mt-3 text-base md:text-lg text-[#848E9C] max-w-2xl mx-auto leading-relaxed">
          From session creation to institutional analytics in under 60 seconds.
        </p>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0 m-0">
        {STEPS.map(({ n, title, body, action, Icon }, i) => (
          <li key={n} className="relative">
            <div className="h-full bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-[#848E9C]">
                    {n}.
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-[#F0B90B]/10 border border-[#F0B90B]/20 flex items-center justify-center text-[#F0B90B]">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                </div>

                <h3 className="mt-6 text-xl font-bold text-[#EAECEF] tracking-tight">
                  {title}
                </h3>
                <p className="mt-2.5 text-sm md:text-base text-[#848E9C] leading-relaxed">
                  {body}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#2B313A] text-xs font-mono font-semibold text-[#F0B90B]">
                {action}
              </div>
            </div>

            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="sm:hidden absolute left-1/2 -bottom-6 h-6 w-px bg-[#2B313A]" />
            )}
          </li>
        ))}
      </ol>
    </div>
  </section>
);
