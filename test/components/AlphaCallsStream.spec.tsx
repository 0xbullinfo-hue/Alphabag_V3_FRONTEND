import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlphaCalls } from '../../src/pages/frontend/AlphaCalls';

const apiGet = vi.fn();
const fetchMock = vi.fn();

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-session-token' }),
}));

vi.mock('../../src/services/api', () => ({
  api: { get: (...args: unknown[]) => apiGet(...args) },
  resolveApiUrl: (path: string) => path,
}));

vi.mock('../../src/components/ui/PageIcon', () => ({
  PageIcon: () => <span aria-hidden="true" />,
}));

describe('AlphaCalls live stream fault tolerance', () => {
  beforeEach(() => {
    apiGet.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    apiGet.mockResolvedValue({
      data: [{
        id: 'signal-rest',
        pair: 'ETH/USDT',
        type: 'LONG',
        category: 'LONGTERM',
        entry: '2000',
        targets: ['2200'],
        stopLoss: '1900',
        status: 'ACTIVE',
      }],
    });
    fetchMock.mockRejectedValue(new Error('stream unavailable'));
  });

  it('falls back to the REST signal snapshot when SSE connection fails', async () => {
    render(<AlphaCalls />);

    expect(await screen.findByText('ETH/USDT')).toBeInTheDocument();
    await waitFor(() => expect(apiGet).toHaveBeenCalledWith('/api/signals'));
    expect(fetchMock).toHaveBeenCalledWith('/api/signals/stream', expect.objectContaining({
      headers: { Authorization: 'Bearer test-session-token' },
      signal: expect.any(AbortSignal),
    }));
  });
});