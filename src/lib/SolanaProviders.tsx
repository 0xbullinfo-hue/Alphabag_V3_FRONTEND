import React from 'react';

// Solana wallet support is not currently shipped. Keep this compatibility
// boundary dependency-free until a backend-proxied Solana implementation lands.
export const SolanaProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
