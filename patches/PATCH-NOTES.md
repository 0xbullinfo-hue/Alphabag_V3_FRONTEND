# AlphaBAG V3 — Security & Production Patch Bundle (v2)

## Overview
This patch bundle addresses **8 critical and high-priority issues** discovered during the alpha-pass review. **Zero wallets are hardcoded in source code.** All admin wallets are managed via the database. A secure bootstrap mechanism is provided for the first admin.

---

## Patch Index

| # | File | Severity | Description |
|---|------|----------|-------------|
| 01 | `PATCH-01-backend-authMiddleware.js` | 🔴 **P0 — Critical** | Zero hardcoded wallets. 100% DB-driven admin verification. Blocks all bypasses. |
| 02 | `PATCH-02-frontend-AlphaPasses.tsx` | 🟡 **P1 — High** | Real contract mint + approval flow. Replaces fake simulation. |
| 03 | `PATCH-03-frontend-AuthContext.tsx` | 🟡 **P1 — High** | Removes localhost auto-ULTIMATE bypass. Opt-in env var only. |
| 04 | `PATCH-04-contract-AlphaBagGenesisPass.sol` | 🟡 **P1 — High** | `supportsInterface`, Pausable, Enumerable, zero-address guards, ReentrancyGuard. |
| 05 | `PATCH-05-backend-app.js` | 🟢 **P2 — Medium** | Hardened CORS, CSP, body limits, HSTS. Wires admin seed route. |
| 06 | `PATCH-06-backend-authController.js` | 🔴 **P0 — Critical** | Removes hardcoded `ADMIN_WALLETS`. Adds `promoteToAdmin`, `removeAdmin`, `listAdmins`. |
| 07 | `PATCH-07-backend-adminSeedRoutes.js` | 🟡 **P1 — High** | Secure one-time bootstrap for first admin via env secret. |
| 08 | `PATCH-08-backend-env-config.js` | 🟢 **P2 — Medium** | Adds `ADMIN_SETUP_SECRET` to config. |
| 09 | `PATCH-09-backend-authRoutes.js` | 🟢 **P2 — Medium** | Wires admin management endpoints. |

---

## 🔴 PATCH-01: Backend authMiddleware.js

### What was wrong
1. **Hardcoded admin wallets** in source code (`0x4291...` committed to git)
2. **`wallet-auth:` prefix bypass** — anyone could impersonate any address
3. Admin status determined by source code, not the database

### What the patch does
- **Zero hardcoded wallets.** The `admins` database table is the single source of truth.
- **Removes `wallet-auth:` entirely.** Only properly signed JWTs are accepted.
- **Validates `isAdmin` claims against DB** on every request — prevents token tampering.
- Adds explicit JWT error handling (expired, malformed).

### How to add admins later
**Option A — Secure Bootstrap (recommended for first admin):**
1. Set `ADMIN_SETUP_SECRET` in your `.env` to a strong random string (64+ chars):
   ```
   ADMIN_SETUP_SECRET=your-very-long-random-secret-here-never-share-it
   ```
2. Deploy with PATCH-07 (adminSeedRoutes) active.
3. POST to `/api/admin-seed`:
   ```json
   { "wallet": "0xYourFirstAdminWallet", "secret": "your-very-long-random-secret-here-never-share-it" }
   ```
4. Once confirmed, **remove `ADMIN_SETUP_SECRET` from `.env` and redeploy** to disable the seed route.

**Option B — Direct DB insert (if you have DB access):**
```sql
INSERT INTO "admins" ("id", "wallet", "addedBy", "addedAt")
VALUES (gen_random_uuid(), '0x...', 'manual', now());
```

**Option C — Existing admin dashboard (after first admin exists):**
- Use PATCH-06 (`promoteToAdmin`) via the admin dashboard to add more admins.

---

## 🔴 PATCH-06: Backend authController.js

### What was wrong
- `ADMIN_WALLETS` array was hardcoded in the verify function:
  ```js
  const ADMIN_WALLETS = ['0x1234...', '0x4291...'];
  ```
- No way to dynamically add/remove admins without redeploying.

### What the patch does
- **Removes `ADMIN_WALLETS` array completely.**
- Admin status is determined by querying the `admins` table during SIWE verification.
- Adds `promoteToAdmin()` — existing admins can add new admins via API.
- Adds `removeAdmin()` — existing admins can revoke admin status.
- Adds `listAdmins()` — audit all current admins.
- Prevents self-removal to avoid lockout.

---

## 🟡 PATCH-07: Backend adminSeedRoutes.js

### What it does
- Provides a **one-time secure bootstrap** endpoint: `POST /api/admin-seed`
- Protected by `ADMIN_SETUP_SECRET` env var (not hardcoded in source).
- Heavily rate-limited (5 attempts/hour).
- Logs all attempts for audit.

### Security model
```
No admins in DB  →  Use /api/admin-seed with secret  →  First admin created
Admins exist     →  Use /api/auth/admin/promote      →  New admins added by existing ones
```

### After bootstrap
1. Remove `ADMIN_SETUP_SECRET` from `.env`
2. Remove `app.use('/api/admin-seed', adminSeedRoutes)` from `app.js`
3. Redeploy

---

## 🟡 PATCH-02: Frontend AlphaPasses.tsx

### What was wrong
- `handleMintPass()` was entirely simulated (`setTimeout` + fake state)
- Fake random token ID generation
- No BAG token approval flow

### What the patch does
- Real contract ABIs for BAG (ERC-20) and AlphaPass (ERC-721)
- Two-step mint: `approve(BAG)` → `mintWithBag(quantity)`
- `useContractWrite` + `useWaitForTransaction` for proper tx lifecycle
- Real-time BAG balance via `useBalance`
- Loading states: `APPROVING` → `MINTING` → `SUCCESS`

### Before deploying
Set real deployed addresses in `src/services/config.ts`:
```ts
NFT_CONFIG.NFT_CONTRACT_ADDRESS_MAINNET = '0x...';
TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_MAINNET = '0x...';
```

---

## 🟡 PATCH-03: Frontend AuthContext.tsx

### What was wrong
```ts
const IS_LOCALHOST_DEV = window.location.hostname === 'localhost';
if (IS_LOCALHOST_DEV) userData.tier = 'ULTIMATE';
```
Any developer running locally got full ULTIMATE access.

### What the patch does
- Replaced with **opt-in env var**: `VITE_ENABLE_DEV_ULTIMATE=true`
- Adds `console.warn` when override is active
- Even with override, backend rejects forged admin claims (PATCH-01)

---

## 🟡 PATCH-04: Smart Contract AlphaBagGenesisPass.sol

### What was wrong
1. No `supportsInterface()` — marketplaces can't discover EIP-2981 royalties
2. Not actually ERC-721A (claims it but uses basic for-loop)
3. No zero-address checks on setters
4. No Pausable emergency stop
5. No Enumerable (`totalSupply`, `tokenOfOwnerByIndex`)
6. `_checkOnERC721Received` operator bug
7. No ReentrancyGuard on mint

### What the patch does
- `supportsInterface()` returns `IERC721 | IERC721Metadata | IERC721Enumerable | IERC2981`
- `Pausable` with `pause()` / `unpause()`
- `ERC721Enumerable` with full index tracking
- `ReentrancyGuard` on `mintWithBag`
- Zero-address guards on all setters
- Events for all state changes
- `MAX_MINT_PER_WALLET` enforced at contract level

### ⚠️ Note on ERC-721A
This patch adds Enumerable but does **not** convert to true Azuki ERC-721A. For 10k supply, consider migrating to [ERC721A](https://github.com/chiru-labs/ERC721A) for ~10x gas savings on batch mints.

---

## 🟢 PATCH-05: Backend app.js

### What was wrong
- CORS allowed wildcard in non-production
- No CSP configuration
- No request body limits
- Missing HSTS

### What the patch does
- Removes wildcard CORS entirely (even dev only allows localhost)
- `helmet.contentSecurityPolicy` with strict directives
- `express.json({ limit: '100kb' })`
- `HSTS` in production
- Wires `/api/admin-seed` with heavy rate limiting
- Warns if `ADMIN_SETUP_SECRET` is still set in production

---

## 🟢 PATCH-08: env.js config snippet

Add to your existing `env.js`:
```js
adminSetupSecret: process.env.ADMIN_SETUP_SECRET || null,
```

---

## 🟢 PATCH-09: authRoutes.js snippet

Add to your existing `authRoutes.js`:
```js
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { promoteToAdmin, removeAdmin, listAdmins } from '../controllers/authController.js';

router.post('/admin/promote', verifyToken, verifyAdmin, promoteToAdmin);
router.post('/admin/remove', verifyToken, verifyAdmin, removeAdmin);
router.get('/admin/list', verifyToken, verifyAdmin, listAdmins);
```

---

## Prisma Schema Additions

Ensure your `schema.prisma` has an `admins` table:
```prisma
model Admin {
  id        String   @id @default(uuid())
  wallet    String   @unique
  addedBy   String   // wallet or 'SETUP_SECRET' of the entity that added this admin
  addedAt   DateTime @default(now())

  @@index([wallet])
}
```

Run:
```bash
npx prisma migrate dev --name add_admins_table
```

---

## Deployment Checklist

- [ ] All patches applied
- [ ] Prisma `admins` table migrated
- [ ] `ADMIN_SETUP_SECRET` set in `.env` (64+ random chars)
- [ ] Deploy backend with seed route active
- [ ] POST `/api/admin-seed` to create first admin
- [ ] **Remove `ADMIN_SETUP_SECRET` from `.env`**
- [ ] **Remove `app.use('/api/admin-seed', ...)` from `app.js`**
- [ ] Redeploy backend (seed route now disabled)
- [ ] Verify admin routes work with DB-backed check
- [ ] Set contract addresses in frontend `config.ts`
- [ ] Deploy contract to BSC testnet, test full mint flow
- [ ] Verify contract on BscScan with patched source
- [ ] Call `setMintActive(true)` only after final review

---

## Additional Recommendations (Not Patched)

| Priority | Issue | Suggested Fix |
|----------|-------|---------------|
| P2 | SessionStorage JWT | Migrate to `httpOnly` cookies + CSRF tokens |
| P2 | Outdated wagmi v1 | Upgrade to wagmi v2 + Web3Modal v4 |
| P2 | StoreService mutex | Replace in-memory Promise chain with Redis or DB advisory locks |
| P2 | Missing request validation | Add Zod schemas to all route handlers |
| P3 | No contract events indexing | Add TheGraph or custom indexer for `Transfer` events |

---

*Generated: 2026-08-23*
*Reviewed by: Security Alpha Pass Audit*
