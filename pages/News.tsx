
import React, { useEffect, useState } from 'react';
import { fetchNews } from '../services/mockData';
import { NewsItem } from '../types';
import { Clock, X, Zap, Newspaper, ArrowRight, Share2, Bookmark } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  useEffect(() => {
    fetchNews().then(data => {
      setNews(data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <div className="w-10 h-10 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs text-alphabag-subtext uppercase font-bold tracking-widest">Tapping into Intelligence Feeds...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20">
      <div className="bg-alphabag-dark border border-alphabag-gray p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Newspaper size={160} />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tighter">Market Pulse</h1>
          <p className="text-alphabag-subtext mt-2 font-medium max-w-md">Expert narratives and real-time intelligence aggregated for BAG holders.</p>
        </div>
        <div className="mt-6 md:mt-0 bg-alphabag-black border border-alphabag-gray px-6 py-3 rounded-2xl relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-alphabag-green rounded-full animate-pulse"></div>
            <span className="text-xs text-alphabag-text font-bold uppercase tracking-widest">Global Wire Active</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <article
            key={item.id}
            className={`
                group flex flex-col bg-alphabag-dark border rounded-2xl overflow-hidden transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]
                ${item.isPremium ? 'border-alphabag-yellow/40 hover:border-alphabag-yellow' : 'border-alphabag-gray hover:border-alphabag-subtext'}
            `}
          >
            <div className="h-56 overflow-hidden relative">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-alphabag-black/80 to-transparent"></div>
              {item.isPremium && (
                <div className="absolute top-4 right-4 bg-alphabag-yellow text-alphabag-black text-[10px] font-extrabold px-3 py-1.5 rounded-xl flex items-center shadow-2xl">
                  <Zap size={14} className="mr-1.5 fill-current" /> ULTIMATE
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <span className="bg-alphabag-gray/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] uppercase font-extrabold text-white tracking-widest">{item.source}</span>
                {item.isAiCurated && (
                  <span className="bg-purple-600/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] uppercase font-extrabold text-white tracking-widest flex items-center border border-purple-400/30">
                    <Zap size={10} className="mr-1" /> AI Curated
                  </span>
                )}
                {item.sentiment && (
                  <span className={`px-3 py-1 rounded-lg text-[10px] uppercase font-extrabold text-white tracking-widest border backdrop-blur-md ${item.sentiment === 'POSITIVE' ? 'bg-green-600/80 border-green-400/30' :
                      item.sentiment === 'NEGATIVE' ? 'bg-red-600/80 border-red-400/30' :
                        'bg-gray-600/80 border-gray-400/30'
                    }`}>
                    {item.sentiment}
                  </span>
                )}
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center text-[10px] text-alphabag-subtext font-bold uppercase mb-4">
                <Clock size={12} className="mr-1.5" /> {item.date}
              </div>
              <h3 className="text-xl font-extrabold text-white mb-4 leading-tight group-hover:text-alphabag-yellow transition-colors">{item.title}</h3>
              <p className="text-alphabag-subtext text-sm mb-6 line-clamp-3 flex-1 font-medium leading-relaxed">{item.summary}</p>

              <div className="pt-6 border-t border-alphabag-gray/50">
                <button
                  onClick={() => setSelectedArticle(item)}
                  className="w-full bg-alphabag-black border border-alphabag-gray hover:border-alphabag-yellow text-alphabag-yellow text-xs font-bold uppercase tracking-[0.2em] py-3 rounded-xl flex items-center justify-center transition-all group/btn"
                >
                  FULL ALPHA NEWS <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Intelligence Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedArticle(null)}
          ></div>
          <div className="bg-alphabag-dark border border-alphabag-gray w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl relative overflow-hidden flex flex-col animate-slide-up">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-6 right-6 z-20 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-alphabag-red transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="h-80 md:h-[450px] relative">
                <img src={selectedArticle.imageUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-alphabag-dark via-alphabag-dark/40 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="bg-alphabag-yellow text-black text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-widest">{selectedArticle.source}</span>
                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest flex items-center">
                      <Clock size={12} className="mr-1.5" /> {selectedArticle.date}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter leading-tight drop-shadow-2xl">
                    {selectedArticle.title}
                  </h2>
                </div>
              </div>

              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-8 pb-8 border-b border-alphabag-gray/30">
                  <div className="flex items-center space-x-6 text-alphabag-subtext">
                    <button className="flex items-center hover:text-alphabag-yellow transition-colors font-bold uppercase text-[10px] tracking-widest">
                      <Share2 size={16} className="mr-2" /> Share Alpha
                    </button>
                    <button className="flex items-center hover:text-alphabag-yellow transition-colors font-bold uppercase text-[10px] tracking-widest">
                      <Bookmark size={16} className="mr-2" /> Save Intel
                    </button>
                  </div>
                  {selectedArticle.isPremium && (
                    <div className="flex items-center bg-alphabag-yellow/10 text-alphabag-yellow px-4 py-2 rounded-xl border border-alphabag-yellow/20">
                      <Zap size={16} className="mr-2 fill-current" />
                      <span className="text-xs font-extrabold uppercase tracking-widest">Ultimate Verified</span>
                    </div>
                  )}
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-xl text-alphabag-yellow font-bold leading-relaxed mb-8 border-l-4 border-alphabag-yellow pl-6">
                    {selectedArticle.summary}
                  </p>
                  <div className="text-alphabag-text text-lg leading-loose space-y-6 font-medium opacity-90">
                    {selectedArticle.content ? (
                      selectedArticle.content.split('\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))
                    ) : (
                      <p>Additional intelligence for this report is currently being synchronized from the primary nodes. Full text will be available shortly.</p>
                    )}
                  </div>
                </div>

                <div className="mt-12 p-8 bg-alphabag-black/50 border border-alphabag-gray rounded-2xl">
                  <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Alpha Intelligence Disclaimer</h4>
                  <p className="text-xs text-alphabag-subtext leading-relaxed font-bold uppercase">
                    This report is generated by AlphaBAG proprietary intelligence nodes. Narratives are for research purposes only and do not constitute financial advice. Standard protocols suggest 2% risk management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
