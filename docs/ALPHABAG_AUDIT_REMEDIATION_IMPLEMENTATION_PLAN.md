# AlphaBAG Audit Remediation Implementation Plan

## Objective and Release Rule

Establish a sequenced, testable path to production readiness across the frontend, backend, and backend admin UI while preserving compatibility for deployed clients.

**Release rule:** Do not merge a client change that depends on a breaking API or schema change. Prefer additive changes with an expand-and-contract rollout. Use a coordinated cross-repository release only when compatibility cannot be maintained.

## Execution Status

| Phase | Implementation Status | Release Notes |
| :--- | :--- | :--- |
| 1. Security, Secrets & Core Stability | Code changes implemented; automated checks pass | Removed browser-side admin/provider credentials; added backend proxy routes for EVM and Solana transactions; added explicit production CORS origin allowlisting and environment examples; added admin source/bundle secret gates. Production release remains blocked until provider credentials previously embedded in browser builds are rotated and production `CORS_ALLOWED_ORIGINS` is configured with exact frontend/admin origins. Repository history cleanup remains a separately approved operations task. Backend-UI has no existing automated test files. |
| 2. Cross-Repo Contract & Backend Architecture | Complete; all available automated gates pass | OpenAPI covers signal REST/SSE/admin routes, provider proxy routes, and existing airdrop/admin response fields; both clients generate from the lowercase backend checkout. CoinStats/DEX retries and AlphaCalls SSE delivery are implemented. AlphaCalls source is admin-managed signals, with ULTIMATE as the Pro entitlement per product decision. |
| 3. Frontend & Admin UI Refinement | Not started | Depends on Phase 2 contract and endpoint behavior. |
| 4. Integration Testing & Production Verification | Not started | Release gate after Phases 1-3. |

This plan is based on the remediation scope and repository structures available during planning. The detailed audit report and all three source trees were not available for verification. Backend and admin paths below are repository-level targets to confirm before implementation, not confirmed defect locations.

## 1. Phase Breakdown

| Phase | Target Repo(s) | Key Deliverable | Dependency | Priority (P0/P1/P2) |
| :--- | :--- | :--- | :--- | :--- |
| 1. Security, Secrets & Core Stability | Backend, Frontend, Backend-UI | Secrets rotated and removed from tracked code; CORS/auth policy enforced; fatal runtime issues fixed; environment variables documented by repo | None | P0 |
| 2. Cross-Repo Contract & Backend Architecture | Backend, Frontend, Backend-UI | Versioned OpenAPI contract, compatible schema rollout, resilient provider ingestion, complete AlphaCalls entitlement and broadcast path | Phase 1; contract owner and release coordination agreed | P0 / P1 |
| 3. Frontend & Admin UI Refinement | Frontend, Backend-UI | Reliable controls, consistent financial formatting and status states, stable charts, guarded admin mutations | Phase 2 contract and endpoint behavior agreed | P1; admin authorization is P0 |
| 4. Integration Testing & Production Verification | All three | Passing end-to-end and failure-mode checks; monitored staged release with rollback criteria | Phases 1-3 complete | P0 release gate |

## 2. Step-by-Step Task Breakdown

### Phase 1: Security, Secrets & Core Stability

#### 1.1 Remove exposed secrets and rotate credentials

- **Targets:** Backend secret/config loading and tracked files; Frontend `.env.example` and `scripts/check-no-secrets.mjs`; Backend-UI environment/config files and CI workflows.
- **Issue:** Committed or client-bundled credentials can be abused. Removing a value from the current tree does not invalidate a leaked credential.
- **Implementation:** Inventory secrets in repository history, CI, deployment settings, and build artifacts. Revoke and rotate exposed credentials. Move provider secrets to backend-only secret storage. Keep only public client configuration in frontend examples. Add scanning to CI and document rotation and incident handling.
- **Definition of Done:** No active credential is present in tracked files or built artifacts; exposed credentials are rotated; secret scanning detects a seeded test secret; provider keys are only read by server-side code.

#### 1.2 Enforce CORS, authentication, and endpoint authorization

- **Targets:** Backend `server.js`, `src/**`, middleware/auth modules, `test/**`; Backend-UI `src/**` API client and route guards; Frontend `src/services/api.ts` and auth flows.
- **Issue:** Overbroad CORS or missing endpoint authorization can expose sensitive operations. Client-side guards alone do not secure mutations.
- **Implementation:** Use explicit environment-specific origin allowlists; validate credentials and preflight behavior; require server-side authentication and role/entitlement checks on sensitive routes; apply CSRF protections where cookie auth is used; return consistent 401/403 responses.
- **Definition of Done:** Tests reject unapproved origins and unauthenticated or unauthorized mutations; approved production origins work; auth failures produce stable, documented error responses.

#### 1.3 Stabilize fatal runtime paths and unify environment documentation

- **Targets:** Backend `src/**`, `server.js`, `test/**`, `.env.example`; Frontend `src/**`, `.env.example`, `package.json`; Backend-UI `src/**`, CI and root environment documentation.
- **Issue:** Runtime exceptions and rejected promises can crash requests or leave UI state stuck; unclear environment setup causes deployment drift.
- **Implementation:** Fix confirmed syntax/runtime failures; handle rejected promises at request and background-job boundaries; add startup validation for required variables and safe shutdown/error logging. Align variable names and descriptions across the three `.env.example` files while keeping each repo's actual values distinct. Document which variables are public, backend-only, optional, and required per environment.
- **Definition of Done:** Startup fails clearly on missing required configuration; error paths do not produce unhandled rejections; clean installs pass each repo's type/build/test gates; setup docs match the example files.

### Phase 2: Cross-Repo Contract & Backend Architecture

#### 2.1 Establish the canonical API contract and compatibility rollout

- **Targets:** Backend `openapi.yaml`, `src/**`, `test/**`; Frontend `src/types/openapi-contracts.ts`, `scripts/generate-types-from-openapi.js`; Backend-UI `contracts/**`, OpenAPI sync workflow and API client.
- **Issue:** Payload, parameter, or validation drift between backend and two clients can break deployed clients.
- **Implementation:** Select the backend OpenAPI document as the contract source of truth. Add or correct request/response schemas, parameter names, validation rules, error formats, and auth requirements. Generate client types in CI and fail on drift. Use additive fields and routes; for renames, support old and new names during a deprecation window. For database changes, expand first, deploy a compatible backend, migrate clients, then contract only after usage confirms the old shape is unused.
- **Definition of Done:** Both clients generate or verify against the same contract; contract tests cover success and validation failures; previously deployed clients remain compatible throughout rollout; breaking changes require explicit versioning or a coordinated release plan.

#### 2.2 Harden provider ingestion, caching, and fallback behavior

- **Targets:** Backend provider/market/DEX ingestion modules, `cron/**`, cache modules, `test/**`; Frontend `src/hooks/useDexScreenerStream.ts`, `src/hooks/useLiveMarketTicker.ts`, `src/cache/**`, `src/http/**`, and related data services.
- **Issue:** Rate limits, provider outages, or unstable streams can create stale data, request storms, or silent UI failure.
- **Implementation:** Centralize provider timeout, retry, and rate-limit handling. Retry only transient failures with bounded exponential backoff and jitter; respect `Retry-After`; avoid retrying permanent client errors. Add cache TTL and stale-while-revalidate behavior where appropriate. Define fallback and freshness semantics per feed; expose connection, stale-data, and provider-error state to clients.
- **Definition of Done:** Simulated 429/5xx/timeouts do not create unbounded retries; fallback returns clearly labeled stale or unavailable data; provider recovery restores live updates; logs/metrics identify provider, status, retry count, and freshness without exposing secrets.

#### 2.3 Complete the AlphaCalls signal and entitlement pipeline

- **Targets:** Backend signal trigger/service, subscription entitlement and WebSocket broadcast modules, `test/**`; Frontend `src/pages/frontend/AlphaCalls.tsx` and subscription/auth clients; Backend-UI signal controls and API client.
- **Issue:** A signal may be triggered but not reliably broadcast, or delivered to users without the required AlphaBAG Pro entitlement.
- **Implementation:** Specify signal input validation, trigger/deduplication rules, lifecycle, and delivery guarantees. Enforce entitlement server-side at subscription and message delivery, not only in the UI. Add authenticated WebSocket connection handling, reconnect/resubscribe behavior, and observable delivery failures. Ensure admin overrides and pause/resume actions call the same backend source of truth.
- **Definition of Done:** Integration tests prove eligible users receive a valid signal, ineligible users do not, duplicate triggers do not duplicate delivery, and reconnects do not lose or duplicate messages beyond documented delivery semantics.

### Phase 3: Frontend & Admin UI Refinement

#### 3.1 Standardize control states and financial display

- **Targets:** Frontend `src/pages/frontend/**`, shared form/button components, finance formatting utilities and tests; Backend-UI `src/**` shared controls and tables.
- **Issue:** Missing disabled/loading states allow duplicate submissions; inconsistent number formatting and status colors reduce clarity.
- **Implementation:** Add disabled, active, loading, success, and error states to asynchronous actions; prevent repeat submission while a request is pending. Centralize formatting by value type: fiat to two decimals, crypto to a documented 4-8 decimal policy with small-value handling, and thousands separators. Use semantic green/red tokens for positive/negative status and P&L. Preserve the existing institutional dark palette and 4px/8px spacing/radius conventions; check narrow layouts and long text for clipping.
- **Definition of Done:** Component and page tests assert pending-state locking and recovery after errors; representative fiat/crypto values format consistently; visual checks show no clipped controls, values, or status text at supported viewport sizes.

#### 3.2 Fix TradingView chart lifecycle and fallback states

- **Targets:** Frontend `src/components/TradingView/TVChartContainer.tsx`, `src/components/TradingView/datafeed.ts`, `src/components/intelligence/TradingViewChart.tsx`, chart-related tests.
- **Issue:** Widget initialization and cleanup can race with library loading, component unmount, symbol changes, or resizing, causing blank canvases, duplicate widgets, or retained listeners.
- **Implementation:** Make script loading idempotent and cancellable where possible; initialize only after the container and library are ready; remove widget, observer, and WebSocket resources on cleanup; guard asynchronous callbacks after unmount. Handle resize through one managed observer. Provide visible loading, unavailable, stale-feed, and recoverable-error states with a usable fallback.
- **Definition of Done:** Tests or browser checks cover mount/unmount, rapid symbol changes, missing library, failed script load, resize, and stream disconnect; no duplicate widget or lingering stream remains after teardown.

#### 3.3 Verify Backend-UI authorization and mutation feedback

- **Targets:** Backend-UI `src/**` route guards, API client, signal override/bot controls; Backend mutation endpoints, auth middleware and tests.
- **Issue:** Sensitive actions must be authorized by the backend and the UI must reflect the actual persisted result.
- **Implementation:** Confirm RBAC policy for every sensitive mutation; enforce it server-side; make the UI distinguish pending, succeeded, rejected, and failed actions. Refresh affected state from the backend after a mutation rather than optimistically claiming success. Record audit events for operator actions with actor, timestamp, target, and result.
- **Definition of Done:** Role matrix tests prove permitted and denied operations; unauthorized requests fail even when called outside the UI; successful overrides and pause actions match backend state after refresh; errors remain actionable and do not leave controls falsely updated.

### Phase 4: Integration Testing & Production Verification

#### 4.1 Automate end-to-end user and admin flows

- **Targets:** Frontend `test/**` and Playwright/E2E setup; Backend `test/**`; Backend-UI E2E and CI workflows.
- **Issue:** Unit tests cannot demonstrate that authentication, contracts, charts, signals, and admin actions work together.
- **Implementation:** Automate wallet connection/authentication, token navigation, chart loading and interaction, AlphaCalls entitlement and signal receipt, and an authorized admin action. Add assertions for denied access and error recovery. Use test wallets and mock services; never use production credentials.
- **Definition of Done:** CI runs deterministic E2E tests against a controlled backend and reports failures with trace/log artifacts; critical flow passes for eligible and ineligible accounts.

#### 4.2 Exercise network failures and recovery

- **Targets:** All three repos' integration tests, API clients, WebSocket clients, backend provider adapters, and UI notifications.
- **Issue:** 429, 500, timeout, dropped socket, and malformed payload cases may leave the interface silent or stuck.
- **Implementation:** Inject deterministic 429/500/timeouts, WebSocket close/reconnect, malformed provider payloads, and expired auth. Verify bounded retries, stale/fallback state, actionable banners/toasts, and recovery after the service returns.
- **Definition of Done:** Every injected failure produces the specified user-visible state; retries remain bounded; recovered services restore fresh data; no unhandled rejection or duplicate mutation occurs.

#### 4.3 Gate staged production rollout

- **Targets:** CI/CD and deployment configuration for all three repositories; release/runbook documentation.
- **Issue:** Independent repo deployments can expose incompatible contract or schema versions.
- **Implementation:** Release in dependency order: expand-compatible backend/schema first, then Frontend and Backend-UI, then contract cleanup in a later release. Use health checks, contract-version checks, staged traffic, and rollback criteria. Track error rate, provider freshness, WebSocket connection/delivery health, and authorization failures.
- **Definition of Done:** Release owner verifies all CI gates and smoke tests; rollback steps are rehearsed; metrics and alerts are active; no destructive migration or compatibility removal is bundled into the first release.

## 3. Critical Path & Risk Matrix

| Dependency / Risk | Potential Impact | Mitigation |
| :--- | :--- | :--- |
| API or database change ships before both clients are compatible | Frontend or admin workflows fail in production | Make OpenAPI the shared contract; use additive changes and expand-and-contract migrations; deploy backend compatibility before client releases |
| Credentials were exposed but only removed from current files | Existing leaked keys remain usable | Rotate/revoke first, scan repository history and deployment settings, scan built bundles, document owner and rotation date |
| Entitlement enforced only in the UI | Unauthorized AlphaCalls access | Enforce authorization in backend route and WebSocket delivery paths; test with direct unauthenticated and ineligible requests |
| External data provider rate limits or outage | Stale or missing market/signal data; retry amplification | Bounded jittered retries, `Retry-After`, caching, fallback data, freshness indicators, and provider-specific monitoring |
| TradingView library is absent or loads late | Blank or unstable chart experience | Verify licensing/deployment prerequisites early; cover missing-library and load-failure states; retain a functional fallback |
| Admin mutations update UI before backend confirmation | Operators see false pause/override state | Treat backend as source of truth; reflect pending and confirmed states separately; verify persisted state after mutation |
| Environment variables differ across repositories or deployment environments | Startup failures or wrong origins/provider configuration | Maintain role-specific `.env.example` files with a shared variable reference; validate required values at startup and in deployment checks |
| E2E tests depend on live wallets/providers | Flaky CI and delayed releases | Use deterministic mocks and test credentials; keep a smaller post-deploy smoke test for live integrations |

**Critical path:** Secret rotation and server-side access controls → canonical API/schema contract → compatible backend rollout → both client integrations → end-to-end and failure-mode gates → staged production release.

## 4. Testing & QA Verification Checklist

### Phase 1 gates

- [ ] Secret scanner passes on tracked files and production build output; a seeded test credential is detected.
- [ ] Rotated provider credentials are confirmed in deployment configuration; no old credential remains active.
- [ ] CORS tests allow configured origins and reject unconfigured origins, including credentialed requests.
- [ ] Auth/RBAC tests cover unauthenticated, unauthorized, and authorized access for sensitive mutations.
- [ ] Required environment variables fail fast with actionable messages; examples and environment docs agree.
- [ ] Typecheck, lint/static checks, unit tests, and production build pass; no unhandled rejection is observed in smoke tests.

### Phase 2 gates

- [ ] OpenAPI validation passes; generated Frontend and Backend-UI types are current and CI detects drift.
- [ ] Contract tests cover valid payloads, missing/invalid fields, deprecated aliases, and stable error shapes.
- [ ] Previous client payloads work against the expanded backend during the compatibility window.
- [ ] Provider tests inject 429, 5xx, timeout, malformed response, and recovery; retries are bounded and respect `Retry-After`.
- [ ] Cache tests verify TTL, stale-while-revalidate, and invalidation behavior.
- [ ] AlphaCalls tests verify trigger validation, deduplication, Pro entitlement, broadcast, reconnect, and admin pause/override behavior.

### Phase 3 gates

- [ ] Async controls cannot submit twice; loading, disabled, success, and error states are verified.
- [ ] Formatting tests cover zero, tiny crypto values, large values with separators, negative values, and fiat precision.
- [ ] Visual checks cover desktop and narrow/mobile widths with no clipped numbers, controls, or status messages.
- [ ] TradingView checks cover delayed/missing script, chart mount/unmount, symbol change, resize, WebSocket loss, and fallback rendering.
- [ ] Admin role tests verify denied mutations remain denied through direct API calls; successful changes match persisted backend state.

### Phase 4 release gates

- [ ] E2E wallet/auth → token navigation → chart interaction → eligible AlphaCalls signal receipt passes.
- [ ] Ineligible and unauthenticated users cannot receive gated signals or invoke protected mutations.
- [ ] Mocked 429/500/timeout/socket-drop cases display actionable UI state and recover without duplicate actions.
- [ ] CI gates pass in all three repos: typecheck/build, tests, contract drift, secret scan, and the frontend design check.
- [ ] Staged rollout smoke tests and rollback are rehearsed; dashboards/alerts cover API errors, provider freshness, stream health, and auth denials.
- [ ] Schema contract cleanup is deferred until telemetry confirms old clients and fields are no longer in use.

## Repository-Specific Validation Commands

The available Frontend workspace defines `npm run typecheck`, `npm run test`, `npm run check:design-slop`, `npm run build`, and `npm run verify:openapi-types`. The build should use the deployment API base URL required by the repository's release instructions. Confirm the equivalent package scripts and CI gates in the Backend and Backend-UI repositories before implementation.

### Phase 1 Execution Verification

- Frontend: `npm run typecheck`, `npm run test` (98 tests), `npm run check:design-slop`, production build/prerender, and postbuild secret scan passed.
- Backend: `npm test` (50 tests) and `npm run validate` (49 endpoints, 42 schemas, no breaking changes) passed.
- Backend-UI: configured test command exited successfully but found no test files; source secret scan, TypeScript check, production build, and bundle scan passed.
- Remaining production operations: rotate previously exposed provider keys, set `CORS_ALLOWED_ORIGINS` to the exact production UI origins, and follow the approved history-purge procedure if sensitive historical data requires rewriting.

### Phase 2 Execution Verification

- Backend contract validation passes for 53 endpoints and 48 schemas with no breaking changes; all operation responses are documented.
- Backend tests pass (61 tests), including provider retry, rate-limit, signal entitlement, mutation broadcast, and cross-instance polling checks.
- Frontend and Backend-UI contract types are regenerated from `alphabag_v3_backend/openapi.yaml`; both local generators now prefer that checkout over the stale alternate directory name.
- Frontend typecheck, 98 tests, design check, production build/prerender, and secret scan pass. Backend-UI typecheck, production build, and source/bundle secret scans pass; its configured test command finds no test files. Contract additions also corrected existing admin airdrop UI type mismatches.
- AlphaCalls uses SSE snapshots with REST fallback/reconnect. Admin CRUD remains the signal source; automated trigger rules were not added because the product decision was admin-managed publication.
- The Backend-UI test script currently finds no test files; maintain that as a coverage gap until focused client tests are added.