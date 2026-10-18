import {
ArrowUpRight,
ChevronDown,ChevronUp,
Loader2,
MessageSquare,
Plus,
Search,
Send,
Share2,
ThumbsUp,
} from 'lucide-react';
import React,{ useEffect,useMemo,useState } from 'react';
import Swal from 'sweetalert2';
import { PageIcon } from '../../components/ui/PageIcon';
import { FounderListingForm } from '../../components/frontend/FounderListingForm';
import { api } from '../../services/api';

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

interface Community {
    slug: string;
    name: string;
    description: string;
    memberCount: number;
    isMember: boolean;
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

// ── COMPONENT ────────────────────────────────────────────────────────────────

export const AlphasFeed: React.FC = () => {
    // Community membership controls full-thread visibility.
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedCommunitySlug, setSelectedCommunitySlug] = useState('');
    const [communityBusy, setCommunityBusy] = useState<string | null>(null);
    const [feedError, setFeedError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'HOT' | 'TOP' | 'LATEST'>('LATEST');

    // Real Data States (Initialized empty — loaded from live backend endpoints)
    const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
    const [sponsoredAd, setSponsoredAd] = useState<SponsoredAd | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Comment states
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [commentDisplayModes, setCommentDisplayModes] = useState<Record<string, 'VISIBLE' | 'ANONYMOUS'>>({});

    // New Discussion Composer Modal
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newTicker, setNewTicker] = useState('');
    const [newCommunitySlug, setNewCommunitySlug] = useState('');
    const [newContent, setNewContent] = useState('');

    // Founder Form Modal
    const [isFounderFormOpen, setIsFounderFormOpen] = useState(false);

    const visibleDisplayName = 'Visible profile';

    const loadFeed = async (showLoading: boolean) => {
        if (showLoading) setIsLoading(true);
        try {
            const [communityRes, discRes, adRes] = await Promise.all([
                api.get('/api/community/communities'),
                api.get('/api/community/discussions'),
                api.get('/api/community/ads').catch(() => ({ data: null })),
            ]);
            setCommunities(Array.isArray(communityRes.data) ? communityRes.data : []);
            setDiscussions(Array.isArray(discRes.data) ? discRes.data : []);
            setSponsoredAd(adRes.data?.partnerName ? adRes.data : null);
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
            list = list.filter(d => d.communitySlug === selectedCommunitySlug);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(d => 
                d.title.toLowerCase().includes(q) ||
                (d.ticker || '').toLowerCase().includes(q) ||
                (d.content || d.previewText || '').toLowerCase().includes(q)
            );
        }

        switch (sortBy) {
            case 'TOP':
                list.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
                break;
            case 'LATEST':
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case 'HOT':
            default:
                list.sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return (b.upvotes * 2 + (b.commentCount ?? b.comments.length) * 5) - (a.upvotes * 2 + (a.commentCount ?? a.comments.length) * 5);
                });
                break;
        }

        return list;
    }, [discussions, selectedCommunitySlug, searchQuery, sortBy]);

    // ── ACTIONS: DISCUSSIONS ─────────────────────────────────────────────────

    const handleJoinCommunity = async (community: Community) => {
        setCommunityBusy(community.slug);
        try {
            if (community.isMember) await api.delete(`/api/community/communities/${community.slug}/join`);
            else await api.post(`/api/community/communities/${community.slug}/join`);
            const [communityRes, discussionRes] = await Promise.all([
                api.get('/api/community/communities'),
                api.get('/api/community/discussions'),
            ]);
            setCommunities(Array.isArray(communityRes.data) ? communityRes.data : []);
            setDiscussions(Array.isArray(discussionRes.data) ? discussionRes.data : []);
            setFeedError('');
        } catch (error) {
            console.error('[AlphaFeed] membership update failed:', error);
            await Swal.fire({ title: 'Could not update membership', text: 'Please try again.', icon: 'error', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
        } finally {
            setCommunityBusy(null);
        }
    };

    const handleUpvoteDiscussion = async (discId: string, type: 'UP' | 'DOWN') => {
        try {
            const response = await api.post(`/api/community/discussions/${discId}/vote`, { type });
            setDiscussions(prev => prev.map(d => d.id === discId ? { ...d, ...response.data } : d));
        } catch (error) {
            console.error('[AlphaFeed] vote failed:', error);
            await Swal.fire({ title: 'Could not save your vote', text: 'Join the community to react to this thread.', icon: 'info', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
        }
    };

    const handleShareDiscussion = async (post: DiscussionPost) => {
        const shareText = `${post.title}\n${post.previewOnly ? post.previewText || '' : post.content || ''}`.trim();
        try {
            if (navigator.share) {
                await navigator.share({ title: post.title, text: shareText, url: window.location.href });
            } else {
                await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
                await Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Post copied to clipboard', showConfirmButton: false, timer: 1600, background: '#1E2329', color: '#FFF' });
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            await Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Could not share this post', showConfirmButton: false, timer: 1800, background: '#1E2329', color: '#FFF' });
        }
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
        try {
            const response = await api.post(`/api/community/discussions/${discId}/comments`, {
                content: text,
                displayMode: commentDisplayModes[discId] || 'VISIBLE',
            });
            const created = response.data?.comment || response.data;
            setDiscussions(prev => prev.map(d => d.id === discId
                ? { ...d, comments: [...d.comments, created], commentCount: (d.commentCount ?? d.comments.length) + 1 }
                : d));
            setCommentDrafts(prev => ({ ...prev, [discId]: '' }));
        } catch (error) {
            console.error('[AlphaFeed] comment failed:', error);
            await Swal.fire({ title: 'Could not post your comment', text: 'Please check your connection and try again.', icon: 'error', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
        }
    };

    const handleCreateDiscussion = async (e: React.FormEvent) => {
        e.preventDefault();
        const community = communities.find(item => item.slug === newCommunitySlug);
        if (!newTitle.trim() || !newContent.trim() || !community?.isMember) {
            Swal.fire({
                title: 'Join a community first',
                text: !community?.isMember ? 'Join the selected community before starting a thread.' : 'Add a title and post text to continue.',
                icon: 'warning',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#fcd535'
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
            setDiscussions(prev => [newPost, ...prev]);
            setSelectedCommunitySlug(newCommunitySlug);
            setIsComposerOpen(false);
            setNewTitle('');
            setNewTicker('');
            setNewContent('');
            setFeedError('');
        } catch (err) {
            console.error("Failed to post discussion to backend:", err);
            await Swal.fire({ title: 'Could not publish thread', text: 'Please try again. Your post was not added.', icon: 'error', background: '#0a0a0a', color: '#fff', confirmButtonColor: '#fcd535' });
            return;
        }
    };

    // ── RENDER ───────────────────────────────────────────────────────────────

    return (
        <div className="w-full space-y-3 pb-8 animate-in fade-in duration-500">
            
            {/* ── COMMUNITY HEADER ── */}
            <div className="page-header-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <PageIcon name="feed" size={40} />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-alphabag-text tracking-tight">AlphaFeed</h1>
                            <p className="text-xs text-alphabag-subtext">Community posts, discussion and project research.</p>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        const joined = communities.find(item => item.isMember);
                        setNewCommunitySlug(joined?.slug || selectedCommunitySlug || communities[0]?.slug || 'general');
                        setIsComposerOpen(true);
                    }}
                    disabled={!communities.length}
                    className="bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] disabled:opacity-50 px-4 py-2 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                    <Plus size={15} /> New post
                </button>
            </div>

            {/* ── COMMUNITY FILTER, SEARCH AND SORT ── */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    <button
                        type="button"
                        onClick={() => setSelectedCommunitySlug('')}
                        aria-pressed={!selectedCommunitySlug}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap border transition-colors ${!selectedCommunitySlug ? 'bg-alphabag-yellow text-alphabag-dark border-alphabag-yellow' : 'bg-alphabag-darkgray text-alphabag-subtext border-alphabag-gray hover:text-alphabag-text'}`}
                    >All communities</button>
                    {communities.map(community => (
                        <button
                            key={community.slug}
                            type="button"
                            onClick={() => setSelectedCommunitySlug(community.slug)}
                            aria-pressed={selectedCommunitySlug === community.slug}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap border transition-colors ${selectedCommunitySlug === community.slug ? 'bg-alphabag-yellow text-alphabag-dark border-alphabag-yellow' : 'bg-alphabag-darkgray text-alphabag-subtext border-alphabag-gray hover:text-alphabag-text'}`}
                        >
                            {community.name}{community.isMember ? ' · Joined' : ''}
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
                            placeholder="Search posts or tickers"
                            className="w-full bg-alphabag-darkgray border border-alphabag-gray rounded-md pl-8 pr-3 py-2 text-xs text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow"
                        />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-alphabag-subtext">
                        <span>Sort</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'HOT' | 'TOP' | 'LATEST')}
                            className="bg-alphabag-darkgray border border-alphabag-gray text-alphabag-text rounded-md px-2.5 py-2 text-xs focus:outline-none focus:border-alphabag-yellow"
                        >
                            <option value="LATEST">Latest</option>
                            <option value="HOT">Popular</option>
                            <option value="TOP">Top rated</option>
                        </select>
                    </label>
                </div>
            </div>

            {feedError && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                    <span>{feedError}</span>
                    <button type="button" onClick={() => void loadFeed(true)} className="font-semibold underline underline-offset-2">Retry</button>
                </div>
            )}

            {/* ── MAIN CONTENT GRID (FEED + SIDEBAR) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                
                {/* ── LEFT COLUMN: DISCUSSIONS FEED (8 COLS) ── */}
                <div className="lg:col-span-8 space-y-3">
                    
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

                            return (
                                <div 
                                    key={post.id} 
                                    className={`rounded-2xl border bg-alphabag-darkgray p-4 md:p-5 transition-all space-y-3 ${
                                        post.isPinned ? 'border-alphabag-yellow/40 shadow-sm' : 'border-alphabag-gray hover:border-alphabag-subtext/30'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-alphabag-gray/50 text-xs">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {post.isPinned && (
                                                <span className="bg-alphabag-yellow text-alphabag-dark text-[11px] font-bold uppercase px-2 py-0.5 rounded">
                                                    PINNED
                                                </span>
                                            )}
                                            <span className="bg-alphabag-gray text-alphabag-subtext px-2 py-0.5 rounded text-[11px] font-semibold">
                                                {post.communityName || post.category.replace(/_/g, ' ')}
                                            </span>
                                            {post.ticker && <span className="bg-alphabag-black border border-alphabag-gray text-alphabag-yellow font-semibold font-mono px-2 py-0.5 rounded text-[11px]">{post.ticker}</span>}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-alphabag-subtext">
                                            <span>by <strong className="text-alphabag-text">{post.authorName || 'Community member'}</strong></span>
                                        </div>
                                    </div>

                                    <h3 className="text-base md:text-lg font-bold text-alphabag-text leading-snug">
                                        {post.title}
                                    </h3>

                                    <p className="text-sm text-alphabag-subtext whitespace-pre-line leading-relaxed">
                                        {post.previewOnly ? post.previewText : post.content}
                                    </p>
                                    {post.previewOnly && (
                                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-alphabag-gray bg-alphabag-black/50 px-3 py-2">
                                            <span className="text-xs text-alphabag-subtext">Join to read the full thread and community replies.</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const community = communities.find(item => item.slug === post.communitySlug);
                                                    if (community) void handleJoinCommunity(community);
                                                }}
                                                disabled={!post.communitySlug || communityBusy === post.communitySlug}
                                                className="px-3 py-1.5 rounded-md bg-alphabag-yellow text-alphabag-dark text-xs font-semibold disabled:opacity-50"
                                            >
                                                {communityBusy === post.communitySlug ? 'Joining…' : 'Join community'}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-alphabag-gray/50 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-alphabag-black border border-alphabag-gray rounded-lg p-0.5">
                                                <button
                                                    onClick={() => void handleUpvoteDiscussion(post.id, 'UP')}
                                                    disabled={post.previewOnly}
                                                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                                                        post.userVoted === 'UP'
                                                            ? 'bg-alphabag-yellow text-alphabag-dark font-bold'
                                                            : 'text-alphabag-subtext hover:text-alphabag-text'
                                                    }`}
                                                    title={post.previewOnly ? 'Join the community to rate this post' : 'Rate this post'}
                                                >
                                                    <ThumbsUp size={13} />
                                                    <span className="font-mono tabular-nums">{post.upvotes}</span>
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => toggleComments(post.id)}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                                    isExpanded
                                                        ? 'bg-alphabag-black border-alphabag-yellow text-alphabag-yellow'
                                                        : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'
                                                }`}
                                            >
                                                <MessageSquare size={13} />
                                                <span>{post.previewOnly ? post.comments.length : (post.commentCount ?? post.comments.length)} Comments</span>
                                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => void handleShareDiscussion(post)}
                                                className="px-2.5 py-1.5 rounded-md border border-alphabag-gray bg-alphabag-black text-alphabag-subtext hover:text-alphabag-text text-xs font-semibold flex items-center gap-1"
                                                aria-label={`Share post: ${post.title}`}
                                            >
                                                <Share2 size={13} /> Share
                                            </button>

                                        </div>

                                        <div className="flex items-center gap-2 text-[11px] text-alphabag-subtext">
                                            <span>Community Discussion</span>
                                        </div>
                                    </div>

                                    {/* ── EXPANDABLE NESTED COMMENT THREADS ── */}
                                    {isExpanded && (
                                        <div className="pt-3 border-t border-alphabag-gray/50 space-y-3 animate-in fade-in duration-300">
                                            <div className="bg-alphabag-black border border-alphabag-gray rounded-md p-3 space-y-2">
                                                <label htmlFor={`comment-${post.id}`} className="text-xs font-semibold text-alphabag-text">Add a comment</label>
                                                <textarea
                                                    id={`comment-${post.id}`}
                                                    value={draft}
                                                    onChange={(e) => setCommentDrafts(p => ({ ...p, [post.id]: e.target.value }))}
                                                    placeholder="Write a comment…"
                                                    maxLength={2000}
                                                    rows={3}
                                                    className="w-full bg-alphabag-darkgray border border-alphabag-gray rounded-md p-2.5 text-sm text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow resize-y"
                                                />
                                                <div className="flex flex-wrap justify-between items-center gap-2">
                                                    <label className="flex items-center gap-2 text-xs text-alphabag-subtext">
                                                        Comment as
                                                        <select
                                                            value={commentDisplayModes[post.id] || 'VISIBLE'}
                                                            onChange={(e) => setCommentDisplayModes(p => ({ ...p, [post.id]: e.target.value as 'VISIBLE' | 'ANONYMOUS' }))}
                                                            className="bg-alphabag-darkgray border border-alphabag-gray rounded px-2 py-1 text-xs text-alphabag-text"
                                                        >
                                                            <option value="VISIBLE">{visibleDisplayName}</option>
                                                            <option value="ANONYMOUS">Anonymous</option>
                                                        </select>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleAddComment(post.id)}
                                                        disabled={!draft.trim()}
                                                        className="bg-alphabag-yellow text-alphabag-dark disabled:opacity-40 font-semibold px-3 py-1.5 rounded-md text-xs flex items-center gap-1"
                                                    >
                                                        <Send size={12} /> Comment
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-alphabag-subtext">
                                                    {post.previewOnly ? 'Until you join, only you can see your comment.' : 'Visible comments show your profile name; anonymous comments do not show your identity.'}
                                                </p>
                                            </div>

                                            {post.comments.length > 0 ? (
                                                <div className="space-y-2" aria-live="polite">
                                                    {post.comments.map((comment) => (
                                                        <article key={comment.id} className="bg-alphabag-black/50 border border-alphabag-gray rounded-md p-3 space-y-1.5">
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

                {/* ── COMMUNITY DIRECTORY & SPONSOR ── */}
                <aside className="lg:col-span-4 space-y-3" aria-label="Community directory">
                    {sponsoredAd && (
                        <section className="rounded-lg border border-alphabag-gray bg-alphabag-darkgray p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="bg-alphabag-yellow/15 text-alphabag-yellow px-2 py-0.5 rounded text-[11px] font-semibold uppercase">Sponsored</span>
                                <button type="button" onClick={() => setIsFounderFormOpen(true)} className="text-xs text-alphabag-yellow hover:underline">Advertise</button>
                            </div>
                            <h2 className="text-sm font-semibold text-alphabag-text">{sponsoredAd.partnerName}</h2>
                            <p className="text-xs text-alphabag-subtext leading-relaxed">{sponsoredAd.description}</p>
                            <a href={sponsoredAd.ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-alphabag-yellow hover:underline">
                                {sponsoredAd.ctaText}<ArrowUpRight size={13} />
                            </a>
                        </section>
                    )}
                    <section className="rounded-lg border border-alphabag-gray bg-alphabag-darkgray p-4 space-y-3">
                        <div>
                            <h2 className="text-sm font-semibold text-alphabag-text">Communities</h2>
                            <p className="text-xs text-alphabag-subtext mt-1">Join to read full threads, reply and rate posts.</p>
                        </div>
                        <div className="space-y-2">
                            {communities.map(community => (
                                <div key={community.slug} className="flex items-center justify-between gap-3 border-t border-alphabag-gray/60 pt-2 first:border-0 first:pt-0">
                                    <button type="button" onClick={() => setSelectedCommunitySlug(community.slug)} className="min-w-0 text-left">
                                        <span className="block text-xs font-semibold text-alphabag-text">{community.name}</span>
                                        <span className="block text-[11px] text-alphabag-subtext">{community.memberCount} members</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleJoinCommunity(community)}
                                        disabled={communityBusy === community.slug}
                                        className={`shrink-0 rounded px-2.5 py-1 text-xs font-semibold ${community.isMember ? 'border border-alphabag-gray text-alphabag-subtext' : 'bg-alphabag-yellow text-alphabag-dark'} disabled:opacity-50`}
                                    >
                                                        {communityBusy === community.slug ? '…' : community.isMember ? 'Leave' : 'Join'}
                                    </button>
                                </div>
                            ))}
                            {!communities.length && <p className="text-xs text-alphabag-subtext">Communities will appear here when loaded.</p>}
                        </div>
                    </section>
                </aside>
            </div>

            {/* ── NEW POST COMPOSER ── */}
            {isComposerOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="new-post-title">
                    <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-lg max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center pb-3 border-b border-alphabag-gray">
                            <div>
                                <p className="text-xs text-alphabag-subtext">AlphaFeed</p>
                                <h2 id="new-post-title" className="text-lg font-semibold text-alphabag-text">Create a post</h2>
                            </div>
                            <button type="button" onClick={() => setIsComposerOpen(false)} className="text-alphabag-subtext hover:text-alphabag-text px-2 py-1" aria-label="Close post composer">Close</button>
                        </div>
                        <form onSubmit={handleCreateDiscussion} className="space-y-3">
                            <label className="block space-y-1 text-xs font-semibold text-alphabag-subtext">
                                Community
                                <select value={newCommunitySlug} onChange={(e) => setNewCommunitySlug(e.target.value)} className="w-full bg-alphabag-black border border-alphabag-gray rounded-md p-2.5 text-sm text-alphabag-text">
                                    {communities.map(community => <option key={community.slug} value={community.slug}>{community.name}{community.isMember ? '' : ' (join required)'}</option>)}
                                </select>
                            </label>
                            {communities.find(item => item.slug === newCommunitySlug)?.isMember ? (
                                <>
                                    <label className="block space-y-1 text-xs font-semibold text-alphabag-subtext">
                                        Title
                                        <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={160} required placeholder="What would you like to discuss?" className="w-full bg-alphabag-black border border-alphabag-gray rounded-md p-2.5 text-sm text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow" />
                                    </label>
                                    <label className="block space-y-1 text-xs font-semibold text-alphabag-subtext">
                                        Post
                                        <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} maxLength={12000} rows={7} required placeholder="Share your question, idea, research or analysis…" className="w-full bg-alphabag-black border border-alphabag-gray rounded-md p-3 text-sm text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow resize-y" />
                                    </label>
                                    <label className="block space-y-1 text-xs font-semibold text-alphabag-subtext">
                                        Ticker <span className="font-normal">(optional)</span>
                                        <input type="text" value={newTicker} onChange={(e) => setNewTicker(e.target.value)} maxLength={24} placeholder="$BAG" className="w-full bg-alphabag-black border border-alphabag-gray rounded-md p-2.5 text-sm font-mono text-alphabag-text placeholder:text-alphabag-subtext focus:outline-none focus:border-alphabag-yellow" />
                                    </label>
                                </>
                            ) : (
                                <div className="rounded-md border border-alphabag-gray bg-alphabag-black p-3 text-sm text-alphabag-subtext">
                                    Join this community before creating a post.
                                    {communities.find(item => item.slug === newCommunitySlug) && <button type="button" onClick={() => void handleJoinCommunity(communities.find(item => item.slug === newCommunitySlug)!)} className="ml-2 text-alphabag-yellow font-semibold">Join now</button>}
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsComposerOpen(false)} className="px-4 py-2 border border-alphabag-gray text-alphabag-subtext rounded-md text-xs font-semibold">Cancel</button>
                                <button type="submit" disabled={!communities.find(item => item.slug === newCommunitySlug)?.isMember || !newTitle.trim() || !newContent.trim()} className="px-4 py-2 bg-alphabag-yellow text-alphabag-dark rounded-md text-xs font-semibold disabled:opacity-50">Publish post</button>
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
