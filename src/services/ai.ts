import { api } from './api';

export interface AssistantReply {
  answer: string;
  sources: string[];
  dataAgeMs: number;
  stale: boolean;
  grounded: boolean;
  blocked?: boolean;
}

/**
 * All inference is proxied through the backend so:
 *   1. the API key is never exposed,
 *   2. responses are grounded in real portfolio data,
 *   3. rate limiting + injection defence run server-side.
 */
export async function ask(message: string, history: Array<{ role: string; content: string }> = []): Promise<AssistantReply> {
  const { data } = await api.post<AssistantReply>('/api/ai/chat', { message, history });
  return data;
}
