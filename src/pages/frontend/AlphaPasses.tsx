import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Loader2,
  Search,
  Sparkles,
  X,
  SlidersHorizontal,
  Copy,
  Check
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

// ── TRAIT & RARITY DEFINITIONS (4,000 COLLECTION) ────────────────────────────
export type RarityTierName = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface TraitDefinition {
  name: RarityTierName;
  allocation: string;
  percentage: number;
  count: number;
  multiplier: string;
  color: string;
  badgeBg: string;
  borderGlow: string;
  image: string;
  material: string;
  description: string;
  perks: string[];
}

export const NFT_TRAITS: Record<RarityTierName, TraitDefinition> = {
  Common: {
    name: 'Common',
    allocation: '50%',
    percentage: 50,
    count: 2000,
    multiplier: '1.25x',
    color: '#F97316',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    borderGlow: 'border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.15)]',
    image: '/nft-collection/tiers/common.png',
    material: 'Vibrant Athletic Cordura',
    description: 'Vibrant Athletic Cordura duffle bag with navy tactical straps and standard ITEMS boost.',
    perks: ['1.25x ITEMS Boost', 'Alpha Signals Channel', 'Standard Platform Access']
  },
  Rare: {
    name: 'Rare',
    allocation: '25%',
    percentage: 25,
    count: 1000,
    multiplier: '1.5x',
    color: '#06B6D4',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    borderGlow: 'border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
    image: '/nft-collection/tiers/rare.png',
    material: 'Electric Cyan Hydro-Fabric',
    description: 'Electric Cyan Hydro-Fabric duffle bag with cyber blue accents and whale radar signals.',
    perks: ['1.5x ITEMS Boost', 'Whale Radar Access', 'Priority Feeds & Discord Role']
  },
  Epic: {
    name: 'Epic',
    allocation: '15%',
    percentage: 15,
    count: 600,
    multiplier: '2.0x',
    color: '#A855F7',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    borderGlow: 'border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    image: '/nft-collection/tiers/epic.png',
    material: 'Cyber Violet Carbon-Weave',
    description: 'Cyber Violet Carbon-Weave duffle bag with luminous neon piping and unlimited AlphaAI queries.',
    perks: ['2.0x ITEMS Boost', 'Full Pro Analytics Suite', 'AlphaAI Unlimited Queries']
  },
  Legendary: {
    name: 'Legendary',
    allocation: '8%',
    percentage: 8,
    count: 320,
    multiplier: '3.0x',
    color: '#FCD535',
    badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    borderGlow: 'border-yellow-500/50 shadow-[0_0_30px_rgba(252,213,53,0.3)]',
    image: '/nft-collection/tiers/legendary.png',
    material: '24K Solid Gold & Obsidian Satin',
    description: '24K Solid Gold and Obsidian luxury duffle bag with private founder calls and VIP bot alerts.',
    perks: ['3.0x ITEMS Boost', 'Private Founder Calls', 'Telegram VIP Bot Alerts']
  },
  Mythic: {
    name: 'Mythic',
    allocation: '2%',
    percentage: 2,
    count: 80,
    multiplier: '5.0x',
    color: '#EC4899',
    badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    borderGlow: 'border-pink-500/60 shadow-[0_0_35px_rgba(236,72,153,0.35)]',
    image: '/nft-collection/tiers/mythic.png',
    material: 'Prismatic Crystal & Iridescent Diamond',
    description: 'Prismatic Crystal & Iridescent Diamond apex duffle bag granting maximum 5.0x multipliers.',
    perks: ['5.0x ITEMS Boost', '100% Platform Unlocks', 'Apex Lifetime VIP Membership']
  }
};

export function getPassTrait(tokenId: number): TraitDefinition {
  const hash = Math.abs(Math.sin(tokenId * 777 + 42) * 10000) % 100;
  if (hash < 2) return NFT_TRAITS.Mythic;
  if (hash < 10) return NFT_TRAITS.Legendary;
  if (hash < 25) return NFT_TRAITS.Epic;
  if (hash < 50) return NFT_TRAITS.Rare;
  return NFT_TRAITS.Common;
}

// Types
type PassTier = 'FREE' | 'PREMIUM' | 'ALPHA_VIP';

interface AlphaPassNFT {
  tokenId: number;
  name: string;
  tier: string;
  rarity: RarityTierName;
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
  const [selectedInspectPass, setSelectedInspectPass] = useState<AlphaPassNFT | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Collection Filter & Search
  const [collectionFilter, setCollectionFilter] = useState<string>('ALL');
  const [searchTokenId, setSearchTokenId] = useState<string>('');

  // 3D Tilt interactive physics
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  const handleCardMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.35s ease-out'
    });
  };

  // Contract Reads
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

  // Live holdings
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

  // Merge on-chain with persisted local holdings with traits
  const userNFTs: AlphaPassNFT[] = useMemo(() => {
    const onChainNfts: AlphaPassNFT[] = [];
    if (ownedTokenIdsData) {
      ownedTokenIdsData
        .filter((r) => r.status === 'success' && r.result !== undefined)
        .forEach((r) => {
          const tokenId = Number(r.result as bigint);
          const trait = getPassTrait(tokenId);
          onChainNfts.push({
            tokenId,
            name: `AlphaBAG Genesis Pass #${tokenId}`,
            tier: trait.name,
            rarity: trait.name,
            image: trait.image,
            multiplier: trait.multiplier,
            perks: trait.perks,
          });
        });
    }

    if (onChainNfts.length > 0) return onChainNfts;
    return localHoldings;
  }, [ownedTokenIdsData, localHoldings]);

  // BNB Balance
  const { data: bnbBalanceData, refetch: refetchBnbBalance } = useBalance({
    address: address,
    chainId: bsc.id,
    watch: true,
  });

  const bnbBalance = Number(bnbBalanceData?.formatted || 0);
  const bnbPricePerUnit = NFT_CONFIG.MINT_PRICE_BNB || 0.07;
  const totalBnbCost = Number((quantity * bnbPricePerUnit).toFixed(4));
  const bnbUsdPrice = 590; // Estimated BNB price in USD
  const totalUsdCost = (totalBnbCost * bnbUsdPrice).toFixed(2);

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

  // Mint Write
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

  const { isSuccess: mintConfirmed } = useWaitForTransaction({
    hash: txHash as `0x${string}` | undefined,
    enabled: !!txHash && mintPhase === 'MINTING',
  });

  const saveLocalMintedPasses = (qty: number) => {
    if (!address) return;
    const startIndex = (contractTotalSupply || localHoldings.length) + 1;
    const newPasses: AlphaPassNFT[] = Array.from({ length: qty }, (_, i) => {
      const tokenId = startIndex + i;
      const trait = getPassTrait(tokenId);
      return {
        tokenId,
        name: `AlphaBAG Genesis Pass #${tokenId}`,
        tier: trait.name,
        rarity: trait.name,
        image: trait.image,
        multiplier: trait.multiplier,
        perks: trait.perks,
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
              <div><strong>Quantity:</strong> ${quantity} Pass(es)</div>
              <div><strong>Cost Paid:</strong> ${totalBnbCost} BNB (~$${totalUsdCost})</div>
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

    // Local dev / simulated minting
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
              <p class="text-sm text-gray-300 mb-2">You successfully minted ${quantity} Genesis Pass${quantity > 1 ? 'es' : ''} for ${totalBnbCost} BNB.</p>
              <div class="p-3 bg-alphabag-black rounded-xl border border-alphabag-yellow/30 text-xs text-alphabag-yellow font-mono space-y-1">
                <div><strong>Quantity:</strong> ${quantity}</div>
                <div><strong>Price:</strong> ${totalBnbCost} BNB (~$${totalUsdCost})</div>
                <div><strong>Holdings:</strong> ${userNFTs.length + quantity} Genesis Passes Active</div>
                <div><strong>Boost:</strong> Multipliers Activated on Account</div>
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

  // Current active preview pass
  const activePreviewPassTokenId = contractTotalSupply + previewCarouselIndex + 1;
  const activePreviewTrait = getPassTrait(activePreviewPassTokenId);

  // Filtered Collection
  const filteredNFTs = useMemo(() => {
    return userNFTs.filter((nft) => {
      const matchesRarity = collectionFilter === 'ALL' || nft.rarity === collectionFilter;
      const matchesSearch = !searchTokenId || nft.tokenId.toString().includes(searchTokenId.trim());
      return matchesRarity && matchesSearch;
    });
  }, [userNFTs, collectionFilter, searchTokenId]);

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
            Genesis Collection — 4,000 Limited Utility Duffle Passes for On-Chain Intelligence & VIP Multipliers.
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
              ? '10+ Genesis Passes Active — Full VIP Suite & 1.5x Max Multiplier' 
              : currentTier === 'PREMIUM' 
              ? 'Genesis Pass Active — 1.5x Boost & Premium Intelligence' 
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

        {/* Card 2: User Holdings Status */}
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
          <BarChart3 size={14} /> Traits & Utility (4,000)
        </button>
      </div>

      {/* TAB 1: MINT PASS & HOLDINGS DASHBOARD */}
      {activeTab === 'MINT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
          {/* Left Column: HOLDINGS DISPLAY & MINT PREVIEW */}
          <div className="space-y-3 flex flex-col">
            <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-5 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold uppercase text-alphabag-subtext flex items-center gap-1.5">
                  <Sparkles size={14} className="text-alphabag-yellow" />
                  Allocation Preview
                </span>
                <span className="text-[10px] font-mono text-alphabag-yellow bg-alphabag-yellow/10 px-2 py-0.5 rounded border border-alphabag-yellow/20">
                  {quantity}x Pass{quantity > 1 ? 'es' : ''} Selected
                </span>
              </div>

              {/* 3D Interactive Tilt Card */}
              <div className="nft-card-perspective flex-1 flex flex-col items-center justify-center">
                <div 
                  ref={cardRef}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  style={tiltStyle}
                  className="nft-card-inner nft-card-hologram w-full rounded-2xl bg-alphabag-black border border-alphabag-gray/80 p-5 flex flex-col items-center justify-center relative cursor-pointer group"
                  onClick={() => setSelectedInspectPass({
                    tokenId: activePreviewPassTokenId,
                    name: `AlphaBAG Genesis Pass #${activePreviewPassTokenId}`,
                    tier: activePreviewTrait.name,
                    rarity: activePreviewTrait.name,
                    image: activePreviewTrait.image,
                    multiplier: activePreviewTrait.multiplier,
                    perks: activePreviewTrait.perks
                  })}
                  title="Click to Inspect Pass Details"
                >
                  {/* Bundle Navigation */}
                  <div className="relative flex items-center justify-center w-full my-2">
                    {quantity > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewCarouselIndex((prev) => (prev > 0 ? prev - 1 : quantity - 1));
                        }}
                        className="absolute left-1 z-20 w-8 h-8 rounded-full bg-alphabag-darkgray/90 border border-alphabag-gray hover:border-alphabag-yellow text-alphabag-text hover:text-alphabag-yellow flex items-center justify-center transition-all shadow-md active:scale-95"
                        title="Previous Pass in Bundle"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    )}

                    {/* NFT Artwork with Rarity Aura */}
                    <div className={`relative w-48 h-48 rounded-2xl overflow-hidden border ${activePreviewTrait.borderGlow} transition-all duration-300 group-hover:scale-105`}>
                      <img
                        src={activePreviewTrait.image}
                        alt={`AlphaBAG Genesis Pass #${activePreviewPassTokenId}`}
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.currentTarget.src = '/nft-collection/tiers/common.png';
                        }}
                      />
                      <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-black/85 border border-white/10 text-[8px] font-mono font-bold" style={{ color: activePreviewTrait.color }}>
                        {activePreviewTrait.allocation} ALLOC
                      </div>
                      <div className="absolute bottom-1.5 inset-x-0 flex justify-center">
                        <span className="bg-black/85 px-2.5 py-0.5 rounded text-[8px] font-mono font-semibold text-white border border-white/10 shadow-sm">
                          Pass #{activePreviewPassTokenId}
                        </span>
                      </div>
                    </div>

                    {quantity > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewCarouselIndex((prev) => (prev < quantity - 1 ? prev + 1 : 0));
                        }}
                        className="absolute right-1 z-20 w-8 h-8 rounded-full bg-alphabag-darkgray/90 border border-alphabag-gray hover:border-alphabag-yellow text-alphabag-text hover:text-alphabag-yellow flex items-center justify-center transition-all shadow-md active:scale-95"
                        title="Next Pass in Bundle"
                      >
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>

                  {/* Pass Meta */}
                  <div className="text-center mt-2 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${activePreviewTrait.badgeBg}`}>
                        {activePreviewTrait.name} Tier
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 font-mono">
                        {activePreviewTrait.multiplier} Boost
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-alphabag-text uppercase tracking-tight">
                      AlphaBAG Genesis Pass
                    </h4>
                    <p className="text-[11px] text-alphabag-subtext font-mono">
                      Unit: 0.07 BNB (~${(0.07 * bnbUsdPrice).toFixed(2)}) • Total: {totalBnbCost} BNB (~${totalUsdCost})
                    </p>
                  </div>

                  <span className="text-[9px] text-alphabag-subtext/80 mt-2 font-mono group-hover:text-alphabag-yellow transition-colors flex items-center gap-1">
                    <Sparkles size={11} /> Click card to inspect full traits & perks
                  </span>
                </div>
              </div>

              {/* Browse 4,000 Collection Slider */}
              <div className="w-full mt-3 pt-3 border-t border-alphabag-gray/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase text-alphabag-subtext flex items-center gap-1">
                    <SlidersHorizontal size={11} /> Sample Collection Passes
                  </span>
                  <span className="text-[9px] font-mono text-alphabag-subtext">
                    5 Archetypes • 4,000 Supply
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Object.values(NFT_TRAITS).map((trait) => (
                    <button
                      key={trait.name}
                      type="button"
                      onClick={() => setSelectedInspectPass({
                        tokenId: contractTotalSupply + 1,
                        name: `AlphaBAG ${trait.name} Pass`,
                        tier: trait.name,
                        rarity: trait.name,
                        image: trait.image,
                        multiplier: trait.multiplier,
                        perks: trait.perks
                      })}
                      className="group/thumb relative rounded-xl overflow-hidden border border-alphabag-gray hover:border-alphabag-yellow/80 bg-alphabag-black p-1 transition-all hover:scale-105"
                      title={`${trait.name} (${trait.allocation})`}
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-alphabag-darkgray/80 relative">
                        <img
                          src={trait.image}
                          alt={trait.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[7px] font-bold font-mono" style={{ color: trait.color }}>
                          {trait.allocation}
                        </div>
                      </div>
                      <div className="mt-1 text-center">
                        <div className="text-[9px] font-bold truncate" style={{ color: trait.color }}>
                          {trait.name}
                        </div>
                        <div className="text-[8px] font-mono text-alphabag-subtext">
                          {trait.multiplier}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: MINT TRANSACTION CONSOLE (0.07 BNB) */}
          <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-alphabag-gray">
                <div>
                  <span className="text-xs font-semibold uppercase text-alphabag-subtext">Minting Console</span>
                  <h2 className="text-xl font-semibold text-alphabag-text mt-0.5">Genesis Mint Stage</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    LIVE ON BSC
                  </span>
                </div>
              </div>

              {/* Holdings reminder */}
              <div className="mt-4 p-3 rounded-xl bg-alphabag-black/60 border border-alphabag-gray/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-alphabag-yellow" />
                  <span className="text-xs text-alphabag-text font-medium">Your Current Holdings:</span>
                </div>
                <span className="text-xs font-mono font-bold text-alphabag-yellow bg-alphabag-yellow/10 px-2.5 py-0.5 rounded border border-alphabag-yellow/20">
                  {userNFTs.length} Genesis Pass{userNFTs.length === 1 ? '' : 'es'}
                </span>
              </div>

              {/* Price Display with USD estimation */}
              <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-4 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-alphabag-subtext font-semibold uppercase">Unit Mint Price</span>
                  <div className="text-2xl font-semibold text-alphabag-yellow tabular-nums mt-0.5 flex items-baseline gap-2">
                    0.07 BNB
                    <span className="text-xs text-alphabag-subtext font-normal font-mono">
                      (~${(0.07 * bnbUsdPrice).toFixed(2)} USD)
                    </span>
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
                    Balance: <strong className="text-alphabag-text">{bnbBalance.toFixed(4)} BNB</strong>
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

              {/* Total Cost Breakdown */}
              <div className="bg-alphabag-black border border-alphabag-gray rounded-xl p-3.5 mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-alphabag-subtext">
                  <span>Pass Cost ({quantity}x 0.07 BNB)</span>
                  <span className="font-mono text-alphabag-text font-semibold">{totalBnbCost} BNB</span>
                </div>
                <div className="flex items-center justify-between text-xs text-alphabag-subtext">
                  <span>Estimated BSC Gas</span>
                  <span className="font-mono text-green-400 font-semibold">~0.0006 BNB (~$0.35)</span>
                </div>
                <div className="pt-2 border-t border-alphabag-gray flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-alphabag-text">Total Payable</span>
                  <div className="text-right">
                    <span className="text-xl font-semibold text-alphabag-yellow tabular-nums">{totalBnbCost} BNB</span>
                    <span className="text-[10px] text-alphabag-subtext block font-mono">≈ ${totalUsdCost} USD</span>
                  </div>
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
                  className="w-full bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] active:scale-[0.98] py-3.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-alphabag-yellow/10"
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-alphabag-gray">
            <div>
              <span className="text-xs font-semibold uppercase text-alphabag-subtext">Inventory</span>
              <h2 className="text-2xl font-semibold text-alphabag-text mt-0.5">My Alpha Passes ({userNFTs.length})</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a 
                href={NFT_CONFIG.ELEMENT_MARKET_COLLECTION_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-alphabag-gray hover:bg-alphabag-gray/80 text-alphabag-text px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <ExternalLink size={14} className="text-alphabag-yellow" /> View on Element Market
              </a>
            </div>
          </div>

          {/* Collection Filter & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-alphabag-black/50 p-3 rounded-xl border border-alphabag-gray">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCollectionFilter('ALL')}
                className={`px-3 py-1 rounded text-xs font-semibold uppercase transition-all ${
                  collectionFilter === 'ALL'
                    ? 'bg-alphabag-yellow text-alphabag-dark font-bold'
                    : 'bg-alphabag-darkgray text-alphabag-subtext hover:text-alphabag-text'
                }`}
              >
                All ({userNFTs.length})
              </button>
              {(['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'] as RarityTierName[]).map((tier) => {
                const count = userNFTs.filter(n => n.rarity === tier).length;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setCollectionFilter(tier)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                      collectionFilter === tier
                        ? 'bg-alphabag-text text-alphabag-dark font-bold'
                        : 'bg-alphabag-darkgray text-alphabag-subtext hover:text-alphabag-text'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NFT_TRAITS[tier].color }} />
                    {tier} {count > 0 && <span className="font-mono text-[10px]">({count})</span>}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-alphabag-subtext" />
              <input
                type="text"
                placeholder="Search Token ID..."
                value={searchTokenId}
                onChange={(e) => setSearchTokenId(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-md bg-alphabag-darkgray border border-alphabag-gray text-xs text-alphabag-text placeholder:text-alphabag-subtext/60 focus:outline-none focus:border-alphabag-yellow"
              />
            </div>
          </div>

          {filteredNFTs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredNFTs.map((nft) => {
                const trait = NFT_TRAITS[nft.rarity as RarityTierName] || NFT_TRAITS.Common;
                return (
                  <div 
                    key={nft.tokenId} 
                    className={`bg-alphabag-black border rounded-xl p-4 space-y-3 transition-all hover:border-alphabag-yellow/50 group cursor-pointer ${trait.borderGlow}`}
                    onClick={() => setSelectedInspectPass(nft)}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${trait.badgeBg}`}>
                        {nft.rarity}
                      </span>
                      <span className="bg-alphabag-green/10 text-alphabag-green px-2 py-0.5 rounded text-[10px] font-bold border border-alphabag-green/20">
                        {nft.multiplier}
                      </span>
                    </div>

                    <div className="text-center py-2">
                      <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border border-alphabag-gray/60 mb-2 shadow-sm group-hover:scale-105 transition-transform">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.currentTarget.src = '/nft-collection/tiers/common.png';
                          }}
                        />
                      </div>
                      <h4 className="text-sm font-bold text-alphabag-text">{nft.name}</h4>
                      <span className="text-[10px] text-alphabag-subtext font-mono">Token ID #{nft.tokenId}</span>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-alphabag-gray text-[10px] text-alphabag-subtext">
                      <div className="flex items-center justify-between">
                        <span>Material:</span>
                        <span className="font-semibold text-alphabag-text truncate max-w-[150px]">{trait.material}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Allocation:</span>
                        <span className="font-mono font-bold" style={{ color: trait.color }}>{trait.allocation}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInspectPass(nft);
                      }}
                      className="w-full py-2 rounded bg-alphabag-darkgray hover:bg-alphabag-gray border border-alphabag-gray text-alphabag-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Sparkles size={13} className="text-alphabag-yellow" /> Inspect Pass
                    </button>
                  </div>
                );
              })}
            </div>
          ) : userNFTs.length > 0 ? (
            <div className="text-center py-10 space-y-2 bg-alphabag-black/40 rounded-xl border border-alphabag-gray">
              <Search size={28} className="mx-auto text-alphabag-subtext" />
              <h3 className="text-sm font-semibold text-alphabag-text">No Passes Match Your Filter</h3>
              <p className="text-xs text-alphabag-subtext">Try changing the rarity filter or clearing your search term.</p>
              <button
                type="button"
                onClick={() => { setCollectionFilter('ALL'); setSearchTokenId(''); }}
                className="text-xs text-alphabag-yellow underline pt-1 font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3 bg-alphabag-black/40 rounded-xl border border-alphabag-gray">
              <div className="w-16 h-16 rounded-full bg-alphabag-black border border-alphabag-gray flex items-center justify-center text-alphabag-subtext mx-auto">
                <Crown size={32} />
              </div>
              <h3 className="text-lg font-semibold text-alphabag-text">No Alpha Passes In This Wallet</h3>
              <p className="text-xs text-alphabag-subtext max-w-sm mx-auto">
                You haven't minted any Genesis Passes yet. Mint using 0.07 BNB to activate VIP multipliers.
              </p>
              <button 
                onClick={() => setActiveTab('MINT')} 
                className="bg-alphabag-yellow text-alphabag-dark px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#e0bd2e] transition-all inline-flex items-center gap-1.5"
              >
                <Zap size={14} fill="currentColor" /> Mint For 0.07 BNB
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TIERS & UTILITY (4,000 COLLECTION TRAITS) */}
      {activeTab === 'TIERS' && (
        <div className="space-y-6">
          {/* Section 1: 5 Collection Traits (4,000 Supply Allocation) */}
          <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 space-y-6">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold uppercase text-alphabag-yellow">4,000 Collection Traits</span>
                  <h2 className="text-2xl font-semibold text-alphabag-text mt-0.5">Genesis Pass Rarity Architecture</h2>
                  <p className="text-xs text-alphabag-subtext mt-1">
                    Every Genesis Pass duffle bag is endowed with deterministic on-chain utility traits and multiplier boosts.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-alphabag-yellow bg-alphabag-yellow/10 px-3 py-1 rounded border border-alphabag-yellow/20">
                  4,000 TOTAL SUPPLY
                </span>
              </div>
            </div>

            {/* 5 Trait Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {Object.values(NFT_TRAITS).map((trait) => (
                <div 
                  key={trait.name} 
                  className={`bg-alphabag-black border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all hover:scale-102 ${trait.borderGlow}`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${trait.badgeBg}`}>
                        {trait.name}
                      </span>
                      <span className="text-xs font-mono font-bold" style={{ color: trait.color }}>
                        {trait.allocation}
                      </span>
                    </div>

                    {/* Image Preview */}
                    <div className="w-full aspect-square rounded-xl overflow-hidden border border-alphabag-gray/80 bg-alphabag-darkgray my-2">
                      <img
                        src={trait.image}
                        alt={trait.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Stats */}
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-alphabag-text">{trait.multiplier} Multiplier</div>
                      <div className="text-[11px] text-alphabag-subtext font-mono">{trait.count.toLocaleString()} / 4,000 Bags</div>
                      <p className="text-[11px] text-alphabag-subtext leading-snug pt-1">{trait.description}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-alphabag-gray space-y-1 text-[10px]">
                    {trait.perks.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-alphabag-text">
                        <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                        <span className="truncate">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Account Membership Tiers */}
          <div className="rounded-2xl border border-alphabag-gray bg-alphabag-darkgray p-6 space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase text-alphabag-subtext">Account Membership</span>
              <h2 className="text-2xl font-semibold text-alphabag-text mt-0.5">Platform Access Tiers</h2>
              <p className="text-xs text-alphabag-subtext mt-1">Combine $BAG holdings and Genesis Passes to unlock platform-wide alpha intelligence.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free */}
              <div className={`bg-alphabag-black border rounded-xl p-5 space-y-4 flex flex-col justify-between ${currentTier === 'FREE' ? 'border-alphabag-yellow/50 shadow-[0_0_15px_rgba(252,213,53,0.1)]' : 'border-alphabag-gray'}`}>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase text-alphabag-subtext">Entry</span>
                    {currentTier === 'FREE' && (
                      <span className="text-[9px] font-bold uppercase bg-alphabag-yellow/10 text-alphabag-yellow px-2 py-0.5 rounded border border-alphabag-yellow/20">
                        Current Tier
                      </span>
                    )}
                  </div>
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
              <div className={`bg-alphabag-black border rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-[0_0_15px_rgba(252,213,53,0.06)] ${currentTier === 'PREMIUM' ? 'border-alphabag-yellow ring-2 ring-alphabag-yellow/30' : 'border-alphabag-yellow/40'}`}>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase text-alphabag-yellow">Pro Analytics</span>
                    {currentTier === 'PREMIUM' && (
                      <span className="text-[9px] font-bold uppercase bg-alphabag-yellow text-alphabag-dark px-2 py-0.5 rounded font-black">
                        Active Tier
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-alphabag-text mt-1">PREMIUM TIER</h3>
                  <div className="text-2xl font-bold text-alphabag-yellow mt-2 font-mono">2,000 $BAG + 1 NFT</div>
                  <div className="mt-4 space-y-2 text-xs text-alphabag-text">
                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> All features of Free Tier</div>
                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> Real-time BSC Whale Radar</div>
                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> <strong>1.5x Boost</strong> on ITEMS</div>
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
              <div className={`bg-alphabag-black border-2 rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-sm ${currentTier === 'ALPHA_VIP' ? 'border-alphabag-yellow ring-2 ring-alphabag-yellow' : 'border-alphabag-yellow'}`}>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase text-alphabag-yellow flex items-center gap-1"><Crown size={12} fill="currentColor" /> Apex Level</span>
                    {currentTier === 'ALPHA_VIP' && (
                      <span className="text-[9px] font-bold uppercase bg-alphabag-yellow text-alphabag-dark px-2 py-0.5 rounded font-black">
                        VIP Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-alphabag-text mt-1">ALPHA VIP</h3>
                  <div className="text-2xl font-bold text-alphabag-yellow mt-2 font-mono">2,000 $BAG + 10 NFT</div>
                  <div className="mt-4 space-y-2 text-xs text-alphabag-text">
                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> All features of Free Tier</div>
                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> <strong>100% Platform Unlocks</strong></div>
                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> <strong>Alpha Mission & 5.0x Maximum Boost</strong></div>
                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> VIP Telegram Bot Real-time Alerts</div>
                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> Private Founder Calls & Alpha Analysts</div>
                    <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-alphabag-green shrink-0" /> DEX & CEX Wallet Tracking & All Tools</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PASS INSPECTION MODAL ─────────────────────────────────────────── */}
      {selectedInspectPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-alphabag-darkgray border border-alphabag-gray/90 p-6 md:p-8 shadow-2xl space-y-6 overflow-hidden">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedInspectPass(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-alphabag-black border border-alphabag-gray hover:border-alphabag-yellow text-alphabag-subtext hover:text-alphabag-text flex items-center justify-center transition-all"
            >
              <X size={16} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Image Preview */}
              <div className="space-y-2">
                <div className={`w-full aspect-square rounded-2xl overflow-hidden border bg-alphabag-black ${NFT_TRAITS[selectedInspectPass.rarity as RarityTierName]?.borderGlow || 'border-alphabag-yellow/40'}`}>
                  <img
                    src={selectedInspectPass.image}
                    alt={selectedInspectPass.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-alphabag-subtext px-1">
                  <span>Standard 1:1 Vector Cel-Shading</span>
                  <span>4,000 Genesis Pass</span>
                </div>
              </div>

              {/* Trait & Perk Details */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${NFT_TRAITS[selectedInspectPass.rarity as RarityTierName]?.badgeBg}`}>
                      {selectedInspectPass.rarity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/20">
                      {selectedInspectPass.multiplier} Boost
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-alphabag-text mt-1">{selectedInspectPass.name}</h3>
                  <p className="text-xs text-alphabag-subtext leading-relaxed mt-1">
                    {NFT_TRAITS[selectedInspectPass.rarity as RarityTierName]?.description}
                  </p>
                </div>

                {/* Attributes Table */}
                <div className="bg-alphabag-black rounded-xl p-3.5 border border-alphabag-gray/80 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-alphabag-gray/50">
                    <span className="text-alphabag-subtext">Rarity Allocation:</span>
                    <span className="font-mono font-bold" style={{ color: NFT_TRAITS[selectedInspectPass.rarity as RarityTierName]?.color }}>
                      {NFT_TRAITS[selectedInspectPass.rarity as RarityTierName]?.allocation} ({NFT_TRAITS[selectedInspectPass.rarity as RarityTierName]?.count} Total)
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-alphabag-gray/50">
                    <span className="text-alphabag-subtext">Material:</span>
                    <span className="text-alphabag-text font-medium">{NFT_TRAITS[selectedInspectPass.rarity as RarityTierName]?.material}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-alphabag-gray/50">
                    <span className="text-alphabag-subtext">Mint Price:</span>
                    <span className="font-mono font-bold text-alphabag-yellow">0.07 BNB (~$41.30)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-alphabag-subtext">Network:</span>
                    <span className="text-alphabag-text font-medium">Binance Smart Chain (BSC)</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={`https://bscscan.com/token/${NFT_CONTRACT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-lg bg-alphabag-black hover:bg-alphabag-black/70 border border-alphabag-gray text-alphabag-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink size={13} className="text-alphabag-yellow" /> BscScan
                  </a>
                  <a
                    href={NFT_CONFIG.ELEMENT_MARKET_COLLECTION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-lg bg-alphabag-yellow text-alphabag-dark hover:bg-[#e0bd2e] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                  >
                    Element Market
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://alphabag.app/alpha-passes?token=${selectedInspectPass.tokenId}`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="p-2 rounded-lg bg-alphabag-black hover:bg-alphabag-black/70 border border-alphabag-gray text-alphabag-subtext hover:text-alphabag-text transition-all"
                    title="Copy Share Link"
                  >
                    {copiedLink ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
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
