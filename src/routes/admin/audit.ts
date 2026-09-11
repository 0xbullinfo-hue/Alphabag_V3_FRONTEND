import { Router } from 'express';
import { prisma } from '../../db';
import { requireAdmin } from '../../middleware/auth';

export const auditRouter = Router();

auditRouter.get('/', requireAdmin, async (req, res) => {
  const { actorId, targetType, targetId, from, to, cursor } = req.query as Record<string, string>;
  const rows = await prisma.adminAuditLog.findMany({
    where: {
      ...(actorId && { actorId }),
      ...(targetType && { targetType }),
      ...(targetId && { targetId }),
      ...((from || to) && { createdAt: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } }),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  res.json(rows);
});