import { useCallback,useState } from 'react';
import { resolveApiUrl } from '../../services/api';

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

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

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
    }, [isStreaming]);

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
