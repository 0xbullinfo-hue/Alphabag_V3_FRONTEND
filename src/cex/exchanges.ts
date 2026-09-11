/**
 * Per-exchange metadata that drives BOTH the connect wizard UI and the
 * server-side validation. Single source of truth.
 */
export type Scope = 'read' | 'trade' | 'withdraw' | 'transfer' | 'margin' | 'futures';

export interface ExchangeMeta {
  id: string;
  name: string;
  logo: string;
  fields: Array<'apiKey' | 'secret' | 'passphrase'>;
  keyUrl: string;
  requiresIpWhitelist: boolean;
  regions: Array<'global' | 'us'>;
  /** Endpoints that must be merged to get a complete balance picture. */
  balanceEndpoints: string[];
  /** If ANY of these scopes are granted, refuse the key. */
  forbiddenScopes: Scope[];
  docsUrl: string;
  ipWhitelistNote?: string;
}

export const EXCHANGES: Record<string, ExchangeMeta> = {
  binance: {
    id: 'binance', name: 'Binance', logo: '/exchanges/binance.svg',
    fields: ['apiKey', 'secret'],
    keyUrl: 'https://www.binance.com/en/my/settings/api-management',
    requiresIpWhitelist: true,
    regions: ['global', 'us'],
    // Spot alone is WRONG. Earn + Funding + Margin hold real balances.
    balanceEndpoints: ['/api/v3/account', '/sapi/v1/asset/wallet/balance', '/sapi/v1/simple-earn/flexible/position', '/sapi/v1/simple-earn/locked/position'],
    forbiddenScopes: ['withdraw', 'transfer'],
    docsUrl: 'https://developers.binance.com/docs/binance-spot-api-docs',
    ipWhitelistNote: 'Binance requires an IP whitelist for keys with trading enabled. We only need READ — you can leave trading off and skip the whitelist.',
  },
  okx: {
    id: 'okx', name: 'OKX', logo: '/exchanges/okx.svg',
    fields: ['apiKey', 'secret', 'passphrase'],
    keyUrl: 'https://www.okx.com/account/my-api',
    requiresIpWhitelist: true,
    regions: ['global'],
    balanceEndpoints: ['/api/v5/account/balance', '/api/v5/account/positions', '/api/v5/finance/savings/balance'],
    forbiddenScopes: ['withdraw', 'transfer'],
    docsUrl: 'https://www.okx.com/docs-v5/en/',
  },
  coinbase: {
    id: 'coinbase', name: 'Coinbase', logo: '/exchanges/coinbase.svg',
    fields: ['apiKey', 'secret'],
    keyUrl: 'https://www.coinbase.com/settings/api',
    requiresIpWhitelist: false,
    regions: ['global', 'us'],
    balanceEndpoints: ['/v2/accounts', '/v2/accounts?type=staking'],
    forbiddenScopes: ['withdraw', 'transfer'],
    docsUrl: 'https://docs.cdp.coinbase.com/',
  },
  kraken: {
    id: 'kraken', name: 'Kraken', logo: '/exchanges/kraken.svg',
    fields: ['apiKey', 'secret'],
    keyUrl: 'https://pro.kraken.com/app/settings/api',
    requiresIpWhitelist: false,
    regions: ['global'],
    balanceEndpoints: ['/0/private/Balance', '/0/private/BalanceEx', '/0/private/OpenPositions'],
    forbiddenScopes: ['withdraw', 'transfer'],
    docsUrl: 'https://docs.kraken.com/api/',
  },
  bybit: {
    id: 'bybit', name: 'Bybit', logo: '/exchanges/bybit.svg',
    fields: ['apiKey', 'secret'],
    keyUrl: 'https://www.bybit.com/app/user/api-management',
    requiresIpWhitelist: true,
    regions: ['global'],
    balanceEndpoints: ['/v5/account/wallet-balance?accountType=UNIFIED', '/v5/asset/transfer/query-account-coins-balance?accountType=FUND'],
    forbiddenScopes: ['withdraw', 'transfer'],
    docsUrl: 'https://bybit-exchange.github.io/docs/v5/intro',
  },
};

/** Server-side scope detection from the exchange's own permission response. */
export interface DetectedPermissions {
  scopes: Scope[];
  canRead: boolean;
  canWithdraw: boolean;
  canTrade: boolean;
  ipRestricted: boolean;
  raw: unknown;
}

export function assertSafe(p: DetectedPermissions, meta: ExchangeMeta): void {
  const bad = p.scopes.filter(s => meta.forbiddenScopes.includes(s));
  if (bad.length) {
    const e = new Error('UNSAFE_KEY_SCOPES') as Error & { code: string; scopes: Scope[] };
    e.code = 'UNSAFE_KEY_SCOPES';
    e.scopes = bad;
    throw e;
  }
  if (!p.canRead) {
    const e = new Error('KEY_MISSING_READ') as Error & { code: string };
    e.code = 'KEY_MISSING_READ';
    throw e;
  }
}
