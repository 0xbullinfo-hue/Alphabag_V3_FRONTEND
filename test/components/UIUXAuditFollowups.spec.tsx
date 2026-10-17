// SPDX-License-Identifier: MIT
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { News } from '../../src/pages/frontend/News';
import { WhaleDetail } from '../../src/pages/frontend/WhaleDetail';
import { Settings } from '../../src/pages/frontend/Settings';
import { api } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'test-user', address: '0x1234567890123456789012345678901234567890', isFounder: true },
    isAuthenticated: true,
  }),
}));

vi.mock('../../src/context/WalletContext', () => ({
  useWallet: vi.fn().mockReturnValue({
    trackedWallets: [
      { id: '1', address: '0x1111111111111111111111111111111111111111', label: 'Known Whale', chain: 'ETH', type: 'WHALE' },
    ],
    getLimits: vi.fn().mockReturnValue({ maxPortfolios: 10, maxWhales: 10 }),
    whaleAlerts: [],
    toggleWhaleAlert: vi.fn(),
    addTrackedWallet: vi.fn().mockResolvedValue({ success: true }),
    premiumTokenBalance: 1000,
    portfolioCount: 1,
    whaleCount: 1,
    isFounder: true,
  }),
}));

vi.mock('../../src/hooks/useCexConnections', () => ({
  useCexConnections: vi.fn().mockReturnValue({
    connections: [],
    connectExchange: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

vi.mock('../../src/context/WhaleContext', () => ({
  useWhales: vi.fn().mockReturnValue({
    whales: [
      { id: '1', address: '0x1111111111111111111111111111111111111111', label: 'Known Whale', chain: 'ETH' },
    ],
    toggleWhaleAlert: vi.fn(),
    trackedWhales: [],
    limits: { maxPortfolios: 10, maxWhales: 10 },
  }),
}));

describe('UI/UX Audit Follow-Up Verifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('News Component - Error, Retry, and Save States', () => {
    it('renders error state and retry button when news fetch fails', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      render(
        <MemoryRouter>
          <News />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/News feed unavailable/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
      });

      // When clicking Try again, it initiates a new fetch and recovers
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [
          {
            id: '1',
            title: 'Bitcoin Hits All-Time High Volume',
            source: 'CoinDesk',
            url: 'https://example.com/btc',
            published_on: Date.now() / 1000,
            body: 'Record breaking volume seen on centralized exchanges.',
          },
        ],
      });

      fireEvent.click(screen.getByRole('button', { name: /Try again/i }));

      await waitFor(() => {
        expect(screen.getByText('Bitcoin Hits All-Time High Volume')).toBeInTheDocument();
      });
    });

    it('opens article dialog and toggles article save state persisted in local storage', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [
          {
            id: 'art-42',
            title: 'Solana Breakpoint Summary',
            source: 'Decrypt',
            url: 'https://example.com/sol',
            published_on: Date.now() / 1000,
            body: 'Solana announces major developer upgrades.',
          },
        ],
      });

      render(
        <MemoryRouter>
          <News />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Solana Breakpoint Summary')).toBeInTheDocument();
      });

      // Click to open report dialog
      const readBtn = screen.getByRole('button', { name: /READ REPORT/i });
      fireEvent.click(readBtn);

      // Save button inside dialog
      const saveBtn = screen.getByRole('button', { name: /^Save$/i });
      fireEvent.click(saveBtn);

      const saved = JSON.parse(localStorage.getItem('alphabag.savedNews.v1') || '[]');
      expect(saved).toContain('art-42');
    });
  });

  describe('WhaleDetail Component - Unknown Route Handling', () => {
    it('renders not-found state with back link when navigating to untracked wallet', async () => {
      render(
        <MemoryRouter initialEntries={['/whale/0x9999999999999999999999999999999999999999']}>
          <Routes>
            <Route path="/whale/:address" element={<WhaleDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Whale wallet not found/i)).toBeInTheDocument();
        expect(screen.getByText(/This wallet is not in your tracked whale list/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Back to tracked whales/i })).toBeInTheDocument();
      });
    });
  });

  describe('Settings Component - CEX Modal and Form Validation', () => {
    it('disables Add Connection button while required address or label are blank', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { connections: [] } });

      render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      );

      const addBtn = screen.getByRole('button', { name: /Add Connection/i });
      expect(addBtn).toBeDisabled();

      const addrInput = screen.getByLabelText(/Wallet address/i);
      const labelInput = screen.getByLabelText(/Wallet label/i);

      fireEvent.change(addrInput, { target: { value: '0x123' } });
      expect(addBtn).toBeDisabled();

      fireEvent.change(labelInput, { target: { value: 'My Wallet' } });
      expect(addBtn).not.toBeDisabled();
    });

    it('opens CEX connect modal when clicking an available exchange tile', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { connections: [] } });

      render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      );

      const binanceTile = screen.getByTitle(/Connect Binance/i);
      fireEvent.click(binanceTile);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Connect Binance/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Authorize Connection/i })).toBeInTheDocument();
      });
    });
  });
});
