
import { ArrowRight,Bookmark,Clock,Facebook,Instagram,Newspaper,Search,Send,Twitter,X,Zap } from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import { api } from '../../services/api';
import { NewsItem } from '../../types';
import { PageIcon } from '../../components/ui/PageIcon';

export const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const safeNews = Array.isArray(news) ? news : [];
  const filteredNews = safeNews.filter(item => 
    Boolean(item && (
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.summary?.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        const res = await api.get('/api/news');
        const list = Array.isArray(res.data) 
          ? res.data 
          : (Array.isArray(res.data?.news) ? res.data.news : (Array.isArray(res.data?.data) ? res.data.data : []));
        setNews(list);
      } catch (error) {
        console.error("Failed to fetch news", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNewsData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-2">
      <div className="w-10 h-10 border-4 border-alphabag-yellow border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs text-alphabag-subtext uppercase font-bold tracking-widest">Tapping into Intelligence Feeds...</p>
    </div>
  );

  return (
    <div className="space-y-2 animate-fade-in w-full pb-20">
      <div className="bg-alphabag-dark border border-alphabag-gray p-4 rounded-xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Newspaper size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <PageIcon name="news" size={40} />
            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight leading-tight">Market Pulse</h1>
          </div>
          <p className="text-alphabag-subtext mt-1 text-[13px] font-medium max-w-md opacity-60">Expert narratives and real-time intelligence for BAG holders.</p>
        </div>
        <div className="relative z-10 w-full md:w-auto mt-6 md:mt-0 flex flex-col items-end">
             <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search size={14} className="text-alphabag-subtext" />
                 </div>
                 <input 
                    type="text" 
                    placeholder="Search historical posts..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-alphabag-black border border-alphabag-gray rounded-md pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-alphabag-yellow w-full md:w-64 transition-colors"
                 />
             </div>
             <div className="flex items-center space-x-2 mt-3 text-[11px] text-alphabag-green font-semibold uppercase tracking-wider text-right">
                <div className="w-1.5 h-1.5 rounded-full bg-alphabag-green"></div>
                Live Hub Archive
             </div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {filteredNews.length === 0 ? (
            <div className="col-span-full py-20 text-center flex flex-col items-center">
                <Search size={48} className="text-alphabag-gray mb-2" />
                <h3 className="text-xl font-semibold text-white mb-2">No transmissions found</h3>
                <p className="text-sm text-alphabag-subtext">Adjust your search parameters to comb through the archive.</p>
            </div>
        ) : filteredNews.map((item) => (
          <article
            key={item.id}
            className={`
                group flex flex-col bg-alphabag-dark border rounded-lg overflow-hidden transition-all
                ${item.isPremium ? 'border-alphabag-yellow/40 hover:border-alphabag-yellow' : 'border-alphabag-gray hover:border-alphabag-muted'}
            `}
          >
            <div className="h-56 overflow-hidden relative">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector<HTMLElement>('.news-img-fallback');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`news-img-fallback absolute inset-0 bg-alphabag-darkgray flex items-center justify-center ${item.imageUrl ? 'hidden' : ''}`}>
                <Newspaper size={48} className="text-alphabag-subtext/30" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-alphabag-black/80 to-transparent"></div>
              {item.isPremium && (
                <div className="absolute top-4 right-4 bg-alphabag-yellow text-alphabag-black text-[11px] font-semibold px-2 py-0.5 rounded flex items-center">
                  <Zap size={13} className="mr-1 fill-current" /> ULTIMATE
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <span className="bg-alphabag-gray px-2 py-0.5 rounded text-[11px] uppercase font-semibold text-white tracking-wider">{item.source}</span>
                {item.isAiCurated && (
                  <span className="bg-purple-900/60 px-2 py-0.5 rounded text-[11px] uppercase font-semibold text-purple-300 tracking-wider flex items-center border border-purple-500/30">
                    <Zap size={10} className="mr-1" /> AI Curated
                  </span>
                )}
                {item.sentiment && (
                  <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-semibold text-white tracking-wider border ${item.sentiment === 'POSITIVE' ? 'bg-green-900/60 border-green-500/30 text-green-300' :
                    item.sentiment === 'NEGATIVE' ? 'bg-red-900/60 border-red-500/30 text-red-300' :
                      'bg-gray-800/80 border-gray-600/30 text-gray-300'
                    }`}>
                    {item.sentiment}
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center text-[11px] text-alphabag-subtext font-medium uppercase mb-2">
                <Clock size={11} className="mr-1.5" /> {item.date}
              </div>
              <h3 className="text-base font-semibold text-white mb-2 leading-snug group-hover:text-alphabag-yellow transition-colors">{item.title}</h3>
              <p className="text-alphabag-subtext text-[13px] mb-2 line-clamp-2 flex-1 font-medium leading-relaxed opacity-80">{item.summary}</p>

              <div className="pt-4 border-t border-alphabag-gray/50">
                <button
                  onClick={() => setSelectedArticle(item)}
                  className="w-full bg-alphabag-black border border-alphabag-gray hover:border-alphabag-yellow text-alphabag-yellow text-xs font-semibold uppercase tracking-wider py-2 rounded-md flex items-center justify-center transition-all group/btn"
                >
                  READ REPORT <ArrowRight size={12} className="ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Intelligence Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-alphabag-black/80"
            onClick={() => setSelectedArticle(null)}
          ></div>
          <div className="bg-alphabag-dark border border-alphabag-gray w-full max-w-4xl h-[85vh] rounded-lg shadow-2xl relative overflow-hidden flex flex-col animate-slide-up">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 bg-alphabag-black/60 text-white rounded-md flex items-center justify-center hover:bg-alphabag-red transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="h-72 md:h-[380px] relative">
                <img src={selectedArticle.imageUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-alphabag-dark via-alphabag-dark/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-alphabag-yellow text-black text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">{selectedArticle.source}</span>
                    <span className="text-[11px] text-white/70 font-medium uppercase tracking-wider flex items-center">
                      <Clock size={12} className="mr-1.5" /> {selectedArticle.date}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight leading-tight">
                    {selectedArticle.title}
                  </h2>
                </div>
              </div>

              <div className="p-4 md:p-8">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-alphabag-gray/30">
                  <div className="flex items-center space-x-2 text-alphabag-subtext">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mr-2">Share Intel:</span>
                    <a 
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedArticle.title + ' shared from @myalphabag')}&url=${encodeURIComponent(window.location.href)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-[#1DA1F2] transition-colors"
                    >
                      <Twitter size={16} />
                    </a>
                    <a 
                      href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(selectedArticle.title + ' shared from @myalphabag')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-[#229ED9] transition-colors"
                    >
                      <Send size={16} />
                    </a>
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-[#1877F2] transition-colors"
                    >
                      <Facebook size={16} />
                    </a>
                    <a 
                      href="https://instagram.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-[#E4405F] transition-colors"
                      onClick={() => alert("Link copied for Instagram! \n" + window.location.href + "\nshared from @myalphabag")}
                    >
                      <Instagram size={16} />
                    </a>

                    <span className="w-px h-5 bg-alphabag-gray mx-2"></span>
                    
                    <button className="flex items-center hover:text-alphabag-yellow transition-colors font-semibold uppercase text-[11px] tracking-wider ml-2 border border-alphabag-gray/50 px-2.5 py-1 rounded bg-alphabag-black/30">
                      <Bookmark size={13} className="mr-1.5" /> Save
                    </button>
                  </div>
                  {selectedArticle.isPremium && (
                    <div className="flex items-center bg-alphabag-yellow/10 text-alphabag-yellow px-3 py-1 rounded border border-alphabag-yellow/20">
                      <Zap size={14} className="mr-1.5 fill-current" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Ultimate Verified</span>
                    </div>
                  )}
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-base text-alphabag-yellow font-medium leading-relaxed mb-4 border-l-2 border-alphabag-yellow pl-4">
                    {selectedArticle.summary}
                  </p>
                  <div className="text-alphabag-text text-sm leading-relaxed space-y-3 font-normal opacity-90">
                    {selectedArticle.content ? (
                      selectedArticle.content.split('\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))
                    ) : (
                      <p>Additional intelligence for this report is currently being synchronized from the primary sources. Full text will be available shortly.</p>
                    )}
                  </div>
                </div>

                <div className="mt-8 p-4 bg-alphabag-black/50 border border-alphabag-gray rounded-lg">
                  <h4 className="text-white font-semibold mb-1 uppercase text-xs tracking-wider">Alpha Intelligence Disclaimer</h4>
                  <p className="text-xs text-alphabag-subtext leading-relaxed">
                    This report is generated by AlphaBAG proprietary intelligence hubs. Narratives are for research purposes only and do not constitute financial advice. Standard risk management suggested.
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
