# TradingView Advanced Charts (Charting Library) - Drop-in Guide

This directory is the static bundle target for the **TradingView Advanced Charts** library.

## How to Deploy Once Approved by TradingView:

1. **Accept Access:**
   When TradingView approves your application (usually within 24-48 hours), you will receive an invitation to their private GitHub repository (`tradingview/charting_library`).

2. **Download Bundle:**
   Clone or download the release zip from the repository.

3. **Copy Files Here:**
   Extract and copy the following files directly into this directory (`public/charting_library/`):
   - `charting_library.standalone.js`
   - `charting_library.js` (if present)
   - `bundles/` (directory of styling, language packs, and icons)
   - `datafeeds/` (optional, as AlphaBAG already has `src/components/TradingView/datafeed.ts`)

4. **Directory Structure Verification:**
   ```
   public/
   └── charting_library/
       ├── charting_library.standalone.js
       ├── bundles/
       │   ├── *.js
       │   └── *.css
       └── ...
   ```

5. **Instant Activation:**
   As soon as `charting_library.standalone.js` is placed in this folder, `TVChartContainer.tsx` will automatically detect it and render the full standalone Advanced Charts terminal with full drawing tools, custom indicators, and live WebSocket streaming!
