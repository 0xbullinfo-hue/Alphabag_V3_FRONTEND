# AlphaBAG Project Memory & Mode of Work

## Core Principles & Workflow Mandates

### 1. Git Workflow & Push Protocol
- **Always Request/Prompt Git Push:** As soon as any update, fix, or feature is completed and validated, ALWAYS notify the user and offer/execute the Git push (`git push origin main`).
- **Pre-Push Validation:** Never push untested or broken code. Always run:
  1. `npm run typecheck` — 0 TypeScript errors.
  2. `npm run test` (or `npx vitest run --pool=threads`) — all test suites passing.
  3. `npm run check:design-slop` — verify 0 design slop violations.
- **Build Artifacts (`dist/`):** `dist/` is deliberately in `.gitignore` (standard Vite/Netlify architecture). Netlify builds `dist` in CI from source commits. If local `dist` needs regeneration, run `$env:VITE_API_BASE_URL="https://api.alphabag.pro"; npm run build`.

---

### 2. Strict Design Rules: Zero AI Slop & No Uninstructed Tags
AlphaBAG strictly adheres to **Institutional Terminal Standards** (modeled after Binance / Bybit Pro). All styling is subject to enforcement by `scripts/check-design-slop.mjs`:

1. **NO Backdrop-Blur Abuse:** Never use `backdrop-blur-sm`, `backdrop-blur-md`, `backdrop-blur-lg`, etc. Use solid institutional alpha colors (e.g. `bg-[#0B0E11]/90`, `bg-[#181A20]`).
2. **NO `font-black`:** Maximum font weight allowed is `font-semibold` (600) or `font-bold` (700). `font-black` is completely banned.
3. **NO Sub-11px Micro-Text:** Never use `text-[6px]`, `text-[7px]`, `text-[8px]`, `text-[9px]`, or `text-[10px]`. The strict floor for legible micro-copy is `text-[11px]` or `text-xs` (12px).
4. **NO Cartoon Hype Emojis:** Never use hype emojis (🚀, 🔥, 💎, 🐂, 🐻, 🎉, ✨, etc.) in UI copy, labels, or buttons unless specifically ordered.
5. **NO Neon Glow Shadows:** Never use aggressive glowing box-shadows (e.g. `shadow-[0_0_...`). Use clean crisp borders.
6. **NO Uninstructed Tags or Chips:** Never add unrequested badge chips (`LIVE`, `PRO`, `HOT`, `NEW`, `BETA`, lock icons, or floating tag pills) to sidebars, nav links, tool cards, or headers. Only include tags when explicitly instructed by the user.
7. **NO Unapproved Sections:** Never inject speculative conversion sections, promotional banners, or marketing fluff without explicit user approval.

---

### 3. Institutional Design System & Palette
- **Backgrounds:**
  - App Canvas: `#0B0E11` (`var(--bg-color)`, `bg-alphabag-black`)
  - Panels / Cards: `#181A20` (`var(--panel-color)`, `var(--card-color)`, `bg-alphabag-dark`)
  - Hover Surfaces: `#202630` (`var(--hover-color)`)
  - Border Color: `#2B313A` (`var(--border-color)`, `border-alphabag-gray`)
  - Subtle Border: `rgba(255, 255, 255, 0.04)` (`var(--border-light)`)
- **Brand Accents:**
  - Primary Yellow: `#F0B90B` (`var(--yellow)`, `text-alphabag-yellow`, `bg-alphabag-yellow`)
  - Yellow Hover: `#FCD535` (`var(--yellow-hover)`)
  - Success / Long Green: `#0ECB81` (`var(--green)`, `text-alphabag-green`)
  - Danger / Short Red: `#F6465D` (`var(--red)`, `text-alphabag-red`)
  - Accent Blue: `#3B82F6` (`var(--blue)`, `text-alphabag-blue`)
- **Text Hierarchy:**
  - Primary High-Contrast: `#EAECEF` (`var(--text-color)`, `text-alphabag-text`)
  - Secondary Subtext: `#848E9C` (`var(--subtext-color)`, `text-alphabag-subtext`)
  - Muted Elements: `#5E6673` (`var(--muted-color)`, `text-alphabag-muted`)
- **Geometry & Radii:**
  - Crisp institutional 4px–8px radius (`rounded-md`, `rounded-lg`, `rounded-xl`).
  - No balloon-like 24px/32px rounded corners.
- **Financial Typography:**
  - All numbers, prices, percentages, P&L, market caps, and dates MUST use tabular mono figures:
    `font-family: 'JetBrains Mono', monospace;` with `.num`, `.tabular-nums`, or `font-mono`.

---

### 4. Memory of Completed Work & Architecture

#### Alpha Calculator
- **Unified Engine:** Both the Landing Page (`src/pages/frontend/Landing.tsx`) and Dashboard route (`/calculator`) render the single source of truth component: `src/pages/frontend/Calculator.tsx`.
- **Modes Supported:** Leverage, Spot, Degen, IL Risk, and Converter.
- **Exchange Standards:** Leverage liquidation formulas accurately follow Binance maintenance margin standards for Long and Short positions.
- **Landing Mode (`minimal={true}`):** Retains full interactivity across all 5 tabs with pre-populated presets, omitting redundant full-page headers and bottom legal disclaimers.

#### Alpha Desk & Screener
- **Institutional 7-Tab Layout:** Clean presentation with uninstructed chips and lock icons removed.
- **Screener Integration:** DexScreener live pairs, real-time WebSocket feeds, and sparkline / chart toggles.
- **TradingView:** Custom datafeed and TradingView charting suite with full timeframe modal support.
- **Access Control:** Gated with premium tier verification and Web3Modal wallet connect flow.

#### Bubblemaps Intelligence
- **B2B API Integration:** Live search, token forensics HUD, cluster breakdown, subgraph tracer, and address forensics.
- **Proxy Security:** External Bubblemaps API requests routed via backend proxy to keep API keys secure.

#### Community Alpha Feed
- Reddit-style discussion hub with upvotes, comments, link sharing, and live audio space stages.
- Clutter-free composer without unrequested chip tags.

#### Security & Authentication
- **SIWE (EIP-4361):** Full cryptographic Sign-In with Ethereum with domain and nonce verification.
- **Wallet Utilities:** Strict error mapping (`parseWalletError`) with actionable user recovery messages.
- **Turnstile CAPTCHA:** Bot protection on claims and airdrop missions.
- **Secret Hygiene:** Pre-deploy and post-build scripts (`check-no-secrets.mjs`) ensuring zero private keys or credentials leak into bundles.
