import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, bsc, polygon, arbitrum, base, avalanche } from 'wagmi/chains';

// 1. Get projectId
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '3f195635b2ccd41732da253147f4e445';

// 2. Create wagmiConfig
const metadata = {
  name: 'AlphaBAG Pro',
  description: 'Professional Crypto Intelligence Hub',
  url: 'https://alphabag.pro',
  icons: ['https://ui-avatars.com/api/?name=BAG&background=FCD535&color=0B0E11&size=512']
};

const chains = [mainnet, bsc, polygon, arbitrum, base, avalanche];
const isValidProjectId = projectId && projectId !== 'YOUR_PROJECT_ID_HERE' && projectId !== '3f195635b2ccd41732da253147f4e445';
const projectIdToUse = isValidProjectId ? projectId : '3f195635b2ccd41732da253147f4e445'; // Keep fallback to prevent crash, but disable WC

export const config = defaultWagmiConfig({
  chains,
  projectId: projectIdToUse,
  metadata,
  enableWalletConnect: isValidProjectId, // Only enable if we have a real ID
  enableInjected: true,
  enableEIP6963: true
});

// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#FCD535',
    '--w3m-border-radius-master': '1px'
  }
});

export { chains, projectId };