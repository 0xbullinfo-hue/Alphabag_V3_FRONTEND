import { AnimatePresence,motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import React,{ useEffect,useRef } from 'react';
import { ChatMessage } from './ChatMessage';

interface ChatFeedProps {
    messages: any[];
    isTyping: boolean;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({ messages, isTyping }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTyping]);

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-700"
        >
            <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} />
                ))}
                {isTyping && (
                    <motion.div
                        key="typing-indicator"
                        layout
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: [0.4, 1, 0.4], y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                            opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                            layout: { duration: 0.3 }
                        }}
                        className="flex w-full justify-start mt-1.5"
                    >
                        <div className="flex max-w-[92%] sm:max-w-3xl gap-2 flex-row w-full">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-alphabag-yellow text-alphabag-black">
                                <Bot size={15} className="animate-pulse" />
                            </div>
                            <div className="px-3 py-2.5 rounded-md text-sm leading-relaxed bg-alphabag-black/30 border-l-2 border-alphabag-yellow flex items-center">
                                <span className="italic text-alphabag-muted font-medium tracking-wide">Synchronizing neural core...</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
