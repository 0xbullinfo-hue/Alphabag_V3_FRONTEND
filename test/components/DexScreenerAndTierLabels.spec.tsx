// SPDX-License-Identifier: MIT
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Settings } from '../../src/pages/frontend/Settings';
import { Markets } from '../../src/pages/frontend/Markets';
import { CoinDetail } from '../../src/pages/frontend/CoinDetail';
import { MarketService } from '../../src/services/MarketService';
import { dexscreenerService } from '../../src/services/dexscreener';

vi.mock('../../src/services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
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
    trackedWallets: [],
    getLimits: vi.fn().mockReturnValue({ maxPortfolios: 10, maxWhales: 10 }),
    whaleAlerts: [],
    toggleWhaleAlert: vi.fn(),
    addTrackedWallet: vi.fn().mockResolvedValue({ success: true }),
    premiumTokenBalance: 1000,
    portfolioCount: 0,
    whaleCount: 0,
    isFounder: true,
    isConnected: false,
    portfolioItems: [],
  }),
}));

vi.mock('../../src/hooks/useCexConnections', () => ({
  useCexConnections: vi.fn().mockReturnValue({
    connections: [],
    connectExchange: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

describe('DexScreener Feeds, Charts, and Membership Availability Labels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  describe('Settings Membership Actions - Recommendation 3 Verification', () => {
    it('renders informative availability labels and tooltips for disabled token and pass actions', () => {
      render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      );

      // Buy button
      const buyBtn = screen.getByRole('button', { name: /^Buy$/i });
      expect(buyBtn).toBeDisabled();
      expect(buyBtn).toHaveAttribute('title', expect.stringContaining('TGE'));
      expect(screen.getByText(/Available at TGE/i)).toBeInTheDocument();

      // Tier 2 Hold 10k BAG
      const tier2Btn = screen.getByRole('button', { name: /Hold 10k \$BAG/i });
      expect(tier2Btn).toBeDisabled();
      expect(screen.getByText(/Verified via on-chain snapshot post-TGE/i)).toBeInTheDocument();

      // Tier 3 Alpha Pass
      const tier3Btn = screen.getByRole('button', { name: /Get Alpha Pass/i });
      expect(tier3Btn).toBeDisabled();
      expect(screen.getByText(/Genesis Pass Phase 2 Mint Coming Soon/i)).toBeInTheDocument();
    });
  });

  describe('Markets Page - DexScreener Live Tab', () => {
    it('switches to DexScreener Live table when clicking DexScreener Live category pill', async () => {
      render(
        <MemoryRouter>
          <Markets />
        </MemoryRouter>
      );

      const dexPill = screen.getByRole('button', { name: /DexScreener Live/i });
      expect(dexPill).toBeInTheDocument();

      fireEvent.click(dexPill);

      await waitFor(() => {
        expect(screen.getByText(/Live On-Chain Liquidity & DEX Screener/i)).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /DEX & Chain/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /Liquidity Depth/i })).toBeInTheDocument();
      });
    });
  });

  describe('CoinDetail Page - DexScreener Live Chart and Liquidity', () => {
    it('renders DexScreener toggle and toggles between Sparkline and DexScreener live chart', async () => {
      vi.spyOn(MarketService, 'getMarketData').mockResolvedValueOnce([
        {
          id: 'solana',
          symbol: 'sol',
          name: 'Solana',
          current_price: 155.8,
          price_change_percentage_24h: 2.5,
          market_cap: 72000000000,
          total_volume: 4000000000,
          sparkline_in_7d: { price: [140, 145, 150, 155.8] },
        } as any,
      ]);

      vi.spyOn(dexscreenerService, 'search').mockResolvedValueOnce([
        {
          chainId: 'solana',
          dexId: 'raydium',
          url: 'https://dexscreener.com/solana/pair123',
          pairAddress: 'pair123',
          baseToken: { address: 'sol1', name: 'Solana', symbol: 'SOL' },
          quoteToken: { address: 'usdc1', name: 'USDC', symbol: 'USDC' },
          priceNative: '155.8',
          priceUsd: '155.8',
          liquidity: { usd: 42000000 },
          volume: { h24: 18000000 },
          txns: { h24: { buys: 5200, sells: 4100 } },
        } as any,
      ]);

      render(
        <MemoryRouter initialEntries={['/markets/solana']}>
          <Routes>
            <Route path="/markets/:id" element={<CoinDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Solana/i })).toBeInTheDocument();
      });

      // DexScreener toggle button
      const dexModeBtn = screen.getByRole('button', { name: /DexScreener Live/i });
      expect(dexModeBtn).toBeInTheDocument();

      fireEvent.click(dexModeBtn);

      await waitFor(() => {
        expect(screen.getByTitle(/DexScreener Chart for SOL/i)).toBeInTheDocument();
        expect(screen.getByText(/On-Chain Liquidity/i)).toBeInTheDocument();
        expect(screen.getByText(/Raydium \(solana\)/i)).toBeInTheDocument();
      });
    });
  });
});
