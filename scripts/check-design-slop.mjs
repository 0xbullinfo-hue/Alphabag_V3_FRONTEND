/**
 * Institutional Design Slop Checker
 * Ratchet script to catch AI-generated styling slop and banned patterns:
 * - backdrop-blur
 * - font-black
 * - sub-11px text sizes (text-[7px], text-[8px], text-[9px], text-[10px])
 * - cartoonish hype emojis (🚀, 🔥, 💎, 🐂, 🐻, etc.)
 * - neon glow box-shadows (shadow-[0_0_...)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SLOP_PATTERNS = [
  { name: 'backdrop-blur abuse', regex: /backdrop-blur-(?:sm|md|lg|xl|2xl|3xl)/g },
  { name: 'font-black (max font-semibold/bold allowed)', regex: /\bfont-black\b/g },
  { name: 'sub-11px micro-text', regex: /\btext-\[(?:[6-9]|10)px\]/g },
  { name: 'cartoon hype emojis', regex: /[🚀🔥💎🐂🐻🎉✨]/gu },
  { name: 'neon glow shadow', regex: /shadow-\[0_0_\d+px/g },
];

let totalViolations = 0;
const violationsByFile = new Map();

function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (f === 'node_modules' || f === 'dist' || f === '.git') continue;
      walk(p);
      continue;
    }
    if (!/\.(tsx|jsx|ts|js|css|html)$/.test(f)) continue;

    const content = readFileSync(p, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of SLOP_PATTERNS) {
        const matches = line.match(pattern.regex);
        if (matches) {
          totalViolations += matches.length;
          if (!violationsByFile.has(p)) violationsByFile.set(p, []);
          violationsByFile.get(p).push({
            line: i + 1,
            name: pattern.name,
            matched: matches[0],
            snippet: line.trim().slice(0, 80),
          });
        }
      }
    }
  }
}

const target = process.argv[2] || 'src';
if (statSync(target).isDirectory()) {
  walk(target);
} else {
  // single file
  const content = readFileSync(target, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of SLOP_PATTERNS) {
      const matches = line.match(pattern.regex);
      if (matches) {
        totalViolations += matches.length;
        if (!violationsByFile.has(target)) violationsByFile.set(target, []);
        violationsByFile.get(target).push({
          line: i + 1,
          name: pattern.name,
          matched: matches[0],
          snippet: line.trim().slice(0, 80),
        });
      }
    }
  }
}

if (totalViolations > 0) {
  console.log(`\n⚠️ Found ${totalViolations} design slop pattern(s) across ${violationsByFile.size} file(s) in ${target}:\n`);
  for (const [file, issues] of violationsByFile.entries()) {
    console.log(`  📄 ${file} (${issues.length} hits):`);
    for (const issue of issues.slice(0, 5)) {
      console.log(`     L${issue.line}: [${issue.name}] "${issue.matched}" -> ${issue.snippet}`);
    }
    if (issues.length > 5) {
      console.log(`     ... and ${issues.length - 5} more in this file`);
    }
  }
  console.log(`\nTotal violations: ${totalViolations}`);
  if (process.argv.includes('--strict')) {
    process.exit(1);
  }
} else {
  console.log(`\n Institutional Design Check Passed: 0 slop patterns found in ${target}.\n`);
}
