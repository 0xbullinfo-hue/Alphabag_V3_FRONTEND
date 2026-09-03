const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distIndex = path.join(root, 'dist', 'index.html');
const publicDir = path.join(root, 'public');

const checks = [];

function addCheck(name, passed, detail) {
  checks.push({ name, passed, detail });
}

if (!fs.existsSync(distIndex)) {
  addCheck('dist/index.html exists', false, 'Build output not found');
} else {
  const html = fs.readFileSync(distIndex, 'utf8');
  const requiredSnippets = [
    'AlphaBAG',
    'multi-chain portfolio tracking',
    'AI-backed crypto intelligence',
    'rel="canonical"',
    'robots',
    'application/ld+json',
    'alphabag-schema-website',
    'alphabag-schema-software',
    'alphabag-schema-org',
    'alphabag-schema-faq',
    'AlphaBAG Crypto Intelligence Platform'
  ];

  for (const snippet of requiredSnippets) {
    const passed = html.includes(snippet);
    addCheck(`contains ${snippet}`, passed, passed ? 'found' : 'missing');
  }
}

for (const file of ['robots.txt', 'sitemap.xml', 'llms.txt']) {
  const target = path.join(publicDir, file);
  addCheck(`${file} exists`, fs.existsSync(target), fs.existsSync(target) ? 'found' : 'missing');
}

const failed = checks.filter((check) => !check.passed);
for (const check of checks) {
  console.log(`${check.passed ? 'PASS' : 'FAIL'}: ${check.name} - ${check.detail}`);
}

if (failed.length > 0) {
  console.error(`\nCrawlability verification failed with ${failed.length} issue(s).`);
  process.exit(1);
}

console.log(`\nCrawlability verification passed with ${checks.length} check(s).`);
