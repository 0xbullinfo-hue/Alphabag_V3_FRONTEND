import { AlertTriangle,Key,Loader2,Shield,X } from 'lucide-react';
import React,{ useState } from 'react';
import { Integration } from '../../types';
import { Button } from './Button';

interface IntegrationConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: Integration | null;
  onConnect: (id: string) => void;
}

export const IntegrationConnectModal: React.FC<IntegrationConnectModalProps> = ({ isOpen, onClose, integration, onConnect }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !integration) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (integration.requiresApiKeys && (!apiKey || !apiSecret)) {
        setError('API Key and Secret are required.');
        return;
    }

    setError(null);
    setIsConnecting(true);

    // Simulate network delay for connection
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (integration.requiresApiKeys && apiKey.length < 10) {
        setError('Invalid API Key detected. Please check your credentials.');
        setIsConnecting(false);
        return;
    }

    setIsConnecting(false);
    onConnect(integration.id);
    setApiKey('');
    setApiSecret('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-alphabag-dark border border-alphabag-gray rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        <div className="flex justify-between items-center p-4 border-b border-alphabag-gray/50">
          <div className="flex items-center gap-2">
             <img src={integration.icon} alt={integration.name} className="w-8 h-8 rounded-full bg-white p-0.5" />
             <h2 className="text-xl font-bold text-white">Connect {integration.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-alphabag-subtext hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-alphabag-subtext mb-2">{integration.description}</p>
          
          {error && (
            <div className="mb-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start text-red-400 text-sm">
              <AlertTriangle size={18} className="mr-3 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleConnect} className="space-y-2">
            {integration.requiresApiKeys ? (
                <>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-alphabag-muted mb-2">API Key</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key size={16} className="text-alphabag-subtext" />
                        </div>
                        <input
                          type="text"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-alphabag-yellow transition-colors"
                          placeholder="Enter your API Key"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-alphabag-muted mb-2">API Secret</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Shield size={16} className="text-alphabag-subtext" />
                        </div>
                        <input
                          type="password"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          className="w-full bg-alphabag-black border border-alphabag-gray rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-alphabag-yellow transition-colors"
                          placeholder="Enter your API Secret"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-alphabag-yellow/5 border border-alphabag-yellow/20 rounded-xl text-xs text-alphabag-subtext flex gap-2">
                     <Shield size={14} className="text-alphabag-yellow shrink-0" />
                     <p>Your keys are encrypted locally. <strong>WARNING:</strong> Ensure your API permissions are strictly set to <strong>READ-ONLY</strong>. Never provide keys with withdrawal permissions.</p>
                  </div>
                </>
            ) : (
                <div className="p-4 bg-alphabag-black border border-dashed border-alphabag-gray rounded-xl text-center">
                    <Shield size={32} className="mx-auto text-alphabag-subtext mb-2 opacity-50" />
                    <h3 className="text-white font-medium mb-2">Web3 Authorization Required</h3>
                    <p className="text-sm text-alphabag-subtext">Connecting this integration requires a secure signature from your verified Web3 wallet.</p>
                </div>
            )}

            <div className="mt-8">
              <Button type="submit" className="w-full" disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Authorize Connection'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
