import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'node:crypto';

/**
 * Envelope encryption:
 *   KEK (env, 32 bytes b64)  wraps  DEK (per record, 32 bytes)
 *   DEK encrypts the credential blob with AES-256-GCM.
 * Stored: { v, dekWrapped, iv, tag, ciphertext }
 * Rotating the KEK requires re-wrapping DEKs only — cheap.
 */
const KEK = Buffer.from(process.env.CEX_KEK_B64 ?? '', 'base64');
if (KEK.length !== 32) throw new Error('CEX_KEK_B64 must decode to 32 bytes');

function wrap(kek: Buffer, dek: Buffer) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', kek, iv);
  const ct = Buffer.concat([c.update(dek), c.final()]);
  return { iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), ct: ct.toString('base64') };
}
function unwrap(kek: Buffer, w: { iv: string; tag: string; ct: string }) {
  const d = createDecipheriv('aes-256-gcm', kek, Buffer.from(w.iv, 'base64'));
  d.setAuthTag(Buffer.from(w.tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(w.ct, 'base64')), d.final()]);
}

export interface SealedCredential {
  v: 1;
  dekWrapped: { iv: string; tag: string; ct: string };
  iv: string; tag: string; ct: string;
  fingerprint: string;   // HMAC-SHA256(KEK, apiKey+secret) — duplicate detection
}

export function seal(apiKey: string, secret: string, passphrase?: string): SealedCredential {
  const dek = randomBytes(32);
  const plain = Buffer.from(JSON.stringify({ apiKey, secret, passphrase }), 'utf8');
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', dek, iv);
  const ct = Buffer.concat([c.update(plain), c.final()]);
  return {
    v: 1,
    dekWrapped: wrap(KEK, dek),
    iv: iv.toString('base64'),
    tag: c.getAuthTag().toString('base64'),
    ct: ct.toString('base64'),
    fingerprint: createHmac('sha256', KEK).update(`${apiKey}:${secret}`).digest('hex').slice(0, 32),
  };
}

export function open(s: SealedCredential): { apiKey: string; secret: string; passphrase?: string } {
  const dek = unwrap(KEK, s.dekWrapped);
  const d = createDecipheriv('aes-256-gcm', dek, Buffer.from(s.iv, 'base64'));
  d.setAuthTag(Buffer.from(s.tag, 'base64'));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(s.ct, 'base64')), d.final()]).toString('utf8'));
}
