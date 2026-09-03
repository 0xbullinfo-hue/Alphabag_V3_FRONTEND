# AEO Foundations: How AI Search Actually Works

**Purpose:** The mental model behind Answer Engine Optimization (AEO). Understand how AI
answer engines find, read, and cite content so the tactics in the rest of the track make sense.
This is the "why" guide; the others are the "how".

> Based on Ahrefs' "AI SEO Course for Beginners: Complete AEO Tutorial" (Sam Oh). Stats reflect
> that course and move fast, so treat numbers as direction, not gospel.

## What AEO is (and what it is not)

**AEO (Answer Engine Optimization)** is making your content visible and useful to systems that
deliver a synthesized answer instead of a list of links: Google AI Overviews and AI Mode, ChatGPT,
Perplexity, Copilot, Gemini, Claude. You will also see **GEO** (Generative Engine Optimization) and
**LLMO** (Large Language Model Optimization). Same discipline, different label. This track uses AEO.

AEO does not replace SEO. It sits on top of it. Quality content, authority, and technical health
still matter; AEO is the layer you add so you stay visible as discovery moves into AI conversations.

| | Traditional SEO | AEO |
|---|---|---|
| You optimize for | A ranking position in a list of links | A mention inside a synthesized answer |
| Unit of competition | One page vs one page for one keyword | Topic-wide coverage across many sub-queries |
| Stability | Rankings are fairly stable day to day | Citations are probabilistic: same prompt, different citations |
| User action | User clicks a result and lands on your site | AI may answer directly; the user never clicks |
| Success metric | Position, clicks, organic traffic | Mentions, citations, share of voice, brand recall |

A useful gut check: AI search is growing fast, but Google still handles billions of searches a day
and organic traffic still drives real value. The move is to play both games, not to abandon one.

## Two sources: training data vs live retrieval

AI systems answer from two very different places, and the difference explains almost everything:

1. **Training data.** The static snapshot the model was trained on. Refreshed only every few months.
   If you launched last week, training data does not know you exist.
2. **Real-time retrieval (RAG).** When a question needs fresh or specific information, the model
   searches the web, pulls back pages, reads them, and grounds its answer in what it found.

So there are two levers you can pull:
- Be mentioned widely enough across the web that you become part of the training data itself.
- Make sure your content surfaces during live retrieval, which is exactly what good SEO already helps with.

## Query fan-out: one prompt becomes many searches

Search used to be one-to-one (one query, one result set). AI flipped it to **one-to-many**: a single
prompt is expanded into a batch of synthetic sub-queries that run in the background. This is
**query fan-out**.

- A typical prompt triggers roughly 9 to 11 fan-out queries, sometimes up to 28.
- ChatGPT's deep research mode once ran 420 searches for a single question about buying a phone case.
- Fan-out queries are synthetic and inconsistent. The same prompt can fan out differently each time,
  and over 95% of these sub-queries have zero search volume because no human would ever type them.

The takeaway is not "here is a new keyword list". It is that you need **topic-wide coverage**, not
single-keyword optimization. A "how to start a podcast" page that skips equipment, hosting, and
promotion loses to one that covers the whole topic.

## Citations are a probability, not a ranking

AI output is probabilities stacked on probabilities: training patterns, plus signals from retrieved
pages, plus a bit of built-in randomness. Ask the same question five times and you might get cited
three of them. There is no fixed position, which is why we talk about **AI visibility** rather than
AI rankings.

| Factor | Why it matters |
|---|---|
| Consensus | When many sources say the same thing about you, the model is more likely to repeat it |
| Freshness | AI-cited content is around 25% fresher on average than what ranks in a normal search result |
| Authority | A large share of AI citations come from pages that already rank well, though that share is dropping as AI pulls more from YouTube and Reddit |
| Non-ranking pages still get cited | Some pages cited in AI Overviews do not rank in Google's top 100 at all, so there is real room for brands that are not search-dominant |

## Platforms do not agree with each other

Out of the top 50 most-cited domains across Google AI Overviews, ChatGPT, and Perplexity, only about
7 show up on all three. Treat them as one target and you leave visibility on the table.

| Platform | What it tends to favor |
|---|---|
| Google AI Overviews | Authoritative, established sites: health, finance, encyclopedic content, Google properties |
| ChatGPT | Publishers and media: Reddit, Wikipedia, Amazon, Forbes, partly from OpenAI's licensing deals |
| Perplexity | Most aligned with traditional Google rankings, so strong SEO carries over well |
| Google AI Mode | Different from AI Overviews despite the shared brand: leans on YouTube, Quora, and social |

## Three outcomes, not win or lose

"Winning" AI search is not binary. Any given answer lands you in one of three states:

1. **Cited and linked.** The answer links to your page. Best case for traffic, easiest to measure.
2. **Mentioned, not linked.** Your brand name appears with no link. No click, but real brand recall,
   which is word-of-mouth at scale.
3. **Not there at all.** You are not in the conversation.

Only around 28% of AI mentions include a link, so most of the time your brand comes up without one.
Unlinked mentions still compound: in a study of 75,000 brands, branded web mentions correlated with
AI Overview visibility more strongly than backlinks or domain rating. Every credible mention next to
a topic is another training example, whether or not anyone clicks.

## The Lazy Developer's lane

- **Seeing What AI Actually Searches**: read the real fan-out queries in your browser.
- **Technical AEO**: let AI crawlers in, serve them real HTML, and stop losing traffic to hallucinated 404s.
- **Writing Structure That Gets Cited**: structure content so a model can lift it cleanly.
- **Measuring AI Visibility**: the traces of AI traffic you can actually track.
