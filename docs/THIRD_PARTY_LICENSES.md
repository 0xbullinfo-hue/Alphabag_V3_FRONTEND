# Third-Party Licenses & Proprietary Assets

## TradingView Advanced Charts (Charting Library)

AlphaBAG integrates with the TradingView Advanced Charts library for professional technical analysis.

### License Requirements & Proprietary Status
- **License Type:** Proprietary Commercial License (TradingView Inc.)
- **Repository Policy:** The Charting Library standalone bundle (`charting_library.standalone.js`, language packs, CSS, and related internal modules) is proprietary intellectual property of TradingView Inc.
- **Distribution Rule:** In accordance with TradingView's licensing agreement, these proprietary assets **must never be committed to public or open-source version control repositories**.
- **Git Ignore:** The folder `public/charting_library/` is excluded via `.gitignore`.
- **Deployment:** For production deployments, authorized license holders must download the official bundle from TradingView's private repository and stage it into `public/charting_library/` as part of the secure CI/CD build pipeline or self-hosted deployment artifacts.
- **Fallback Mode:** When the library assets are not present in `public/charting_library/`, AlphaBAG gracefully degrades to an embedded iframe fallback view with custom Binance Kline streaming, ensuring zero downtime or application crashes.

### Datafeed & WebSocket Architecture
- The custom datafeed (`alphaBAGDatafeed`) communicates directly with public Binance Spot REST endpoints (`https://api.binance.com/api/v3/klines`) and Binance WebSocket streams (`wss://stream.binance.com:9443/ws/`).
- Symbol names are validated strictly against `/^[A-Z0-9]{2,20}$/`.
- Active WebSocket connections are strictly bounded to a maximum of 5 concurrent streams, with exponential backoff and jitter on unexpected disconnects.
- Public TradingView demo storage (`https://saveload.tradingview.com`) is explicitly disabled to prevent data leakage and cross-domain tracking.
