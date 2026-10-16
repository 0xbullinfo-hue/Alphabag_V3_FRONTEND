import type {
  IBasicDataFeed,
  DatafeedConfiguration,
  LibrarySymbolInfo,
  ResolutionString,
  PeriodParams,
  HistoryCallback,
  ErrorCallback,
  SubscribeBarsCallback,
  SearchSymbolResultItem,
  Bar,
} from './types';

// Map TradingView resolution string to Binance kline interval
export const resolutionToBinanceInterval = (resolution: ResolutionString): string => {
  switch (resolution) {
    case '1':
      return '1m';
    case '3':
      return '3m';
    case '5':
      return '5m';
    case '15':
      return '15m';
    case '30':
      return '30m';
    case '60':
      return '1h';
    case '120':
      return '2h';
    case '240':
      return '4h';
    case '360':
      return '6h';
    case '720':
      return '12h';
    case '1D':
    case 'D':
      return '1d';
    case '3D':
      return '3d';
    case '1W':
    case 'W':
      return '1w';
    case '1M':
    case 'M':
      return '1M';
    default:
      return '1h';
  }
};

// Clean symbol string (remove exchange prefix like 'BINANCE:' or 'BYBIT:')
export const cleanSymbolName = (symbol: string): string => {
  const parts = symbol.split(':');
  let clean = (parts.length > 1 ? parts[1] : parts[0]).toUpperCase().trim();
  
  const quoteSuffixes = ['USDT', 'USD', 'USDC', 'FDUSD', 'BUSD', 'EUR', 'TRY'];
  const hasKnownQuote = quoteSuffixes.some((q) => clean.endsWith(q));
  const isCryptoPairWithBtcEth = (clean.endsWith('BTC') && clean !== 'BTC') || (clean.endsWith('ETH') && clean !== 'ETH');

  if (!hasKnownQuote && !isCryptoPairWithBtcEth) {
    clean += 'USDT';
  }
  return clean;
};

// Validate that symbol contains only alphanumeric characters between 2 and 20 chars
export const isValidSymbol = (symbol: string): boolean => {
  return /^[A-Z0-9]{2,20}$/.test(symbol);
};

// Dynamic price scale based on symbol (e.g. PEPE, SHIB need more decimal places)
export const getPriceScale = (symbol: string): number => {
  const s = symbol.toUpperCase();
  if (s.includes('PEPE') || s.includes('SHIB') || s.includes('FLOKI') || s.includes('BONK') || s.includes('LUNC')) {
    return 100000000; // 8 decimals
  }
  if (s.includes('DOGE') || s.includes('ADA') || s.includes('XRP') || s.includes('SUI') || s.includes('TRX')) {
    return 10000; // 4 decimals
  }
  return 100; // 2 decimals for BTC, ETH, SOL, etc.
};

const DEFAULT_CONFIGURATION: DatafeedConfiguration = {
  supported_resolutions: ['1', '3', '5', '15', '30', '60', '120', '240', '1D', '1W', '1M'],
  exchanges: [
    { value: 'BINANCE', name: 'Binance', desc: 'Binance Spot' },
    { value: 'DEX', name: 'DEX Liquidity', desc: 'Decentralized Exchanges' },
    { value: 'BYBIT', name: 'Bybit', desc: 'Bybit Spot' },
  ],
  symbols_types: [
    { name: 'crypto', value: 'crypto' },
  ],
  currency_codes: ['USD', 'USDT'],
  supports_marks: false,
  supports_timescale_marks: false,
  supports_time: true,
};

// Curated search list for instant autocomplete
const POPULAR_SEARCH_SYMBOLS: SearchSymbolResultItem[] = [
  { symbol: 'BTCUSDT', full_name: 'BINANCE:BTCUSDT', description: 'Bitcoin / Tether USD', exchange: 'BINANCE', ticker: 'BTCUSDT', type: 'crypto' },
  { symbol: 'ETHUSDT', full_name: 'BINANCE:ETHUSDT', description: 'Ethereum / Tether USD', exchange: 'BINANCE', ticker: 'ETHUSDT', type: 'crypto' },
  { symbol: 'SOLUSDT', full_name: 'BINANCE:SOLUSDT', description: 'Solana / Tether USD', exchange: 'BINANCE', ticker: 'SOLUSDT', type: 'crypto' },
  { symbol: 'PEPEUSDT', full_name: 'BINANCE:PEPEUSDT', description: 'Pepe / Tether USD', exchange: 'BINANCE', ticker: 'PEPEUSDT', type: 'crypto' },
  { symbol: 'DOGEUSDT', full_name: 'BINANCE:DOGEUSDT', description: 'Dogecoin / Tether USD', exchange: 'BINANCE', ticker: 'DOGEUSDT', type: 'crypto' },
  { symbol: 'SUIUSDT', full_name: 'BINANCE:SUIUSDT', description: 'Sui / Tether USD', exchange: 'BINANCE', ticker: 'SUIUSDT', type: 'crypto' },
  { symbol: 'BNBUSDT', full_name: 'BINANCE:BNBUSDT', description: 'BNB / Tether USD', exchange: 'BINANCE', ticker: 'BNBUSDT', type: 'crypto' },
  { symbol: 'XRPUSDT', full_name: 'BINANCE:XRPUSDT', description: 'Ripple / Tether USD', exchange: 'BINANCE', ticker: 'XRPUSDT', type: 'crypto' },
  { symbol: 'AVAXUSDT', full_name: 'BINANCE:AVAXUSDT', description: 'Avalanche / Tether USD', exchange: 'BINANCE', ticker: 'AVAXUSDT', type: 'crypto' },
  { symbol: 'LINKUSDT', full_name: 'BINANCE:LINKUSDT', description: 'Chainlink / Tether USD', exchange: 'BINANCE', ticker: 'LINKUSDT', type: 'crypto' },
  { symbol: 'NEARUSDT', full_name: 'BINANCE:NEARUSDT', description: 'Near Protocol / Tether USD', exchange: 'BINANCE', ticker: 'NEARUSDT', type: 'crypto' },
  { symbol: 'SHIBUSDT', full_name: 'BINANCE:SHIBUSDT', description: 'Shiba Inu / Tether USD', exchange: 'BINANCE', ticker: 'SHIBUSDT', type: 'crypto' },
];

export const MAX_CONCURRENT_SUBSCRIPTIONS = 5;

export interface ActiveSubscription {
  ws: WebSocket | null;
  cleanSymbol: string;
  streamName: string;
  retryCount: number;
  retryTimer?: ReturnType<typeof setTimeout>;
  closedIntentionally: boolean;
  callback: SubscribeBarsCallback;
}

export class AlphaBAGDatafeed implements IBasicDataFeed {
  private activeSubscriptions = new Map<string, ActiveSubscription>();

  getActiveSubscriptionsCount(): number {
    return this.activeSubscriptions.size;
  }

  onReady(callback: (config: DatafeedConfiguration) => void): void {
    setTimeout(() => callback(DEFAULT_CONFIGURATION), 0);
  }

  searchSymbols(
    userInput: string,
    _exchange: string,
    _symbolType: string,
    onResultReadyCallback: (result: SearchSymbolResultItem[]) => void
  ): void {
    const query = userInput.trim().toUpperCase();
    if (!query) {
      onResultReadyCallback(POPULAR_SEARCH_SYMBOLS);
      return;
    }

    const matches = POPULAR_SEARCH_SYMBOLS.filter(
      (s) => s.symbol.includes(query) || s.description.toUpperCase().includes(query)
    );

    // If no exact static match, dynamically formulate symbol
    if (matches.length === 0) {
      const clean = cleanSymbolName(query);
      matches.push({
        symbol: clean,
        full_name: `BINANCE:${clean}`,
        description: `${clean} / Tether USD`,
        exchange: 'BINANCE',
        ticker: clean,
        type: 'crypto',
      });
    }

    onResultReadyCallback(matches);
  }

  resolveSymbol(
    symbolName: string,
    onSymbolResolvedCallback: (symbolInfo: LibrarySymbolInfo) => void,
    _onResolveErrorCallback: ErrorCallback
  ): void {
    const clean = cleanSymbolName(symbolName);
    const priceScale = getPriceScale(clean);

    const symbolInfo: LibrarySymbolInfo = {
      name: clean,
      ticker: clean,
      description: `${clean} Spot Market`,
      type: 'crypto',
      session: '24x7',
      exchange: 'BINANCE',
      listed_exchange: 'BINANCE',
      timezone: 'Etc/UTC',
      format: 'price',
      pricescale: priceScale,
      minmov: 1,
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      supported_resolutions: DEFAULT_CONFIGURATION.supported_resolutions || ['1', '5', '15', '60', '240', '1D'],
      intraday_multipliers: ['1', '3', '5', '15', '30', '60', '120', '240'],
      currency_code: 'USDT',
      original_currency_code: 'USDT',
      data_status: 'streaming',
    };

    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
  }

  async getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onHistoryCallback: HistoryCallback,
    onErrorCallback: ErrorCallback
  ): Promise<void> {
    const { from, to, firstDataRequest } = periodParams;
    const cleanSymbol = cleanSymbolName(symbolInfo.name);
    const interval = resolutionToBinanceInterval(resolution);

    const url = new URL('https://api.binance.com/api/v3/klines');
    url.searchParams.append('symbol', cleanSymbol);
    url.searchParams.append('interval', interval);
    url.searchParams.append('startTime', (from * 1000).toString());
    url.searchParams.append('endTime', (to * 1000).toString());
    url.searchParams.append('limit', '1000');

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as Array<[number, string, string, string, string, string, number]>;
      if (!Array.isArray(data) || data.length === 0) {
        onHistoryCallback([], { noData: true });
        return;
      }

      const bars: Bar[] = data.map((d) => ({
        time: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
      }));

      onHistoryCallback(bars, { noData: false });
    } catch (err) {
      console.warn('[AlphaBAG Datafeed] Error loading historical klines, checking fallback:', err);
      if (firstDataRequest) {
        // Return synthetic bar set if network error so chart does not crash
        onHistoryCallback([], { noData: true });
      } else {
        onErrorCallback(err instanceof Error ? err.message : 'Unknown datafeed error');
      }
    }
  }

  subscribeBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onRealtimeCallback: SubscribeBarsCallback,
    subscriberUID: string,
    _onResetCacheNeededCallback: () => void
  ): void {
    const rawClean = cleanSymbolName(symbolInfo.name);
    if (!isValidSymbol(rawClean)) {
      console.warn(`[AlphaBAG Datafeed] Rejected invalid symbol format: ${rawClean}`);
      return;
    }

    // Clean up existing subscription if duplicate
    if (this.activeSubscriptions.has(subscriberUID)) {
      this.unsubscribeBars(subscriberUID);
    }

    // Enforce maximum concurrent active subscriptions limit (max 5)
    if (this.activeSubscriptions.size >= MAX_CONCURRENT_SUBSCRIPTIONS) {
      const oldestKey = this.activeSubscriptions.keys().next().value;
      if (oldestKey) {
        this.unsubscribeBars(oldestKey);
      }
    }

    const cleanSymbol = rawClean.toLowerCase();
    const interval = resolutionToBinanceInterval(resolution);
    const streamName = `${cleanSymbol}@kline_${interval}`;

    const sub: ActiveSubscription = {
      ws: null,
      cleanSymbol,
      streamName,
      retryCount: 0,
      closedIntentionally: false,
      callback: onRealtimeCallback,
    };

    this.activeSubscriptions.set(subscriberUID, sub);
    this.connectStream(subscriberUID, sub);
  }

  private connectStream(subscriberUID: string, sub: ActiveSubscription): void {
    if (sub.closedIntentionally) return;

    try {
      const wsUrl = `wss://stream.binance.com:9443/ws/${sub.streamName}`;
      const ws = new WebSocket(wsUrl);
      sub.ws = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg && msg.e === 'kline' && msg.k) {
            const k = msg.k;
            const bar: Bar = {
              time: k.t,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v),
            };
            sub.callback(bar);
            // Reset retry count on successful message
            sub.retryCount = 0;
          }
        } catch (e) {
          console.warn('[AlphaBAG WebSocket] Parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn(`[AlphaBAG WebSocket] Stream error for ${sub.streamName}:`, err);
      };

      ws.onclose = () => {
        if (sub.closedIntentionally) return;
        if (sub.retryCount < 5) {
          const baseDelay = 1000 * Math.pow(2, sub.retryCount);
          const jitter = Math.random() * 500;
          const delay = Math.min(baseDelay + jitter, 10000);
          sub.retryCount++;
          sub.retryTimer = setTimeout(() => {
            if (this.activeSubscriptions.has(subscriberUID)) {
              this.connectStream(subscriberUID, sub);
            }
          }, delay);
        } else {
          console.warn(`[AlphaBAG WebSocket] Max retries (5) reached for ${sub.streamName}`);
          this.activeSubscriptions.delete(subscriberUID);
        }
      };
    } catch (err) {
      console.warn('[AlphaBAG Datafeed] Failed to initialize live WebSocket:', err);
    }
  }

  unsubscribeBars(subscriberUID: string): void {
    const sub = this.activeSubscriptions.get(subscriberUID);
    if (sub) {
      sub.closedIntentionally = true;
      if (sub.retryTimer) {
        clearTimeout(sub.retryTimer);
        sub.retryTimer = undefined;
      }
      if (sub.ws) {
        try {
          if (sub.ws.readyState === WebSocket.OPEN || sub.ws.readyState === WebSocket.CONNECTING) {
            sub.ws.close();
          }
        } catch (_) {}
        sub.ws = null;
      }
      this.activeSubscriptions.delete(subscriberUID);
    }
  }
}

export const alphaBAGDatafeed = new AlphaBAGDatafeed();
