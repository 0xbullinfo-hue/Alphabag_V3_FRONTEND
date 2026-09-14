import { addressesFor } from '../protocolRegistry';
import { Contract, JsonRpcProvider } from 'ethers';
import type { DecodeContext, Position, ProtocolDecoder } from '../types';

const POOL = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'; // Aave V3 Ethereum
const DATA_PROVIDER = '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3';

const ABI = [
  'function getUserAccountData(address) view returns (uint256 totalCollateralBase,uint256 totalDebtBase,uint256 availableBorrowsBase,uint256 currentLiquidationThreshold,uint256 ltv,uint256 healthFactor)',
  'function getUserReserveData(address asset,address user) view returns (uint256 currentATokenBalance,uint256 currentStableDebt,uint256 currentVariableDebt,uint256 principalStableDebt,uint256 scaledVariableDebt,uint256 stableBorrowRate,uint256 liquidityRate,uint40 stableRateLastUpdated,bool usageAsCollateralEnabled)',
] as const;

export const aaveV3: ProtocolDecoder = {
  protocol: 'aave-v3',
  chainIds: [1, 137, 42161, 10, 8453],

  async probe(ctx) {
    const addrs = addressesFor('aaveV3', ctx.chainId);
    if (!addrs?.pool) return false;
    const pool = new Contract(addrs.pool, ABI, ctx.multicall as unknown as JsonRpcProvider);
    const d = await pool.getUserAccountData(ctx.wallet);
    return BigInt(d.totalCollateralBase) > 0n || BigInt(d.totalDebtBase) > 0n;
  },

  async decode(ctx): Promise<Position[]> {
    const provider = ctx.multicall as unknown as JsonRpcProvider;
    const addrs = addressesFor('aaveV3', ctx.chainId);
    if (!addrs?.pool) return [];
    const pool = new Contract(addrs.pool, ABI, provider);
    const acct = await pool.getUserAccountData(ctx.wallet);

    const hfRaw = BigInt(acct.healthFactor);
    // Aave returns HF scaled by 1e18; type(uint256).max means "no debt".
    const healthFactor = hfRaw > 10n ** 30n ? Infinity : Number(hfRaw) / 1e18;

    const positions: Position[] = [];
    const totalCollateralUsd = Number(acct.totalCollateralBase) / 1e8;
    const totalDebtUsd = Number(acct.totalDebtBase) / 1e8;

    if (totalCollateralUsd > 0) {
      positions.push({
        id: `${ctx.chainId}:aave-v3:supply:${ctx.wallet}`,
        chainId: ctx.chainId,
        protocol: 'aave-v3',
        kind: 'lending_supply',
        assets: [],
        usd: totalCollateralUsd,
        health: {
          healthFactor,
          liquidationThreshold: Number(acct.currentLiquidationThreshold) / 1e4,
          ltv: Number(acct.ltv) / 1e4,
        },
        meta: { aggregated: true },
      });
    }
    if (totalDebtUsd > 0) {
      positions.push({
        id: `${ctx.chainId}:aave-v3:borrow:${ctx.wallet}`,
        chainId: ctx.chainId,
        protocol: 'aave-v3',
        kind: 'lending_borrow',
        assets: [],
        usd: -totalDebtUsd,          // NEGATIVE — debt reduces net worth
        health: {
          healthFactor,
          liquidationThreshold: Number(acct.currentLiquidationThreshold) / 1e4,
          ltv: Number(acct.ltv) / 1e4,
        },
        meta: { aggregated: true },
      });
    }
    return positions;
  },
};
