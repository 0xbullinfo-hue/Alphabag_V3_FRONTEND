import { isGaMeasurementId, detectAiReferrer } from './analytics';

test('accepts GA4 measurement IDs and rejects placeholders', () => {
  expect(isGaMeasurementId('G-AB12CD34')).toBe(true);
  expect(isGaMeasurementId('G-XXXXXXXXXX')).toBe(false);
  expect(isGaMeasurementId('UA-12345-1')).toBe(false);
  expect(isGaMeasurementId(undefined)).toBe(false);
});

test('detects AI answer engine referrers correctly', () => {
  expect(detectAiReferrer('https://chatgpt.com/c/12345')).toBe('chatgpt');
  expect(detectAiReferrer('https://chat.openai.com/')).toBe('chatgpt');
  expect(detectAiReferrer('https://www.perplexity.ai/search?q=crypto')).toBe('perplexity');
  expect(detectAiReferrer('https://claude.ai/chat/abc')).toBe('claude');
  expect(detectAiReferrer('https://gemini.google.com/app')).toBe('gemini');
  expect(detectAiReferrer('https://copilot.microsoft.com/')).toBe('copilot');
  expect(detectAiReferrer('https://www.google.com/search?q=alphabag')).toBe(null);
  expect(detectAiReferrer('https://twitter.com/')).toBe(null);
  expect(detectAiReferrer('')).toBe(null);
});
