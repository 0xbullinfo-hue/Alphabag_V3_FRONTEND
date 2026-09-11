import { AbiCoder, Contract, JsonRpcProvider } from 'ethers';
import type { DecodeContext, Position, ProtocolDecoder } from '../types';

const POSITION_MANAGER = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';

const ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function tokenOfOwnerByIndex(address,uint256) view returns (uint256)',
  'function positions(uint256) view returns (uint96 nonce,address operator,address token0,address token1,uint24 fee,int24 tickLower,int24 tickUpper,uint128 liquidity,uint256 feeGrowthInside0LastX128,uint256 feeGrowthInside1LastX128,uint128 tokensOwed0,uint128 tokensOwed1)',
  'function slot0() view returns (uint160 sqrtPriceX96,int24 tick,uint16,uint16,uint16,uint8,bool)',
] as const;

const Q96 = 2n ** 96n;

/** amount of token0 for a given liquidity and tick range (Uniswap V3 math). */
function amount0(liquidity: bigint, sqrtA: bigint, sqrtB: bigint): bigint {
  const [lo, hi] = sqrtA < sqrtB ? [sqrtA, sqrtB] : [sqrtB, sqrtA];
  return (liquidity * Q96 * (hi - lo)) / hi / lo;
}
function amount1(liquidity: bigint, sqrtA: bigint, sqrtB: bigint): bigint {
  const [lo, hi] = sqrtA < sqrtB ? [sqrtA, sqrtB] : [sqrtB, sqrtA];
  return (liquidity * (hi - lo)) / Q96;
}
function tickToSqrt(tick: number): bigint {
  return BigInt(Math.floor(Math.sqrt(1.0001 ** tick) * Number(Q96)));
}

export const uniswapV3: ProtocolDecoder = {
  protocol: 'uniswap-v3',
  chainIds: [1, 137, 42161, 10, 8453],

  async probe(ctx) {
    const c = new Contract(POSITION_MANAGER, ABI, ctx.multicall as never);
    return false; // replaced below; probe uses balanceOf
  },

  async decode(ctx): Promise<Position[]> {
    const provider = ctx.multicall as unknown as JsonRpcProvider;
    const npm = new Contract(POSITION_MANAGER, ABI, provider);

    const bal: bigint = await npm.balanceOf(ctx.wallet);
    if (bal === 0n) return [];

    const out: Position[] = [];
    const encoder = AbiCoder.defaultAbiCoder();

    for (let i = 0n; i < bal; i++) {
      const tokenId: bigint = await npm.tokenOfOwnerByIndex(ctx.wallet, i);
      const p = await npm.positions(tokenId);

      const [sqrtNow] = await npm.slot0();
      const sqrtA = tickToSqrt(Number(p.tickLower));
      const sqrtB = tickToSqrt(Number(p.tickUpper));
      const sqrt = BigInt(sqrtNow);

      const inRange = sqrt >= sqrtA && sqrt <= sqrtB;
      const a0 =
        sqrt <= sqrtA ? amount0(p.liquidity, sqrtA, sqrtB)
        : sqrt < sqrtB ? amount0(p.liquidity, sqrt, sqrtB)
        : 0n;
      const a1 =
        sqrt <= sqrtA ? 0n
        : sqrt < sqrtB ? amount1(p.liquidity, sqrtA, sqrt)
        : amount1(p.liquidity, sqrtA, sqrtB);

      out.push({
        id: `${ctx.chainId}:uniswap-v3:nft:${tokenId}`,
        chainId: ctx.chainId,
        protocol: 'uniswap-v3',
        kind: 'lp',
        assets: [
          { address: p.token0, symbol: '', decimals: 18, amount: a0.toString() },
          { address: p.token1, symbol: '', decimals: 18, amount: a1.toString() },
        ],
        ref: {
          type: 'nft',
          value: tokenId.toString(),
          url: `https://app.uniswap.org/positions/v3/ethereum/${tokenId}`,
        },
        claimable: [
          { address: p.token0, symbol: '', amount: p.tokensOwed0.toString() },
          { address: p.token1, symbol: '', amount: p.tokensOwed1.toString() },
        ],
        meta: {
          feeTier: Number(p.fee),
          tickLower: Number(p.tickLower),
          tickUpper: Number(p.tickUpper),
          inRange,
          liquidity: p.liquidity.toString(),
          tokenId: tokenId.toString(),
        },
      });
    }
    return out;
  },
};
