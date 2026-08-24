import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
    MessageSquare, Heart, Share2, MoreHorizontal, Shield, Zap, TrendingUp,
    Filter, Search, Plus, MessageCircle, Target, Image as ImageIcon,
    BarChart2, Smile, Calendar, MapPin, CheckCircle, Bookmark, BarChart,
    ExternalLink, Users, Rocket, Globe, Star, Radio, Mic, MicOff, Volume2,
    VolumeX, ThumbsUp, Sparkles, Award, Lock, Eye, EyeOff, Send, HelpCircle,
    ChevronDown, ChevronUp, AlertCircle, Coins, Layers, ArrowUpRight, Flame
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FounderListingForm } from '../../components/frontend/FounderListingForm';
import { useAuth } from '../../context/AuthContext';
import { PassTier } from '../../types';

// ── TYPES & ENUMS ────────────────────────────────────────────────────────────

export type DiscussionCategory = 
    | 'ALL' 
    | 'TOKENOMICS' 
    | 'UTILITY' 
    | 'PROJECT_REVIEW' 
    | 'ALPHA_CALL' 
    | 'AUDIT_SECURITY';

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
    sponsorData?: {
        partnerName: string;
        tagline: string;
        ctaText: string;
        ctaUrl: string;
        badge: string;
        logoUrl?: string;
    };
}

export interface LivePodcastState {
    isLive: boolean;
    title: string;
    topic: string;
    hostName: string;
    hostWallet: string;
    listenersCount: number;
    isListening: boolean;
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
}

// ── INITIAL DATA & SPONSORED ADS ─────────────────────────────────────────────

const SPONSORED_PARTNER_AD = {
    id: 'ad-pancakeswap-bag',
    partnerName: 'PancakeSwap & $BAG Liquidity Pool',
    tagline: 'Official $BAG/WBNB V3 Liquidity Pool is Live with 0.25% Fee Rebates.',
    description: 'Provide liquidity to earn transaction fees and boost your AlphaBAG ITEMS multiplier by 1.5x.',
    badge: 'VERIFIED ECOSYSTEM PARTNER',
    ctaText: 'TRADE ON PANCAKESWAP',
    ctaUrl: 'https://pancakeswap.finance',
    logoUrl: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png'
};

const INITIAL_DISCUSSIONS: DiscussionPost[] = [
    {
        id: 'disc-1',
        title: 'Deep Dive: $BAG Tokenomics & 100% T2E Treasury Distribution Model',
        ticker: '$BAG',
        category: 'TOKENOMICS',
        sentiment: 'BULLISH',
        content: `Analyzing the AlphaBAG tokenomics model: 0% team allocation tax, 100% of pass mint proceeds direct to community T2E treasury. With the 10,000 Genesis Pass hard cap, the deflationary buyback mechanism creates a sustainable runway for long-term intelligence staking.

Key observations:
1. Circulating float is strictly gated by on-chain activity.
2. 5% royalty fee from Element Market secondary sales auto-compounds the prize pool.
3. No seed investor unlock overhang compared to recent Tier-1 token launches.`,
        authorWallet: '0x42916A998c6Bff7F36bE61749Bd1BBA9f473dB96',
        authorTier: 'ALPHA_VIP',
        isPro: true,
        upvotes: 248,
        downvotes: 6,
        insightfulCount: 42,
        isPinned: true,
        tokenMetrics: {
            marketCap: '$4.2M (Projected)',
            fdv: '$10.0M',
            circulatingSupply: '42.5%',
            unlockDate: 'Zero Seed Unlocks (Fair T2E)'
        },
        comments: [
            {
                id: 'comm-1',
                authorWallet: '0x8b32...4e19',
                authorTier: 'PREMIUM',
                isPro: true,
                sentiment: 'BULLISH',
                content: 'The zero team-dump design is refreshing. Most 2026 launches have 70% insider vesting cliffs. The treasury burn on mint is the real catalyst.',
                upvotes: 45,
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                replies: [
                    {
                        id: 'rep-1',
                        authorWallet: '0x14f9...92ca',
                        authorTier: 'FREE',
                        isPro: false,
                        sentiment: 'NEUTRAL',
                        content: 'Agree on the vesting, but how will emissions scale if daily active users 10x? Does the ITEMS multiplier automatically adjust?',
                        upvotes: 18,
                        createdAt: new Date(Date.now() - 1800000).toISOString()
                    }
                ]
            },
            {
                id: 'comm-2',
                authorWallet: '0x992a...7710',
                authorTier: 'ALPHA_VIP',
                isPro: true,
                sentiment: 'BULLISH',
                content: 'Confirmed that the contract on BSC uses nonReentrant guards on the treasury transfer. Verified on BscScan.',
                upvotes: 31,
                createdAt: new Date(Date.now() - 7200000).toISOString()
            }
        ],
        createdAt: new Date(Date.now() - 10800000).toISOString()
    },
    {
        id: 'disc-2',
        title: 'Utility Breakdown: Why Real-time Whale Radar & Telegram Bot Outperform Standard Dashboards',
        ticker: '$BNB',
        category: 'UTILITY',
        sentiment: 'BULLISH',
        content: `Looking into the utility stack of the terminal. The automated whale wallet profiler flags smart money accumulation on BSC before DEX liquidity pools pump. 

Unlike traditional platforms charging $200/mo subscriptions in fiat, holding 10,000 $BAG gives permanent access without recurring credit card charges. What other features should we propose for the Q4 DAO vote?`,
        authorWallet: '0x71e3...a01f',
        authorTier: 'PREMIUM',
        isPro: true,
        upvotes: 185,
        downvotes: 4,
        insightfulCount: 29,
        tokenMetrics: {
            marketCap: '$84.5B',
            fdv: '$84.5B',
            circulatingSupply: '100%',
            unlockDate: 'Fully Circulating'
        },
        comments: [
            {
                id: 'comm-3',
                authorWallet: '0x3219...bb21',
                authorTier: 'FREE',
                isPro: false,
                sentiment: 'BULLISH',
                content: 'Being able to track smart money on BSC without paying monthly SaaS subscriptions is the main reason I use this terminal daily.',
                upvotes: 22,
                createdAt: new Date(Date.now() - 5400000).toISOString()
            }
        ],
        createdAt: new Date(Date.now() - 21600000).toISOString()
    },
    {
        id: 'disc-3',
        title: 'Project Fundamental Review: Zero-Knowledge Rollups vs. Modular Layer-2s in 2026',
        ticker: '$ETH',
        category: 'PROJECT_REVIEW',
        sentiment: 'NEUTRAL',
        content: `Conducting a comparative analysis between modular data availability layers and ZK-rollup frameworks. The fee compression on Layer 2s has shifted value capture from base layers to application utility tokens.

Would love community feedback on developer retention metrics across the top 5 EVM ecosystems.`,
        authorWallet: '0x5501...99ef',
        authorTier: 'FREE',
        isPro: false,
        upvotes: 112,
        downvotes: 8,
        insightfulCount: 19,
        comments: [],
        createdAt: new Date(Date.now() - 43200000).toISOString()
    },
    {
        id: 'disc-4',
        title: 'Audit Warning: Centralization Vector Detected in New High-Yield Staking DApp',
        ticker: '$YIELD',
        category: 'AUDIT_SECURITY',
        sentiment: 'BEARISH',
        content: `⚠️ Community Safety Notice: Audited the bytecode of the newly deployed 400% APY vault on BSC. The contract contains an unverified emergencyWithdraw function with multi-sig bypass. 

Recommend extreme caution or revoking approvals immediately via Security Scanner.`,
        authorWallet: '0x620a...dd81',
        authorTier: 'ALPHA_VIP',
        isPro: true,
        upvotes: 390,
        downvotes: 2,
        insightfulCount: 88,
        comments: [
            {
                id: 'comm-4',
                authorWallet: '0x441b...1290',
                authorTier: 'PREMIUM',
                isPro: true,
                sentiment: 'BEARISH',
                content: 'Great catch. Revoked token approval right away. This is why decentralized security checks in the community feed are essential.',
                upvotes: 64,
                createdAt: new Date(Date.now() - 14400000).toISOString()
            }
        ],
        createdAt: new Date(Date.now() - 57600000).toISOString()
    }
];

// ── COMPONENT ────────────────────────────────────────────────────────────────

export const AlphasFeed: React.FC = () => {
    const { user } = useAuth();

    // Channel & Search state
    const [selectedCategory, setSelectedCategory] = useState<DiscussionCategory>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'HOT' | 'TOP' | 'DEBATED' | 'LATEST'>('HOT');
    const [privacyMode, setPrivacyMode] = useState<boolean>(true); // Mask balances & pseudonymous by default

    // Discussions state
    const [discussions, setDiscussions] = useState<DiscussionPost[]>(INITIAL_DISCUSSIONS);
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set(['disc-1']));
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [commentSentiments, setCommentSentiments] = useState<Record<string, DiscussionSentiment>>({});
    const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});

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
    const [podcast, setPodcast] = useState<LivePodcastState>({
        isLive: true,
        title: 'Weekly Alpha Space: $BAG Tokenomics, Whale Signals & Ecosystem Roadmap',
        topic: 'Live Community AMA & On-Chain Due Diligence Roundtable',
        hostName: 'AlphaBAG Core Team',
        hostWallet: '0x4291...dB96',
        listenersCount: 142,
        isListening: false,
        stageSpeakers: [
            { wallet: '0x4291...dB96', name: 'Alpha Lead', isHost: true, isSpeaking: true, tier: 'ALPHA_VIP' },
            { wallet: '0x992a...7710', name: 'Whale Tracker', isSpeaking: false, tier: 'ALPHA_VIP' },
            { wallet: '0x8b32...4e19', name: 'Tokenomics Analyst', isSpeaking: true, tier: 'PREMIUM' }
        ],
        liveChat: [
            { id: 'c1', authorWallet: '0x1290...33aa', tier: 'FREE', message: 'Tuned in from Germany! The audio quality is crisp.', timestamp: 'Just now' },
            { id: 'c2', authorWallet: '0x8b32...4e19', tier: 'PREMIUM', isVip: true, message: 'Question for the team: When will the automated whale alerts bot roll out for Telegram?', timestamp: '1m ago' },
            { id: 'c3', authorWallet: '0x5501...99ef', tier: 'FREE', message: 'Upvoted the stream! Love the decentralized non-social media focus.', timestamp: '2m ago' }
        ],
        upvotes: 384,
        userUpvoted: false
    });

    const [podcastChatInput, setPodcastChatInput] = useState('');
    const [isAudioMuted, setIsAudioMuted] = useState(false);

    const isUserPro = user?.isPro || user?.tier === 'PREMIUM' || user?.tier === 'ULTIMATE' || user?.tier === 'ALPHA_VIP';
    const userTier: PassTier = (user?.tier as PassTier) || 'FREE';

    // Format address for privacy
    const formatAddress = (addr?: string) => {
        if (!addr) return '0x0000...0000';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    // Current user display identity (Pseudonymous)
    const currentDisplayWallet = formatAddress(user?.walletAddress || user?.id);

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
                    return (b.upvotes * 2 + b.comments.length * 5) - (a.upvotes * 2 + a.comments.length * 5);
                });
                break;
        }

        return list;
    }, [discussions, selectedCategory, searchQuery, sortBy]);

    // ── ACTIONS: DISCUSSIONS ─────────────────────────────────────────────────

    const handleUpvoteDiscussion = (discId: string, type: 'UP' | 'DOWN') => {
        setDiscussions(prev => prev.map(d => {
            if (d.id !== discId) return d;
            if (d.userVoted === type) {
                // Undo vote
                return {
                    ...d,
                    userVoted: undefined,
                    upvotes: type === 'UP' ? d.upvotes - 1 : d.upvotes,
                    downvotes: type === 'DOWN' ? d.downvotes - 1 : d.downvotes,
                };
            }
            const hadUp = d.userVoted === 'UP';
            const hadDown = d.userVoted === 'DOWN';
            return {
                ...d,
                userVoted: type,
                upvotes: type === 'UP' ? (hadDown ? d.upvotes + 1 : d.upvotes + 1) : (hadUp ? d.upvotes - 1 : d.upvotes),
                downvotes: type === 'DOWN' ? (hadUp ? d.downvotes + 1 : d.downvotes + 1) : (hadDown ? d.downvotes - 1 : d.downvotes),
            };
        }));
    };

    const handleToggleInsightful = (discId: string) => {
        setDiscussions(prev => prev.map(d => {
            if (d.id !== discId) return d;
            const nextState = !d.isInsightful;
            return {
                ...d,
                isInsightful: nextState,
                insightfulCount: nextState ? d.insightfulCount + 1 : d.insightfulCount - 1
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

    const handleAddComment = (discId: string) => {
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
            createdAt: new Date().toISOString()
        };

        setDiscussions(prev => prev.map(d => {
            if (d.id !== discId) return d;
            if (targetReplyId) {
                // Nested reply
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

    const handleCreateDiscussion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) {
            Swal.fire({
                title: 'Missing Details',
                text: 'Please provide both a discussion title and analysis content.',
                icon: 'warning',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#fcd535'
            });
            return;
        }

        const formattedTicker = newTicker.trim().startsWith('$') ? newTicker.trim().toUpperCase() : `$${newTicker.trim().toUpperCase()}`;

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

        setDiscussions(prev => [newPost, ...prev]);
        setIsComposerOpen(false);
        setNewTitle('');
        setNewContent('');
        setNewMarketCap('');
        setNewFdv('');
        setNewCirculating('');
        setNewUnlock('');

        Swal.fire({
            title: 'DISCUSSION POSTED',
            text: 'Your project analysis has been published to the community hub.',
            icon: 'success',
            background: '#0a0a0a',
            color: '#fff',
            confirmButtonColor: '#fcd535'
        });
    };

    // ── ACTIONS: LIVE PODCAST ────────────────────────────────────────────────

    const handleToggleListenPodcast = () => {
        setPodcast(prev => {
            const nextState = !prev.isListening;
            return {
                ...prev,
                isListening: nextState,
                listenersCount: nextState ? prev.listenersCount + 1 : prev.listenersCount - 1
            };
        });
    };

    const handleUpvotePodcast = () => {
        setPodcast(prev => ({
            ...prev,
            upvotes: prev.userUpvoted ? prev.upvotes - 1 : prev.upvotes + 1,
            userUpvoted: !prev.userUpvoted
        }));
    };

    const handleSendPodcastChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!podcastChatInput.trim()) return;

        const newMsg = {
            id: `msg-${Date.now()}`,
            authorWallet: currentDisplayWallet,
            tier: userTier,
            isVip: isUserPro,
            message: podcastChatInput.trim(),
            timestamp: 'Just now'
        };

        setPodcast(prev => ({
            ...prev,
            liveChat: [newMsg, ...prev.liveChat]
        }));
        setPodcastChatInput('');
    };

    const handleRequestStageMic = () => {
        if (!isUserPro) {
            Swal.fire({
                title: 'STAGE SPEAKING GATED',
                html: `
                    <div class="text-left py-2 text-xs text-alphabag-subtext leading-relaxed">
                        <p class="mb-3 text-alphabag-text"><strong>Free listeners can listen, upvote, and comment in live chat.</strong></p>
                        <p class="mb-3">To join the stage as a speaker, ask live audio questions, or host community AMAs, you must hold:</p>
                        <div class="p-3 bg-alphabag-black rounded-lg border border-alphabag-yellow/30 text-alphabag-yellow font-mono space-y-1">
                            <div>• <strong>10,000 $BAG Tokens</strong> OR</div>
                            <div>• <strong>1+ AlphaBAG Genesis Pass</strong></div>
                        </div>
                    </div>
                `,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'MINT PASS / UPGRADE',
                cancelButtonText: 'CONTINUE LISTENING',
                confirmButtonColor: '#fcd535',
                background: '#0a0a0a',
                color: '#fff'
            }).then(r => {
                if (r.isConfirmed) {
                    window.location.hash = '#/alpha-passes';
                }
            });
            return;
        }

        Swal.fire({
            title: 'MIC ACCESS REQUESTED',
            text: 'You have been added to the VIP Speaker Queue. The host will invite you to the mic shortly.',
            icon: 'success',
            background: '#0a0a0a',
            color: '#fff',
            confirmButtonColor: '#fcd535'
        });
    };

    // ── RENDER ───────────────────────────────────────────────────────────────

    return (
        <div className="w-full space-y-3 pb-8 animate-in fade-in duration-500">
            
            {/* ── HEADER CARD ── */}
            <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-dark">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-alphabag-text tracking-tight flex items-center gap-2">
                                Community Discussion Hub
                            </h1>
                            <div className="flex items-center gap-2 text-[11px] text-alphabag-subtext">
                                <span>Collaborative Web3 Project Due Diligence, Tokenomics & Live AMAs</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Privacy Mode Badge / Toggle */}
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
                        onClick={() => setIsComposerOpen(true)}
                        className="bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] px-4 py-2 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                    >
                        <Plus size={15} />
                        <span>Start Discussion</span>
                    </button>
                </div>
            </div>

            {/* ── 🎙️ LIVE AUDIO PODCAST / SPACE CARD (ALL USERS CAN LISTEN & CHAT) ── */}
            {podcast.isLive && (
                <div className="rounded-2xl border border-alphabag-yellow/40 bg-gradient-to-r from-alphabag-darkgray via-[#141414] to-alphabag-darkgray p-4 md:p-5 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-alphabag-yellow/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
                        {/* Live Status & Title */}
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                    LIVE AUDIO PODCAST
                                </span>
                                <span className="text-[11px] text-alphabag-subtext font-medium flex items-center gap-1">
                                    <Users size={12} className="text-alphabag-yellow" />
                                    <strong className="text-alphabag-text tabular-nums">{podcast.listenersCount}</strong> Listening
                                </span>
                                <span className="bg-alphabag-gray text-alphabag-subtext px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                                    All Users Welcome
                                </span>
                            </div>

                            <h3 className="text-lg md:text-xl font-bold text-alphabag-text leading-snug">
                                {podcast.title}
                            </h3>
                            <p className="text-xs text-alphabag-subtext font-medium">
                                Topic: {podcast.topic} • Host: <strong className="text-alphabag-yellow">{podcast.hostName}</strong> ({podcast.hostWallet})
                            </p>

                            {/* Speaker Stage Lineup */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="text-[10px] uppercase font-semibold text-alphabag-subtext">Stage Speakers:</span>
                                {podcast.stageSpeakers.map((spk, i) => (
                                    <div 
                                        key={i} 
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold border ${
                                            spk.isSpeaking 
                                                ? 'bg-alphabag-yellow/10 text-alphabag-yellow border-alphabag-yellow/40 animate-pulse'
                                                : 'bg-alphabag-black text-alphabag-subtext border-alphabag-gray'
                                        }`}
                                    >
                                        <Mic size={11} className={spk.isSpeaking ? 'text-alphabag-yellow' : 'text-alphabag-subtext'} />
                                        <span>{spk.name}</span>
                                        {spk.isHost && <span className="bg-alphabag-yellow text-alphabag-dark text-[8px] font-bold px-1 rounded">HOST</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Player & Action Controls */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                            {/* Animated Audio Soundwave when Listening */}
                            {podcast.isListening && (
                                <div className="flex items-center gap-1 px-3 py-2 bg-alphabag-black border border-alphabag-yellow/30 rounded-lg justify-center">
                                    <div className="w-1 bg-alphabag-yellow h-4 animate-bounce rounded-full" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-1 bg-alphabag-yellow h-6 animate-bounce rounded-full" style={{ animationDelay: '0.3s' }} />
                                    <div className="w-1 bg-alphabag-yellow h-3 animate-bounce rounded-full" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-1 bg-alphabag-yellow h-7 animate-bounce rounded-full" style={{ animationDelay: '0.4s' }} />
                                    <div className="w-1 bg-alphabag-yellow h-5 animate-bounce rounded-full" style={{ animationDelay: '0.25s' }} />
                                    <span className="text-[10px] text-alphabag-yellow font-bold uppercase ml-1.5 font-mono">ON-AIR</span>
                                </div>
                            )}

                            {/* Listen / Leave Button */}
                            <button
                                onClick={handleToggleListenPodcast}
                                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                    podcast.isListening
                                        ? 'bg-alphabag-gray text-alphabag-text hover:bg-alphabag-gray/80 border border-alphabag-gray'
                                        : 'bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] shadow-md active:scale-95'
                                }`}
                            >
                                <Radio size={14} className={podcast.isListening ? 'animate-spin' : ''} />
                                <span>{podcast.isListening ? 'LEAVE BROADCAST' : 'TUNE IN LIVE'}</span>
                            </button>

                            {/* Live Upvote Button */}
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

                            {/* Request Mic / Speak Button */}
                            <button
                                onClick={handleRequestStageMic}
                                className="px-3 py-2.5 rounded-lg text-xs font-semibold bg-alphabag-black border border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text hover:border-alphabag-yellow/40 flex items-center justify-center gap-1.5 transition-all"
                                title={isUserPro ? 'Request Mic on Stage' : 'Stage Speaking is for Premium Tier'}
                            >
                                <Mic size={14} className="text-alphabag-yellow" />
                                <span>Request Mic</span>
                                {!isUserPro && <Lock size={11} className="text-alphabag-subtext" />}
                            </button>
                        </div>
                    </div>

                    {/* Live Podcast Chat & Comments Drawer (Visible to all listeners) */}
                    {podcast.isListening && (
                        <div className="mt-4 pt-4 border-t border-alphabag-gray/60 space-y-3 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-alphabag-text uppercase text-[11px] flex items-center gap-1.5">
                                    <MessageCircle size={13} className="text-alphabag-yellow" />
                                    Live Broadcast Chat & Q&A
                                </span>
                                <span className="text-[10px] text-alphabag-subtext font-mono">
                                    Posting as: <strong className="text-alphabag-yellow">{currentDisplayWallet}</strong>
                                </span>
                            </div>

                            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs">
                                {podcast.liveChat.map((msg) => (
                                    <div key={msg.id} className="bg-alphabag-black/60 border border-alphabag-gray/50 rounded p-2 flex items-start gap-2">
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                                            msg.isVip ? 'bg-alphabag-yellow/20 text-alphabag-yellow' : 'bg-alphabag-gray text-alphabag-subtext'
                                        }`}>
                                            {msg.tier}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-mono text-[10px] text-alphabag-subtext mr-1.5">{msg.authorWallet}:</span>
                                            <span className="text-alphabag-text leading-relaxed">{msg.message}</span>
                                        </div>
                                        <span className="text-[9px] text-alphabag-subtext shrink-0">{msg.timestamp}</span>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleSendPodcastChat} className="flex gap-2">
                                <input
                                    type="text"
                                    value={podcastChatInput}
                                    onChange={(e) => setPodcastChatInput(e.target.value)}
                                    placeholder="Post a question or comment to the live podcast..."
                                    className="flex-1 bg-alphabag-black border border-alphabag-gray rounded-lg px-3 py-2 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                />
                                <button
                                    type="submit"
                                    className="bg-alphabag-yellow text-alphabag-dark font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1 shrink-0 hover:bg-[#e0bd2e]"
                                >
                                    <Send size={13} />
                                    <span>Send</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* ── CHANNEL FILTER PILLS & DISCOVERY CONTROLS ── */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 pt-1">
                {/* Channels */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    {[
                        { id: 'ALL', label: 'All Discussions', icon: MessageSquare },
                        { id: 'TOKENOMICS', label: 'Tokenomics & Vesting', icon: Coins },
                        { id: 'UTILITY', label: 'Utility & Yield', icon: Zap },
                        { id: 'PROJECT_REVIEW', label: 'Project Reviews', icon: Layers },
                        { id: 'ALPHA_CALL', label: 'Alpha Calls', icon: Target },
                        { id: 'AUDIT_SECURITY', label: 'Security & Audits', icon: Shield },
                    ].map(ch => {
                        const Icon = ch.icon;
                        const active = selectedCategory === ch.id;
                        return (
                            <button
                                key={ch.id}
                                onClick={() => setSelectedCategory(ch.id as DiscussionCategory)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                                    active
                                        ? 'bg-alphabag-yellow text-alphabag-dark font-black border-alphabag-yellow shadow-sm'
                                        : 'bg-alphabag-darkgray text-alphabag-subtext border-alphabag-gray hover:text-alphabag-text hover:border-alphabag-subtext/40'
                                }`}
                            >
                                <Icon size={13} />
                                <span>{ch.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Sort Controls */}
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
                        <option value="HOT">🔥 Hot Debates</option>
                        <option value="TOP">🚀 Top Voted</option>
                        <option value="DEBATED">💬 Most Discussed</option>
                        <option value="LATEST">⏱️ Latest</option>
                    </select>
                </div>
            </div>

            {/* ── MAIN CONTENT GRID (FEED + SIDEBAR) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                
                {/* ── LEFT COLUMN: DISCUSSIONS FEED (8 COLS) ── */}
                <div className="lg:col-span-8 space-y-3">
                    
                    {/* IN-FEED UNIVERSAL SPONSORED ADS BREAK */}
                    <div className="rounded-xl border border-alphabag-yellow/30 bg-gradient-to-r from-alphabag-darkgray via-[#161616] to-alphabag-darkgray p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-alphabag-yellow/10 border border-alphabag-yellow/30 flex items-center justify-center text-alphabag-yellow shrink-0">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-alphabag-yellow/15 text-alphabag-yellow px-2 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border border-alphabag-yellow/20">
                                        SPONSORED
                                    </span>
                                    <h4 className="text-xs font-bold text-alphabag-text">{SPONSORED_PARTNER_AD.partnerName}</h4>
                                </div>
                                <p className="text-[11px] text-alphabag-subtext mt-0.5 leading-relaxed">
                                    {SPONSORED_PARTNER_AD.tagline}
                                </p>
                            </div>
                        </div>
                        <a
                            href={SPONSORED_PARTNER_AD.ctaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all"
                        >
                            <span>{SPONSORED_PARTNER_AD.ctaText}</span>
                            <ArrowUpRight size={13} />
                        </a>
                    </div>

                    {/* DISCUSSION CARDS */}
                    {filteredDiscussions.length > 0 ? (
                        filteredDiscussions.map((post) => {
                            const isExpanded = expandedComments.has(post.id);
                            const draft = commentDrafts[post.id] || '';
                            const sentimentDraft = commentSentiments[post.id] || 'NEUTRAL';
                            const targetReplyId = replyingTo[post.id];

                            return (
                                <div 
                                    key={post.id} 
                                    className={`rounded-2xl border bg-alphabag-darkgray p-4 md:p-5 transition-all space-y-3 ${
                                        post.isPinned ? 'border-alphabag-yellow/40 shadow-sm' : 'border-alphabag-gray hover:border-alphabag-subtext/30'
                                    }`}
                                >
                                    {/* Post Top Row: Category, Ticker, Sentiment, Author, Time */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-alphabag-gray/50 text-xs">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {post.isPinned && (
                                                <span className="bg-alphabag-yellow text-alphabag-dark text-[9px] font-black uppercase px-2 py-0.5 rounded">
                                                    PINNED
                                                </span>
                                            )}
                                            <span className="bg-alphabag-black border border-alphabag-gray text-alphabag-yellow font-bold font-mono px-2 py-0.5 rounded text-[11px]">
                                                {post.ticker}
                                            </span>
                                            <span className="bg-alphabag-gray text-alphabag-subtext px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                                                {post.category.replace('_', ' ')}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                post.sentiment === 'BULLISH'
                                                    ? 'bg-alphabag-green/10 text-alphabag-green border-alphabag-green/30'
                                                    : post.sentiment === 'BEARISH'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                                    : 'bg-alphabag-gray text-alphabag-subtext border-alphabag-gray'
                                            }`}>
                                                {post.sentiment === 'BULLISH' ? '🐂 BULLISH' : post.sentiment === 'BEARISH' ? '🐻 BEARISH' : '⚖️ NEUTRAL'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[11px] text-alphabag-subtext font-mono">
                                            <span>by <strong className="text-alphabag-text">{post.authorWallet}</strong></span>
                                            <span className="bg-alphabag-gray px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase text-alphabag-subtext">
                                                {post.authorTier}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Post Title */}
                                    <h3 className="text-base md:text-lg font-bold text-alphabag-text leading-snug">
                                        {post.title}
                                    </h3>

                                    {/* Post Content */}
                                    <p className="text-xs md:text-sm text-alphabag-subtext whitespace-pre-line leading-relaxed">
                                        {post.content}
                                    </p>

                                    {/* Optional Tokenomics Metrics Block */}
                                    {post.tokenMetrics && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-alphabag-black/70 border border-alphabag-gray rounded-xl p-3 text-center">
                                            {post.tokenMetrics.marketCap && (
                                                <div>
                                                    <div className="text-[9px] uppercase font-semibold text-alphabag-subtext">Market Cap</div>
                                                    <div className="text-xs font-semibold text-alphabag-text font-mono mt-0.5">{post.tokenMetrics.marketCap}</div>
                                                </div>
                                            )}
                                            {post.tokenMetrics.fdv && (
                                                <div>
                                                    <div className="text-[9px] uppercase font-semibold text-alphabag-subtext">Target FDV</div>
                                                    <div className="text-xs font-semibold text-alphabag-yellow font-mono mt-0.5">{post.tokenMetrics.fdv}</div>
                                                </div>
                                            )}
                                            {post.tokenMetrics.circulatingSupply && (
                                                <div>
                                                    <div className="text-[9px] uppercase font-semibold text-alphabag-subtext">Circulating %</div>
                                                    <div className="text-xs font-semibold text-alphabag-text font-mono mt-0.5">{post.tokenMetrics.circulatingSupply}</div>
                                                </div>
                                            )}
                                            {post.tokenMetrics.unlockDate && (
                                                <div>
                                                    <div className="text-[9px] uppercase font-semibold text-alphabag-subtext">Unlock Schedule</div>
                                                    <div className="text-xs font-semibold text-alphabag-green font-mono mt-0.5">{post.tokenMetrics.unlockDate}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Post Action Bar (Upvote, Comment Drawer, Insightful) */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-alphabag-gray/50 text-xs">
                                        <div className="flex items-center gap-2">
                                            {/* Upvote / Downvote */}
                                            <div className="flex items-center bg-alphabag-black border border-alphabag-gray rounded-lg p-0.5">
                                                <button
                                                    onClick={() => handleUpvoteDiscussion(post.id, 'UP')}
                                                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                                                        post.userVoted === 'UP'
                                                            ? 'bg-alphabag-yellow text-alphabag-dark font-black'
                                                            : 'text-alphabag-subtext hover:text-alphabag-text'
                                                    }`}
                                                    title="Upvote Analysis"
                                                >
                                                    <ThumbsUp size={13} />
                                                    <span className="font-mono tabular-nums">{post.upvotes}</span>
                                                </button>
                                            </div>

                                            {/* Toggle Comments Button */}
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

                                            {/* Insightful Badge */}
                                            <button
                                                onClick={() => handleToggleInsightful(post.id)}
                                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                                                    post.isInsightful
                                                        ? 'bg-alphabag-yellow/15 border-alphabag-yellow/40 text-alphabag-yellow'
                                                        : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'
                                                }`}
                                                title="Mark as Insightful Research"
                                            >
                                                <Sparkles size={12} className="text-alphabag-yellow" />
                                                <span className="text-[11px]">{post.insightfulCount} Insightful</span>
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 text-[10px] text-alphabag-subtext">
                                            <span>Community Discussion</span>
                                        </div>
                                    </div>

                                    {/* ── EXPANDABLE NESTED COMMENT THREADS ── */}
                                    {isExpanded && (
                                        <div className="pt-3 border-t border-alphabag-gray/50 space-y-3 animate-in fade-in duration-300">
                                            {/* Comment Form */}
                                            <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-3 space-y-2">
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="font-semibold text-alphabag-text">
                                                        {targetReplyId ? 'Replying to comment...' : 'Join the discussion'}
                                                    </span>
                                                    {targetReplyId && (
                                                        <button 
                                                            onClick={() => setReplyingTo(p => ({ ...p, [post.id]: null }))}
                                                            className="text-alphabag-yellow hover:underline text-[10px]"
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
                                                    {/* Sentiment Tag for Comment */}
                                                    <div className="flex items-center gap-1">
                                                        {(['BULLISH', 'BEARISH', 'NEUTRAL'] as DiscussionSentiment[]).map(st => (
                                                            <button
                                                                key={st}
                                                                type="button"
                                                                onClick={() => setCommentSentiments(p => ({ ...p, [post.id]: st }))}
                                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                                                                    sentimentDraft === st
                                                                        ? 'bg-alphabag-yellow text-alphabag-dark font-black border-alphabag-yellow'
                                                                        : 'bg-alphabag-darkgray text-alphabag-subtext border-alphabag-gray'
                                                                }`}
                                                            >
                                                                {st === 'BULLISH' ? '🐂' : st === 'BEARISH' ? '🐻' : '⚖️'} {st}
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

                                            {/* Comments List */}
                                            {post.comments.length > 0 ? (
                                                <div className="space-y-2">
                                                    {post.comments.map((comm) => (
                                                        <div key={comm.id} className="bg-alphabag-black/50 border border-alphabag-gray/60 rounded-xl p-3 space-y-2 text-xs">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-alphabag-text font-semibold">{comm.authorWallet}</span>
                                                                    <span className="bg-alphabag-gray text-alphabag-subtext px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase">
                                                                        {comm.authorTier}
                                                                    </span>
                                                                    {comm.sentiment && (
                                                                        <span className="text-[10px] text-alphabag-yellow font-bold">
                                                                            {comm.sentiment === 'BULLISH' ? '🐂 Bullish' : comm.sentiment === 'BEARISH' ? '🐻 Bearish' : '⚖️ Neutral'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-alphabag-subtext">
                                                                    {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>

                                                            <p className="text-alphabag-subtext leading-relaxed pl-1">
                                                                {comm.content}
                                                            </p>

                                                            <div className="flex items-center gap-3 pt-1 text-[10px] text-alphabag-subtext">
                                                                <button 
                                                                    onClick={() => setReplyingTo(p => ({ ...p, [post.id]: comm.id }))}
                                                                    className="text-alphabag-yellow hover:underline font-semibold"
                                                                >
                                                                    Reply
                                                                </button>
                                                                <span>•</span>
                                                                <span className="tabular-nums">▲ {comm.upvotes} upvotes</span>
                                                            </div>

                                                            {/* Nested Replies */}
                                                            {comm.replies && comm.replies.length > 0 && (
                                                                <div className="ml-4 pl-3 border-l-2 border-alphabag-gray space-y-2 pt-2">
                                                                    {comm.replies.map(rep => (
                                                                        <div key={rep.id} className="bg-alphabag-darkgray/60 rounded p-2 text-xs space-y-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-mono text-alphabag-text font-semibold text-[11px]">{rep.authorWallet}</span>
                                                                                <span className="bg-alphabag-gray text-alphabag-subtext px-1 py-0.2 rounded text-[8px] uppercase">{rep.authorTier}</span>
                                                                            </div>
                                                                            <p className="text-alphabag-subtext text-[11px] leading-relaxed">{rep.content}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-xs text-alphabag-subtext">
                                                    No comments yet. Be the first to analyze this project!
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

                {/* ── RIGHT COLUMN: UNIVERSAL ADS & COMMUNITY WIDGETS (4 COLS) ── */}
                <div className="lg:col-span-4 space-y-3">
                    
                    {/* 📢 UNIVERSAL SPONSORED PARTNER CARD (VISIBLE TO ALL USERS) */}
                    <div className="rounded-2xl border-2 border-alphabag-yellow/40 bg-gradient-to-b from-alphabag-darkgray to-alphabag-black p-4 space-y-3 shadow-md relative overflow-hidden">
                        <div className="flex justify-between items-center">
                            <span className="bg-alphabag-yellow text-alphabag-dark px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                                {SPONSORED_PARTNER_AD.badge}
                            </span>
                            <span className="text-[10px] text-alphabag-subtext font-semibold uppercase">SPONSOR</span>
                        </div>

                        <div className="space-y-1.5">
                            <h3 className="text-sm font-bold text-alphabag-text">{SPONSORED_PARTNER_AD.partnerName}</h3>
                            <p className="text-xs text-alphabag-subtext leading-relaxed">
                                {SPONSORED_PARTNER_AD.description}
                            </p>
                        </div>

                        <a
                            href={SPONSORED_PARTNER_AD.ctaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all block text-center shadow-sm"
                        >
                            <span>{SPONSORED_PARTNER_AD.ctaText}</span>
                            <ExternalLink size={13} />
                        </a>

                        <div className="pt-2 border-t border-alphabag-gray/50 flex justify-between items-center text-[10px] text-alphabag-subtext">
                            <span>Verified Web3 Ecosystem Ad</span>
                            <button
                                onClick={() => setIsFounderFormOpen(true)}
                                className="text-alphabag-yellow hover:underline font-semibold"
                            >
                                Feature Your Project
                            </button>
                        </div>
                    </div>

                    {/* 🔥 TRENDING TOKENS IN COMMUNITY */}
                    <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-alphabag-gray">
                            <span className="text-xs font-semibold uppercase text-alphabag-subtext flex items-center gap-1.5">
                                <Flame size={14} className="text-alphabag-yellow" />
                                Trending Topics
                            </span>
                            <span className="text-[10px] font-semibold uppercase text-alphabag-yellow">24H Active</span>
                        </div>

                        <div className="space-y-2">
                            {[
                                { ticker: '$BAG', topic: 'Tokenomics & 100% Treasury Model', posts: 42, sentiment: '98% Bullish' },
                                { ticker: '$BNB', topic: 'Smart Money Whale Accumulation', posts: 28, sentiment: '86% Bullish' },
                                { ticker: '$CAKE', topic: 'V3 DEX Fee Share & Staking Yield', posts: 19, sentiment: '74% Bullish' },
                                { ticker: '$ETH', topic: 'Modular DA vs ZK Rollup Fees', posts: 15, sentiment: '52% Neutral' },
                            ].map((tr, i) => (
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
                                            <span className="text-[10px] text-alphabag-green font-semibold">
                                                {tr.sentiment}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-alphabag-subtext line-clamp-1 mt-0.5">
                                            {tr.topic}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-alphabag-subtext font-mono shrink-0 pl-2">
                                        {tr.posts} posts
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 🏆 TOP COMMUNITY ANALYSTS LEADERBOARD */}
                    <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-alphabag-gray">
                            <span className="text-xs font-semibold uppercase text-alphabag-subtext flex items-center gap-1.5">
                                <Award size={14} className="text-alphabag-yellow" />
                                Top Analysts
                            </span>
                            <span className="text-[10px] text-alphabag-subtext font-mono">By Upvotes</span>
                        </div>

                        <div className="space-y-2">
                            {[
                                { rank: '1', wallet: '0x4291...dB96', tier: 'ALPHA_VIP', score: '1,420 Upvotes', focus: 'Tokenomics' },
                                { rank: '2', wallet: '0x620a...dd81', tier: 'ALPHA_VIP', score: '980 Upvotes', focus: 'Security & Audits' },
                                { rank: '3', wallet: '0x71e3...a01f', tier: 'PREMIUM', score: '760 Upvotes', focus: 'Whale Tracking' },
                            ].map((an, i) => (
                                <div key={i} className="flex items-center justify-between bg-alphabag-black/50 border border-alphabag-gray rounded-xl p-2.5 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-alphabag-yellow/10 border border-alphabag-yellow/30 text-alphabag-yellow text-[10px] font-black flex items-center justify-center">
                                            {an.rank}
                                        </span>
                                        <div>
                                            <div className="font-mono font-semibold text-alphabag-text text-[11px]">{an.wallet}</div>
                                            <div className="text-[10px] text-alphabag-subtext">{an.focus}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-mono text-alphabag-yellow font-semibold">{an.score}</span>
                                        <div className="text-[9px] text-alphabag-subtext uppercase">{an.tier}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 🛡️ PRIVACY & DYOR COMMUNITY MANIFESTO */}
                    <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-alphabag-yellow font-bold uppercase text-[11px]">
                            <Shield size={14} />
                            <span>Privacy & DYOR Manifesto</span>
                        </div>
                        <p className="text-[11px] text-alphabag-subtext leading-relaxed">
                            AlphaBAG Community Hub is a decentralized intelligence forum. No third-party data tracking, no algorithmic bias. All project analyses represent individual community contributor perspectives. Always verify on-chain contracts and DYOR.
                        </p>
                    </div>

                </div>
            </div>

            {/* ── START DISCUSSION COMPOSER MODAL ── */}
            {isComposerOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                            {/* Title & Ticker */}
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

                            {/* Category & Sentiment Stance */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold uppercase text-alphabag-subtext">Topic Channel</label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as any)}
                                        className="w-full bg-alphabag-black border border-alphabag-gray rounded-lg p-2.5 text-xs text-alphabag-text focus:outline-none focus:border-alphabag-yellow font-semibold"
                                    >
                                        <option value="TOKENOMICS">📊 Tokenomics & Vesting</option>
                                        <option value="UTILITY">⚡ Utility & Yield</option>
                                        <option value="PROJECT_REVIEW">🏗️ Project Review & Fundamentals</option>
                                        <option value="ALPHA_CALL">🎯 Alpha Call & Due Diligence</option>
                                        <option value="AUDIT_SECURITY">🛡️ Security & Audits</option>
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
                                                        ? 'bg-alphabag-yellow text-alphabag-dark border-alphabag-yellow shadow-sm font-black'
                                                        : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'
                                                }`}
                                            >
                                                {st === 'BULLISH' ? '🐂 Bull' : st === 'BEARISH' ? '🐻 Bear' : '⚖️ Neutral'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Content */}
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

                            {/* Optional Tokenomics Highlights */}
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
                                        placeholder="Next Unlock (None/Fair)"
                                        className="bg-alphabag-black border border-alphabag-gray rounded p-2 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                                    />
                                </div>
                            </div>

                            {/* Author Pseudonym Notice */}
                            <div className="bg-alphabag-black p-3 rounded-lg border border-alphabag-gray flex justify-between items-center text-xs">
                                <span className="text-alphabag-subtext font-mono">
                                    Posting as: <strong className="text-alphabag-yellow">{currentDisplayWallet}</strong> ({userTier})
                                </span>
                                <span className="text-[10px] text-alphabag-green font-semibold">
                                    🔒 Privacy Shield Protected
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
                                    className="px-6 py-2 bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] rounded-lg text-xs font-black uppercase tracking-wider shadow-sm"
                                >
                                    Publish Discussion
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
