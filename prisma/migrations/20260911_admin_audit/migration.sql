CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id"         TEXT PRIMARY KEY,
  "actorId"    TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "targetType" TEXT,
  "targetId"   TEXT,
  "before"     JSONB,
  "after"      JSONB,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog" ("actorId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog" ("targetType", "targetId");