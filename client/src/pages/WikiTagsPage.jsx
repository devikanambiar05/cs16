import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getFAQs, upvoteFAQ } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

export default function WikiTagsPage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [upvotedIds, setUpvotedIds] = useState(new Set());

  useEffect(() => {
    loadAllFAQs();
  }, []);

  const loadAllFAQs = async () => {
    try {
      setLoading(true);
      // Fetch all resolved FAQs in one query (we have 118)
      const res = await getFAQs({ page: 1, limit: 500 });
      setFaqs(res.data.faqs || res.data || []);
    } catch (err) {
      console.error('Failed to load all FAQs for Wiki:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (faqId, e) => {
    e.stopPropagation();
    if (!user || upvotedIds.has(faqId)) return;
    try {
      const res = await upvoteFAQ(faqId);
      setUpvotedIds(prev => {
        const next = new Set(prev);
        next.add(faqId);
        return next;
      });
      setFaqs(prev => prev.map(f =>
        f._id === faqId ? { ...f, upvotes: res.data.upvotes } : f
      ));
    } catch (err) {
      // silently catch
    }
  };

  // Group FAQs by tags alphabetically & filter based on search query
  const groupedData = useMemo(() => {
    const grouped = {};
    
    // Filter FAQs by search query if present
    const query = searchQuery.trim().toLowerCase();
    const filteredFaqs = faqs.filter(faq => {
      if (!query) return true;
      return (
        faq.title?.toLowerCase().includes(query) ||
        faq.finalAnswer?.toLowerCase().includes(query) ||
        faq.tags?.some(t => t.toLowerCase().includes(query))
      );
    });

    // Populate tags map
    filteredFaqs.forEach(faq => {
      const tags = faq.tags && faq.tags.length > 0 ? faq.tags : ['general'];
      tags.forEach(tag => {
        const cleanTag = tag.trim().toLowerCase();
        if (!grouped[cleanTag]) {
          grouped[cleanTag] = [];
        }
        grouped[cleanTag].push(faq);
      });
    });

    // Alphabetical tags sorted
    const sortedTags = Object.keys(grouped).sort();

    // Group tags by starting letter
    const lettersMap = {};
    sortedTags.forEach(tag => {
      const firstLetter = tag.charAt(0).toUpperCase();
      const isLetter = /^[A-Z]$/.test(firstLetter);
      const key = isLetter ? firstLetter : '#';
      if (!lettersMap[key]) {
        lettersMap[key] = [];
      }
      lettersMap[key].push({
        name: tag,
        faqs: grouped[tag]
      });
    });

    return lettersMap;
  }, [faqs, searchQuery]);

  const activeLetters = useMemo(() => {
    return new Set(Object.keys(groupedData));
  }, [groupedData]);

  const scrollToLetter = (letter) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>📚</span> Granth Wiki Tags
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Browse all {faqs.length} structured FAQ questions indexed alphabetically by topic tag.
          </p>
        </div>
        <Link to="/" className="mt-3 sm:mt-0 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Search Filter */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="input pl-10 py-2 text-sm rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
            placeholder="Type to filter questions, answers, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Alphabet Navigation bar */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-3 bg-white/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl mb-8 select-none">
        {ALPHABET.map(letter => {
          const isActive = activeLetters.has(letter);
          return (
            <button
              key={letter}
              onClick={() => isActive && scrollToLetter(letter)}
              disabled={!isActive}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                isActive
                  ? 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-950/20 dark:text-primary-400 dark:hover:bg-primary-950/40 shadow-sm cursor-pointer'
                  : 'text-slate-350 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Tags Directory */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner" />
        </div>
      ) : Object.keys(groupedData).length === 0 ? (
        <div className="text-center py-16 card rounded-2xl bg-white/40 dark:bg-slate-900/20 border-dashed border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">No wiki tags found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="space-y-10">
          {ALPHABET.filter(letter => activeLetters.has(letter)).map(letter => (
            <section
              key={letter}
              id={`letter-${letter}`}
              className="scroll-mt-20 border-b border-slate-200/30 dark:border-slate-800/30 pb-8"
            >
              {/* Alphabet Header Anchor */}
              <div className="flex items-center gap-3 mb-5">
                <span className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white text-base font-extrabold shadow-sm select-none">
                  {letter}
                </span>
                <span className="h-[1px] flex-1 bg-slate-200/60 dark:bg-slate-800/60" />
              </div>

              {/* Tags starting with this letter */}
              <div className="space-y-6">
                {groupedData[letter].map(tag => (
                  <div key={tag.name} className="ml-2">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 select-none">
                      <span>🏷️ #{tag.name}</span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded-md">
                        {tag.faqs.length} question{tag.faqs.length !== 1 ? 's' : ''}
                      </span>
                    </h3>

                    {/* Accordion Questions List */}
                    <div className="space-y-2">
                      {tag.faqs.map(faq => {
                        const isExpanded = expandedFaqId === faq._id;
                        const isUpvoted = upvotedIds.has(faq._id);
                        return (
                          <div
                            key={faq._id}
                            className={`card group py-3.5 px-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 transition-all duration-200 cursor-pointer select-none bg-white dark:bg-slate-900 ${
                              isExpanded
                                ? 'ring-2 ring-primary-100 dark:ring-primary-950 bg-slate-50/20 dark:bg-slate-900/40 shadow-sm border-primary-300 dark:border-primary-900/50'
                                : 'hover:border-primary-350 dark:hover:border-primary-900/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.01)]'
                            }`}
                            onClick={() => setExpandedFaqId(isExpanded ? null : faq._id)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 flex items-center gap-2">
                                {faq.pinned && <span className="text-amber-500 text-xs shrink-0 select-none">📌</span>}
                                {faq.title}
                              </p>
                              
                              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                                {/* Upvote Counter badge */}
                                <button
                                  onClick={(e) => handleUpvote(faq._id, e)}
                                  disabled={!user || isUpvoted}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border ${
                                    isUpvoted
                                      ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-950/20 dark:border-primary-900/30 dark:text-primary-400'
                                      : user
                                        ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-primary-950/20 dark:hover:border-primary-900/30 dark:hover:text-primary-400'
                                        : 'bg-slate-50 border-slate-200 text-slate-350 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                                  }`}
                                  title={user ? (isUpvoted ? 'Already upvoted' : 'Upvote FAQ') : 'Sign in to upvote'}
                                >
                                  <span>↑</span>
                                  <span>{faq.upvotes}</span>
                                </button>

                                {/* Dropdown indicator arrow */}
                                <svg
                                  className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180 text-primary-500' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>

                            {/* Slide-out Answer Box */}
                            <div
                              className={`transition-all duration-300 overflow-hidden ${
                                isExpanded ? 'max-h-[800px] opacity-100 mt-3 pt-3 border-t border-slate-200/40 dark:border-slate-800/40' : 'max-h-0 opacity-0'
                              }`}
                            >
                              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                                {faq.finalAnswer}
                              </p>
                              <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 dark:text-slate-500 select-none">
                                <span>by {faq.createdBy?.name || 'Administrator'}</span>
                                {faq.tags && faq.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {faq.tags.map(t => (
                                      <span key={t} className="badge bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-[10px] rounded-md px-1.5 py-0">
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
