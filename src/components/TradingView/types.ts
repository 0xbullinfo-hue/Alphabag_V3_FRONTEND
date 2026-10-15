// TradingView Charting Library (Advanced Charts) TypeScript Definitions for AlphaBAG

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface LibrarySymbolInfo {
  name: string;
  ticker?: string;
  description: string;
  type: string;
  session: string;
  exchange: string;
  listed_exchange: string;
  timezone: string;
  format: 'price' | 'volume';
  pricescale: number;
  minmov: number;
  fractional?: boolean;
  minmove2?: number;
  has_intraday: boolean;
  supported_resolutions: string[];
  intraday_multipliers?: string[];
  has_seconds?: boolean;
  seconds_multipliers?: string[];
  has_daily?: boolean;
  has_weekly_and_monthly?: boolean;
  has_empty_bars?: boolean;
  has_no_volume?: boolean;
  currency_code?: string;
  original_currency_code?: string;
  data_status?: 'streaming' | 'endofday' | 'pulsed' | 'delayed_streaming';
}

export interface SearchSymbolResultItem {
  symbol: string;
  full_name: string;
  description: string;
  exchange: string;
  ticker: string;
  type: string;
}

export type ResolutionString = string;

export interface PeriodParams {
  from: number;
  to: number;
  countBack?: number;
  firstDataRequest: boolean;
}

export type OnReadyCallback = (configuration: DatafeedConfiguration) => void;
export type ResolveCallback = (symbolInfo: LibrarySymbolInfo) => void;
export type HistoryCallback = (bars: Bar[], meta: { noData?: boolean; nextTime?: number }) => void;
export type ErrorCallback = (reason: string) => void;
export type SubscribeBarsCallback = (bar: Bar) => void;

export interface DatafeedConfiguration {
  supported_resolutions?: ResolutionString[];
  exchanges?: Array<{ value: string; name: string; desc: string }>;
  symbols_types?: Array<{ name: string; value: string }>;
  currency_codes?: string[];
  supports_marks?: boolean;
  supports_timescale_marks?: boolean;
  supports_time?: boolean;
}

export interface IBasicDataFeed {
  onReady: (callback: OnReadyCallback) => void;
  searchSymbols: (
    userInput: string,
    exchange: string,
    symbolType: string,
    onResultReadyCallback: (result: SearchSymbolResultItem[]) => void
  ) => void;
  resolveSymbol: (
    symbolName: string,
    onSymbolResolvedCallback: ResolveCallback,
    onResolveErrorCallback: ErrorCallback,
    extension?: unknown
  ) => void;
  getBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onHistoryCallback: HistoryCallback,
    onErrorCallback: ErrorCallback
  ) => void;
  subscribeBars: (
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onRealtimeCallback: SubscribeBarsCallback,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void
  ) => void;
  unsubscribeBars: (subscriberUID: string) => void;
}

export interface IChartingLibraryWidget {
  onChartReady: (callback: () => void) => void;
  headerReady?: () => Promise<void>;
  remove: () => void;
  chart?: () => unknown;
  setSymbol?: (symbol: string, interval: string, callback?: () => void) => void;
  applyOverrides?: (overrides: Record<string, unknown>) => void;
}

export interface ChartContainerProps {
  symbol?: string;
  interval?: ResolutionString;
  containerId?: string;
  libraryPath?: string;
  chartsStorageUrl?: string;
  chartsStorageApiVersion?: '1.0' | '1.1';
  clientId?: string;
  userId?: string;
  fullscreen?: boolean;
  autosize?: boolean;
  studiesOverrides?: Record<string, unknown>;
  onChartReady?: () => void;
}
