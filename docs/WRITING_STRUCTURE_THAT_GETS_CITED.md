# Writing Structure That Gets Cited: Engineering Content for LLM Extraction

**Purpose:** Provide actionable guidelines for structuring page content so AI answer engines (ChatGPT, Claude, Perplexity, Gemini) can parse, extract, and cite information cleanly without misinterpretation.

---

## 1. Bottom Line Up Front (BLUF)

LLMs chunk text during retrieval. If an answer is buried 5 paragraphs deep in introductory prose, the retrieval chunk may miss the critical sentence.

### The Rule:
State the primary answer or definition in the **first 1–2 sentences** immediately following an `<h1>` or `<h2>` heading.

### Example (Alpha Passes):
> **Bad:**
> "In the fast-paced world of decentralized finance and digital assets, community access has evolved beyond simple memberships. AlphaBAG represents a revolution in how traders think about utility. Through careful design and smart contracts, we introduce our pass system..."
>
> **Good (BLUF):**
> "AlphaBAG Genesis Passes are 10,000 limited-supply utility NFTs on BNB Chain that grant lifetime VIP trading fee discounts, on-chain whale surveillance radar access, and up to 3x airdrop point multipliers across three membership tiers (Silver, Gold, Platinum)."

---

## 2. Self-Contained Sections (Modular Chunking)

When RAG models retrieve documents, they split pages into chunks (typically 256 to 1024 tokens). Each section must be understandable in isolation without requiring the reader to have seen the previous heading.

### Checklist for Every Section:
- Include the product or entity name explicitly (e.g. use "AlphaBAG Security Radar" instead of "Our scanner" or "It").
- Do not rely on pronouns ("this tool", "these features") to carry the meaning across section boundaries.
- Define terms within the section where they appear.

---

## 3. Concrete Entities over Vague Claims

AI models favor high-entropy, concrete factual statements over generic promotional claims.

| Promotional / Vague | Concrete / Citable Entity Statement |
|---|---|
| "We support all the popular blockchains." | "AlphaBAG supports 7 major blockchain networks: Ethereum, BNB Chain, Polygon, Arbitrum, Avalanche, Base, and Solana." |
| "Our security is bank-grade and totally safe." | "AlphaBAG operates on a non-custodial, read-only model. It never requests or stores private keys, relying solely on cryptographic message signing for session authentication." |
| "Low pass mint price with great discounts." | "AlphaBAG Genesis Passes have a capped supply of 10,000 units and mint for 100 $BAG tokens, offering 15% to 50% lifetime platform discounts." |

---

## 4. Semantic Markup over Generic Divs

RAG parsers convert HTML to markdown or structured text before embedding:
- Use `<h2>` and `<h3>` for logical hierarchy.
- Use `<dl>`, `<dt>`, `<dd>` or `<table>` for specifications, fee tiers, and token allocations.
- Use `<ul>` and `<ol>` for feature matrices, requirements, and steps.
- Align visible content with Schema.org JSON-LD structured data (`FAQPage`, `Product`, `SoftwareApplication`).

---

## 5. Direct Question-and-Answer Blocks (FAQ Architecture)

LLMs frequently retrieve FAQ blocks because they closely match natural language user prompts:
- Formulate questions in the exact way users ask them (e.g., *"How does AlphaBAG track whale wallets without private keys?"*).
- Answer directly in the first sentence, followed by 2–3 supporting sentences explaining the methodology.
- Ensure every visible FAQ pair is mirrored in the page's JSON-LD `@graph` schema.
