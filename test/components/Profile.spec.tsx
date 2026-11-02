import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Profile } from '../../src/pages/frontend/Profile';
import { AlphaRadarService } from '../../src/services/alphaRadarService';
import { api } from '../../src/services/api';
import { User } from '../../src/types';
import { useAuth } from '../../src/context/AuthContext';
import { useWallet } from '../../src/context/WalletContext';

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../src/context/WalletContext', () => ({
  useWallet: vi.fn(),
}));

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn().mockResolvedValue({}) },
}));

const createUser = (tier: User['tier']): User => ({
  id: 'profile-test-user',
  email: 'trader@example.com',
  tier,
  verifiedWallet: '0x1234567890123456789012345678901234567890',
  walletAddress: '0x1234567890123456789012345678901234567890',
  alphaAiUsageSeconds: 0,
  lastAlphaAiReset: '2026-01-01T00:00:00.000Z',
  isAdmin: false,
  onboardingComplete: true,
  accountType: 'TRADER',
  bio: 'A real profile bio',
  website: 'example.com',
  location: 'Global',
});

const createAuthState = (user: User | null) => ({
  user,
  isAuthenticated: Boolean(user),
  isLoading: false,
  token: null,
  logout: vi.fn(),
  upgradeToAlpha: vi.fn().mockResolvedValue(false),
  updateAiUsage: vi.fn(),
  completeOnboarding: vi.fn().mockResolvedValue(undefined),
  siweLogin: vi.fn().mockResolvedValue(false),
  emailLogin: vi.fn().mockResolvedValue(false),
  refreshUser: vi.fn().mockResolvedValue(undefined),
});

const renderProfile = () => render(
  <MemoryRouter initialEntries={['/profile']}>
    <Routes>
      <Route path="/profile" element={<Profile />} />
    </Routes>
  </MemoryRouter>
);

describe('Account Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AlphaRadarService, 'getProject').mockResolvedValue(null);
    vi.mocked(useAuth).mockReturnValue(createAuthState(createUser('FREE')));
    vi.mocked(useWallet).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      trackedWallets: [
        {
          id: 'tracked-wallet-1',
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          label: 'Research wallet',
          chain: 'BSC',
          type: 'PORTFOLIO',
        },
      ],
    } as ReturnType<typeof useWallet>);
  });

  it('shows the signed-in user’s real Free membership and Alpha requirements', async () => {
    renderProfile();

    expect(await screen.findByRole('heading', { name: 'Membership' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Free tier features' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Alpha tier features' })).toBeInTheDocument();
    expect(screen.getByText('Your current tier')).toBeInTheDocument();
    expect(screen.getByText(/up to 100 wallets/i)).toBeInTheDocument();
    expect(screen.getByText(/unlimited AlphaAI access/i)).toBeInTheDocument();
    expect(screen.getByText(/not a paid subscription/i)).toBeInTheDocument();
    expect(screen.getByText(/3,000 BAG in the same wallet used to sign in/i)).toBeInTheDocument();
    expect(screen.getAllByText('0x1234567890123456789012345678901234567890')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Connected details' })).toBeInTheDocument();
    expect(screen.getByText('Research wallet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Manage connections/i })).toBeInTheDocument();
    expect(screen.queryByText('98%')).not.toBeInTheDocument();
    expect(screen.queryByText('4.2K')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('opens the existing server-verified Alpha flow from the profile', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    renderProfile();

    fireEvent.click(await screen.findByRole('button', { name: 'Verify Alpha eligibility' }));

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'open-upgrade-modal' }));
  });

  it('shows Alpha status and links eligible members to Alpha Desk', async () => {
    vi.mocked(useAuth).mockReturnValue(createAuthState(createUser('ALPHA')));
    renderProfile();

    expect(await screen.findByText('Your account has Alpha membership.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Alpha Desk/i })).toBeInTheDocument();
    expect(screen.getByText(/separate limit of 1,000 eligible users/i)).toBeInTheDocument();
  });

  it('lets the localhost demo profile preview edits without calling the backend', async () => {
    const previewUser = { ...createUser('FREE'), id: 'dev-user-001' };
    const postSpy = vi.spyOn(api, 'post');
    vi.mocked(useAuth).mockReturnValue(createAuthState(previewUser));
    renderProfile();

    expect(await screen.findByRole('status')).toHaveTextContent(/Local preview/i);
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText(/Tell the community about your alpha discovery strategy/i), {
      target: { value: 'Preview-only profile copy' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Preview-only profile copy')).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('shows a real load error instead of fabricated profile details', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network unavailable'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <MemoryRouter initialEntries={['/profile/unknown-profile']}>
        <Routes>
          <Route path="/profile/:id" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Could not load this profile. Please try again later.')).toBeInTheDocument();
    expect(screen.queryByText(/explorer@alphabag\.com/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect wallet' })).not.toBeInTheDocument();
  });

  it('saves profile edits and refreshes the account session', async () => {
    const user = createUser('FREE');
    const authState = createAuthState(user);
    vi.mocked(useAuth).mockReturnValue(authState);
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { success: true, user: { ...user, bio: 'Updated profile bio' } },
    });
    renderProfile();

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText(/Tell the community about your alpha discovery strategy/i), {
      target: { value: 'Updated profile bio' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/update-profile', expect.objectContaining({
        bio: 'Updated profile bio',
      }));
      expect(authState.refreshUser).toHaveBeenCalled();
    });
    expect(await screen.findByText('Updated profile bio')).toBeInTheDocument();
  });
});
