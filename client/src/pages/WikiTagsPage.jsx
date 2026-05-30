import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getFAQs } from '../services/api';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

export default function WikiTagsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  useEffect(() => {
    loadAllFAQs();
  }, []);

  const loadAllFAQs = async () => {
    try {
      setLoading(true);
      const res = await getFAQs({ page: 1, limit: 500 });
      setFaqs(res.data.faqs || res.data || []);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group FAQs by tag, then group tags by A-Z starting letter
  const groupedData = useMemo(() => {
    const grouped = {};
    const query = searchQuery.trim().toLowerCase();
    
    // Filter FAQs by search query
    const filteredFaqs = faqs.filter(faq => {
      if (!query) return true;
      return (
        faq.title?.toLowerCase().includes(query) ||
        faq.finalAnswer?.toLowerCase().includes(query) ||
        faq.tags?.some(t => t.toLowerCase().includes(query))
      );
    });

    // Group FAQs under tags
    filteredFaqs.forEach(faq => {
      const tags = faq.tags && faq.tags.length > 0 ? faq.tags : ['general'];
      tags.forEach(tag => {
        const cleanTag = tag.trim().toLowerCase();
        if (!grouped[cleanTag]) {
          grouped[cleanTag] = [];
        }
        // Avoid duplicate FAQs under the same tag
        if (!grouped[cleanTag].some(f => f._id === faq._id)) {
          grouped[cleanTag].push(faq);
        }
      });
    });

    // Alphabetical list of tags
    const sortedTags = Object.keys(grouped).sort();

    // Group tags by starting letter
    const letterMap = {};
    sortedTags.forEach(tag => {
      const firstLetter = tag.charAt(0).toUpperCase();
      const isLetter = /^[A-Z]$/.test(firstLetter);
      const key = isLetter ? firstLetter : '#';
      if (!letterMap[key]) {
        letterMap[key] = [];
      }
      letterMap[key].push({
        name: tag,
        faqs: grouped[tag].sort((a, b) => a.title.localeCompare(b.title))
      });
    });

    return letterMap;
  }, [faqs, searchQuery]);

  const activeLetters = useMemo(() => new Set(Object.keys(groupedData)), [groupedData]);

  const scrollToLetter = (letter) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* LessWrong Minimal Header */}
      <div className="border-b border-slate-200/60 dark:border-slate-800/60 pb-6 mb-8">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100 font-serif">
            All Wiki Tags <span className="text-lg text-slate-400 font-sans ml-2 font-normal">({faqs.length} concepts)</span>
          </h1>
          <Link to="/" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
            ← Home
          </Link>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-2xl font-light">
          A high-density index of the Granth collaborative FAQ database, grouped alphabetically by concept tag and cross-referenced with all resolving student questions.
        </p>
      </div>

      {/* Mini Inline Search Box */}
      <div className="mb-8">
        <div className="relative max-w-sm">
          <input
            type="text"
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder:text-slate-400"
            placeholder="Filter tags or questions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[10px] text-slate-400 hover:text-slate-650"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Clean Alphabet Shortcut Strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs border-b border-slate-100 dark:border-slate-850 pb-5 mb-10 select-none font-medium">
        <span className="text-slate-400 font-normal">Jump to:</span>
        {ALPHABET.map(letter => {
          const isActive = activeLetters.has(letter);
          return (
            <button
              key={letter}
              onClick={() => isActive && scrollToLetter(letter)}
              disabled={!isActive}
              className={`transition-colors font-bold ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 hover:underline cursor-pointer'
                  : 'text-slate-300 dark:text-slate-700'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Directory Index (LessWrong High-Density Columns Grid) */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner" />
        </div>
      ) : Object.keys(groupedData).length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No matching tags or FAQs found.</p>
      ) : (
        <div className="space-y-12">
          {ALPHABET.filter(letter => activeLetters.has(letter)).map(letter => (
            <section
              key={letter}
              id={`letter-${letter}`}
              className="scroll-mt-24 border-b border-slate-100 dark:border-slate-900 pb-10"
            >
              {/* Section Letter Heading */}
              <h2 className="text-xl font-light text-slate-400 dark:text-slate-600 mb-6 font-serif border-b border-slate-100 dark:border-slate-900 pb-1 select-none">
                {letter}
              </h2>

              {/* High-density grid of tags (2 columns on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {groupedData[letter].map(tag => (
                  <div key={tag.name} className="break-inside-avoid">
                    {/* Tag Heading */}
                    <div className="flex items-baseline gap-2 mb-2.5 select-none">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        #{tag.name}
                      </span>
                      <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                        ({tag.faqs.length})
                      </span>
                    </div>

                    {/* Question Links list */}
                    <ul className="space-y-2 list-none pl-0">
                      {tag.faqs.map(faq => {
                        const isExpanded = expandedFaqId === `${tag.name}-${faq._id}`;
                        return (
                          <li key={faq._id} className="text-xs">
                            <button
                              onClick={() => setExpandedFaqId(isExpanded ? null : `${tag.name}-${faq._id}`)}
                              className="text-left font-normal text-primary-600 dark:text-primary-400 hover:underline hover:text-primary-700 leading-snug transition-colors"
                            >
                              • {faq.title}
                            </button>

                            {/* Minimalist, Borderless Inline Answer Reveal */}
                            <div
                              className={`transition-all duration-300 overflow-hidden ${
                                isExpanded
                                  ? 'max-h-[1000px] opacity-100 mt-2.5 mb-4 pl-3.5 border-l border-primary-300 dark:border-primary-900'
                                  : 'max-h-0 opacity-0'
                              }`}
                            >
                              <p className="text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-wrap select-text pr-4">
                                {faq.finalAnswer}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 select-none">
                                <span>Upvotes: {faq.upvotes}</span>
                                <span>•</span>
                                <span>by {faq.createdBy?.name || 'Administrator'}</span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
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
