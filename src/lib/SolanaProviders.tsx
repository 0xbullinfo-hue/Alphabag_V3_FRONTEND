import React from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles for Solana wallet adapter — kept here (not App.tsx) so
// this CSS also only loads as part of the lazy Solana chunk.
import '@solana/wallet-adapter-react-ui/styles.css';

// Loaded ONLY as a lazy chunk — never imported directly by App.tsx, so
// it's excluded from the initial modulepreload/critical path. Every page
// load was previously fetching and parsing this whole dependency tree
// (~383KB minified / ~117KB gzip) even though no component in the app
// calls useWallet()/useConnection() from these packages — confirmed by
// searching the whole codebase before making this change. If a future
// feature needs this, wrap just that feature's tree in
// <SolanaProviderBoundary>, not the whole app at the root.
const SolanaProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = import.meta.env.VITE_ALCHEMY_API_KEY
    ? `https://solana-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`
    : clusterApiUrl(network);

  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaProviders;
