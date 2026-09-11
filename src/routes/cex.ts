import { Router } from 'express';
import { prisma } from '../db';
import { seal, open } from '../cex/crypto';
import { EXCHANGES, assertSafe } from '../cex/exchanges';
import { requireAuth } from '../middleware/auth';
import { probeExchange } from '../cex/probe';

export const cexRouter = Router();

/** Wizard metadata — the UI renders entirely from this. */
cexRouter.get('/exchanges', (_req, res) => {
  res.json(Object.values(EXCHANGES).map(({ id, name, logo, fields, keyUrl, docsUrl, requiresIpWhitelist, ipWhitelistNote }) => ({
    id, name, logo, fields, keyUrl, docsUrl, requiresIpWhitelist, ipWhitelistNote,
  })));
});

/** TEST-AND-PREVIEW: validate, detect scopes, return 3 sample balances. Never persists. */
cexRouter.post('/test', requireAuth, async (req, res) => {
  const { exchangeId, apiKey, secret, passphrase } = req.body ?? {};
  const meta = EXCHANGES[exchangeId];
  if (!meta) return res.status(400).json({ error: 'UNKNOWN_EXCHANGE' });

  try {
    const probe = await probeExchange(meta, { apiKey, secret, passphrase });
    assertSafe(probe.permissions, meta);
    return res.json({
      ok: true,
      permissions: probe.permissions,
      sample: probe.sampleBalances.slice(0, 3),
      totalAccounts: probe.sampleBalances.length,
      latencyMs: probe.latencyMs,
    });
  } catch (err: any) {
    // Map exchange errors to actionable, user-facing messages.
    const map: Record<string, { status: number; code: string; message: string; hint?: string }> = {
      INVALID_KEY:      { status: 401, code: 'INVALID_KEY', message: 'Key or secret is incorrect.' },
      REGION_MISMATCH:  { status: 400, code: 'REGION_MISMATCH', message: 'This key is for a different region.', hint: 'Try the .US or global endpoint.' },
      PASSPHRASE_REQUIRED: { status: 400, code: 'PASSPHRASE_REQUIRED', message: 'This exchange requires a passphrase.' },
      IP_NOT_WHITELISTED: { status: 403, code: 'IP_NOT_WHITELISTED', message: 'This key is IP-restricted.', hint: 'Add our egress IP to the exchange whitelist.' },
      RATE_LIMITED:     { status: 429, code: 'RATE_LIMITED', message: 'Exchange rate limit hit. Try again in a minute.' },
    };
    const m = map[err?.code] ?? { status: 400, code: err?.code ?? 'CONNECT_FAILED', message: 'Could not connect.' };
    return res.status(m.status).json(m);
  }
});

/** Persist only after a successful /test. */
cexRouter.post('/connections', requireAuth, async (req, res) => {
  const { exchangeId, apiKey, secret, passphrase } = req.body ?? {};
  const meta = EXCHANGES[exchangeId];
  if (!meta) return res.status(400).json({ error: 'UNKNOWN_EXCHANGE' });

  const probe = await probeExchange(meta, { apiKey, secret, passphrase });
  assertSafe(probe.permissions, meta);

  const sealed = seal(apiKey, secret, passphrase);
  const dup = await prisma.cexConnection.findFirst({
    where: { userId: req.user.id, fingerprint: sealed.fingerprint },
  });
  if (dup) return res.status(409).json({ error: 'DUPLICATE_KEY' });

  const conn = await prisma.cexConnection.create({
    data: {
      userId: req.user.id,
      exchangeId,
      label: req.body.label ?? meta.name,
      credential: sealed as never,
      fingerprint: sealed.fingerprint,
      scopes: probe.permissions.scopes,
      lastOkAt: new Date(),
      health: 'ok',
    },
  });
  // NEVER return the credential blob.
  res.status(201).json({ id: conn.id, exchangeId, label: conn.label, scopes: conn.scopes, health: conn.health });
});

/** Health card data for the UI. */
cexRouter.get('/connections', requireAuth, async (req, res) => {
  const rows = await prisma.cexConnection.findMany({ where: { userId: req.user.id } });
  res.json(rows.map(r => ({
    id: r.id, exchangeId: r.exchangeId, label: r.label,
    scopes: r.scopes, health: r.health,
    lastOkAt: r.lastOkAt, lastErrorAt: r.lastErrorAt, lastError: r.lastError,
    keyHint: r.fingerprint.slice(-4),
  })));
});

cexRouter.delete('/connections/:id', requireAuth, async (req, res) => {
  await prisma.cexConnection.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  res.status(204).end();
});
