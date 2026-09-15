export type PositionKind =
  | 'wallet'        // plain token balance
  | 'lp'            // concentrated / v2 liquidity
  | 'lending_supply'
  | 'lending_borrow'
  | 'stake'
  | 'vault'         // ERC-4626
  | 'reward';       // unclaimed

export interface Position {
  id: string;                 // stable hash: chainId:protocol:kind:ref
  chainId: number;
  protocol: string;           // 'uniswap-v3' | 'aave-v3' | 'erc4626' | ...
  kind: PositionKind;
  /** Underlying asset(s) after decoding. LP positions have 2+. */
  assets: Array<{
    address: string;
    symbol: string;
    decimals: number;
    amount: string;           // raw units as string (never float)
  }>;
  /** For LP: the pool/NFT ref so the UI can link out. */
  ref?: { type: 'nft' | 'pool' | 'market'; value: string; url?: string };
  /** Protocol-specific risk surface. */
  health?: { healthFactor: number; liquidationThreshold: number; ltv: number };
  apy?: { supply?: number; borrow?: number; rewards?: number };
  /** Unclaimed, in raw units. */
  claimable?: Array<{ address: string; symbol: string; amount: string }>;
  /** USD is filled in by the valuation pass, never by the decoder. */
  usd?: number | null;
  valuationStatus?: 'VALUED' | 'STALE' | 'UNAVAILABLE';
  meta: Record<string, unknown>;
}

export interface DecodeContext {
  chainId: number;
  wallet: string;
  blockNumber: number;
  multicall: (calls: Array<{ to: string; data: string }>) => Promise<string[]>;
  prices: (addr: string, amountRaw: string, decimals: number) => Promise<number>;
}

export interface ProtocolDecoder {
  readonly protocol: string;
  readonly chainIds: number[];
  /** Cheap check: does this wallet have ANY position here? Avoids full decode. */
  probe(ctx: DecodeContext): Promise<boolean>;
  decode(ctx: DecodeContext): Promise<Position[]>;
}
