# Security Policy — AlphaBAG Protocol

AlphaBAG takes the security of its infrastructure, smart contracts, and user data seriously. This document outlines our vulnerability disclosure process, supported versions, and operational security guidelines.

---

## Supported Versions

| Version | Supported          | Security Status                      |
| ------- | ------------------ | ------------------------------------ |
| 3.x     | :white_check_mark: | Active production support and fixes |
| 2.x     | :x:                | Deprecated                           |
| < 2.0   | :x:                | Unsupported                          |

---

## Reporting a Vulnerability

If you discover a security vulnerability or weakness within any AlphaBAG application, API, smart contract, or infrastructure component:

1. **Do NOT open a public GitHub issue.** Public issues disclose potential attack vectors before patches can be deployed.
2. **Email our Security Team**: Send a detailed advisory report to `security@alphabag.xyz` (or `0xbullinfo@gmail.com`).
3. **Include the following information**:
   - Description of the vulnerability and its potential impact.
   - Affected repository (`alphabag_v3_backend`, `Alphabag_V3_FRONTEND`, or smart contracts).
   - Step-by-step reproduction instructions or Proof of Concept (PoC).
   - Any remediation suggestions you may have.

### Response Time & SLAs

- **Initial Acknowledgement**: Within 24 hours.
- **Triage & Severity Assessment**: Within 48 hours.
- **Patch Deployment**:
  - **Critical / High**: Target resolution within 72 hours.
  - **Medium**: Target resolution within 7 days.
  - **Low**: Target resolution in next release cycle.

---

## Security Principles & Invariants

1. **Non-Custodial Architecture**:
   - AlphaBAG never requests, stores, or transmits user private keys or seed phrases.
   - All blockchain signatures and wallet interactions occur directly via client-side wallets (EIP-1193, Wagmi, WalletConnect).

2. **CEX Credential Security**:
   - Centralized Exchange API keys and secrets are encrypted strictly server-side using **AES-256-GCM** with per-record initialization vectors (IVs) and authentication tags.
   - Decrypted credentials exist only in transient memory during read-only balance sync requests and are never written to logs or sent to the browser.
   - Only read-only exchange credentials without withdrawal permissions are permitted.

3. **Authentication & Session Revocation**:
   - User authentication utilizes **EIP-4361 (Sign-In with Ethereum - SIWE)** with single-use cryptographic nonces tied to the requesting wallet address.
   - JSON Web Tokens (JWTs) are signed using pinned **HS256** and include a `tokenVersion` claim that allows immediate, server-wide session revocation upon password/admin changes or compromise.

4. **Environment Hardening & Fail-Closed Behavior**:
   - Production environments fail closed (`process.exit(1)`) on startup if any required secret, encryption key, or secure origin configuration is missing or weak.
   - Any environment that is not explicitly `development` or `test` is strictly treated as production.
   - Database outages trigger HTTP 503 (`Service Unavailable`) and never fall back to silent memory-backed writes.

5. **On-Chain Payout Verification**:
   - No token request or payout can be approved or marked as sent without a verified on-chain ERC20/BEP20 transaction transfer receipt checked against an RPC node.
