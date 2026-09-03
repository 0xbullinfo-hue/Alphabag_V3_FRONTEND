# Seeing What AI Actually Searches

**Purpose:** ChatGPT only tells you "searching the web". Behind that line it fires several real
search queries. This guide shows you how to read them straight from your browser, what they reveal
about optimizing for topics instead of keywords, and how to do the same for Claude.

> Validated hands-on against ChatGPT 5.6 in July 2026. Several older articles claim this stopped
> working after GPT-5.3. It did not; the data moved, it was not removed. Details below.

## Why this is worth doing

When you ask an AI a question, it does not run your words as a single search. It expands your prompt
into a batch of synthetic sub-queries and runs them in the background. This is **query fan-out**
(covered in the AEO Foundations guide). A typical prompt fans out to roughly 9 to 11 sub-queries.

Reading those sub-queries tells you which subtopics the model thinks are relevant to a question.
That is a content-coverage checklist you could not get any other way. You also see how the model
rewrites casual language into search strings. Two real examples:

- "best place to eat tacos in europe this summer" became `best tacos in Europe restaurants 2026 summer`
- "best family run restaurant on the island of Naxos, Greece" became `best family run restaurant Naxos Greece reviews`

Notice the model adds qualifiers ("reviews", the year), normalizes place names, and drops filler.

## Prerequisite: use Chrome or Firefox, not Safari

The key step relies on a search across all network responses at once. Chrome (and Chromium browsers
like Edge, Brave, and Arc) and Firefox all have this. Safari's Web Inspector does not, so the trick
does not work there.

## The method

1. **Open the site in Chrome** and open DevTools (F12, or Cmd+Option+I on Mac). Go to the Network tab.
2. **Ask a question that forces a live web search.** Something current works well, for example:
   "search the web to tell me the best multi-chain crypto portfolio tracker with whale alerts in 2026".
   Wait for it to finish.
3. **Know that the obvious request is a decoy.** If you click the request named `conversation` and read
   its Response, you will mostly see a `stream_handoff` token, not the queries. In ChatGPT 5.6 the
   answer streams over a separate channel (a resume SSE endpoint or a WebSocket), so inspecting that
   one request misses the data. This handoff is exactly why people thought the trick broke after 5.3.
4. **Use global search instead.** Press Cmd+Option+F (Mac) or Ctrl+Shift+F (Windows/Linux), or click
   the Search tab (the magnifying glass) in DevTools. Search for `search_model_queries`.
5. **Read the hits.** You get results in two places:
   - A JavaScript bundle, referencing `metadata?.search_model_queries?.queries`. That is ChatGPT's own
     frontend code reading the field, which proves it is a live part of the response, not a leftover.
   - The `conversation` resource, holding the actual data:
     `"metadata": { "search_model_queries": { "type": "search_model_queries", "queries": ["best multi chain crypto tracker 2026 reviews"] } }`
6. **The array at `metadata.search_model_queries.queries` is the fan-out.** That is what you came for.

## Doing the same for Claude

Claude shows its search queries directly in the UI, so you rarely need the trick. If you do want to
inspect the traffic, a Claude web search shows up as a `web_search` tool-use block (a
`server_tool_use` block) whose `input.query` field carries the search string. Same idea, different
field name.

## What to actually do with the queries

- **Treat them as a coverage checklist.** Are the subtopics the model searched for covered on your
  page or site? Gaps are your content to-do list.
- **Do not optimize for the exact strings.** They are synthetic, mostly zero search volume, and change
  from run to run. Optimize for the topics they reveal, not the literal phrasing.
- **Run it on your money queries and your competitors'.** It shows you what the model considers the
  relevant subtopics for a question you care about.
