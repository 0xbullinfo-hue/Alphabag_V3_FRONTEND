
import React, { useEffect, useState } from 'react';
import { fetchBlogPosts } from '../services/mockData';
import { BlogPost } from '../types';
import { Calendar, User } from 'lucide-react';

export const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetchBlogPosts().then(setPosts);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
         <div className="text-center max-w-2xl mx-auto mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase mb-2">Alpha <span className="text-transparent bg-clip-text bg-gradient-to-r from-alphabag-yellow to-yellow-600 drop-shadow-[0_0_15px_rgba(252,213,53,0.3)] ml-1">Academy</span></h1>
            <p className="text-alphabag-subtext text-sm opacity-60">Master the transmission protocols and DeFi stratagems.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
                <article key={post.id} className="bg-alphabag-dark border border-alphabag-gray rounded-xl overflow-hidden hover:border-alphabag-yellow/50 transition-all cursor-pointer group shadow-lg">
                    <div className="h-40 overflow-hidden bg-black/20">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="p-4">
                        <span className="text-[9px] font-black text-alphabag-yellow uppercase tracking-widest mb-2 block opacity-80">{post.category}</span>
                        <h2 className="text-lg font-black text-white mb-2 group-hover:text-alphabag-yellow transition-colors leading-tight">{post.title}</h2>
                        <p className="text-alphabag-subtext text-[13px] mb-3 line-clamp-2 font-medium opacity-60">{post.excerpt}</p>
                        
                        <div className="flex items-center justify-between text-[10px] text-alphabag-subtext font-bold uppercase tracking-widest pt-3 border-t border-alphabag-gray/30">
                            <span className="flex items-center"><User size={10} className="mr-1.5" /> {post.author}</span>
                            <span className="flex items-center"><Calendar size={10} className="mr-1.5" /> {post.date}</span>
                        </div>
                    </div>
                </article>
            ))}
        </div>
        
        <div className="bg-alphabag-yellow/5 border border-alphabag-yellow/20 rounded-xl p-6 text-center mt-8">
            <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tighter">Transmission Subscription</h3>
            <p className="text-alphabag-subtext text-[13px] mb-4 opacity-60">Get the latest alpha injected directly into your node.</p>
            <div className="flex max-w-sm mx-auto shadow-xl">
                <input type="email" placeholder="Enter node email" className="flex-1 bg-alphabag-black border border-alphabag-gray rounded-l-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-alphabag-yellow/50" />
                <button className="bg-alphabag-yellow text-black font-black uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-r-lg hover:bg-yellow-400 transition-colors">Connect</button>
            </div>
        </div>
    </div>
  );
};
