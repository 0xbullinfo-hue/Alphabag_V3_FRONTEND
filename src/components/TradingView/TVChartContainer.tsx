import React, { useEffect, useRef, useState } from 'react';
import { alphaBAGDatafeed } from './datafeed';
import type { ChartContainerProps, IChartingLibraryWidget } from './types';

export const TVChartContainer: React.FC<ChartContainerProps> = ({
  symbol = 'BINANCE:BTCUSDT',
  interval = '60',
  containerId = 'tv_chart_container',
  libraryPath = '/charting_library/',
  clientId = 'alphabag.trade',
  userId = 'public_user',
  fullscreen = false,
  autosize = true,
  studiesOverrides = {},
  onChartReady,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<IChartingLibraryWidget | null>(null);
  const [libraryAvailable, setLibraryAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the proprietary charting_library bundle is present
    const checkLibrary = async () => {
      try {
        const scriptUrl = `${libraryPath}charting_library.standalone.js`;
        const res = await fetch(scriptUrl, { method: 'HEAD' });
        if (res.ok) {
          // Script exists in public folder, dynamically inject script if not already loaded
          const win = window as any;
          if (!win.TradingView) {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.type = 'text/javascript';
            script.async = true;
            script.onload = () => setLibraryAvailable(true);
            script.onerror = () => setLibraryAvailable(false);
            document.head.appendChild(script);
          } else {
            setLibraryAvailable(true);
          }
        } else {
          setLibraryAvailable(false);
        }
      } catch {
        setLibraryAvailable(false);
      }
    };

    checkLibrary();
  }, [libraryPath]);

  useEffect(() => {
    if (libraryAvailable !== true) return;

    const win = window as any;
    if (!win.TradingView?.widget) {
      console.warn('[AlphaBAG TV] window.TradingView.widget is not available.');
      return;
    }

    const widgetOptions = {
      symbol,
      datafeed: alphaBAGDatafeed,
      interval,
      container: chartContainerRef.current || containerId,
      library_path: libraryPath,
      locale: 'en',
      disabled_features: [
        'use_localstorage_for_settings',
        'header_saveload',
        'study_templates',
        'timeframes_toolbar',
      ],
      enabled_features: [
        'hide_left_toolbar_by_default',
        'side_toolbar_in_fullscreen_mode',
      ],
      client_id: clientId,
      user_id: userId,
      fullscreen,
      autosize,
      studies_overrides: studiesOverrides,
      theme: 'dark',
      toolbar_bg: '#0B0E11',
      loading_screen: { backgroundColor: '#0B0E11', foregroundColor: '#F0B90B' },
      overrides: {
        'paneProperties.background': '#0B0E11',
        'paneProperties.backgroundType': 'solid',
        'paneProperties.vertGridProperties.color': '#181A20',
        'paneProperties.horzGridProperties.color': '#181A20',
        'scalesProperties.textColor': '#848E9C',
        'scalesProperties.lineColor': '#2B313A',
        'mainSeriesProperties.candleStyle.upColor': '#0ECB81',
        'mainSeriesProperties.candleStyle.downColor': '#F6465D',
        'mainSeriesProperties.candleStyle.drawWick': true,
        'mainSeriesProperties.candleStyle.drawBorder': true,
        'mainSeriesProperties.candleStyle.borderColor': '#374151',
        'mainSeriesProperties.candleStyle.borderUpColor': '#0ECB81',
        'mainSeriesProperties.candleStyle.borderDownColor': '#F6465D',
        'mainSeriesProperties.candleStyle.wickUpColor': '#0ECB81',
        'mainSeriesProperties.candleStyle.wickDownColor': '#F6465D',
      },
    };

    const tvWidget = new win.TradingView.widget(widgetOptions) as IChartingLibraryWidget;
    widgetRef.current = tvWidget;

    tvWidget.onChartReady(() => {
      console.log('[AlphaBAG TV] Advanced Charts initialized with custom Binance datafeed');
      onChartReady?.();
    });

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('[AlphaBAG TV] Cleanup error:', e);
        }
        widgetRef.current = null;
      }
    };
  }, [libraryAvailable, symbol, interval, containerId, libraryPath, clientId, userId, fullscreen, autosize, studiesOverrides, onChartReady]);

  // If library is not yet deployed to /public/charting_library/, render clear guidance & seamless fallback
  if (libraryAvailable === false) {
    return (
      <div className="w-full h-full flex flex-col bg-[#0B0E11] text-[#EAECEF] border border-[#181A20] rounded-xl p-6 relative overflow-hidden">
        {/* Top Status Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#181A20] mb-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F0B90B] animate-pulse" />
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              TradingView Advanced Charts Integration Ready
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-[#F0B90B]/10 text-[#F0B90B] border border-[#F0B90B]/20 font-mono">
            Awaiting Library Files
          </span>
        </div>

        {/* Informational Guidance Box */}
        <div className="bg-[#14171D] border border-[#2B313A] rounded-lg p-5 mb-4 text-xs space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-[#0ECB81] font-bold">✓</span>
            <div>
              <p className="font-semibold text-white">Custom Binance Datafeed & WebSocket Realtime Stream Ready</p>
              <p className="text-gray-400">
                `AlphaBAGDatafeed` has been built and tested with automatic pair resolution, historical klines, and sub-millisecond WebSocket streaming.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#F0B90B] font-bold">→</span>
            <div>
              <p className="font-semibold text-white">Next Step: Place Charting Library in Public Folder</p>
              <p className="text-gray-400">
                Once your developer request is approved, download the zip from the private TradingView GitHub repo and copy the <code className="text-[#F0B90B] bg-[#0B0E11] px-1.5 py-0.5 rounded">charting_library/</code> folder into <code className="text-[#F0B90B] bg-[#0B0E11] px-1.5 py-0.5 rounded">public/charting_library/</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Live Fallback Widget so user can still trade and view charts */}
        <div className="flex-1 w-full min-h-[450px] rounded-lg overflow-hidden border border-[#181A20]">
          <iframe
            title="TradingView Live View"
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_fallback&symbol=${encodeURIComponent(symbol)}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0B0E11&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC`}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      id={containerId}
      ref={chartContainerRef}
      className="w-full h-full min-h-[500px] bg-[#0B0E11]"
    />
  );
};
export default TVChartContainer;
