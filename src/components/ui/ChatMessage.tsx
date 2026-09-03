import { motion } from 'framer-motion';
import { Bot,Check,Copy,ExternalLink,User } from 'lucide-react';
import React,{ useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Area,AreaChart,Cell,Legend,Pie,PieChart,Tooltip as RechartsTooltip,ResponsiveContainer,XAxis,YAxis } from 'recharts';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
    message: {
        role: 'user' | 'ai';
        content: string;
        groundingMetadata?: any[];
    };
}

const COLORS = ['#FCD535', '#0ECB81', '#3B82F6', '#8B5CF6', '#F6465D', '#848E9C'];

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const [copied, setCopied] = useState(false);
    const isAi = message.role === 'ai';

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const chartRegex = /<ALPHA_CHART\s+type="([^"]+)"\s+data='([^']+)'\s*\/>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    if (isAi) {
        while ((match = chartRegex.exec(message.content)) !== null) {
            if (match.index > lastIndex) {
                parts.push(
                    <div key={`text-${lastIndex}`} className="markdown-prose prose prose-invert prose-sm max-w-none text-zinc-50 marker:text-alphabag-yellow break-words">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ node, ...props }) => <p className="text-zinc-50 leading-relaxed my-2" {...props} />,
                                span: ({ node, ...props }) => <span className="text-zinc-50 leading-relaxed" {...props} />,
                                strong: ({ node, ...props }) => <strong className="text-alphabag-yellow font-semibold" {...props} />,
                                table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse overflow-hidden rounded-xl border border-alphabag-border text-sm" {...props} /></div>,
                                th: ({ node, ...props }) => <th className="bg-alphabag-darkgray text-zinc-400 font-medium py-3 px-4 text-left border-b border-alphabag-border" {...props} />,
                                td: ({ node, ...props }) => <td className="py-3 px-4 border-b border-alphabag-border/50 text-zinc-100 tabular-nums" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 space-y-2 text-zinc-300 my-3" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 space-y-2 text-zinc-300 my-3" {...props} />,
                                li: ({ node, ...props }) => <li className="marker:text-alphabag-yellow" {...props} />,
                                code: ({ node, inline, ...props }: any) => inline ?
                                    <code className="bg-alphabag-darkgray text-alphabag-yellow px-1.5 py-0.5 rounded text-xs font-mono border border-alphabag-border" {...props} /> :
                                    <code {...props} />,
                                pre: ({ node, ...props }) => <pre className="bg-black border border-alphabag-border rounded-xl p-4 my-4 overflow-x-auto text-sm font-mono text-emerald-400" {...props} />,
                                a: ({ node, ...props }) => <a className="text-alphabag-yellow hover:text-white underline underline-offset-4 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
                            }}
                        >
                            {message.content.substring(lastIndex, match.index)}
                        </ReactMarkdown>
                    </div>
                );
            }

            const type = match[1];
            let data = [];
            try { data = JSON.parse(match[2]); } catch (e) { console.error("Parse error", e); }

            if (type === 'pie' && data.length > 0) {
                parts.push(
                    <div key={`chart-${match.index}`} className="my-4 glass-panel p-4 h-64 w-full max-w-md">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {data.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#18181B', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#FFFFFF' }} itemStyle={{ color: '#FFFFFF' }} />
                                <Legend verticalAlign="bottom" height={36} iconSize={8} formatter={(val) => <span className="text-[10px] uppercase text-alphabag-muted ml-1">{val}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                );
            } else if (type === 'area' && data.length > 0) {
                parts.push(
                    <div key={`chart-${match.index}`} className="my-4 glass-panel p-4 h-64 w-full max-w-md">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id={`colorValue-${match.index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FCD535" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#FCD535" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#A1A1AA" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis orientation="right" stroke="#A1A1AA" fontSize={10} tickLine={false} axisLine={false} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#18181B', borderColor: 'rgba(255,255,255,0.05)', color: '#FFFFFF', borderRadius: '12px' }} itemStyle={{ color: '#FFFFFF' }} />
                                <Area type="monotone" dataKey="value" stroke="#FCD535" strokeWidth={2} fillOpacity={1} fill={`url(#colorValue-${match.index})`} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                );
            }
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < message.content.length) {
            parts.push(
                <div key={`text-${lastIndex}`} className="markdown-prose prose prose-invert prose-sm max-w-none text-zinc-50 marker:text-alphabag-yellow break-words mt-1">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ node, ...props }) => <p className="text-zinc-50 leading-relaxed my-2" {...props} />,
                            span: ({ node, ...props }) => <span className="text-zinc-50 leading-relaxed" {...props} />,
                            strong: ({ node, ...props }) => <strong className="text-alphabag-yellow font-semibold" {...props} />,
                            table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse overflow-hidden rounded-xl border border-alphabag-border text-sm" {...props} /></div>,
                            th: ({ node, ...props }) => <th className="bg-alphabag-darkgray text-zinc-400 font-medium py-3 px-4 text-left border-b border-alphabag-border" {...props} />,
                            td: ({ node, ...props }) => <td className="py-3 px-4 border-b border-alphabag-border/50 text-zinc-100 tabular-nums" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 space-y-2 text-zinc-300 my-3" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 space-y-2 text-zinc-300 my-3" {...props} />,
                            li: ({ node, ...props }) => <li className="marker:text-alphabag-yellow" {...props} />,
                            code: ({ node, inline, ...props }: any) => inline ?
                                <code className="bg-alphabag-darkgray text-alphabag-yellow px-1.5 py-0.5 rounded text-xs font-mono border border-alphabag-border" {...props} /> :
                                <code {...props} />,
                            pre: ({ node, ...props }) => <pre className="bg-black border border-alphabag-border rounded-xl p-4 my-4 overflow-x-auto text-sm font-mono text-emerald-400" {...props} />,
                            a: ({ node, ...props }) => <a className="text-alphabag-yellow hover:text-white underline underline-offset-4 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                    >
                        {message.content.substring(lastIndex)}
                    </ReactMarkdown>
                </div>
            );
        }
    } else {
        parts.push(<span key="user-text" className="whitespace-pre-wrap">{message.content}</span>);
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex w-full ${isAi ? 'justify-start' : 'justify-end'} group my-1.5`}
        >
            <div className={`flex max-w-[92%] sm:max-w-3xl gap-2 w-full ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${isAi ? 'bg-alphabag-yellow text-alphabag-black' : 'bg-alphabag-darkgray text-zinc-50 border border-alphabag-border'}`}>
                    {isAi ? <Bot size={15} /> : <User size={15} />}
                </div>

                <div className={`relative px-3 py-2.5 rounded-md text-sm leading-relaxed overflow-hidden flex-1 ${isAi
                    ? 'bg-alphabag-black/30 border-l-2 border-alphabag-yellow text-zinc-50'
                    : 'bg-alphabag-dark border border-alphabag-gray text-zinc-50 w-full max-w-fit ml-auto'
                    }`}>
                    {isAi && (
                        <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 p-1 rounded-md bg-alphabag-darkgray text-alphabag-muted hover:text-white border border-alphabag-border hover:bg-alphabag-border/50 transition-all opacity-0 group-hover:opacity-100 z-10"
                            title="Copy output"
                        >
                            {copied ? <Check size={14} className="text-alphabag-yellow" /> : <Copy size={14} />}
                        </button>
                    )}

                    {parts}

                    {message.groundingMetadata && message.groundingMetadata.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-alphabag-border/50">
                            <p className="text-[10px] text-alphabag-muted uppercase font-black mb-2 tracking-widest opacity-60">Verified Sources:</p>
                            <div className="flex flex-wrap gap-2">
                                {message.groundingMetadata.map((chunk, idx) => chunk.web && (
                                    <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] text-alphabag-yellow hover:underline bg-alphabag-yellow/10 px-3 py-1 rounded-lg flex items-center font-bold border border-alphabag-yellow/20">
                                        {chunk.web.title || 'Market Intel'} <ExternalLink size={10} className="ml-1.5 opacity-60" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
