import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Flame, 
  ExternalLink, 
  Lock, 
  Layers, 
  BarChart3, 
  Crown,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Loader2
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAccount, useNetwork, useSwitchNetwork, useBalance, useContractRead, useContractReads, useContractWrite, useWaitForTransaction } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { parseUnits } from 'viem';
import Swal from 'sweetalert2';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { NFT_CONFIG } from '../../services/config';
import { SEO } from '../../components/common/SEO';
import { buildBreadcrumbs, buildProductSchema } from '../../lib/structuredData';

// Types
type PassTier = 'FREE' | 'PREMIUM' | 'ALPHA_VIP';

interface AlphaPassNFT {
  tokenId: number;
  name: string;
  tier: string;
  rarity: string;
  image: string;
  multiplier: string;
  perks: string[];
  mintedAt?: string;
}

const ALPHA_PASS_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'quantity', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'mintWithBnb',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'quantity', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'walletMintCount',
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
    name: 'MAX_SUPPLY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'mintPriceBnb',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

const NFT_CONTRACT_ADDRESS = 
  (NFT_CONFIG.NFT_CONTRACT_ADDRESS_MAINNET || 
   NFT_CONFIG.NFT_CONTRACT_ADDRESS_TESTNET || 
   '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const AlphaPasses: React.FC = () => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const [quantity, setQuantity] = useState<number>(1);
  const [mintPhase, setMintPhase] = useState<'IDLE' | 'MINTING' | 'SUCCESS'>('IDLE');
  const [activeTab, setActiveTab] = useState<'MINT' | 'COLLECTION' | 'TIERS'>('MINT');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [localHoldings, setLocalHoldings] = useState<AlphaPassNFT[]>([]);


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

  const contractTotalSupply = Number(totalSupplyData || 0);
  const contractMaxSupply = Number(maxSupplyData || NFT_CONFIG.TOTAL_SUPPLY || 4000);
  const walletMinted = Number(walletMintData || 0);

  // ── OWNED PASSES (live on-chain) ──────────────────────────────────────────
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

  // Local storage persistence so holdings are guaranteed visible in any phase
  useEffect(() => {
    if (!address) {
      setLocalHoldings([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`alphabag_passes_${address.toLowerCase()}`);
      if (stored) {
        setLocalHoldings(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [address]);

  const [previewCarouselIndex, setPreviewCarouselIndex] = useState<number>(0);

  useEffect(() => {
    if (previewCarouselIndex >= quantity) {
      setPreviewCarouselIndex(0);
    }
  }, [quantity, previewCarouselIndex]);

  // Merge on-chain with persisted local holdings
  const userNFTs: AlphaPassNFT[] = useMemo(() => {
    const onChainNfts: AlphaPassNFT[] = [];
    if (ownedTokenIdsData) {
      ownedTokenIdsData
        .filter((r) => r.status === 'success' && r.result !== undefined)
        .forEach((r) => {
          const tokenId = Number(r.result as bigint);
          const imageIndex = ((tokenId - 1) % 100) + 1;
          onChainNfts.push({
            tokenId,
            name: `AlphaBAG Genesis Pass #${tokenId}`,
            tier: 'Genesis Pass',
            rarity: 'Genesis',
            image: `/nft-collection/images/${imageIndex}.png`,
            multiplier: '1.5x',
            perks: ['1.5x ITEMS Boost', 'Lifetime VIP Access', 'Alpha Mission Multiplier'],
          });
        });
    }

    if (onChainNfts.length > 0) return onChainNfts;
    return localHoldings;
  }, [ownedTokenIdsData, localHoldings]);

  // ── NATIVE BNB BALANCE (Buying with 0.07 BNB) ─────────────────────────────
  const { data: bnbBalanceData, refetch: refetchBnbBalance } = useBalance({
    address: address,
    chainId: bsc.id,
    watch: true,
  });

  const bnbBalance = Number(bnbBalanceData?.formatted || 0);
  const bnbPricePerUnit = NFT_CONFIG.MINT_PRICE_BNB || 0.07;
  const totalBnbCost = Number((quantity * bnbPricePerUnit).toFixed(4));

  const requiredNftForVip = NFT_CONFIG.REQUIRED_NFT_FOR_VIP || 10;
  const hasVipNfts = userNFTs.length >= requiredNftForVip;
  const hasNftPass = userNFTs.length > 0;

  let currentTier: PassTier = 'FREE';
  if (hasVipNfts) currentTier = 'ALPHA_VIP';
  else if (hasNftPass) currentTier = 'PREMIUM';

  const maxQuantityAllowed = Math.max(
    0,
    Math.min(
      NFT_CONFIG.MAX_MINT_PER_TX,
      NFT_CONFIG.MAX_MINT_PER_WALLET - (walletMinted || userNFTs.length),
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

  // ── MINT WRITE (Using 0.07 BNB payable) ──────────────────────────────────
  const { write: mintPass, isLoading: isMintingTx } = useContractWrite({
    address: NFT_CONTRACT_ADDRESS,
    abi: ALPHA_PASS_ABI,
    functionName: 'mint',
    onSuccess: (data) => {
      setTxHash(data.hash);
      setMintPhase('MINTING');
    },
    onError: (err) => {
      console.error('[MINT] Mint failed:', err);
      setMintPhase('IDLE');
      Swal.fire({ 
        title: 'Mint Failed', 
        text: err.message || 'Transaction failed.', 
        icon: 'error', 
        confirmButtonColor: '#fcd535', 
        background: '#0a0a0a', 
        color: '#fff' 
      });
    }
  });

  // ── WAIT FOR MINT CONFIRMATION ───────────────────────────────────────────
  const { isSuccess: mintConfirmed } = useWaitForTransaction({
    hash: txHash as `0x${string}` | undefined,
    enabled: !!txHash && mintPhase === 'MINTING',
  });

  const saveLocalMintedPasses = (qty: number) => {
    if (!address) return;
    const startIndex = (contractTotalSupply || localHoldings.length) + 1;
    const newPasses: AlphaPassNFT[] = Array.from({ length: qty }, (_, i) => {
      const tokenId = startIndex + i;
      const img = ((tokenId - 1) % 100) + 1;
      return {
        tokenId,
        name: `AlphaBAG Genesis Pass #${tokenId}`,
        tier: 'Genesis Pass',
        rarity: 'Genesis',
        image: `/nft-collection/images/${img}.png`,
        multiplier: '1.5x',
        perks: ['1.5x ITEMS Boost', 'Lifetime VIP Access', 'Alpha Mission Multiplier'],
        mintedAt: new Date().toLocaleDateString(),
      };
    });
    const updated = [...localHoldings, ...newPasses];
    setLocalHoldings(updated);
    try {
      localStorage.setItem(`alphabag_passes_${address.toLowerCase()}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (mintConfirmed && mintPhase === 'MINTING') {
      setMintPhase('SUCCESS');
      refetchBnbBalance();
      saveLocalMintedPasses(quantity);
      Swal.fire({
        title: 'PASS MINTED SUCCESSFULLY!',
        html: DOMPurify.sanitize(
          `<div class="text-left py-2">
            <p class="text-sm text-gray-300 mb-2">Congratulations! You are now an official Alpha Pass Genesis Holder.</p>
            <div class="p-3 bg-alphabag-black rounded-xl border border-alphabag-yellow/30 text-xs text-alphabag-yellow font-mono space-y-1">
              <div><strong>Tx Hash:</strong> ${txHash?.slice(0, 10)}...${txHash?.slice(-8)}</div>
              <div><strong>Quantity:</strong> ${quantity}</div>
              <div><strong>Cost Paid:</strong> ${totalBnbCost} BNB</div>
              <div><strong>Holdings:</strong> Updated to ${userNFTs.length + quantity} Genesis Passes</div>
            </div>
          </div>`, 
          { ADD_ATTR: ['class'] }
        ),
        icon: 'success',
        confirmButtonText: 'VIEW HOLDINGS',
        showCancelButton: true,
        cancelButtonText: 'VIEW BSCSCAN',
        confirmButtonColor: '#fcd535',
        background: '#0a0a0a',
        color: '#fff',
        customClass: { confirmButton: 'text-black font-bold uppercase tracking-wider px-6 py-2.5 rounded-lg text-xs' }
      }).then((result) => {
        if (!result.isConfirmed && txHash) {
          window.open(`https://bscscan.com/tx/${txHash}`, '_blank');
        }
        setMintPhase('IDLE');
      });
    }
  }, [mintConfirmed]);

  const handleMintPass = async () => {
    if (!isConnected || !address) { open(); return; }
    if (chain?.id !== bsc.id && switchNetwork) {
      try { 
        await switchNetwork(bsc.id); 
        return; 
      } catch { 
        Swal.fire({ title: 'Switch Network', text: 'Please switch to Binance Smart Chain (BSC).', icon: 'warning', confirmButtonColor: '#fcd535', background: '#0a0a0a', color: '#fff' }); 
        return; 
      }
    }

    if (bnbBalance < totalBnbCost) {
      Swal.fire({ 
        title: 'Insufficient BNB', 
        text: `You have ${bnbBalance.toFixed(4)} BNB, but ${totalBnbCost} BNB is required to mint ${quantity} pass${quantity > 1 ? 'es' : ''}.`, 
        icon: 'error', 
        confirmButtonText: 'OK', 
        confirmButtonColor: '#fcd535', 
        background: '#0a0a0a', 
        color: '#fff' 
      });
      return;
    }

    if ((walletMinted || userNFTs.length) + quantity > NFT_CONFIG.MAX_MINT_PER_WALLET) {
      Swal.fire({ 
        title: 'Mint Cap Reached', 
        text: `Max ${NFT_CONFIG.MAX_MINT_PER_WALLET} passes per wallet. You currently hold ${userNFTs.length}.`, 
        icon: 'warning', 
        confirmButtonColor: '#fcd535', 
        background: '#0a0a0a', 
        color: '#fff' 
      });
      return;
    }

    // In local dev/test or when contract address is unconfigured: allow simulated minting with 0.07 BNB
    if (NFT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      setMintPhase('MINTING');
      setTimeout(() => {
        const mockTx = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        setTxHash(mockTx);
        saveLocalMintedPasses(quantity);
        setMintPhase('SUCCESS');
        Swal.fire({
          title: 'GENESIS PASSES MINTED!',
          html: DOMPurify.sanitize(
            `<div class="text-left py-2">
              <p class="text-sm text-gray-300 mb-2">You successfully minted ${quantity} Genesis Pass${quantity > 1 ? 'es' : ''} using ${totalBnbCost} BNB.</p>
              <div class="p-3 bg-alphabag-black rounded-xl border border-alphabag-yellow/30 text-xs text-alphabag-yellow font-mono space-y-1">
                <div><strong>Quantity:</strong> ${quantity}</div>
                <div><strong>Price:</strong> ${totalBnbCost} BNB</div>
                <div><strong>Holdings:</strong> ${userNFTs.length + quantity} Genesis Passes Active</div>
                <div><strong>Multiplier:</strong> 1.5x ITEMS Boost Activated</div>
              </div>
            </div>`,
            { ADD_ATTR: ['class'] }
          ),
          icon: 'success',
          confirmButtonColor: '#fcd535',
          confirmButtonText: 'VIEW HOLDINGS',
          background: '#0a0a0a',
          color: '#fff'
        }).then(() => {
          setMintPhase('IDLE');
        });
      }, 1200);
      return;
    }

    try {
      setMintPhase('MINTING');
      mintPass({ 
        args: [BigInt(quantity)],
        value: parseUnits(totalBnbCost.toFixed(4), 18)
      });
    } catch (err: any) {
      setMintPhase('IDLE');
      Swal.fire({ 
        title: 'Mint Failed', 
        text: err?.message || 'Transaction failed.', 
        icon: 'error', 
        confirmButtonColor: '#fcd535', 
        background: '#0a0a0a', 
        color: '#fff' 
      });
    }
  };

  const totalMinted = contractTotalSupply;
  const maxSupply = contractMaxSupply || 4000;
  const mintProgress = maxSupply > 0 ? ((totalMinted / maxSupply) * 100).toFixed(1) : '0.0';

  return (
    <div className="w-full space-y-2 pb-2 animate-in fade-in duration-700">
      <SEO
        title="Alpha Passes | AlphaBAG Genesis Collection"
        description="Mint your AlphaBAG Genesis Pass. 4,000 limited utility NFTs at 0.07 BNB offering tier discounts, VIP multipliers, and AI crypto intelligence tools."
        canonicalUrl="/alpha-passes"
        structuredData={[
          buildBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'Alpha Passes', path: '/alpha-passes' }]),
          buildProductSchema({
            name: 'AlphaBAG Genesis Pass',
            description: '4,000 Limited Utility Passes for On-Chain Intelligence, VIP Fee Discounts, and VIP Multipliers.',
            price: 0.07, 
            currency: 'BNB',
            url: '/alpha-passes',
          }),
        ]}
      />

      {/* Header */}
      <div className="page-header-card flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-md bg-alphabag-yellow flex items-center justify-center text-alphabag-dark">
              <Crown size={20} />
            </div>
            <h1 className="text-3xl font-semibold text-alphabag-text tracking-tight">Alpha Passes</h1>
          </div>
          <p className="text-alphabag-subtext text-sm max-w-2xl mt-2 font-medium leading-relaxed">
            Genesis Collection — 4,000 Limited Utility Passes for On-Chain Intelligence & VIP Multipliers.
          </p>
        </div>

      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Card 1: Access Level */}
        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 flex flex-col h-full relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase text-alphabag-subtext">Access Level</span>
            <Crown size={18} className="text-alphabag-subtext" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            {currentTier === 'FREE' && (
              <span className="bg-alphabag-gray text-alphabag-subtext px-2.5 py-1 rounded-md text-xs font-semibold uppercase">
                Free Tier
              </span>
            )}
            {currentTier === 'PREMIUM' && (
              <span className="bg-alphabag-yellow/10 text-alphabag-yellow border border-alphabag-yellow/20 px-2.5 py-1 rounded-md text-xs font-semibold uppercase flex items-center gap-1.5">
                <Zap size={13} fill="currentColor" /> Premium Holder
              </span>
            )}
            {currentTier === 'ALPHA_VIP' && (
              <span className="bg-alphabag-yellow text-alphabag-dark font-black px-3 py-1 rounded-md text-xs uppercase flex items-center gap-1.5 shadow-sm">
                <Crown size={13} fill="currentColor" /> Alpha VIP Member
              </span>
            )}
          </div>
          <div className="text-[10px] text-alphabag-subtext font-medium mt-1">
            {currentTier === 'ALPHA_VIP' 
              ? '10+ Genesis Passes Active — Full VIP Suite' 
              : currentTier === 'PREMIUM' 
              ? 'Genesis Pass Active — 1.5x Boost & Premium Access' 
              : 'Hold 1+ Genesis Pass to unlock VIP privileges'}
          </div>
          <div className="mt-auto pt-4">
            <button 
              onClick={() => setActiveTab('TIERS')} 
              className="text-xs font-semibold text-alphabag-yellow hover:underline flex items-center gap-1"
            >
              Compare All Tiers <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Card 2: User Holdings Status (Visible in any phase) */}
        <div className="rounded-2xl border border-alphabag-yellow/30 bg-alphabag-darkgray p-4 flex flex-col h-full relative shadow-[0_0_15px_rgba(252,213,53,0.05)]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase text-alphabag-yellow flex items-center gap-1">
              <ShieldCheck size={14} /> Your NFT Holdings
            </span>
            <span className="text-[10px] bg-alphabag-yellow/20 text-alphabag-yellow px-2 py-0.5 rounded font-mono font-bold">
              {userNFTs.length} OWNED
            </span>
          </div>
          <div className="text-2xl font-bold text-alphabag-text tracking-tight flex items-baseline gap-2">
            <span>{userNFTs.length}</span>
            <span className="text-xs font-normal text-alphabag-subtext">/ {NFT_CONFIG.MAX_MINT_PER_WALLET} Max Allowed</span>
          </div>
          <div className="text-[10px] text-alphabag-subtext font-medium mt-1">
            {userNFTs.length > 0 
              ? `Active Multiplier: ${(1 + (userNFTs.length * 0.5)).toFixed(1)}x ITEMS Earn Rate`
              : 'Mint 1 Pass for 0.07 BNB to start earning multipliers'}
          </div>
          <div className="mt-auto pt-4 flex items-center justify-between">
            <button 
              onClick={() => setActiveTab('COLLECTION')}
              className="text-xs font-semibold text-alphabag-yellow hover:underline flex items-center gap-1"
            >
              View My Passes ({userNFTs.length}) <ArrowRight size={13} />
            </button>
            {userNFTs.length > 0 && (
              <span className="text-[10px] text-alphabag-green font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Active
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Total Collection Supply */}
        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-4 flex flex-col h-full relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase text-alphabag-subtext">Total Supply & Mint Status</span>
            <Flame size={18} className="text-alphabag-yellow" />
          </div>
          <div className="text-2xl font-bold text-alphabag-text tracking-tight flex items-baseline gap-2">
            <span>{totalMinted.toLocaleString()}</span>
            <span className="text-xs font-normal text-alphabag-subtext">/ 4,000 Minted</span>
          </div>
          <div className="w-full bg-alphabag-black h-2 rounded-full overflow-hidden border border-alphabag-gray my-2">
            <div 
              className="bg-alphabag-yellow h-full transition-all duration-500 rounded-full" 
              style={{ width: `${Math.max(Number(mintProgress), 2)}%` }} 
            />
          </div>
          <div className="mt-auto flex justify-between items-center text-[10px] font-mono text-alphabag-subtext">
            <span>Progress: {mintProgress}%</span>
            <span className="text-alphabag-yellow font-semibold">{4000 - totalMinted} Remaining</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-alphabag-gray mb-2">
        <button 
          onClick={() => setActiveTab('MINT')} 
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === 'MINT' ? 'border-alphabag-yellow text-alphabag-yellow' : 'border-transparent text-alphabag-subtext hover:text-alphabag-text'}`}
        >
          <Zap size={14} /> Mint Pass (0.07 BNB)
        </button>
        <button 
          onClick={() => setActiveTab('COLLECTION')} 
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === 'COLLECTION' ? 'border-alphabag-yellow text-alphabag-yellow' : 'border-transparent text-alphabag-subtext hover:text-alphabag-text'}`}
        >
          <Layers size={14} /> My Collection ({userNFTs.length})
        </button>
        <button 
          onClick={() => setActiveTab('TIERS')} 
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === 'TIERS' ? 'border-alphabag-yellow text-alphabag-yellow' : 'border-transparent text-alphabag-subtext hover:text-alphabag-text'}`}
        >
          <BarChart3 size={14} /> Utility & Tiers
        </button>
      </div>

      {/* TAB 1: MINT PASS & HOLDINGS DASHBOARD */}
      {activeTab === 'MINT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Column: HOLDINGS DISPLAY & MINT PREVIEW (Visible in any phase) */}
          <div className="lg:col-span-6 space-y-3">
            {/* Allocation & Bundle Preview */}
            <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold uppercase text-alphabag-subtext">Mint Allocation Preview</span>
                <span className="text-[10px] font-mono text-alphabag-yellow bg-alphabag-yellow/10 px-2 py-0.5 rounded border border-alphabag-yellow/20">
                  {quantity}x Pass{quantity > 1 ? 'es' : ''} Selected
                </span>
              </div>

              <div className="rounded-xl bg-alphabag-black border border-alphabag-gray p-4 text-center flex flex-col items-center justify-center relative">
                <div className="relative flex items-center justify-center w-full my-1">
                  {quantity > 1 && (
                    <button
                      type="button"
                      onClick={() => setPreviewCarouselIndex((prev) => (prev > 0 ? prev - 1 : quantity - 1))}
                      className="absolute left-0 z-20 w-8 h-8 rounded-full bg-alphabag-darkgray/90 border border-alphabag-gray hover:border-alphabag-yellow text-alphabag-text hover:text-alphabag-yellow flex items-center justify-center transition-all shadow-md active:scale-95"
                      title="Previous Pass in Bundle"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}

                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-alphabag-yellow/40 shadow-[0_0_20px_rgba(252,213,53,0.15)]">
                    <img
                      src={`/nft-collection/images/${((previewCarouselIndex) % 100) + 1}.png`}
                      alt={`Genesis Pass Allocation #${previewCarouselIndex + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.currentTarget.src = '/nft-collection/images/1.png';
                      }}
                    />
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-alphabag-black/90 border border-alphabag-yellow/40 text-[8px] font-black text-alphabag-yellow font-mono">
                      {quantity}x BUNDLE
                    </div>
                    <div className="absolute bottom-1 inset-x-0 flex justify-center">
                      <span className="bg-black/80 px-2 py-0.5 rounded text-[8px] font-mono text-alphabag-yellow border border-alphabag-yellow/20">
                        Pass #{contractTotalSupply + previewCarouselIndex + 1}
                      </span>
                    </div>
                  </div>

                  {quantity > 1 && (
                    <button
                      type="button"
                      onClick={() => setPreviewCarouselIndex((prev) => (prev < quantity - 1 ? prev + 1 : 0))}
                      className="absolute right-0 z-20 w-8 h-8 rounded-full bg-alphabag-darkgray/90 border border-alphabag-gray hover:border-alphabag-yellow text-alphabag-text hover:text-alphabag-yellow flex items-center justify-center transition-all shadow-md active:scale-95"
                      title="Next Pass in Bundle"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>

                <h4 className="text-sm font-bold text-alphabag-text uppercase mt-2">
                  AlphaBAG Genesis Pass
                </h4>
                <p className="text-[10px] text-alphabag-subtext font-mono mt-0.5">
                  Unit Price: 0.07 BNB • Total: {totalBnbCost} BNB
                </p>

                {quantity > 1 && (
                  <div className="w-full mt-3 pt-2 border-t border-alphabag-gray/50">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar justify-center px-1">
                      {Array.from({ length: quantity }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewCarouselIndex(i)}
                          className={`relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                            previewCarouselIndex === i
                              ? 'border-alphabag-yellow scale-105 shadow-[0_0_10px_rgba(252,213,53,0.3)]'
                              : 'border-alphabag-gray/60 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={`/nft-collection/images/${(i % 100) + 1}.png`}
                            alt={`Pass Allocation #${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] font-mono text-center font-bold text-alphabag-yellow">
                            #{i + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: MINT TRANSACTION CONSOLE (0.07 BNB) */}
          <div className="lg:col-span-6 rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-alphabag-gray">
                <div>
                  <span className="text-xs font-semibold uppercase text-alphabag-subtext">Minting Console</span>
                  <h2 className="text-xl font-semibold text-alphabag-text mt-0.5">Genesis Mint Stage</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-alphabag-subtext uppercase">Total Collection</span>
                  <div className="text-xs font-mono font-bold text-alphabag-yellow">4,000 TOTAL</div>
                </div>
              </div>

              {/* Holdings reminder in the mint console */}
              <div className="mt-4 p-3 rounded-xl bg-alphabag-black/60 border border-alphabag-gray/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-alphabag-yellow" />
                  <span className="text-xs text-alphabag-text font-medium">Your Current Holdings:</span>
                </div>
                <span className="text-xs font-mono font-bold text-alphabag-yellow bg-alphabag-yellow/10 px-2 py-0.5 rounded border border-alphabag-yellow/20">
                  {userNFTs.length} Genesis Pass{userNFTs.length === 1 ? '' : 'es'}
                </span>
              </div>

              {/* Price Display */}
              <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-4 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-alphabag-subtext font-semibold uppercase">Unit Mint Price</span>
                  <div className="text-2xl font-semibold text-alphabag-yellow tabular-nums mt-0.5">
                    0.07 BNB <span className="text-xs text-alphabag-subtext font-normal">/ Pass</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-alphabag-gray px-3 py-1 rounded-md text-[10px] font-semibold text-alphabag-subtext uppercase inline-flex items-center gap-1">
                    <Info size={12} />
                    <span>BSC Network</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase text-alphabag-subtext">
                    Select Quantity (Max {NFT_CONFIG.MAX_MINT_PER_TX} / tx)
                  </span>
                  <span className="text-xs text-alphabag-subtext font-mono">
                    Wallet: <strong className="text-alphabag-text">{bnbBalance.toFixed(4)} BNB</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-alphabag-black border border-alphabag-gray rounded-md p-1">
                    <button 
                      type="button" 
                      onClick={decrementQuantity} 
                      disabled={quantity <= 1 || isMintingTx} 
                      className="w-9 h-9 rounded bg-alphabag-gray hover:bg-alphabag-gray/80 text-alphabag-text font-bold flex items-center justify-center transition-all disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold text-lg text-alphabag-text tabular-nums">{quantity}</span>
                    <button 
                      type="button" 
                      onClick={incrementQuantity} 
                      disabled={quantity >= maxQuantityAllowed || isMintingTx} 
                      className="w-9 h-9 rounded bg-alphabag-gray hover:bg-alphabag-gray/80 text-alphabag-text font-bold flex items-center justify-center transition-all disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    {[1, 2, 5, 10].map((preset) => (
                      <button 
                        key={preset} 
                        type="button" 
                        onClick={() => setQuantity(preset)} 
                        disabled={isMintingTx || preset > maxQuantityAllowed}
                        className={`flex-1 py-2 rounded-md font-mono text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          quantity === preset 
                            ? 'bg-alphabag-yellow text-alphabag-dark font-bold border-alphabag-yellow' 
                            : 'bg-alphabag-black border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text'
                        }`}
                      >
                        {preset}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Cost */}
              <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-3.5 mt-4 flex items-center justify-between">
                <span className="text-xs text-alphabag-subtext font-semibold uppercase">Total Cost</span>
                <div className="text-right">
                  <span className="text-xl font-semibold text-alphabag-yellow tabular-nums">{totalBnbCost} BNB</span>
                </div>
              </div>
            </div>

            {/* Mint Action Button */}
            <div className="pt-4 border-t border-alphabag-gray space-y-3 mt-4">
              {!isConnected ? (
                <button 
                  onClick={() => open()} 
                  className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] py-3.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Wallet size={16} /> Connect Wallet to Mint
                </button>
              ) : maxQuantityAllowed <= 0 ? (
                <button 
                  disabled 
                  className="w-full bg-alphabag-gray text-alphabag-subtext border border-alphabag-gray py-3.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                >
                  <Lock size={15} />
                  <span>{userNFTs.length >= NFT_CONFIG.MAX_MINT_PER_WALLET ? 'WALLET MINT LIMIT REACHED (10 MAX)' : 'SOLD OUT (4,000 TOTAL REACHED)'}</span>
                </button>
              ) : (
                <button 
                  onClick={handleMintPass} 
                  disabled={isMintingTx || mintPhase === 'MINTING'} 
                  className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] py-3.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isMintingTx || mintPhase === 'MINTING' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>CONFIRMING TRANSACTION ON BSC...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} fill="currentColor" />
                      <span>MINT {quantity} PASS ({totalBnbCost} BNB)</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              )}
              <div className="text-[10px] text-center text-alphabag-subtext font-mono">
                Direct native BNB transaction • Instant on-chain utility and VIP boost
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY COLLECTION */}
      {activeTab === 'COLLECTION' && (
        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-alphabag-gray">
            <div>
              <span className="text-xs font-semibold uppercase text-alphabag-subtext">Inventory</span>
              <h2 className="text-2xl font-semibold text-alphabag-text mt-0.5">My Alpha Passes ({userNFTs.length})</h2>
            </div>
            <a 
              href={NFT_CONFIG.ELEMENT_MARKET_COLLECTION_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-alphabag-gray hover:bg-alphabag-gray/80 text-alphabag-text px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all w-fit"
            >
              <ExternalLink size={14} className="text-alphabag-yellow" /> View on Element Market
            </a>
          </div>

          {userNFTs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {userNFTs.map((nft) => (
                <div key={nft.tokenId} className="bg-alphabag-black border border-alphabag-gray rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-alphabag-yellow/10 text-alphabag-yellow px-2 py-0.5 rounded text-[10px] font-semibold border border-alphabag-yellow/20">
                      {nft.tier}
                    </span>
                    <span className="bg-alphabag-green/10 text-alphabag-green px-2 py-0.5 rounded text-[10px] font-semibold border border-alphabag-green/20">
                      {nft.multiplier} Boost
                    </span>
                  </div>
                  <div className="text-center py-3">
                    <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden border border-alphabag-yellow/30 mb-2 shadow-sm">
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
                    <span className="text-[10px] text-alphabag-subtext font-mono">Token ID #{nft.tokenId} • {nft.mintedAt || 'Genesis'}</span>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-alphabag-gray text-[10px] text-alphabag-subtext">
                    {nft.perks.slice(0, 2).map((perk, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-alphabag-green shrink-0" />
                        <span className="text-alphabag-text">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-alphabag-black border border-alphabag-gray flex items-center justify-center text-alphabag-subtext mx-auto">
                <Crown size={32} />
              </div>
              <h3 className="text-lg font-semibold text-alphabag-text">No Alpha Passes In This Wallet</h3>
              <p className="text-xs text-alphabag-subtext max-w-sm mx-auto">
                You haven't minted any Genesis Passes yet. Mint using 0.07 BNB to activate VIP multipliers.
              </p>
              <button 
                onClick={() => setActiveTab('MINT')} 
                className="bg-alphabag-yellow text-alphabag-dark px-5 py-2 rounded-md text-xs font-semibold uppercase tracking-wider hover:bg-[#e0bd2e] transition-all inline-flex items-center gap-1.5"
              >
                <Zap size={14} fill="currentColor" /> Mint For 0.07 BNB
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TIERS & UTILITY */}
      {activeTab === 'TIERS' && (
        <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase text-alphabag-subtext">Collection Utility</span>
            <h2 className="text-2xl font-semibold text-alphabag-text mt-0.5">AlphaBAG Tier Architecture</h2>
            <p className="text-xs text-alphabag-subtext mt-1">4,000 Genesis Passes unlock permanent access multipliers and VIP platform features.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free */}
            <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase text-alphabag-subtext">Entry</span>
                <h3 className="text-xl font-bold text-alphabag-text mt-1">FREE TIER</h3>
                <div className="text-2xl font-bold text-alphabag-text mt-2 font-mono">0 $BAG</div>
                <div className="mt-4 space-y-2 text-xs text-alphabag-subtext">
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> Standard Dashboard Access</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> Alpha Screener & Global Markets</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> Alpha Calculator & Mission Control</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> Alpha Passes, News & Connections</div>
                </div>
              </div>
            </div>

            {/* Premium */}
            <div className="bg-alphabag-black border border-alphabag-yellow/40 rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-[0_0_15px_rgba(252,213,53,0.06)]">
              <div>
                <span className="text-xs font-semibold uppercase text-alphabag-yellow">Pro Analytics</span>
                <h3 className="text-xl font-bold text-alphabag-text mt-1">PREMIUM TIER</h3>
                <div className="text-2xl font-bold text-alphabag-yellow mt-2 font-mono">2,000 $BAG + 1 NFT</div>
                <div className="mt-4 space-y-2 text-xs text-alphabag-text">
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> All features of Free Tier</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> Real-time BSC Whale Radar</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> <strong>1.25x Multiplier</strong> on ITEMS</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> Alpha Feeds & DeFi Tracker</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> 5hr AlphaAI Queries</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('MINT')} 
                className="w-full bg-alphabag-yellow text-alphabag-dark py-2.5 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#e0bd2e] transition-all"
              >
                Mint Now (0.07 BNB)
              </button>
            </div>

            {/* Alpha VIP */}
            <div className="bg-alphabag-black border-2 border-alphabag-yellow rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-xs font-semibold uppercase text-alphabag-yellow flex items-center gap-1"><Crown size={12} fill="currentColor" /> Apex Level</span>
                <h3 className="text-xl font-bold text-alphabag-text mt-1">ALPHA VIP</h3>
                <div className="text-2xl font-bold text-alphabag-yellow mt-2 font-mono">2,000 $BAG + 10 NFT</div>
                <div className="mt-4 space-y-2 text-xs text-alphabag-text">
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> All features of Free Tier</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> <strong>100% Platform Unlocks</strong></div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> <strong>Alpha Mission & 1.5x MAXIMUM Multiplier</strong></div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> VIP Telegram Bot Real-time Alerts</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> Private Founder, AlphaCall, Alpha Analysts & Alpha Feeds</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> DeFi Tracker, Security Radar & All Dashboard Features</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlphaPasses;
