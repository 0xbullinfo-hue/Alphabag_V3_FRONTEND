# AlphaBAG V3 — Threat Model & Security Architecture

This document outlines the assets, trust boundaries, threat actors, attack surfaces, and STRIDE mitigation strategies for the AlphaBAG V3 platform.

---

## 1. System Overview & Trust Boundaries

AlphaBAG bridges Web3 wallet identities (EVM / Solana), centralized crypto exchange accounts, real-time blockchain telemetry, and neural AI analytics.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UNTRUSTED CLIENT BROWSER                        │
│  - React 18 / TypeScript SPA                                           │
│  - User Wallet (MetaMask, Rabby, WalletConnect)                        │
│  - Local Memory State / Session Storage (Redacted)                     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS / WSS (SIWE Bearer Auth)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         TRUST BOUNDARY: API GATEWAY                    │
│  - Helmet / Strict CSP / CORS Origin Enforcement                       │
│  - Route Rate Limiters & IP Reverse Proxy Binding                      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         ALPHA-BAG APPLICATION SERVER                   │
│  - Express 5 / Node 22                                                 │
│  - SIWE Cryptographic Verification & Pinned HS256 JWT                  │
│  - AES-256-GCM Server-Side CEX Key Vault                               │
│  - On-Chain Receipt Verifier (Archive RPC Provider)                    │
└──────────────┬─────────────────────┬────────────────────┬──────────────┘
               │                     │                    │
               ▼                     ▼                    ▼
        ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
        │  PostgreSQL  │     │ BSC Archive  │     │ CEX APIs     │
        │  Prisma 7    │     │ RPC Nodes    │     │ Read-Only    │
        └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 2. Critical Assets & Sensitivity Classification

| Asset | Sensitivity | Storage Location | Protection Mechanism |
|---|---|---|---|
| User Private Keys | Critical (Never Held) | User's local hardware / wallet | Non-custodial architecture; private keys never requested or stored. |
| CEX API Secrets | Critical | PostgreSQL (`cex_connections`) | AES-256-GCM encrypted server-side; random 16-byte IV per record; read-only scope required. |
| Admin Access / Portal | Critical | Environment (`ADMIN_PORTAL_KEY`) | Constant-time timing-safe comparison (`crypto.timingSafeEqual`); isolated `/api/admin` routes. |
| JWT Signing Key | High | Environment (`JWT_SECRET`) | Strong minimum entropy check (≥32 chars); token version revocation mechanism. |
| Airdrop / $BAG Treasury | High | Multi-Sig / Smart Contracts | State machine guards, 24h claim cooldowns, zero synthetic payouts, archive RPC verification. |
| User Profile & Telemetry | Medium | PostgreSQL (`users`) | Input sanitization, address normalization, DOMPurify on display. |

---

## 3. STRIDE Threat Analysis & Mitigations

### Spoofing (Identity)
- **Threat**: Attacker attempts to forge user identity or replay a Sign-In with Ethereum (SIWE) signature.
- **Mitigation**: Single-use nonces generated server-side, cryptographically bound to the requesting wallet address, with 5-minute TTL. SIWE domain, URI, and timestamp validation.

### Tampering (Data Integrity)
- **Threat**: Attacker alters token balances or claims rewards without on-chain entitlement.
- **Mitigation**: Fail-closed database architecture. All token claim requests enforce 24-hour rate limits and record-level locking. Payout approvals require verifiable on-chain `Transfer` transaction logs from the network RPC.

### Repudiation
- **Threat**: Disputed token payout transactions or admin actions.
- **Mitigation**: Immutable transaction hashes recorded in `t2e_claims` and `bag_payout_requests`; audit logs with timestamps and verified on-chain confirmations.

### Information Disclosure
- **Threat**: Extraction of user CEX API keys or database connection credentials.
- **Mitigation**: AES-256-GCM encryption at rest; secrets scrubbed from API error responses and logs; production build pre/post check scripts (`check-no-secrets.mjs`); `.env` exclusion from version control.

### Denial of Service
- **Threat**: Exhaustion of backend compute or external RPC rate limits.
- **Mitigation**: Per-route rate limiting via `express-rate-limit`; bounded pagination (max 100 rows); in-memory L1/L2 caching with Redis failover; SSE heartbeat with connection backoff.

### Elevation of Privilege
- **Threat**: Standard user accessing admin endpoints or escalating tier permissions.
- **Mitigation**: Dedicated admin portal key header verification; dynamic tier re-verification against real $BAG token balances; last-admin protection preventing accidental lockout.
