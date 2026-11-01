import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosResponse } from 'axios';
import { api } from '../../src/services/api';
import {
  ALPHA_DESK_ACTIVE_USER_LIMIT,
  ALPHA_DESK_REQUIRED_BAG_BALANCE,
  isAlphaDeskLocalPreviewEnabled,
  requestAlphaDeskAccess,
} from '../../src/services/alphaDeskAccess';

vi.mock('../../src/services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('Alpha Desk access service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows the preview flag only in development mode', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_ALPHA_DESK_LOCAL_PREVIEW', 'true');
    expect(isAlphaDeskLocalPreviewEnabled()).toBe(true);

    vi.stubEnv('VITE_ALPHA_DESK_LOCAL_PREVIEW', '');
    expect(isAlphaDeskLocalPreviewEnabled()).toBe(false);

    vi.stubEnv('VITE_ALPHA_DESK_LOCAL_PREVIEW', 'true');
    vi.stubEnv('DEV', false);
    expect(isAlphaDeskLocalPreviewEnabled()).toBe(false);
  });

  it('requests a server-side decision and accepts an eligible grant', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        status: 'GRANTED',
        activeUsers: ALPHA_DESK_ACTIVE_USER_LIMIT,
        maxUsers: ALPHA_DESK_ACTIVE_USER_LIMIT,
        minimumBagBalance: ALPHA_DESK_REQUIRED_BAG_BALANCE,
      },
    } as AxiosResponse);

    await expect(requestAlphaDeskAccess()).resolves.toEqual({
      status: 'GRANTED',
      activeUsers: ALPHA_DESK_ACTIVE_USER_LIMIT,
      maxUsers: ALPHA_DESK_ACTIVE_USER_LIMIT,
      minimumBagBalance: ALPHA_DESK_REQUIRED_BAG_BALANCE,
    });
    expect(api.post).toHaveBeenCalledWith('/api/alpha-desk/access', {});
  });

  it.each([
    ['TOKEN_REQUIRED', 15],
    ['CAPACITY_REACHED', ALPHA_DESK_ACTIVE_USER_LIMIT],
  ] as const)('accepts a %s denial response', async (status, activeUsers) => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        status,
        activeUsers,
        maxUsers: ALPHA_DESK_ACTIVE_USER_LIMIT,
        minimumBagBalance: ALPHA_DESK_REQUIRED_BAG_BALANCE,
      },
    } as AxiosResponse);

    await expect(requestAlphaDeskAccess()).resolves.toMatchObject({ status, activeUsers });
  });

  it.each([
    { status: 'UNKNOWN', activeUsers: 0 },
    { status: 'GRANTED', activeUsers: -1 },
    { status: 'GRANTED', activeUsers: ALPHA_DESK_ACTIVE_USER_LIMIT + 1 },
    { status: 'CAPACITY_REACHED', activeUsers: ALPHA_DESK_ACTIVE_USER_LIMIT - 1 },
    { status: 'GRANTED', activeUsers: 1, maxUsers: ALPHA_DESK_ACTIVE_USER_LIMIT - 1 },
    { status: 'GRANTED', activeUsers: 1, minimumBagBalance: 1 },
    null,
  ])('rejects malformed or inconsistent access responses', async (data) => {
    vi.mocked(api.post).mockResolvedValue({ data } as AxiosResponse);

    await expect(requestAlphaDeskAccess()).rejects.toThrow('invalid response');
  });
});
