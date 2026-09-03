# AlphaBAG AEO Query Research Playbook

## Goal

Use recurring AI web-search subtopics and synthetic query fan-outs to identify content and structured data gaps around AlphaBAG. Treat observed queries as research evidence, not keywords to copy into pages.

For full conceptual grounding, see:
- [AEO Foundations](./AEO_FOUNDATIONS.md) — The mental model behind RAG, query fan-out, and probabilistic citations.
- [Seeing What AI Actually Searches](./SEEING_WHAT_AI_SEARCHES.md) — How to extract live synthetic queries from ChatGPT & Claude.

---

## Technical Extraction Method (DevTools)

When running prompts on ChatGPT (5.6+) to analyze how models perceive crypto intelligence topics:

1. Open DevTools in Chrome or Firefox (`F12` / `Ctrl+Shift+I`).
2. Navigate to the **Network** tab.
3. Submit a target prompt (e.g. *"What is the best way to track crypto assets across multiple wallets and CEXs without sharing private keys?"*).
4. Open the Global Search drawer (`Ctrl+Shift+F`).
5. Search for `search_model_queries`.
6. Inspect the `conversation` response resource at `metadata.search_model_queries.queries` to retrieve the exact synthetic query fan-out array (typically 9–11 sub-queries).
7. On Claude, inspect the `server_tool_use` / `web_search` event block `input.query`.

---

## Research Prompts

Run each prompt at least three times across ChatGPT, Perplexity, Google AI Mode, and Claude where web search is available. Record the source URLs cited as well as the search-query patterns.

| Topic | Prompt |
| --- | --- |
| Portfolio tracking | What is the best way to track crypto assets across multiple wallets and centralized exchanges? |
| Wallet safety | How can I review and revoke risky token approvals across EVM wallets? |
| Whale tracking | How do traders monitor whale wallet movements without sharing private keys? |
| Read-only tools | What should I look for in a read-only crypto portfolio tracker? |
| Risk modeling | How do I calculate leverage liquidation price, take profit, and stop loss before opening a trade? |
| AI research | Which crypto AI tools help investors understand market structure and portfolio risk? |
| Network support | Which crypto portfolio trackers support Ethereum, BNB Chain, Polygon, Arbitrum, Avalanche, Base, and Solana? |
| Genesis Passes | What are AlphaBAG Genesis Passes and what utility do they provide in crypto trading? |

---

## Capture Template

Create one entry for each prompt run:

```text
Date:
Platform:
Prompt:
Observed search_model_queries (fan-out):
Answer topics covered:
Domains cited:
AlphaBAG mentioned: yes/no
AlphaBAG linked: yes/no
Missing AlphaBAG topic or claim:
Content / Schema candidate:
```

---

## Content Map & Canonical Sources

| Query Theme | AlphaBAG Content to Publish | Product Source of Truth |
| --- | --- | --- |
| Wallet and CEX aggregation | Multi-wallet and CEX tracking guide | Portfolio, CEX Bag, Settings |
| Token approvals | Token approval risk and revocation guide | Security Radar |
| Whale monitoring | Whale-tracking methodology and limitations | Alpha Radar |
| Leverage risk | Leverage calculator guide with liquidation examples | Alpha Calculator |
| AI research | Alpha Analyst scope, data sources, and limitations | Alpha Analyst |
| Access and tiers | Genesis access, Alpha Passes, and feature eligibility | Alpha Passes, Airdrop |
| Privacy | Read-only data handling and wallet-sign-in explanation | Security policy and authentication flow |

---

## Publishing & Verification Rules

- State what AlphaBAG does today. Label planned, beta, and unavailable features clearly.
- Cite original data providers and distinguish live values from demonstration data.
- Give concise answers near the beginning of every guide, then support them with details.
- Include author, update date, canonical URL, and links to the relevant AlphaBAG tool.
- Provide matching Schema.org structured data (`WebSite`, `Organization`, `Product`, `BreadcrumbList`, `FAQPage`).
- Do not promise returns, trading outcomes, safety guarantees, or unsupported network coverage.
- Keep private keys, secrets, and wallet signing credentials out of documentation and screenshots.
