/**
 * MUST be mounted before body logging. A single console.log(req.body)
 * leaks every user's exchange keys.
 */
const SENSITIVE = new Set([
  'secret', 'secretkey', 'apiSecret', 'apiKey', 'apikey', 'key',
  'passphrase', 'password', 'token', 'signature', 'privateKey',
  'mnemonic', 'seed', 'authorization',
]);

export function redact<T>(input: T, depth = 0): T {
  if (depth > 8 || input == null) return input;
  if (Array.isArray(input)) return input.map(v => redact(v, depth + 1)) as unknown as T;
  if (typeof input !== 'object') return input;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const lk = k.toLowerCase().replace(/[_-]/g, '');
    if (SENSITIVE.has(lk) || SENSITIVE.has(k)) {
      out[k] = typeof v === 'string' && v.length > 4 ? `••••${v.slice(-4)}` : '••••';
    } else {
      out[k] = redact(v, depth + 1);
    }
  }
  return out as T;
}

/** Express middleware: replaces res.json with a redacting version. */
export function redactResponses() {
  return (_req: unknown, res: any, next: () => void) => {
    const orig = res.json.bind(res);
    res.json = (body: unknown) => orig(redact(body));
    next();
  };
}
