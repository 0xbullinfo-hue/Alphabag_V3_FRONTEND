# AlphaBAG Platform Integration Contract v1

Status: Proposed implementation contract

This document defines the shared API boundary between:

- `Alphabag_V3_FRONTEND`
- `alphabag_v3_backend`
- `Alphabag_V3_Backend-UI`

It covers the services introduced or changed by the frontend security and architecture patch. Backend implementation and frontend integration must conform to this document before production release.

## 1. General Rules

### Base URL

- Local development: the frontend uses relative `/api` paths and Vite proxies them to the backend.
- Production: `VITE_API_BASE_URL` must be an absolute HTTPS backend origin without a trailing slash, for example `https://api.alphabag.pro`.
- All API paths in this document are relative to the backend origin.

### Authentication

Authenticated REST endpoints require:

```http
Authorization: Bearer <access-jwt>
```

The backend must return `401` for absent, expired, or invalid tokens and `403` for authenticated users without required authorization.

### Request Metadata

Frontend REST clients may send:

```http
X-Request-ID: <UUID>
X-Client-Timestamp: <Unix milliseconds>
```

The backend must allow both headers in CORS preflight and include the request ID in structured logs and error responses when available.

### Error Response

All non-RPC JSON errors use this envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "address must be a valid EVM address",
    "requestId": "c2f2849a-c731-4c0d-bad9-b79d3cdd1d59",
    "details": []
  }
}
```

`details` is optional. Error codes are stable machine-readable uppercase strings. Suggested codes include `AUTH_REQUIRED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMITED`, `UPSTREAM_UNAVAILABLE`, and `INTERNAL_ERROR`.

### CORS

Production CORS must allow only explicitly configured frontend origins. It must allow:

```text
Content-Type, Authorization, X-Request-ID, X-Client-Timestamp
```

Allowed methods must include `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` as required by mounted routes.

## 2. Canonical Chain Mapping

Provider-specific names must not leave backend provider adapters. Client APIs use only the canonical chain keys below.

```ts
export type ChainKey =
  | 'ethereum'
  | 'bsc'
  | 'polygon'
  | 'arbitrum'
  | 'base'
  | 'avalanche'
  | 'solana';

export interface ChainDefinition {
  key: ChainKey;
  evmChainId?: number;
  supportsRpc: boolean;
  supportsApprovals: boolean;
}
```

| Chain key | EVM chain ID | RPC route name | Covalent adapter slug |
| --- | ---: | --- | --- |
| `ethereum` | 1 | `ethereum` | `eth-mainnet` |
| `bsc` | 56 | `bsc` | `bsc-mainnet` |
| `polygon` | 137 | `polygon` | `matic-mainnet` |
| `arbitrum` | 42161 | `arbitrum` | `arbitrum-mainnet` |
| `base` | 8453 | `base` | `base-mainnet` |
| `avalanche` | 43114 | `avalanche` | `avalanche-mainnet` |
| `solana` | n/a | n/a | provider-specific |

The frontend must map wallet/RPC library labels and display labels to these keys. The backend validates every requested key against this allowlist.

## 3. Portfolio Balances

### `GET /api/portfolio/balances`

Authentication: required.

Query:

```text
address=0x...              Required EVM address when querying EVM balances.
chains=ethereum,bsc,base   Optional comma-separated canonical chain keys.
```

A request may use an authenticated user's saved portfolio if `address` is omitted only when the product explicitly supports that workflow. The backend must not silently substitute a different wallet address.

Response `200`:

```json
{
  "tokens": [
    {
      "contractAddress": "0x0000000000000000000000000000000000000000",
      "symbol": "ETH",
      "name": "Ethereum",
      "chain": "ethereum",
      "balance": "1.25",
      "priceUSD": 3500.12,
      "valueUSD": 4375.15,
      "change24h": 2.34,
      "logo": "https://..."
    }
  ],
  "updatedAt": "2026-08-21T12:00:00.000Z"
}
```

`balance` is a decimal string, not a raw integer. `priceUSD`, `valueUSD`, and `change24h` are numbers. Empty holdings return `tokens: []`, never an ambiguous bare array or `null`.

## 4. Portfolio Transactions

### `GET /api/portfolio/transactions`

Authentication: required.

Query:

```text
address=0x...              Required EVM address.
chain=ethereum             Optional canonical chain key.
cursor=<opaque cursor>     Optional pagination cursor.
limit=50                   Optional, 1-100; default 50.
```

Response `200`:

```json
{
  "items": [
    {
      "id": "0xtransactionHash",
      "type": "TRANSFER",
      "coin": "ETH",
      "price": 0,
      "amount": 0.5,
      "date": "2026-08-21T12:00:00.000Z",
      "value": 1750,
      "hash": "0xtransactionHash",
      "from": "0x...",
      "to": "0x...",
      "fee": 0.01,
      "status": "CONFIRMED",
      "chain": "ethereum"
    }
  ],
  "nextCursor": null,
  "updatedAt": "2026-08-21T12:00:00.000Z"
}
```

## 5. CEX Connection and Balances

CEX secrets are accepted only once by the backend and stored encrypted at rest under the authenticated user. They must never be stored in browser local storage, returned to the frontend, written to application logs, or included in error telemetry.

### `POST /api/cex/connections`

Authentication: required.

Request:

```json
{
  "exchangeId": "binance",
  "apiKey": "exchange-api-key",
  "secret": "exchange-secret",
  "passphrase": "optional-exchange-passphrase"
}
```

Response `201`:

```json
{
  "connection": {
    "id": "cex_connection_id",
    "exchangeId": "binance",
    "name": "Binance",
    "status": "CONNECTED",
    "createdAt": "2026-08-21T12:00:00.000Z",
    "lastSyncedAt": "2026-08-21T12:00:00.000Z"
  }
}
```

### `GET /api/cex/connections`

Authentication: required.

Response `200` returns `{ "connections": [CexConnection] }`. The result includes no API-key prefix and no credential material.

### `DELETE /api/cex/connections/:connectionId`

Authentication: required. The backend verifies ownership before deletion. Response: `204`.

### `GET /api/cex/balances`

Authentication: required.

Response `200`:

```json
{
  "balances": [
    {
      "connectionId": "cex_connection_id",
      "exchange": "binance",
      "symbol": "BTC",
      "name": "Bitcoin",
      "balance": "0.452",
      "priceUSD": 64230.5,
      "valueUSD": 29032.18,
      "logo": "https://..."
    }
  ],
  "totalUSD": 29032.18,
  "updatedAt": "2026-08-21T12:00:00.000Z"
}
```

The backend owns credential verification, balance refresh, and per-user cache expiry. The frontend owns presentation only.

## 6. Security Approvals

### `GET /api/security/approvals`

Authentication: required.

Query:

```text
address=0x...
chain=bsc
```

`address` must be a valid EVM address. `chain` must be one of the canonical EVM `ChainKey` values. Solana is not supported by this endpoint.

Response `200`:

```json
{
  "items": [
    {
      "contract_address": "0x...",
      "contract_ticker_symbol": "USDC",
      "contract_name": "USD Coin",
      "contract_decimals": 6,
      "balance": "1000000",
      "quote_rate": 1,
      "logo_url": "https://...",
      "allowances": [
        {
          "spender_address": "0x...",
          "spender_label": "Example Router",
          "allowance_amount": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
          "transaction_hash": "0x..."
        }
      ]
    }
  ],
  "updatedAt": "2026-08-21T12:00:00.000Z"
}
```

Only the backend provider adapter handles Covalent-specific fields, API keys, and chain slugs. Cache results per address and chain briefly to control provider cost. Never return a provider API key.

## 7. Feature Flags

### `GET /api/config/features`

Authentication: optional unless the server serves user/tier-specific flags. If optional, return safe public defaults to anonymous clients.

Response `200`:

```json
{
  "disabledPages": [],
  "enableTokenGating": false,
  "isTeaserMode": false,
  "maxPortfolios": 5,
  "maxWhales": 5,
  "enableAlphaAi": true,
  "enableSecurityScanner": true,
  "updatedAt": "2026-08-21T12:00:00.000Z"
}
```

The backend is the source of truth. The frontend must use the same query result for route guards and navigation. `Alphabag_V3_Backend-UI` may edit flags only through an authenticated, audited administrative API. It must never contain a browser-visible shared `ADMIN_PORTAL_KEY`.

## 8. EVM JSON-RPC Proxy

### `POST /api/rpc/:chain`

Authentication: public constrained transport by default. Standard wagmi HTTP transports cannot use the frontend Axios bearer-token interceptor. This endpoint must not expose privileged provider capability.

`chain` accepts only the canonical EVM keys:

```text
ethereum, bsc, polygon, arbitrum, base, avalanche
```

Request is a JSON-RPC 2.0 request or batch:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getBalance",
  "params": ["0x...", "latest"]
}
```

Response preserves JSON-RPC semantics:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0"
}
```

The proxy must:

- map chain keys to server-held provider URLs;
- validate JSON-RPC version, body size, batch length, and parameter count;
- allowlist read-only methods required by the application;
- reject private, signing, tracing, and transaction-submission methods unless intentionally designed and separately secured;
- apply per-IP and per-origin rate limits, concurrency limits, upstream timeout, and upstream response-size limits;
- cache safe idempotent read calls where appropriate;
- return JSON-RPC error envelopes for protocol errors;
- log provider failures without credentials or full sensitive payloads.

The RPC proxy must be independently load-tested before production because WalletConnect and wallet UI polling can produce bursts of calls.

## 9. Portfolio Streaming

SSE is optional for the first release. REST polling and manual refresh must work when streaming is disabled or unavailable.

Native browser `EventSource` cannot attach an `Authorization` header. Do not send long-lived access JWTs in the URL.

### `POST /api/stream/portfolio-ticket`

Authentication: required.

Response `200`:

```json
{
  "ticket": "short_lived_single_purpose_ticket",
  "expiresAt": "2026-08-21T12:01:00.000Z"
}
```

Tickets must be short-lived, scoped to the authenticated user, auditable, and preferably single-use.

### `GET /api/stream/portfolio?ticket=...`

Authentication: validated via the ticket only. The server must set `Content-Type: text/event-stream`, send keepalives, stop work on disconnect, enforce per-user connection limits, and avoid putting credential values in logs.

Message event:

```text
event: portfolio
data: {"dex":{"tokens":[],"updatedAt":"2026-08-21T12:00:00.000Z"},"cex":{"balances":[],"totalUSD":0,"updatedAt":"2026-08-21T12:00:00.000Z"},"timestamp":"2026-08-21T12:00:00.000Z"}

```

The frontend uses bounded exponential reconnect. On repeated errors it stops streaming and continues React Query polling.

## 10. Ownership and Rollout

| Concern | Owning repository |
| --- | --- |
| Public app API consumption and UI state | `Alphabag_V3_FRONTEND` |
| Authentication, provider credentials, encryption, API validation, CORS, rate limiting, caching, streaming | `alphabag_v3_backend` |
| Authenticated administrator controls and audit history for configuration | `Alphabag_V3_Backend-UI` and `alphabag_v3_backend` |

Release order:

1. Implement and test backend endpoints and CORS.
2. Generate/update shared OpenAPI types from the approved contracts.
3. Update frontend chain mappings and API consumers to the canonical shapes.
4. Test all three repositories together in staging.
5. Deploy backend before frontend.

## 11. Release Gates

- Production API URL is valid HTTPS and frontend environment validation passes.
- No `VITE_COVALENT_API_KEY` or `VITE_ALCHEMY_API_KEY` appears in frontend source or production assets.
- Cross-origin preflight permits required headers.
- Wallet reads work through the constrained RPC proxy without frontend provider secrets.
- Feature flags update both route guards and Sidebar navigation consistently.
- CEX credentials are encrypted at rest and never persisted in browser storage.
- Security approval scans return provider-neutral contract data.
- Portfolio REST behavior works when SSE is unavailable.
- Backend UI feature changes use authenticated, auditable server-side authorization.
