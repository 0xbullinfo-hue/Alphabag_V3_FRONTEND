// SPDX-License-Identifier: MIT
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AlphaScreener } from '../../src/pages/frontend/AlphaScreener';

// Mock API
vi.mock('../../src/services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: { pairs: [] } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock useDexScreenerStream
vi.mock('../../src/hooks/useDexScreenerStream', () => ({
  useDexScreenerStream: vi.fn().mockReturnValue({
    boosts: [
      {
        url: 'https://dexscreener.com/solana/ekpqgsjtjmfqkz9kqansqyxdcr8fbopzlhyxdm65zcjm',
        chainId: 'solana',
        tokenAddress: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
        amount: 500,
        totalAmount: 14200,
        icon: 'https://dd.dexscreener.com/ds-data/tokens/solana/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm.png',
        header: 'dogwifhat with a hat',
        description: 'Community supported meme coin on Solana network with active tier-1 liquidity.',
        links: [{ type: 'twitter', label: 'Twitter', url: 'https://x.com/dogwifcoin' }],
      },
    ],
    takeovers: [
      {
        url: 'https://dexscreener.com/solana/2bcchqadi4qehwpkg3w13sicywwqpgkftnioutqvpump',
        chainId: 'solana',
        tokenAddress: '2bCCHQadi4QeHWPKG3w13siCyWWQPgkFtniouTqVpump',
        icon: 'https://dd.dexscreener.com/ds-data/tokens/solana/2bCCHQadi4QeHWPKG3w13siCyWWQPgkFtniouTqVpump.png',
        header: 'Community Takeover: TRUMP Coin',
        description: 'Original dev rugged dev tokens. Community organized complete takeover.',
        claimDate: '2026-10-15T18:24:00Z',
        links: [{ type: 'twitter', label: 'Twitter CTO', url: 'https://x.com/trump_cto' }],
      },
    ],
    isConnected: true,
    isStreaming: true,
    error: null,
    refresh: vi.fn(),
  }),
}));

// Mock DexScreener service
vi.mock('../../src/services/dexscreener', () => ({
  dexscreenerService: {
    getTrendingMetas: vi.fn().mockResolvedValue([
      {
        name: 'AI Agents & Autonomous Swarms',
        slug: 'ai-agents',
        description: 'Autonomous LLM agents',
        marketCap: 4820000000,
        liquidity: 345000000,
        volume: 890000000,
        tokenCount: 42,
        marketCapChange: { h24: 24.5 },
      },
    ]),
    getLatestBoosts: vi.fn().mockResolvedValue([]),
    getCommunityTakeovers: vi.fn().mockResolvedValue([]),
    getBatchTokens: vi.fn().mockResolvedValue([]),
    getPair: vi.fn().mockResolvedValue(null),
    search: vi.fn().mockResolvedValue([]),
  },
}));

describe('AlphaScreener DexScreener Integration', () => {
  it('renders DEX Screener Live header with status indicator', async () => {
    render(
      <BrowserRouter>
        <AlphaScreener />
      </BrowserRouter>
    );

    expect(screen.getByText(/DEX Screener Live/i)).toBeInTheDocument();
    expect(screen.getByText(/DEXSTREAM:/i)).toBeInTheDocument();
    expect(screen.getByTestId('tab-pairs')).toBeInTheDocument();
    expect(screen.getByTestId('tab-boosts')).toBeInTheDocument();
    expect(screen.getByTestId('tab-takeovers')).toBeInTheDocument();
    expect(screen.getByTestId('tab-metas')).toBeInTheDocument();
  });

  it('switches to Live Boosts tab and renders boost stream', async () => {
    render(
      <BrowserRouter>
        <AlphaScreener />
      </BrowserRouter>
    );

    const boostsTab = screen.getByTestId('tab-boosts');
    fireEvent.click(boostsTab);

    await waitFor(() => {
      expect(screen.getByText(/Live Token Boost Stream/i)).toBeInTheDocument();
      expect(screen.getByText(/dogwifhat with a hat/i)).toBeInTheDocument();
      expect(screen.getByText(/\+500 BOOSTS/i)).toBeInTheDocument();
    });
  });

  it('switches to Community Takeovers tab and renders verified CTOs', async () => {
    render(
      <BrowserRouter>
        <AlphaScreener />
      </BrowserRouter>
    );

    const ctoTab = screen.getByTestId('tab-takeovers');
    fireEvent.click(ctoTab);

    // Check if takeovers tab is active
    expect(ctoTab.className).toContain('text-alphabag-yellow');
    
    await waitFor(() => {
      expect(screen.getByText(/Verified Registry/i)).toBeInTheDocument();
      expect(screen.getAllByText(/VERIFIED CTO/i).length).toBeGreaterThan(0);
    });
  });

  it('switches to Trending Metas tab and renders narrative sectors', async () => {
    render(
      <BrowserRouter>
        <AlphaScreener />
      </BrowserRouter>
    );

    const metasTab = screen.getByTestId('tab-metas');
    fireEvent.click(metasTab);

    await waitFor(() => {
      expect(screen.getByText(/Trending Metas & Narratives/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Agents & Autonomous Swarms/i)).toBeInTheDocument();
      expect(screen.getByText(/42 Tokens/i)).toBeInTheDocument();
    });
  });

  it('filters DEX pairs by search query', async () => {
    render(
      <BrowserRouter>
        <AlphaScreener />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search symbol, narrative, or CA/i);
    fireEvent.change(searchInput, { target: { value: 'BONK' } });

    expect(screen.getByText('BONK')).toBeInTheDocument();
    expect(screen.queryByText('BRETT')).not.toBeInTheDocument();
  });

  it('does not contain any Desk button linking to Alpha Desk across tabs', async () => {
    render(
      <BrowserRouter>
        <AlphaScreener />
      </BrowserRouter>
    );

    // Verify Pairs table has no Desk button
    expect(screen.queryByRole('button', { name: /Desk/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Open Chart in Alpha Desk/i)).not.toBeInTheDocument();

    // Switch to Boosts tab
    fireEvent.click(screen.getByTestId('tab-boosts'));
    await waitFor(() => {
      expect(screen.getByText(/dogwifhat with a hat/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /Desk/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /DexScreener/i })).toBeInTheDocument();

    // Switch to Takeovers tab
    fireEvent.click(screen.getByTestId('tab-takeovers'));
    await waitFor(() => {
      expect(screen.getByText(/Community Takeover: TRUMP Coin/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /Desk/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /DexScreener/i }).length).toBeGreaterThan(0);
  });
});
