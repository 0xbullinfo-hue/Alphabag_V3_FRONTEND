ALTER TABLE "CexConnection"
  ADD COLUMN IF NOT EXISTS "credential"   JSONB,
  ADD COLUMN IF NOT EXISTS "fingerprint"  TEXT,
  ADD COLUMN IF NOT EXISTS "scopes"       TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "health"       TEXT   NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS "lastOkAt"     TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "lastErrorAt"  TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "lastError"    TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "CexConnection_userId_fingerprint_key"
  ON "CexConnection" ("userId", "fingerprint");

-- If a plaintext apiKey/secret column exists, DROP it after backfill:
-- ALTER TABLE "CexConnection" DROP COLUMN "apiKey", DROP COLUMN "secret";
