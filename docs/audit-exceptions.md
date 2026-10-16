# AlphaBAG Frontend — Dependency Audit & Security Exceptions

This document records the security assessment, threat modeling, and risk acceptance rationale for remaining transitive dependencies flagged by `npm audit` in the AlphaBAG frontend application.

---

## 1. Resolved in Round 2 Remediation

### `react-router-dom`
- **Previous Version**: `6.22.1`
- **Updated Version**: `^6.30.6`
- **Status**: **RESOLVED**
- **Advisories Addressed**:
  - `GHSA-wrjc-x8rr-h8h6` (Open redirect via backslash in `<Link>` and `useNavigate` - CVE-2025-68470 bypass)
  - `GHSA-337j-9hxr-rhxg` (Arbitrary Constructor Injection via `deserializeErrors()` in SSR hydration)
- **Validation**: 57/57 unit and integration tests passing, production build succeeded.

---

## 2. Active Transitive Audit Exceptions

### Exception 1: `decode-uri-component`
- **Path**: `wagmi` > `@wagmi/core` > `@wagmi/connectors` > `@walletconnect/utils` > `query-string` > `decode-uri-component`
- **Advisory**: [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr)
- **Severity**: Moderate
- **Vulnerability**: Denial of service via exponential decoding of malformed percent-encoded input.
- **Threat & Exposure Analysis**:
  - `decode-uri-component` is used strictly within the client-side WalletConnect legacy bridge query parameter deserializer when parsing QR code connections or deep links.
  - It is executed client-side inside the user's browser sandbox; an attack cannot affect the server or other users.
  - Input strings originate either from the user's local wallet or the official WalletConnect relay server.
- **Sandbox & Runtime Boundaries**:
  - Client-side execution only.
  - Strict Content-Security-Policy (CSP) restricts script execution to `'self'`.
- **Migration Roadmap**:
  - Upgrade to Wagmi v2 / Reown AppKit scheduled during the Web3 client architecture refresh.

---

### Exception 2: `elliptic`
- **Path**: `vite-plugin-node-polyfills` > `node-stdlib-browser` > `crypto-browserify` > `browserify-sign` / `create-ecdh` > `elliptic`
- **Advisory**: [GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84)
- **Severity**: Critical / High
- **Vulnerability**: Elliptic uses a cryptographic primitive with a risky implementation.
- **Threat & Exposure Analysis**:
  - `elliptic` is brought in via Node.js standard library polyfills for browser environments.
  - AlphaBAG does not use `elliptic` for transaction signing, key generation, or authentication.
  - All cryptographic signatures are handled natively by the user's browser wallet extension (MetaMask, Rabby) or Viem's native implementation.
- **Sandbox & Runtime Boundaries**:
  - Inert in runtime application paths. No sensitive cryptographic operations invoke this polyfill.
- **Migration Roadmap**:
  - Transition Vite build configuration to modern native browser Web Crypto (`window.crypto.subtle`) and eliminate `vite-plugin-node-polyfills`.

---

### Exception 3: `ws` (Node.js WebSocket)
- **Path**: `@web3modal/wagmi` > `viem@1.21.3` > `ws`
- **Advisories**: [GHSA-3h5v-q93c-6h6q](https://github.com/advisories/GHSA-3h5v-q93c-6h6q), [GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx), [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p)
- **Severity**: High
- **Vulnerability**: Server-side WebSocket header DoS and uninitialized memory disclosure.
- **Threat & Exposure Analysis**:
  - The vulnerable code paths in `ws` apply specifically to Node.js server-side WebSocket servers receiving arbitrary untrusted HTTP upgrade requests.
  - In the frontend bundle, browsers execute their native `window.WebSocket` API. Node.js `ws` is excluded or stubbed in the production browser bundle (`dist/`).
- **Sandbox & Runtime Boundaries**:
  - The browser environment utilizes native browser WebSockets; Node's `ws` C/C++ / buffer handling code is not executed by browsers.
- **Migration Roadmap**:
  - Upgrade to Viem 2.x when migrating to Wagmi v2.

---

### Exception 4: `uuid`
- **Path**: `@metamask/rpc-errors` / `@metamask/json-rpc-engine` > `@metamask/utils` > `uuid`
- **Advisory**: [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
- **Severity**: Moderate
- **Vulnerability**: Missing buffer bounds check in v3/v5/v6 when custom buffer is provided.
- **Threat & Exposure Analysis**:
  - MetaMask SDK uses UUIDs solely for generating standard v4 random request identifiers (`v4()`) to correlate JSON-RPC request-response cycles.
  - Custom buffers are never passed by AlphaBAG or the MetaMask SDK.
- **Sandbox & Runtime Boundaries**:
  - Client-side execution with standard string return types.
- **Migration Roadmap**:
  - Monitored upstream via MetaMask SDK minor updates.

---

### Exception 5: `esbuild` / `vite` (Development Server)
- **Path**: `vite` > `esbuild`
- **Advisory**: [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- **Severity**: Moderate
- **Vulnerability**: Development server request handling.
- **Threat & Exposure Analysis**:
  - Affects local development server when listening on 0.0.0.0.
  - `esbuild` is a build-time compiler and bundler; it is not shipped in the static production build artifacts (`dist/`).
- **Sandbox & Runtime Boundaries**:
  - Production deployments serve pre-compiled static assets from CDN / Netlify / Nginx; `esbuild` is absent in production.
