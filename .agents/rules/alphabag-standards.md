# AlphaBAG Operational Rules & Design Standards

## 1. Mode of Work
- **Always Prompt Git Push:** When any requested task or update is completed and verified, immediately propose or execute the push to Git (`git push origin main`).
- **Always Validate & Build Before Pushing:**
  - TypeScript: `npm run typecheck`
  - Tests: `npx vitest run --pool=threads`
  - Design Standards: `npm run check:design-slop`
  - Build Output: Always run `$env:VITE_API_BASE_URL="https://api.alphabag.pro"; npm run build` before pushing so local `dist/` is always updated and validated with postbuild secret scans. `dist/` is ignored in `.gitignore` for Netlify CI builds.

## 2. Zero AI Design Slop Policy
- NO `backdrop-blur-*`
- NO `font-black` (cap at `font-semibold` / `font-bold`)
- NO sub-11px text (minimum size is `text-[11px]`)
- NO hype emojis (🚀, 🔥, 💎, etc.)
- NO neon glow box-shadows (`shadow-[0_0_...`)
- NO uninstructed badge tags (`LIVE`, `PRO`, lock icons, etc.) on cards, nav, or sidebar
- NO uninstructed promotional sections or marketing fluff

## 3. Visual System
- Background: `#0B0E11`
- Cards/Panels: `#181A20`
- Borders: `#2B313A`
- Primary Accent: `#F0B90B` (Binance Yellow)
- Green/Red: `#0ECB81` / `#F6465D`
- Radii: 4px–8px (`rounded-md`, `rounded-lg`)
- Numbers/Financials: Tabular JetBrains Mono (`.num`, `font-mono`)
