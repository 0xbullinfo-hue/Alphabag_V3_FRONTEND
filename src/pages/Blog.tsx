
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
    <div className="space-y-8 animate-fade-in">
         <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase mb-4">Alphabag Academy</h1>
            <p className="text-alphabag-subtext text-lg">Learn about crypto, DeFi strategies, and market analysis from industry experts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
                <article key={post.id} className="bg-alphabag-dark border border-alphabag-gray rounded-xl overflow-hidden hover:border-alphabag-yellow transition-colors cursor-pointer group">
                    <div className="h-48 overflow-hidden">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-6">
                        <span className="text-xs font-bold text-alphabag-yellow uppercase tracking-wider mb-2 block">{post.category}</span>
                        <h2 className="text-xl font-bold text-white mb-3 group-hover:text-alphabag-yellow transition-colors">{post.title}</h2>
                        <p className="text-alphabag-subtext text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                        
                        <div className="flex items-center justify-between text-xs text-alphabag-subtext pt-4 border-t border-alphabag-gray/50">
                            <span className="flex items-center"><User size={12} className="mr-1" /> {post.author}</span>
                            <span className="flex items-center"><Calendar size={12} className="mr-1" /> {post.date}</span>
                        </div>
                    </div>
                </article>
            ))}
        </div>
        
        <div className="bg-alphabag-yellow/10 border border-alphabag-yellow/30 rounded-xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-2">Subscribe to our Newsletter</h3>
            <p className="text-alphabag-subtext mb-6">Get the latest alpha directly to your inbox.</p>
            <div className="flex max-w-md mx-auto">
                <input type="email" placeholder="Enter your email" className="flex-1 bg-alphabag-black border border-alphabag-gray rounded-l-lg px-4 py-2 text-white focus:outline-none focus:border-alphabag-yellow" />
                <button className="bg-alphabag-yellow text-black font-bold px-6 py-2 rounded-r-lg hover:bg-alphabag-yellowHover">Subscribe</button>
            </div>
        </div>
    </div>
  );
};
