# Alphabag Frontend Hosting Guide for myalphabag.com (Namecheap + Auto Deploy)

This guide is for beginners.
Goal: every push to the Alphabag frontend repo should automatically update myalphabag.com on Namecheap.

## What you are setting up

- Frontend hosting for the Alphabag frontend repo on Namecheap shared hosting (static files only)
- Automatic deploy from GitHub Actions using FTP
- Domain with HTTPS (SSL)

Important:
- Your backend API is separate and must stay deployed on a backend host.
- This frontend already has a deploy workflow and Apache config in the repo.
- The Namecheap site only serves the built files from this frontend repo; it does not run the backend.

## Files already prepared in this repo

- .github/workflows/deploy.yml
- .github/workflows/deploy-staging.yml
- public/.htaccess

These handle build + FTP upload and browser caching/rewrite behavior.

This is the repo that should be connected to Namecheap:
- Alphabag frontend repository
- GitHub branch: main for production
- GitHub branch: staging for preview

---

## Step 1: Buy/prepare Namecheap hosting

1. Log in to Namecheap.
2. Make sure you have:
   - Domain: myalphabag.com
   - A shared hosting plan linked to that domain
3. Open cPanel from Namecheap dashboard.

If your domain and hosting are bought in different accounts, connect DNS first.

---

## Step 2: Point your domain to hosting

If your domain uses Namecheap BasicDNS:

1. Go to Domain List -> Manage -> Advanced DNS.
2. Add or confirm records:
   - A record for @ pointing to your Namecheap hosting server IP
   - CNAME for www pointing to @
3. Save changes.
4. Wait for DNS propagation (5 minutes to 24 hours).

How to find hosting server IP:
- In cPanel or hosting welcome email from Namecheap.

---

## Step 3: Enable SSL (HTTPS)

1. Open cPanel -> SSL/TLS Status.
2. Run AutoSSL for your domain.
3. Wait until certificate is active.
4. Test:
   - https://myalphabag.com
   - https://www.myalphabag.com

Do this before launch so visitors do not see security warnings.

---

## Step 4: Get FTP credentials from Namecheap

1. In cPanel, open FTP Accounts.
2. Create an FTP user or use existing main FTP user.
3. Note:
   - FTP host/server
   - FTP username
   - FTP password
   - FTP port (usually 21)
4. Confirm deploy folder is /public_html/.

---

## Step 5: Add GitHub repository secrets

In your GitHub repo:

1. Open Settings -> Secrets and variables -> Actions.
2. Add these required secrets exactly:

Deployment secrets:
- FTP_SERVER
- FTP_USERNAME
- FTP_PASSWORD

Staging deployment secrets:
- FTP_STAGING_SERVER
- FTP_STAGING_USERNAME
- FTP_STAGING_PASSWORD

Frontend build secrets used by this app:
- VITE_API_BASE_URL
- VITE_MARKET_PROXY_BASE_URL
- VITE_WALLETCONNECT_PROJECT_ID
- VITE_ALCHEMY_API_KEY
- VITE_BAG_TOKEN_ADDRESS_MAINNET
- VITE_BAG_TOKEN_ADDRESS_TESTNET
- VITE_MIN_BAG_REQUIRED
- VITE_ENABLE_TOKEN_GATING
- VITE_ENVIRONMENT
- VITE_DATA_MODE
- VITE_ENABLE_BACKGROUND_SYNC
- VITE_MORALIS_API_KEY
- VITE_COVALENT_API_KEY
- VITE_GEMINI_API_KEY
- VITE_BIRDEYE_API_KEY

Staging build secrets used by staging workflow:
- VITE_API_BASE_URL_STAGING
- VITE_MARKET_PROXY_BASE_URL_STAGING

Notes:
- VITE_LAUNCH_MODE and VITE_DEMO_MODE are already set in workflow.
- Never commit real keys into source files.

---

## Step 6: Confirm the deploy workflow target branch

Current behavior in this repo:
- Deploy runs on push to main.
- Staging deploy runs on push to staging.

If you want deploy from a different branch later, edit:
- .github/workflows/deploy.yml
- .github/workflows/deploy-staging.yml

---

## Step 6.1: Create staging URL on Namecheap

You can use either:

Option A: Folder URL (fastest)
- https://myalphabag.com/staging/

Option B: Subdomain URL (cleaner)
- Create subdomain in cPanel (for example, staging.myalphabag.com)
- Point subdomain document root to public_html/staging

Either option works with the staging workflow in this repo.

---

## Step 7: First deployment test

1. Make a tiny homepage change (example: edit one heading).
2. Commit and push to the Alphabag frontend repo.
3. In GitHub, open the Actions tab for this repo.
4. Open workflow run: Build and Deploy Frontend to Namecheap.
5. Wait for all steps to pass and publish the built `dist/` folder to Namecheap.

Expected result:
- Site updates in a few seconds to a few minutes.

---

## Step 8: Verify live domain

Check:
- Homepage loads
- Main styles and JS load correctly
- No 404 on refresh
- HTTPS lock icon present

If update does not appear:
1. Hard refresh browser (Ctrl + F5).
2. Open in private window.
3. Check GitHub Actions run logs.
4. Confirm files uploaded to /public_html/.

---

## Common issues and fixes

1) Action fails at FTP step
- Recheck FTP_SERVER, FTP_USERNAME, FTP_PASSWORD
- Confirm FTP is enabled in hosting
- Confirm server allows FTP on port 21

2) White page after deploy
- Usually missing or wrong VITE secrets
- Recheck all required build secrets in GitHub

3) API calls fail in browser
- VITE_API_BASE_URL is wrong or backend is down
- Backend must be reachable publicly with HTTPS

4) Domain opens old version
- Browser cache or CDN cache
- Hard refresh and test in private window

5) Refresh on non-home route gives 404
- Ensure public/.htaccess is deployed in /public_html/

---

## Daily workflow (after setup)

1. Edit code locally.
2. Push to the Alphabag frontend repo's staging branch first.
3. GitHub Actions in this repo deploys to the staging URL.
4. Review and approve changes on staging.
5. Merge staging into main in the same frontend repo.
6. Production workflow in the frontend repo deploys to the live domain.

That is your safer staging-to-production deployment loop.

---

## Safety checklist before each production push

- Confirm build passes locally
- Confirm no test/dev URLs in env
- Confirm API base URL is production URL
- Confirm no secrets are hardcoded in source
- Confirm SSL certificate still valid

---

## Optional hardening (recommended)

- Use a dedicated FTP deploy account with restricted path
- Rotate FTP password every 60-90 days
- Restrict admin/API origins on backend
- Add uptime monitoring for frontend and backend

---

## Quick rollback if a bad deploy goes live

Option A (recommended):
- Revert last commit in GitHub
- Push revert to main
- Auto deploy restores previous version

Option B:
- Upload previous dist backup manually to /public_html/

---

## Branch flow reference (recommended)

- staging branch -> deploy-staging.yml -> staging URL
- main branch -> deploy.yml -> production domain

This keeps production stable while you test every change first.
