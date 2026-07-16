# AlphaBAG V3 - Real-Time Data & API Integration Guide

This guide lists the professional APIs, WebSocket feeds, and data sources required to upgrade AlphaBAG from static/mock data to fully production-ready, real-time analytics.

---

## 1. DEX Portfolio & Net Worth Tracker
To track token balances, current pricing, and historical portfolio performance across EVM chains and Solana.

| Data Needed | Recommended API Provider | API Endpoint / Method | Purpose |
| :--- | :--- | :--- | :--- |
| **EVM Multi-chain Balances** | **DeBank Cloud API** or **Moralis API** | `/v1/user/token_list`, `/getWalletTokenBalances` | Fetches balances of all ERC-20 tokens, DeFi yields, and staked assets. |
| **Solana Balances** | **Helius API** or **SimpleHash API** | RPC method: `getAssetsByOwner` (DAS API) | Fetches SPL tokens, Solana native balance, and compressed NFTs. |
| **Historical PnL & Charts** | **Covalent API** or **Ankr Multi-chain API** | `/v1/{chain_id}/address/{address}/portfolio/` | Pulls historical balance history over time to plot line charts. |
| **Token Prices (On-Chain)** | **Birdeye API** or **GeckoTerminal API** | `/v1/token/price`, `/networks/{network}/pools` | Real-time prices of long-tail meme coins and L2 tokens not listed on major CEXs. |

---

## 2. CEX Portfolio Tracker
To aggregate balances from centralized exchanges securely via read-only APIs.

| Data Needed | Recommended Method | Library / Service | Purpose |
| :--- | :--- | :--- | :--- |
| **Centralized Balances** | **Direct Exchange API** or **CCXT Library** | `fetch_balance()`, `privateGetAccount` | CCXT standardizes read-only calls for Binance, OKX, Coinbase, Bybit, Kraken, etc. |

---

## 3. Whale Radar & Alpha Feed
To monitor large on-chain token transactions (transfers over $100k) and smart money wallet movements in real time.

| Data Needed | Recommended API Provider | Protocol / Endpoint | Purpose |
| :--- | :--- | :--- | :--- |
| **Live Transfer Alerts** | **Whale Alert API** | `/transaction` (REST/WebSockets) | Subscribes to pre-filtered transfers of high USD values across blockchains. |
| **Custom Whale Wallets** | **QuickNode** or **Alchemy WebSockets** | JSON-RPC filter: `logs` (logs matching Transfer signatures of tracked wallets) | Subscribes to live EVM logs. On receipt, decodes topics to notify the frontend immediately. |
| **Solana Whale Watch** | **Helius Webhooks** | Transaction Webhooks (Type: `SWAP`, `TRANSFER`) | Triggers instantly when tracked addresses execute transactions. |

---

## 4. Markets & Leverage Calculator
To power live orderbooks, candlestick charts, and leverage calculator calculations.

| Data Needed | Recommended API Provider | API Endpoint / Protocol | Purpose |
| :--- | :--- | :--- | :--- |
| **Market Rates & Spreads** | **Binance API** (Spot & Futures) | WebSockets: `wss://stream.binance.com:9443/ws/` | Feeds live spot prices, futures funding rates, mark prices, and leverage limits. |
| **Candlestick Charts** | **TradingView Widget** or **CoinGecko API** | Widget HTML or `/coins/{id}/market_chart` | Displays historical candle charts (1h, 4h, 1d) inside CoinDetail pages. |
| **Orderbook L2 Depth** | **Binance / OKX API** | WebSockets: `<symbol>@depth20@100ms` | Real-time orderbook bids/asks visual lists. |

---

## 5. Gas Bleed & Fee Leakage Auditor
To calculate cumulative fee leaks, gas consumption, and swap slippage.

| Data Needed | Recommended API Provider | API Endpoint / Method | Purpose |
| :--- | :--- | :--- | :--- |
| **EVM Tx History & Gas** | **Etherscan / BscScan / Polygonscan API** | `?module=account&action=txlist` | Fetches raw tx fee metadata (gasUsed * gasPrice) to calculate total gas leakage. |
| **Solana Compute Fees** | **Helius Enhanced Transactions API** | `/v0/addresses/{address}/transactions` | Parses transaction signatures to compute exact SOL fee bleed and bridge actions. |
| **Slippage MEV Audits** | **DEXTools API** or **DexScreener API** | `/token/{address}/trades` | Compares execution prices vs pool price at block timestamp to check slippage leakage. |

---

## 6. Alpha Screener & Social Trends
To screen trending tokens based on volume spikes and Twitter/X momentum.

| Data Needed | Recommended API Provider | API Endpoint / Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Volume & Liquidity Screener**| **DexScreener API** | `/token-profiles/latest`, `/search` | Flags tokens with volume spikes and newly deployed liquidity pools. |
| **Social Narrative Trends** | **LunarCrush API** | `/v3/market/sentiment`, `/influencers` | Pulls social engagement scores, trending hashtags, and influencer buying sentiment. |

---

## 7. AlphaAI (AI Chatbot Analyst)
To power the natural-language portfolio auditor and signal analyzer.

| Data Needed | Recommended API Provider | Model / Endpoint | Purpose |
| :--- | :--- | :--- | :--- |
| **AI LLM Inference** | **Google Gemini API** (Gemini 1.5 Pro) | `/v1beta/models/gemini-1.5-pro:generateContent` | Parses consolidated portfolio metrics and provides trading summaries. |

---

## 8. Consolidated Developer Stack Options (Aggregators)
For teams seeking to consolidate the above list into a minimal, cost-effective setup with fewer API subscriptions.

### A. Unified Web3 Infrastructure (Moralis API)
Replaces DeBank, Birdeye, Etherscan, Covalent, and QuickNode.
*   **Wallet API**: Pulls EVM + Solana balances, DeFi yields, and historical net worth.
*   **Token API**: Feeds prices, metadata, and historical candles for charts.
*   **Streams API**: Powers whale alerts and radar feeds in real time via JSON webhooks.
*   **Transaction API**: Audits historical transaction lists and gas consumption.

### B. Portfolio-Specific Analytics (Mobula API)
Built specifically for all-in-one dashboards.
*   **`/wallet/portfolio`**: Consolidated portfolio values, including holdings and assets.
*   **`/wallet/transactions`**: Complete transaction history with on-chain fee parameters.
*   **`/market/data` & `/market/history`**: Real-time prices, volumes, and candlestick chart data.

### C. Unified Centralized Exchanges (CCXT + Vezgo)
Replaces direct exchange API configurations.
*   **CCXT Library (JS SDK)**: Open-source, client-side, runs directly in the browser. Uses user read-only API keys to load balances for Binance, Bybit, Coinbase, and OKX for free.
*   **Vezgo API (SaaS)**: A single back-end integration that handles connections and aggregates balances for 30+ centralized exchanges.

### D. Infrastructure-First Framework (Alchemy Enhanced APIs)
Replaces node providers (QuickNode/Alchemy standard RPCs) and basic indexers.
*   **Alchemy Token API**: `alchemy_getTokenBalances` reads all token balances in one call.
*   **Alchemy NFT API**: `alchemy_getNFTs` reads profile pictures and digital collectibles.
*   **Alchemy Notify**: Configures webhooks on address activity to feed the whale radar feed live.
*   *Note*: Alchemy does not provide global USD pricing or historical candlestick arrays. Pair Alchemy with **Birdeye API** (for DEX prices) and **CCXT** (for CEX balances) for a complete 3-layer architecture.

---

## 9. Ultimate Recommended Production Stack Summary (The Core Trio)
For the optimal execution of all AlphaBAG V3 features in a production environment:

1.  **Moralis Web3 API (Web3 & Live Feeds Engine)**:
    *   *Features Powered*: My AlphaBAG (DEX Balances, Holdings), Fee Auditor (Gas list, transaction log history), Whale Radar (Live address stream webhooks).
2.  **Birdeye API (Prices & Charting Engine)**:
    *   *Features Powered*: Markets Page (Spot/Futures Price, orderbook depth), Candlestick Charts (Real-time and historical price candles), Alpha Screener (Volume surges, newly deployed pools).
3.  **CCXT JS Library (CEX Portfolios - Free/Local)**:
    *   *Features Powered*: Centralized Exchange Balances (Binance, OKX, Bybit, Kraken).

### Complexity and Cost Comparison
*   **Total API Keys**: 2 (Moralis, Birdeye).
*   **Monthly Budget**: $0 for standard testing/staging (both offer generous developer free tiers).
*   **Maintenance**: Extremely low. Replaces custom multi-node clusters and complex transaction logs parsing pipelines.
