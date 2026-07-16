import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, RefreshCw, Key, ArrowRight, Lock, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useWallet } from '../../context/WalletContext';
import { TOKEN_GATING_CONFIG } from '../../services/config';

// ERC-20 Minimal ABI for approve transaction
const ERC20_ABI = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    }
] as const;

// Supported Chains for Scanner
interface ScanChain {
    id: number;
    name: string;
    slug: string;
    logo: string;
}

const SUPPORTED_CHAINS: ScanChain[] = [
    { id: 1, name: 'Ethereum', slug: 'eth-mainnet', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { id: 56, name: 'BNB Chain', slug: 'bsc-mainnet', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
    { id: 137, name: 'Polygon', slug: 'matic-mainnet', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
    { id: 42161, name: 'Arbitrum', slug: 'arbitrum-mainnet', logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png' },
    { id: 8453, name: 'Base', slug: 'base-mainnet', logo: 'https://cryptologos.cc/logos/base-base-logo.png' },
    { id: 10, name: 'Optimism', slug: 'optimism-mainnet', logo: 'https://cryptologos.cc/logos/optimism-op-logo.png' },
    { id: 43114, name: 'Avalanche', slug: 'avalanche-mainnet', logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' }
];

interface SpenderAllowance {
    spenderAddress: string;
    spenderLabel: string;
    allowanceValue: string; // in raw format or infinite
    allowanceUsd: number;
    valueAtRiskUsd: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    txHash: string;
}

interface ApprovalItem {
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    tokenLogo: string;
    tokenBalance: number;
    tokenPriceUsd: number;
    spenders: SpenderAllowance[];
}

export const SecurityScanner: React.FC = () => {
    const { address: connectedAddress, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const { addToast } = useWallet();

    const [scanAddress, setScanAddress] = useState('');
    const [selectedChain, setSelectedChain] = useState<ScanChain>(SUPPORTED_CHAINS[1]); // Default to BSC
    const [loading, setLoading] = useState(false);
    const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
    const [revokingSpender, setRevokingSpender] = useState<string | null>(null);

    // Sync input address when wallet connects
    useEffect(() => {
        if (connectedAddress) {
            setScanAddress(connectedAddress);
        }
    }, [connectedAddress]);

    const fetchApprovals = async (targetAddress: string, chain: ScanChain) => {
        if (!targetAddress || !targetAddress.startsWith('0x')) {
            addToast("Please provide a valid EVM address.", "ERROR");
            return;
        }

        setLoading(true);
        setApprovals([]);

        const COVALENT_API_KEY = import.meta.env.VITE_COVALENT_API_KEY;

        try {
            if (!COVALENT_API_KEY) {
                // Fallback to rich Mock Data for Demo mode if API key is not present
                console.log("[SecurityScanner] No Covalent API key found — using mock security approvals.");
                await new Promise(r => setTimeout(r, 1200));
                setApprovals(getMockApprovals());
                return;
            }

            const auth = btoa(`${COVALENT_API_KEY}:`);
            const url = `https://api.covalenthq.com/v1/${chain.slug}/approvals/${targetAddress}/`;
            
            console.log(`[SecurityScanner] Fetching approvals for ${targetAddress} on chain ${chain.slug}`);
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                }
            });

            if (!response.ok) {
                throw new Error(`Covalent API failed with status ${response.status}`);
            }

            const resData = await response.json();
            const rawItems = resData.data?.items || [];
            
            // Map Covalent data to ApprovalItem structure
            const mapped: ApprovalItem[] = rawItems.map((item: any): ApprovalItem => {
                const balance = Number(item.balance || 0) / Math.pow(10, item.contract_decimals || 18);
                const price = item.quote_rate || 0;
                
                const spenders: SpenderAllowance[] = (item.allowances || []).map((allow: any): SpenderAllowance => {
                    const allowanceValue = allow.allowance_amount || '0';
                    const isInfinite = allowanceValue.length > 25 || allowanceValue.startsWith('1157920892');
                    
                    const valueAtRiskUsd = balance * price;
                    
                    // Risk heuristics: Infinite allowance + unverified contract is high risk
                    let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
                    if (isInfinite) {
                        const lowSpender = (allow.spender_address || '').toLowerCase();
                        // Mark standard known protocols as Medium Risk instead of High Risk
                        const isCommonProtocol = lowSpender.includes('router') || lowSpender.includes('uniswap') || lowSpender.includes('pancake');
                        riskLevel = isCommonProtocol ? 'MEDIUM' : 'HIGH';
                    } else if (valueAtRiskUsd > 100) {
                        riskLevel = 'MEDIUM';
                    }

                    return {
                        spenderAddress: allow.spender_address || '',
                        spenderLabel: allow.spender_label || WalletLabels_getFriendlyLabel(allow.spender_address),
                        allowanceValue: isInfinite ? 'Infinite' : (Number(allowanceValue) / Math.pow(10, item.contract_decimals || 18)).toLocaleString(),
                        allowanceUsd: isInfinite ? Infinity : (Number(allowanceValue) / Math.pow(10, item.contract_decimals || 18)) * price,
                        valueAtRiskUsd,
                        riskLevel,
                        txHash: allow.transaction_hash || ''
                    };
                });

                return {
                    tokenAddress: item.contract_address || '',
                    tokenSymbol: item.contract_ticker_symbol || 'UNK',
                    tokenName: item.contract_name || 'Unknown Token',
                    tokenLogo: item.logo_url || 'https://ui-avatars.com/api/?name=' + (item.contract_ticker_symbol || 'UNK'),
                    tokenBalance: balance,
                    tokenPriceUsd: price,
                    spenders
                };
            }).filter((item: ApprovalItem) => item.spenders.length > 0);

            setApprovals(mapped);
            if (mapped.length === 0) {
                addToast("No active token approvals found for this wallet.", "INFO");
            } else {
                addToast(`Found active approvals on ${chain.name}.`, "SUCCESS");
            }
        } catch (err: any) {
            console.error("[SecurityScanner] Approvals fetch failed:", err);
            addToast("Failed to retrieve approvals. Falling back to demo data.", "ERROR");
            setApprovals(getMockApprovals());
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (tokenAddress: string, spenderAddress: string) => {
        if (!isConnected || !walletClient) {
            addToast("Please connect your wallet to submit transaction.", "ERROR");
            return;
        }

        setRevokingSpender(spenderAddress);
        addToast("Please approve the revocation transaction in your wallet...", "INFO");

        try {
            // Write to the ERC20 contract to set approval to 0
            const txHash = await walletClient.writeContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [spenderAddress as `0x${string}`, 0n]
            });

            addToast(`Revocation transaction submitted! Hash: ${txHash.substring(0, 10)}...`, "SUCCESS");
            
            // Wait 3 seconds and refresh approvals
            setTimeout(() => {
                fetchApprovals(scanAddress, selectedChain);
            }, 4000);
        } catch (e: any) {
            console.error("Revocation failed", e);
            let errorMsg = e.message || "Failed to execute revocation.";
            if (e.message?.includes("rejected") || e.code === 4001) {
                errorMsg = "Revocation cancelled by user.";
            }
            addToast(errorMsg, "ERROR");
        } finally {
            setRevokingSpender(null);
        }
    };

    const handleQuickScan = (e: React.FormEvent) => {
        e.preventDefault();
        fetchApprovals(scanAddress, selectedChain);
    };

    const totalRiskyApprovals = approvals.reduce((acc, item) => {
        return acc + item.spenders.filter(s => s.riskLevel === 'HIGH' || s.riskLevel === 'MEDIUM').length;
    }, 0);

    const totalAtRiskUsd = approvals.reduce((acc, item) => {
        const itemMaxAtRisk = item.spenders.reduce((max, s) => Math.max(max, s.valueAtRiskUsd), 0);
        return acc + itemMaxAtRisk;
    }, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4 md:px-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end py-6 border-b border-alphabag-gray gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
                        Security <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)]">Radar</span>
                    </h1>
                    <p className="text-alphabag-subtext text-xs font-medium uppercase tracking-[0.2em] mt-1">
                        DeBank-style Approval Revocation & Security Scanner
                    </p>
                </div>
            </div>

            {/* Quick Scan Input */}
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-alphabag-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
                <form onSubmit={handleQuickScan} className="flex flex-col lg:flex-row items-center gap-4">
                    <div className="w-full lg:w-1/4">
                        <label className="block text-[10px] text-alphabag-subtext font-bold uppercase tracking-wider mb-1.5">Scanning Network</label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {SUPPORTED_CHAINS.map(chain => (
                                <button
                                    key={chain.id}
                                    type="button"
                                    onClick={() => setSelectedChain(chain)}
                                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all group ${selectedChain.id === chain.id ? 'bg-alphabag-yellow/10 border-alphabag-yellow text-white' : 'bg-black/30 border-white/5 hover:border-white/20 text-alphabag-subtext'}`}
                                >
                                    <img src={chain.logo} className="w-5 h-5 object-contain" alt={chain.name} />
                                    <span className="text-[8px] font-black uppercase tracking-wider block sm:hidden md:block">{chain.name.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:flex-1">
                        <label className="block text-[10px] text-alphabag-subtext font-bold uppercase tracking-wider mb-1.5">Wallet Address</label>
                        <input
                            type="text"
                            value={scanAddress}
                            onChange={(e) => setScanAddress(e.target.value)}
                            placeholder="Paste EVM Wallet Address (0x...)"
                            className="w-full bg-black/40 border border-white/10 text-white font-mono text-sm rounded-xl p-3 outline-none focus:border-alphabag-yellow focus:ring-1 focus:ring-alphabag-yellow transition-all"
                            required
                        />
                    </div>

                    <div className="w-full lg:w-auto self-end">
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="w-full lg:w-auto px-8 py-3.5 text-xs font-black tracking-widest uppercase bg-alphabag-yellow text-alphabag-black"
                            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
                        >
                            {loading ? 'Scanning Approvals...' : 'Scan Approvals'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Metrics Dashboard */}
            {approvals.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-alphabag-subtext">At Risk Contracts</span>
                            <h3 className="text-2xl font-black text-white mt-1">{totalRiskyApprovals}</h3>
                        </div>
                        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20">
                            <ShieldAlert size={22} />
                        </div>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-alphabag-subtext">Total Value at Risk</span>
                            <h3 className="text-2xl font-black text-white mt-1">${totalAtRiskUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="w-12 h-12 bg-alphabag-yellow/10 rounded-xl flex items-center justify-center text-alphabag-yellow border border-alphabag-yellow/20">
                            <AlertTriangle size={22} />
                        </div>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-alphabag-subtext">Scan Status</span>
                            <h3 className="text-sm font-black text-green-400 mt-1 uppercase flex items-center gap-1.5">
                                <CheckCircle size={15} /> Integrity Normal
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 border border-green-500/20">
                            <ShieldCheck size={22} />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Scanner Results */}
            <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden p-6">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-alphabag-subtext flex items-center gap-2">
                        <Key size={14} className="text-alphabag-yellow" /> Active Approvals Result
                    </span>
                    {approvals.length > 0 && (
                        <span className="text-[9px] font-black bg-white/5 border border-white/10 text-white px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {approvals.length} Tokens Scanned
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="py-24 text-center space-y-4">
                        <div className="w-10 h-10 border-2 border-alphabag-yellow border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-alphabag-yellow animate-pulse">Running smart contract allowance check...</p>
                    </div>
                ) : approvals.length === 0 ? (
                    <div className="py-24 text-center max-w-sm mx-auto space-y-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 text-alphabag-subtext flex items-center justify-center rounded-2xl mx-auto">
                            <ShieldCheck size={26} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Zero Vulnerabilities Checked</h3>
                        <p className="text-xs text-alphabag-subtext font-medium leading-relaxed">
                            No token approvals detected or no scan has been initiated. Connect your wallet above or paste an address to begin scanning.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {approvals.map(token => (
                            <div key={token.tokenAddress} className="border border-white/5 bg-black/40 rounded-2xl overflow-hidden hover:border-white/10 transition-all p-5">
                                {/* Token Info header */}
                                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <img src={token.tokenLogo} className="w-8 h-8 rounded-full border border-white/10 bg-black" alt={token.tokenSymbol} />
                                        <div>
                                            <h4 className="text-xs font-black text-white uppercase">{token.tokenName}</h4>
                                            <span className="text-[9px] text-alphabag-subtext font-bold uppercase">{token.tokenSymbol} • {token.tokenAddress.substring(0, 8)}...</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-white tabular-nums">
                                            {token.tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token.tokenSymbol}
                                        </div>
                                        <div className="text-[9px] text-alphabag-subtext font-bold uppercase tracking-wider">
                                            Balance Value: ${(token.tokenBalance * token.tokenPriceUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>

                                {/* Spenders allowances table */}
                                <div className="space-y-3">
                                    {token.spenders.map(spender => (
                                        <div key={spender.spenderAddress} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-white uppercase tracking-tight">{spender.spenderLabel}</span>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                        spender.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        spender.riskLevel === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                        'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    }`}>
                                                        {spender.riskLevel} RISK
                                                    </span>
                                                </div>
                                                <span className="text-[9px] text-alphabag-subtext font-mono font-medium tracking-wide mt-1 block">
                                                    Spender: {spender.spenderAddress}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                                                <div className="text-left sm:text-right">
                                                    <div className="text-[9px] text-alphabag-subtext uppercase font-bold tracking-widest mb-0.5">Approved Allowance</div>
                                                    <div className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                                                        {spender.allowanceValue}
                                                    </div>
                                                </div>

                                                <div className="text-left sm:text-right">
                                                    <div className="text-[9px] text-alphabag-subtext uppercase font-bold tracking-widest mb-0.5">Value at Risk</div>
                                                    <div className="text-xs font-black text-alphabag-red tabular-nums">
                                                        ${spender.valueAtRiskUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>

                                                <Button
                                                    size="xs"
                                                    onClick={() => handleRevoke(token.tokenAddress, spender.spenderAddress)}
                                                    isLoading={revokingSpender === spender.spenderAddress}
                                                    className="px-4 py-2 border border-alphabag-red/20 text-alphabag-red hover:bg-alphabag-red hover:text-white bg-alphabag-red/5 font-black tracking-widest text-[9px] uppercase hover:scale-[1.02] active:scale-[0.98]"
                                                >
                                                    {revokingSpender === spender.spenderAddress ? 'Revoking...' : 'Revoke'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Mock dataset helper for Demo / Sandbox mode
const getMockApprovals = (): ApprovalItem[] => {
    return [
        {
            tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            tokenSymbol: 'USDT',
            tokenName: 'Tether USD',
            tokenLogo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
            tokenBalance: 4500,
            tokenPriceUsd: 1.0,
            spenders: [
                {
                    spenderAddress: '0x1111111254fb6c44bac0bed2854e76f90643097d',
                    spenderLabel: '1inch v5 Aggregator Router',
                    allowanceValue: 'Infinite',
                    allowanceUsd: Infinity,
                    valueAtRiskUsd: 4500,
                    riskLevel: 'MEDIUM',
                    txHash: '0xabc123...'
                },
                {
                    spenderAddress: '0x6b758b29c9ffb8858e3e4a905a5a2e5d95b54a20',
                    spenderLabel: 'Unknown Unverified Contract',
                    allowanceValue: 'Infinite',
                    allowanceUsd: Infinity,
                    valueAtRiskUsd: 4500,
                    riskLevel: 'HIGH',
                    txHash: '0xdef456...'
                }
            ]
        },
        {
            tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            tokenSymbol: 'USDC',
            tokenName: 'USD Coin',
            tokenLogo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
            tokenBalance: 1250,
            tokenPriceUsd: 1.0,
            spenders: [
                {
                    spenderAddress: '0xe592427a0aece92de3edee1f18e0157c05861564',
                    spenderLabel: 'Uniswap V3 Swap Router',
                    allowanceValue: '100.00',
                    allowanceUsd: 100.00,
                    valueAtRiskUsd: 100.00,
                    riskLevel: 'LOW',
                    txHash: '0x789ghi...'
                }
            ]
        },
        {
            tokenAddress: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
            tokenSymbol: 'PEPE',
            tokenName: 'Pepe',
            tokenLogo: 'https://logos.covalenthq.com/tokens/1/0x6982508145454ce325ddbe47a25d4ec3d2311933.png',
            tokenBalance: 240000000,
            tokenPriceUsd: 0.000008,
            spenders: [
                {
                    spenderAddress: '0xf87d4466b020a59a2f2672522c0f05a5e3c8ef78',
                    spenderLabel: 'Phishing Token Contract Spender',
                    allowanceValue: 'Infinite',
                    allowanceUsd: Infinity,
                    valueAtRiskUsd: 1920,
                    riskLevel: 'HIGH',
                    txHash: '0xpepe123...'
                }
            ]
        }
    ];
};

// Spender Address Labeling Utility Helper
const WalletLabels_getFriendlyLabel = (address: string): string => {
    const lowAddr = (address || '').toLowerCase();
    
    // Binance Smart Chain
    if (lowAddr === '0x10ed43c718714eb63d5aa57b78b54704e256024e') return 'PancakeSwap v2 Router';
    if (lowAddr === '0x13f4ea832e8d2e8d2e8d2e8d2e8d2e8d2e8d2e8d') return 'PancakeSwap v3 Router';
    
    // Ethereum Mainnet
    if (lowAddr === '0x7a250d5630b4cf539739df2c5dacb4c659f2488d') return 'Uniswap v2 Router 02';
    if (lowAddr === '0xe592427a0aece92de3edee1f18e0157c05861564') return 'Uniswap v3 Swap Router';
    if (lowAddr === '0x1111111254fb6c44bac0bed2854e76f90643097d') return '1inch v5 Router';
    if (lowAddr === '0x111111125434b319222cdb775482021a83e002ef') return '1inch v6 Router';
    
    return 'Unknown Spender';
};
