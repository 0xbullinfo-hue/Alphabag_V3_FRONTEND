# Measuring AI Visibility: Tracking the Traces of Answer Engine Traffic

**Purpose:** Provide the measurement framework for Answer Engine Optimization (AEO). Because AI answer engines do not offer fixed search console position reports, visibility must be measured via inbound AI referrals, server-side bot telemetry, and first-party attribution.

---

## 1. Tracking AI Referrals in Google Analytics 4 (GA4)

When an AI engine synthesizes an answer that includes a clickable citation, user clicks carry the AI platform's referrer header.

### Target Referrer Signatures:
- `chatgpt.com` / `chat.openai.com` (ChatGPT)
- `perplexity.ai` (Perplexity)
- `claude.ai` (Claude)
- `gemini.google.com` (Google Gemini)
- `copilot.microsoft.com` / `edgeservices.bing.com` (Microsoft Copilot)
- `poe.com` / `you.com`

### Client-Side Telemetry Implementation:
In [`src/lib/analytics.ts`](../src/lib/analytics.ts), AlphaBAG automatically inspects `document.referrer` on initial page load. When a known AI engine is identified:
1. It dispatches a custom GA4 event:
   ```javascript
   gtag('event', 'ai_referral', {
     ai_platform: 'chatgpt', // or 'perplexity', 'claude', etc.
     landing_page: window.location.pathname,
     referrer_url: document.referrer
   });
   ```
2. It persists the acquisition source into `localStorage` (`alphabag_ai_attribution`) so downstream conversions (e.g. wallet connects, Genesis Pass mints) maintain attribution back to the originating AI referral.

---

## 2. GA4 Custom Channel Grouping for AI Search

To visualize AI traffic in standard GA4 reports:

1. In Google Analytics, navigate to **Admin → Data display → Channel groups**.
2. Select or clone your Default Channel Group.
3. Click **Add new channel** and name it `AI Search`.
4. Set rule logic:
   - `Source` matches regex: `.*(chatgpt|openai|perplexity|claude|gemini|copilot).*`
   OR
   - `Event name` equals `ai_referral`
5. Save the channel grouping.
6. Now you can view **Reports → Acquisition → Traffic acquisition** grouped by `AI Search` alongside Organic Search, Direct, and Referral.

---

## 3. Server Log Analysis (AI Bot Hits)

Before users visit from AI citations, AI bots crawl your site. Monitoring server access logs provides leading indicators of model interest.

### Log Grep Examples:
```bash
# OpenAI GPTBot crawls
grep -i "GPTBot" access.log | wc -l

# Perplexity crawler hits
grep -i "PerplexityBot" access.log | wc -l

# Anthropic ClaudeBot hits
grep -i "ClaudeBot" access.log | wc -l
```

### Metrics to Track:
- **Crawl frequency:** Spikes in bot hits usually precede appearance in synthesized answers.
- **Error rates:** Ensure AI bot user-agents receive HTTP 200 responses on all public canonical routes.
- **Top URLs requested:** Identify which pages AI models are actively reading and ground-checking.

---

## 4. Self-Reported Attribution ("How Did You Hear About Us?")

Because approximately 72% of AI mentions do not result in direct link clicks (the user reads the synthesized recommendation, then searches for or navigates directly to the brand), server logs and referrer headers miss a significant portion of AI influence.

### Strategy:
- Include "AI Search (ChatGPT, Perplexity, Claude)" as an option in user onboarding surveys, feedback prompts, and community join flows.
- Correlate spikes in direct traffic with mentions in major LLM prompts and community discussions.
