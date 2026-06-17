import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, bsc, polygon, arbitrum, base, avalanche } from 'wagmi/chains';

// 1. Get projectId & Alchemy ID
// Web3Modal requires a valid 32-character hex string for projectId.
// We provide a fallback dummy hex string to prevent fatal constructor errors if undefined.
const fallbackProjectId = '3fcc6bba31d50731f8f7c9e05e5d3b1e';
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || fallbackProjectId;
const alchemyId = import.meta.env.VITE_ALCHEMY_API_KEY || '';
const isLocalhost = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const shouldEnableWalletConnect = !isLocalhost && Boolean(projectId && projectId !== fallbackProjectId);

// 2. Create wagmiConfig
const metadata = {
  name: 'AlphaBAG Pro',
  description: 'Professional Crypto Intelligence Hub & Portfolio Tracker',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://alphabag.pro',
  icons: ['https://s2.coinmarketcap.com/static/img/coins/64x64/1.png']
};

// Optimized Alchemy-powered chain configs
const alchemyChains = [
  { ...mainnet, rpcUrls: { ...mainnet.rpcUrls, default: { http: [`https://eth-mainnet.g.alchemy.com/v2/${alchemyId}`] } } },
  { ...bsc, rpcUrls: { ...bsc.rpcUrls, default: { http: [`https://bnb-mainnet.g.alchemy.com/v2/${alchemyId}`] } } },
  { ...polygon, rpcUrls: { ...polygon.rpcUrls, default: { http: [`https://polygon-mainnet.g.alchemy.com/v2/${alchemyId}`] } } },
  { ...arbitrum, rpcUrls: { ...arbitrum.rpcUrls, default: { http: [`https://arb-mainnet.g.alchemy.com/v2/${alchemyId}`] } } },
  { ...base, rpcUrls: { ...base.rpcUrls, default: { http: [`https://base-mainnet.g.alchemy.com/v2/${alchemyId}`] } } },
  { ...avalanche, rpcUrls: { ...avalanche.rpcUrls, default: { http: [`https://avalanche-mainnet.g.alchemy.com/v2/${alchemyId}`] } } }
];

const chains = alchemyChains;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: shouldEnableWalletConnect,
  enableInjected: true,
  enableEIP6963: true, // Enable EIP-6963 for better multi-wallet support
  enableCoinbase: !isLocalhost 
});

// 3. Create modal once so all useWeb3Modal hooks can initialize safely.
try {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    chains,
    enableAnalytics: false,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#FCD535',
      '--w3m-border-radius-master': '1px'
    }
  });
} catch (error) {
  console.warn('[Web3Modal] Initialization skipped:', error);
}

export { chains, projectId, shouldEnableWalletConnect };