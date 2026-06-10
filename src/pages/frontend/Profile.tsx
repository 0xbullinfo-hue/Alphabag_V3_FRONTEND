import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Calendar, MapPin, Link as LinkIcon, Users, MessageSquare, 
    Heart, Share2, Rocket, Edit3, ShieldCheck, Zap, ArrowLeft,
    Flame, CheckCircle2, Globe, ExternalLink, Bookmark, BarChart,
    TrendingUp, Award, DollarSign, Save, X, Camera
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { AlphaRadarService } from '../../services/alphaRadarService';
import { api } from '../../services/api';
import { Project, Post } from '../../types';
import Swal from 'sweetalert2';

export const Profile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    
    const [profileUser, setProfileUser] = useState<any>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        bio: '',
        website: '',
        location: '',
        bannerUrl: '',
        logoUrl: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditData(prev => ({ ...prev, logoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const isOwnProfile = user?.id === id || (!id && user) || id === 'me';
    const targetId = id === 'me' ? user?.id : (id || user?.id);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!targetId) return;
            setIsLoading(true);
            try {
                // Fetch latest user data if it's "me"
                let data;
                if (isOwnProfile && targetId === user?.id) {
                    data = user;
                } else if (targetId === 'user1') {
                    data = {
                        id: 'user1',
                        email: 'founder@neuralbag.com',
                        accountType: 'FOUNDER',
                        bio: "Architecting the future of decentralized alpha discovery. Neural engine specialist and BAG holder.",
                        website: 'neuralbag.com',
                        location: 'Silicon Valley, CA'
                    };
                } else if (targetId === 'user2') {
                    data = {
                        id: 'user2',
                        email: 'whale_trader@alphabag.com',
                        accountType: 'TRADER',
                        bio: "Professional yield farmer and alpha seeker. 80% Win Rate on DEX gems. #AlphaRadar Expert.",
                        website: 'alpharadar.io',
                        location: 'Dubai, UAE'
                    };
                } else {
                    // Try to fetch from API if not mock
                    try {
                        const res = await api.get(`/api/auth/profile/${targetId}`);
                        data = res.data;
                    } catch {
                        data = {
                            id: targetId,
                            email: 'explorer@alphabag.com',
                            accountType: 'TRADER',
                            bio: "Decentralized explorer seeking out the next big play.",
                            website: 'alphabag.com',
                            location: 'Global'
                        };
                    }
                }

                setProfileUser(data);
                setEditData({
                    bio: data?.bio || '',
                    website: data?.website || '',
                    location: data?.location || '',
                    bannerUrl: data?.bannerUrl || '',
                    logoUrl: data?.logoUrl || ''
                });

                // Fetch Project if Founder
                const projectData = await AlphaRadarService.getProject(targetId);
                if (projectData) {
                    setProject(projectData);
                }

                // Mock posts for timeline (Filtered by targetId)
                const mockAllPosts = [
                    {
                        id: 'p1',
                        authorId: 'user1',
                        content: "Scaling the neural core to handle 50k requests/sec. The AlphaBAG engine is built for institutional load. #AlphaRadar",
                        likeCount: 420,
                        commentCount: 12,
                        shareCount: 55,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'p2',
                        authorId: 'user2',
                        content: "Just spotted a massive whale move on the Alpha Hub. The liquidity depth is incredible. Strong buy signals across the board.",
                        likeCount: 89,
                        commentCount: 4,
                        shareCount: 12,
                        createdAt: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        id: 'p3',
                        authorId: user?.id || 'me',
                        content: "Finally set up my AlphaBAG dashboard. The CEX + DEX unified portfolio view is a game changer for my workflow.",
                        likeCount: 15,
                        commentCount: 2,
                        shareCount: 3,
                        createdAt: new Date(Date.now() - 7200000).toISOString()
                    }
                ];

                setPosts(mockAllPosts.filter(p => p.authorId === targetId || (targetId === user?.id && p.authorId === 'me')));
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [targetId, user, isOwnProfile]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await api.post('/api/auth/update-profile', editData);
            if (res.data.success) {
                Swal.fire({
                    title: 'PROFILE UPDATED',
                    text: 'Your identity has been synchronized with the core.',
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#fff',
                    confirmButtonColor: '#fcd535'
                });
                setProfileUser(res.data.user);
                await refreshUser();
                setIsEditing(false);
            }
        } catch (err: any) {
            Swal.fire({
                title: 'SYNC FAILED',
                text: err.response?.data?.error || 'Failed to update profile data.',
                icon: 'error',
                background: '#0a0a0a',
                color: '#fff'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-alphabag-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isFounder = profileUser?.accountType === 'FOUNDER' || profileUser?.isAdmin;

    return (
        <div className="bg-alphabag-black min-h-screen text-white pb-20">
            {/* Header / Banner */}
            <div className="h-32 border-b border-white/5 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: profileUser?.bannerUrl ? `url(${profileUser.bannerUrl})` : undefined }}>
                {!profileUser?.bannerUrl && <div className="absolute inset-0 bg-gradient-to-r from-alphabag-dark to-alphabag-black"></div>}
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-3 left-3 p-1.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors z-10"
                >
                    <ArrowLeft size={16} />
                </button>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            </div>

            <div className="max-w-3xl mx-auto px-4">
                {/* Profile Info Card */}
                <div className="relative -mt-12 mb-6 px-4 py-5 bg-alphabag-darkgray/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
                    <div className="flex justify-between items-start">
                        <div className="relative">
                            <div
                                className={`w-24 h-24 rounded-2xl bg-gradient-to-tr from-alphabag-yellow to-orange-500 p-1 shadow-glow-yellow/20 ${isEditing && isOwnProfile ? 'cursor-pointer' : ''} group`}
                                onClick={() => isEditing && isOwnProfile && avatarInputRef.current?.click()}
                            >
                                <div className="w-full h-full bg-alphabag-black rounded-xl flex items-center justify-center overflow-hidden relative">
                                    {(editData.logoUrl || profileUser?.logoUrl) ? (
                                        <img src={editData.logoUrl || profileUser?.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-black text-alphabag-yellow uppercase">{profileUser?.email?.[0] || 'U'}</span>
                                    )}
                                    {isEditing && isOwnProfile && (
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                            <Camera size={20} className="text-white mb-1" />
                                            <span className="text-white text-[8px] font-black uppercase tracking-widest">Change</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            {isFounder && (
                                <div className="absolute -bottom-1.5 -right-1.5 bg-alphabag-yellow text-black p-1 rounded-lg shadow-lg border-2 border-alphabag-black">
                                    <ShieldCheck size={14} fill="currentColor" />
                                </div>
                            )}
                        </div>

                        {isOwnProfile && (
                            <div className="pt-10 flex gap-2">
                                {isEditing ? (
                                    <>
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(false)}
                                            className="rounded-full border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[9px] px-4 py-1.5"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            size="sm"
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="rounded-full bg-alphabag-yellow text-black font-black uppercase tracking-widest text-[9px] px-4 py-1.5 shadow-glow-yellow/20"
                                        >
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {isFounder && (
                                            <Button 
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate('/genesis-manifesto')}
                                                className="rounded-full border-alphabag-yellow/30 text-alphabag-yellow hover:bg-alphabag-yellow/10 font-black uppercase tracking-widest text-[9px] px-4 py-1.5"
                                            >
                                                {project ? 'Edit Manifesto' : 'Post Manifesto'}
                                            </Button>
                                        )}
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            className="rounded-full border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[9px] px-4 py-1.5"
                                        >
                                            Edit
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 space-y-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">
                                    {profileUser?.email?.split('@')[0]}
                                </h2>
                                {isFounder && <CheckCircle2 size={16} className="text-alphabag-yellow" fill="currentColor" />}
                                <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ml-1 ${isFounder ? 'bg-alphabag-yellow/20 text-alphabag-yellow border border-alphabag-yellow/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                    {isFounder ? 'FOUNDER' : 'ELITE'}
                                </div>
                            </div>
                            <p className="text-alphabag-muted text-[13px] font-medium opacity-60">@{profileUser?.email?.split('@')[0].toLowerCase() || 'anonymous'}_member</p>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-alphabag-muted uppercase tracking-[0.2em] ml-1">Bio</label>
                                    <textarea 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-zinc-200 focus:border-alphabag-yellow/50 outline-none h-24 resize-none transition-all"
                                        value={editData.bio}
                                        onChange={e => setEditData({ ...editData, bio: e.target.value })}
                                        placeholder="Tell the community about your alpha discovery strategy..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-alphabag-muted uppercase tracking-[0.2em] ml-1">Location</label>
                                        <div className="relative">
                                            <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-yellow" />
                                            <input 
                                                type="text"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 focus:border-alphabag-yellow/50 outline-none transition-all"
                                                value={editData.location}
                                                onChange={e => setEditData({ ...editData, location: e.target.value })}
                                                placeholder="Global / Remote"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-alphabag-muted uppercase tracking-[0.2em] ml-1">Website</label>
                                        <div className="relative">
                                            <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-yellow" />
                                            <input 
                                                type="text"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 focus:border-alphabag-yellow/50 outline-none transition-all"
                                                value={editData.website}
                                                onChange={e => setEditData({ ...editData, website: e.target.value })}
                                                placeholder="alphabag.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-alphabag-muted uppercase tracking-[0.2em] ml-1">Banner URL</label>
                                        <div className="relative">
                                            <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-yellow" />
                                            <input 
                                                type="url"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 focus:border-alphabag-yellow/50 outline-none transition-all"
                                                value={editData.bannerUrl}
                                                onChange={e => setEditData({ ...editData, bannerUrl: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-alphabag-muted uppercase tracking-[0.2em] ml-1">Logo URL</label>
                                        <div className="relative">
                                            <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-alphabag-yellow" />
                                            <input 
                                                type="url"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 focus:border-alphabag-yellow/50 outline-none transition-all"
                                                value={editData.logoUrl}
                                                onChange={e => setEditData({ ...editData, logoUrl: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-zinc-300 text-sm leading-relaxed max-w-xl whitespace-pre-wrap">
                                    {profileUser?.bio || "AlphaBAG community member. Early adopter of the intelligence-first platform."}
                                </p>

                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-alphabag-muted font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5"><MapPin size={14} className="text-alphabag-yellow" /> {profileUser?.location || "Web3 Native"}</div>
                                    <div className="flex items-center gap-1.5"><Globe size={14} className="text-alphabag-yellow" /> {profileUser?.website || "alphabag.com"}</div>
                                    <div className="flex items-center gap-1.5"><Calendar size={14} className="text-alphabag-yellow" /> Joined March 2026</div>
                                </div>
                            </>
                        )}

                        <div className="flex gap-6 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-white font-black text-sm">4.2K</span>
                                <span className="text-alphabag-muted text-[10px] font-black uppercase tracking-widest">Following</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-white font-black text-sm">12.8K</span>
                                <span className="text-alphabag-muted text-[10px] font-black uppercase tracking-widest">Followers</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                        <div className="text-center p-2 bg-alphabag-yellow/5 rounded-xl border border-alphabag-yellow/10">
                            <div className="text-[9px] font-black text-alphabag-yellow uppercase tracking-widest mb-0.5">Rep</div>
                            <div className="text-base font-black text-white leading-tight">98%</div>
                            <div className="text-[7px] font-bold text-alphabag-yellow/60 uppercase">Diamond</div>
                        </div>
                        <div className="text-center p-2 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-[9px] font-black text-alphabag-muted uppercase tracking-widest mb-0.5">Tokens</div>
                            <div className="flex items-center justify-center gap-1">
                                <Zap size={12} className="text-alphabag-yellow" fill="currentColor" />
                                <span className="text-base font-black text-white leading-tight">{profileUser?.bagTokens || 100}</span>
                            </div>
                            <div className="text-[7px] font-bold text-alphabag-muted uppercase">Top 1%</div>
                        </div>
                        <div className="text-center p-2 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-[9px] font-black text-alphabag-muted uppercase tracking-widest mb-0.5">Vetting</div>
                            <div className="text-base font-black text-alphabag-green leading-tight">LVL 1</div>
                            <div className="text-[7px] font-bold text-alphabag-muted uppercase">Verified</div>
                        </div>
                    </div>

                    {/* Referral Link — only on own profile */}
                    {isOwnProfile && (() => {
                        const refCode = profileUser?.referralCode || profileUser?.id?.slice(0, 8) || 'ALPHABAG';
                        const refUrl = `${window.location.origin}/#/?ref=${refCode}`;
                        const [copied, setCopied] = React.useState(false);
                        const handleCopy = () => {
                            navigator.clipboard.writeText(refUrl).then(() => {
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2500);
                            });
                        };
                        return (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users size={13} className="text-alphabag-yellow" />
                                    <span className="text-[10px] font-black text-alphabag-yellow uppercase tracking-widest">Referral Link</span>
                                    {profileUser?.referralCount > 0 && (
                                        <span className="ml-auto text-[9px] font-bold text-alphabag-muted uppercase">
                                            {profileUser.referralCount} referral{profileUser.referralCount !== 1 ? 's' : ''} · Bonus ITEMS earned
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5">
                                    <span className="flex-1 font-mono text-[11px] text-zinc-400 truncate">{refUrl}</span>
                                    <button
                                        onClick={handleCopy}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                            copied
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/20 hover:bg-alphabag-yellow hover:text-black'
                                        }`}
                                    >
                                        {copied ? (
                                            <><CheckCircle2 size={11} /> Copied!</>
                                        ) : (
                                            <><Share2 size={11} /> Copy</>
                                        )}
                                    </button>
                                </div>
                                <p className="text-[9px] text-alphabag-muted mt-1.5 font-medium">
                                    Share this link — each signup earns you bonus ITEMS in the active campaign.
                                </p>
                            </div>
                        );
                    })()}
                </div>

                {/* Timeline Tabs */}
                <div className="flex border-b border-white/5 mb-6">
                    {['Alphas', isFounder ? 'Manifesto' : 'Replies', 'Media'].map((tab) => (
                        <button 
                            key={tab}
                            className={`px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] relative transition-colors ${tab === 'Alphas' ? 'text-alphabag-yellow' : 'text-alphabag-muted hover:text-white'}`}
                        >
                            {tab}
                            {tab === 'Alphas' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-alphabag-yellow rounded-full" />}
                        </button>
                    ))}
                </div>

                {/* Timeline Content */}
                <div className="space-y-6">
                    {isFounder && project && (
                        <div className="group relative">
                            <div className="flex items-center gap-2 mb-2 ml-4">
                                <Zap size={12} className="text-alphabag-yellow" fill="currentColor" />
                                <span className="text-[10px] font-black text-alphabag-yellow uppercase tracking-widest">Pinned Manifesto</span>
                            </div>

                            <div className="glass-panel p-0 border-2 border-alphabag-yellow/30 bg-alphabag-black shadow-glow-yellow/5 relative overflow-hidden rounded-3xl">
                                <div className="h-32 w-full relative overflow-hidden bg-alphabag-darkgray/30 border-b border-white/5">
                                    {project.bannerUrl ? (
                                        <img src={project.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-alphabag-yellow/20 to-transparent flex items-center justify-center">
                                            <Rocket size={32} className="text-alphabag-yellow/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-alphabag-black to-transparent"></div>
                                </div>

                                <div className="p-8 pt-4">
                                    <div className="flex items-center gap-4 mb-6 relative -mt-12">
                                        <div className="w-16 h-16 bg-alphabag-black border-2 border-alphabag-yellow rounded-2xl flex items-center justify-center font-black text-2xl text-alphabag-yellow shadow-2xl overflow-hidden">
                                            {project.logoUrl ? (
                                                <img src={project.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-black">{project.symbol[0]}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                                {project.name} <span className="text-alphabag-yellow">({project.symbol})</span>
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="text-zinc-200 text-lg font-bold leading-snug mb-6 italic border-l-4 border-alphabag-yellow pl-4">
                                        "{project.theHook}"
                                    </p>

                                    <p className="text-zinc-400 text-sm leading-relaxed mb-8 line-clamp-3">
                                        {project.description}
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                        <Button 
                                            onClick={() => window.open(project.buyLink, '_blank')}
                                            className="bg-alphabag-yellow text-black font-black uppercase tracking-widest text-[11px] rounded-full px-8 py-3 shadow-glow-yellow/20 shadow-lg hover:shadow-alphabag-yellow/40 hover:-translate-y-0.5 transition-all"
                                        >
                                            Buy $ {project.symbol}
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            onClick={() => window.open(project.websiteUrl, '_blank')}
                                            className="border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[11px] rounded-full px-8 py-3"
                                        >
                                            <Globe size={16} className="mr-2" /> Website
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {posts.length > 0 ? (
                        posts.map(post => (
                            <div key={post.id} className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors rounded-2xl">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 flex-shrink-0 bg-alphabag-black border border-white/10 rounded-full flex items-center justify-center font-black text-alphabag-yellow uppercase">
                                        {profileUser?.email?.[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white text-[15px]">{profileUser?.email?.split('@')[0]}</span>
                                            {isFounder && <CheckCircle2 size={14} className="text-alphabag-yellow" fill="currentColor" />}
                                            <span className="text-alphabag-muted text-[14px]">@{profileUser?.email?.split('@')[0].toLowerCase() || 'anonymous'}_member</span>
                                        </div>
                                        <p className="text-zinc-200 text-[15px] leading-relaxed mb-4">
                                            {post.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center">
                            <MessageSquare size={48} className="text-alphabag-muted mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">No Alphas Yet</h3>
                            <p className="text-sm text-alphabag-muted">This node hasn't broadcasted any intelligence yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
