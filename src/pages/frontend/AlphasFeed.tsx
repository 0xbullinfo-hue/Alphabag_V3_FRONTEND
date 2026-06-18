import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
    MessageSquare, Heart, Share2, MoreHorizontal, Shield, Zap, TrendingUp,
    Filter, Search, Plus, MessageCircle, Target, Image as ImageIcon,
    BarChart2, Smile, Calendar, MapPin, CheckCircle, Bookmark, BarChart,
    ExternalLink, Users, Rocket, Globe, Star
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AlphaRadarService } from '../../services/alphaRadarService';
import { FounderListingForm } from '../../components/frontend/FounderListingForm';
import { Post, Project } from '../../types';
import { useAuth } from '../../context/AuthContext';

type FeedTab = 'FOR_YOU' | 'FOLLOWING' | 'ALPHABAG';

type StrategyFilter = Post['strategy'] | '';

type FounderProject = Project & {
    tickerSymbol?: string;
    isPaidSponsor?: boolean;
};

type SidebarAd = {
    id: string;
    name: string;
    symbol?: string;
    description: string;
    logoUrl?: string;
    isAd?: boolean;
    isVerified?: boolean;
};

const FEED_DRAFT_STORAGE_KEY = 'alphabag:alphas-feed:draft';
const MAX_POST_LENGTH = 280;

const formatRelativeTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const diffMs = date.getTime() - Date.now();
    const seconds = Math.round(diffMs / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
    if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
    return rtf.format(days, 'day');
};

const highlightContent = (content: string) => {
    const parts = content.split(/(https?:\/\/[^\s]+|\$[A-Za-z0-9_]{2,12})/g);
    return parts.map((part, index) => {
        if (/^https?:\/\//i.test(part)) {
            return (
                <a
                    key={`${part}-${index}`}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-alphabag-yellow underline decoration-alphabag-yellow/30 hover:decoration-alphabag-yellow"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }

        if (/^\$[A-Za-z0-9_]{2,12}$/.test(part)) {
            return (
                <span key={`${part}-${index}`} className="text-alphabag-yellow font-bold">
                    {part.toUpperCase()}
                </span>
            );
        }

        return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    });
};

const MOCK_ALPHAS: Post[] = [
    {
        id: '1',
        authorId: 'user1',
        content: "Just snagged a massive entry on $ALPHA. Community heat is off the charts and the new SDK release is imminent. Don't fade the genesis multiplier.",
        projectId: 'pid_alpha',
        likeCount: 1250,
        commentCount: 85,
        shareCount: 120,
        createdAt: new Date().toISOString(),
        boostMultiplier: 10,
        logoUrl: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png',
        bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop',
        strategy: 'DEGEN'
    },
    {
        id: '2',
        authorId: 'user2',
        content: "Shorting $RUG on the 4H chart. Bearish divergence on RSI and volume is dropping off a cliff. Targets below support.",
        likeCount: 450,
        commentCount: 22,
        shareCount: 15,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        strategy: 'SHORT'
    },
    {
        id: '3',
        authorId: 'user3',
        content: "Accumulating $ETH at these levels. The rollup thesis is intact and institutional adoption is quietly absorbing supply.",
        likeCount: 3200,
        commentCount: 150,
        shareCount: 400,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        strategy: 'LONGTERM'
    },
    {
        id: '4',
        authorId: 'user4',
        content: "New testnet live for Zeta. 5 mins to bridge and interact. Potential multi-tier airdrop confirmed for Q3.",
        likeCount: 890,
        commentCount: 112,
        shareCount: 340,
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        strategy: 'AIRDROP'
    }
];

export const AlphasFeed: React.FC = () => {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<FeedTab>('FOR_YOU');
    const [isListingOpen, setIsListingOpen] = useState(false);
    const [sidebarAds, setSidebarAds] = useState<SidebarAd[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyFilter>('');
    const [feedPosts, setFeedPosts] = useState<Post[]>(MOCK_ALPHAS);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [foundersProjects, setFoundersProjects] = useState<FounderProject[]>([]);
    const [isSidebarLoading, setIsSidebarLoading] = useState(true);
    const [sidebarError, setSidebarError] = useState<string | null>(null);

    const showBetaNotice = React.useCallback((title: string, text: string) => {
        void Swal.fire({
            icon: 'info',
            title,
            text,
            background: '#0a0a0a',
            color: '#fff',
            confirmButtonColor: '#fcd535',
        });
    }, []);

    const tabs: Array<{ label: string; value: FeedTab }> = [
        { label: 'For you', value: 'FOR_YOU' },
        { label: 'Following', value: 'FOLLOWING' },
        { label: 'AlphaBAG', value: 'ALPHABAG' },
    ];

    const loadSidebarData = React.useCallback(async () => {
        setIsSidebarLoading(true);
        setSidebarError(null);

        try {
            const [ads, projects] = await Promise.all([
                AlphaRadarService.getAds('SIDEBAR'),
                AlphaRadarService.getAllProjects(),
            ]);

            setSidebarAds(Array.isArray(ads) ? ads : []);
            setFoundersProjects(Array.isArray(projects) ? projects : []);
        } catch (err) {
            console.error('Failed to fetch sidebar data', err);
            setSidebarError('Unable to load live community data right now.');
        } finally {
            setIsSidebarLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadSidebarData();
    }, [loadSidebarData]);

    React.useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(FEED_DRAFT_STORAGE_KEY);
            if (savedDraft) setNewPostContent(savedDraft);
        } catch (error) {
            console.warn('Unable to load feed draft from storage', error);
        }
    }, []);

    React.useEffect(() => {
        try {
            localStorage.setItem(FEED_DRAFT_STORAGE_KEY, newPostContent);
        } catch (error) {
            console.warn('Unable to persist feed draft', error);
        }
    }, [newPostContent]);

    const handleCreatePost = () => {
        if (!newPostContent.trim()) return;

        if (newPostContent.length > MAX_POST_LENGTH) {
            void Swal.fire({
                icon: 'warning',
                title: 'Post Too Long',
                text: `Posts are limited to ${MAX_POST_LENGTH} characters.`,
                background: '#0b0e11',
                color: '#fff',
                confirmButtonColor: '#fcd535',
            });
            return;
        }

        const myPost: Post = {
            id: Date.now().toString(),
            authorId: user?.id || 'guest',
            content: newPostContent.trim(),
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            createdAt: new Date().toISOString(),
            strategy: selectedStrategy || undefined
        };

        setFeedPosts((prev) => [myPost, ...prev]);
        setNewPostContent('');
        setSelectedStrategy('');
        localStorage.removeItem(FEED_DRAFT_STORAGE_KEY);
    };

    const handleComposerToolClick = (toolName: string) => {
        showBetaNotice('Composer Tool In Beta', `${toolName} will be enabled in the next feed release.`);
    };

    const handleExploreFeatures = () => {
        window.location.hash = '#/integrations';
        showBetaNotice('All Features Open', 'Alpha Feed functionality is accessible to all users.');
    };

    const handlePromotedProjectHub = () => {
        window.location.hash = '#/alpha-radar';
    };

    const handleAdvertise = () => {
        void window.open('https://t.me/alphabag_access', '_blank', 'noopener,noreferrer');
    };

    const handleShowMoreFounders = () => {
        window.location.hash = '#/alpha-radar';
    };

    const handleShowMoreLive = () => {
        window.location.hash = '#/integrations';
    };

    const toggleFollow = (authorId: string) => {
        const newSet = new Set(followingIds);
        if (newSet.has(authorId)) {
            newSet.delete(authorId);
        } else {
            newSet.add(authorId);
        }
        setFollowingIds(newSet);
    };

    const getRankedPosts = (posts: Post[]) => {
        return [...posts].sort((a, b) => {
            const ageHoursA = Math.max(0, (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60));
            const ageHoursB = Math.max(0, (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60));

            const scoreA = (a.likeCount * 2) + (a.commentCount * 5) + (a.shareCount * 4) + ((a.boostMultiplier || 1) * 12) + Math.max(0, 24 - ageHoursA) * 3 + (followingIds.has(a.authorId) ? 18 : 0);
            const scoreB = (b.likeCount * 2) + (b.commentCount * 5) + (b.shareCount * 4) + ((b.boostMultiplier || 1) * 12) + Math.max(0, 24 - ageHoursB) * 3 + (followingIds.has(b.authorId) ? 18 : 0);
            return scoreB - scoreA;
        });
    };

    const getFilteredPosts = () => {
        let filtered = [...feedPosts];

        if (activeTab === 'FOLLOWING') {
            filtered = filtered.filter(p => followingIds.has(p.authorId));
        } else if (activeTab === 'ALPHABAG') {
            filtered = filtered.filter(p => p.boostMultiplier && p.boostMultiplier > 1);
        }

        if (search.trim()) {
            const query = search.toLowerCase();
            filtered = filtered.filter(p => p.content.toLowerCase().includes(query) || p.authorId.toLowerCase().includes(query) || (p.strategy?.toLowerCase().includes(query) ?? false));
        }

        if (activeTab === 'FOR_YOU') {
            return getRankedPosts(filtered);
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const filteredPosts = React.useMemo(getFilteredPosts, [feedPosts, activeTab, followingIds, search]);

    const postLength = newPostContent.length;
    const postLengthPct = Math.min((postLength / MAX_POST_LENGTH) * 100, 100);
    const isNearLimit = postLength > MAX_POST_LENGTH * 0.85;

    return (
        <div className="relative min-h-screen">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 transition-all duration-700">

                {/* Left Sidebar: Featured Founders */}
                <div className="hidden lg:block lg:col-span-3 sticky top-0 h-screen overflow-y-auto pt-0 pb-10 hide-scrollbar">
                    <div className="rounded-lg border border-[#2b3139] bg-[#1e2329] overflow-hidden">
                        <div className="p-2.5 border-b border-[#2b3139] bg-[#0b0e11] flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#eaecef] flex items-center gap-2">
                                <Users size={12} className="text-[#fcd535]" /> Featured Founders
                            </span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {isSidebarLoading ? (
                                [...Array(4)].map((_, idx) => (
                                    <div key={idx} className="p-2.5 flex items-start gap-2.5 animate-pulse">
                                        <div className="w-9 h-9 rounded-full bg-white/10" />
                                        <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                                            <div className="h-3 w-2/3 rounded bg-white/10" />
                                            <div className="h-2.5 w-1/3 rounded bg-white/10" />
                                        </div>
                                    </div>
                                ))
                            ) : foundersProjects.length > 0 ? (
                                [...foundersProjects]
                                    .sort((a, b) => (b.isPaidSponsor ? 1 : 0) - (a.isPaidSponsor ? 1 : 0))
                                    .map(project => (
                                        <div
                                            key={project.id}
                                            onClick={() => window.location.hash = `#/alpha-radar?project=${project.id}`}
                                            className="p-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer group flex items-start gap-2.5 relative"
                                        >
                                            <div className="w-9 h-9 bg-alphabag-black border border-white/10 rounded-full flex items-center justify-center font-black text-alphabag-yellow overflow-hidden shrink-0 uppercase shadow-inner group-hover:border-alphabag-yellow/50 transition-all">
                                                {project.logoUrl ? (
                                                    <img src={project.logoUrl} alt={project.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    project.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="font-bold text-[12px] text-white truncate group-hover:text-alphabag-yellow transition-colors">{project.name}</div>
                                                    <CheckCircle className="w-3 h-3 text-alphabag-yellow shrink-0" fill="currentColor" />
                                                </div>
                                                <div className="text-[10px] font-medium text-alphabag-muted truncate mt-0.5">${project.tickerSymbol || project.symbol}</div>
                                            </div>
                                            {project.isPaidSponsor && (
                                                <div className="absolute top-3 right-3 flex items-center text-[7px] font-black text-alphabag-yellow uppercase tracking-widest bg-alphabag-yellow/10 px-1.5 py-0.5 rounded border border-alphabag-yellow/20">
                                                    <Star size={7} className="mr-1 fill-current" /> Promoted
                                                </div>
                                            )}
                                        </div>
                                    ))
                            ) : sidebarError ? (
                                <div className="p-4 text-center space-y-2">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-red-300">{sidebarError}</div>
                                    <button
                                        onClick={loadSidebarData}
                                        className="text-[9px] font-black uppercase tracking-widest text-alphabag-yellow hover:text-white transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-alphabag-muted">
                                    No founders available.
                                </div>
                            )}
                        </div>
                        <div className="p-2.5 border-t border-white/5 bg-white/5">
                            <button
                                onClick={handleShowMoreFounders}
                                className="text-[9px] font-black uppercase tracking-widest text-alphabag-yellow hover:text-white w-full text-left transition-colors"
                            >
                                Show more
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Feed */}
                <div className="lg:col-span-6 border-x border-white/5 min-h-screen">
                    <div className="p-3 border-b border-white/5 bg-alphabag-black/50 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-alphabag-yellow to-yellow-600 flex items-center justify-center text-black shadow-glow-yellow/10">
                                <Zap size={14} />
                            </div>
                            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase relative flex items-center">
                                Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">Feed</span>
                            </h1>
                        </div>
                        <p className="text-[9px] text-alphabag-muted font-bold uppercase tracking-widest opacity-60">Real-time signals from the AlphaBAG network</p>
                    </div>

                    {/* Top Tabs */}
                    <div className="sticky top-0 z-20 bg-alphabag-black/80 backdrop-blur-xl border-b border-white/5">
                        <div className="flex w-full">
                            {tabs.map(({ label, value }) => {
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setActiveTab(value)}
                                        className="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group"
                                    >
                                        <span className={activeTab === value ? 'text-white' : 'text-alphabag-muted group-hover:text-white'}>
                                            {label}
                                        </span>
                                        {activeTab === value && (
                                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-alphabag-yellow shadow-glow-yellow/50" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Create Post */}
                    <div className="p-3 border-b border-white/5">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-alphabag-yellow/10 border border-alphabag-yellow/20 rounded-full flex items-center justify-center font-black text-alphabag-yellow uppercase shadow-inner overflow-hidden">
                                {(user?.email?.[0] || 'G').toUpperCase()}
                            </div>
                            <div className="flex-1 space-y-2">
                                    <textarea
                                        className="w-full bg-transparent border-none text-white placeholder:text-alphabag-muted focus:ring-0 resize-none py-1.5 text-lg leading-snug"
                                        placeholder={user ? "What's happening?" : "What's happening? You are posting as Guest."}
                                        rows={2}
                                        value={newPostContent}
                                        maxLength={MAX_POST_LENGTH}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        onKeyDown={(e) => {
                                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                                e.preventDefault();
                                                handleCreatePost();
                                            }
                                        }}
                                    />

                                    <div className="space-y-1">
                                        <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${isNearLimit ? 'bg-orange-400' : 'bg-alphabag-yellow'}`}
                                                style={{ width: `${postLengthPct}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                            <span className="text-alphabag-muted">Ctrl/Cmd + Enter to post</span>
                                            <span className={isNearLimit ? 'text-orange-400' : 'text-alphabag-muted'}>{postLength}/{MAX_POST_LENGTH}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1 -ml-2 text-alphabag-yellow">
                                                {[ImageIcon, BarChart2, Smile, Calendar, MapPin].map((Icon, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleComposerToolClick(Icon.displayName || Icon.name || 'Composer tool')}
                                                        className="p-2 hover:bg-alphabag-yellow/10 rounded-full transition-colors"
                                                    >
                                                        <Icon size={18} />
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2 ml-2">
                                                <select
                                                    className="bg-alphabag-black/50 border border-white/10 text-[10px] text-white font-bold uppercase tracking-widest rounded-lg px-2 py-1 outline-none appearance-none"
                                                    value={selectedStrategy}
                                                    onChange={(e) => setSelectedStrategy(e.target.value as StrategyFilter)}
                                                >
                                                    <option value="">No Tag</option>
                                                    <option value="DEGEN">DEGEN</option>
                                                    <option value="SHORT">SHORT</option>
                                                    <option value="LONGTERM">LONGTERM</option>
                                                    <option value="AIRDROP">AIRDROP</option>
                                                </select>
                                                <button
                                                    onClick={() => window.location.hash = '#/genesis-manifesto'}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-alphabag-yellow/10 border border-alphabag-yellow/30 rounded-full text-[10px] text-alphabag-yellow font-black uppercase tracking-widest hover:bg-alphabag-yellow/20 transition-all"
                                                >
                                                    <Rocket size={12} /> Manifesto
                                                </button>
                                                <button
                                                    onClick={() => setIsListingOpen(true)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] text-blue-400 font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                                                >
                                                    <Plus size={12} /> List Project
                                                </button>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleCreatePost}
                                            disabled={!newPostContent.trim() || newPostContent.length > MAX_POST_LENGTH}
                                            className="px-4 bg-alphabag-yellow text-black font-black uppercase tracking-widest rounded-full py-1 disabled:opacity-50 text-[10px]"
                                        >
                                            Post
                                        </Button>
                                    </div>
                            </div>
                        </div>
                    </div>

                    {/* Feed Posts */}
                    <div className="divide-y divide-white/5">
                        {filteredPosts.length > 0 ? (
                            filteredPosts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    isFollowing={followingIds.has(post.authorId)}
                                    onFollowToggle={() => toggleFollow(post.authorId)}
                                />
                            ))
                        ) : (
                            <div className="p-8 text-center space-y-3">
                                <div className="mx-auto w-12 h-12 rounded-full bg-alphabag-yellow/10 border border-alphabag-yellow/20 flex items-center justify-center">
                                    <Search size={20} className="text-alphabag-yellow" />
                                </div>
                                <div className="text-sm font-black uppercase tracking-widest text-white">
                                    {activeTab === 'FOLLOWING' ? 'No posts from your network yet' : activeTab === 'ALPHABAG' ? 'No boosted alpha signals found' : 'No posts match your search'}
                                </div>
                                <div className="text-xs text-alphabag-muted">
                                    {activeTab === 'FOLLOWING'
                                        ? 'Follow more traders and founders to shape your timeline.'
                                        : 'Try a different search term or switch feed tabs.'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="hidden lg:block lg:col-span-3 pt-0 pb-10 space-y-4 sticky top-0 h-screen overflow-y-auto hide-scrollbar">
                    {/* My Profile Quick Access [NEW] */}
                    <div className="bg-gradient-to-br from-alphabag-yellow/10 to-transparent border border-alphabag-yellow/20 rounded-xl p-2.5 flex items-center justify-between group cursor-pointer hover:bg-alphabag-yellow/20 transition-all"
                        onClick={() => window.location.hash = `#/profile/${user?.id || 'me'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-alphabag-black border border-alphabag-yellow/30 flex items-center justify-center font-black text-alphabag-yellow text-sm">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="text-[13px] font-black text-white uppercase tracking-tight">My Profile</div>
                                <div className="text-[9px] text-alphabag-yellow font-bold uppercase tracking-widest">View Timeline</div>
                            </div>
                        </div>
                        <ExternalLink size={14} className="text-alphabag-yellow opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-muted group-focus-within:text-alphabag-yellow transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search Alphas"
                            className="w-full bg-white/5 border border-transparent focus:border-alphabag-yellow/50 focus:bg-transparent rounded-full py-2.5 pl-11 pr-4 text-[13px] text-white transition-all outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Open Access Widget */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Open Access</h3>
                            <span className="bg-alphabag-yellow/20 text-alphabag-yellow text-[9px] px-2 py-0.5 rounded-full font-black">UNLOCKED</span>
                        </div>
                        <p className="text-[11px] text-alphabag-subtext leading-relaxed font-medium">
                            Alpha Feed tools are live for everyone. Post, share, follow, and engage with full open access.
                        </p>
                        <Button
                            onClick={handleExploreFeatures}
                            className="w-full bg-alphabag-yellow text-black rounded-full font-black uppercase tracking-widest text-[10px] py-2.5 shadow-glow-yellow/20"
                        >
                            Explore Features
                        </Button>
                    </div>

                    {/* NEW: Promotions & Ads Section */}
                    <div className="bg-gradient-to-br from-alphabag-dark to-alphabag-black border border-white/10 rounded-xl overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <Target size={14} className="text-alphabag-yellow" /> Promoted Projects
                            </h3>
                            <span className="text-[8px] bg-white/5 text-alphabag-muted px-1.5 py-0.5 rounded border border-white/10 font-bold uppercase tracking-widest">AD</span>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="group cursor-pointer">
                                <div className="aspect-video bg-alphabag-gray/50 rounded-xl mb-3 overflow-hidden relative border border-white/5">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-black border border-alphabag-yellow/30 rounded-lg flex items-center justify-center font-black text-alphabag-yellow text-xs italic">NB</div>
                                        <div>
                                            <div className="text-[10px] text-white font-black uppercase leading-none">NeuralBag V2</div>
                                            <div className="text-[8px] text-alphabag-yellow font-bold uppercase tracking-widest">Live Integration</div>
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <div className="px-2 py-1 bg-alphabag-yellow text-black text-[8px] font-black rounded uppercase flex items-center gap-1 shadow-lg">
                                            <Zap size={8} fill="currentColor" /> x10 BOOST
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[11px] text-alphabag-subtext leading-relaxed line-clamp-2 italic mb-3">
                                    "The next evolution of AI-driven liquidity analysis is here. Join the NeuralBag genesis event."
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handlePromotedProjectHub}
                                    className="w-full border-alphabag-yellow/20 text-alphabag-yellow text-[9px] h-8 font-black uppercase tracking-widest hover:bg-alphabag-yellow hover:text-black"
                                >
                                    View Project Hub
                                </Button>
                            </div>
                        </div>
                        <div className="p-3 bg-white/5 text-center">
                            <button
                                onClick={handleAdvertise}
                                className="text-[9px] text-alphabag-muted hover:text-white transition-colors font-bold uppercase tracking-widest"
                            >
                                Advertise with AlphaBAG
                            </button>
                        </div>
                    </div>

                    {/* Trending / Live Widget (Sponsored) */}
                    <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
                        <h3 className="text-base font-black text-white uppercase tracking-tight p-3.5">Live on AlphaBag</h3>
                        <div className="divide-y divide-white/5">
                            {isSidebarLoading ? (
                                [...Array(3)].map((_, idx) => (
                                    <div key={idx} className="p-3.5 animate-pulse space-y-2">
                                        <div className="h-3.5 w-2/3 rounded bg-white/10" />
                                        <div className="h-3 w-full rounded bg-white/10" />
                                    </div>
                                ))
                            ) : sidebarAds.length > 0 ? (
                                sidebarAds.map(ad => (
                                <div
                                    key={ad.id}
                                    onClick={() => window.location.hash = '#/alpha-radar'}
                                    className="p-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-alphabag-dark rounded flex items-center justify-center text-[7px] text-alphabag-yellow font-black border border-white/10 group-hover:border-alphabag-yellow/50 transition-colors">
                                                {ad.symbol?.[0]}
                                            </div>
                                            <span className="text-[9px] text-alphabag-muted font-bold uppercase tracking-wider">{ad.name} <span className="text-red-500 ml-1">Live</span></span>
                                        </div>
                                        <div className="flex -space-x-1.5">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="w-5 h-5 rounded-full border-2 border-alphabag-dark bg-alphabag-yellow/20 flex items-center justify-center text-[7px] font-black text-alphabag-yellow">
                                                    {i === 2 ? '+48' : 'U'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <h4 className="text-[12px] font-bold text-white leading-snug line-clamp-2">
                                        {ad.description}
                                    </h4>
                                </div>
                            ))
                            ) : (
                                <div className="p-4 text-[11px] text-alphabag-muted">No live promoted signals available right now.</div>
                            )}
                        </div>
                        <button
                            onClick={handleShowMoreLive}
                            className="w-full p-3.5 text-left text-[11px] text-alphabag-yellow hover:bg-white/5 transition-colors font-bold uppercase tracking-wider"
                        >
                            Show more
                        </button>
                    </div>
                </div>
            </div>

            <FounderListingForm
                isOpen={isListingOpen}
                onClose={() => setIsListingOpen(false)}
                onSuccess={() => {
                    console.log("Project submitted successfully!");
                }}
            />
        </div>
    );
};

const PostCard = ({ post, isFollowing, onFollowToggle }: { post: Post, isFollowing: boolean, onFollowToggle: () => void }) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(post.likeCount);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [comments, setComments] = useState(post.commentCount);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [replyDraft, setReplyDraft] = useState('');
    const [commentThread, setCommentThread] = useState<Array<{ id: string; author: string; handle: string; content: string; createdAt: string }>>([]);

    // Determine info (mock logic for authorId 'user1' as founder)
    const isFounderPost = post.projectId || post.authorId === 'user1';
    const authorName = post.authorId === 'user1' ? 'Meme Lord' : post.authorId === user?.id ? (user?.email.split('@')[0] || 'Me') : `User_${post.authorId.substring(0, 4)}`;
    const authorHandle = post.authorId === 'user1' ? '@memelords212' : `@${post.authorId.substring(0, 8)}`;
    const relativeTime = formatRelativeTime(post.createdAt);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);

        const points = AlphaRadarService.calculateEngagementPoints('LIKE', post.boostMultiplier || 1);
        console.log(`User earned ${points} engagement points!`);
    };

    const handleComment = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsCommentsOpen((prev) => !prev);
    };

    const handleSubmitReply = (e: React.MouseEvent) => {
        e.stopPropagation();
        const trimmed = replyDraft.trim();
        if (!trimmed) return;

        const author = user?.email?.split('@')[0] || 'Guest';
        const handle = user?.id ? `@${user.id.slice(0, 8)}` : '@guest';
        const newComment = {
            id: `${post.id}-${Date.now()}`,
            author,
            handle,
            content: trimmed,
            createdAt: new Date().toISOString(),
        };

        setCommentThread((prev) => [newComment, ...prev]);
        setComments((prev) => prev + 1);
        setReplyDraft('');
        setIsCommentsOpen(true);
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const shareText = `${authorHandle}: ${post.content.slice(0, 160)}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'AlphaBAG Feed',
                    text: shareText,
                    url: window.location.href,
                });
                return;
            }

            await navigator.clipboard.writeText(shareText);
            void Swal.fire({
                icon: 'success',
                title: 'Copied',
                text: 'Post preview copied to clipboard.',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#fcd535',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Share failed', error);
        }
    };

    const handleBookmark = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsBookmarked((prev) => !prev);
    };

    const handleMoreActions = (e: React.MouseEvent) => {
        e.stopPropagation();
        void Swal.fire({
            icon: 'info',
            title: 'Post Controls',
            text: 'Mute, report, and block actions are now in final QA for release.',
            background: '#0a0a0a',
            color: '#fff',
            confirmButtonColor: '#fcd535',
        });
    };

    const handleViewAnalytics = (e: React.MouseEvent) => {
        e.stopPropagation();
        void Swal.fire({
            icon: 'info',
            title: 'Post Analytics',
            text: 'Engagement analytics are available to all users in this feed experience.',
            background: '#0a0a0a',
            color: '#fff',
            confirmButtonColor: '#fcd535',
        });
    };

    return (
        <div className="p-3 hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-white/5">
            <div className="flex gap-4">
                {/* Avatar */}
                <div
                    onClick={(e) => { e.stopPropagation(); window.location.hash = `#/profile/${post.authorId}`; }}
                    className="w-9 h-9 flex-shrink-0 bg-alphabag-black border border-white/10 rounded-full flex items-center justify-center font-black text-alphabag-yellow shadow-inner overflow-hidden uppercase cursor-pointer hover:border-alphabag-yellow/50 transition-all mt-1"
                >
                    {post.logoUrl ? (
                        <img src={post.logoUrl} alt={authorName} className="w-full h-full object-cover" />
                    ) : (
                        authorName[0]
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header - Wrap flex items to fix collision */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1.5 min-w-0">
                            {/* Name and Handle line */}
                            <div className="flex items-center flex-wrap gap-1.5">
                                <span
                                    onClick={(e) => { e.stopPropagation(); window.location.hash = `#/profile/${post.authorId}`; }}
                                    className="font-bold text-white text-[14px] truncate cursor-pointer hover:underline"
                                >
                                    {authorName}
                                </span>
                                {isFounderPost ? (
                                    <CheckCircle size={13} className="text-alphabag-yellow flex-shrink-0" fill="currentColor" />
                                ) : (
                                    <Zap size={13} className="text-alphabag-muted flex-shrink-0" />
                                )}
                                <span className="text-alphabag-muted text-[13px] truncate">{authorHandle}</span>
                                <span className="text-alphabag-muted text-[13px]">· {relativeTime}</span>
                            </div>

                            {/* Role Badges line */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isFounderPost ? 'bg-alphabag-yellow/20 text-alphabag-yellow border border-alphabag-yellow/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                    {isFounderPost ? 'FOUNDER' : 'ELITE TRADER'}
                                </div>
                                {isFounderPost && (
                                    <div className="flex items-center gap-1 text-[8px] font-black text-alphabag-yellow uppercase tracking-widest bg-alphabag-yellow/10 px-1.5 py-0.5 rounded border border-alphabag-yellow/20">
                                        <Bookmark size={8} fill="currentColor" /> Pinned
                                    </div>
                                )}
                                {post.strategy && (
                                    <div className={`px-2 py-0.5 rounded flex items-center gap-1 text-[8px] font-black uppercase tracking-widest border
                                        ${post.strategy === 'DEGEN' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                            post.strategy === 'SHORT' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                post.strategy === 'LONGTERM' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                    'bg-purple-500/20 text-purple-400 border-purple-500/30'}
                                    `}>
                                        {post.strategy === 'DEGEN' && <Zap size={10} />}
                                        {post.strategy === 'SHORT' && <TrendingUp size={10} className="rotate-180" />}
                                        {post.strategy === 'LONGTERM' && <Shield size={10} />}
                                        {post.strategy === 'AIRDROP' && <Target size={10} />}
                                        {post.strategy} STRATEGY
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right side interactions */}
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onFollowToggle(); }}
                                className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border transition-all ${isFollowing ? 'border-white/20 text-white bg-white/5' : 'border-alphabag-yellow text-alphabag-yellow hover:bg-alphabag-yellow/10'}`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button
                                onClick={handleMoreActions}
                                className="text-alphabag-muted hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`p-2.5 rounded-lg mb-2 border ${post.strategy === 'DEGEN' ? 'bg-gradient-to-br from-orange-500/5 to-transparent border-orange-500/20 shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]' :
                        post.strategy === 'SHORT' ? 'bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20' :
                            post.strategy === 'LONGTERM' ? 'bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20' :
                                post.strategy === 'AIRDROP' ? 'bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20' :
                                    'bg-transparent border-transparent'
                        }`}>
                        <p className={`text-[14px] leading-relaxed whitespace-pre-wrap ${post.strategy === 'DEGEN' ? 'text-orange-50 font-medium' :
                            post.strategy === 'SHORT' ? 'text-red-50' :
                                post.strategy === 'LONGTERM' ? 'text-green-50' :
                                    post.strategy === 'AIRDROP' ? 'text-purple-50' :
                                        'text-zinc-200'
                            }`}>
                            {highlightContent(post.content)}
                        </p>
                    </div>

                    {/* Banner for Manifesto posts */}
                    {isFounderPost && (
                        <div className="rounded-lg border border-white/10 overflow-hidden mb-3 bg-white/5 shadow-2xl">
                            {post.bannerUrl ? (
                                <img src={post.bannerUrl} alt="Manifesto Banner" className="aspect-[3/1] w-full object-cover" />
                            ) : (
                                <div className="aspect-video bg-gradient-to-br from-alphabag-yellow/10 to-transparent flex items-center justify-center">
                                    <Zap size={40} className="text-alphabag-yellow/20" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Interactions */}
                    <div className="flex flex-wrap items-center justify-between -ml-2 text-alphabag-muted gap-y-2">
                        <button
                            onClick={handleComment}
                            className="flex items-center gap-2 group transition-colors hover:text-blue-400 p-2 rounded-full hover:bg-blue-400/10"
                        >
                            <MessageCircle size={18} />
                            <span className="text-xs font-medium">{comments}</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 group transition-colors hover:text-alphabag-green p-2 rounded-full hover:bg-alphabag-green/10"
                        >
                            <Share2 size={18} />
                            <span className="text-xs font-medium">{post.shareCount || 233}</span>
                        </button>
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 group transition-colors p-2 rounded-full hover:bg-alphabag-yellow/10 ${isLiked ? 'text-alphabag-yellow' : 'hover:text-alphabag-yellow'}`}
                        >
                            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                            <span className="text-xs font-medium">{likes}</span>
                        </button>
                        <button
                            onClick={handleViewAnalytics}
                            className="flex items-center gap-2 group transition-colors hover:text-alphabag-yellow p-2 rounded-full hover:bg-alphabag-yellow/10"
                        >
                            <BarChart size={18} />
                            <span className="text-xs font-medium">6M</span>
                        </button>
                        <div className="flex gap-1">
                            <button
                                onClick={handleBookmark}
                                className={`p-2 rounded-full transition-colors ${isBookmarked ? 'text-alphabag-yellow bg-alphabag-yellow/10' : 'hover:bg-alphabag-yellow/10 hover:text-alphabag-yellow'}`}
                            >
                                <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-2 hover:bg-alphabag-yellow/10 rounded-full transition-colors hover:text-alphabag-yellow"
                            >
                                <ExternalLink size={18} />
                            </button>
                        </div>
                    </div>

                    {isCommentsOpen && (
                        <div className="mt-3 border border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
                            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                                <div className="text-[11px] font-black uppercase tracking-widest text-white">Conversation</div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCommentsOpen(false);
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-wider text-alphabag-muted hover:text-white"
                                >
                                    Collapse
                                </button>
                            </div>

                            <div className="p-3 border-b border-white/10 bg-black/20">
                                <div className="flex gap-3 items-start">
                                    <div className="w-8 h-8 rounded-full bg-alphabag-yellow/15 border border-alphabag-yellow/30 flex items-center justify-center text-[11px] font-black text-alphabag-yellow uppercase">
                                        {(user?.email?.[0] || 'G').toUpperCase()}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <textarea
                                            value={replyDraft}
                                            onChange={(e) => setReplyDraft(e.target.value)}
                                            placeholder="Post your reply"
                                            rows={2}
                                            maxLength={280}
                                            className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-alphabag-muted resize-none outline-none focus:border-alphabag-yellow/50"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] text-alphabag-muted font-bold uppercase tracking-wider">
                                                {replyDraft.length}/280
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={handleSubmitReply}
                                                disabled={!replyDraft.trim()}
                                                className="px-3 h-8 bg-alphabag-yellow text-black text-[10px] font-black uppercase tracking-widest rounded-full disabled:opacity-50"
                                            >
                                                Reply
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                                {commentThread.length > 0 ? (
                                    commentThread.map((comment) => (
                                        <div key={comment.id} className="px-3 py-2.5">
                                            <div className="flex items-center gap-2 text-[12px] mb-1">
                                                <span className="font-bold text-white">{comment.author}</span>
                                                <span className="text-alphabag-muted">{comment.handle}</span>
                                                <span className="text-alphabag-muted">· {formatRelativeTime(comment.createdAt)}</span>
                                            </div>
                                            <p className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-[12px] text-alphabag-muted">No replies yet. Start the thread.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
