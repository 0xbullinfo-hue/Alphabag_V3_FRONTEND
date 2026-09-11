import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ✅ Opaque, server-minted stream id bound to the authenticated session.
// The wallet address never appears in a URL, log, or referrer.
const streamIds = new Map<string, { userId: string; expiresAt: number }>();

router.post('/portfolio/stream', requireAuth, (req: any, res: any) => {
  const id = randomUUID();
  streamIds.set(id, { userId: req.user.id, expiresAt: Date.now() + 60_000 });
  res.json({ streamId: id, url: `/portfolio/stream/${id}` });
});

router.get('/portfolio/stream/:id', requireAuth, (req: any, res: any) => {
  const entry = streamIds.get(req.params.id);
  if (!entry || entry.userId !== req.user.id || entry.expiresAt < Date.now()) {
    return res.status(403).end();
  }
  streamIds.delete(req.params.id);   // single use

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  // ... existing SSE logic ...
});

// Reap expired ids so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of streamIds) if (v.expiresAt < now) streamIds.delete(k);
}, 30_000).unref();

export default router;
