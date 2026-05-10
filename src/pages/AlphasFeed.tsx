import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
    MessageSquare, Heart, Share2, MoreHorizontal, Shield, Zap, TrendingUp,
    Filter, Search, Plus, MessageCircle, Target, Image as ImageIcon,
    BarChart2, Smile, Calendar, MapPin, CheckCircle, Bookmark, BarChart,
    ExternalLink, Users, Rocket, Globe, Star
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AlphaRadarService } from '../services/alphaRadarService';
import { FounderListingForm } from '../components/FounderListingForm';
import { OnboardingModal } from '../components/OnboardingModal';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';

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
    const { user, completeOnboarding } = useAuth();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'FOR_YOU' | 'FOLLOWING' | 'ALPHABAG'>('FOR_YOU');
    const [isListingOpen, setIsListingOpen] = useState(false);
    const [sidebarAds, setSidebarAds] = useState<any[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [selectedStrategy, setSelectedStrategy] = useState<Post['strategy'] | ''>('');
    const [feedPosts, setFeedPosts] = useState<Post[]>(MOCK_ALPHAS);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [foundersProjects, setFoundersProjects] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchAdsAndProjects = async () => {
            try {
                const ads = await AlphaRadarService.getAds('SIDEBAR');
                setSidebarAds(ads);

                // Fetch projects for the Founders List
                const projects = await AlphaRadarService.getAllProjects();
                if (projects) {
                    setFoundersProjects(projects);
                }
            } catch (err) {
                console.error('Failed to fetch sidebar data', err);
            }
        };
        fetchAdsAndProjects();
    }, []);

    const handleCreatePost = () => {
        if (!newPostContent.trim()) return;

        const myPost: Post = {
            id: Date.now().toString(),
            authorId: user?.id || 'guest',
            content: newPostContent,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            createdAt: new Date().toISOString(),
            strategy: selectedStrategy || undefined
        };

        setFeedPosts([myPost, ...feedPosts]);
        setNewPostContent('');
        setSelectedStrategy('');
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
            const scoreA = (a.likeCount * 2) + (a.commentCount * 5) + ((a.boostMultiplier || 1) * 10);
            const scoreB = (b.likeCount * 2) + (b.commentCount * 5) + ((b.boostMultiplier || 1) * 10);
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
            filtered = filtered.filter(p => p.content.toLowerCase().includes(search.toLowerCase()));
        }

        if (activeTab === 'FOR_YOU') {
            return getRankedPosts(filtered);
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const isFounder = user?.accountType === 'FOUNDER';
    const showOnboarding = !!user && !user.onboardingComplete;

    return (
        <div className="relative min-h-screen">
            {/* Onboarding Lock */}
            <OnboardingModal
                isOpen={showOnboarding}
                onComplete={(role, data) => completeOnboarding(role, data)}
                onExit={() => window.location.hash = '#/'}
            />

            <div className={`max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 transition-all duration-700 ${showOnboarding ? 'blur-2xl pointer-events-none scale-95 opacity-50' : 'blur-0 opacity-100 scale-100'}`}>

                {/* Left Sidebar: Featured Founders */}
                <div className="hidden lg:block lg:col-span-3 sticky top-0 h-screen overflow-y-auto pt-0 pb-10 hide-scrollbar">
                    <div className="glass-panel overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <span className="section-label text-white flex items-center gap-2">
                                <Users size={14} className="text-alphabag-yellow" /> Featured Founders
                            </span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {foundersProjects.length > 0 ? (
                                [...foundersProjects]
                                    .sort((a, b) => (b.isPaidSponsor ? 1 : 0) - (a.isPaidSponsor ? 1 : 0))
                                    .map(project => (
                                        <div
                                            key={project.id}
                                            onClick={() => window.location.hash = `#/alpha-radar?project=${project.id}`}
                                            className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group flex items-start gap-3 relative"
                                        >
                                            <div className="w-10 h-10 bg-alphabag-black border border-white/10 rounded-full flex items-center justify-center font-black text-alphabag-yellow overflow-hidden shrink-0 uppercase shadow-inner group-hover:border-alphabag-yellow/50 transition-all">
                                                {project.logoUrl ? (
                                                    <img src={project.logoUrl} alt={project.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    project.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="font-bold text-[13px] text-white truncate group-hover:text-alphabag-yellow transition-colors">{project.name}</div>
                                                    <CheckCircle className="w-3.5 h-3.5 text-alphabag-yellow shrink-0" fill="currentColor" />
                                                </div>
                                                <div className="text-[11px] font-medium text-alphabag-muted truncate mt-0.5">${project.tickerSymbol || project.symbol}</div>
                                            </div>
                                            {project.isPaidSponsor && (
                                                <div className="absolute top-4 right-4 flex items-center text-[8px] font-black text-alphabag-yellow uppercase tracking-widest bg-alphabag-yellow/10 px-1.5 py-0.5 rounded border border-alphabag-yellow/20">
                                                    <Star size={8} className="mr-1 fill-current" /> Promoted
                                                </div>
                                            )}
                                        </div>
                                    ))
                            ) : (
                                <div className="p-6 text-center text-[11px] font-bold uppercase tracking-widest text-alphabag-muted">
                                    No founders available.
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-white/5 bg-white/5">
                            <button className="text-[10px] font-black uppercase tracking-widest text-alphabag-yellow hover:text-white w-full text-left transition-colors">
                                Show more
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Feed */}
                <div className="lg:col-span-6 border-x border-white/5 min-h-screen">
                    <div className="p-6 border-b border-white/5 bg-alphabag-black/50 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-alphabag-yellow to-yellow-600 flex items-center justify-center text-black shadow-glow-yellow/10">
                                <Rocket size={16} fill="currentColor" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase relative flex items-center">
                                Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-2">Feed</span>
                            </h1>
                        </div>
                        <p className="text-[10px] text-alphabag-muted font-bold uppercase tracking-widest opacity-60">Real-time signals from the AlphaBAG network</p>
                    </div>

                    {/* Top Tabs */}
                    <div className="sticky top-0 z-20 bg-alphabag-black/80 backdrop-blur-xl border-b border-white/5">
                        <div className="flex w-full">
                            {['For you', 'Following'].map((label, i) => {
                                const tab = i === 0 ? 'FOR_YOU' : 'FOLLOWING';
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setActiveTab(tab as any)}
                                        className="flex-1 py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative group"
                                    >
                                        <span className={activeTab === tab ? 'text-white' : 'text-alphabag-muted group-hover:text-white'}>
                                            {label}
                                        </span>
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-alphabag-yellow shadow-glow-yellow/50" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Create Post */}
                    {user && (
                        <div className="p-4 border-b border-white/5">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-alphabag-yellow/10 border border-alphabag-yellow/20 rounded-full flex items-center justify-center font-black text-alphabag-yellow uppercase shadow-inner overflow-hidden">
                                    {user.email[0]}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <textarea
                                        className="w-full bg-transparent border-none text-white placeholder:text-alphabag-muted focus:ring-0 resize-none py-2 text-xl leading-snug"
                                        placeholder="What's happening?"
                                        rows={2}
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                    />

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1 -ml-2 text-alphabag-yellow">
                                                {[ImageIcon, BarChart2, Smile, Calendar, MapPin].map((Icon, idx) => (
                                                    <button key={idx} className="p-2 hover:bg-alphabag-yellow/10 rounded-full transition-colors">
                                                        <Icon size={18} />
                                                    </button>
                                                ))}
                                            </div>
                                            {isFounder && (
                                                <div className="flex items-center gap-2 ml-2">
                                                    <select
                                                        className="bg-alphabag-black/50 border border-white/10 text-[10px] text-white font-bold uppercase tracking-widest rounded-lg px-2 py-1 outline-none appearance-none"
                                                        value={selectedStrategy}
                                                        onChange={(e) => setSelectedStrategy(e.target.value as any)}
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
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleCreatePost}
                                            disabled={!newPostContent.trim()}
                                            className="px-6 bg-alphabag-yellow text-black font-black uppercase tracking-widest rounded-full py-2 disabled:opacity-50"
                                        >
                                            Post
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Feed Posts */}
                    <div className="divide-y divide-white/5">
                        {getFilteredPosts().map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                isFollowing={followingIds.has(post.authorId)}
                                onFollowToggle={() => toggleFollow(post.authorId)}
                            />
                        ))}
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="hidden lg:block lg:col-span-3 pt-0 pb-10 space-y-4 sticky top-0 h-screen overflow-y-auto hide-scrollbar">
                    {/* My Profile Quick Access [NEW] */}
                    <div className="bg-gradient-to-br from-alphabag-yellow/10 to-transparent border border-alphabag-yellow/20 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-alphabag-yellow/20 transition-all"
                        onClick={() => window.location.hash = `#/profile/${user?.id || 'me'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-alphabag-black border border-alphabag-yellow/30 flex items-center justify-center font-black text-alphabag-yellow">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div className="text-sm font-black text-white uppercase tracking-tight">My Profile</div>
                                <div className="text-[10px] text-alphabag-yellow font-bold uppercase tracking-widest">View Timeline</div>
                            </div>
                        </div>
                        <ExternalLink size={16} className="text-alphabag-yellow opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-muted group-focus-within:text-alphabag-yellow transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search Alphas"
                            className="w-full bg-white/5 border border-transparent focus:border-alphabag-yellow/50 focus:bg-transparent rounded-full py-3 pl-12 pr-4 text-sm text-white transition-all outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Premium Widget */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Subscribe to Premium</h3>
                            <span className="bg-alphabag-yellow/20 text-alphabag-yellow text-[10px] px-2 py-0.5 rounded-full font-black">50% OFF</span>
                        </div>
                        <p className="text-xs text-alphabag-subtext leading-relaxed font-medium">
                            Get rid of ads, see your analytics, boost your replies and unlock 20+ features.
                        </p>
                        <Button className="w-full bg-alphabag-yellow text-black rounded-full font-black uppercase tracking-widest text-xs py-3 shadow-glow-yellow/20">
                            Learn More
                        </Button>
                    </div>

                    {/* NEW: Promotions & Ads Section */}
                    <div className="bg-gradient-to-br from-alphabag-dark to-alphabag-black border border-white/10 rounded-2xl overflow-hidden shadow-xl">
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
                                <Button size="sm" variant="outline" className="w-full border-alphabag-yellow/20 text-alphabag-yellow text-[9px] h-8 font-black uppercase tracking-widest hover:bg-alphabag-yellow hover:text-black">
                                    View Project Hub
                                </Button>
                            </div>
                        </div>
                        <div className="p-3 bg-white/5 text-center">
                            <button className="text-[9px] text-alphabag-muted hover:text-white transition-colors font-bold uppercase tracking-widest">
                                Advertise with AlphaBAG
                            </button>
                        </div>
                    </div>

                    {/* Trending / Live Widget (Sponsored) */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight p-4">Live on AlphaBag</h3>
                        <div className="divide-y divide-white/5">
                            {sidebarAds.map(ad => (
                                <div key={ad.id} className="p-4 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-alphabag-dark rounded flex items-center justify-center text-[8px] text-alphabag-yellow font-black border border-white/10 group-hover:border-alphabag-yellow/50 transition-colors">
                                                {ad.symbol?.[0]}
                                            </div>
                                            <span className="text-[10px] text-alphabag-muted font-bold uppercase tracking-wider">{ad.name} <span className="text-red-500 ml-1">Live</span></span>
                                        </div>
                                        <div className="flex -space-x-2">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-alphabag-dark bg-alphabag-yellow/20 flex items-center justify-center text-[8px] font-black text-alphabag-yellow">
                                                    {i === 2 ? '+48' : 'U'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                                        {ad.description}
                                    </h4>
                                </div>
                            ))}
                        </div>
                        <button className="w-full p-4 text-left text-sm text-alphabag-yellow hover:bg-white/5 transition-colors font-bold uppercase tracking-wider">
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

    // Determine info (mock logic for authorId 'user1' as founder)
    const isFounderPost = post.projectId || post.authorId === 'user1';
    const authorName = post.authorId === 'user1' ? 'Meme Lord' : post.authorId === user?.id ? (user?.email.split('@')[0] || 'Me') : `User_${post.authorId.substring(0, 4)}`;
    const authorHandle = post.authorId === 'user1' ? '@memelords212' : `@${post.authorId.substring(0, 8)}`;

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);

        const points = AlphaRadarService.calculateEngagementPoints('LIKE', post.boostMultiplier || 1);
        console.log(`User earned ${points} engagement points!`);
    };

    const handleComment = (e: React.MouseEvent) => {
        e.stopPropagation();
        Swal.fire({
            icon: 'info',
            title: 'Beta Access',
            text: 'Full comment threads are being indexed for the Beta phase.',
            background: '#0a0a0a',
            color: '#fff',
            confirmButtonColor: '#fcd535',
            showConfirmButton: false,
            timer: 3000,
        });
    };

    return (
        <div className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-white/5">
            <div className="flex gap-4">
                {/* Avatar */}
                <div
                    onClick={(e) => { e.stopPropagation(); window.location.hash = `#/profile/${post.authorId}`; }}
                    className="w-10 h-10 flex-shrink-0 bg-alphabag-black border border-white/10 rounded-full flex items-center justify-center font-black text-alphabag-yellow shadow-inner overflow-hidden uppercase cursor-pointer hover:border-alphabag-yellow/50 transition-all mt-1"
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
                                    className="font-bold text-white text-[15px] truncate cursor-pointer hover:underline"
                                >
                                    {authorName}
                                </span>
                                {isFounderPost ? (
                                    <CheckCircle size={14} className="text-alphabag-yellow flex-shrink-0" fill="currentColor" />
                                ) : (
                                    <Zap size={14} className="text-alphabag-muted flex-shrink-0" />
                                )}
                                <span className="text-alphabag-muted text-[14px] truncate">{authorHandle}</span>
                                <span className="text-alphabag-muted text-[14px]">· 20h</span>
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
                            <button className="text-alphabag-muted hover:text-white transition-colors p-1 rounded-full hover:bg-white/5">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`p-4 rounded-xl mb-3 border ${post.strategy === 'DEGEN' ? 'bg-gradient-to-br from-orange-500/5 to-transparent border-orange-500/20 shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]' :
                        post.strategy === 'SHORT' ? 'bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20' :
                            post.strategy === 'LONGTERM' ? 'bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20' :
                                post.strategy === 'AIRDROP' ? 'bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20' :
                                    'bg-transparent border-transparent'
                        }`}>
                        <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${post.strategy === 'DEGEN' ? 'text-orange-50 font-medium' :
                            post.strategy === 'SHORT' ? 'text-red-50' :
                                post.strategy === 'LONGTERM' ? 'text-green-50' :
                                    post.strategy === 'AIRDROP' ? 'text-purple-50' :
                                        'text-zinc-200'
                            }`}>
                            {post.content}
                        </p>
                    </div>

                    {/* Banner for Manifesto posts */}
                    {isFounderPost && (
                        <div className="rounded-2xl border border-white/10 overflow-hidden mb-4 bg-white/5 shadow-2xl">
                            {post.bannerUrl ? (
                                <img src={post.bannerUrl} alt="Manifesto Banner" className="aspect-[3/1] w-full object-cover" />
                            ) : (
                                <div className="aspect-video bg-gradient-to-br from-alphabag-yellow/10 to-transparent flex items-center justify-center">
                                    <Zap size={48} className="text-alphabag-yellow/20" />
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
                            <span className="text-xs font-medium">{post.commentCount || 687}</span>
                        </button>
                        <button
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
                        <button className="flex items-center gap-2 group transition-colors hover:text-alphabag-yellow p-2 rounded-full hover:bg-alphabag-yellow/10">
                            <BarChart size={18} />
                            <span className="text-xs font-medium">6M</span>
                        </button>
                        <div className="flex gap-1">
                            <button className="p-2 hover:bg-alphabag-yellow/10 rounded-full transition-colors hover:text-alphabag-yellow">
                                <Bookmark size={18} />
                            </button>
                            <button className="p-2 hover:bg-alphabag-yellow/10 rounded-full transition-colors hover:text-alphabag-yellow">
                                <ExternalLink size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
