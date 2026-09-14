import { useCallback, useState } from 'react';
import { resolveApiUrl } from '../../services/api';
import { findUnsupportedNumbers, type Fact } from '../../ai/guardrails';

export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    groundingMetadata?: any[];
}

export const useNeuralCore = (portfolioItems: any[], tier: string) => {
    // 1. Initialize messages as an array of objects
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'ai',
            content: 'How can I assist your portfolio today?'
        }
    ]);

    // Initialize inputText for the user's chat input
    const [inputText, setInputText] = useState('');

    // Initialize isStreaming to manage the "Synchronizing neural core..." loading state
    const [isStreaming, setIsStreaming] = useState(false);

    // 2. The sendMessage Function
    const sendMessage = useCallback(async (userMsg: string) => {
        if (!userMsg.trim() || isStreaming) return;

        // 1. Instantly update UI with User's message
        const userMessage = { role: 'user' as const, content: userMsg };
        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsStreaming(true);

        // 2. Add an empty placeholder for the Neural Core's incoming response
        setMessages((prev) => [...prev, { role: 'ai', content: '' }]);

        try {
            // Fetch is used instead of axios here to support ReadableStream responses.
            const token = sessionStorage.getItem('alphabag_token');
            const response = await fetch(resolveApiUrl('/api/ai/neural-core'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    prompt: userMessage.content,
                    portfolio: portfolioItems.map(p => ({
                        symbol: p.symbol,
                        name: p.name,
                        amount: p.amount,
                        value: p.value,
                        currentPrice: p.currentPrice,
                        priceChange24h: p.priceChange24h,
                    })),
                    tier,
                }),
            });

            if (!response.ok || !response.body) {
                const errorText = !response.ok ? ` (Status: ${response.status})` : '';
                throw new Error(`Neural Core stream unavailable${errorText}`);
            }

            // 4. Decode the stream chunk-by-chunk
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let fullAiResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullAiResponse += chunk;

                // 5. Smoothly inject the chunk into the empty placeholder
                setMessages((prev) => {
                    const updatedMessages = [...prev];
                    const lastIndex = updatedMessages.length - 1;

                    updatedMessages[lastIndex] = {
                        ...updatedMessages[lastIndex],
                        content: updatedMessages[lastIndex].content + chunk,
                    };

                    return updatedMessages;
                });
            }

            // 6. Grounding verification against portfolio facts
            if (fullAiResponse && portfolioItems.length > 0) {
                const facts: Fact[] = portfolioItems.flatMap((p: any) => {
                    const f: Fact[] = [];
                    if (typeof p.amount === 'number') f.push({ key: `${p.symbol}.amount`, value: p.amount, source: 'portfolio', fetchedAt: '', ageMs: 0, stale: false });
                    if (typeof p.value === 'number') f.push({ key: `${p.symbol}.value`, value: p.value, source: 'portfolio', fetchedAt: '', ageMs: 0, stale: false });
                    if (typeof p.currentPrice === 'number') f.push({ key: `${p.symbol}.price`, value: p.currentPrice, source: 'portfolio', fetchedAt: '', ageMs: 0, stale: false });
                    if (typeof p.priceChange24h === 'number') f.push({ key: `${p.symbol}.change`, value: p.priceChange24h, source: 'portfolio', fetchedAt: '', ageMs: 0, stale: false });
                    return f;
                });

                const unverified = findUnsupportedNumbers(fullAiResponse, facts);
                if (unverified.length > 3) {
                    setMessages((prev) => {
                        const updated = [...prev];
                        const last = updated.length - 1;
                        if (updated[last] && updated[last].role === 'ai') {
                            updated[last] = {
                                ...updated[last],
                                content: updated[last].content + `\n\n> ⚠️ *Note: Certain figures mentioned (${unverified.slice(0, 3).join(', ')}) could not be cross-verified with on-chain portfolio facts.*`,
                            };
                        }
                        return updated;
                    });
                }
            }
        } catch (error) {
            console.error("Neural Core Sync Failed:", error);
            setMessages((prev) => {
                const updatedMessages = [...prev];
                const lastIndex = updatedMessages.length - 1;
                updatedMessages[lastIndex] = {
                    role: 'ai',
                    content: 'Alpha Analyst is unavailable right now. Check your connection and try again.',
                };
                return updatedMessages;
            });
        } finally {
            setIsStreaming(false);
        }
    }, [isStreaming, portfolioItems, tier]);

    const clearChat = () => {
        setMessages([{ role: 'ai', content: 'Context cleared. How can I assist your portfolio today?' }]);
    };

    return {
        messages,
        inputText,
        setInputText,
        isStreaming,
        sendMessage,
        clearChat
    };
};
