import { api } from './api';
import { TOKEN_GATING_CONFIG } from './config';

export const ALPHA_DESK_ACTIVE_USER_LIMIT = 1000;
export const ALPHA_DESK_REQUIRED_BAG_BALANCE = TOKEN_GATING_CONFIG.ALPHA_MINIMUM_BAG_BALANCE;

export type AlphaDeskAccessStatus = 'GRANTED' | 'TOKEN_REQUIRED' | 'CAPACITY_REACHED';

export interface AlphaDeskAccess {
  status: AlphaDeskAccessStatus;
  activeUsers: number;
  maxUsers: number;
  minimumBagBalance: number;
}

export const requestAlphaDeskAccess = async (): Promise<AlphaDeskAccess> => {
  const response = await api.post('/api/alpha-desk/access', {});
  const payload = response.data as unknown;
  if (!payload || typeof payload !== 'object') {
    throw new Error('The Alpha Desk access service returned an invalid response.');
  }
  const access = payload as Record<string, unknown>;
  const status = access.status;
  const activeUsers = access.activeUsers;
  const maxUsers = access.maxUsers;
  const minimumBagBalance = access.minimumBagBalance;

  if (
    (status !== 'GRANTED' && status !== 'TOKEN_REQUIRED' && status !== 'CAPACITY_REACHED') ||
    typeof activeUsers !== 'number' ||
    !Number.isInteger(activeUsers) ||
    activeUsers < 0 ||
    maxUsers !== ALPHA_DESK_ACTIVE_USER_LIMIT ||
    minimumBagBalance !== ALPHA_DESK_REQUIRED_BAG_BALANCE ||
    (status === 'GRANTED' && activeUsers > ALPHA_DESK_ACTIVE_USER_LIMIT) ||
    (status === 'CAPACITY_REACHED' && activeUsers < ALPHA_DESK_ACTIVE_USER_LIMIT)
  ) {
    throw new Error('The Alpha Desk access service returned an invalid response.');
  }

  return {
    status,
    activeUsers,
    maxUsers: ALPHA_DESK_ACTIVE_USER_LIMIT,
    minimumBagBalance: ALPHA_DESK_REQUIRED_BAG_BALANCE,
  };
};
