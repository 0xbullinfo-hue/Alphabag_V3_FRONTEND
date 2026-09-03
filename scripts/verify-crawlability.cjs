const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const distIndex = path.join(distDir, 'index.html');
const publicDir = path.join(root, 'public');
const staticRoutesPath = path.join(root, 'src', 'prerender', 'staticRoutes.json');

const checks = [];

function addCheck(name, passed, detail) {
  checks.push({ name, passed, detail });
}

// 1. Root index.html check
if (!fs.existsSync(distIndex)) {
  addCheck('dist/index.html exists', false, 'Build output not found');
} else {
  const html = fs.readFileSync(distIndex, 'utf8');
  const requiredSnippets = [
    'AlphaBAG',
    'rel="canonical"',
    'robots',
    'application/ld+json',
    'Crypto Portfolio Tracker',
  ];

  for (const snippet of requiredSnippets) {
    const passed = html.includes(snippet);
    addCheck(`dist/index.html contains ${snippet}`, passed, passed ? 'found' : 'missing');
  }
}

// 2. Prerendered sub-routes check
if (fs.existsSync(staticRoutesPath)) {
  const routes = JSON.parse(fs.readFileSync(staticRoutesPath, 'utf8'));
  for (const r of routes) {
    if (r.path === '/') continue;
    const subPath = r.path.replace(/^\//, '');
    const outHtml = path.join(distDir, subPath, 'index.html');
    const exists = fs.existsSync(outHtml);
    addCheck(`prerendered route ${r.path} exists`, exists, exists ? 'found' : 'missing');

    if (exists) {
      const content = fs.readFileSync(outHtml, 'utf8');
      const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(content);
      const hasCanonical = /<link[^>]*rel=["']canonical["'][^>]*>/i.test(content);
      const hasRootContent = /<div id=["']root["']>([\s\S]+?)<\/div>/i.test(content);
      const hasJsonLd = content.includes('application/ld+json');

      addCheck(`route ${r.path} has title`, hasTitle, hasTitle ? 'found' : 'missing');
      addCheck(`route ${r.path} has canonical`, hasCanonical, hasCanonical ? 'found' : 'missing');
      addCheck(`route ${r.path} has rendered DOM body`, hasRootContent, hasRootContent ? 'found' : 'empty');
      addCheck(`route ${r.path} has JSON-LD`, hasJsonLd, hasJsonLd ? 'found' : 'missing');
    }
  }
}

// 3. Static public crawler files
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

console.log(`\nAll ${checks.length} crawlability verification checks passed successfully!`);
