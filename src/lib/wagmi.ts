import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, bsc, polygon, arbitrum, base, avalanche } from 'wagmi/chains';

const rawProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
// Provide fallback project ID for dev/testing when environment variable is unset
const projectId = (rawProjectId && rawProjectId.trim() !== '') ? rawProjectId : '3fcc6bba6f1de962d911bb5b5c3dba68';
const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const shouldEnableWalletConnect = Boolean(projectId);

const metadata = {
  name: 'AlphaBAG Pro',
  description: 'Professional Crypto Intelligence Hub & Portfolio Tracker',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://alphabag.pro',
  icons: ['https://s2.coinmarketcap.com/static/img/coins/64x64/1.png'],
};

// Proxy ALL RPC calls through backend — Alchemy key never hits the client
const apiBase = import.meta.env.VITE_API_BASE_URL || '';
const rpcUrls = {
  mainnet: `${apiBase}/api/rpc/mainnet`,
  bsc: `${apiBase}/api/rpc/bsc`,
  polygon: `${apiBase}/api/rpc/polygon`,
  arbitrum: `${apiBase}/api/rpc/arbitrum`,
  base: `${apiBase}/api/rpc/base`,
  avalanche: `${apiBase}/api/rpc/avalanche`,
};

const chains = [
  { ...mainnet, rpcUrls: { ...mainnet.rpcUrls, default: { http: [rpcUrls.mainnet] } } },
  { ...bsc, rpcUrls: { ...bsc.rpcUrls, default: { http: [rpcUrls.bsc] } } },
  { ...polygon, rpcUrls: { ...polygon.rpcUrls, default: { http: [rpcUrls.polygon] } } },
  { ...arbitrum, rpcUrls: { ...arbitrum.rpcUrls, default: { http: [rpcUrls.arbitrum] } } },
  { ...base, rpcUrls: { ...base.rpcUrls, default: { http: [rpcUrls.base] } } },
  { ...avalanche, rpcUrls: { ...avalanche.rpcUrls, default: { http: [rpcUrls.avalanche] } } },
];

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: shouldEnableWalletConnect,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: !isLocalhost,
});

try {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    chains,
    enableAnalytics: false,
    themeMode: 'dark',
    themeVariables: { '--w3m-accent': '#FCD535', '--w3m-border-radius-master': '1px' },
  });
} catch (error) {
  console.warn('[Web3Modal] Initialization skipped:', error);
}

export { chains, projectId, shouldEnableWalletConnect };
