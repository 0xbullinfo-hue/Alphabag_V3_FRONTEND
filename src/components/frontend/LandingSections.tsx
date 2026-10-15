import React from 'react';
import {
  KeyRound,
  Link2,
  Activity,
  Target,
  AlertTriangle,
  Clock,
  EyeOff,
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

// Widget 1: Performance Analytics (Bar Chart)
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
    <div className="p-4 bg-[#14171D] border-b border-[#2B313A] h-[168px] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#848E9C]">Growth</span>
        <span className="text-[10px] font-mono font-bold text-[#0ECB81] bg-[#0ECB81]/15 px-1.5 py-0.5 rounded">
          +2.4%
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-xl font-bold font-mono text-[#EAECEF]">$47,382</span>
      </div>

      <div className="h-16 flex items-end justify-between gap-1.5 px-1 pt-2 border-t border-[#2B313A]/50">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
            <div
              style={{ height: bar.h }}
              className={`w-full max-w-[10px] rounded-t transition-all duration-300 ${
                bar.active
                  ? 'bg-[#F0B90B] shadow-[0_0_8px_rgba(240,185,11,0.35)]'
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
    <div className="p-4 bg-[#14171D] border-b border-[#2B313A] h-[168px] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#848E9C]">Allocation</span>
        <span className="text-[10px] font-mono font-bold text-[#0ECB81] bg-[#0ECB81]/15 px-1.5 py-0.5 rounded">
          3 Chains
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-xl font-bold font-mono text-[#EAECEF]">$47,382</span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2B313A]/50">
        <div>
          <div className="text-[10px] text-[#848E9C] mb-0.5">Bitcoin</div>
          <div className="text-xs font-bold font-mono text-[#EAECEF] mb-1">27%</div>
          <div className="h-1 w-full bg-[#F0B90B] rounded-full shadow-[0_0_6px_rgba(240,185,11,0.3)]" />
        </div>
        <div>
          <div className="text-[10px] text-[#848E9C] mb-0.5">Ethereum</div>
          <div className="text-xs font-bold font-mono text-[#EAECEF] mb-1">12%</div>
          <div className="h-1 w-full bg-[#38BDF8] rounded-full shadow-[0_0_6px_rgba(56,189,248,0.3)]" />
        </div>
        <div>
          <div className="text-[10px] text-[#848E9C] mb-0.5">Solana</div>
          <div className="text-xs font-bold font-mono text-[#EAECEF] mb-1">61%</div>
          <div className="h-1 w-full bg-[#A855F7] rounded-full shadow-[0_0_6px_rgba(168,85,247,0.3)]" />
        </div>
      </div>
    </div>
  );
};

// Widget 3: Multi-Coin Tracking
const MultiCoinTrackingWidget: React.FC = () => {
  const coins = [
    { sym: 'BTC', name: 'Bitcoin', price: '$116,236', change: '+2.5%', pos: true, color: 'text-[#F0B90B]' },
    { sym: 'ETH', name: 'Ethereum', price: '$2,348', change: '+1.3%', pos: true, color: 'text-[#38BDF8]' },
    { sym: 'SOL', name: 'Solana', price: '$148.20', change: '+4.8%', pos: true, color: 'text-[#A855F7]' },
  ];

  return (
    <div className="p-4 bg-[#14171D] border-b border-[#2B313A] h-[168px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-[#848E9C]">Live Tracking</span>
        <span className="text-[10px] font-mono text-[#0ECB81] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0ECB81] inline-block animate-pulse" /> Live
        </span>
      </div>

      <div className="space-y-1.5">
        {coins.map((c) => (
          <div
            key={c.sym}
            className="flex items-center justify-between p-1.5 rounded bg-[#181A20] border border-[#2B313A]/70"
          >
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full bg-[#202630] border border-[#2B313A] flex items-center justify-center text-[10px] font-bold font-mono ${c.color}`}>
                {c.sym.substring(0, 1)}
              </div>
              <span className="text-xs font-semibold text-[#EAECEF]">{c.sym}</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="font-semibold text-[#EAECEF]">{c.price}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded text-[#0ECB81] bg-[#0ECB81]/15">
                {c.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Widget 4: Seamless Integration
const SeamlessIntegrationWidget: React.FC = () => {
  const venues = [
    { name: 'MetaMask', tag: 'Web3', color: 'text-[#E2761B]' },
    { name: 'Binance', tag: 'CEX API', color: 'text-[#F0B90B]' },
    { name: 'Phantom', tag: 'Solana', color: 'text-[#AB9FF2]' },
  ];

  return (
    <div className="p-4 bg-[#14171D] border-b border-[#2B313A] h-[168px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-[#848E9C]">Integration</span>
        <span className="text-[10px] font-mono text-[#848E9C]">Auto-Sync</span>
      </div>

      <div className="space-y-1.5">
        {venues.map((v) => (
          <div
            key={v.name}
            className="flex items-center justify-between p-1.5 rounded bg-[#181A20] border border-[#2B313A]/70"
          >
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full bg-[#202630] border border-[#2B313A] flex items-center justify-center text-[10px] font-bold font-mono ${v.color}`}>
                {v.name.substring(0, 1)}
              </div>
              <span className="text-xs font-semibold text-[#EAECEF]">{v.name}</span>
            </div>

            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#202630] border border-[#2B313A] text-[#848E9C]">
              SYNCED
            </span>
          </div>
        ))}
      </div>
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

      {/* 4 cards matching How It Works grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Performance Analytics */}
        <div className="h-full bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl overflow-hidden flex flex-col justify-between">
          <PerformanceAnalyticsWidget />
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#EAECEF] tracking-tight">Performance Analytics</h3>
              <p className="mt-2.5 text-sm text-[#848E9C] leading-relaxed">
                Track your portfolio growth over time with clean charts and historical telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Portfolio Allocation */}
        <div className="h-full bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl overflow-hidden flex flex-col justify-between">
          <PortfolioAllocationWidget />
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#EAECEF] tracking-tight">Portfolio Allocation</h3>
              <p className="mt-2.5 text-sm text-[#848E9C] leading-relaxed">
                Visual breakdown showing exactly where your capital is deployed across holdings.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Multi-wallet Tracking */}
        <div className="h-full bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl overflow-hidden flex flex-col justify-between">
          <MultiCoinTrackingWidget />
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#EAECEF] tracking-tight">Multi-wallet Tracking</h3>
              <p className="mt-2.5 text-sm text-[#848E9C] leading-relaxed">
                Track Bitcoin, Ethereum, Solana, and 100+ cryptocurrencies in one unified dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Seamless Integration */}
        <div className="h-full bg-[#181A20] border border-[#2B313A] hover:border-[#848E9C]/50 transition-all duration-200 rounded-xl overflow-hidden flex flex-col justify-between">
          <SeamlessIntegrationWidget />
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#EAECEF] tracking-tight">Seamless Integration</h3>
              <p className="mt-2.5 text-sm text-[#848E9C] leading-relaxed">
                Connect your wallets and exchanges with zero hassle to automatically sync balances.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#2B313A] text-xs font-mono font-semibold text-[#0ECB81]">
              and more tools
            </div>
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
    Icon: KeyRound
  },
  {
    n: '02',
    title: 'Connect Wallet',
    body: 'Connect your new wallet securely and access our dashboard instantly.',
    Icon: Link2
  },
  {
    n: '03',
    title: 'Track & Analyze',
    body: 'Add all wallets to track your portfolio and gain insights to make smarter crypto decisions.',
    Icon: Activity
  },
  {
    n: '04',
    title: 'Grow Your Crypto',
    body: 'Grow your crypto faster with smart insights, analytics, and profit simulator tools.',
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
        {STEPS.map(({ n, title, body, Icon }, i) => (
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
