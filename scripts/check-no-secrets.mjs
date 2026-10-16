/** CI gate: fail the build if a key-like string ends up in dist/ or if sensitive env vars are used in src/. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_PATTERNS = [
  /AIza[0-9A-Za-z\-_]{35}/, // Google API key
  /sk-[A-Za-z0-9]{32,}/, // generic secret key
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

const SECRET_ENV_REGEX = /(?:import\.meta\.env\.|process\.env\.)(VITE_[A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*)/g;

const ALLOWED_VITE_ENV_VARS = new Set([
  'VITE_WALLETCONNECT_PROJECT_ID',
  'VITE_GA_MEASUREMENT_ID',
  'VITE_TURNSTILE_SITE_KEY',
  'VITE_BAG_TOKEN_ADDRESS_MAINNET',
  'VITE_BAG_TOKEN_ADDRESS_TESTNET',
  'VITE_ENABLE_TOKEN_GATING',
]);

let failed = false;

function scanSrc(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      scanSrc(p);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(f)) continue;

    const content = readFileSync(p, 'utf8');
    let match;
    while ((match = SECRET_ENV_REGEX.exec(content)) !== null) {
      const varName = match[1];
      if (!ALLOWED_VITE_ENV_VARS.has(varName)) {
        console.error(`❌ Forbidden secret-like env var "${varName}" in ${p}`);
        failed = true;
      }
    }
  }
}

function scanDist(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      scanDist(p);
      continue;
    }
    if (!/\.(js|mjs|css|html|json|map)$/.test(f)) continue;
    const src = readFileSync(p, 'utf8');
    for (const re of DIST_PATTERNS) {
      if (re.test(src)) {
        console.error(`❌ secret-like string in ${p}: ${re}`);
        failed = true;
      }
    }
  }
}

console.log('🔍 Scanning src/ for disallowed secret env variables...');
scanSrc('src');
if (failed) {
  console.error('❌ Found forbidden secret env references in src/. All private API keys must be proxied via backend.');
  process.exit(1);
}
console.log('✅ src/ clean of secret env variables.');

if (existsSync('dist')) {
  console.log('🔍 Scanning dist/ for secret-like strings...');
  scanDist('dist');
  if (failed) {
    console.error('❌ Refusing to deploy: secret-like strings found in dist/.');
    process.exit(1);
  }
  console.log('✅ dist/ clean of secrets.');
} else {
  console.log('ℹ️ dist/ does not exist yet (run build to generate and check dist).');
}