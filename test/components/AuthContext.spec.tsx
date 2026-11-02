import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined }),
  useBalance: () => ({}),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

vi.mock('../../src/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { headers: { common: {} } },
  },
}));

const AuthProbe = () => {
  const { user, isLoading } = useAuth();
  return (
    <>
      <span>{user?.email || 'signed out'}</span>
      <span>{isLoading ? 'loading' : 'ready'}</span>
    </>
  );
};

const renderAuthProvider = () => render(
  <AuthProvider>
    <AuthProbe />
  </AuthProvider>
);

describe('Local development authentication preview', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.mocked(api.get).mockRejectedValue(new Error('Backend unavailable'));
  });

  it('uses the Free preview account without requesting backend authentication', async () => {
    renderAuthProvider();

    expect(await screen.findByText('trader@alphabag.app')).toBeInTheDocument();
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('keeps an explicitly signed-out local session signed out', async () => {
    sessionStorage.setItem('alphabag_dev_logged_out', 'true');
    renderAuthProvider();

    expect(await screen.findByText('signed out')).toBeInTheDocument();
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('continues validating an existing saved token with the backend', async () => {
    sessionStorage.setItem('alphabag_token', 'saved-session-token');
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { id: 'server-user', email: 'server@example.com', tier: 'ALPHA' },
    });
    renderAuthProvider();

    expect(await screen.findByText('server@example.com')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/api/auth/me');
  });
});
