/**
 * Post-generation validation. The LLM is allowed to NARRATE numbers from
 * FACTS, never to INVENT them. This module enforces that mechanically.
 */
import type { Fact } from './tools';

const NUM_RE = /-?\$?\d[\d,]*(?:\.\d+)?%?/g;

function normalize(n: string): string {
  return n.replace(/[$,%]/g, '').replace(/,/g, '');
}

/** Every number in the answer must exist (within tolerance) in the facts. */
export function findUnsupportedNumbers(answer: string, facts: Fact[]): string[] {
  const allowed = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === 'number') { allowed.add(String(v)); allowed.add(v.toFixed(2)); allowed.add(v.toFixed(4)); }
    else if (typeof v === 'string') { const n = normalize(v); if (!Number.isNaN(Number(n))) allowed.add(n); }
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  facts.forEach(f => walk(f.value));

  const found = answer.match(NUM_RE) ?? [];
  return found
    .map(normalize)
    .filter(n => n !== '' && !allowed.has(n))
    // tolerate small integers that are obviously ordinals/counts
    .filter(n => !(Number.isInteger(Number(n)) && Math.abs(Number(n)) <= 10));
}

const INJECTION = [
  /ignore (all )?(previous|prior|above) (instructions|prompts)/i,
  /reveal (your )?(system prompt|instructions)/i,
  /you are now/i,
  /disregard .* (rules|guidelines)/i,
  /\bsystem\s*:/i,
];

export function looksLikeInjection(text: string): boolean {
  return INJECTION.some(r => r.test(text));
}

/** Strip control tokens from chain-derived strings before prompt insertion. */
export function sanitizeOnchainText(s: string, max = 64): string {
  return s
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/<\|/g, '')
    .replace(/\|\|>/g, '')
    .replace(/###/g, '')
    .replace(/system\s*:/gi, 'system_')
    .slice(0, max);
}

export function stalenessNotice(facts: Fact[]): string | null {
  const stale = facts.filter(f => f.stale);
  if (!stale.length) return null;
  const worst = stale.reduce((a, b) => (a.ageMs > b.ageMs ? a : b));
  return `⚠️ Some data is ${Math.round(worst.ageMs / 1000)}s old (source: ${worst.source}). Figures may not reflect the current market.`;
}
