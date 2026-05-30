import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getFAQs, getFAQsByCategory, upvoteFAQ, pinFaq } from '../services/api';
import CommunityBoard from '../components/CommunityBoard';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 10;

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1 py-6">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
      >
        ← Prev
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
            p === page
              ? 'bg-primary-100 border-primary-300 text-primary-700 font-medium'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

function FAQsPage() {
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryFAQs, setCategoryFAQs] = useState([]);
  const [faqPage, setFaqPage] = useState(1);
  const [faqTotal, setFaqTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadCategories();
  }, []);

  // When category changes, load its FAQs
  useEffect(() => {
    if (selectedCategory) {
      loadCategoryFAQs(selectedCategory.tag);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadCategoryFAQs = async (tag, page = 1) => {
    try {
      setLoading(true);
      const res = await getFAQsByCategory(tag, { page, limit: PAGE_SIZE });
      setCategoryFAQs(res.data.faqs);
      setFaqTotal(res.data.pagination?.total || 0);
      setFaqPage(page);
    } catch (err) {
      console.error('Failed to load category FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e, page = 1) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await getFAQs({ q: searchQuery, page, limit: PAGE_SIZE });
      setSearchResults(res.data.faqs);
      setSearchTotal(res.data.pagination?.total || 0);
      setSearchPage(page);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleUpvote = async (faqId) => {
    if (!user) return;
    try {
      const res = await upvoteFAQ(faqId);
      const updateFAQ = (faqs) => faqs.map(f =>
        f._id === faqId ? { ...f, upvotes: res.data.upvotes } : f
      );
      setCategoryFAQs(updateFAQ);
      if (searchResults) setSearchResults(updateFAQ(searchResults));
      if (allFAQs) setAllFAQs(updateFAQ(allFAQs));
    } catch (err) {
      // silently fail
    }
  };

  const handlePin = async (faqId, currentlyPinned) => {
    if (!user || user.role !== 'admin') return;
    try {
      await pinFaq(faqId);
      const updateFAQ = (faqs) => faqs.map(f =>
        f._id === faqId ? { ...f, pinned: !currentlyPinned } : f
      );
      setCategoryFAQs(updateFAQ);
      if (searchResults) setSearchResults(updateFAQ(searchResults));
      if (allFAQs) setAllFAQs(updateFAQ(allFAQs));
    } catch (err) {
      // silently fail
    }
  };

  const selectCategory = (cat) => {
    if (selectedCategory?.id === cat.id) {
      setSelectedCategory(null);
      setCategoryFAQs([]);
    } else {
      setSelectedCategory(cat);
      setSearchResults(null);
      setSearchQuery('');
      loadCategoryFAQs(cat.tag, 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Knowledge Base</h1>
        <p className="text-slate-500">Find answers by topic or search keywords</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-10">
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="input pl-12 py-3 text-base shadow-sm"
            placeholder="Search FAQs by keyword or topic..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) { setSearchResults(null); }
            }}
          />
        </div>
      </form>

      {/* Search Results */}
      {searchResults !== null && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Search results for "{searchQuery}"
              <span className="font-normal text-slate-400 text-sm ml-2">({searchResults.length} found)</span>
            </h2>
            <button onClick={clearSearch} className="btn-ghost text-sm text-slate-500">Clear</button>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No FAQs found matching your search.</p>
          ) : (
            <>
              <div className="space-y-3">
                {searchResults.map(faq => (
                  <FAQItem key={faq._id} faq={faq} onUpvote={handleUpvote} onPin={handlePin} user={user} />
                ))}
              </div>
              <Pagination
                page={searchPage}
                totalPages={Math.ceil(searchTotal / PAGE_SIZE)}
                onPage={(p) => handleSearch(null, p)}
              />
            </>
          )}
        </section>
      )}

      {/* Main content — right panel */}
      {searchResults === null && (
        <div className="flex gap-10">
          {/* ── Left: Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Selected Category FAQs */}
            {selectedCategory ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedCategory.name}
                    <span className="font-normal text-slate-400 text-sm ml-2">({faqTotal} FAQs)</span>
                  </h2>
                  <button onClick={() => setSelectedCategory(null)} className="btn-ghost text-sm text-slate-500">
                    ✕ Back to all
                  </button>
                </div>
                {loading ? (
                  <div className="flex justify-center py-10"><div className="spinner" /></div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {categoryFAQs.map(faq => (
                        <FAQItem key={faq._id} faq={faq} onUpvote={handleUpvote} onPin={handlePin} user={user} />
                      ))}
                    </div>
                    <Pagination
                      page={faqPage}
                      totalPages={Math.ceil(faqTotal / PAGE_SIZE)}
                      onPage={(p) => loadCategoryFAQs(selectedCategory.tag, p)}
                    />
                  </>
                )}
              </section>
            ) : (
              <>
                {/* Community Board — pinned FAQs, announcements, overview */}
                <CommunityBoard />

                {/* Hero section */}
                <div className="text-center py-10 px-4 mb-6">
                  <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                    <span>📚</span>
                    <span>{categories.reduce((s, c) => s + c.count, 0)} FAQs across {categories.length} topics</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Find answers, instantly
                  </h2>
                  <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                    Can't find what you're looking for? Use the chat assistant below — it searches the entire knowledge base for you.
                  </p>
                  {/* Quick topic pills */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {categories.slice(0, 6).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => selectCategory(cat)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-slate-600 hover:text-primary-700 text-sm rounded-full transition-all shadow-sm"
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs text-slate-400">{cat.count}</span>
                      </button>
                    ))}
                  </div>
                  <Link to="/wiki" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                    Browse all FAQs in the Wiki →
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* ── Right: Categories sidebar ── */}
          <aside className="w-56 shrink-0">
            <div className="sticky top-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Topics</h3>
              <div className="space-y-0.5">
                {[...categories].sort((a, b) => b.count - a.count).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => selectCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory?.id === cat.id
                        ? 'bg-primary-100 text-primary-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate">{cat.name}</span>
                      <span className={`text-xs shrink-0 ${
                        selectedCategory?.id === cat.id ? 'text-primary-500' : 'text-slate-400'
                      }`}>
                        {cat.count}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// FAQ Item — used in lists
function FAQItem({ faq, onUpvote, onPin, user, compact = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`card group transition-all duration-200 cursor-pointer ${
        isExpanded ? 'ring-2 ring-primary-200 bg-slate-50/50 shadow-sm' : 'hover:border-primary-300 hover:shadow-sm'
      } ${compact ? 'py-4' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-slate-900 ${compact ? 'text-sm' : ''} flex items-center gap-2`}>
            {faq.pinned && <span className="text-amber-500 text-xs font-bold">📌</span>}
            {faq.title}
          </p>
          
          <div
            className={`transition-all duration-300 overflow-hidden ${
              isExpanded ? 'max-h-[500px] mt-2' : compact ? 'max-h-0' : 'max-h-12 mt-1'
            }`}
          >
            <p className={`text-sm text-slate-600 ${isExpanded ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
              {faq.finalAnswer}
            </p>
          </div>

          {faq.tags && faq.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {faq.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="badge badge-gray text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 text-slate-400 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onUpvote(faq._id)}
              disabled={!user}
              className="hover:text-primary-600 transition-colors disabled:cursor-not-allowed"
              title={user ? 'Upvote' : 'Sign in to upvote'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-slate-600">{faq.upvotes}</span>
          </div>

          {user?.role === 'admin' && (
            <button
              onClick={() => onPin(faq._id, !!faq.pinned)}
              className={`hover:text-amber-500 transition-colors ${faq.pinned ? 'text-amber-500' : ''}`}
              title={faq.pinned ? 'Unpin FAQ' : 'Pin FAQ'}
            >
              <svg className="w-4 h-4" fill={faq.pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}

          {/* Expand icon indicator */}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-primary-500' : 'group-hover:text-slate-600'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default FAQsPage;