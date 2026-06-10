import React from 'react';
import { Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const UpgradeCmd: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { user } = useAuth();

    if (user?.tier === 'ULTIMATE') return null;

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => window.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
            className={`border-alphabag-yellow/50 text-alphabag-yellow hover:bg-alphabag-yellow/10 font-black uppercase tracking-widest shadow-[0_0_10px_rgba(252,213,53,0.1)] ${className}`}
        >
            <Crown size={14} className="mr-2" /> Upgrade
        </Button>
    );
};
