import { describe, it, expect, beforeAll } from 'vitest';

describe('CEX credential encryption round-trip', () => {
  let seal: any;
  let open: any;

  beforeAll(async () => {
    // 32-byte key in base64
    process.env.CEX_KEK_B64 = Buffer.alloc(32, 'a').toString('base64');
    const mod = await import('../../src/cex/crypto');
    seal = mod.seal;
    open = mod.open;
  });

  it('seals and opens credentials accurately', () => {
    const original = {
      apiKey: 'test-api-key-12345',
      secret: 'test-secret-67890',
      passphrase: 'optional-passphrase',
    };

    const sealed = seal(original.apiKey, original.secret, original.passphrase);

    expect(sealed.v).toBe(1);
    expect(sealed.fingerprint).toBeDefined();
    expect(sealed.ct).toBeDefined();
    expect(sealed.ct).not.toContain(original.secret);

    const decrypted = open(sealed);
    expect(decrypted).toEqual(original);
  });
});
