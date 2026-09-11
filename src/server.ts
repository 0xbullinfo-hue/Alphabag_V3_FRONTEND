import express from 'express';
import Redis from 'ioredis';
import { initCache } from './cache/tieredCache';
import { redactResponses } from './cex/redact';

const app = express();

app.use(redactResponses());   // mount BEFORE any logger
app.use(express.json({ limit: '100kb' }));  // cap body — large bodies are a DoS vector

// --- shared cache bootstrap ---------------------------------------------
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3 })
  : null;
initCache(redis);

// --- error mapping for staleness ----------------------------------------
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err?.code === 'DATA_TOO_STALE') {
    return res.status(503).json({
      error: 'DATA_TOO_STALE',
      message: 'Live data unavailable; refusing to serve stale figures.',
      ageMs: err.ageMs,
    });
  }
  return res.status(500).json({ error: 'INTERNAL' });
});

export default app;
