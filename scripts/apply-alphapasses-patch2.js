import fs from 'fs';
import path from 'path';

const frontendRoot = 'C:/Users/1/repos/Alphabag_V3_FRONTEND';
const alphaPassesPath = path.join(frontendRoot, 'src/pages/frontend/AlphaPasses.tsx');

console.log('=== APPLYING ALPHA PASSES PRODUCTION PATCH 2 ===\n');

let fileContent = fs.readFileSync(alphaPassesPath, 'utf8');

// 1. Imports
fileContent = fileContent.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect, useMemo } from 'react';"
);

fileContent = fileContent.replace(
    "import { useAccount, useBalance, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';",
    "import { useAccount, useBalance, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, useContractRead, useContractReads } from 'wagmi';"
);

// 2. ALPHA_PASS_ABI - add balanceOf & tokenOfOwnerByIndex
const abiTarget = `  {
    name: 'walletMintCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },`;

const abiReplacement = `  {
    name: 'walletMintCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },`;

if (!fileContent.includes("name: 'tokenOfOwnerByIndex'")) {
    fileContent = fileContent.replace(abiTarget, abiReplacement);
}

// 3. User NFTs state -> Live On-Chain Multicall Reads
const userNftsTarget = `  const [needsApproval, setNeedsApproval] = useState<boolean>(true);
  const [userNFTs] = useState<AlphaPassNFT[]>([]);`;

const userNftsReplacement = `  const [needsApproval, setNeedsApproval] = useState<boolean>(true);

  // ── OWNED PASSES (live on-chain, replaces the old permanently-empty array) ─
  const { data: nftBalanceData } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address && NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    watch: true,
  });
  const nftBalance = Number(nftBalanceData || 0);

  const tokenIndexReads = useMemo(() => {
    if (!address || nftBalance <= 0) return [];
    return Array.from({ length: nftBalance }, (_, i) => ({
      address: NFT_CONTRACT_ADDRESS,
      abi: ALPHA_PASS_ABI,
      functionName: 'tokenOfOwnerByIndex' as const,
      args: [address, BigInt(i)] as const,
    }));
  }, [address, nftBalance]);

  const { data: ownedTokenIdsData } = useContractReads({
    contracts: tokenIndexReads,
    enabled: tokenIndexReads.length > 0,
    watch: true,
  });

  const userNFTs: AlphaPassNFT[] = useMemo(() => {
    if (!ownedTokenIdsData) return [];
    return ownedTokenIdsData
      .filter((r) => r.status === 'success' && r.result !== undefined)
      .map((r) => {
        const tokenId = Number(r.result as bigint);
        return {
          tokenId,
          name: \`AlphaBAG Genesis Pass #\${tokenId}\`,
          tier: 'Genesis Pass',
          rarity: 'Genesis',
          image: '',
          multiplier: '1.5x',
          perks: ['1.5x ITEMS Boost', 'Lifetime VIP Access', 'Alpha Mission Multiplier'],
        };
      });
  }, [ownedTokenIdsData]);`;

if (fileContent.includes("const [userNFTs] = useState<AlphaPassNFT[]>([]);")) {
    fileContent = fileContent.replace(userNftsTarget, userNftsReplacement);
}

// 4. Quantity bounds & incremental helpers
const qtyTarget = `  const incrementQuantity = () => { if (quantity < NFT_CONFIG.MAX_MINT_PER_TX) setQuantity(p => p + 1); };
  const decrementQuantity = () => { if (quantity > 1) setQuantity(p => p - 1); };`;

const qtyReplacement = `  // Max the user can actually mint right now: bounded by per-tx cap, remaining
  // per-wallet allowance, and remaining supply — not just the per-tx cap.
  const maxQuantityAllowed = Math.max(
    0,
    Math.min(
      NFT_CONFIG.MAX_MINT_PER_TX,
      NFT_CONFIG.MAX_MINT_PER_WALLET - walletMinted,
      contractMaxSupply - contractTotalSupply
    )
  );

  useEffect(() => {
    if (maxQuantityAllowed > 0 && quantity > maxQuantityAllowed) {
      setQuantity(maxQuantityAllowed);
    }
  }, [maxQuantityAllowed, quantity]);

  const incrementQuantity = () => { if (quantity < maxQuantityAllowed) setQuantity(p => p + 1); };
  const decrementQuantity = () => { if (quantity > 1) setQuantity(p => p - 1); };`;

if (!fileContent.includes("const maxQuantityAllowed =")) {
    fileContent = fileContent.replace(qtyTarget, qtyReplacement);
}

// 5. Approval Write & WaitForTransaction confirmation
const approveTarget = `  // ── APPROVAL WRITE ───────────────────────────────────────────────────────
  const { write: approveBag, isLoading: isApproving } = useContractWrite({
    address: BAG_TOKEN_ADDRESS,
    abi: BAG_TOKEN_ABI,
    functionName: 'approve',
    onSuccess: (data) => {
      console.log('[MINT] Approval tx:', data.hash);
      setNeedsApproval(false);
      setMintPhase('IDLE');
    },
    onError: (err) => {
      console.error('[MINT] Approval failed:', err);
      setMintPhase('IDLE');
      Swal.fire({ title: 'Approval Failed', text: err.message || 'Could not approve $BAG.', icon: 'error', confirmButtonColor: '#fcd535', background: '#0a0a0a', color: '#fff' });
    }
  });`;

const approveReplacement = `  // ── APPROVAL WRITE ───────────────────────────────────────────────────────
  // NOTE: onSuccess here fires when the approval tx is *submitted*, not when
  // it's mined. We only track the hash here and wait for the receipt below
  // before clearing needsApproval — otherwise a user who hits "Mint"
  // immediately after approving can fire mintWithBag against a stale
  // (still-zero) on-chain allowance and get a revert.
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null);

  const { write: approveBag, isLoading: isApproving } = useContractWrite({
    address: BAG_TOKEN_ADDRESS,
    abi: BAG_TOKEN_ABI,
    functionName: 'approve',
    onSuccess: (data) => {
      console.log('[MINT] Approval tx submitted:', data.hash);
      setApproveTxHash(data.hash);
    },
    onError: (err) => {
      console.error('[MINT] Approval failed:', err);
      setMintPhase('IDLE');
      Swal.fire({ title: 'Approval Failed', text: err.message || 'Could not approve $BAG.', icon: 'error', confirmButtonColor: '#fcd535', background: '#0a0a0a', color: '#fff' });
    }
  });

  const { isSuccess: approveConfirmed, isError: approveTxFailed } = useWaitForTransaction({
    hash: approveTxHash as \`0x\${string}\` | undefined,
    enabled: !!approveTxHash && mintPhase === 'APPROVING',
  });

  useEffect(() => {
    if (approveConfirmed && mintPhase === 'APPROVING') {
      refetchAllowance();
      setNeedsApproval(false);
      setMintPhase('IDLE');
      setApproveTxHash(null);
    }
  }, [approveConfirmed, mintPhase]);

  useEffect(() => {
    if (approveTxFailed && mintPhase === 'APPROVING') {
      setMintPhase('IDLE');
      setApproveTxHash(null);
      Swal.fire({ title: 'Approval Failed', text: 'The approval transaction failed on-chain.', icon: 'error', confirmButtonColor: '#fcd535', background: '#0a0a0a', color: '#fff' });
    }
  }, [approveTxFailed, mintPhase]);`;

if (!fileContent.includes("setApproveTxHash(data.hash);")) {
    fileContent = fileContent.replace(approveTarget, approveReplacement);
}

// 6. UI controls: Stepper, presets, and button states
fileContent = fileContent.replace(
    'disabled={quantity >= NFT_CONFIG.MAX_MINT_PER_TX || isApproving || isMintingTx}',
    'disabled={quantity >= maxQuantityAllowed || isApproving || isMintingTx}'
);

fileContent = fileContent.replace(
    "disabled={isApproving || isMintingTx}\n                        className={`flex-1 py-2 rounded-md font-mono text-xs font-semibold border transition-all ${quantity === preset ? 'bg-alphabag-yellow text-alphabag-dark font-bold border-alphabag-yellow' : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'}`}",
    "disabled={isApproving || isMintingTx || preset > maxQuantityAllowed}\n                        className={`flex-1 py-2 rounded-md font-mono text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${quantity === preset ? 'bg-alphabag-yellow text-alphabag-dark font-bold border-alphabag-yellow' : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'}`}"
);

// Buttons section
const buttonSectionTarget = `            <div className="pt-4 border-t border-alphabag-gray space-y-3">
              {!isMintActive ? (
                <button disabled className="w-full bg-alphabag-gray text-alphabag-subtext border border-alphabag-gray py-3.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-60">
                  <Lock size={15} /><span>MINTING OPENS POST $BAG LAUNCH</span>
                </button>
              ) : !isConnected ? (
                <button onClick={() => open()} className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] py-3.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                  <Wallet size={16} /> Connect Wallet to Mint
                </button>
              ) : needsApproval ? (
                <button onClick={handleMintPass} disabled={isApproving} className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] py-3.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isApproving ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                  <span>APPROVE {totalBagCost.toLocaleString()} $BAG</span>
                </button>
              ) : (
                <button onClick={handleMintPass} disabled={isMintingTx || mintPhase === 'MINTING'} className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] py-3.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isMintingTx || mintPhase === 'MINTING' ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                  <span>{mintPhase === 'APPROVING' ? 'APPROVING...' : mintPhase === 'MINTING' ? 'CONFIRMING...' : \`MINT WITH \${totalBagCost.toLocaleString()} $BAG\`}</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>`;

const buttonSectionReplacement = `            <div className="pt-4 border-t border-alphabag-gray space-y-3">
              {!isMintActive ? (
                <button disabled className="w-full bg-alphabag-gray text-alphabag-subtext border border-alphabag-gray py-3.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-60">
                  <Lock size={15} /><span>MINTING OPENS POST $BAG LAUNCH</span>
                </button>
              ) : isConnected && maxQuantityAllowed <= 0 ? (
                <button disabled className="w-full bg-alphabag-gray text-alphabag-subtext border border-alphabag-gray py-3.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-60">
                  <Lock size={15} /><span>{walletMinted >= NFT_CONFIG.MAX_MINT_PER_WALLET ? 'WALLET MINT LIMIT REACHED' : 'SOLD OUT'}</span>
                </button>
              ) : !isConnected ? (
                <button onClick={() => open()} className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] py-3.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                  <Wallet size={16} /> Connect Wallet to Mint
                </button>
              ) : needsApproval ? (
                <button onClick={handleMintPass} disabled={isApproving || mintPhase === 'APPROVING'} className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] py-3.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isApproving || mintPhase === 'APPROVING' ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                  <span>{mintPhase === 'APPROVING' && !isApproving ? 'CONFIRMING APPROVAL...' : \`APPROVE \${totalBagCost.toLocaleString()} $BAG\`}</span>
                </button>
              ) : (
                <button onClick={handleMintPass} disabled={isMintingTx || mintPhase === 'MINTING'} className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] py-3.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isMintingTx || mintPhase === 'MINTING' ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                  <span>{mintPhase === 'APPROVING' ? 'APPROVING...' : mintPhase === 'MINTING' ? 'CONFIRMING...' : \`MINT WITH \${totalBagCost.toLocaleString()} $BAG\`}</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>`;

if (!fileContent.includes("WALLET MINT LIMIT REACHED")) {
    fileContent = fileContent.replace(buttonSectionTarget, buttonSectionReplacement);
}

fs.writeFileSync(alphaPassesPath, fileContent, 'utf8');
console.log('✅ AlphaPasses.tsx patched successfully!');
