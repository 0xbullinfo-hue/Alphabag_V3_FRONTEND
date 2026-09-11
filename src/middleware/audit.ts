import { prisma } from '../db';
import { redact } from './redact';

/**
 * Wrap any mutating admin route. Records who changed what, before/after,
 * from where. Non-optional for token-gating, user roles, and airdrops.
 */
export function audit(action: string, targetType?: string) {
  return (handler: (req: any, res: any) => Promise<any>) =>
    async (req: any, res: any) => {
      const before = targetType && req.params?.id
        ? await prisma[targetType as 'user'].findUnique({ where: { id: req.params.id } }).catch(() => null)
        : null;

      const result = await handler(req, res);

      await prisma.adminAuditLog.create({
        data: {
          actorId: req.user.id,
          action,
          targetType: targetType ?? null,
          targetId: req.params?.id ?? req.body?.id ?? null,
          before: before ? (redact(before) as never) : undefined,
          after: redact(req.body) as never,
          ip: req.ip,
          userAgent: req.get('user-agent') ?? null,
        },
      }).catch(() => { /* audit failures must not break the request, but should alert */ });

      return result;
    };
}