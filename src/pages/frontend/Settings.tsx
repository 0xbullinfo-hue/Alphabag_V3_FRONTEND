import { Check, Crown, ExternalLink } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { PageIcon } from '../../components/ui/PageIcon';
import { useAuth } from '../../context/AuthContext';

export const Settings: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAlpha = user?.tier === 'ALPHA';

    return (
        <div className="w-full space-y-4 pb-6">
            <div className="page-header-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <PageIcon name="settings" size={32} />
                        <h1 className="text-2xl font-bold text-alphabag-text tracking-tight">Membership</h1>
                    </div>
                    <p className="text-alphabag-subtext text-xs">Review your Free or Alpha membership and access requirements.</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate('/integrations')}>
                    Manage Connections <ExternalLink size={12} className="ml-1.5" />
                </Button>
            </div>

            <section className="rounded-lg border border-alphabag-border bg-alphabag-card p-5 space-y-4">
                <div className="pb-3 border-b border-alphabag-border">
                    <div className="flex items-center gap-2 mb-1">
                        <Crown className="text-alphabag-yellow" size={18} />
                        <h2 className="text-lg font-bold text-white tracking-tight">Membership tiers</h2>
                    </div>
                    <p className="text-alphabag-subtext text-xs">
                        Alpha eligibility is verified by the server against the wallet used to sign in.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                    <div className="bg-alphabag-panel border border-alphabag-border rounded-md p-4">
                        <div className="text-[11px] uppercase font-semibold text-alphabag-subtext">Free</div>
                        <h3 className="text-base font-bold text-alphabag-text mt-0.5">Free membership</h3>
                        <div className="text-lg font-bold text-alphabag-subtext mt-1.5 num">0 BAG required</div>
                        <div className="h-px bg-alphabag-border my-3" />
                        <div className="space-y-2 text-xs text-alphabag-text">
                            <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-subtext shrink-0" /><span>Standard dashboard and portfolio tools</span></div>
                            <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-subtext shrink-0" /><span>Markets, Alpha Screener, and calculator</span></div>
                            <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-subtext shrink-0" /><span>News, missions, and community feed</span></div>
                        </div>
                        {!isAlpha && <p className="text-[11px] text-alphabag-yellow font-semibold mt-4">Current membership</p>}
                    </div>

                    <div className="bg-alphabag-panel border border-alphabag-yellow/50 rounded-md p-4">
                        <div className="text-[11px] uppercase font-semibold text-alphabag-yellow">Alpha</div>
                        <h3 className="text-base font-bold text-alphabag-text mt-0.5">Alpha membership</h3>
                        <div className="text-lg font-bold text-alphabag-yellow mt-1.5 num">3,000 BAG</div>
                        <p className="text-[11px] text-alphabag-subtext mt-1">Held in the wallet used to sign in</p>
                        <div className="h-px bg-alphabag-border my-3" />
                        <div className="space-y-2 text-xs text-alphabag-text">
                            <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-yellow shrink-0" /><span>All Free membership features</span></div>
                            <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-yellow shrink-0" /><span>Expanded Alpha analytics and tools</span></div>
                            <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-yellow shrink-0" /><span>Alpha Desk, subject to its 1,000-user active limit</span></div>
                        </div>
                        {isAlpha ? (
                            <Button size="sm" onClick={() => navigate('/alpha-desk')} className="mt-4 w-full">
                                Open Alpha Desk
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
                                className="mt-4 w-full"
                            >
                                Verify Alpha membership
                            </Button>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Settings;
