import { describe, expect, it } from 'vitest';
import {
  cleanSymbolName,
  getPriceScale,
  resolutionToBinanceInterval,
  isValidSymbol,
  MAX_CONCURRENT_SUBSCRIPTIONS,
  AlphaBAGDatafeed,
} from '../../src/components/TradingView/datafeed';

describe('TradingView Advanced Charts Datafeed', () => {
  describe('Symbol Cleaning & Formatting', () => {
    it('appends USDT if missing', () => {
      expect(cleanSymbolName('BTC')).toBe('BTCUSDT');
      expect(cleanSymbolName('SOL')).toBe('SOLUSDT');
      expect(cleanSymbolName('PEPE')).toBe('PEPEUSDT');
    });

    it('strips exchange prefix', () => {
      expect(cleanSymbolName('BINANCE:BTCUSDT')).toBe('BTCUSDT');
      expect(cleanSymbolName('BYBIT:ETHUSDT')).toBe('ETHUSDT');
    });

    it('preserves pairs with quote currency', () => {
      expect(cleanSymbolName('ETHBTC')).toBe('ETHBTC');
      expect(cleanSymbolName('BTCUSD')).toBe('BTCUSD');
    });
  });

  describe('Symbol Validation (R10)', () => {
    it('accepts valid alphanumeric symbols of length 2 to 20', () => {
      expect(isValidSymbol('BTCUSDT')).toBe(true);
      expect(isValidSymbol('ETH')).toBe(true);
      expect(isValidSymbol('PEPEUSDT123')).toBe(true);
    });

    it('rejects symbols with special characters, spaces, or script injections', () => {
      expect(isValidSymbol('BTC/USDT')).toBe(false);
      expect(isValidSymbol('BTC USDT')).toBe(false);
      expect(isValidSymbol('<script>')).toBe(false);
      expect(isValidSymbol('BTC@USDT')).toBe(false);
      expect(isValidSymbol('A')).toBe(false); // too short
      expect(isValidSymbol('A'.repeat(21))).toBe(false); // too long
    });
  });

  describe('WebSocket Subscriptions & Concurrency Capping (R10)', () => {
    it('enforces maximum concurrent subscriptions limit of 5 and evicts oldest', () => {
      const datafeed = new AlphaBAGDatafeed();
      const mockCallback = () => {};
      const mockReset = () => {};

      // Subscribe 6 symbols
      for (let i = 1; i <= 6; i++) {
        datafeed.subscribeBars(
          { name: `TOKEN${i}USDT` } as any,
          '60',
          mockCallback,
          `sub-uid-${i}`,
          mockReset
        );
      }

      // Max active subscriptions must never exceed MAX_CONCURRENT_SUBSCRIPTIONS (5)
      expect(datafeed.getActiveSubscriptionsCount()).toBeLessThanOrEqual(MAX_CONCURRENT_SUBSCRIPTIONS);
      expect(datafeed.getActiveSubscriptionsCount()).toBe(5);

      // Clean up all
      for (let i = 1; i <= 6; i++) {
        datafeed.unsubscribeBars(`sub-uid-${i}`);
      }
      expect(datafeed.getActiveSubscriptionsCount()).toBe(0);
    });

    it('rejects invalid symbol from opening a WebSocket subscription', () => {
      const datafeed = new AlphaBAGDatafeed();
      datafeed.subscribeBars(
        { name: 'INVALID#SYMBOL!@' } as any,
        '60',
        () => {},
        'sub-invalid',
        () => {}
      );
      expect(datafeed.getActiveSubscriptionsCount()).toBe(0);
    });
  });

  describe('Price Scale Resolution', () => {
    it('assigns high precision (8 decimals) to micro-cap meme tokens', () => {
      expect(getPriceScale('PEPEUSDT')).toBe(100000000);
      expect(getPriceScale('SHIBUSDT')).toBe(100000000);
      expect(getPriceScale('BONKUSDT')).toBe(100000000);
    });

    it('assigns 4 decimals to mid-price tokens', () => {
      expect(getPriceScale('DOGEUSDT')).toBe(10000);
      expect(getPriceScale('XRPUSDT')).toBe(10000);
      expect(getPriceScale('SUIUSDT')).toBe(10000);
    });

    it('assigns standard 2 decimals to major tokens', () => {
      expect(getPriceScale('BTCUSDT')).toBe(100);
      expect(getPriceScale('ETHUSDT')).toBe(100);
      expect(getPriceScale('SOLUSDT')).toBe(100);
    });
  });

  describe('Interval Resolution Mapping', () => {
    it('maps TradingView minutes to Binance intervals', () => {
      expect(resolutionToBinanceInterval('1')).toBe('1m');
      expect(resolutionToBinanceInterval('5')).toBe('5m');
      expect(resolutionToBinanceInterval('15')).toBe('15m');
      expect(resolutionToBinanceInterval('60')).toBe('1h');
      expect(resolutionToBinanceInterval('240')).toBe('4h');
      expect(resolutionToBinanceInterval('1D')).toBe('1d');
      expect(resolutionToBinanceInterval('1W')).toBe('1w');
      expect(resolutionToBinanceInterval('1M')).toBe('1M');
    });
  });

  describe('Datafeed Life-Cycle', () => {
    const datafeed = new AlphaBAGDatafeed();

    it('provides configuration on ready', async () => {
      const config = await new Promise<any>((resolve) => {
        datafeed.onReady((c) => resolve(c));
      });
      expect(config.supported_resolutions).toContain('1');
      expect(config.supported_resolutions).toContain('60');
      expect(config.supported_resolutions).toContain('1D');
      expect(config.exchanges?.length).toBeGreaterThan(0);
    });

    it('resolves symbol metadata with correct pricescale and 24x7 session', async () => {
      const symbolInfo = await new Promise<any>((resolve) => {
        datafeed.resolveSymbol('BINANCE:PEPEUSDT', (info) => resolve(info), () => {});
      });
      expect(symbolInfo.name).toBe('PEPEUSDT');
      expect(symbolInfo.pricescale).toBe(100000000);
      expect(symbolInfo.session).toBe('24x7');
      expect(symbolInfo.timezone).toBe('Etc/UTC');
      expect(symbolInfo.has_intraday).toBe(true);
    });
  });
});
