import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Crown,
    ExternalLink,
    Globe,
    MapPin,
    MessageSquare,
    Rocket,
    Share2,
    ShieldCheck,
    Users,
    Zap,
    Wallet
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Button } from '../../components/ui/Button';
import { PageIcon } from '../../components/ui/PageIcon';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { AlphaRadarService } from '../../services/alphaRadarService';
import { api } from '../../services/api';
import { TIER_LIMITS, TOKEN_GATING_CONFIG } from '../../services/config';
import { extractSyncData, injectSyncData } from '../../services/syncService';
import { Project } from '../../types';

const getProfileName = (userObj: any) => {
    if (userObj?.email) {
        return userObj.email.split('@')[0];
    }
    const walletAddress = userObj?.verifiedWallet || userObj?.walletAddress;
    if (walletAddress) {
        return walletAddress.substring(0, 6) + '...' + walletAddress.substring(walletAddress.length - 4);
    }
    if (userObj?.id) {
        return userObj.id.substring(0, 8);
    }
    return 'Explorer';
};

const getProfileHandle = (userObj: any) => {
    if (userObj?.email) {
        return userObj.email.split('@')[0].toLowerCase();
    }
    const walletAddress = userObj?.verifiedWallet || userObj?.walletAddress;
    if (walletAddress) {
        return walletAddress.substring(0, 6).toLowerCase();
    }
    if (userObj?.id) {
        return userObj.id.substring(0, 8).toLowerCase();
    }
    return 'explorer';
};

const getProfileInitial = (userObj: any) => {
    if (userObj?.email && userObj.email[0]) {
        return userObj.email[0].toUpperCase();
    }
    const walletAddress = userObj?.verifiedWallet || userObj?.walletAddress;
    if (walletAddress?.[2]) {
        return walletAddress[2].toUpperCase();
    }
    return 'E';
};

export const Profile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, refreshUser } = useAuth();
    const { address: connectedWalletAddress, isConnected, trackedWallets } = useWallet();
    const navigate = useNavigate();
    
    const [profileUser, setProfileUser] = useState<any>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopyRef = (refUrl: string) => {
        navigator.clipboard.writeText(refUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

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

    const isOwnProfile = Boolean(user && (user.id === id || !id || id === 'me'));
    const targetId = id === 'me' ? user?.id : (id || user?.id);
    const isLocalPreview = import.meta.env.DEV
        && typeof window !== 'undefined'
        && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
        && user?.id === 'dev-user-001';

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!targetId) {
                setProfileUser(null);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setProfileError(null);
            setProject(null);
            try {
                let data;
                if (isOwnProfile && targetId === user?.id) {
                    data = user;
                } else {
                    const res = await api.get(`/api/auth/profile/${targetId}`);
                    data = res.data;
                }

                const { bioText } = extractSyncData(data?.bio || '');
                const cleanData = data ? { ...data, bio: bioText } : null;
                setProfileUser(cleanData);
                setEditData({
                    bio: bioText,
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
            } catch (err) {
                console.error('[Profile] Failed to fetch profile:', err);
                setProfileUser(null);
                setProfileError('Could not load this profile. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [targetId, user, isOwnProfile]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Retrieve original sync configuration from profile database state to avoid overwriting
            const originalSyncData = extractSyncData(user?.bio || '').syncData;
            const finalBio = originalSyncData
                ? injectSyncData(editData.bio, originalSyncData)
                : editData.bio;

            if (isLocalPreview) {
                setProfileUser((current: any) => current ? { ...current, ...editData, bio: finalBio } : current);
                setIsEditing(false);
                return;
            }

            const res = await api.post('/api/auth/update-profile', {
                ...editData,
                bio: finalBio
            });
            if (res.data?.success && res.data?.user) {
                Swal.fire({
                    title: 'PROFILE UPDATED',
                    text: 'Your identity has been synchronized with the core.',
                    icon: 'success',
                    background: '#181A20',
                    color: '#fff',
                    confirmButtonColor: '#F0B90B'
                });
                setProfileUser(res.data.user);
                await refreshUser();
                setIsEditing(false);
            } else {
                throw new Error(res.data?.error || 'The profile update was not confirmed by the server.');
            }
        } catch (err: any) {
            Swal.fire({
                title: 'SYNC FAILED',
                text: err.response?.data?.error || 'Failed to update profile data.',
                icon: 'error',
                background: '#181A20',
                color: '#fff'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditData({
            bio: profileUser?.bio || '',
            website: profileUser?.website || '',
            location: profileUser?.location || '',
            bannerUrl: profileUser?.bannerUrl || '',
            logoUrl: profileUser?.logoUrl || ''
        });
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-alphabag-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
                <div className="w-full max-w-md border border-alphabag-border bg-alphabag-card rounded-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <PageIcon name="profile" size={48} />
                    </div>
                    <h1 className="text-lg font-bold text-alphabag-text uppercase">Profile unavailable</h1>
                    <p className="mt-2 text-sm text-alphabag-subtext leading-relaxed">
                        {profileError || 'Connect and sign in with your wallet to view and manage your AlphaBAG profile.'}
                    </p>
                    {!user && (
                        <Button
                            className="mt-5 w-full font-semibold"
                            onClick={() => window.dispatchEvent(new Event('open-login-modal'))}
                        >
                            Connect wallet
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    const isFounder = profileUser?.accountType === 'FOUNDER' || profileUser?.isAdmin;
    const isAlphaMember = String(profileUser?.tier || '').toUpperCase() === 'ALPHA';
    const loginWallet = profileUser?.verifiedWallet || profileUser?.walletAddress;
    const membershipFeatures = {
        FREE: [
            `Portfolio tracking: up to ${TIER_LIMITS.FREE.maxPortfolios} wallets`,
            `Whale monitoring: up to ${TIER_LIMITS.FREE.maxWhales} wallets`,
            'Core market and portfolio tools',
            'AlphaAI access with a usage limit',
        ],
        ALPHA: [
            `Portfolio tracking: up to ${TIER_LIMITS.ALPHA.maxPortfolios} wallets`,
            `Whale monitoring: up to ${TIER_LIMITS.ALPHA.maxWhales} wallets`,
            'Unlimited AlphaAI access',
            'Priority alerts and deeper analytics',
            'Alpha Desk access while an eligible place is available',
        ],
    };

    return (
        <div className="bg-alphabag-black min-h-screen text-white pb-20">
            {isLocalPreview && (
                <div className="mx-auto max-w-6xl px-4 pt-4">
                    <div role="status" className="rounded-md border border-alphabag-yellow/30 bg-alphabag-dark px-4 py-3 text-xs text-alphabag-subtext">
                        <span className="font-semibold text-alphabag-yellow">Local preview.</span>{' '}
                        Demo account only; wallet sign-in is unavailable. Profile edits stay in this page preview and are not sent to the server.
                    </div>
                </div>
            )}
            {/* Header / Banner */}
            <div className="h-32 border-b border-alphabag-border relative bg-cover bg-center bg-no-repeat bg-alphabag-card" style={{ backgroundImage: profileUser?.bannerUrl ? `url(${profileUser.bannerUrl})` : undefined }}>
                {!profileUser?.bannerUrl && <div className="absolute inset-0 bg-alphabag-card"></div>}
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-3 left-3 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors z-10"
                >
                    <ArrowLeft size={16} />
                </button>
            </div>

            <div className="w-full">
                {/* Profile Info Card */}
                <div className="relative -mt-12 mb-3 px-4 py-5 bg-alphabag-card border border-alphabag-border rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="relative">
                            <div
                                role={isEditing && isOwnProfile ? 'button' : undefined}
                                tabIndex={isEditing && isOwnProfile ? 0 : undefined}
                                aria-label={isEditing && isOwnProfile ? 'Change profile image' : undefined}
                                className={`w-24 h-24 rounded-lg bg-alphabag-panel border-2 border-alphabag-border p-1 ${isEditing && isOwnProfile ? 'cursor-pointer' : ''} group`}
                                onClick={() => isEditing && isOwnProfile && avatarInputRef.current?.click()}
                                onKeyDown={(event) => {
                                    if (isEditing && isOwnProfile && (event.key === 'Enter' || event.key === ' ')) {
                                        event.preventDefault();
                                        avatarInputRef.current?.click();
                                    }
                                }}
                            >
                                <div className="w-full h-full bg-alphabag-black rounded-md flex items-center justify-center overflow-hidden relative">
                                    {(editData.logoUrl || profileUser?.logoUrl) ? (
                                        <img src={editData.logoUrl || profileUser?.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-alphabag-yellow uppercase">{getProfileInitial(profileUser)}</span>
                                    )}
                                    {isEditing && isOwnProfile && (
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                            <Camera size={20} className="text-white mb-1" />
                                            <span className="text-white text-[11px] font-semibold uppercase tracking-wider">Change</span>
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
                                <div className="absolute -bottom-1 -right-1 bg-alphabag-yellow text-black p-1 rounded-md shadow border border-alphabag-black">
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
                                            onClick={handleCancelEdit}
                                            className="rounded-md border-alphabag-border text-white hover:bg-alphabag-hover font-semibold uppercase tracking-wider text-[11px] px-3.5 py-1.5"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            size="sm"
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="rounded-md bg-alphabag-yellow text-black font-semibold uppercase tracking-wider text-[11px] px-3.5 py-1.5"
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
                                                className="rounded-md border-alphabag-yellow/30 text-alphabag-yellow hover:bg-alphabag-yellow/10 font-semibold uppercase tracking-wider text-[11px] px-3.5 py-1.5"
                                            >
                                                {project ? 'Edit Manifesto' : 'Post Manifesto'}
                                            </Button>
                                        )}
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                            className="rounded-md border-alphabag-border text-white hover:bg-alphabag-hover font-semibold uppercase tracking-wider text-[11px] px-3.5 py-1.5"
                                        >
                                            Edit
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 space-y-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
                                    {getProfileName(profileUser)}
                                </h2>
                                {isFounder && <CheckCircle2 size={16} className="text-alphabag-yellow" fill="currentColor" />}
                                <div className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ml-1 ${isFounder ? 'bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/20' : 'bg-alphabag-panel text-alphabag-subtext border border-alphabag-border'}`}>
                                    {isFounder ? 'FOUNDER' : profileUser?.accountType || 'MEMBER'}
                                </div>
                            </div>
                            <p className="text-alphabag-muted text-[13px] font-medium">@{getProfileHandle(profileUser)}_member</p>
                        </div>

                        {isEditing ? (
                            <div className="space-y-2 transition-opacity">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-alphabag-muted uppercase tracking-wider ml-1">Bio</label>
                                    <textarea 
                                        className="w-full bg-alphabag-panel border border-alphabag-border rounded-md p-3 text-sm text-zinc-200 focus:border-alphabag-yellow/50 outline-none h-24 resize-none transition-all"
                                        value={editData.bio}
                                        onChange={e => setEditData({ ...editData, bio: e.target.value })}
                                        placeholder="Tell the community about your alpha discovery strategy..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-alphabag-muted uppercase tracking-wider ml-1">Location</label>
                                        <div className="relative">
                                            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-yellow" />
                                            <input 
                                                type="text"
                                                className="w-full bg-alphabag-panel border border-alphabag-border rounded-md pl-9 pr-3 py-2.5 text-sm text-zinc-200 focus:border-alphabag-yellow/50 outline-none transition-all"
                                                value={editData.location}
                                                onChange={e => setEditData({ ...editData, location: e.target.value })}
                                                placeholder="Global / Remote"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-alphabag-muted uppercase tracking-wider ml-1">Website</label>
                                        <div className="relative">
                                            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-yellow" />
                                            <input 
                                                type="text"
                                                className="w-full bg-alphabag-panel border border-alphabag-border rounded-md pl-9 pr-3 py-2.5 text-sm text-zinc-200 focus:border-alphabag-yellow/50 outline-none transition-all"
                                                value={editData.website}
                                                onChange={e => setEditData({ ...editData, website: e.target.value })}
                                                placeholder="alphabag.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-alphabag-muted uppercase tracking-wider ml-1">Banner URL</label>
                                        <div className="relative">
                                            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-yellow" />
                                            <input 
                                                type="url"
                                                className="w-full bg-alphabag-panel border border-alphabag-border rounded-md pl-9 pr-3 py-2.5 text-sm text-zinc-200 focus:border-alphabag-yellow/50 outline-none transition-all"
                                                value={editData.bannerUrl}
                                                onChange={e => setEditData({ ...editData, bannerUrl: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-semibold text-alphabag-muted uppercase tracking-wider ml-1">Logo URL</label>
                                        <div className="relative">
                                            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-yellow" />
                                            <input 
                                                type="url"
                                                className="w-full bg-alphabag-panel border border-alphabag-border rounded-md pl-9 pr-3 py-2.5 text-sm text-zinc-200 focus:border-alphabag-yellow/50 outline-none transition-all"
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

                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-alphabag-muted font-semibold uppercase tracking-wider">
                                    {profileUser?.location && <div className="flex items-center gap-1.5"><MapPin size={14} className="text-alphabag-yellow" /> {profileUser.location}</div>}
                                    {profileUser?.website && (
                                        <a
                                            href={/^https?:\/\//i.test(profileUser.website) ? profileUser.website : `https://${profileUser.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 hover:text-alphabag-text"
                                        >
                                            <Globe size={14} className="text-alphabag-yellow" /> {profileUser.website}
                                        </a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Referral Link — only on own profile */}
                    {isOwnProfile && (() => {
                        const refCode = profileUser?.referralCode || profileUser?.id?.slice(0, 8) || 'ALPHABAG';
                        const refUrl = `${window.location.origin}/#/?ref=${refCode}`;
                        return (
                            <div className="mt-4 pt-4 border-t border-alphabag-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users size={13} className="text-alphabag-yellow" />
                                    <span className="text-[11px] font-semibold text-alphabag-yellow uppercase tracking-wider">Referral Link</span>
                                    {profileUser?.referralCount > 0 && (
                                        <span className="ml-auto text-[11px] font-semibold text-alphabag-muted uppercase num">
                                            {profileUser.referralCount} referral{profileUser.referralCount !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 bg-alphabag-panel border border-alphabag-border rounded-md px-3 py-2">
                                    <span className="flex-1 font-mono text-[11px] text-zinc-400 truncate">{refUrl}</span>
                                    <button
                                        onClick={() => handleCopyRef(refUrl)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all ${
                                            copied
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/20 hover:bg-alphabag-yellow hover:text-black'
                                        }`}
                                    >
                                        {copied ? (
                                            <><CheckCircle2 size={12} /> Copied!</>
                                        ) : (
                                            <><Share2 size={12} /> Copy</>
                                        )}
                                    </button>
                                </div>
                                <p className="text-[11px] text-alphabag-muted mt-1.5 font-medium">
                                    Share your referral link with the community.
                                </p>
                            </div>
                        );
                    })()}
                </div>

                {isOwnProfile && (
                    <section id="membership" className="mb-4 space-y-4">
                        <div className="border border-alphabag-border bg-alphabag-card rounded-lg p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-alphabag-border bg-alphabag-panel">
                                    {isAlphaMember ? <Crown size={18} className="text-alphabag-yellow" /> : <Wallet size={18} className="text-alphabag-subtext" />}
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-wide text-alphabag-text">Membership</h2>
                                    <p className="mt-1 text-xs text-alphabag-subtext">
                                        {isAlphaMember
                                            ? 'Your account has Alpha membership.'
                                            : 'Compare both membership tiers and their features below.'}
                                    </p>
                                </div>
                            </div>
                            <span className={`rounded border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${isAlphaMember ? 'border-alphabag-yellow/30 bg-alphabag-yellow/10 text-alphabag-yellow' : 'border-alphabag-border bg-alphabag-panel text-alphabag-subtext'}`}>
                                {isAlphaMember ? 'Alpha' : 'Free'}
                            </span>
                        </div>

                        <div className="mt-4 grid gap-3 border-t border-alphabag-border pt-4 md:grid-cols-2">
                            {(['FREE', 'ALPHA'] as const).map((tier) => {
                                const isCurrentTier = (isAlphaMember ? 'ALPHA' : 'FREE') === tier;
                                return (
                                    <article
                                        key={tier}
                                        aria-label={`${tier === 'FREE' ? 'Free' : 'Alpha'} tier features`}
                                        className={`rounded-lg border p-4 ${tier === 'ALPHA' ? 'border-alphabag-yellow/40 bg-alphabag-yellow/[0.04]' : 'border-alphabag-border bg-alphabag-panel'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {tier === 'ALPHA' && <Crown size={16} className="text-alphabag-yellow" />}
                                            <h3 className="text-sm font-bold uppercase tracking-wide text-alphabag-text">
                                                {tier === 'FREE' ? 'Free' : 'Alpha'}
                                            </h3>
                                        </div>
                                        {isCurrentTier && (
                                            <p className="mt-1 text-[11px] font-semibold text-alphabag-green">Your current tier</p>
                                        )}
                                        <ul className="mt-3 space-y-2">
                                            {membershipFeatures[tier].map((feature) => (
                                                <li key={feature} className="flex items-start gap-2 text-xs text-alphabag-subtext">
                                                    <CheckCircle2 size={14} className={`mt-0.5 shrink-0 ${tier === 'ALPHA' ? 'text-alphabag-yellow' : 'text-alphabag-green'}`} />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                );
                            })}
                        </div>

                        <div className="mt-4 rounded-md border border-alphabag-border bg-alphabag-panel p-3">
                            <p className="text-xs font-semibold text-alphabag-text">How Alpha eligibility works</p>
                            <p className="mt-1 text-xs leading-relaxed text-alphabag-subtext">
                                Alpha is unlocked by verifying at least {TOKEN_GATING_CONFIG.ALPHA_MINIMUM_BAG_BALANCE.toLocaleString()} BAG in the same wallet used to sign in; it is not a paid subscription. Alpha Desk has a separate limit of 1,000 eligible users.
                            </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {isAlphaMember ? (
                                <Button
                                    size="sm"
                                    onClick={() => navigate('/alpha-desk')}
                                    className="bg-alphabag-yellow text-black font-semibold"
                                >
                                    <ExternalLink size={14} className="mr-1.5" /> Open Alpha Desk
                                </Button>
                            ) : !isLocalPreview ? (
                                <Button
                                    size="sm"
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
                                    className="bg-alphabag-yellow text-black font-semibold"
                                >
                                    Verify Alpha eligibility
                                </Button>
                            ) : (
                                <p className="text-xs text-alphabag-muted">
                                    Wallet verification is unavailable in this local preview.
                                </p>
                            )}
                        </div>
                        </div>

                        <div className="border border-alphabag-border bg-alphabag-card rounded-lg p-4 sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-bold uppercase tracking-wide text-alphabag-text">Connected details</h2>
                                    <p className="mt-1 text-xs text-alphabag-subtext">Review the login wallet and wallet connections linked to this account.</p>
                                </div>
                                <Button size="sm" variant="secondary" onClick={() => navigate('/integrations')}>
                                    <ExternalLink size={14} className="mr-1.5" /> Manage connections
                                </Button>
                            </div>

                            <div className="mt-4 grid gap-3 border-t border-alphabag-border pt-4 sm:grid-cols-2">
                                <div className="rounded-md border border-alphabag-border bg-alphabag-panel p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-alphabag-muted">Login wallet</p>
                                    <p className="mt-1 break-all font-mono text-xs text-alphabag-text">{loginWallet || 'No wallet linked to this account'}</p>
                                    <p className="mt-1 text-[11px] text-alphabag-subtext">Used to sign in and verify Alpha eligibility.</p>
                                </div>
                                <div className="rounded-md border border-alphabag-border bg-alphabag-panel p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-alphabag-muted">Currently connected wallet</p>
                                    <p className="mt-1 break-all font-mono text-xs text-alphabag-text">
                                        {isConnected && connectedWalletAddress ? connectedWalletAddress : 'No wallet currently connected'}
                                    </p>
                                    {isConnected && connectedWalletAddress && loginWallet && connectedWalletAddress.toLowerCase() !== loginWallet.toLowerCase() && (
                                        <p className="mt-1 text-[11px] text-alphabag-yellow">This differs from the login wallet used for Alpha verification.</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-alphabag-text">Tracked wallets</h3>
                                    <span className="font-mono text-xs text-alphabag-subtext">{trackedWallets.length}</span>
                                </div>
                                {trackedWallets.length > 0 ? (
                                    <ul className="mt-2 divide-y divide-alphabag-border rounded-md border border-alphabag-border">
                                        {trackedWallets.map((wallet) => (
                                            <li key={wallet.id} className="flex flex-wrap items-center justify-between gap-2 bg-alphabag-panel px-3 py-2">
                                                <div>
                                                    <p className="text-xs font-semibold text-alphabag-text">{wallet.label || 'Tracked wallet'}</p>
                                                    <p className="mt-0.5 font-mono text-[11px] text-alphabag-subtext">
                                                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)} · {wallet.chain}
                                                    </p>
                                                </div>
                                                <span className="text-[11px] text-alphabag-muted">
                                                    {wallet.type === 'WHALE' ? 'Whale monitor' : 'Portfolio'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-2 rounded-md border border-alphabag-border bg-alphabag-panel px-3 py-2 text-xs text-alphabag-subtext">
                                        No tracked wallets added. Add and manage wallet connections in Integrations.
                                    </p>
                                )}
                            </div>
                            <p className="mt-3 text-[11px] text-alphabag-muted">
                                Exchange connections and API-key management are available in Integrations; secret keys are never shown on your profile.
                            </p>
                        </div>
                    </section>
                )}

                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-alphabag-subtext">Recent activity</h2>

                {/* Timeline Content */}
                <div className="space-y-3">
                    {isFounder && project && (
                        <div className="group relative">
                            <div className="flex items-center gap-2 mb-2 ml-2">
                                <Zap size={12} className="text-alphabag-yellow" fill="currentColor" />
                                <span className="text-[11px] font-semibold text-alphabag-yellow uppercase tracking-wider">Pinned Manifesto</span>
                            </div>

                            <div className="p-0 border border-alphabag-border bg-alphabag-card relative overflow-hidden rounded-lg">
                                <div className="h-32 w-full relative overflow-hidden bg-alphabag-panel border-b border-alphabag-border">
                                    {project.bannerUrl ? (
                                        <img src={project.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-alphabag-panel flex items-center justify-center">
                                            <Rocket size={32} className="text-alphabag-muted opacity-30" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 pt-4">
                                    <div className="flex items-center gap-3 mb-3 relative -mt-10">
                                        <div className="w-14 h-14 bg-alphabag-card border-2 border-alphabag-yellow rounded-lg flex items-center justify-center font-bold text-xl text-alphabag-yellow shadow overflow-hidden">
                                            {project.logoUrl ? (
                                                <img src={project.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold">{project.symbol[0]}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                                                {project.name} <span className="text-alphabag-yellow">({project.symbol})</span>
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="text-zinc-200 text-base font-semibold leading-snug mb-2 italic border-l-2 border-alphabag-yellow pl-3">
                                        "{project.theHook}"
                                    </p>

                                    <p className="text-zinc-400 text-xs leading-relaxed mb-3 line-clamp-3">
                                        {project.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <Button 
                                            onClick={() => window.open(project.buyLink, '_blank', 'noopener,noreferrer')}
                                            className="bg-alphabag-yellow text-black font-semibold uppercase tracking-wider text-xs rounded-md px-6 py-2 transition-all"
                                        >
                                            Buy $ {project.symbol}
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            onClick={() => window.open(project.websiteUrl, '_blank', 'noopener,noreferrer')}
                                            className="border-alphabag-border text-white hover:bg-alphabag-hover font-semibold uppercase tracking-wider text-xs rounded-md px-6 py-2"
                                        >
                                            <Globe size={14} className="mr-1.5" /> Website
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!(isFounder && project) && (
                        <div className="p-16 text-center border border-dashed border-alphabag-border rounded-lg">
                            <MessageSquare size={36} className="text-alphabag-muted mx-auto mb-2 opacity-30" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-1">No activity yet</h3>
                            <p className="text-xs text-alphabag-muted">No profile activity has been published yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
