// SPDX-License-Identifier: MIT
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import { Sidebar } from '../../src/components/frontend/Sidebar';
import { Airdrop } from '../../src/pages/frontend/Airdrop';

// Mock useFeatures
vi.mock('../../src/hooks/useFeatures', () => ({
  useFeatures: vi.fn().mockReturnValue({
    data: { disabledPages: [] },
    isLoading: false,
  }),
}));

vi.mock('../../src/services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: { stats: {}, tasks: [] } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: true, address: '0x1234567890123456789012345678901234567890' }),
  useBalance: () => ({ data: { formatted: '1000' } }),
  useNetwork: () => ({ chain: { id: 56 } }),
  useSwitchNetwork: () => ({ switchNetwork: vi.fn() }),
}));

vi.mock('@web3modal/wagmi/react', () => ({
  useWeb3Modal: () => ({ open: vi.fn() }),
}));

// Auth mock state holder
let mockAuthState = {
  user: null as any,
  isAuthenticated: false,
  logout: vi.fn(),
};

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

describe('Alpha Desk navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    };
  });

  it('renders Alpha Desk without a legacy tier badge', () => {
    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    const deskLink = screen.getByRole('link', { name: /Alpha Desk/i });
    expect(deskLink).toBeInTheDocument();
    expect(deskLink).not.toHaveTextContent(/PRO|VIP|Premium/i);
  });

  it('leaves entitlement decisions to the Alpha Desk access service', () => {
    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </BrowserRouter>
    );

    const deskLink = screen.getByRole('link', { name: /Alpha Desk/i });
    fireEvent.click(deskLink);

    expect(deskLink.getAttribute('href')).toBe('/alpha-desk');
  });

  it('renders single consolidated Utility card with all AlphaBAG utilities and removes TGE Distribution in Airdrop', () => {
    render(
      <HelmetProvider>
        <BrowserRouter>
          <Airdrop />
        </BrowserRouter>
      </HelmetProvider>
    );

    // Verify TGE Distribution is removed
    expect(screen.queryByText(/TGE Distribution/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Proportional to future utility reward conversion/i)).not.toBeInTheDocument();

    // Verify single Utility card is present with all utilities
    expect(screen.getByText('Utility')).toBeInTheDocument();
    expect(screen.getByText(/Portfolio Tracking · T2E · Degen Calculator · AI Analyst · Whale Tracking · AlphaCalls · AlphaScreener/i)).toBeInTheDocument();
  });
});
