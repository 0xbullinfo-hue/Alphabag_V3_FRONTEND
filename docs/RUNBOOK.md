# AlphaBAG V3 — Production Runbook & Operations Guide

This runbook provides deployment, configuration, secret rotation, database migration, and payout verification procedures for the AlphaBAG V3 platform.

---

## 1. Environment Variables Reference

### Backend (`alphabag_v3_backend`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime mode. Any value other than `development` or `test` is treated strictly as production. |
| `PORT` | No | `3003` | HTTP listening port for Express server. |
| `DATABASE_URL` | In Prod | N/A | PostgreSQL connection URI (`postgresql://user:pass@host:5432/dbname?schema=public`). |
| `JWT_SECRET` | In Prod | Random dev secret | Secret for signing JWTs. Must be ≥ 32 characters and not in weak secret blacklist. |
| `CEX_ENCRYPTION_KEY` | In Prod | Random dev secret | 64-character hexadecimal string (32 bytes) used for AES-256-GCM encryption of exchange keys. |
| `ADMIN_PORTAL_KEY` | In Prod | N/A | Secret key header required for accessing `/api/admin` endpoints. Compared via constant-time equality. |
| `FRONTEND_URL` | In Prod | `http://localhost:3005` | Allowed CORS origin. In production, must be a valid HTTPS URL (e.g. `https://alphabag.xyz`). |
| `BAG_TOKEN_ADDRESS` | In Prod | N/A | Contract address of $BAG token on BNB Smart Chain. Must not be the zero address in production. |
| `BSC_RPC_URL` | No | Public BSC RPC | Primary archive RPC endpoint for verifying on-chain token payout receipts. |
| `REDIS_URL` | No | N/A | Optional Redis connection string for distributed nonce storage and AI quota tracking. |
| `BUBBLEMAPS_API_KEY`| No | N/A | Server-side API key for Bubblemaps token cluster proxy. Never exposed to browser. |

### Frontend (`Alphabag_V3_FRONTEND`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | In Prod | `http://localhost:3003` | Backend API base URL. Enforced to use HTTPS in production builds (`https://api.alphabag.xyz`). |
| `VITE_ENVIRONMENT` | No | `development` | Deployment environment label (`development` or `production`). |
| `VITE_DATA_MODE` | No | `REAL` | Must be `REAL` in production. Production builds refuse `MOCK`. |
| `VITE_BAG_TOKEN_ADDRESS_MAINNET` | No | `""` | Contract address for $BAG token gating on BSC mainnet. |
| `VITE_NFT_CONTRACT_ADDRESS_MAINNET` | No | `""` | Genesis Pass NFT contract address. If empty/zero, mint button disables in production. |

---

## 2. Secret Rotation Procedures

### A. Rotating `JWT_SECRET`
> **Impact:** Immediately invalidates all active user and admin sessions. Users will need to re-authenticate via SIWE.
1. Generate a high-entropy 64-character secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update `JWT_SECRET` in the host environment configuration (e.g. Render, Railway, AWS ECS).
3. Restart backend service instances.

### B. Rotating `CEX_ENCRYPTION_KEY`
> **Impact:** Existing encrypted CEX API credentials will become un-decryptable with the new key unless re-encrypted.
1. Plan a planned maintenance window or prompt users to reconnect exchange credentials.
2. If maintaining credentials without re-prompting:
   - Run a migration script that loads credentials using `OLD_KEY`, decrypts them in memory, and re-encrypts with `NEW_KEY`.
3. Set the new `CEX_ENCRYPTION_KEY` on the backend host and restart.

### C. Rotating `ADMIN_PORTAL_KEY`
1. Generate a new secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
   ```
2. Update `ADMIN_PORTAL_KEY` on backend host and deploy.
3. Update team credentials used for `/api/admin` requests.

---

## 3. Applying Database Migrations

Database migrations are defined using Prisma with idempotent manual SQL migration scripts under `prisma/manual_migrations/`.

1. **Staging Verification**:
   ```bash
   DATABASE_URL="<staging_db_url>" npx prisma migrate deploy
   ```
2. **Production Application**:
   - Backup the production database snapshot before applying schema changes.
   - Run Prisma deploy:
     ```bash
     DATABASE_URL="<prod_db_url>" npx prisma migrate deploy
     ```
3. **Rollback Strategy**:
   - Each manual script in `prisma/manual_migrations/` contains rollback SQL instructions in comments.

---

## 4. Payout Processing & Verification Workflow

The AlphaBAG payout pipeline enforces a strict state machine to prevent synthetic payouts and double-spending:

```
PENDING (User requests payout)
    │
    ▼
PROCESSING (Admin or relayer initiates on-chain transfer)
    │
    ▼
VERIFICATION (On-chain tx receipt validated via RPC)
    │
    ├── Valid: Recipient, amount, and token contract match exactly ──► SENT / APPROVED
    │
    └── Invalid / Reverted / Fabricated ──► REJECTED (Zero funds marked done)
```

### Steps for Approving Payouts
1. Execute the on-chain transfer of $BAG tokens to the user's verified BSC wallet address.
2. Retrieve the confirmed transaction hash (`0x...`).
3. Call the admin endpoint `POST /api/admin/payouts/approve` with `requestId` and `txHash`.
4. The backend verifies the transaction receipt on BSC RPC:
   - Receipt status is `1` (Success).
   - Event log matches `Transfer(address,address,uint256)`.
   - `to` equals user's `verifiedWallet`.
   - `value` matches payout amount converted to token base units (18 decimals).
5. Only upon cryptographic confirmation is the claim marked as `APPROVED` or `SENT`.
