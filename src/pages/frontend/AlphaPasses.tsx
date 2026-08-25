// SPDX-License-Identifier: MIT
// PATCH: AlphaPasses.tsx — Production-ready mint integration
// Fixes:
//   1. Replaced simulated setTimeout mint with real on-chain writeContract
//   2. Added proper ERC-721 contract ABI and wagmi write hooks
//   3. Added transaction receipt polling for confirmation
//   4. Removed fake random token ID generation
//   5. Added proper error handling with user-friendly messages
//   6. Added BAG token approval flow before mint

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Crown, 
  Zap, 
  ExternalLink, 
  Check, 
  Lock, 
  Coins, 
  Layers, 
  ArrowRight, 
  Clock, 
  Info,
  CheckCircle2,
  Award,
  Wallet,
  Loader2
} from 'lucide-react';
import { useAccount, useBalance, useNetwork, useSwitchNetwork, useContractWrite, useWaitForTransaction, useContractRead, useContractReads } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAuth } from '../../context/AuthContext';
import { NFT_CONFIG, TOKEN_GATING_CONFIG } from '../../services/config';
import { AlphaPassNFT, PassTier } from '../../types';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import { parseUnits } from 'viem';

// ── CONTRACT ABIs ────────────────────────────────────────────────────────────

const BAG_TOKEN_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

const ALPHA_PASS_ABI = [
  {
    name: 'mintWithBag',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'quantity', type: 'uint256' }],
    outputs: []
  },
  {
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
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'mintActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'mintPriceBag',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'MAX_SUPPLY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

const BAG_TOKEN_ADDRESS = 
  (TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_MAINNET || 
   TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_TESTNET || 
   '0x0000000000000000000000000000000000000000') as `0x${string}`;

const NFT_CONTRACT_ADDRESS = 
  (NFT_CONFIG.NFT_CONTRACT_ADDRESS_MAINNET || 
   NFT_CONFIG.NFT_CONTRACT_ADDRESS_TESTNET || 
   '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const AlphaPasses: React.FC = () => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { user } = useAuth();

  const [quantity, setQuantity] = useState<number>(1);
  const [mintPhase, setMintPhase] = useState<'IDLE' | 'APPROVING' | 'MINTING' | 'SUCCESS'>('IDLE');
  const [activeTab, setActiveTab] = useState<'MINT' | 'COLLECTION' | 'TIERS'>('MINT');
  const [txHash, setTxHash] = useState<string | null>(null);
  // ── LIVE ON-CHAIN CONTRACT READS ─────────────────────────────────────────
  const { data: mintActiveData } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'mintActive',
    enabled: NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    watch: true,
  });

  const { data: totalSupplyData } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'totalSupply',
    enabled: NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    watch: true,
  });

  const { data: maxSupplyData } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'MAX_SUPPLY',
    enabled: NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  const { data: walletMintData } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'walletMintCount',
    args: address ? [address] : undefined,
    enabled: !!address && NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
    watch: true,
  });

  const { data: allowanceData, refetch: refetchAllowance } = useContractRead({
    address: BAG_TOKEN_ADDRESS,
    abi: BAG_TOKEN_ABI,
    functionName: 'allowance',
    args: address && NFT_CONTRACT_ADDRESS ? [address, NFT_CONTRACT_ADDRESS] : undefined,
    enabled: !!address && NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' && BAG_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000',
    watch: true,
  });

  const contractMintActive = Boolean(mintActiveData);
  const contractTotalSupply = Number(totalSupplyData || 0);
  const contractMaxSupply = Number(maxSupplyData || NFT_CONFIG.TOTAL_SUPPLY || 10000);
  const walletMinted = Number(walletMintData || 0);
  const [needsApproval, setNeedsApproval] = useState<boolean>(true);

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

  const [selectedOwnedIndex, setSelectedOwnedIndex] = useState<number>(0);

  const userNFTs: AlphaPassNFT[] = useMemo(() => {
    if (!ownedTokenIdsData) return [];
    return ownedTokenIdsData
      .filter((r) => r.status === 'success' && r.result !== undefined)
      .map((r) => {
        const tokenId = Number(r.result as bigint);
        const imageIndex = ((tokenId - 1) % 100) + 1;
        return {
          tokenId,
          name: `AlphaBAG Genesis Pass #${tokenId}`,
          tier: 'Genesis Pass',
          rarity: 'Genesis',
          image: `/nft-collection/images/${imageIndex}.png`,
          multiplier: '1.5x',
          perks: ['1.5x ITEMS Boost', 'Lifetime VIP Access', 'Alpha Mission Multiplier'],
        };
      });
  }, [ownedTokenIdsData]);

  const { data: bagBalanceData, refetch: refetchBalance } = useBalance({
    address: address,
    token: BAG_TOKEN_ADDRESS,
    chainId: bsc.id,
    watch: true,
  });

  const bagBalance = Number(bagBalanceData?.formatted || user?.bagTokens || 0);
  const bagPricePerUnit = NFT_CONFIG.MINT_PRICE_BAG || 100;
  const totalBagCost = quantity * bagPricePerUnit;

  useEffect(() => {
    if (!isConnected || !address || BAG_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
      setNeedsApproval(true);
      return;
    }
    if (allowanceData !== undefined) {
      const requiredWei = parseUnits(String(totalBagCost), 18);
      setNeedsApproval(allowanceData < requiredWei);
    } else {
      setNeedsApproval(true);
    }
  }, [isConnected, address, totalBagCost, allowanceData]);

  const requiredNftForVip = NFT_CONFIG.REQUIRED_NFT_FOR_VIP || 10;
  const hasVipNfts = userNFTs.length >= requiredNftForVip;
  const requiredBagForPremium = NFT_CONFIG.REQUIRED_BAG_FOR_PREMIUM || 10000;
  const hasPremiumBag = bagBalance >= requiredBagForPremium;

  let currentTier: PassTier = 'FREE';
  if (hasPremiumBag && hasVipNfts) currentTier = 'ALPHA_VIP';
  else if (hasPremiumBag || userNFTs.length > 0) currentTier = 'PREMIUM';

  // Max the user can actually mint right now: bounded by per-tx cap, remaining
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
  const decrementQuantity = () => { if (quantity > 1) setQuantity(p => p - 1); };

  // ── APPROVAL WRITE ───────────────────────────────────────────────────────
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
    hash: approveTxHash as `0x${string}` | undefined,
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
  }, [approveTxFailed, mintPhase]);

  // ── MINT WRITE ───────────────────────────────────────────────────────────
  const { write: mintPass, isLoading: isMintingTx } = useContractWrite({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'mintWithBag',
    onSuccess: (data) => {
      setTxHash(data.hash);
      setMintPhase('MINTING');
    },
    onError: (err) => {
      console.error('[MINT] Mint failed:', err);
      setMintPhase('IDLE');
      Swal.fire({ title: 'Mint Failed', text: err.message || 'Transaction failed.', icon: 'error', confirmButtonColor: '#fcd535', background: '#0a0a0a', color: '#fff' });
    }
  });

  // ── WAIT FOR MINT CONFIRMATION ───────────────────────────────────────────
  const { isSuccess: mintConfirmed } = useWaitForTransaction({
    hash: txHash as `0x${string}` | undefined,
    enabled: !!txHash && mintPhase === 'MINTING',
  });

  useEffect(() => {
    if (mintConfirmed && mintPhase === 'MINTING') {
      setMintPhase('SUCCESS');
      refetchBalance();
      Swal.fire({
        title: 'PASS MINTED SUCCESSFULLY!',
        html: DOMPurify.sanitize(`<div class="text-left py-2"><p class="text-sm text-gray-300 mb-2">Congratulations! You are now an official Alpha Pass Genesis Holder.</p><div class="p-3 bg-alphabag-black rounded-xl border border-alphabag-yellow/30 text-xs text-alphabag-yellow font-mono"><div><strong>Tx Hash:</strong> ${txHash?.slice(0, 10)}...${txHash?.slice(-8)}</div><div><strong>Quantity:</strong> ${quantity}</div><div><strong>Treasury Fee:</strong> ${totalBagCost} $BAG</div></div></div>`, { ADD_ATTR: ['class'] }),
        icon: 'success',
        confirmButtonText: 'VIEW ON BSCSCAN',
        showCancelButton: true,
        cancelButtonText: 'CLOSE',
        confirmButtonColor: '#fcd535',
        background: '#0a0a0a',
        color: '#fff',
        customClass: { confirmButton: 'text-black font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg text-xs' }
      }).then((result) => {
        if (result.isConfirmed) window.open(`https://bscscan.com/tx/${txHash}`, '_blank');
        setActiveTab('COLLECTION');
      });
    }
  }, [mintConfirmed]);

  const handleMintPass = async () => {
    if (!isConnected || !address) { open(); return; }
    if (chain?.id !== bsc.id && switchNetwork) {
      try { await switchNetwork(bsc.id); return; }
      catch { Swal.fire({ title: 'Switch Network', text: 'Please switch to BSC.', icon: 'warning', confirmButtonColor: '#fcd535', background: '#0a0a0a', color: '#fff' }); return; }
    }
    if (NFT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      Swal.fire({ title: 'Contract Not Deployed', text: 'Alpha Pass contract is not configured.', icon: 'warning', confirmButtonColor: '#fcd535', background: '#0a0a0a', color: '#fff' });
      return;
    }
    if (bagBalance < totalBagCost) {
      Swal.fire({ title: 'Insufficient $BAG', text: `You have ${bagBalance.toLocaleString()} $BAG, need ${totalBagCost.toLocaleString()}.`, icon: 'error', confirmButtonText: 'BUY $BAG', showCancelButton: true, cancelButtonText: 'CANCEL', confirmButtonColor: '#fcd535', background: '#0a0a0a', color: '#fff' }).then(r => { if (r.isConfirmed) window.open(NFT_CONFIG.PANCAKESWAP_BUY_URL, '_blank'); });
      return;
    }
    if (walletMinted + quantity > NFT_CONFIG.MAX_MINT_PER_WALLET) {
      Swal.fire({ title: 'Mint Cap Reached', text: `Already minted ${walletMinted}/${NFT_CONFIG.MAX_MINT_PER_WALLET}.`, icon: 'warning', confirmButtonColor: '#fcd535', background: '#0a0a0a', color: '#fff' });
      return;
    }

    try {
      if (needsApproval) {
        setMintPhase('APPROVING');
        approveBag({ args: [NFT_CONTRACT_ADDRESS, parseUnits(String(totalBagCost), 18)] });
        return;
      }
      setMintPhase('MINTING');
      mintPass({ args: [BigInt(quantity)] });
    } catch (err: any) {
      setMintPhase('IDLE');
      Swal.fire({ title: 'Mint Failed', text: err?.message || 'Transaction failed.', icon: 'error', confirmButtonColor: '#fcd535', background: '#0a0a0a', color: '#fff' });
    }
  };

  const totalMinted = contractTotalSupply;
  const maxSupply = contractMaxSupply;
  const mintProgress = maxSupply > 0 ? ((totalMinted / maxSupply) * 100).toFixed(1) : '0.0';
  const isMintActive = contractMintActive;

  return (
    <div className="w-full space-y-2 pb-2 animate-in fade-in duration-700">
      <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-dark"><Crown size={20} /></div>
            <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">Alpha Passes</h1>
          </div>
          <p className="text-alphabag-subtext text-sm max-w-2xl mt-2 font-medium leading-relaxed">Genesis Collection — 10,000 Limited Utility Passes for On-Chain Intelligence & VIP Multipliers.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2 border ${isMintActive ? 'bg-alphabag-green/10 text-alphabag-green border-alphabag-green/30' : 'bg-alphabag-gray text-alphabag-subtext border-alphabag-gray'}`}>
            <div className={`w-2 h-2 rounded-full ${isMintActive ? 'bg-alphabag-green animate-pulse' : 'bg-alphabag-subtext'}`} />
            {isMintActive ? 'Mint Live' : 'Pre-Launch'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 flex flex-col h-full relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase text-alphabag-subtext">Access Level</span>
            <Crown size={18} className="text-alphabag-subtext" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            {currentTier === 'FREE' && <span className="bg-alphabag-gray text-alphabag-subtext px-2.5 py-1 rounded-md text-xs font-semibold uppercase">Free Tier</span>}
            {currentTier === 'PREMIUM' && <span className="bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/20 px-2.5 py-1 rounded-md text-xs font-semibold uppercase flex items-center gap-1.5"><Zap size={13} fill="currentColor" /> Premium Holder</span>}
            {currentTier === 'ALPHA_VIP' && <span className="bg-alphabag-yellow text-alphabag-dark font-black px-3 py-1 rounded-md text-xs uppercase flex items-center gap-1.5 shadow-sm"><Crown size={13} fill="currentColor" /> Alpha VIP Member</span>}
          </div>
          <div className="text-[10px] text-alphabag-subtext font-medium mt-1">
            {currentTier === 'ALPHA_VIP' ? '10,000 $BAG + 10 NFT Passes Active' : currentTier === 'PREMIUM' ? 'Hold 10,000 $BAG or 1 NFT Pass' : 'Standard Public Access'}
          </div>
          <div className="mt-auto pt-6">
            <div className="bg-alphabag-yellow/10 px-4 rounded-md border border-alphabag-yellow/20 flex justify-between items-center h-10">
              <div className="text-[10px] font-semibold uppercase text-alphabag-yellow">ITEMS Boost</div>
              <div className="text-sm font-semibold text-alphabag-yellow tabular-nums">{currentTier === 'ALPHA_VIP' ? '1.5x Active' : currentTier === 'PREMIUM' ? '1.25x Active' : '1.0x Base'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 flex flex-col h-full relative">
          <div className="flex justify-between items-center mb-2 pb-4 border-b border-alphabag-gray">
            <span className="text-xs font-semibold uppercase text-alphabag-subtext">Mint Supply</span>
            <span className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase ${isMintActive ? 'bg-alphabag-green/10 text-alphabag-green border border-alphabag-green/20' : 'bg-alphabag-gray text-alphabag-yellow border border-alphabag-gray'}`}>{isMintActive ? 'Live' : 'Pre-Launch'}</span>
          </div>
          <div className="mb-2">
            <div className="text-[10px] text-alphabag-subtext font-semibold uppercase mb-1">Total Minted</div>
            <div className="text-3xl font-semibold text-alphabag-text tabular-nums">{totalMinted.toLocaleString()} <span className="text-base text-alphabag-subtext font-normal">/ {maxSupply.toLocaleString()}</span></div>
          </div>
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-alphabag-subtext">PROGRESS</span>
              <span className="text-[10px] text-alphabag-yellow font-semibold tabular-nums">{mintProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-alphabag-black rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 bg-alphabag-yellow" style={{ width: `${mintProgress}%` }} />
            </div>
            <div className="text-[10px] text-alphabag-subtext font-medium">{(maxSupply - totalMinted).toLocaleString()} Passes Remaining</div>
          </div>
          <div className="mt-auto pt-6">
            <div className="bg-alphabag-gray px-4 rounded-md border border-alphabag-gray flex justify-between items-center h-10">
              <div className="text-[10px] font-semibold uppercase text-alphabag-subtext">Unit Price</div>
              <div className="text-sm font-semibold text-alphabag-yellow tabular-nums">{bagPricePerUnit} $BAG</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 flex flex-col h-full relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase text-alphabag-subtext">My Passes</span>
            <Layers size={18} className="text-alphabag-subtext" />
          </div>
          <div className="mb-2">
            <div className="text-[10px] text-alphabag-subtext font-semibold uppercase mb-1">Connected Inventory</div>
            <div className="text-3xl font-semibold text-alphabag-text tabular-nums">{userNFTs.length} <span className="text-base text-alphabag-subtext font-normal">Passes</span></div>
          </div>
          <div className="flex gap-2 mb-2 pb-2 border-b border-alphabag-gray">
            <div className="flex-1">
              <div className="text-[10px] text-alphabag-subtext font-semibold uppercase mb-1">$BAG Balance</div>
              <div className="text-lg font-semibold text-alphabag-text tabular-nums">{bagBalance.toLocaleString()}</div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-alphabag-subtext font-semibold uppercase mb-1">Pass Standard</div>
              <div className="text-lg font-semibold text-alphabag-yellow tabular-nums">ERC-721</div>
            </div>
          </div>
          <div className="mt-auto pt-6">
            <div className="flex gap-2 h-10">
              <button onClick={() => setActiveTab('COLLECTION')} className="w-full bg-alphabag-gray text-alphabag-text hover:bg-alphabag-gray/80 px-4 rounded-md text-xs font-semibold uppercase tracking-wider transition-all h-full">View Inventory</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button onClick={() => setActiveTab('MINT')} className={`px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'MINT' ? 'bg-alphabag-yellow text-alphabag-dark font-black shadow-sm' : 'bg-alphabag-darkgray text-alphabag-subtext hover:text-alphabag-text border border-alphabag-gray'}`}><Coins size={14} /> Mint Alpha Pass</button>
        <button onClick={() => setActiveTab('COLLECTION')} className={`px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'COLLECTION' ? 'bg-alphabag-yellow text-alphabag-dark font-black shadow-sm' : 'bg-alphabag-darkgray text-alphabag-subtext hover:text-alphabag-text border border-alphabag-gray'}`}><Layers size={14} /> My Collection ({userNFTs.length})</button>
        <button onClick={() => setActiveTab('TIERS')} className={`px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'TIERS' ? 'bg-alphabag-yellow text-alphabag-dark font-black shadow-sm' : 'bg-alphabag-darkgray text-alphabag-subtext hover:text-alphabag-text border border-alphabag-gray'}`}><Award size={14} /> Tier Perks Matrix</button>
      </div>

      {activeTab === 'MINT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-stretch">
          <div className="lg:col-span-5 rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 flex flex-col justify-between relative">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-dark font-black"><Crown size={16} /></div>
                <div>
                  <div className="text-xs font-bold text-alphabag-text uppercase font-mono">AlphaBAG Genesis</div>
                  <div className="text-[10px] text-alphabag-yellow font-semibold uppercase">Official Utility Pass</div>
                </div>
              </div>
              {userNFTs.length > 0 ? (
                <span className="bg-alphabag-green/20 text-alphabag-green border border-alphabag-green/40 px-2.5 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                  <ShieldCheck size={12} /> {userNFTs.length} OWNED
                </span>
              ) : (
                <span className="bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/30 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
                  {quantity}x MINT PREVIEW
                </span>
              )}
            </div>

            {userNFTs.length > 0 ? (
              /* ── USER MINTED NFT DISPLAY ── */
              <div className="my-3 rounded-xl bg-alphabag-black border border-alphabag-yellow/40 p-5 text-center flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_0_25px_rgba(252,213,53,0.1)]">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-alphabag-yellow/50 mb-3 shadow-[0_0_20px_rgba(252,213,53,0.2)] group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={userNFTs[selectedOwnedIndex]?.image || `/nft-collection/images/${((userNFTs[0]?.tokenId || 1) % 100) || 1}.png`}
                    alt={userNFTs[selectedOwnedIndex]?.name || 'Genesis Pass'}
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.currentTarget.src = '/nft-collection/images/1.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-1">
                    <span className="text-[9px] font-black font-mono text-alphabag-yellow">
                      #{userNFTs[selectedOwnedIndex]?.tokenId?.toString().padStart(4, '0') || '0001'}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-alphabag-text uppercase tracking-tight">
                  {userNFTs[selectedOwnedIndex]?.name || `AlphaBAG Genesis Pass #${userNFTs[0]?.tokenId}`}
                </h3>
                <p className="text-[11px] text-alphabag-subtext font-mono mt-0.5">
                  Verified On-Chain Asset • VIP Status Active
                </p>

                {/* Multiple owned passes selector pills */}
                {userNFTs.length > 1 && (
                  <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto max-w-full py-1">
                    {userNFTs.map((nft, idx) => (
                      <button
                        key={nft.tokenId}
                        type="button"
                        onClick={() => setSelectedOwnedIndex(idx)}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                          selectedOwnedIndex === idx
                            ? 'bg-alphabag-yellow text-alphabag-dark font-black shadow-sm'
                            : 'bg-alphabag-darkgray text-alphabag-subtext hover:text-white border border-alphabag-gray'
                        }`}
                      >
                        #{nft.tokenId}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <span className="bg-alphabag-yellow/10 text-alphabag-yellow px-2.5 py-0.5 rounded text-[10px] font-semibold border border-alphabag-yellow/20">
                    1.5x ITEMS Boost
                  </span>
                  <span className="bg-alphabag-green/10 text-alphabag-green px-2.5 py-0.5 rounded text-[10px] font-semibold border border-alphabag-green/20">
                    Lifetime VIP
                  </span>
                </div>
              </div>
            ) : (
              /* ── QUANTITY-DEPENDENT MINT PREVIEW ── */
              <div className="my-3 rounded-xl bg-alphabag-black border border-alphabag-gray p-5 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-alphabag-yellow/30 mb-3 shadow-[0_0_20px_rgba(252,213,53,0.15)] group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={`/nft-collection/images/${quantity}.png`}
                    alt={`Genesis Pass ${quantity}x Preview`}
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.currentTarget.src = '/nft-collection/images/1.png';
                    }}
                  />
                  <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-alphabag-black/90 border border-alphabag-yellow/40 text-[9px] font-black text-alphabag-yellow font-mono">
                    {quantity}x BUNDLE
                  </div>
                </div>

                <h3 className="text-lg font-bold text-alphabag-text uppercase tracking-tight">
                  VIP GENESIS PASS
                </h3>
                <p className="text-[11px] text-alphabag-subtext font-mono mt-0.5">
                  Allocating: {quantity} Pass{quantity > 1 ? 'es' : ''} (#{contractTotalSupply + 1} - #{contractTotalSupply + quantity})
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <span className="bg-alphabag-yellow/10 text-alphabag-yellow px-2.5 py-0.5 rounded text-[10px] font-semibold border border-alphabag-yellow/20">
                    {quantity > 1 ? `${quantity}x Multiplier Power` : '1.5x ITEMS Boost'}
                  </span>
                  <span className="bg-alphabag-green/10 text-alphabag-green px-2.5 py-0.5 rounded text-[10px] font-semibold border border-alphabag-green/20">
                    Lifetime VIP
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="bg-alphabag-black border border-alphabag-gray rounded-lg p-2">
                <div className="text-[9px] font-semibold text-alphabag-subtext uppercase">
                  {userNFTs.length > 0 ? 'Your Holdings' : 'Quantity'}
                </div>
                <div className="text-xs font-semibold text-alphabag-text mt-0.5">
                  {userNFTs.length > 0 ? `${userNFTs.length} Pass(es)` : `${quantity}x`}
                </div>
              </div>
              <div className="bg-alphabag-black border border-alphabag-gray rounded-lg p-2">
                <div className="text-[9px] font-semibold text-alphabag-subtext uppercase">Chain</div>
                <div className="text-xs font-semibold text-alphabag-yellow mt-0.5">BSC</div>
              </div>
              <div className="bg-alphabag-black border border-alphabag-gray rounded-lg p-2">
                <div className="text-[9px] font-semibold text-alphabag-subtext uppercase">Standard</div>
                <div className="text-xs font-semibold text-alphabag-text mt-0.5">ERC-721</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 flex flex-col justify-between relative space-y-4">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-alphabag-gray">
                <div>
                  <span className="text-xs font-semibold uppercase text-alphabag-subtext">Mint Module</span>
                  <h2 className="text-2xl font-semibold text-alphabag-text mt-0.5">Acquire Alpha Pass</h2>
                </div>
                <div className="bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/20 px-3 py-1 rounded-md text-[11px] font-semibold uppercase flex items-center gap-1.5"><Clock size={13} /><span>Instant Delivery</span></div>
              </div>
              <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-4 mt-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-alphabag-subtext font-semibold uppercase">Mint Price</div>
                  <div className="text-2xl font-semibold text-alphabag-yellow tabular-nums mt-0.5">{bagPricePerUnit} $BAG <span className="text-xs text-alphabag-subtext font-normal">/ Pass</span></div>
                </div>
                <div className="text-right">
                  <div className="bg-alphabag-gray px-3 py-1 rounded-md text-[10px] font-semibold text-alphabag-subtext uppercase inline-flex items-center gap-1"><Info size={12} /><span>Proceeds to T2E Treasury</span></div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase text-alphabag-subtext">Select Quantity (Max {NFT_CONFIG.MAX_MINT_PER_TX} / tx)</span>
                  <span className="text-xs text-alphabag-subtext font-mono">Wallet: <strong className="text-alphabag-text">{bagBalance.toLocaleString()} $BAG</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-alphabag-black border border-alphabag-gray rounded-md p-1">
                    <button type="button" onClick={decrementQuantity} disabled={quantity <= 1 || isApproving || isMintingTx} className="w-9 h-9 rounded bg-alphabag-gray hover:bg-alphabag-gray/80 text-alphabag-text font-bold flex items-center justify-center transition-all disabled:opacity-40">-</button>
                    <span className="w-12 text-center font-semibold text-lg text-alphabag-text tabular-nums">{quantity}</span>
                    <button type="button" onClick={incrementQuantity} disabled={quantity >= maxQuantityAllowed || isApproving || isMintingTx} className="w-9 h-9 rounded bg-alphabag-gray hover:bg-alphabag-gray/80 text-alphabag-text font-bold flex items-center justify-center transition-all disabled:opacity-40">+</button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    {[1, 2, 5, 10].map((preset) => (
                      <button key={preset} type="button" onClick={() => setQuantity(preset)} disabled={isApproving || isMintingTx || preset > maxQuantityAllowed}
                        className={`flex-1 py-2 rounded-md font-mono text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${quantity === preset ? 'bg-alphabag-yellow text-alphabag-dark font-bold border-alphabag-yellow' : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'}`}>
                        {preset}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-3.5 mt-4 flex items-center justify-between">
                <span className="text-xs text-alphabag-subtext font-semibold uppercase">Total Cost</span>
                <div className="text-right"><span className="text-xl font-semibold text-alphabag-yellow tabular-nums">{totalBagCost.toLocaleString()} $BAG</span></div>
              </div>
            </div>
            <div className="pt-4 border-t border-alphabag-gray space-y-3">
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
                  <span>{mintPhase === 'APPROVING' && !isApproving ? 'CONFIRMING APPROVAL...' : `APPROVE ${totalBagCost.toLocaleString()} $BAG`}</span>
                </button>
              ) : (
                <button onClick={handleMintPass} disabled={isMintingTx || mintPhase === 'MINTING'} className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] py-3.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isMintingTx || mintPhase === 'MINTING' ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                  <span>{mintPhase === 'APPROVING' ? 'APPROVING...' : mintPhase === 'MINTING' ? 'CONFIRMING...' : `MINT WITH ${totalBagCost.toLocaleString()} $BAG`}</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'COLLECTION' && (
        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-alphabag-gray">
            <div>
              <span className="text-xs font-semibold uppercase text-alphabag-subtext">Inventory</span>
              <h2 className="text-2xl font-semibold text-alphabag-text mt-0.5">My Alpha Passes</h2>
            </div>
            <a href={NFT_CONFIG.ELEMENT_MARKET_COLLECTION_URL} target="_blank" rel="noopener noreferrer" className="bg-alphabag-gray hover:bg-alphabag-gray/80 text-alphabag-text px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all w-fit"><ExternalLink size={14} className="text-alphabag-yellow" /> View on Element Market</a>
          </div>
          {userNFTs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {userNFTs.map((nft) => (
                <div key={nft.tokenId} className="bg-alphabag-black border border-alphabag-gray rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-alphabag-yellow/10 text-alphabag-yellow px-2 py-0.5 rounded text-[10px] font-semibold border border-alphabag-yellow/20">{nft.tier}</span>
                    <span className="bg-alphabag-green/10 text-alphabag-green px-2 py-0.5 rounded text-[10px] font-semibold border border-alphabag-green/20">{nft.multiplier} Boost</span>
                  </div>
                  <div className="text-center py-3">
                    <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden border border-alphabag-yellow/30 mb-2 shadow-sm">
                      <img
                        src={nft.image || `/nft-collection/images/${((nft.tokenId || 1) % 100) || 1}.png`}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.currentTarget.src = '/nft-collection/images/1.png';
                        }}
                      />
                    </div>
                    <h4 className="text-base font-semibold text-alphabag-text">{nft.name}</h4>
                    <span className="text-[10px] text-alphabag-subtext font-mono">Minted: {nft.mintedAt || 'Genesis'}</span>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-alphabag-gray text-[10px] text-alphabag-subtext">
                    {nft.perks.slice(0, 2).map((perk, i) => (
                      <div key={i} className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-alphabag-green shrink-0" /><span className="text-alphabag-text">{perk}</span></div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <a href={`${NFT_CONFIG.ELEMENT_MARKET_COLLECTION_URL}/${nft.tokenId}`} target="_blank" rel="noopener noreferrer" className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all block text-center"><span>LIST ON ELEMENT MARKET</span><ExternalLink size={12} /></a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-alphabag-gray flex items-center justify-center text-alphabag-subtext mx-auto mb-3"><Layers size={24} /></div>
              <h3 className="text-base font-semibold text-alphabag-text">No Passes in Connected Wallet</h3>
              <p className="text-xs text-alphabag-subtext mt-1 max-w-sm mx-auto">Mint your first Alpha Pass with {bagPricePerUnit} $BAG to unlock 1.5x ITEMS boost and full platform access.</p>
              <button onClick={() => setActiveTab('MINT')} className="mt-4 bg-alphabag-yellow text-alphabag-dark px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider">Go to Mint</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'TIERS' && (
        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 space-y-4">
          <div className="pb-4 border-b border-alphabag-gray">
            <span className="text-xs font-semibold uppercase text-alphabag-subtext">Access Matrix</span>
            <h2 className="text-2xl font-semibold text-alphabag-text mt-0.5">Tier Comparison</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
            <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase font-semibold text-alphabag-subtext">Base Public</div>
                <h3 className="text-lg font-semibold text-alphabag-text mt-0.5">FREE TIER</h3>
                <div className="text-xl font-semibold text-alphabag-subtext mt-2">0 $BAG</div>
                <div className="h-px bg-alphabag-gray my-4" />
                <div className="space-y-2.5 text-xs text-alphabag-subtext">
                  <div className="flex items-center gap-2 text-alphabag-text"><Check size={14} className="text-alphabag-subtext shrink-0" /><span><strong>Standard Dashboard Access</strong></span></div>
                  <div className="flex items-center gap-2 text-alphabag-text"><Check size={14} className="text-alphabag-subtext shrink-0" /><span><strong>1.0x Base</strong> ITEMS Earning</span></div>
                  <div className="flex items-center gap-2 text-alphabag-text"><Check size={14} className="text-alphabag-subtext shrink-0" /><span>Alpha Screener & Global Markets</span></div>
                  <div className="flex items-center gap-2 text-alphabag-text"><Check size={14} className="text-alphabag-subtext shrink-0" /><span>Alpha Calculator & Mission Control</span></div>
                  <div className="flex items-center gap-2 text-alphabag-text"><Check size={14} className="text-alphabag-subtext shrink-0" /><span>Alpha Passes, News & Connections</span></div>
                </div>
              </div>
              <div className="pt-6"><span className="block text-center text-[10px] font-semibold text-alphabag-subtext uppercase">Default Access</span></div>
            </div>
            <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-5 flex flex-col justify-between relative">
              <div className="absolute top-4 right-4"><span className="bg-alphabag-yellow/10 text-alphabag-yellow px-2 py-0.5 rounded text-[9px] font-semibold uppercase border border-alphabag-yellow/20">Token Holder</span></div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-alphabag-yellow">Pro Analytics</div>
                <h3 className="text-lg font-semibold text-alphabag-text mt-0.5">PREMIUM TIER</h3>
                <div className="text-xl font-semibold text-alphabag-yellow mt-2">10,000 $BAG</div>
                <div className="h-px bg-alphabag-gray my-4" />
                <div className="space-y-2.5 text-xs text-alphabag-text">
                  <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-yellow shrink-0" /><span><strong>All features of Free Tier</strong></span></div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-yellow shrink-0" /><span>Real-time BSC Whale Radar</span></div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-yellow shrink-0" /><span><strong>1.25x Multiplier</strong> on ITEMS</span></div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-yellow shrink-0" /><span>Alpha Feeds & DeFi Tracker</span></div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-alphabag-yellow shrink-0" /><span>5hr AlphaAI Queries</span></div>
                </div>
              </div>
              <div className="pt-6"><button disabled className="w-full bg-alphabag-gray text-alphabag-subtext py-2 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed">Hold 10k $BAG</button></div>
            </div>
            <div className="bg-alphabag-black border-2 border-alphabag-yellow rounded-xl p-5 flex flex-col justify-between relative shadow-sm">
              <div className="absolute top-4 right-4"><span className="bg-alphabag-yellow text-alphabag-dark px-2 py-0.5 rounded text-[9px] font-black uppercase">All Unlocked</span></div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-alphabag-yellow flex items-center gap-1"><Crown size={12} fill="currentColor" /> Apex Level</div>
                <h3 className="text-lg font-semibold text-alphabag-text mt-0.5">ALPHA VIP</h3>
                <div className="text-xl font-semibold text-alphabag-yellow mt-2">10,000 $BAG + 10 NFT</div>
                <div className="h-px bg-alphabag-gray my-4" />
                <div className="space-y-2.5 text-xs text-alphabag-text font-medium">
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /><span><strong>All features of Free Tier</strong></span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /><span><strong>100% Platform Unlocks</strong></span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /><span><strong>Alpha Mission & 1.5x MAXIMUM Multiplier</strong></span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /><span>VIP Telegram Bot Real-time Alerts</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /><span>Private Founder, AlphaCall, Alpha Analysts & Alpha Feeds</span></div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /><span>DeFi Tracker, Security Radar & All Dashboard Features</span></div>
                </div>
              </div>
              <div className="pt-6"><button disabled className="w-full bg-alphabag-gray text-alphabag-subtext py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"><Lock size={14} /><span>Mint Genesis Pass</span></button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
