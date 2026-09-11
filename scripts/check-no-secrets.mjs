/** CI gate: fail the build if a key-like string ends up in dist/. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PATTERNS = [
  /AIza[0-9A-Za-z\-_]{35}/,        // Google API key
  /sk-[A-Za-z0-9]{32,}/,           // generic secret key
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

let failed = false;
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(js|mjs|css|html|json|map)$/.test(f)) continue;
    const src = readFileSync(p, 'utf8');
    for (const re of PATTERNS) {
      if (re.test(src)) { console.error(`❌ secret-like string in ${p}: ${re}`); failed = true; }
    }
  }
}
walk('dist');
if (failed) { console.error('Refusing to deploy.'); process.exit(1); }
console.log('✅ no secrets found in dist/');