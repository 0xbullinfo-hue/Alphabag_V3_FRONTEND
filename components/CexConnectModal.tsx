import React, { useState } from 'react';
import { X, Shield, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

interface CexConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    exchangeName: string;
    onConnect: (apiKey: string, secret: string) => Promise<void>;
    isConnecting: boolean;
}

export const CexConnectModal: React.FC<CexConnectModalProps> = ({
    isOpen,
    onClose,
    exchangeName,
    onConnect,
    isConnecting
}) => {
    const [apiKey, setApiKey] = useState('');
    const [secret, setSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConnect(apiKey, secret);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-alphabag-dark border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-alphabag-subtext hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-alphabag-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="text-alphabag-yellow" size={24} />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                        Connect {exchangeName}
                    </h2>
                    <p className="text-alphabag-subtext text-xs mt-2">
                        Enter your <strong>Read-Only</strong> API Keys using the form below.
                        Keys are encrypted locally and never stored on our servers.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-alphabag-subtext uppercase tracking-widest mb-1">
                            API Key
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext" size={16} />
                            <input
                                type="text"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:border-alphabag-yellow focus:outline-none transition-colors"
                                placeholder="Enter public key..."
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-alphabag-subtext uppercase tracking-widest mb-1">
                            API Secret
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext" size={16} />
                            <input
                                type={showSecret ? "text" : "password"}
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-10 text-white text-sm focus:border-alphabag-yellow focus:outline-none transition-colors"
                                placeholder="Enter secret key..."
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-alphabag-subtext hover:text-white"
                            >
                                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-[10px] text-blue-400">
                            <strong>Security Tip:</strong> Verify that "Enable Withdrawals" is DISABLED in your exchange API settings.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full font-bold uppercase tracking-widest py-3"
                        disabled={isConnecting || !apiKey || !secret}
                    >
                        {isConnecting ? (
                            <span className="flex items-center justify-center">
                                <Loader2 className="animate-spin mr-2" size={16} /> Verifying Keys...
                            </span>
                        ) : (
                            'Secure Connection'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};
