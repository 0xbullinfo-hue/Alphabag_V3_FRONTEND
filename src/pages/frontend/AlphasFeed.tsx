// SPDX-License-Identifier: MIT
import DOMPurify from 'dompurify';
import {
    ArrowUpRight,
    Award,
    Check,
    ChevronDown,
    ChevronUp,
    Coins,
    Copy,
    Eye,
    EyeOff,
    Flame,
    Hand,
    Layers,
    Loader2,
    Lock,
    MessageCircle,
    MessageSquare,
    Mic,
    MicOff,
    Plus,
    Radio,
    Search,
    Send,
    Share2,
    Shield,
    Sparkles,
    Target,
    ThumbsDown,
    ThumbsUp,
    TrendingUp,
    Twitter,
    Users,
    Volume2,
    VolumeX,
    Zap
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { PageIcon } from '../../components/ui/PageIcon';
import { FounderListingForm } from '../../components/frontend/FounderListingForm';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { PassTier } from '../../types';

// ── PODCAST CHAT RATE LIMITING ───────────────────────────────────────────────
const PODCAST_CHAT_MAX_MESSAGES = 200;
const PODCAST_CHAT_COOLDOWN_MS = 3000;
const PODCAST_CHAT_MAX_LENGTH = 280;

// ── TYPES & ENUMS ────────────────────────────────────────────────────────────

export type DiscussionCategory = 
    | 'ALL' 
    | 'TOKENOMICS' 
    | 'UTILITY' 
    | 'PROJECT_REVIEW' 
    | 'ALPHA_CALL' 
    | 'AUDIT_SECURITY'
    | 'MEMECOIN_ROTATION';

export type DiscussionSentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface DiscussionComment {
    id: string;
    authorWallet: string;
    authorTier: PassTier;
    isPro: boolean;
    content: string;
    sentiment?: DiscussionSentiment;
    upvotes: number;
    userVoted?: 'UP' | 'DOWN';
    createdAt: string;
    replies?: DiscussionComment[];
}

export interface DiscussionPost {
    id: string;
    title: string;
    ticker: string;
    category: Exclude<DiscussionCategory, 'ALL'>;
    sentiment: DiscussionSentiment;
    content: string;
    authorWallet: string;
    authorTier: PassTier;
    isPro: boolean;
    upvotes: number;
    downvotes: number;
    userVoted?: 'UP' | 'DOWN';
    isInsightful?: boolean;
    insightfulCount: number;
    tokenMetrics?: {
        marketCap?: string;
        fdv?: string;
        circulatingSupply?: string;
        unlockDate?: string;
    };
    comments: DiscussionComment[];
    createdAt: string;
    isPinned?: boolean;
    isSponsored?: boolean;
}

export interface LivePodcastState {
    isLive: boolean;
    title: string;
    topic: string;
    hostName: string;
    hostWallet: string;
    listenersCount: number;
    isListening: boolean;
    isMuted?: boolean;
    userMicMuted?: boolean;
    userOnStage?: boolean;
    stageSpeakers: Array<{
        wallet: string;
        name: string;
        isHost?: boolean;
        isSpeaking?: boolean;
        tier: string;
    }>;
    liveChat: Array<{
        id: string;
        authorWallet: string;
        tier: PassTier;
        isVip?: boolean;
        message: string;
        timestamp: string;
    }>;
    upvotes: number;
    userUpvoted: boolean;
    reactionStats?: {
        alpha: number;
        fire: number;
        bullish: number;
        insight: number;
    };
}

export interface SponsoredAd {
    id: string;
    partnerName: string;
    tagline: string;
    description: string;
    badge: string;
    ctaText: string;
    ctaUrl: string;
    logoUrl?: string;
}

export interface TrendingTopic {
    ticker: string;
    topic: string;
    posts: number;
    sentiment: string;
}

export interface TopAnalyst {
    rank: string;
    wallet: string;
    tier: string;
    score: string;
    focus: string;
}

// ── DEFAULT SEED DATA (High Quality Web3 Institutional Seed) ─────────────────
const SEED_DISCUSSIONS: DiscussionPost[] = [
    {
        id: 'disc-bag-genesis',
        title: '$BAG Tokenomics Architecture & Genesis Pass Staking Yield',
        ticker: '$BAG',
        category: 'TOKENOMICS',
        sentiment: 'BULLISH',
        content: `Comprehensive breakdown of the AlphaBAG Protocol fee-switch model and liquidity lock.\n\n• Protocol Revenue Distribution: 60% of all premium analytics subscription fees are automatically routed into the $BAG open-market buyback & burn smart contract.\n• Genesis Pass Staking: Yield multipliers scale based on pass tier (Free: 1x, Premium: 2.5x, Ultimate: 5x). Current APR averaging 28.4% on native single-sided staking pool.\n• Vesting Schedule: Team tokens locked in a 36-month linear vesting smart contract with zero unlocks until Month 12.\n\nThe real-yield engine ensures deflationary pressure as trader onboarding accelerates.`,
        authorWallet: '0x71C...89A2',
        authorTier: 'ALPHA_VIP',
        isPro: true,
        upvotes: 84,
        downvotes: 3,
        userVoted: undefined,
        isInsightful: true,
        insightfulCount: 38,
        tokenMetrics: {
            marketCap: '$14.2M',
            fdv: '$32.0M',
            circulatingSupply: '44.3%',
            unlockDate: 'Month 12 Cliff (Safe)'
        },
        comments: [
            {
                id: 'comm-bag-1',
                authorWallet: '0x34A...B901',
                authorTier: 'PREMIUM',
                isPro: true,
                content: 'The buyback mechanism already burned over 2.4M $BAG in Q3. Very few DeFi tools actually distribute real revenue like this.',
                sentiment: 'BULLISH',
                upvotes: 19,
                createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
                replies: [
                    {
                        id: 'comm-bag-1-1',
                        authorWallet: '0x88F...4210',
                        authorTier: 'FREE',
                        isPro: false,
                        content: 'Are the buyback txs verifiable on Etherscan in real-time?',
                        sentiment: 'NEUTRAL',
                        upvotes: 6,
                        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
                    },
                    {
                        id: 'comm-bag-1-2',
                        authorWallet: '0x71C...89A2',
                        authorTier: 'ALPHA_VIP',
                        isPro: true,
                        content: 'Yes! All buyback hashes are emitted via the FeeDistributor contract event logs and visible on the Protocol Dashboard.',
                        sentiment: 'BULLISH',
                        upvotes: 12,
                        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
                    }
                ]
            },
            {
                id: 'comm-bag-2',
                authorWallet: '0x12E...77C3',
                authorTier: 'PREMIUM',
                isPro: true,
                content: 'Single-sided staking with zero impermanent loss is the major selling point compared to standard LP pools.',
                sentiment: 'BULLISH',
                upvotes: 11,
                createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
                replies: []
            }
        ],
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        isPinned: true
    },
    {
        id: 'disc-sol-breakout',
        title: '$SOL DEX Volume Flipping Mainnet & Raydium Fee Dominance',
        ticker: '$SOL',
        category: 'ALPHA_CALL',
        sentiment: 'BULLISH',
        content: `Solana DEX 24H volume surpassed $3.8B today, driven by continuous memecoin rotations and Jupiter routing efficiency.\n\n• Whale Wallet Clustering: Three smart money clusters tracked via BubbleMaps accumulated over 120,000 SOL between $178 and $184.\n• On-chain TPS consistently above 2,600 without gas spikes.\n• Downside Risk: Watch for validator concentration and potential RPC node throttling during high-volatility trading spikes.`,
        authorWallet: '0x99B...E311',
        authorTier: 'PREMIUM',
        isPro: true,
        upvotes: 67,
        downvotes: 7,
        userVoted: undefined,
        isInsightful: true,
        insightfulCount: 24,
        tokenMetrics: {
            marketCap: '$92.4B',
            fdv: '$114.8B',
            circulatingSupply: '80.5%',
            unlockDate: 'Staking Inflows (+6.2%)'
        },
        comments: [
            {
                id: 'comm-sol-1',
                authorWallet: '0x45C...9081',
                authorTier: 'FREE',
                isPro: false,
                content: 'Raydium daily protocol fees crossed Uniswap on multiple days this week. Incredible liquidity flywheel.',
                sentiment: 'BULLISH',
                upvotes: 14,
                createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
                replies: []
            }
        ],
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
        id: 'disc-render-depin',
        title: '$RENDER AI GPU Cluster Demand vs Cloud Hyperscalers',
        ticker: '$RENDER',
        category: 'PROJECT_REVIEW',
        sentiment: 'BULLISH',
        content: `Deep dive into Render Network’s transition from 3D VFX rendering to enterprise AI inference.\n\n• Key Takeaway: Decentralized compute cost for Llama-3 fine-tuning is currently ~58% lower on Render nodes compared to AWS p4d.24xlarge instances.\n• BME (Burn-and-Mint Equilibrium): 140,000 RNDR burned last month against compute client vouchers.\n• Thesis: Strong macro hedge for AI compute scarcity as frontier model providers expand training budgets.`,
        authorWallet: '0x52D...A1F0',
        authorTier: 'ALPHA_VIP',
        isPro: true,
        upvotes: 52,
        downvotes: 2,
        userVoted: undefined,
        isInsightful: true,
        insightfulCount: 31,
        tokenMetrics: {
            marketCap: '$2.8B',
            fdv: '$3.4B',
            circulatingSupply: '71.2%',
            unlockDate: 'Linear BME Mint'
        },
        comments: [],
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
        id: 'disc-sui-move',
        title: '$SUI Move VM Parallel Execution Benchmarks & Ecosystem TVL Wave',
        ticker: '$SUI',
        category: 'UTILITY',
        sentiment: 'NEUTRAL',
        content: `Benchmarking Sui’s object-centric storage model against EVM state transitions.\n\n• Positives: Sub-second finality (390ms) on non-conflicting single-writer transactions.\n• Concerns: Heavy token unlocks scheduled throughout next quarter (~64M SUI/month). Even with high TVL growth in Navi and Scallop, supply dilution must be carefully monitored by spot holders.`,
        authorWallet: '0x21F...882E',
        authorTier: 'PREMIUM',
        isPro: true,
        upvotes: 41,
        downvotes: 8,
        userVoted: undefined,
        isInsightful: true,
        insightfulCount: 18,
        tokenMetrics: {
            marketCap: '$5.6B',
            fdv: '$18.2B',
            circulatingSupply: '28.1%',
            unlockDate: 'Monthly Cliff (+2.1%)'
        },
        comments: [],
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    }
];

const SEED_PODCAST: LivePodcastState = {
    isLive: true,
    title: "Alpha Roundtable: Whale Inflows, Tokenomics Audits & Q4 Breakouts",
    topic: "Live Smart Money Tracking & On-Chain Liquidity Migration",
    hostName: "AlphaDesk Lead Analyst",
    hostWallet: "0x71C...89A2",
    listenersCount: 142,
    isListening: false,
    isMuted: false,
    userMicMuted: true,
    userOnStage: false,
    stageSpeakers: [
        { wallet: "0x71C...89A2", name: "AlphaDesk Lead", isHost: true, isSpeaking: true, tier: "ULTIMATE" },
        { wallet: "0x34A...B901", name: "MacroDeFi_Whale", isHost: false, isSpeaking: false, tier: "PREMIUM" },
        { wallet: "0x99B...E311", name: "SolanaScreener", isHost: false, isSpeaking: true, tier: "ULTIMATE" }
    ],
    liveChat: [
        { id: "c1", authorWallet: "0x44D...88F1", tier: "PREMIUM", isVip: true, message: "What are your thoughts on the $BAG buyback rate this week?", timestamp: "1m ago" },
        { id: "c2", authorWallet: "0x12E...77C3", tier: "FREE", isVip: false, message: "Listening in from Singapore. Great alpha on the DEX volume shift.", timestamp: "3m ago" },
        { id: "c3", authorWallet: "0x88F...4210", tier: "ALPHA_VIP", isVip: true, message: "Whale wallet 0x3a9 just swept 40 ETH into liquidity pool.", timestamp: "5m ago" }
    ],
    upvotes: 96,
    userUpvoted: false,
    reactionStats: {
        alpha: 42,
        fire: 89,
        bullish: 74,
        insight: 35
    }
};

const SEED_TRENDING: TrendingTopic[] = [
    { ticker: '$BAG', topic: 'Genesis Staking & Deflationary Buyback Engine', posts: 148, sentiment: 'BULLISH' },
    { ticker: '$SOL', topic: 'DEX Volume Surpasses Ethereum Mainnet', posts: 124, sentiment: 'BULLISH' },
    { ticker: '$RENDER', topic: 'Decentralized AI Compute Cluster Expansion', posts: 89, sentiment: 'BULLISH' },
    { ticker: '$SUI', topic: 'Ecosystem TVL Benchmark & Lockup Analysis', posts: 72, sentiment: 'NEUTRAL' },
    { ticker: '$PEPE', topic: 'Whale Accumulation Signals on BubbleMaps', posts: 64, sentiment: 'BULLISH' }
];

const SEED_ANALYSTS: TopAnalyst[] = [
    { rank: '1', wallet: '0x71C...89A2', tier: 'ULTIMATE', score: '98.4%', focus: 'Tokenomics & Vesting' },
    { rank: '2', wallet: '0x99B...E311', tier: 'ULTIMATE', score: '94.1%', focus: 'DEX Liquidity & Momentum' },
    { rank: '3', wallet: '0x52D...A1F0', tier: 'PREMIUM', score: '91.8%', focus: 'DePIN & AI Compute' },
    { rank: '4', wallet: '0x34A...B901', tier: 'PREMIUM', score: '88.5%', focus: 'On-Chain Smart Money' }
];

const SEED_AD: SponsoredAd = {
    id: 'ad-bag-genesis',
    partnerName: 'AlphaBAG Genesis Pass',
    tagline: 'Unlock institutional on-chain trade alerts, whale cluster detection & fee share yield.',
    description: 'Lifetime pass holders receive 100% access to all VIP screener tools, private Discord stages, and daily smart money flow reports.',
    badge: 'VERIFIED ECOSYSTEM',
    ctaText: 'Explore Pass Utility',
    ctaUrl: '#/airdrop',
    logoUrl: '/favicon.svg'
};

// ── COMPONENT ────────────────────────────────────────────────────────────────

export const AlphasFeed: React.FC = () => {
    const { user } = useAuth();

    // Channel & Search state
    const [selectedCategory, setSelectedCategory] = useState<DiscussionCategory>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'HOT' | 'TOP' | 'DEBATED' | 'LATEST'>('HOT');
    const [privacyMode, setPrivacyMode] = useState<boolean>(true);

    // Primary Community State
    const [discussions, setDiscussions] = useState<DiscussionPost[]>(() => {
        try {
            const saved = localStorage.getItem('alphabag_community_discussions');
            if (saved) return JSON.parse(saved);
        } catch (_) {}
        return SEED_DISCUSSIONS;
    });

    const [sponsoredAd, setSponsoredAd] = useState<SponsoredAd | null>(SEED_AD);
    const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>(SEED_TRENDING);
    const [topAnalysts, setTopAnalysts] = useState<TopAnalyst[]>(SEED_ANALYSTS);
    const [isLoading, setIsLoading] = useState(false);

    // Comment states
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set(['disc-bag-genesis']));
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [commentSentiments, setCommentSentiments] = useState<Record<string, DiscussionSentiment>>({});
    const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});

    // Share states
    const [activeShareId, setActiveShareId] = useState<string | null>(null);
    const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

    // New Discussion Composer Modal
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newTicker, setNewTicker] = useState('$BAG');
    const [newCategory, setNewCategory] = useState<Exclude<DiscussionCategory, 'ALL'>>('TOKENOMICS');
    const [newSentiment, setNewSentiment] = useState<DiscussionSentiment>('BULLISH');
    const [newContent, setNewContent] = useState('');
    const [newMarketCap, setNewMarketCap] = useState('');
    const [newFdv, setNewFdv] = useState('');
    const [newCirculating, setNewCirculating] = useState('');
    const [newUnlock, setNewUnlock] = useState('');

    // Founder Form Modal
    const [isFounderFormOpen, setIsFounderFormOpen] = useState(false);

    // ── LIVE AUDIO PODCAST / SPACE STATE ─────────────────────────────────────
    const [podcast, setPodcast] = useState<LivePodcastState | null>(() => {
        try {
            const saved = localStorage.getItem('alphabag_live_podcast');
            if (saved) return JSON.parse(saved);
        } catch (_) {}
        return SEED_PODCAST;
    });

    const [podcastChatInput, setPodcastChatInput] = useState('');
    const [lastChatSentAt, setLastChatSentAt] = useState(0);

    // Host Audio Space Modal
    const [isHostSpaceModalOpen, setIsHostSpaceModalOpen] = useState(false);
    const [newSpaceTitle, setNewSpaceTitle] = useState('');
    const [newSpaceTopic, setNewSpaceTopic] = useState('');
    const [newSpaceTicker, setNewSpaceTicker] = useState('$BAG');

    const isUserPro = Boolean(user?.isPro || user?.tier === 'PREMIUM' || user?.tier === 'ULTIMATE' || user?.tier === 'ALPHA_VIP');
    const userTier: PassTier = (user?.tier as PassTier) || 'FREE';

    // Format address for privacy
    const formatAddress = (addr?: string) => {
        if (!addr) return '0x0000...0000';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    const currentDisplayWallet = formatAddress(user?.walletAddress || user?.id || '0x71C...89A2');

    // Sync to local storage
    useEffect(() => {
        try {
            localStorage.setItem('alphabag_community_discussions', JSON.stringify(discussions));
        } catch (_) {}
    }, [discussions]);

    useEffect(() => {
        try {
            if (podcast) {
                localStorage.setItem('alphabag_live_podcast', JSON.stringify(podcast));
            }
        } catch (_) {}
    }, [podcast]);

    // ── FETCH LIVE DATA ON MOUNT ─────────────────────────────────────────────
    useEffect(() => {
        const fetchCommunityData = async () => {
            setIsLoading(true);
            try {
                const [discRes, podcastRes, adRes, trendRes, analystRes] = await Promise.allSettled([
                    api.get('/api/community/discussions'),
                    api.get('/api/community/podcast'),
                    api.get('/api/community/ads'),
                    api.get('/api/community/trending'),
                    api.get('/api/community/analysts')
                ]);

                if (discRes.status === 'fulfilled' && Array.isArray(discRes.value.data) && discRes.value.data.length > 0) {
                    setDiscussions(discRes.value.data);
                }

                if (podcastRes.status === 'fulfilled' && podcastRes.value.data?.isLive) {
                    setPodcast(prev => ({
                        ...podcastRes.value.data,
                        isListening: prev?.isListening ?? false,
                        isMuted: prev?.isMuted ?? false,
                        userMicMuted: prev?.userMicMuted ?? true,
                        userOnStage: prev?.userOnStage ?? false
                    }));
                }

                if (adRes.status === 'fulfilled' && adRes.value.data?.partnerName) {
                    setSponsoredAd(adRes.value.data);
                }

                if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value.data) && trendRes.value.data.length > 0) {
                    setTrendingTopics(trendRes.value.data);
                }

                if (analystRes.status === 'fulfilled' && Array.isArray(analystRes.value.data) && analystRes.value.data.length > 0) {
                    setTopAnalysts(analystRes.value.data);
                }
            } catch (err) {
                console.error("[CommunityHub] Data fetch error (using resilient seed):", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCommunityData();
    }, []);

    // ── FILTERING & SORTING ──────────────────────────────────────────────────
    const filteredDiscussions = useMemo(() => {
        let list = [...discussions];

        if (selectedCategory !== 'ALL') {
            list = list.filter(d => d.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(d => 
                d.title.toLowerCase().includes(q) ||
                d.ticker.toLowerCase().includes(q) ||
                d.content.toLowerCase().includes(q)
            );
        }

        switch (sortBy) {
            case 'TOP':
                list.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
                break;
            case 'DEBATED':
                list.sort((a, b) => b.comments.length - a.comments.length);
                break;
            case 'LATEST':
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'HOT':
            default:
                list.sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    const scoreA = (a.upvotes - a.downvotes) * 2 + a.comments.length * 5 + a.insightfulCount * 3;
                    const scoreB = (b.upvotes - b.downvotes) * 2 + b.comments.length * 5 + b.insightfulCount * 3;
                    return scoreB - scoreA;
                });
                break;
        }

        return list;
    }, [discussions, selectedCategory, searchQuery, sortBy]);

    // ── ACTIONS: DISCUSSIONS ─────────────────────────────────────────────────

    const handleVoteDiscussion = async (discId: string, type: 'UP' | 'DOWN') => {
        try {
            await api.post(`/api/community/discussions/${discId}/vote`, { type });
        } catch (_) {}

        setDiscussions(prev => prev.map(d => {
            if (d.id !== discId) return d;
            
            // Clicking same vote removes it
            if (d.userVoted === type) {
                return {
                    ...d,
                    userVoted: undefined,
                    upvotes: type === 'UP' ? Math.max(0, d.upvotes - 1) : d.upvotes,
                    downvotes: type === 'DOWN' ? Math.max(0, d.downvotes - 1) : d.downvotes
                };
            }

            // Switching from opposite vote or voting from neutral
            const hadUp = d.userVoted === 'UP';
            const hadDown = d.userVoted === 'DOWN';

            return {
                ...d,
                userVoted: type,
                upvotes: type === 'UP' ? d.upvotes + 1 : (hadUp ? Math.max(0, d.upvotes - 1) : d.upvotes),
                downvotes: type === 'DOWN' ? d.downvotes + 1 : (hadDown ? Math.max(0, d.downvotes - 1) : d.downvotes)
            };
        }));
    };

    const handleToggleInsightful = async (discId: string) => {
        try {
            await api.post(`/api/community/discussions/${discId}/insightful`);
        } catch (_) {}

        setDiscussions(prev => prev.map(d => {
            if (d.id !== discId) return d;
            const nextState = !d.isInsightful;
            return {
                ...d,
                isInsightful: nextState,
                insightfulCount: nextState ? d.insightfulCount + 1 : Math.max(0, d.insightfulCount - 1)
            };
        }));
    };

    const toggleComments = (discId: string) => {
        setExpandedComments(prev => {
            const next = new Set(prev);
            if (next.has(discId)) next.delete(discId);
            else next.add(discId);
            return next;
        });
    };

    const handleAddComment = async (discId: string) => {
        const text = (commentDrafts[discId] || '').trim();
        if (!text) return;

        const sentiment = commentSentiments[discId] || 'NEUTRAL';
        const targetReplyId = replyingTo[discId];

        const newComm: DiscussionComment = {
            id: `comm-${Date.now()}`,
            authorWallet: currentDisplayWallet,
            authorTier: userTier,
            isPro: isUserPro,
            content: text,
            sentiment,
            upvotes: 1,
            createdAt: new Date().toISOString(),
            replies: []
        };

        try {
            await api.post(`/api/community/discussions/${discId}/comments`, {
                content: text,
                sentiment,
                replyToId: targetReplyId,
                authorWallet: currentDisplayWallet,
                authorTier: userTier,
                isPro: isUserPro
            });
        } catch (_) {}

        setDiscussions(prev => prev.map(d => {
            if (d.id !== discId) return d;
            if (targetReplyId) {
                return {
                    ...d,
                    comments: d.comments.map(c => {
                        if (c.id === targetReplyId) {
                            return { ...c, replies: [...(c.replies || []), newComm] };
                        }
                        return c;
                    })
                };
            }
            return { ...d, comments: [newComm, ...d.comments] };
        }));

        setCommentDrafts(prev => ({ ...prev, [discId]: '' }));
        setReplyingTo(prev => ({ ...prev, [discId]: null }));
    };

    const handleUpvoteComment = (discId: string, commentId: string) => {
        setDiscussions(prev => prev.map(d => {
            if (d.id !== discId) return d;
            return {
                ...d,
                comments: d.comments.map(c => {
                    if (c.id === commentId) {
                        const isUp = c.userVoted === 'UP';
                        return {
                            ...c,
                            userVoted: isUp ? undefined : 'UP',
                            upvotes: isUp ? Math.max(0, c.upvotes - 1) : c.upvotes + 1
                        };
                    }
                    if (c.replies && c.replies.length > 0) {
                        return {
                            ...c,
                            replies: c.replies.map(r => {
                                if (r.id === commentId) {
                                    const isUp = r.userVoted === 'UP';
                                    return {
                                        ...r,
                                        userVoted: isUp ? undefined : 'UP',
                                        upvotes: isUp ? Math.max(0, r.upvotes - 1) : r.upvotes + 1
                                    };
                                }
                                return r;
                            })
                        };
                    }
                    return c;
                })
            };
        }));
    };

    const handleCreateDiscussion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) {
            Swal.fire({
                title: 'Missing Details',
                text: 'Please provide both a discussion title and analysis content.',
                icon: 'warning',
                background: '#181A20',
                color: '#EAECEF',
                confirmButtonColor: '#F0B90B'
            });
            return;
        }

        const formattedTicker = newTicker.trim().startsWith('$') 
            ? newTicker.trim().toUpperCase() 
            : `$${newTicker.trim().toUpperCase()}`;

        const newPost: DiscussionPost = {
            id: `disc-${Date.now()}`,
            title: newTitle.trim(),
            ticker: formattedTicker || '$ALPHA',
            category: newCategory,
            sentiment: newSentiment,
            content: newContent.trim(),
            authorWallet: currentDisplayWallet,
            authorTier: userTier,
            isPro: isUserPro,
            upvotes: 1,
            downvotes: 0,
            userVoted: 'UP',
            insightfulCount: 0,
            comments: [],
            tokenMetrics: (newMarketCap || newFdv || newCirculating || newUnlock) ? {
                marketCap: newMarketCap || undefined,
                fdv: newFdv || undefined,
                circulatingSupply: newCirculating || undefined,
                unlockDate: newUnlock || undefined,
            } : undefined,
            createdAt: new Date().toISOString()
        };

        try {
            await api.post('/api/community/discussions', newPost);
        } catch (_) {}

        setDiscussions(prev => [newPost, ...prev]);
        setIsComposerOpen(false);
        setNewTitle('');
        setNewContent('');
        setNewMarketCap('');
        setNewFdv('');
        setNewCirculating('');
        setNewUnlock('');

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'DISCUSSION POSTED',
            text: 'Your research has been published to the community feed.',
            showConfirmButton: false,
            timer: 3000,
            background: '#181A20',
            color: '#EAECEF'
        });
    };

    // ── SHARE ACTIONS (Copy, Twitter, Native) ────────────────────────────────
    const handleSharePost = async (post: DiscussionPost) => {
        const shareUrl = `${window.location.origin}/alpha-feed?post=${post.id}`;
        const shareText = `Check out this alpha analysis on ${post.ticker}: "${post.title}" via @AlphaBAG`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${post.ticker} Analysis | AlphaBAG Feed`,
                    text: shareText,
                    url: shareUrl
                });
                return;
            } catch (_) {}
        }

        // Toggle popover menu
        setActiveShareId(prev => prev === post.id ? null : post.id);
    };

    const handleCopyPostLink = async (post: DiscussionPost) => {
        const shareUrl = `${window.location.origin}/alpha-feed?post=${post.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopiedShareId(post.id);
            setTimeout(() => setCopiedShareId(null), 2500);

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Link Copied',
                text: 'Direct alpha link copied to clipboard.',
                showConfirmButton: false,
                timer: 2000,
                background: '#181A20',
                color: '#EAECEF'
            });
        } catch (_) {}
        setActiveShareId(null);
    };

    const handleTwitterShare = (post: DiscussionPost) => {
        const shareUrl = `${window.location.origin}/alpha-feed?post=${post.id}`;
        const text = encodeURIComponent(`Fresh Alpha on ${post.ticker}: "${post.title}"\n\nDeep dive via @AlphaBAG:\n${shareUrl}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
        setActiveShareId(null);
    };

    // ── ACTIONS: LIVE PODCAST / AUDIO SPACES ─────────────────────────────────

    const handleToggleListenPodcast = () => {
        if (!podcast) return;
        setPodcast(prev => {
            if (!prev) return null;
            const nextState = !prev.isListening;
            return {
                ...prev,
                isListening: nextState,
                listenersCount: nextState ? prev.listenersCount + 1 : Math.max(0, prev.listenersCount - 1)
            };
        });
    };

    const handleToggleMuteBroadcast = () => {
        if (!podcast) return;
        setPodcast(prev => prev ? ({ ...prev, isMuted: !prev.isMuted }) : null);
    };

    const handleToggleUserMic = () => {
        if (!podcast) return;
        setPodcast(prev => {
            if (!prev) return null;
            const nextMic = !prev.userMicMuted;
            return {
                ...prev,
                userMicMuted: nextMic,
                stageSpeakers: prev.stageSpeakers.map(spk => 
                    spk.wallet === currentDisplayWallet ? { ...spk, isSpeaking: !nextMic } : spk
                )
            };
        });
    };

    const handleUpvotePodcast = () => {
        if (!podcast) return;
        setPodcast(prev => {
            if (!prev) return null;
            return {
                ...prev,
                upvotes: prev.userUpvoted ? Math.max(0, prev.upvotes - 1) : prev.upvotes + 1,
                userUpvoted: !prev.userUpvoted
            };
        });
    };

    const handleReaction = (type: 'alpha' | 'fire' | 'bullish' | 'insight') => {
        if (!podcast) return;
        setPodcast(prev => {
            if (!prev) return null;
            const stats = prev.reactionStats || { alpha: 42, fire: 89, bullish: 74, insight: 35 };
            return {
                ...prev,
                reactionStats: {
                    ...stats,
                    [type]: stats[type] + 1
                }
            };
        });
    };

    const handleSendPodcastChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!podcastChatInput.trim() || !podcast) return;

        const now = Date.now();
        if (now - lastChatSentAt < PODCAST_CHAT_COOLDOWN_MS) {
            return;
        }

        const trimmedMsg = podcastChatInput.trim().slice(0, PODCAST_CHAT_MAX_LENGTH);
        if (!trimmedMsg) return;

        setLastChatSentAt(now);

        const newMsg = {
            id: `msg-${Date.now()}`,
            authorWallet: currentDisplayWallet,
            tier: userTier,
            isVip: isUserPro,
            message: trimmedMsg,
            timestamp: 'Just now'
        };

        try {
            api.post('/api/community/podcast/chat', newMsg);
        } catch (_) {}

        setPodcast(prev => {
            if (!prev) return null;
            return {
                ...prev,
                liveChat: [newMsg, ...prev.liveChat].slice(0, PODCAST_CHAT_MAX_MESSAGES)
            };
        });
        setPodcastChatInput('');
    };

    const handleRequestStageMic = () => {
        if (!isUserPro) {
            Swal.fire({
                title: 'STAGE SPEAKING GATED',
                html: DOMPurify.sanitize(`
                    <div class="text-left py-2 text-xs text-alphabag-subtext leading-relaxed">
                        <p class="mb-3 text-alphabag-text"><strong>Listeners can listen, upvote, and comment in live chat.</strong></p>
                        <p class="mb-3">To join the stage as a live speaker or ask audio questions, hold:</p>
                        <div class="p-3 bg-alphabag-black rounded-lg border border-alphabag-yellow/30 text-alphabag-yellow font-mono space-y-1">
                            <div>• <strong>10,000 $BAG Tokens</strong> OR</div>
                            <div>• <strong>1+ AlphaBAG Genesis Pass</strong></div>
                        </div>
                    </div>
                `, { ADD_ATTR: ['class'] }),
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'MINT PASS / UPGRADE',
                cancelButtonText: 'CONTINUE LISTENING',
                confirmButtonColor: '#F0B90B',
                background: '#181A20',
                color: '#EAECEF'
            }).then(r => {
                if (r.isConfirmed) {
                    window.location.hash = '#/airdrop';
                }
            });
            return;
        }

        // Pro user: Instant stage elevation
        setPodcast(prev => {
            if (!prev) return null;
            const alreadyOn = prev.stageSpeakers.some(s => s.wallet === currentDisplayWallet);
            if (alreadyOn) return prev;
            return {
                ...prev,
                isListening: true,
                userOnStage: true,
                userMicMuted: false,
                stageSpeakers: [
                    ...prev.stageSpeakers,
                    {
                        wallet: currentDisplayWallet,
                        name: userTier === 'ALPHA_VIP' ? 'VIP Contributor' : 'Analyst Speaker',
                        isHost: false,
                        isSpeaking: true,
                        tier: userTier
                    }
                ]
            };
        });

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'YOU ARE ON STAGE',
            text: 'Your microphone is now live on the broadcast stage.',
            showConfirmButton: false,
            timer: 3500,
            background: '#181A20',
            color: '#EAECEF'
        });
    };

    const handleLaunchAudioSpace = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSpaceTitle.trim() || !newSpaceTopic.trim()) {
            Swal.fire({
                title: 'Missing Details',
                text: 'Please provide a title and topic for your live audio space.',
                icon: 'warning',
                background: '#181A20',
                color: '#EAECEF'
            });
            return;
        }

        const newSpace: LivePodcastState = {
            isLive: true,
            title: newSpaceTitle.trim(),
            topic: `${newSpaceTicker.toUpperCase()} • ${newSpaceTopic.trim()}`,
            hostName: currentDisplayWallet,
            hostWallet: currentDisplayWallet,
            listenersCount: 1,
            isListening: true,
            isMuted: false,
            userMicMuted: false,
            userOnStage: true,
            stageSpeakers: [
                {
                    wallet: currentDisplayWallet,
                    name: 'Stage Host',
                    isHost: true,
                    isSpeaking: true,
                    tier: userTier
                }
            ],
            liveChat: [
                {
                    id: `msg-${Date.now()}`,
                    authorWallet: currentDisplayWallet,
                    tier: userTier,
                    isVip: true,
                    message: `Live Space "${newSpaceTitle.trim()}" started! Community members are welcome to join.`,
                    timestamp: 'Just now'
                }
            ],
            upvotes: 1,
            userUpvoted: true,
            reactionStats: {
                alpha: 1,
                fire: 1,
                bullish: 1,
                insight: 1
            }
        };

        try {
            api.post('/api/community/podcast/start', newSpace);
        } catch (_) {}

        setPodcast(newSpace);
        setIsHostSpaceModalOpen(false);
        setNewSpaceTitle('');
        setNewSpaceTopic('');

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'LIVE STAGE STARTED',
            text: 'Your community audio discussion is now on air.',
            showConfirmButton: false,
            timer: 3500,
            background: '#181A20',
            color: '#EAECEF'
        });
    };

    // ── RENDER ───────────────────────────────────────────────────────────────

    return (
        <div className="w-full space-y-3 pb-8 animate-in fade-in duration-500">
            
            {/* ── HEADER CARD ── */}
            <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <PageIcon name="feed" size={40} />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-alphabag-text tracking-tight flex items-center gap-2">
                                Alpha Feed
                            </h1>
                            <div className="flex items-center gap-2 text-[11px] text-alphabag-subtext">
                                <span>Web3 Trader Community: Reddit-Style Due Diligence, Live Audio Stages & Real-Time Alpha</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setPrivacyMode(p => !p)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                            privacyMode 
                                ? 'bg-alphabag-green/10 text-alphabag-green border-alphabag-green/30 hover:bg-alphabag-green/20'
                                : 'bg-alphabag-gray text-alphabag-subtext border-alphabag-gray hover:text-alphabag-text'
                        }`}
                        title="Decentralized Privacy: Zero trackers, masked balances, pseudonymous wallet identity"
                    >
                        {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span>{privacyMode ? 'Privacy Shield Active' : 'Public Wallet'}</span>
                    </button>

                    <button
                        onClick={() => setIsHostSpaceModalOpen(true)}
                        className="bg-alphabag-darkgray hover:bg-alphabag-gray text-alphabag-yellow border border-alphabag-yellow/40 px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                        title="Start a Live Audio Stage for your community"
                    >
                        <Radio size={15} />
                        <span>Host Audio Space</span>
                    </button>

                    <button
                        onClick={() => setIsComposerOpen(true)}
                        className="bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                    >
                        <Plus size={15} />
                        <span>Start Discussion</span>
                    </button>
                </div>
            </div>

            {/* ── LIVE AUDIO PODCAST / SPACE CARD ── */}
            {podcast && podcast.isLive ? (
                <div className="rounded-2xl border border-alphabag-yellow/40 bg-gradient-to-r from-alphabag-darkgray via-[#16181D] to-alphabag-darkgray p-4 md:p-5 relative overflow-hidden shadow-lg">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                    LIVE AUDIO STAGE
                                </span>
                                <span className="text-[11px] text-alphabag-subtext font-medium flex items-center gap-1">
                                    <strong className="text-alphabag-text tabular-nums">{podcast.listenersCount}</strong> Listening
                                </span>
                                <span className="bg-alphabag-gray text-alphabag-subtext px-2 py-0.5 rounded text-[11px] uppercase font-semibold">
                                    Community Stage Open
                                </span>
                                {podcast.userOnStage && (
                                    <span className="bg-alphabag-green/20 text-alphabag-green border border-alphabag-green/40 px-2 py-0.5 rounded text-[11px] font-bold uppercase">
                                        You are a Speaker
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg md:text-xl font-bold text-alphabag-text leading-snug">
                                {podcast.title}
                            </h3>
                            <p className="text-xs text-alphabag-subtext font-medium">
                                Topic: {podcast.topic} • Host: <strong className="text-alphabag-yellow">{podcast.hostName}</strong> ({podcast.hostWallet})
                            </p>

                            {/* Stage Speakers row */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="text-[11px] uppercase font-semibold text-alphabag-subtext flex items-center gap-1">
                                    <Users size={12} />
                                    Stage Speakers:
                                </span>
                                {podcast.stageSpeakers.map((spk, i) => (
                                    <div 
                                        key={i} 
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                                            spk.isSpeaking 
                                                ? 'bg-alphabag-yellow/15 text-alphabag-yellow border-alphabag-yellow/60 shadow-sm animate-pulse'
                                                : 'bg-alphabag-black text-alphabag-subtext border-alphabag-gray'
                                        }`}
                                    >
                                        <Mic size={11} className={spk.isSpeaking ? 'text-alphabag-yellow' : 'text-alphabag-subtext'} />
                                        <span>{spk.name}</span>
                                        {spk.isHost && (
                                            <span className="bg-alphabag-yellow text-alphabag-dark text-[11px] font-bold px-1 rounded">
                                                HOST
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stage Controls */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                            {podcast.isListening && (
                                <div className="flex items-center gap-1.5 px-3 py-2 bg-alphabag-black border border-alphabag-yellow/40 rounded-lg justify-center">
                                    <div className="w-1 bg-alphabag-yellow h-3 animate-pulse rounded-full" />
                                    <div className="w-1 bg-alphabag-yellow h-5 animate-pulse rounded-full" style={{ animationDelay: '0.15s' }} />
                                    <div className="w-1 bg-alphabag-yellow h-2 animate-pulse rounded-full" style={{ animationDelay: '0.3s' }} />
                                    <div className="w-1 bg-alphabag-yellow h-6 animate-pulse rounded-full" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-1 bg-alphabag-yellow h-4 animate-pulse rounded-full" style={{ animationDelay: '0.4s' }} />
                                    <span className="text-[11px] text-alphabag-yellow font-bold uppercase ml-1.5 font-mono">ON-AIR</span>
                                </div>
                            )}

                            {/* Listen / Leave */}
                            <button
                                onClick={handleToggleListenPodcast}
                                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                    podcast.isListening
                                        ? 'bg-alphabag-gray text-alphabag-text hover:bg-alphabag-gray/80 border border-alphabag-gray'
                                        : 'bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] shadow-md active:scale-95'
                                }`}
                            >
                                <Radio size={14} className={podcast.isListening ? 'animate-spin' : ''} />
                                <span>{podcast.isListening ? 'LEAVE STAGE' : 'TUNE IN LIVE'}</span>
                            </button>

                            {/* Audio Mute toggle if listening */}
                            {podcast.isListening && (
                                <button
                                    onClick={handleToggleMuteBroadcast}
                                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                                        podcast.isMuted
                                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                            : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'
                                    }`}
                                    title={podcast.isMuted ? 'Unmute Room Audio' : 'Mute Room Audio'}
                                >
                                    {podcast.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                                </button>
                            )}

                            {/* User Mic toggle if on stage */}
                            {podcast.userOnStage ? (
                                <button
                                    onClick={handleToggleUserMic}
                                    className={`px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                                        podcast.userMicMuted
                                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                            : 'bg-alphabag-green/20 text-alphabag-green border-alphabag-green/40 animate-pulse'
                                    }`}
                                    title={podcast.userMicMuted ? 'Click to Unmute Mic' : 'Click to Mute Mic'}
                                >
                                    {podcast.userMicMuted ? <MicOff size={14} /> : <Mic size={14} />}
                                    <span>{podcast.userMicMuted ? 'Mic Muted' : 'Speaking Live'}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleRequestStageMic}
                                    className="px-3 py-2.5 rounded-lg text-xs font-semibold bg-alphabag-black border border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text hover:border-alphabag-yellow/40 flex items-center justify-center gap-1.5 transition-all"
                                    title={isUserPro ? 'Request Mic on Stage' : 'Stage Speaking is for Premium Tier'}
                                >
                                    <Hand size={14} className="text-alphabag-yellow" />
                                    <span>Raise Hand</span>
                                    {!isUserPro && <Lock size={11} className="text-alphabag-subtext" />}
                                </button>
                            )}

                            {/* Upvote Space */}
                            <button
                                onClick={handleUpvotePodcast}
                                className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                                    podcast.userUpvoted
                                        ? 'bg-alphabag-yellow/20 text-alphabag-yellow border-alphabag-yellow'
                                        : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'
                                }`}
                                title="Upvote Live Discussion"
                            >
                                <ThumbsUp size={14} />
                                <span className="tabular-nums font-mono text-xs">{podcast.upvotes}</span>
                            </button>
                        </div>
                    </div>

                    {/* Interactive chat & reactions section when listening */}
                    {podcast.isListening && (
                        <div className="mt-4 pt-4 border-t border-alphabag-gray/60 space-y-3 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
                                <span className="font-semibold text-alphabag-text uppercase text-[11px] flex items-center gap-1.5">
                                    <MessageCircle size={13} className="text-alphabag-yellow" />
                                    Live Stage Chat & Q&A
                                </span>

                                {/* Quick Stage Reactions */}
                                <div className="flex items-center gap-1">
                                    <span className="text-[11px] text-alphabag-subtext uppercase font-semibold mr-1">Reactions:</span>
                                    <button
                                        onClick={() => handleReaction('bullish')}
                                        className="bg-alphabag-black hover:bg-alphabag-gray border border-alphabag-gray rounded px-2 py-0.5 text-[11px] font-mono text-alphabag-green flex items-center gap-1 transition-all"
                                    >
                                        <TrendingUp size={11} />
                                        <span>{podcast.reactionStats?.bullish ?? 74}</span>
                                    </button>
                                    <button
                                        onClick={() => handleReaction('fire')}
                                        className="bg-alphabag-black hover:bg-alphabag-gray border border-alphabag-gray rounded px-2 py-0.5 text-[11px] font-mono text-alphabag-yellow flex items-center gap-1 transition-all"
                                    >
                                        <Flame size={11} />
                                        <span>{podcast.reactionStats?.fire ?? 89}</span>
                                    </button>
                                    <button
                                        onClick={() => handleReaction('alpha')}
                                        className="bg-alphabag-black hover:bg-alphabag-gray border border-alphabag-gray rounded px-2 py-0.5 text-[11px] font-mono text-alphabag-yellow flex items-center gap-1 transition-all"
                                    >
                                        <Zap size={11} />
                                        <span>{podcast.reactionStats?.alpha ?? 42}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                                {podcast.liveChat.length > 0 ? (
                                    podcast.liveChat.map((msg) => (
                                        <div key={msg.id} className="bg-alphabag-black/60 border border-alphabag-gray/50 rounded p-2 flex items-start gap-2">
                                            <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold uppercase shrink-0 ${
                                                msg.isVip ? 'bg-alphabag-yellow/20 text-alphabag-yellow' : 'bg-alphabag-gray text-alphabag-subtext'
                                            }`}>
                                                {msg.tier}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-mono text-[11px] text-alphabag-subtext mr-1.5">{msg.authorWallet}:</span>
                                                <span className="text-alphabag-text leading-relaxed">{msg.message}</span>
                                            </div>
                                            <span className="text-[11px] text-alphabag-subtext shrink-0">{msg.timestamp}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-2 text-alphabag-subtext text-[11px]">No chat messages yet. Drop your question below!</div>
                                )}
                            </div>

                            <form onSubmit={handleSendPodcastChat} className="flex gap-2">
                                <input
                                    type="text"
                                    value={podcastChatInput}
                                    onChange={(e) => setPodcastChatInput(e.target.value)}
                                    placeholder="Ask a question or share alpha with the speakers..."
                                    className="flex-1 bg-alphabag-black border border-alphabag-gray rounded-lg px-3 py-2 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                />
                                <button
                                    type="submit"
                                    disabled={!podcastChatInput.trim()}
                                    className="bg-alphabag-yellow disabled:opacity-40 text-alphabag-dark font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1 shrink-0 hover:bg-[#e0bd2e]"
                                >
                                    <Send size={13} />
                                    <span>Send</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            ) : (
                /* No Active Space Banner: Quick prompt to start one */
                <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-alphabag-yellow/10 border border-alphabag-yellow/30 flex items-center justify-center text-alphabag-yellow">
                            <Radio size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-alphabag-text">Live Community Audio Spaces</h4>
                            <p className="text-xs text-alphabag-subtext">Host an AMA, debate tokenomics, or run real-time trading calls with the AlphaBAG community.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsHostSpaceModalOpen(true)}
                        className="bg-alphabag-yellow text-alphabag-dark font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 hover:bg-[#e0bd2e]"
                    >
                        <Radio size={14} />
                        <span>Go Live Now</span>
                    </button>
                </div>
            )}

            {/* ── CHANNEL FILTER PILLS & DISCOVERY CONTROLS ── */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {[
                        { id: 'ALL', label: 'All Discussions', icon: MessageSquare },
                        { id: 'TOKENOMICS', label: 'Tokenomics & Vesting', icon: Coins },
                        { id: 'UTILITY', label: 'Utility & Yield', icon: Zap },
                        { id: 'PROJECT_REVIEW', label: 'Project Reviews', icon: Layers },
                        { id: 'ALPHA_CALL', label: 'Alpha Calls', icon: Target },
                        { id: 'AUDIT_SECURITY', label: 'Security & Audits', icon: Shield },
                        { id: 'MEMECOIN_ROTATION', label: 'Memecoin Rotation', icon: Flame },
                    ].map(ch => {
                        const Icon = ch.icon;
                        const active = selectedCategory === ch.id;
                        return (
                            <button
                                key={ch.id}
                                onClick={() => setSelectedCategory(ch.id as DiscussionCategory)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                                    active
                                        ? 'bg-alphabag-yellow text-alphabag-dark font-bold border-alphabag-yellow shadow-sm'
                                        : 'bg-alphabag-darkgray text-alphabag-subtext border-alphabag-gray hover:text-alphabag-text hover:border-alphabag-subtext/40'
                                }`}
                            >
                                <Icon size={13} />
                                <span>{ch.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative flex-1 md:w-56">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-alphabag-subtext" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by $TICKER or keyword..."
                            className="w-full bg-alphabag-darkgray border border-alphabag-gray rounded-lg pl-8 pr-3 py-1.5 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                        />
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-alphabag-darkgray border border-alphabag-gray text-alphabag-text rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-alphabag-yellow"
                    >
                        <option value="HOT">Hot Debates</option>
                        <option value="TOP">Top Voted</option>
                        <option value="DEBATED">Most Discussed</option>
                        <option value="LATEST">Latest</option>
                    </select>
                </div>
            </div>

            {/* ── MAIN CONTENT GRID (REDDIT-STYLE FEED + COMMUNITY SIDEBAR) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                
                {/* ── LEFT COLUMN: DISCUSSIONS FEED (8 COLS) ── */}
                <div className="lg:col-span-8 space-y-3">
                    
                    {/* IN-FEED SPONSORED ADS */}
                    {sponsoredAd && (
                        <div className="rounded-xl border border-alphabag-yellow/30 bg-gradient-to-r from-alphabag-darkgray via-[#161616] to-alphabag-darkgray p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-alphabag-yellow/10 border border-alphabag-yellow/30 flex items-center justify-center text-alphabag-yellow shrink-0">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-alphabag-yellow/15 text-alphabag-yellow px-2 py-0.2 rounded text-[11px] font-bold uppercase tracking-wider border border-alphabag-yellow/20">
                                            SPONSORED
                                        </span>
                                        <h4 className="text-xs font-bold text-alphabag-text">{sponsoredAd.partnerName}</h4>
                                    </div>
                                    <p className="text-[11px] text-alphabag-subtext mt-0.5 leading-relaxed">
                                        {sponsoredAd.tagline}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={sponsoredAd.ctaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all"
                            >
                                <span>{sponsoredAd.ctaText}</span>
                                <ArrowUpRight size={13} />
                            </a>
                        </div>
                    )}

                    {/* DISCUSSION CARDS */}
                    {isLoading ? (
                        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-12 text-center space-y-3">
                            <Loader2 size={24} className="animate-spin text-alphabag-yellow mx-auto" />
                            <p className="text-xs text-alphabag-subtext">Loading live community discussions...</p>
                        </div>
                    ) : filteredDiscussions.length > 0 ? (
                        filteredDiscussions.map((post) => {
                            const isExpanded = expandedComments.has(post.id);
                            const draft = commentDrafts[post.id] || '';
                            const sentimentDraft = commentSentiments[post.id] || 'NEUTRAL';
                            const targetReplyId = replyingTo[post.id];
                            const isShareOpen = activeShareId === post.id;
                            const isCopied = copiedShareId === post.id;
                            const netScore = post.upvotes - post.downvotes;

                            return (
                                <div 
                                    key={post.id} 
                                    className={`rounded-2xl border bg-alphabag-darkgray p-4 md:p-5 transition-all space-y-3 relative ${
                                        post.isPinned ? 'border-alphabag-yellow/40 shadow-sm' : 'border-alphabag-gray hover:border-alphabag-subtext/30'
                                    }`}
                                >
                                    {/* Post Header Bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-alphabag-gray/50 text-xs">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {post.isPinned && (
                                                <span className="bg-alphabag-yellow text-alphabag-dark text-[11px] font-bold uppercase px-2 py-0.5 rounded">
                                                    PINNED
                                                </span>
                                            )}
                                            <span className="bg-alphabag-black border border-alphabag-gray text-alphabag-yellow font-bold font-mono px-2 py-0.5 rounded text-[11px]">
                                                {post.ticker}
                                            </span>
                                            <span className="bg-alphabag-gray text-alphabag-subtext px-2 py-0.5 rounded text-[11px] font-semibold uppercase">
                                                {post.category.replace('_', ' ')}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                                                post.sentiment === 'BULLISH'
                                                    ? 'bg-alphabag-green/10 text-alphabag-green border-alphabag-green/30'
                                                    : post.sentiment === 'BEARISH'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                                    : 'bg-alphabag-gray text-alphabag-subtext border-alphabag-gray'
                                            }`}>
                                                {post.sentiment}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[11px] text-alphabag-subtext font-mono">
                                            <span>by <strong className="text-alphabag-text">{post.authorWallet}</strong></span>
                                            <span className="bg-alphabag-gray px-1.5 py-0.2 rounded text-[11px] font-semibold uppercase text-alphabag-subtext">
                                                {post.authorTier}
                                            </span>
                                            <span>•</span>
                                            <span>{new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    {/* Post Title */}
                                    <h3 className="text-base md:text-lg font-bold text-alphabag-text leading-snug">
                                        {post.title}
                                    </h3>

                                    {/* Post Body Content */}
                                    <p className="text-xs md:text-sm text-alphabag-subtext whitespace-pre-line leading-relaxed">
                                        {post.content}
                                    </p>

                                    {/* Token Key Metrics Card */}
                                    {post.tokenMetrics && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-alphabag-black/70 border border-alphabag-gray rounded-xl p-3 text-center">
                                            {post.tokenMetrics.marketCap && (
                                                <div>
                                                    <div className="text-[11px] uppercase font-semibold text-alphabag-subtext">Market Cap</div>
                                                    <div className="text-xs font-semibold text-alphabag-text font-mono mt-0.5">{post.tokenMetrics.marketCap}</div>
                                                </div>
                                            )}
                                            {post.tokenMetrics.fdv && (
                                                <div>
                                                    <div className="text-[11px] uppercase font-semibold text-alphabag-subtext">Target FDV</div>
                                                    <div className="text-xs font-semibold text-alphabag-yellow font-mono mt-0.5">{post.tokenMetrics.fdv}</div>
                                                </div>
                                            )}
                                            {post.tokenMetrics.circulatingSupply && (
                                                <div>
                                                    <div className="text-[11px] uppercase font-semibold text-alphabag-subtext">Circulating %</div>
                                                    <div className="text-xs font-semibold text-alphabag-text font-mono mt-0.5">{post.tokenMetrics.circulatingSupply}</div>
                                                </div>
                                            )}
                                            {post.tokenMetrics.unlockDate && (
                                                <div>
                                                    <div className="text-[11px] uppercase font-semibold text-alphabag-subtext">Unlock Schedule</div>
                                                    <div className="text-xs font-semibold text-alphabag-green font-mono mt-0.5">{post.tokenMetrics.unlockDate}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Reddit-Style Bottom Action Bar (Upvote, Comments, Insightful, Share) */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-alphabag-gray/50 text-xs">
                                        <div className="flex items-center gap-2">
                                            
                                            {/* Reddit Upvote / Downvote Module */}
                                            <div className="flex items-center bg-alphabag-black border border-alphabag-gray rounded-lg p-0.5">
                                                <button
                                                    onClick={() => handleVoteDiscussion(post.id, 'UP')}
                                                    className={`p-1.5 rounded transition-all ${
                                                        post.userVoted === 'UP'
                                                            ? 'bg-alphabag-yellow text-alphabag-dark font-bold'
                                                            : 'text-alphabag-subtext hover:text-alphabag-text'
                                                    }`}
                                                    title="Upvote Analysis"
                                                >
                                                    <ThumbsUp size={13} />
                                                </button>

                                                <span className={`px-2 text-xs font-mono font-bold tabular-nums ${
                                                    netScore > 0 
                                                        ? 'text-alphabag-yellow' 
                                                        : netScore < 0 
                                                        ? 'text-red-400' 
                                                        : 'text-alphabag-subtext'
                                                }`}>
                                                    {netScore > 0 ? `+${netScore}` : netScore}
                                                </span>

                                                <button
                                                    onClick={() => handleVoteDiscussion(post.id, 'DOWN')}
                                                    className={`p-1.5 rounded transition-all ${
                                                        post.userVoted === 'DOWN'
                                                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                                            : 'text-alphabag-subtext hover:text-alphabag-text'
                                                    }`}
                                                    title="Downvote"
                                                >
                                                    <ThumbsDown size={13} />
                                                </button>
                                            </div>

                                            {/* Comments Toggle */}
                                            <button
                                                onClick={() => toggleComments(post.id)}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                    isExpanded
                                                        ? 'bg-alphabag-black border-alphabag-yellow text-alphabag-yellow'
                                                        : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'
                                                }`}
                                            >
                                                <MessageSquare size={13} />
                                                <span>{post.comments.length} Comments</span>
                                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                            </button>

                                            {/* Insightful / Like Button */}
                                            <button
                                                onClick={() => handleToggleInsightful(post.id)}
                                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                    post.isInsightful
                                                        ? 'bg-alphabag-yellow/15 border-alphabag-yellow/40 text-alphabag-yellow shadow-sm'
                                                        : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'
                                                }`}
                                                title="Mark as Insightful Research"
                                            >
                                                <Sparkles size={12} className={post.isInsightful ? 'text-alphabag-yellow' : ''} />
                                                <span className="text-[11px]">{post.insightfulCount} Insightful</span>
                                            </button>

                                            {/* SHARE BUTTON & POPOVER */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => handleSharePost(post)}
                                                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                        isShareOpen
                                                            ? 'bg-alphabag-yellow text-alphabag-dark font-bold border-alphabag-yellow'
                                                            : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'
                                                    }`}
                                                    title="Share Post"
                                                >
                                                    <Share2 size={13} />
                                                    <span>Share</span>
                                                </button>

                                                {/* Share Dropdown Menu */}
                                                {isShareOpen && (
                                                    <div className="absolute left-0 bottom-full mb-2 w-52 bg-alphabag-black border border-alphabag-gray rounded-xl p-2 shadow-xl z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                                                        <button
                                                            onClick={() => handleCopyPostLink(post)}
                                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-alphabag-text hover:bg-alphabag-gray transition-colors"
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                {isCopied ? <Check size={13} className="text-alphabag-green" /> : <Copy size={13} />}
                                                                <span>{isCopied ? 'Link Copied!' : 'Copy Link'}</span>
                                                            </span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleTwitterShare(post)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-alphabag-text hover:bg-alphabag-gray transition-colors"
                                                        >
                                                            <Twitter size={13} className="text-sky-400" />
                                                            <span>Share to X (Twitter)</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-[11px] text-alphabag-subtext">
                                            <span>Community Due Diligence</span>
                                        </div>
                                    </div>

                                    {/* ── EXPANDABLE NESTED COMMENT THREADS ── */}
                                    {isExpanded && (
                                        <div className="pt-3 border-t border-alphabag-gray/50 space-y-3 animate-in fade-in duration-300">
                                            {/* Top-level Comment Composer */}
                                            <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-3 space-y-2">
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="font-semibold text-alphabag-text">
                                                        {targetReplyId ? 'Replying to comment thread...' : 'Join the discussion'}
                                                    </span>
                                                    {targetReplyId && (
                                                        <button 
                                                            onClick={() => setReplyingTo(p => ({ ...p, [post.id]: null }))}
                                                            className="text-alphabag-yellow hover:underline text-[11px]"
                                                        >
                                                            Cancel Reply
                                                        </button>
                                                    )}
                                                </div>

                                                <textarea
                                                    value={draft}
                                                    onChange={(e) => setCommentDrafts(p => ({ ...p, [post.id]: e.target.value }))}
                                                    placeholder="Share your perspective, counter-analysis, or questions..."
                                                    rows={2}
                                                    className="w-full bg-alphabag-darkgray border border-alphabag-gray rounded-lg p-2.5 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow resize-none"
                                                />

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1">
                                                        {(['BULLISH', 'BEARISH', 'NEUTRAL'] as DiscussionSentiment[]).map(st => (
                                                            <button
                                                                key={st}
                                                                type="button"
                                                                onClick={() => setCommentSentiments(p => ({ ...p, [post.id]: st }))}
                                                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                                                                    sentimentDraft === st
                                                                        ? 'bg-alphabag-yellow text-alphabag-dark font-bold border-alphabag-yellow'
                                                                        : 'bg-alphabag-darkgray text-alphabag-subtext border-alphabag-gray'
                                                                }`}
                                                            >
                                                                {st}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddComment(post.id)}
                                                        disabled={!draft.trim()}
                                                        className="bg-alphabag-yellow text-alphabag-dark disabled:opacity-40 font-bold px-3 py-1 rounded-md text-xs uppercase tracking-wider flex items-center gap-1"
                                                    >
                                                        <Send size={11} />
                                                        <span>Post Comment</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Render Threaded Comments */}
                                            {post.comments.length > 0 ? (
                                                <div className="space-y-2.5">
                                                    {post.comments.map((comm) => (
                                                        <div key={comm.id} className="bg-alphabag-black/50 border border-alphabag-gray/60 rounded-xl p-3 space-y-2 text-xs">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-alphabag-text font-semibold">{comm.authorWallet}</span>
                                                                    <span className="bg-alphabag-gray text-alphabag-subtext px-1.5 py-0.2 rounded text-[11px] font-semibold uppercase">
                                                                        {comm.authorTier}
                                                                    </span>
                                                                    {comm.sentiment && (
                                                                        <span className={`text-[11px] font-bold ${
                                                                            comm.sentiment === 'BULLISH' ? 'text-alphabag-green' : comm.sentiment === 'BEARISH' ? 'text-red-400' : 'text-alphabag-subtext'
                                                                        }`}>
                                                                            {comm.sentiment}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-alphabag-subtext">
                                                                    {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>

                                                            <p className="text-alphabag-subtext leading-relaxed pl-1">
                                                                {comm.content}
                                                            </p>

                                                            {/* Comment Actions (Reply, Upvote) */}
                                                            <div className="flex items-center gap-3 pt-1 text-[11px] text-alphabag-subtext">
                                                                <button 
                                                                    onClick={() => setReplyingTo(p => ({ ...p, [post.id]: comm.id }))}
                                                                    className="text-alphabag-yellow hover:underline font-semibold flex items-center gap-1"
                                                                >
                                                                    <MessageCircle size={11} />
                                                                    <span>Reply</span>
                                                                </button>
                                                                <span>•</span>
                                                                <button
                                                                    onClick={() => handleUpvoteComment(post.id, comm.id)}
                                                                    className={`hover:text-alphabag-text flex items-center gap-1 tabular-nums ${
                                                                        comm.userVoted === 'UP' ? 'text-alphabag-yellow font-bold' : ''
                                                                    }`}
                                                                >
                                                                    <ThumbsUp size={11} />
                                                                    <span>{comm.upvotes} upvotes</span>
                                                                </button>
                                                            </div>

                                                            {/* Nested Replies with Reddit Tree Line */}
                                                            {comm.replies && comm.replies.length > 0 && (
                                                                <div className="ml-2 pl-3 border-l-2 border-alphabag-gray/60 space-y-2 pt-2">
                                                                    {comm.replies.map(rep => (
                                                                        <div key={rep.id} className="bg-alphabag-darkgray/60 rounded-lg p-2.5 text-xs space-y-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-mono text-alphabag-text font-semibold text-[11px]">{rep.authorWallet}</span>
                                                                                    <span className="bg-alphabag-gray text-alphabag-subtext px-1 py-0.2 rounded text-[11px] uppercase">{rep.authorTier}</span>
                                                                                </div>
                                                                                <span className="text-[11px] text-alphabag-subtext">
                                                                                    {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-alphabag-subtext text-[11px] leading-relaxed">{rep.content}</p>
                                                                            <div className="flex items-center gap-2 pt-1 text-[11px]">
                                                                                <button
                                                                                    onClick={() => handleUpvoteComment(post.id, rep.id)}
                                                                                    className={`text-alphabag-subtext hover:text-alphabag-text flex items-center gap-1 ${
                                                                                        rep.userVoted === 'UP' ? 'text-alphabag-yellow font-bold' : ''
                                                                                    }`}
                                                                                >
                                                                                    <ThumbsUp size={10} />
                                                                                    <span>{rep.upvotes}</span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-xs text-alphabag-subtext">
                                                    No comments yet. Be the first to share your perspective!
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-12 text-center space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-alphabag-gray flex items-center justify-center text-alphabag-subtext mx-auto">
                                <Search size={24} />
                            </div>
                            <h3 className="text-base font-bold text-alphabag-text">No Discussions Found</h3>
                            <p className="text-xs text-alphabag-subtext max-w-sm mx-auto">
                                No community discussions match the selected filters. Start a new tokenomics or utility thread!
                            </p>
                            <button
                                onClick={() => setIsComposerOpen(true)}
                                className="bg-alphabag-yellow text-alphabag-dark px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider"
                            >
                                Start New Discussion
                            </button>
                        </div>
                    )}
                </div>

                {/* ── RIGHT COLUMN: COMMUNITY WIDGETS & LEADERBOARDS (4 COLS) ── */}
                <div className="lg:col-span-4 space-y-3">
                    
                    {/* HOST LIVE SPACE CTA CARD */}
                    <div className="rounded-2xl border border-alphabag-yellow/30 bg-gradient-to-b from-alphabag-darkgray to-alphabag-black p-4 space-y-3 shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="bg-alphabag-yellow text-alphabag-dark px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                                COMMUNITY RADIO
                            </span>
                            <Radio size={15} className="text-alphabag-yellow animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-alphabag-text">Host a Live Audio Stage</h3>
                            <p className="text-xs text-alphabag-subtext leading-relaxed mt-1">
                                Launch an interactive Clubhouse-style discussion room. Community members can tune in, listen, and request the stage mic to speak.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsHostSpaceModalOpen(true)}
                            className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                            <Radio size={14} />
                            <span>Launch Live Space</span>
                        </button>
                    </div>

                    {/* SPONSORED PARTNER CARD */}
                    {sponsoredAd && (
                        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 space-y-3 shadow-md relative overflow-hidden">
                            <div className="flex justify-between items-center">
                                <span className="bg-alphabag-gray text-alphabag-text px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border border-alphabag-subtext/30">
                                    {sponsoredAd.badge}
                                </span>
                                <span className="text-[11px] text-alphabag-subtext font-semibold uppercase">SPONSOR</span>
                            </div>

                            <div className="space-y-1.5">
                                <h3 className="text-sm font-bold text-alphabag-text">{sponsoredAd.partnerName}</h3>
                                <p className="text-xs text-alphabag-subtext leading-relaxed">
                                    {sponsoredAd.description}
                                </p>
                            </div>

                            <a
                                href={sponsoredAd.ctaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all block text-center shadow-sm"
                            >
                                <span>{sponsoredAd.ctaText}</span>
                                <ArrowUpRight size={13} />
                            </a>

                            <div className="pt-2 border-t border-alphabag-gray/50 flex justify-between items-center text-[11px] text-alphabag-subtext">
                                <span>Verified Web3 Ecosystem Ad</span>
                                <button
                                    onClick={() => setIsFounderFormOpen(true)}
                                    className="text-alphabag-yellow hover:underline font-semibold"
                                >
                                    Feature Your Project
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TRENDING TOKENS IN COMMUNITY */}
                    {trendingTopics.length > 0 && (
                        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-alphabag-gray">
                                <span className="text-xs font-semibold uppercase text-alphabag-subtext flex items-center gap-1.5">
                                    <Flame size={14} className="text-alphabag-yellow" />
                                    Trending Topics
                                </span>
                                <span className="text-[11px] font-semibold uppercase text-alphabag-yellow">24H Active</span>
                            </div>

                            <div className="space-y-2">
                                {trendingTopics.map((tr, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSearchQuery(tr.ticker)}
                                        className="w-full text-left bg-alphabag-black/50 hover:bg-alphabag-black border border-alphabag-gray rounded-xl p-2.5 transition-all flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold font-mono text-alphabag-yellow group-hover:underline">
                                                    {tr.ticker}
                                                </span>
                                                <span className="text-[11px] text-alphabag-green font-semibold">
                                                    {tr.sentiment}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-alphabag-subtext line-clamp-1 mt-0.5">
                                                {tr.topic}
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-alphabag-subtext font-mono shrink-0 pl-2">
                                            {tr.posts} posts
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TOP COMMUNITY ANALYSTS LEADERBOARD */}
                    {topAnalysts.length > 0 && (
                        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-alphabag-gray">
                                <span className="text-xs font-semibold uppercase text-alphabag-subtext flex items-center gap-1.5">
                                    <Award size={14} className="text-alphabag-yellow" />
                                    Top Alpha Callers
                                </span>
                                <span className="text-[11px] text-alphabag-subtext font-mono">By Upvotes</span>
                            </div>

                            <div className="space-y-2">
                                {topAnalysts.map((an, i) => (
                                    <div key={i} className="flex items-center justify-between bg-alphabag-black/50 border border-alphabag-gray rounded-xl p-2.5 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-alphabag-yellow/10 border border-alphabag-yellow/30 text-alphabag-yellow text-[11px] font-bold flex items-center justify-center">
                                                {an.rank}
                                            </span>
                                            <div>
                                                <div className="font-mono font-semibold text-alphabag-text text-[11px]">{an.wallet}</div>
                                                <div className="text-[11px] text-alphabag-subtext">{an.focus}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] font-mono text-alphabag-yellow font-semibold">{an.score}</span>
                                            <div className="text-[11px] text-alphabag-subtext uppercase">{an.tier}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PRIVACY & DYOR COMMUNITY MANIFESTO */}
                    <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-alphabag-yellow font-bold uppercase text-[11px]">
                            <Shield size={14} />
                            <span>Privacy & DYOR Manifesto</span>
                        </div>
                        <p className="text-[11px] text-alphabag-subtext leading-relaxed">
                            AlphaBAG Community Feed is a decentralized market intelligence network. No tracking, zero algorithm manipulation. All analyses are user-generated due diligence. Verify contract bytecode and DYOR.
                        </p>
                    </div>

                </div>
            </div>

            {/* ── START DISCUSSION COMPOSER MODAL ── */}
            {isComposerOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center pb-3 border-b border-alphabag-gray">
                            <div>
                                <span className="text-xs font-semibold uppercase text-alphabag-subtext">Community Research</span>
                                <h3 className="text-xl font-bold text-alphabag-text mt-0.5">Start a Project Analysis Thread</h3>
                            </div>
                            <button
                                onClick={() => setIsComposerOpen(false)}
                                className="text-alphabag-subtext hover:text-alphabag-text text-lg font-bold p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateDiscussion} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-[11px] font-semibold uppercase text-alphabag-subtext">Discussion Title</label>
                                    <input
                                        type="text"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="e.g. Deep Dive into $BAG Tokenomics and Vesting..."
                                        required
                                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg p-2.5 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold uppercase text-alphabag-subtext">Cashtag / Ticker</label>
                                    <input
                                        type="text"
                                        value={newTicker}
                                        onChange={(e) => setNewTicker(e.target.value)}
                                        placeholder="$BAG"
                                        required
                                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg p-2.5 text-xs font-mono text-alphabag-yellow placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow uppercase"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold uppercase text-alphabag-subtext">Topic Channel</label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as any)}
                                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg p-2.5 text-xs text-alphabag-text focus:outline-none focus:border-alphabag-yellow font-semibold"
                                    >
                                        <option value="TOKENOMICS">Tokenomics & Vesting</option>
                                        <option value="UTILITY">Utility & Yield</option>
                                        <option value="PROJECT_REVIEW">Project Review & Fundamentals</option>
                                        <option value="ALPHA_CALL">Alpha Call & Due Diligence</option>
                                        <option value="AUDIT_SECURITY">Security & Audits</option>
                                        <option value="MEMECOIN_ROTATION">Memecoin Rotation</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold uppercase text-alphabag-subtext">Sentiment Stance</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {(['BULLISH', 'BEARISH', 'NEUTRAL'] as DiscussionSentiment[]).map(st => (
                                            <button
                                                key={st}
                                                type="button"
                                                onClick={() => setNewSentiment(st)}
                                                className={`py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                                                    newSentiment === st
                                                        ? 'bg-alphabag-yellow text-alphabag-dark border-alphabag-yellow shadow-sm font-bold'
                                                        : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'
                                                }`}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold uppercase text-alphabag-subtext">Detailed Analysis & Key Takeaways</label>
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="Write your in-depth thesis, token utility mechanics, smart contract breakdown, or risk notes..."
                                    rows={5}
                                    required
                                    className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg p-3 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow resize-none leading-relaxed"
                                />
                            </div>

                            <div className="space-y-2 pt-2 border-t border-alphabag-gray">
                                <span className="text-[11px] font-semibold uppercase text-alphabag-yellow">Optional: Tokenomics Key Metrics</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <input
                                        type="text"
                                        value={newMarketCap}
                                        onChange={(e) => setNewMarketCap(e.target.value)}
                                        placeholder="Market Cap ($4.2M)"
                                        className="bg-alphabag-black border border-alphabag-gray rounded p-2 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                    />
                                    <input
                                        type="text"
                                        value={newFdv}
                                        onChange={(e) => setNewFdv(e.target.value)}
                                        placeholder="Target FDV ($10M)"
                                        className="bg-alphabag-black border border-alphabag-gray rounded p-2 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                    />
                                    <input
                                        type="text"
                                        value={newCirculating}
                                        onChange={(e) => setNewCirculating(e.target.value)}
                                        placeholder="Circulating (42%)"
                                        className="bg-alphabag-black border border-alphabag-gray rounded p-2 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                    />
                                    <input
                                        type="text"
                                        value={newUnlock}
                                        onChange={(e) => setNewUnlock(e.target.value)}
                                        placeholder="Next Unlock (Month 12)"
                                        className="bg-alphabag-black border border-alphabag-gray rounded p-2 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                    />
                                </div>
                            </div>

                            <div className="bg-alphabag-black p-3 rounded-lg border border-alphabag-gray flex justify-between items-center text-xs">
                                <span className="text-alphabag-subtext font-mono">
                                    Posting as: <strong className="text-alphabag-yellow">{currentDisplayWallet}</strong> ({userTier})
                                </span>
                                <span className="text-[11px] text-alphabag-green font-semibold">
                                    Privacy Shield Protected
                                </span>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsComposerOpen(false)}
                                    className="px-4 py-2 bg-alphabag-gray text-alphabag-text rounded-lg text-xs font-bold uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm"
                                >
                                    Publish Discussion
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── HOST LIVE AUDIO SPACE MODAL ── */}
            {isHostSpaceModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl max-w-lg w-full p-5 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center pb-3 border-b border-alphabag-gray">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-alphabag-yellow/10 text-alphabag-yellow">
                                    <Radio size={20} />
                                </div>
                                <div>
                                    <span className="text-xs font-semibold uppercase text-alphabag-subtext">Community Radio</span>
                                    <h3 className="text-lg font-bold text-alphabag-text">Start Live Audio Stage</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsHostSpaceModalOpen(false)}
                                className="text-alphabag-subtext hover:text-alphabag-text text-lg font-bold p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleLaunchAudioSpace} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold uppercase text-alphabag-subtext">Space Room Title</label>
                                <input
                                    type="text"
                                    value={newSpaceTitle}
                                    onChange={(e) => setNewSpaceTitle(e.target.value)}
                                    placeholder="e.g. Whale Accumulation & DEX Liquidity Breakdown"
                                    required
                                    className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg p-2.5 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold uppercase text-alphabag-subtext">Focus Ticker</label>
                                    <input
                                        type="text"
                                        value={newSpaceTicker}
                                        onChange={(e) => setNewSpaceTicker(e.target.value)}
                                        placeholder="$BAG"
                                        required
                                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg p-2.5 text-xs font-mono text-alphabag-yellow uppercase placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold uppercase text-alphabag-subtext">Discussion Agenda</label>
                                    <input
                                        type="text"
                                        value={newSpaceTopic}
                                        onChange={(e) => setNewSpaceTopic(e.target.value)}
                                        placeholder="e.g. Q4 Tokenomics & On-Chain Shifts"
                                        required
                                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg p-2.5 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                    />
                                </div>
                            </div>

                            <div className="bg-alphabag-black p-3 rounded-lg border border-alphabag-gray space-y-1.5 text-xs">
                                <div className="flex justify-between items-center text-alphabag-subtext">
                                    <span>Host Identity:</span>
                                    <strong className="text-alphabag-yellow font-mono">{currentDisplayWallet}</strong>
                                </div>
                                <div className="flex justify-between items-center text-alphabag-subtext">
                                    <span>Stage Access:</span>
                                    <span className="text-alphabag-green font-semibold">Open Stage (Community Q&A)</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsHostSpaceModalOpen(false)}
                                    className="px-4 py-2 bg-alphabag-gray text-alphabag-text rounded-lg text-xs font-bold uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                                >
                                    <Radio size={14} />
                                    <span>Go Live on Stage</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── FOUNDER PROMOTION FORM MODAL ── */}
            <FounderListingForm
                isOpen={isFounderFormOpen}
                onClose={() => setIsFounderFormOpen(false)}
            />
        </div>
    );
};
