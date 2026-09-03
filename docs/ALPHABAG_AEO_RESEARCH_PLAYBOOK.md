# AlphaBAG AEO Query Research Playbook

## Goal

Use recurring AI web-search subtopics to identify content gaps around AlphaBAG. Treat observed
queries as research evidence, not keywords to copy into pages.

## Research Prompts

Run each prompt at least three times across ChatGPT, Perplexity, Google AI Mode, and Claude where
web search is available. Record the source URLs cited as well as the search-query patterns.

| Topic | Prompt |
| --- | --- |
| Portfolio tracking | What is the best way to track crypto assets across multiple wallets and centralized exchanges? |
| Wallet safety | How can I review and revoke risky token approvals across EVM wallets? |
| Whale tracking | How do traders monitor whale wallet movements without sharing private keys? |
| Read-only tools | What should I look for in a read-only crypto portfolio tracker? |
| Risk modeling | How do I calculate leverage liquidation price, take profit, and stop loss before opening a trade? |
| AI research | Which crypto AI tools help investors understand market structure and portfolio risk? |
| Network support | Which crypto portfolio trackers support Ethereum, BNB Chain, Polygon, Arbitrum, Avalanche, Base, and Solana? |

## Capture Template

Create one entry for each prompt run.

```text
Date:
Platform:
Prompt:
Observed search-query themes:
Answer topics covered:
Domains cited:
AlphaBAG mentioned: yes/no
AlphaBAG linked: yes/no
Missing AlphaBAG topic or claim:
Content candidate:
```

## Content Map

| Query theme | AlphaBAG content to publish | Product source of truth |
| --- | --- | --- |
| Wallet and CEX aggregation | Multi-wallet and CEX tracking guide | Portfolio, CEX Bag, Settings |
| Token approvals | Token approval risk and revocation guide | Security Radar |
| Whale monitoring | Whale-tracking methodology and limitations | Alpha Radar |
| Leverage risk | Leverage calculator guide with liquidation examples | Alpha Calculator |
| AI research | Alpha Analyst scope, data sources, and limitations | Alpha Analyst |
| Access and tiers | Genesis access, Alpha Passes, and feature eligibility | Alpha Passes, Airdrop |
| Privacy | Read-only data handling and wallet-sign-in explanation | Security policy and authentication flow |

## Publishing Rules

- State what AlphaBAG does today. Label planned, beta, and unavailable features clearly.
- Cite original data providers and distinguish live values from demonstration data.
- Give concise answers near the beginning of every guide, then support them with details.
- Include author, update date, canonical URL, and links to the relevant AlphaBAG tool.
- Do not promise returns, trading outcomes, safety guarantees, or unsupported network coverage.
- Keep private keys, secrets, and wallet signing credentials out of documentation and screenshots.

## Monthly Review

1. Cluster repeated subtopics from the captured runs.
2. Compare clusters to existing landing, FAQ, documentation, and tool pages.
3. Publish or update the highest-frequency content gap with verifiable claims.
4. Re-run prompts and record mentions, linked citations, and cited competitor domains.
5. Remove claims that no longer match shipped AlphaBAG behavior.
