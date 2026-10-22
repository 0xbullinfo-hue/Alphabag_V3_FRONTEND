import {
  ArrowUpRight,
  Award,
  ChevronDown,
  ChevronUp,
  Flame,
  Globe,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  Mic,
  Plus,
  Radio,
  Search,
  Send,
  Share2,
  Shield,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { PageIcon } from '../../components/ui/PageIcon';
import { FounderListingForm } from '../../components/frontend/FounderListingForm';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

// ── RESEARCHED CRYPTO SECTORS & CATEGORIES ──────────────────────────────────
export interface CryptoSectorPreset {
  name: string;
  slug: string;
  category: string;
  description: string;
  badge: string;
}

export const CRYPTO_SECTOR_PRESETS: CryptoSectorPreset[] = [
  {
    name: 'DeFi & Liquidity',
    slug: 'defi',
    category: 'DEFI',
    description: 'Decentralized exchanges, liquidity pools, lending markets, and yield strategies.',
    badge: 'DeFi',
  },
  {
    name: 'Degen Plays & Scalping',
    slug: 'degen',
    category: 'DEGEN',
    description: 'High-volatility setups, sniper calls, launchpads, and momentum scalps.',
    badge: 'Degen',
  },
  {
    name: 'Memecoins & Culture',
    slug: 'memes',
    category: 'MEMES',
    description: 'Solana and Base memecoin metas, narrative runs, and community takeovers (CTO).',
    badge: 'Memes',
  },
  {
    name: 'AI Agents & DePIN',
    slug: 'ai-depin',
    category: 'AI',
    description: 'Autonomous on-chain AI agents, decentralized compute clusters, and GPU protocols.',
    badge: 'AI',
  },
  {
    name: 'Layer 1 & Layer 2 Rollups',
    slug: 'layer1-layer2',
    category: 'L1_L2',
    description: 'Ethereum L2s, Solana, Bitcoin layers, Arbitrum, Base, and high-throughput L1s.',
    badge: 'L1/L2',
  },
  {
    name: 'Real World Assets (RWA)',
    slug: 'rwa',
    category: 'RWA',
    description: 'Tokenized US Treasuries, institutional private credit, commodities, and tokenized funds.',
    badge: 'RWA',
  },
  {
    name: 'Smart Contract Security & Audits',
    slug: 'security-audits',
    category: 'SECURITY',
    description: 'Exploit post-mortems, vulnerability disclosure, code audits, and safety alerts.',
    badge: 'Audit',
  },
  {
    name: 'Tokenomics, Unlocks & Vesting',
    slug: 'tokenomics',
    category: 'TOKENOMICS',
    description: 'Cliff unlock schedules, emission curves, FDV vs Market Cap, and fee buybacks.',
    badge: 'Tokenomics',
  },
  {
    name: 'Airdrops & Testnet Farming',
    slug: 'airdrops',
    category: 'AIRDROPS',
    description: 'Retroactive airdrops, testnet guides, node runner quests, and ecosystem points.',
    badge: 'Airdrops',
  },
  {
    name: 'Perp DEX & Leverage Trading',
    slug: 'perp-leverage',
    category: 'PERPS',
    description: 'Funding rates, open interest, liquidation cascades, and futures positioning.',
    badge: 'Perps',
  },
  {
    name: 'Liquid Staking & Restaking (LRT)',
    slug: 'restaking-lst',
    category: 'RESTAKING',
    description: 'EigenLayer, Symbiotic, LRT yields, and shared cryptoeconomic security.',
    badge: 'Restaking',
  },
  {
    name: 'Cross-Chain & Bridges',
    slug: 'cross-chain',
    category: 'BRIDGES',
    description: 'Interoperability, LayerZero, Wormhole, Chainlink CCIP, and bridge security.',
    badge: 'Bridges',
  },
  {
    name: 'Crypto Macro & Policy',
    slug: 'macro',
    category: 'MACRO',
    description: 'Central bank rates, spot ETF flows, global regulations, and liquidity cycles.',
    badge: 'Macro',
  },
];

// ── TYPES & INTERFACES ───────────────────────────────────────────────────────
export type DiscussionSentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface DiscussionComment {
  id: string;
  parentId?: string;
  authorName: string;
  displayMode: 'VISIBLE' | 'ANONYMOUS';
  content: string;
  createdAt: string;
}

export interface DiscussionPost {
  id: string;
  title: string;
  ticker?: string;
  category: string;
  sentiment?: DiscussionSentiment;
  content?: string;
  previewText?: string;
  previewOnly?: boolean;
  communityMember?: boolean;
  communitySlug?: string;
  communityName?: string;
  authorName: string;
  upvotes: number;
  downvotes: number;
  userVoted?: 'UP' | 'DOWN';
  comments: DiscussionComment[];
  commentCount?: number;
  createdAt: string;
  isPinned?: boolean;
  isSponsored?: boolean;
}

export interface Community {
  slug: string;
  name: string;
  description: string;
  memberCount: number;
  isMember: boolean;
}

export interface SponsoredAd {
  partnerName: string;
  badge: string;
  tagline: string;
  description: string;
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
    tier: string;
    isVip?: boolean;
    message: string;
    timestamp: string;
  }>;
  upvotes: number;
  userUpvoted: boolean;
}

// ── DEFAULT FALLBACK SPONSOR ────────────────────────────────────────────────
const DEFAULT_SPONSORED_AD: SponsoredAd = {
  partnerName: 'AlphaBAG Genesis Pass',
  badge: 'ECOSYSTEM',
  tagline: 'Stake $BAG to earn 60% protocol fee share & unlock Alpha Desk VIP.',
  description:
    'AlphaBAG Genesis Pass holders receive perpetual fee rebates, exclusive institutional tools in Alpha Desk, and VIP early access to verified community partner pools.',
  ctaText: 'MINT PASS / UPGRADE',
  ctaUrl: '#/airdrop',
};

// ── COMPONENT ────────────────────────────────────────────────────────────────
export const AlphasFeed: React.FC = () => {
  const { user } = useAuth();

  // Community & Feed State
  const [communities, setCommunities] = useState<Community[]>(() =>
    CRYPTO_SECTOR_PRESETS.map((preset) => ({
      slug: preset.slug,
      name: preset.name,
      description: preset.description,
      memberCount: 142,
      isMember: false,
    }))
  );
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState('');
  const [communityBusy, setCommunityBusy] = useState<string | null>(null);
  const [feedError, setFeedError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'HOT' | 'TOP' | 'LATEST'>('LATEST');

  // Real Data States
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
  const [sponsoredAd, setSponsoredAd] = useState<SponsoredAd | null>(DEFAULT_SPONSORED_AD);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [topAnalysts, setTopAnalysts] = useState<TopAnalyst[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live Audio Space Stage State
  const [podcast, setPodcast] = useState<LivePodcastState | null>({
    isLive: true,
    title: 'Alpha Stage: DEX Liquidity Rotations, Whale Inflows & Microcap Metas',
    topic: '$SOL & Base Microcap Rotations • Real-Time Order Flow',
    hostName: 'AlphaDesk Core',
    hostWallet: '0x884...219A',
    listenersCount: 148,
    isListening: false,
    stageSpeakers: [
      { wallet: '0x884...219A', name: 'AlphaDesk Core', isHost: true, isSpeaking: true, tier: 'ALPHA_VIP' },
      { wallet: '0x71C...894B', name: 'DeFi Researcher', isSpeaking: false, tier: 'ULTIMATE' },
      { wallet: '0x3F2...1A90', name: 'On-Chain Forensics', isSpeaking: false, tier: 'ALPHA_VIP' },
    ],
    liveChat: [
      {
        id: 'msg-1',
        authorWallet: '0x123...4567',
        tier: 'ALPHA_VIP',
        isVip: true,
        message: 'Massive accumulation seen on DEX aggregator volume.',
        timestamp: '1m ago',
      },
      {
        id: 'msg-2',
        authorWallet: '0x999...1111',
        tier: 'PREMIUM',
        isVip: false,
        message: 'Are the token unlocks on schedule for Q4?',
        timestamp: 'Just now',
      },
    ],
    upvotes: 46,
    userUpvoted: false,
  });
  const [podcastChatInput, setPodcastChatInput] = useState('');

  // Comment States
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentDisplayModes, setCommentDisplayModes] = useState<Record<string, 'VISIBLE' | 'ANONYMOUS'>>({});

  // Post Composer Modal
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTicker, setNewTicker] = useState('');
  const [newCommunitySlug, setNewCommunitySlug] = useState('');
  const [newContent, setNewContent] = useState('');

  // Create Community Modal State
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [selectedSectorPreset, setSelectedSectorPreset] = useState<string>('defi');
  const [customCommunityName, setCustomCommunityName] = useState('');
  const [customCommunitySlug, setCustomCommunitySlug] = useState('');
  const [customCommunityDesc, setCustomCommunityDesc] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  // Founder Listing Form Modal
  const [isFounderFormOpen, setIsFounderFormOpen] = useState(false);

  const rawAddr = user?.walletAddress || user?.verifiedWallet || user?.id;
  const visibleDisplayName = rawAddr ? `${rawAddr.slice(0, 6)}...${rawAddr.slice(-4)}` : 'Visible profile';

  // ── LOAD FEED & AUXILIARY DATA ──────────────────────────────────────────
  const loadFeed = async (showLoading: boolean) => {
    if (showLoading) setIsLoading(true);
    try {
      const [communityRes, discRes, adRes, trendRes, analystRes, podcastRes] = await Promise.allSettled([
        api.get('/api/community/communities'),
        api.get('/api/community/discussions'),
        api.get('/api/community/ads'),
        api.get('/api/community/trending'),
        api.get('/api/community/analysts'),
        api.get('/api/community/podcast'),
      ]);

      if (communityRes.status === 'fulfilled' && Array.isArray(communityRes.value.data) && communityRes.value.data.length > 0) {
        const fetched = communityRes.value.data;
        const fetchedSlugs = new Set(fetched.map((c: Community) => c.slug));
        const missingPresets = CRYPTO_SECTOR_PRESETS.filter((p) => !fetchedSlugs.has(p.slug)).map((p) => ({
          slug: p.slug,
          name: p.name,
          description: p.description,
          memberCount: 142,
          isMember: false,
        }));
        setCommunities([...fetched, ...missingPresets]);
      }
      if (discRes.status === 'fulfilled' && Array.isArray(discRes.value.data)) {
        setDiscussions(discRes.value.data);
      }
      if (adRes.status === 'fulfilled' && adRes.value.data?.partnerName) {
        setSponsoredAd(adRes.value.data);
      }
      if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value.data)) {
        setTrendingTopics(trendRes.value.data);
      }
      if (analystRes.status === 'fulfilled' && Array.isArray(analystRes.value.data)) {
        setTopAnalysts(analystRes.value.data);
      }
      if (podcastRes.status === 'fulfilled' && podcastRes.value.data?.isLive) {
        setPodcast(podcastRes.value.data);
      }
      setFeedError('');
    } catch (err) {
      console.error('[AlphaFeed] Data fetch error:', err);
      setFeedError('Could not load AlphaFeed. Check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFeed(true);
  }, []);

  // ── FILTERING & SORTING ──────────────────────────────────────────────────
  const filteredDiscussions = useMemo(() => {
    let list = [...discussions];

    if (selectedCommunitySlug) {
      list = list.filter((d) => d.communitySlug === selectedCommunitySlug);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.ticker || '').toLowerCase().includes(q) ||
          (d.content || d.previewText || '').toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'TOP':
        list.sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
        break;
      case 'LATEST':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'HOT':
      default:
        list.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return (
            b.upvotes * 2 +
            (b.commentCount ?? b.comments.length) * 5 -
            (a.upvotes * 2 + (a.commentCount ?? a.comments.length) * 5)
          );
        });
        break;
    }

    return list;
  }, [discussions, selectedCommunitySlug, searchQuery, sortBy]);

  // ── ACTIONS: COMMUNITIES ─────────────────────────────────────────────────
  const handleJoinCommunity = async (community: Community) => {
    setCommunityBusy(community.slug);
    try {
      if (community.isMember) {
        await api.delete(`/api/community/communities/${community.slug}/join`);
      } else {
        await api.post(`/api/community/communities/${community.slug}/join`);
      }
      const [communityRes, discussionRes] = await Promise.all([
        api.get('/api/community/communities'),
        api.get('/api/community/discussions'),
      ]);
      setCommunities(Array.isArray(communityRes.data) ? communityRes.data : []);
      setDiscussions(Array.isArray(discussionRes.data) ? discussionRes.data : []);
      setFeedError('');
    } catch (error) {
      console.error('[AlphaFeed] membership update failed:', error);
      await Swal.fire({
        title: 'Could not update membership',
        text: 'Please try again.',
        icon: 'error',
        background: '#181A20',
        color: '#EAECEF',
        confirmButtonColor: '#F0B90B',
      });
    } finally {
      setCommunityBusy(null);
    }
  };

  const handleCreateCommunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let name = '';
    let slug = '';
    let description = '';

    if (isCustomMode) {
      if (!customCommunityName.trim() || customCommunityName.trim().length < 2) {
        await Swal.fire({
          title: 'Community Name Required',
          text: 'Please enter a name with at least 2 characters.',
          icon: 'warning',
          background: '#181A20',
          color: '#EAECEF',
          confirmButtonColor: '#F0B90B',
        });
        return;
      }
      name = customCommunityName.trim();
      slug = (customCommunitySlug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
      description = customCommunityDesc.trim();
    } else {
      const preset = CRYPTO_SECTOR_PRESETS.find((p) => p.slug === selectedSectorPreset);
      if (!preset) return;
      name = preset.name;
      slug = preset.slug;
      description = preset.description;
    }

    try {
      const res = await api.post('/api/community/communities', {
        name,
        slug,
        description,
      });

      const createdCommunity = res.data;
      setCommunities((prev) => {
        const exists = prev.some((c) => c.slug === createdCommunity.slug);
        return exists ? prev : [...prev, createdCommunity];
      });

      setSelectedCommunitySlug(createdCommunity.slug);
      setNewCommunitySlug(createdCommunity.slug);
      setIsCreateCommunityOpen(false);
      setCustomCommunityName('');
      setCustomCommunitySlug('');
      setCustomCommunityDesc('');
      setIsCustomMode(false);

      await Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Community "${name}" Active`,
        showConfirmButton: false,
        timer: 2000,
        background: '#181A20',
        color: '#EAECEF',
      });
    } catch (err: any) {
      console.error('[AlphaFeed] create community error:', err);
      const errMsg = err?.response?.data?.error || 'Could not create community. It may already exist.';
      await Swal.fire({
        title: 'Community Creation Error',
        text: errMsg,
        icon: 'error',
        background: '#181A20',
        color: '#EAECEF',
        confirmButtonColor: '#F0B90B',
      });
    }
  };

  // ── ACTIONS: DISCUSSIONS ─────────────────────────────────────────────────
  const handleUpvoteDiscussion = async (discId: string, type: 'UP' | 'DOWN') => {
    try {
      const response = await api.post(`/api/community/discussions/${discId}/vote`, { type });
      setDiscussions((prev) => prev.map((d) => (d.id === discId ? { ...d, ...response.data } : d)));
    } catch (error) {
      console.error('[AlphaFeed] vote failed:', error);
      await Swal.fire({
        title: 'Could not save your vote',
        text: 'Join the community to react to this thread.',
        icon: 'info',
        background: '#181A20',
        color: '#EAECEF',
        confirmButtonColor: '#F0B90B',
      });
    }
  };

  const handleShareDiscussion = async (post: DiscussionPost) => {
    const shareText = `${post.title}\n${post.previewOnly ? post.previewText || '' : post.content || ''}`.trim();
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: shareText, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
        await Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Post copied to clipboard',
          showConfirmButton: false,
          timer: 1600,
          background: '#181A20',
          color: '#EAECEF',
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      await Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Could not share this post',
        showConfirmButton: false,
        timer: 1800,
        background: '#181A20',
        color: '#EAECEF',
      });
    }
  };

  const toggleComments = (discId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(discId)) next.delete(discId);
      else next.add(discId);
      return next;
    });
  };

  const handleAddComment = async (discId: string) => {
    const text = (commentDrafts[discId] || '').trim();
    if (!text) return;
    try {
      const response = await api.post(`/api/community/discussions/${discId}/comments`, {
        content: text,
        displayMode: commentDisplayModes[discId] || 'VISIBLE',
      });
      const created = response.data?.comment || response.data;
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === discId
            ? {
                ...d,
                comments: [...d.comments, created],
                commentCount: (d.commentCount ?? d.comments.length) + 1,
              }
            : d
        )
      );
      setCommentDrafts((prev) => ({ ...prev, [discId]: '' }));
    } catch (error) {
      console.error('[AlphaFeed] comment failed:', error);
      await Swal.fire({
        title: 'Could not post your comment',
        text: 'Please check your connection and try again.',
        icon: 'error',
        background: '#181A20',
        color: '#EAECEF',
        confirmButtonColor: '#F0B90B',
      });
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    const community = communities.find((item) => item.slug === newCommunitySlug);
    if (!newTitle.trim() || !newContent.trim() || !community?.isMember) {
      Swal.fire({
        title: 'Join community first',
        text: !community?.isMember
          ? 'Join the selected community before starting a thread.'
          : 'Add a title and post text to continue.',
        icon: 'warning',
        background: '#181A20',
        color: '#EAECEF',
        confirmButtonColor: '#F0B90B',
      });
      return;
    }

    try {
      const response = await api.post('/api/community/discussions', {
        title: newTitle.trim(),
        content: newContent.trim(),
        communitySlug: newCommunitySlug,
        ticker: newTicker.trim() || undefined,
        category: newCommunitySlug.toUpperCase().replace(/-/g, '_'),
      });
      const newPost = response.data as DiscussionPost;
      setDiscussions((prev) => [newPost, ...prev]);
      setSelectedCommunitySlug(newCommunitySlug);
      setIsComposerOpen(false);
      setNewTitle('');
      setNewTicker('');
      setNewContent('');
      setFeedError('');
    } catch (err) {
      console.error('Failed to post discussion to backend:', err);
      await Swal.fire({
        title: 'Could not publish thread',
        text: 'Please try again. Your post was not added.',
        icon: 'error',
        background: '#181A20',
        color: '#EAECEF',
        confirmButtonColor: '#F0B90B',
      });
    }
  };

  // ── ACTIONS: LIVE PODCAST AUDIO STAGE ─────────────────────────────────────
  const handleToggleListenPodcast = () => {
    if (!podcast) return;
    setPodcast((prev) => {
      if (!prev) return null;
      const nextState = !prev.isListening;
      return {
        ...prev,
        isListening: nextState,
        listenersCount: nextState ? prev.listenersCount + 1 : Math.max(0, prev.listenersCount - 1),
      };
    });
  };

  const handleUpvotePodcast = () => {
    if (!podcast) return;
    setPodcast((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        upvotes: prev.userUpvoted ? prev.upvotes - 1 : prev.upvotes + 1,
        userUpvoted: !prev.userUpvoted,
      };
    });
  };

  const handleRequestStageMic = () => {
    Swal.fire({
      title: 'MIC ACCESS REQUESTED',
      text: 'You have been added to the VIP Speaker Queue. The host will invite you to the mic shortly.',
      icon: 'success',
      background: '#181A20',
      color: '#EAECEF',
      confirmButtonColor: '#F0B90B',
    });
  };

  const handleSendPodcastChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcastChatInput.trim() || !podcast) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      authorWallet: visibleDisplayName,
      tier: (user?.tier as string) || 'FREE',
      isVip: Boolean(user?.isPro),
      message: podcastChatInput.trim(),
      timestamp: 'Just now',
    };

    setPodcast((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        liveChat: [newMsg, ...prev.liveChat],
      };
    });
    setPodcastChatInput('');
  };

  return (
    <div className="w-full space-y-3 pb-8 transition-opacity">
      {/* ── COMMUNITY HEADER ── */}
      <div className="page-header-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PageIcon name="feed" size={40} />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-alphabag-text tracking-tight">AlphaFeed</h1>
              <p className="text-xs text-alphabag-subtext">
                Live Trade Signals, Collaborative Web3 Due Diligence & Market Intelligence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Create Community CTA */}
          <button
            type="button"
            onClick={() => setIsCreateCommunityOpen(true)}
            className="border border-[#2B313A] bg-[#14171D] hover:bg-[#202630] text-alphabag-text px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Globe size={14} className="text-alphabag-yellow" />
            <span>Create Community</span>
          </button>

          {/* New Post CTA */}
          <button
            type="button"
            onClick={() => {
              const joined = communities.find((item) => item.isMember);
              setNewCommunitySlug(joined?.slug || selectedCommunitySlug || communities[0]?.slug || 'general');
              setIsComposerOpen(true);
            }}
            disabled={!communities.length}
            className="bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] disabled:opacity-50 px-4 py-2 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>New post</span>
          </button>
        </div>
      </div>

      {/* ── LIVE AUDIO PODCAST / SPACE CARD ── */}
      {podcast && podcast.isLive && (
        <div className="rounded-xl border border-alphabag-yellow/30 bg-[#14171D] p-4 md:p-5 relative overflow-hidden shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  LIVE AUDIO STAGE
                </span>
                <span className="text-[11px] text-alphabag-subtext font-medium flex items-center gap-1">
                  <strong className="text-alphabag-text tabular-nums">{podcast.listenersCount}</strong> Listening
                </span>
                <span className="bg-[#181A20] text-alphabag-subtext px-2 py-0.5 rounded text-[11px] uppercase font-semibold border border-[#2B313A]">
                  All Users Welcome
                </span>
              </div>

              <h3 className="text-base md:text-lg font-bold text-alphabag-text leading-snug">{podcast.title}</h3>
              <p className="text-xs text-alphabag-subtext font-medium">
                Topic: {podcast.topic} • Host: <strong className="text-alphabag-yellow">{podcast.hostName}</strong> ({podcast.hostWallet})
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] uppercase font-semibold text-alphabag-subtext">Stage Speakers:</span>
                {podcast.stageSpeakers.map((spk, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold border ${
                      spk.isSpeaking
                        ? 'bg-alphabag-yellow/10 text-alphabag-yellow border-alphabag-yellow/40'
                        : 'bg-[#181A20] text-alphabag-subtext border-[#2B313A]'
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              {podcast.isListening && (
                <div className="flex items-center gap-1 px-3 py-2 bg-[#0B0E11] border border-alphabag-yellow/30 rounded-md justify-center">
                  <div className="w-1 bg-alphabag-yellow h-4 animate-bounce rounded-full" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 bg-alphabag-yellow h-6 animate-bounce rounded-full" style={{ animationDelay: '0.3s' }} />
                  <div className="w-1 bg-alphabag-yellow h-3 animate-bounce rounded-full" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 bg-alphabag-yellow h-5 animate-bounce rounded-full" style={{ animationDelay: '0.25s' }} />
                  <span className="text-[11px] text-alphabag-yellow font-bold uppercase ml-1.5 font-mono">ON-AIR</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleToggleListenPodcast}
                className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  podcast.isListening
                    ? 'bg-[#202630] text-alphabag-text hover:bg-[#2B313A] border border-[#2B313A]'
                    : 'bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e]'
                }`}
              >
                <Radio size={14} className={podcast.isListening ? 'animate-spin' : ''} />
                <span>{podcast.isListening ? 'LEAVE BROADCAST' : 'TUNE IN LIVE'}</span>
              </button>

              <button
                type="button"
                onClick={handleUpvotePodcast}
                className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  podcast.userUpvoted
                    ? 'bg-alphabag-yellow/20 text-alphabag-yellow border-alphabag-yellow'
                    : 'bg-[#181A20] border-[#2B313A] text-alphabag-subtext hover:text-alphabag-text'
                }`}
                title="Upvote Live Discussion"
              >
                <ThumbsUp size={13} />
                <span className="tabular-nums font-mono text-xs">{podcast.upvotes}</span>
              </button>

              <button
                type="button"
                onClick={handleRequestStageMic}
                className="px-3 py-2 rounded-md text-xs font-semibold bg-[#181A20] border border-[#2B313A] text-alphabag-subtext hover:text-alphabag-text hover:border-alphabag-yellow/40 flex items-center justify-center gap-1.5 transition-all"
                title="Request to speak on stage"
              >
                <Mic size={13} className="text-alphabag-yellow" />
                <span>Request Mic</span>
              </button>
            </div>
          </div>

          {/* Expandable Live Space Chat */}
          {podcast.isListening && (
            <div className="mt-4 pt-4 border-t border-[#2B313A] space-y-3 transition-opacity">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-alphabag-text uppercase text-[11px] flex items-center gap-1.5">
                  <MessageCircle size={13} className="text-alphabag-yellow" />
                  Live Broadcast Chat & Q&A
                </span>
                <span className="text-[11px] text-alphabag-subtext font-mono">
                  Posting as: <strong className="text-alphabag-yellow">{visibleDisplayName}</strong>
                </span>
              </div>

              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {podcast.liveChat.length > 0 ? (
                  podcast.liveChat.map((msg) => (
                    <div key={msg.id} className="bg-[#0B0E11] border border-[#2B313A] rounded p-2 flex items-start gap-2">
                      <span className="px-1.5 py-0.2 rounded text-[11px] font-bold uppercase shrink-0 bg-alphabag-yellow/15 text-alphabag-yellow">
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
                  <div className="text-center py-2 text-alphabag-subtext text-[11px]">No chat messages yet. Send a question below!</div>
                )}
              </div>

              <form onSubmit={handleSendPodcastChat} className="flex gap-2">
                <input
                  type="text"
                  value={podcastChatInput}
                  onChange={(e) => setPodcastChatInput(e.target.value)}
                  placeholder="Post a question or comment to the live podcast..."
                  className="flex-1 bg-[#0B0E11] border border-[#2B313A] rounded px-3 py-1.5 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                />
                <button
                  type="submit"
                  className="bg-alphabag-yellow text-alphabag-dark font-bold px-3 py-1.5 rounded text-xs uppercase flex items-center gap-1 shrink-0 hover:bg-[#e0bd2e]"
                >
                  <Send size={12} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── COMMUNITY FILTER PILLS, SEARCH AND SORT ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCommunitySlug('')}
            aria-pressed={!selectedCommunitySlug}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap border transition-colors ${
              !selectedCommunitySlug
                ? 'bg-alphabag-yellow text-alphabag-dark border-alphabag-yellow shadow-sm'
                : 'bg-[#181A20] text-alphabag-subtext border-[#2B313A] hover:text-alphabag-text'
            }`}
          >
            All communities
          </button>
          <button
            type="button"
            onClick={() => setIsCreateCommunityOpen(true)}
            className="px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap border border-alphabag-yellow/40 bg-alphabag-yellow/10 text-alphabag-yellow hover:bg-alphabag-yellow hover:text-alphabag-dark flex items-center gap-1 transition-colors shrink-0"
            title="Create a new crypto community"
            aria-label="Add New Community"
          >
            <Plus size={13} />
            <span>New Community</span>
          </button>
          {communities.map((community) => (
            <button
              key={community.slug}
              type="button"
              onClick={() => setSelectedCommunitySlug(community.slug)}
              aria-pressed={selectedCommunitySlug === community.slug}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap border transition-colors ${
                selectedCommunitySlug === community.slug
                  ? 'bg-alphabag-yellow text-alphabag-dark border-alphabag-yellow shadow-sm'
                  : 'bg-[#181A20] text-alphabag-subtext border-[#2B313A] hover:text-alphabag-text'
              }`}
            >
              {community.name}
              {community.isMember ? ' · Joined' : ''}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <label className="relative flex-1 sm:max-w-sm">
            <span className="sr-only">Search posts</span>
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-alphabag-subtext" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts or tickers..."
              className="w-full bg-[#181A20] border border-[#2B313A] rounded-md pl-8 pr-3 py-2 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-alphabag-subtext">
            <span>Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'HOT' | 'TOP' | 'LATEST')}
              className="bg-[#181A20] border border-[#2B313A] text-alphabag-text rounded-md px-2.5 py-2 text-xs focus:outline-none focus:border-alphabag-yellow font-medium"
            >
              <option value="LATEST">Latest</option>
              <option value="HOT">Popular</option>
              <option value="TOP">Top rated</option>
            </select>
          </label>
        </div>
      </div>

      {feedError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-300"
        >
          <span>{feedError}</span>
          <button type="button" onClick={() => void loadFeed(true)} className="font-semibold underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT GRID (FEED + SIDEBAR) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* ── LEFT COLUMN: DISCUSSIONS FEED (8 COLS) ── */}
        <div className="lg:col-span-8 space-y-3">
          {/* IN-FEED SPONSORED PARTNER BANNER */}
          {sponsoredAd && (
            <div className="rounded-xl border border-alphabag-yellow/30 bg-[#14171D] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-alphabag-yellow/10 border border-alphabag-yellow/30 flex items-center justify-center text-alphabag-yellow shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-alphabag-yellow/15 text-alphabag-yellow px-1.5 py-0.2 rounded text-[11px] font-bold uppercase tracking-wider border border-alphabag-yellow/20">
                      {sponsoredAd.badge || 'SPONSORED'}
                    </span>
                    <h4 className="text-xs font-bold text-alphabag-text">{sponsoredAd.partnerName}</h4>
                  </div>
                  <p className="text-[11px] text-alphabag-subtext mt-0.5 leading-relaxed">{sponsoredAd.tagline}</p>
                </div>
              </div>
              <a
                href={sponsoredAd.ctaUrl}
                target={sponsoredAd.ctaUrl.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
              >
                <span>{sponsoredAd.ctaText}</span>
                <ArrowUpRight size={13} />
              </a>
            </div>
          )}

          {/* DISCUSSION CARDS */}
          {isLoading ? (
            <div className="rounded-xl border border-[#2B313A] bg-[#14171D] p-12 text-center space-y-3">
              <Loader2 className="animate-spin text-alphabag-yellow mx-auto" size={24} />
              <p className="text-xs text-alphabag-subtext">Loading live community discussions...</p>
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <div className="rounded-xl border border-[#2B313A] bg-[#14171D] p-12 text-center space-y-3">
              <MessageSquare size={32} className="text-alphabag-subtext mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-alphabag-text">No discussions found</h3>
              <p className="text-xs text-alphabag-subtext max-w-sm mx-auto">
                Be the first to publish research or ask a question in this community!
              </p>
              <button
                type="button"
                onClick={() => {
                  const joined = communities.find((item) => item.isMember);
                  setNewCommunitySlug(joined?.slug || selectedCommunitySlug || communities[0]?.slug || 'general');
                  setIsComposerOpen(true);
                }}
                className="mt-2 px-4 py-2 bg-alphabag-yellow text-alphabag-dark font-bold text-xs uppercase tracking-wider rounded-md"
              >
                Start First Discussion
              </button>
            </div>
          ) : (
            filteredDiscussions.map((post) => {
              const isExpanded = expandedComments.has(post.id);
              const draft = commentDrafts[post.id] || '';

              return (
                <div
                  key={post.id}
                  className="rounded-xl border border-[#2B313A] bg-[#14171D] p-4 space-y-3 transition-colors hover:border-[#384252]"
                >
                  {/* Top Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2B313A] pb-2.5">
                    <div className="flex items-center gap-2">
                      {post.isPinned && (
                        <span className="bg-alphabag-yellow text-alphabag-dark text-[11px] font-bold px-1.5 py-0.2 rounded uppercase">
                          PINNED
                        </span>
                      )}
                      <span className="bg-[#181A20] text-alphabag-subtext px-2 py-0.5 rounded text-[11px] font-semibold border border-[#2B313A]">
                        {post.communityName || post.category.replace(/_/g, ' ')}
                      </span>
                      {post.ticker && (
                        <span className="bg-[#0B0E11] border border-[#2B313A] text-alphabag-yellow font-semibold font-mono px-2 py-0.5 rounded text-[11px]">
                          {post.ticker}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-alphabag-subtext">
                      <span>
                        by <strong className="text-alphabag-text">{post.authorName || 'Community member'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Post Title & Content */}
                  <h3 className="text-base font-semibold text-alphabag-text tracking-tight leading-snug">{post.title}</h3>

                  <p className="text-sm text-alphabag-subtext whitespace-pre-line leading-relaxed">
                    {post.previewOnly ? post.previewText : post.content}
                  </p>

                  {/* Non-Member Preview Lock Banner */}
                  {post.previewOnly && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#2B313A] bg-[#0B0E11] px-3 py-2.5">
                      <div className="flex items-center gap-2 text-xs text-alphabag-subtext">
                        <Lock size={13} className="text-alphabag-yellow" />
                        <span>Join to read the full thread and community replies.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const community = communities.find((item) => item.slug === post.communitySlug);
                          if (community) void handleJoinCommunity(community);
                        }}
                        disabled={!post.communitySlug || communityBusy === post.communitySlug}
                        className="px-3 py-1.5 rounded-md bg-alphabag-yellow text-alphabag-dark text-xs font-semibold disabled:opacity-50"
                      >
                        {communityBusy === post.communitySlug ? 'Joining…' : 'Join community'}
                      </button>
                    </div>
                  )}

                  {/* Actions Command Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#2B313A]">
                    <div className="flex items-center gap-2">
                      {/* Upvote Button */}
                      <button
                        type="button"
                        onClick={() => void handleUpvoteDiscussion(post.id, 'UP')}
                        disabled={post.previewOnly}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all border ${
                          post.userVoted === 'UP'
                            ? 'bg-alphabag-yellow text-alphabag-dark font-bold border-alphabag-yellow'
                            : 'bg-[#181A20] border-[#2B313A] text-alphabag-subtext hover:text-alphabag-text'
                        }`}
                        title={post.previewOnly ? 'Join the community to rate this post' : 'Rate this post'}
                      >
                        <ThumbsUp size={13} />
                        <span className="font-mono tabular-nums">{post.upvotes}</span>
                      </button>

                      {/* Comments Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isExpanded
                            ? 'bg-[#202630] border-[#2B313A] text-alphabag-yellow'
                            : 'bg-[#181A20] border-[#2B313A] text-alphabag-subtext hover:text-alphabag-text'
                        }`}
                      >
                        <MessageSquare size={13} />
                        <span>{post.previewOnly ? post.comments.length : post.commentCount ?? post.comments.length} Comments</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={() => void handleShareDiscussion(post)}
                        className="px-2.5 py-1.5 rounded-md border border-[#2B313A] bg-[#181A20] text-alphabag-subtext hover:text-alphabag-text text-xs font-semibold flex items-center gap-1"
                        aria-label={`Share post: ${post.title}`}
                      >
                        <Share2 size={13} />
                        <span>Share</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-alphabag-subtext font-mono">
                      <span>{new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* ── EXPANDABLE COMMENT THREAD ── */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-[#2B313A] space-y-3 transition-opacity">
                      <div className="bg-[#0B0E11] border border-[#2B313A] rounded-md p-3 space-y-2">
                        <label htmlFor={`comment-${post.id}`} className="text-xs font-semibold text-alphabag-text">
                          Add a comment
                        </label>
                        <textarea
                          id={`comment-${post.id}`}
                          value={draft}
                          onChange={(e) => setCommentDrafts((p) => ({ ...p, [post.id]: e.target.value }))}
                          placeholder="Write a comment…"
                          maxLength={2000}
                          rows={3}
                          className="w-full bg-[#181A20] border border-[#2B313A] rounded-md p-2.5 text-sm text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow resize-y"
                        />
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <label className="flex items-center gap-2 text-xs text-alphabag-subtext">
                            Comment as
                            <select
                              value={commentDisplayModes[post.id] || 'VISIBLE'}
                              onChange={(e) =>
                                setCommentDisplayModes((p) => ({
                                  ...p,
                                  [post.id]: e.target.value as 'VISIBLE' | 'ANONYMOUS',
                                }))
                              }
                              className="bg-[#181A20] border border-[#2B313A] rounded px-2 py-1 text-xs text-alphabag-text"
                            >
                              <option value="VISIBLE">{visibleDisplayName}</option>
                              <option value="ANONYMOUS">Anonymous</option>
                            </select>
                          </label>
                          <button
                            type="button"
                            onClick={() => void handleAddComment(post.id)}
                            disabled={!draft.trim()}
                            className="bg-alphabag-yellow text-alphabag-dark disabled:opacity-40 font-semibold px-3 py-1.5 rounded-md text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Send size={12} />
                            <span>Comment</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-alphabag-subtext">
                          {post.previewOnly
                            ? 'Until you join, only you can see your comment.'
                            : 'Visible comments show your profile name; anonymous comments do not show your identity.'}
                        </p>
                      </div>

                      {post.comments.length > 0 ? (
                        <div className="space-y-2" aria-live="polite">
                          {post.comments.map((comment) => (
                            <article key={comment.id} className="bg-[#0B0E11] border border-[#2B313A] rounded-md p-3 space-y-1.5">
                              <div className="flex justify-between items-center gap-2 text-xs">
                                <span className="font-semibold text-alphabag-text">{comment.authorName}</span>
                                <time className="text-[11px] text-alphabag-subtext">{new Date(comment.createdAt).toLocaleString()}</time>
                              </div>
                              <p className="text-sm text-alphabag-subtext whitespace-pre-line leading-relaxed">{comment.content}</p>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-3 text-xs text-alphabag-subtext">No comments yet. Add the first one.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── RIGHT COLUMN: COMMUNITIES DIRECTORY, SPONSOR & INTEL WIDGETS (4 COLS) ── */}
        <aside className="lg:col-span-4 space-y-3" aria-label="Community directory">
          {/* COMMUNITY DIRECTORY CARD */}
          <section className="rounded-xl border border-[#2B313A] bg-[#14171D] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-alphabag-text">Ecosystem Communities</h2>
                <p className="text-xs text-alphabag-subtext mt-0.5">Join to unlock full threads, rate posts & reply.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCommunityOpen(true)}
                className="text-xs text-alphabag-yellow font-semibold hover:underline flex items-center gap-1"
              >
                <Plus size={12} />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2">
              {communities.map((community) => (
                <div
                  key={community.slug}
                  className="flex items-center justify-between gap-3 border-t border-[#2B313A]/60 pt-2 first:border-0 first:pt-0"
                >
                  <button type="button" onClick={() => setSelectedCommunitySlug(community.slug)} className="min-w-0 text-left">
                    <span className="block text-xs font-semibold text-alphabag-text hover:text-alphabag-yellow transition-colors">
                      {community.name}
                    </span>
                    <span className="block text-[11px] text-alphabag-subtext">{community.memberCount} members</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleJoinCommunity(community)}
                    disabled={communityBusy === community.slug}
                    className={`shrink-0 rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                      community.isMember
                        ? 'border border-[#2B313A] bg-[#181A20] text-alphabag-subtext hover:text-alphabag-text'
                        : 'bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e]'
                    } disabled:opacity-50`}
                  >
                    {communityBusy === community.slug ? '…' : community.isMember ? 'Leave' : 'Join'}
                  </button>
                </div>
              ))}
              {!communities.length && <p className="text-xs text-alphabag-subtext">Communities will appear here when loaded.</p>}
            </div>
          </section>

          {/* SIDEBAR SPONSORED PARTNER CARD */}
          {sponsoredAd && (
            <section className="rounded-xl border border-alphabag-yellow/40 bg-gradient-to-b from-[#181A20] to-[#14171D] p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="bg-alphabag-yellow text-alphabag-dark px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                  {sponsoredAd.badge || 'SPONSORED'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFounderFormOpen(true)}
                  className="text-xs text-alphabag-yellow hover:underline font-semibold"
                >
                  Feature Your Project
                </button>
              </div>
              <h2 className="text-sm font-semibold text-alphabag-text">{sponsoredAd.partnerName}</h2>
              <p className="text-xs text-alphabag-subtext leading-relaxed">{sponsoredAd.description}</p>
              <a
                href={sponsoredAd.ctaUrl}
                target={sponsoredAd.ctaUrl.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all block text-center shadow-sm"
              >
                <span>{sponsoredAd.ctaText}</span>
                <ArrowUpRight size={13} />
              </a>
            </section>
          )}

          {/* TRENDING TOPICS (24H ACTIVE) WIDGET */}
          {trendingTopics.length > 0 && (
            <section className="rounded-xl border border-[#2B313A] bg-[#14171D] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2B313A]">
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
                    type="button"
                    onClick={() => setSearchQuery(tr.ticker)}
                    className="w-full text-left bg-[#181A20] hover:bg-[#202630] border border-[#2B313A] rounded-lg p-2.5 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-alphabag-yellow group-hover:underline">
                          {tr.ticker}
                        </span>
                        <span className="text-[11px] text-alphabag-green font-semibold">{tr.sentiment}</span>
                      </div>
                      <div className="text-[11px] text-alphabag-subtext line-clamp-1 mt-0.5">{tr.topic}</div>
                    </div>
                    <span className="text-[11px] text-alphabag-subtext font-mono shrink-0 pl-2">{tr.posts} posts</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* TOP COMMUNITY ANALYSTS LEADERBOARD WIDGET */}
          {topAnalysts.length > 0 && (
            <section className="rounded-xl border border-[#2B313A] bg-[#14171D] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2B313A]">
                <span className="text-xs font-semibold uppercase text-alphabag-subtext flex items-center gap-1.5">
                  <Award size={14} className="text-alphabag-yellow" />
                  Top Analysts
                </span>
                <span className="text-[11px] text-alphabag-subtext font-mono">By Upvotes</span>
              </div>

              <div className="space-y-2">
                {topAnalysts.map((an, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#181A20] border border-[#2B313A] rounded-lg p-2.5 text-xs">
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
            </section>
          )}

          {/* PRIVACY & DYOR COMMUNITY MANIFESTO WIDGET */}
          <section className="rounded-xl border border-[#2B313A] bg-[#14171D] p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-alphabag-yellow font-bold uppercase text-[11px]">
              <Shield size={14} />
              <span>Privacy & DYOR Manifesto</span>
            </div>
            <p className="text-[11px] text-alphabag-subtext leading-relaxed">
              AlphaBAG Community Hub is a decentralized intelligence forum. No third-party data tracking, zero algorithmic bias.
              All contributor analyses represent individual community contributor perspectives. Always verify on-chain contracts and DYOR.
            </p>
          </section>
        </aside>
      </div>

      {/* ── CREATE COMMUNITY MODAL (RESEARCHED SECTORS + CUSTOM OPTION) ── */}
      {isCreateCommunityOpen && (
        <div
          className="fixed inset-0 bg-[#0B0E11]/85 z-50 flex items-center justify-center p-4 transition-opacity"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-community-title"
        >
          <div className="bg-[#14171D] border border-[#2B313A] rounded-xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#2B313A]">
              <div>
                <span className="text-[11px] font-semibold uppercase text-alphabag-yellow">Crypto Sectors & Ecosystem</span>
                <h2 id="create-community-title" className="text-lg font-bold text-alphabag-text mt-0.5">
                  Launch a Crypto Community
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCommunityOpen(false)}
                className="text-alphabag-subtext hover:text-alphabag-text text-lg font-bold p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCommunitySubmit} className="space-y-4">
              {/* Mode Toggle: Researched Presets vs Custom */}
              <div className="grid grid-cols-2 gap-2 bg-[#0B0E11] p-1 rounded-lg border border-[#2B313A]">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className={`py-1.5 rounded text-xs font-semibold transition-colors ${
                    !isCustomMode
                      ? 'bg-[#202630] text-alphabag-yellow font-bold shadow-sm'
                      : 'text-alphabag-subtext hover:text-alphabag-text'
                  }`}
                >
                  Pick Crypto Sector
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className={`py-1.5 rounded text-xs font-semibold transition-colors ${
                    isCustomMode
                      ? 'bg-[#202630] text-alphabag-yellow font-bold shadow-sm'
                      : 'text-alphabag-subtext hover:text-alphabag-text'
                  }`}
                >
                  Custom Community Name
                </button>
              </div>

              {!isCustomMode ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase text-alphabag-subtext">
                    Select Curated Crypto Sector
                  </label>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {CRYPTO_SECTOR_PRESETS.map((preset) => {
                      const active = selectedSectorPreset === preset.slug;
                      return (
                        <div
                          key={preset.slug}
                          onClick={() => setSelectedSectorPreset(preset.slug)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                            active
                              ? 'bg-[#202630] border-alphabag-yellow text-alphabag-text'
                              : 'bg-[#181A20] border-[#2B313A] text-alphabag-subtext hover:border-[#384252] hover:text-alphabag-text'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-alphabag-text">{preset.name}</span>
                              <span className="text-[11px] font-mono uppercase px-1.5 py-0.2 rounded bg-alphabag-yellow/15 text-alphabag-yellow">
                                {preset.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-alphabag-subtext mt-0.5 leading-relaxed">
                              {preset.description}
                            </p>
                          </div>
                          {active && <span className="text-alphabag-yellow font-bold text-xs mt-1">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block space-y-1 text-xs font-semibold text-alphabag-subtext">
                    Community Name
                    <input
                      type="text"
                      value={customCommunityName}
                      onChange={(e) => setCustomCommunityName(e.target.value)}
                      placeholder="e.g. Solana Early Alpha, Base Ecosystem Builders"
                      maxLength={60}
                      required
                      className="w-full bg-[#0B0E11] border border-[#2B313A] rounded-md p-2.5 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                    />
                  </label>

                  <label className="block space-y-1 text-xs font-semibold text-alphabag-subtext">
                    URL Slug (Optional)
                    <input
                      type="text"
                      value={customCommunitySlug}
                      onChange={(e) => setCustomCommunitySlug(e.target.value)}
                      placeholder="e.g. solana-alpha"
                      maxLength={40}
                      className="w-full bg-[#0B0E11] border border-[#2B313A] rounded-md p-2.5 text-xs font-mono text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                    />
                  </label>

                  <label className="block space-y-1 text-xs font-semibold text-alphabag-subtext">
                    Community Description & Focus
                    <textarea
                      value={customCommunityDesc}
                      onChange={(e) => setCustomCommunityDesc(e.target.value)}
                      placeholder="Explain what kind of research, project calls, or alpha this community focuses on..."
                      maxLength={300}
                      rows={3}
                      className="w-full bg-[#0B0E11] border border-[#2B313A] rounded-md p-2.5 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow resize-none"
                    />
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2B313A]">
                <button
                  type="button"
                  onClick={() => setIsCreateCommunityOpen(false)}
                  className="px-4 py-2 border border-[#2B313A] text-alphabag-subtext rounded-md text-xs font-semibold hover:text-alphabag-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-alphabag-yellow text-alphabag-dark rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#e0bd2e] shadow-sm"
                >
                  {isCustomMode ? 'Create Community' : 'Launch Sector Community'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NEW POST COMPOSER MODAL ── */}
      {isComposerOpen && (
        <div
          className="fixed inset-0 bg-[#0B0E11]/85 z-50 flex items-center justify-center p-4 transition-opacity"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-post-title"
        >
          <div className="bg-[#14171D] border border-[#2B313A] rounded-xl max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-[#2B313A]">
              <div>
                <p className="text-xs text-alphabag-subtext">AlphaFeed</p>
                <h2 id="new-post-title" className="text-lg font-bold text-alphabag-text mt-0.5">
                  Create a Post
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="text-alphabag-subtext hover:text-alphabag-text px-2 py-1 text-lg font-bold"
                aria-label="Close post composer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDiscussion} className="space-y-3">
              <div>
                <div className="flex items-center justify-between pb-1.5">
                  <label htmlFor="post-community-select" className="text-xs font-semibold text-alphabag-subtext">
                    Community / Crypto Sector
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreateCommunityOpen(true)}
                    className="text-xs font-bold text-alphabag-yellow hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>+ Create New Community</span>
                  </button>
                </div>
                <select
                  id="post-community-select"
                  value={newCommunitySlug}
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setIsCreateCommunityOpen(true);
                    } else {
                      setNewCommunitySlug(e.target.value);
                    }
                  }}
                  className="w-full bg-[#0B0E11] border border-[#2B313A] rounded-md p-2.5 text-sm text-alphabag-text font-medium focus:outline-none focus:border-alphabag-yellow"
                >
                  {communities.map((community) => (
                    <option key={community.slug} value={community.slug}>
                      {community.name}
                      {community.isMember ? '' : ' (join required)'}
                    </option>
                  ))}
                  <option value="__CREATE_NEW__">➕ + Create or Add New Community...</option>
                </select>
                <div className="flex items-center justify-between text-[11px] text-alphabag-subtext mt-1.5">
                  <span>Pick from 13+ crypto sectors (DeFi, Degen, Memes, AI, RWAs...)</span>
                  <button
                    type="button"
                    onClick={() => setIsCreateCommunityOpen(true)}
                    className="text-alphabag-yellow hover:underline font-semibold"
                  >
                    Can't find your sector?
                  </button>
                </div>
              </div>

              {communities.find((item) => item.slug === newCommunitySlug)?.isMember ? (
                <>
                  <label className="block space-y-1 text-xs font-semibold text-alphabag-subtext">
                    Title
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      maxLength={160}
                      required
                      placeholder="What would you like to discuss?"
                      className="w-full bg-[#0B0E11] border border-[#2B313A] rounded-md p-2.5 text-sm text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                    />
                  </label>
                  <label className="block space-y-1 text-xs font-semibold text-alphabag-subtext">
                    Post
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      maxLength={12000}
                      rows={7}
                      required
                      placeholder="Share your question, idea, research or analysis…"
                      className="w-full bg-[#0B0E11] border border-[#2B313A] rounded-md p-3 text-sm text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow resize-y leading-relaxed"
                    />
                  </label>
                  <label className="block space-y-1 text-xs font-semibold text-alphabag-subtext">
                    Ticker <span className="font-normal">(optional)</span>
                    <input
                      type="text"
                      value={newTicker}
                      onChange={(e) => setNewTicker(e.target.value)}
                      maxLength={24}
                      placeholder="$BAG, $SOL, $BTC"
                      className="w-full bg-[#0B0E11] border border-[#2B313A] rounded-md p-2.5 text-sm font-mono text-alphabag-yellow placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow uppercase"
                    />
                  </label>
                </>
              ) : (
                <div className="rounded-md border border-[#2B313A] bg-[#0B0E11] p-3 text-sm text-alphabag-subtext flex items-center justify-between gap-3">
                  <span>Join this community before creating a post.</span>
                  {communities.find((item) => item.slug === newCommunitySlug) && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleJoinCommunity(communities.find((item) => item.slug === newCommunitySlug)!)
                      }
                      className="px-3 py-1 bg-alphabag-yellow text-alphabag-dark font-bold text-xs rounded hover:bg-[#e0bd2e] shrink-0"
                    >
                      Join now
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2B313A]">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 border border-[#2B313A] text-alphabag-subtext rounded-md text-xs font-semibold hover:text-alphabag-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !communities.find((item) => item.slug === newCommunitySlug)?.isMember ||
                    !newTitle.trim() ||
                    !newContent.trim()
                  }
                  className="px-5 py-2 bg-alphabag-yellow text-alphabag-dark rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#e0bd2e] disabled:opacity-50 shadow-sm"
                >
                  Publish post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FOUNDER LISTING FORM MODAL ── */}
      {isFounderFormOpen && <FounderListingForm isOpen={isFounderFormOpen} onClose={() => setIsFounderFormOpen(false)} />}
    </div>
  );
};
