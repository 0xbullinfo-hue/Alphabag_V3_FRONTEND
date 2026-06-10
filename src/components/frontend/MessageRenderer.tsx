
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Bot, User, ExternalLink, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

interface MessageRendererProps {
    message: {
        role: 'user' | 'ai';
        content: string;
        groundingMetadata?: any[];
    };
}

const COLORS = ['#FCD535', '#0ECB81', '#3B82F6', '#8B5CF6', '#F6465D', '#848E9C'];

export const MessageRenderer: React.FC<MessageRendererProps> = ({ message }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Regex to find <ALPHA_CHART ... /> tags
    const chartRegex = /<ALPHA_CHART\s+type="([^"]+)"\s+data='([^']+)'\s*\/>/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    // If AI message, parse for charts
    if (message.role === 'ai') {
        while ((match = chartRegex.exec(message.content)) !== null) {
            // Text before the chart
            if (match.index > lastIndex) {
                parts.push(<span key={`text-${lastIndex}`} className="whitespace-pre-wrap">{message.content.substring(lastIndex, match.index)}</span>);
            }

            // The Chart Component
            const type = match[1];
            let data = [];
            try {
                data = JSON.parse(match[2]);
            } catch (e) {
                console.error("Failed to parse chart data", e);
            }

            if (type === 'pie' && data.length > 0) {
                parts.push(
                    <div key={`chart-${match.index}`} className="my-4 bg-alphabag-black/50 border border-alphabag-gray rounded-xl p-4 h-64 w-full max-w-md">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {data.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1E2329', borderColor: '#2B3139', borderRadius: '8px', color: '#FFFFFF' }} itemStyle={{ color: '#FFFFFF' }} />
                                <Legend verticalAlign="bottom" height={36} iconSize={8} formatter={(val) => <span className="text-[10px] uppercase text-alphabag-subtext ml-1">{val}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                );
            } else if (type === 'area' && data.length > 0) {
                parts.push(
                    <div key={`chart-${match.index}`} className="my-4 bg-alphabag-black/50 border border-alphabag-gray rounded-xl p-4 h-64 w-full max-w-md">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FCD535" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#FCD535" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#848E9C" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis orientation="right" stroke="#848E9C" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1E2329', borderColor: '#2B3139', color: '#FFFFFF', borderRadius: '12px' }} itemStyle={{ color: '#FFFFFF' }} />
                                <Area type="monotone" dataKey="value" stroke="#FCD535" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                );
            }

            lastIndex = match.index + match[0].length;
        }
        // Remaining text
        if (lastIndex < message.content.length) {
            const textToRender = message.content.substring(lastIndex);
            parts.push(
                <div key={`text-${lastIndex}`} className="markdown-prose prose prose-invert prose-sm max-w-none text-alphabag-text marker:text-alphabag-yellow">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{textToRender}</ReactMarkdown>
                </div>
            );
        }
    } else {
        parts.push(<span key="user-text" className="whitespace-pre-wrap">{message.content}</span>);
    }

    return (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
            <div className={`flex max-w-[85%] space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${message.role === 'ai' ? 'bg-alphabag-yellow text-black' : 'bg-alphabag-gray text-white'}`}>
                    {message.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg relative ${message.role === 'ai' ? 'bg-alphabag-black border border-alphabag-gray text-alphabag-text w-full max-w-[calc(100vw-8rem)] sm:max-w-2xl overflow-x-auto custom-scrollbar' : 'bg-alphabag-yellow text-alphabag-black font-medium'}`}>
                    {message.role === 'ai' && (
                        <button
                            onClick={handleCopy}
                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-alphabag-dark/80 text-alphabag-subtext hover:text-white border border-transparent hover:border-alphabag-gray hover:bg-alphabag-gray/50 transition-all opacity-0 group-hover:opacity-100 z-10"
                            title="Copy output"
                        >
                            {copied ? <Check size={14} className="text-alphabag-yellow" /> : <Copy size={14} />}
                        </button>
                    )}
                    {parts}
                    {message.groundingMetadata && message.groundingMetadata.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-alphabag-gray/30">
                            <p className="text-[10px] text-alphabag-subtext uppercase font-black mb-2 tracking-widest opacity-60">Verified Sources:</p>
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
        </div>
    );
};
