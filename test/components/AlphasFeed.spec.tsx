import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AlphasFeed } from '../../src/pages/frontend/AlphasFeed';
import { api } from '../../src/services/api';

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
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn()
    }
}));

const mockCommunities = [
    {
        slug: 'tokenomics',
        name: 'Tokenomics & Vesting',
        description: 'Deep dives into token emissions and supply unlocks.',
        memberCount: 142,
        isMember: true
    },
    {
        slug: 'general',
        name: 'General Discussion',
        description: 'Open discussion on markets and Web3.',
        memberCount: 520,
        isMember: false
    }
];

const mockDiscussions = [
    {
        id: 'post-1',
        title: 'Analysis of $BAG emission curve',
        ticker: '$BAG',
        category: 'TOKENOMICS',
        communitySlug: 'tokenomics',
        communityName: 'Tokenomics & Vesting',
        communityMember: true,
        previewOnly: false,
        content: 'Full analysis text explaining how token emissions decrease over 24 months.',
        authorName: 'AlphaAnalyst',
        upvotes: 25,
        downvotes: 1,
        userVoted: 'UP',
        comments: [
            {
                id: 'comm-1',
                authorName: 'Trader01',
                displayMode: 'VISIBLE',
                content: 'Solid thesis on the unlock schedule.',
                createdAt: new Date().toISOString()
            }
        ],
        commentCount: 1,
        createdAt: new Date().toISOString(),
        isPinned: true
    },
    {
        id: 'post-2',
        title: 'Macro liquidity forecast Q4',
        ticker: '$BTC',
        category: 'GENERAL',
        communitySlug: 'general',
        communityName: 'General Discussion',
        communityMember: false,
        previewOnly: true,
        previewText: 'Macro liquidity forecast preview text...',
        authorName: 'MacroDesk',
        upvotes: 10,
        downvotes: 0,
        comments: [],
        commentCount: 4,
        createdAt: new Date().toISOString()
    }
];

describe('AlphasFeed Community Hub', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.get).mockImplementation((url: string) => {
            if (url === '/api/community/communities') {
                return Promise.resolve({ data: mockCommunities });
            }
            if (url === '/api/community/discussions') {
                return Promise.resolve({ data: mockDiscussions });
            }
            if (url === '/api/community/ads') {
                return Promise.resolve({ data: null });
            }
            return Promise.resolve({ data: [] });
        });
        vi.mocked(api.post).mockResolvedValue({ data: { success: true } });
        vi.mocked(api.delete).mockResolvedValue({ data: { success: true } });
    });

    it('renders the AlphaFeed header and community filter options', async () => {
        render(<AlphasFeed />);

        expect(screen.getByText('AlphaFeed')).toBeDefined();
        expect(screen.getByText(/Collaborative Web3 Due Diligence/i)).toBeDefined();

        await waitFor(() => {
            expect(screen.getByText('All communities')).toBeDefined();
            expect(screen.getAllByText(/Tokenomics & Vesting/i).length).toBeGreaterThan(0);
        });
    });

    it('renders discussion posts with full thread for members and previewOnly for non-members', async () => {
        render(<AlphasFeed />);

        await waitFor(() => {
            expect(screen.getByText('Analysis of $BAG emission curve')).toBeDefined();
            expect(screen.getByText('Macro liquidity forecast Q4')).toBeDefined();
        });

        // Member post shows full content
        expect(screen.getByText(/Full analysis text explaining/i)).toBeDefined();

        // Non-member post shows preview banner
        expect(screen.getByText(/Join to read the full thread and community replies/i)).toBeDefined();
    });

    it('allows joining and leaving communities via directory', async () => {
        render(<AlphasFeed />);

        await waitFor(() => {
            expect(screen.getByText('Ecosystem Communities')).toBeDefined();
        });

        const leaveButton = screen.getByRole('button', { name: 'Leave' });
        expect(leaveButton).toBeDefined();

        fireEvent.click(leaveButton);
        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith('/api/community/communities/tokenomics/join');
        });
    });

    it('supports expanding comment threads and submitting a comment', async () => {
        render(<AlphasFeed />);

        await waitFor(() => {
            expect(screen.getByText(/1 Comments/i)).toBeDefined();
        });

        const commentToggle = screen.getByText(/1 Comments/i);
        fireEvent.click(commentToggle);

        // Input should now be available
        const textarea = screen.getByPlaceholderText(/Write a comment…/i);
        expect(textarea).toBeDefined();

        fireEvent.change(textarea, { target: { value: 'Counter analysis on liquidity' } });

        vi.mocked(api.post).mockResolvedValueOnce({
            data: {
                comment: {
                    id: 'comm-2',
                    authorName: 'Visible profile',
                    displayMode: 'VISIBLE',
                    content: 'Counter analysis on liquidity',
                    createdAt: new Date().toISOString()
                }
            }
        });

        const submitButton = screen.getByRole('button', { name: 'Comment' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/community/discussions/post-1/comments', {
                content: 'Counter analysis on liquidity',
                displayMode: 'VISIBLE'
            });
        });
    });

    it('allows upvoting a discussion post', async () => {
        render(<AlphasFeed />);

        await waitFor(() => {
            expect(screen.getByText('Analysis of $BAG emission curve')).toBeDefined();
        });

        const upvoteButton = screen.getByTitle('Rate this post');
        vi.mocked(api.post).mockResolvedValueOnce({
            data: {
                upvotes: 26,
                downvotes: 1,
                userVoted: 'UP'
            }
        });

        fireEvent.click(upvoteButton);
        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/community/discussions/post-1/vote', { type: 'UP' });
        });
    });

    it('opens discussion composer and creates a post for joined community', async () => {
        render(<AlphasFeed />);

        const newPostButton = screen.getByRole('button', { name: /New post/i });
        await waitFor(() => {
            expect(newPostButton).not.toBeDisabled();
        });

        fireEvent.click(newPostButton);

        expect(screen.getByText('Create a Post')).toBeDefined();

        const titleInput = screen.getByPlaceholderText(/What would you like to discuss\?/i);
        const postInput = screen.getByPlaceholderText(/Share your question, idea, research/i);

        fireEvent.change(titleInput, { target: { value: 'Yield farming safety' } });
        fireEvent.change(postInput, { target: { value: 'Detailed thesis on pool risk.' } });

        vi.mocked(api.post).mockResolvedValueOnce({
            data: {
                id: 'post-new',
                title: 'Yield farming safety',
                content: 'Detailed thesis on pool risk.',
                communitySlug: 'tokenomics',
                category: 'TOKENOMICS',
                authorName: 'AlphaAnalyst',
                upvotes: 0,
                downvotes: 0,
                comments: [],
                createdAt: new Date().toISOString()
            }
        });

        const publishButton = screen.getByRole('button', { name: /Publish post/i });
        fireEvent.click(publishButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/community/discussions', {
                title: 'Yield farming safety',
                content: 'Detailed thesis on pool risk.',
                communitySlug: 'tokenomics',
                ticker: undefined,
                category: 'TOKENOMICS'
            });
        });
    });

    it('opens Create Community modal and displays researched crypto sectors', async () => {
        render(<AlphasFeed />);

        const createCommunityBtn = screen.getByRole('button', { name: /Create Community/i });
        fireEvent.click(createCommunityBtn);

        expect(screen.getByText('Launch a Crypto Community')).toBeDefined();
        expect(screen.getByText('DeFi & Liquidity')).toBeDefined();
        expect(screen.getByText('Memecoins & Culture')).toBeDefined();
        expect(screen.getByText('AI Agents & DePIN')).toBeDefined();
    });
});
