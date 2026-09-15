// SPDX-License-Identifier: MIT
// AlphaBAG V3 — Client-side AI service
// Calls secure backend endpoint /api/ai/chat grounded in CanonicalPortfolioService.

import { api } from '../services/api';

export interface GroundedAiResponse {
  answer: string;
  sources: string[];
  dataAgeMs: number;
  stale: boolean;
  grounded: boolean;
  rejectedNumbers?: string[];
  blocked?: boolean;
}

export async function chatWithGroundedAi(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<GroundedAiResponse> {
  const response = await api.post<GroundedAiResponse>('/api/ai/chat', {
    message,
    history,
  });
  return response.data;
}

export default chatWithGroundedAi;
