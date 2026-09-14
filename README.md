# AlphaBAG V3 — Institutional-Grade Crypto Intelligence & Trading Command Center

<div align="center">
  <img width="1200" alt="AlphaBAG Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Overview

AlphaBAG is an institutional-grade Web3 portfolio tracking, on-chain intelligence, and execution cockpit. It unifies decentralized finance (DeFi), centralized exchange (CEX) portfolio metrics, real-time whale surveillance, risk scoring, and grounded AI analytics into a single high-performance dashboard.

---

## Core Features

- **Multi-Chain Portfolio Dashboard**: Unified tracking across Ethereum, Arbitrum, Optimism, Base, Polygon, BSC, and Solana with real-time valuation and PnL breakdown.
- **DeFi Operations**: Real on-chain balance and position surveillance across major lending markets (Aave V3), concentrated liquidity pools (Uniswap V3), and ERC-4626 vaults.
- **CEX Portfolio Hardening**: Zero-knowledge credential encryption using client-side AES-GCM (PBKDF2 100,000 rounds) for Binance, Coinbase, Kraken, OKX, and Bybit connections. Read-only API key enforcement with local secret redaction.
- **AlphaAI Grounded Assistant**: Streaming neural market intelligence equipped with anti-hallucination guardrails (`findUnsupportedNumbers`), prompt injection defense, and on-chain fact verification.
- **Alpha Passes (Genesis Collection)**: 4,000 limited-supply utility memberships on BNB Smart Chain unlocking fee rebates, VIP volume multipliers, and tiered access.
- **Security & Privacy First**: Read-only architecture. Private keys are never requested, stored, or exposed.

---

## Architecture & Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **State & Caching**: TanStack React Query + Tiered L1 Memory Cache with TTL and Stale-While-Revalidate semantics
- **Styling**: Tailwind CSS + Custom Dark Theme Tokens + Lucide Icons + Framer Motion
- **On-Chain & Web3**: Ethers.js v6, Wagmi, Moralis API, DeFiLlama Yield SDK
- **Testing**: Vitest with unit test suites covering caching, crypto decoders, grounding guardrails, and token balance services

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/0xbullinfo-hue/Alphabag_V3_FRONTEND.git
cd Alphabag_V3_FRONTEND

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` or `.env.local` file in the root directory:

```env
VITE_API_URL=http://localhost:3003
VITE_ENABLE_ANALYTICS=true
```

### Development Server

```bash
# Start local mock backend (optional)
node mock-backend.cjs

# Launch Vite dev server
npm run dev
```

### Verification & Testing

```bash
# Run TypeScript typecheck
npm run typecheck

# Run test suite
npm test -- --run

# Run production build
npm run build
```

---

## Deployment Network Phases

- **Phase 01 (Executing)**: Foundation and core dashboard systems, AlphaAI research engine, read-only security framework.
- **Phase 02 (Pending)**: Public Beta with free access to portfolio tracking, Genesis cohort onboarding, and continuous UX refinement.
- **Phase 03 (Pending)**: Utility, Alpha Pass multiplier activations, and staged pro terminal tools.
- **Phase 04 (Queued)**: Global scale, automated multi-chain execution triggers, and decentralized intelligence feeds.

---

## License

All rights reserved © AlphaBAG Ecosystem.
