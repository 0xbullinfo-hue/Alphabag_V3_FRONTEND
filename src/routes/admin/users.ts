import { Router } from 'express';
import { audit } from '../../middleware/audit';

export const usersRouter = Router();

usersRouter.patch('/:id/role', audit('user.role.change', 'user')(async (req: any, res: any) => {
  // ... existing handler body ...
  res.json({ ok: true });
}));

usersRouter.patch('/:id/token-gate', audit('user.tokenGate.change', 'user')(async (req: any, res: any) => {
  // ... existing handler body ...
  res.json({ ok: true });
}));
