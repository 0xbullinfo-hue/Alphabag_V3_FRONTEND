/**
 * Single source of truth for DeFi protocol addresses per chain.
 */
export interface ProtocolAddresses {
  pool?: string;
  dataProvider?: string;
  positionManager?: string;
  comet?: string;
  vaults?: string[];
}

export const PROTOCOL_REGISTRY: Record<string, Record<number, ProtocolAddresses>> = {
  aaveV3: {
    1:     { pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', dataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3' },
    137:   { pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', dataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' },
    42161: { pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', dataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' },
    10:    { pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', dataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' },
    8453:  { pool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5', dataProvider: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac' },
  },
  uniswapV3: {
    1:     { positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88' },
    137:   { positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88' },
    42161: { positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88' },
    10:    { positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88' },
    8453:  { positionManager: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1' },
  },
  compoundV3: {
    1:     { comet: '0xc3d688B66703497DAA19211EEdff47f25384cdc3' },
    137:   { comet: '0xF25212E676D1F7F89Cd72fFEe66158f541246445' },
    42161: { comet: '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA' },
    10:    { comet: '0x2e44e174f7D53F0212823acC11C01A11d58c5bCB' },
    8453:  { comet: '0xb125E6687d4313864e53df431d5425969c15Eb2F' },
  },
  lido: {
    1: {
      vaults: [
        '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // stETH
        '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', // wstETH
      ],
    },
  },
};

export function addressesFor(protocol: string, chainId: number): ProtocolAddresses | undefined {
  return PROTOCOL_REGISTRY[protocol]?.[chainId];
}
