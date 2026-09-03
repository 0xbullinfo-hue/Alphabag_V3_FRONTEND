# Technical AEO: The Crawler-Access & Rendering Layer

**Purpose:** Ensure AI answer engines (ChatGPT, Claude, Perplexity, Google AI Overviews) can crawl, render, and index AlphaBAG without hitting WAF blocks, empty JavaScript shells, or hallucinated 404 dead ends.

---

## 1. The Crawler-Access Layer (`robots.txt`)

AI search engines deploy distinct user-agents for training data crawls versus real-time live retrieval (RAG). To surface in live answers, your `robots.txt` must explicitly grant access to live retrieval bots while protecting sensitive/private routes.

### Target User-Agents

| Engine | User-Agent | Role |
|---|---|---|
| OpenAI | `GPTBot` | Live search and model training |
| OpenAI | `ChatGPT-User` | Live user browsing actions in ChatGPT |
| Anthropic | `ClaudeBot` & `Claude-Web` | Live search and Claude extraction |
| Perplexity | `PerplexityBot` | Real-time RAG indexer |
| Google | `Google-Extended` | Gemini & Vertex AI retrieval |
| Apple | `Applebot-Extended` | Apple Intelligence search & citation |

### AlphaBAG Configuration

In `public/robots.txt`:
```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /settings
Disallow: /profile
Disallow: /portfolio
Disallow: /history
Disallow: /cex-bag
Disallow: /dex-bag
Disallow: /alpha-ai
Disallow: /security

# AI Crawlers
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: https://myalphabag.com/sitemap.xml
```

---

## 2. Dodging Bot Challenges & WAF Traps

Cloudflare, AWS WAF, and similar edge proxies frequently categorize live AI crawlers as unauthorized scrapers and challenge them with JavaScript CAPTCHAs. Because AI retrieval bots run headless without interactive solvers, a CAPTCHA results in an immediate failed fetch.

### Recommended Edge Rules:
1. **Allowlist Verified AI User-Agents:** Ensure WAF Bot Management bypass rules exist for known verified bots (e.g. Cloudflare's "Verified Bot" category includes `GPTBot`, `PerplexityBot`, and `ClaudeBot`).
2. **Do Not Challenge Standard HTTP GETs on Prerendered Static Routes:** Public routes (`/`, `/alpha-passes`, `/genesis`, `/genesis-manifesto`, `/airdrop`) serve pre-rendered HTML and should bypass aggressive rate-limiting.
3. **Verify Reverse DNS:** Legitimate bots from OpenAI and Google resolve back to `.openai.com` and `.googlebot.com`.

---

## 3. Serving Real HTML (Solving the Non-JS Crawler Problem)

Many AI crawlers (and social link preview bots) either do not execute JavaScript or have strict rendering timeouts (under 2–3 seconds). A standard React SPA serving an empty `<div id="root"></div>` returns zero extractable text.

### AlphaBAG Solution:
- Build-time prerendering via `scripts/prerender.mjs` transforms every public route into a complete, standalone `index.html` file in `dist/`.
- Meta tags, canonical links, and Schema.org `@graph` JSON-LD are fully populated in the raw server response.
- Hydration occurs client-side without jarring layout shifts.

---

## 4. Fixing Hallucinated 404s

LLMs generate answers probabilistically and frequently synthesize plausible URLs that do not exist in the sitemap (e.g., `/pricing`, `/whitepaper`, `/passes`, `/tokenomics`, `/docs`). When a user or crawler follows these links, a standard 404 breaks the citation loop.

### Mitigation Strategies:
1. **Predictive Route Aliases:** Map frequent hallucinations to canonical routes in `App.tsx`:
   - `/passes` → `/alpha-passes`
   - `/pricing` → `/alpha-passes`
   - `/whitepaper` → `/genesis-manifesto`
   - `/tokenomics` → `/genesis-manifesto`
   - `/quests` → `/airdrop`
2. **Context-Rich 404 Fallback:** If an unmapped URL is requested, render an informative page providing direct links to key public hubs (`Alpha Passes`, `Genesis Terminal`, `Airdrop`, `Calculator`).

---

## 5. The Honest Truth About `llms.txt`

`llms.txt` is an emerging standard (see https://llmstxt.org/) designed to give LLMs a clean, markdown-based summary of your site.

### Reality Check:
- **What it does:** Provides a factual reference sheet for RAG systems, developers, and autonomous agents crawling your domain.
- **What it does NOT do:** It does NOT force an LLM to cite you or override live search results.
- **Best Practice:** Keep `llms.txt` focused on concrete facts: company definition, non-custodial model, network coverage, tokenomics, pass supply, and official links.
