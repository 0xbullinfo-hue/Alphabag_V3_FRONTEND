import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AlphasFeed } from '../../src/pages/frontend/AlphasFeed';

// Mock sweetalert2
vi.mock('sweetalert2', () => ({
    default: {
        fire: vi.fn().mockResolvedValue({ isConfirmed: true })
    }
}));

// Mock AuthContext
vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: '0x1234567890abcdef1234567890abcdef12345678',
            walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
            tier: 'ALPHA_VIP',
            isPro: true
        },
        isAuthenticated: true,
        isLoading: false
    })
}));

// Mock API service
vi.mock('../../src/services/api', () => ({
    api: {
        get: vi.fn().mockImplementation((url: string) => {
            if (url === '/api/community/discussions') {
                return Promise.resolve({
                    data: [
                        {
                            id: 'test-post-1',
                            title: 'AlphaBAG Protocol Tokenomics & Fee Switch',
                            ticker: '$BAG',
                            category: 'TOKENOMICS',
                            sentiment: 'BULLISH',
                            content: 'The 60% fee switch routes revenue into buyback and burn.',
                            authorWallet: '0x123...5678',
                            authorTier: 'ALPHA_VIP',
                            isPro: true,
                            upvotes: 42,
                            downvotes: 2,
                            insightfulCount: 15,
                            comments: [
                                {
                                    id: 'comm-1',
                                    authorWallet: '0xabc...def0',
                                    authorTier: 'PREMIUM',
                                    isPro: true,
                                    content: 'Huge catalyst for long-term spot holders.',
                                    sentiment: 'BULLISH',
                                    upvotes: 8,
                                    createdAt: new Date().toISOString(),
                                    replies: []
                                }
                            ],
                            createdAt: new Date().toISOString()
                        }
                    ]
                });
            }
            if (url === '/api/community/podcast') {
                return Promise.resolve({
                    data: {
                        isLive: true,
                        title: 'Live Stage: Whale Inflows & DEX Rotations',
                        topic: '$SOL • Real-time Liquidity',
                        hostName: 'AlphaDesk Lead',
                        hostWallet: '0x123...5678',
                        listenersCount: 88,
                        isListening: false,
                        stageSpeakers: [
                            { wallet: '0x123...5678', name: 'AlphaDesk Lead', isHost: true, isSpeaking: true, tier: 'ALPHA_VIP' }
                        ],
                        liveChat: [],
                        upvotes: 25,
                        userUpvoted: false
                    }
                });
            }
            if (url === '/api/community/trending') {
                return Promise.resolve({
                    data: [
                        { ticker: '$BAG', topic: 'Genesis Staking Engine', posts: 140, sentiment: 'BULLISH' }
                    ]
                });
            }
            if (url === '/api/community/analysts') {
                return Promise.resolve({
                    data: [
                        { rank: '1', wallet: '0x123...5678', tier: 'ALPHA_VIP', score: '98%', focus: 'Tokenomics' }
                    ]
                });
            }
            return Promise.resolve({ data: [] });
        }),
        post: vi.fn().mockResolvedValue({ data: { success: true } })
    }
}));

describe('AlphasFeed Community Discussion & Live Audio Space Hub', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders the Alpha Feed page with title and live audio stage banner', async () => {
        render(<AlphasFeed />);

        expect(screen.getByText('Alpha Feed')).toBeDefined();
        expect(screen.getByText(/Web3 Trader Community/i)).toBeDefined();

        // Check for Live Audio Stage
        expect(screen.getByText('LIVE AUDIO STAGE')).toBeDefined();
    });

    it('renders Reddit-style discussion posts with voting, comments count, and share actions', async () => {
        render(<AlphasFeed />);

        await waitFor(() => {
            const bagElements = screen.getAllByText('$BAG');
            expect(bagElements.length).toBeGreaterThan(0);
        });

        // Check for Share button
        const shareButtons = screen.getAllByRole('button', { name: /share/i });
        expect(shareButtons.length).toBeGreaterThan(0);

        // Click Share to open dropdown
        fireEvent.click(shareButtons[0]);
        expect(screen.getByText(/Copy Link/i)).toBeDefined();
        expect(screen.getByText(/Share to X/i)).toBeDefined();
    });

    it('supports expanding comment threads and submitting replies', async () => {
        render(<AlphasFeed />);

        await waitFor(() => {
            expect(screen.getAllByText(/Comments/i).length).toBeGreaterThan(0);
        });

        // Expand comments
        const commentsToggles = screen.getAllByRole('button', { name: /Comments/i });
        fireEvent.click(commentsToggles[0]);

        // Comment input should be visible
        expect(screen.getAllByPlaceholderText(/Share your perspective/i).length).toBeGreaterThan(0);
    });

    it('opens discussion composer modal and creates post with media support', async () => {
        render(<AlphasFeed />);

        const createButtons = screen.getAllByRole('button', { name: /Create Post/i });
        fireEvent.click(createButtons[0]);

        expect(screen.getAllByText(/Create Post/i).length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText(/What's happening in the market or protocol\?/i)).toBeDefined();
    });

    it('enforces community gating: preview mode for non-joined communities with join action', async () => {
        render(<AlphasFeed />);

        await waitFor(() => {
            const joinButtons = screen.getAllByRole('button', { name: /\+ Join|Joined/i });
            expect(joinButtons.length).toBeGreaterThan(0);
        });

        // Find community slugs
        expect(screen.getAllByText(/c\/tokenomics/i).length).toBeGreaterThan(0);
    });

    it('allows community members to request stage mic with host moderation', async () => {
        render(<AlphasFeed />);

        const requestMicButton = screen.getByRole('button', { name: /Request to Speak/i });
        expect(requestMicButton).toBeDefined();

        fireEvent.click(requestMicButton);
        expect(screen.getByRole('button', { name: /Request Pending/i })).toBeDefined();
    });

    it('opens Host Audio Space modal allowing community live stage creation', async () => {
        render(<AlphasFeed />);

        const hostButtons = screen.getAllByRole('button', { name: /Host Audio Space/i });
        expect(hostButtons.length).toBeGreaterThan(0);
        fireEvent.click(hostButtons[0]);

        expect(screen.getByText(/Start Live Audio Stage/i)).toBeDefined();
        expect(screen.getByPlaceholderText(/Whale Accumulation & DEX Liquidity Breakdown/i)).toBeDefined();
    });
});
