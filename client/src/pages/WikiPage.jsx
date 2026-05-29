import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories, getFAQs, getFAQ, upvoteFAQ } from '../services/api';
import { useAuth } from '../context/AuthContext';

function WikiPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [allFAQs, setAllFAQs] = useState([]);
  const [groupedFAQs, setGroupedFAQs] = useState({});
  const [selectedTag, setSelectedTag] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [highlightedFAQ, setHighlightedFAQ] = useState(null);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
    const hl = searchParams.get('highlight');
    if (hl) setHighlightedId(hl);
  }, []);

  // Load highlighted FAQ when param is set
  useEffect(() => {
    if (!highlightedId) return;

    const fetchHighlighted = async () => {
      try {
        const res = await getFAQ(highlightedId);
        if (res.data && res.data._id) {
          setHighlightedFAQ(res.data);
          // Also add to the main list so it's visible in groups
          setAllFAQs(prev => {
            if (prev.some(f => f._id === res.data._id)) return prev;
            return [res.data, ...prev];
          });
          setGroupedFAQs(prev => {
            const tag = res.data.tags?.[0] || 'uncategorized';
            const existing = prev[tag] || [];
            if (existing.some(f => f._id === res.data._id)) return prev;
            return { ...prev, [tag]: [res.data, ...existing] };
          });
        }
      } catch (err) {
        console.error('Failed to load highlighted FAQ:', err);
      }
    };

    fetchHighlighted();
  }, [highlightedId]);

  const loadData = async (pageNum = 1) => {
    try {
      setLoading(true);
      const [catRes, faqRes] = await Promise.all([
        getCategories(),
        getFAQs({ page: pageNum, limit: 20 })
      ]);

      setCategories(catRes.data);
      setAllFAQs(faqRes.data.faqs);
      setPage(pageNum);
      setTotal(faqRes.data.pagination?.total || 0);
      setTotalPages(faqRes.data.pagination?.pages || 1);

      // Group FAQs by their first tag (section)
      const grouped = {};
      for (const faq of faqRes.data.faqs) {
        const tag = faq.tags?.[0] || 'uncategorized';
        if (!grouped[tag]) grouped[tag] = [];
        grouped[tag].push(faq);
      }
      setGroupedFAQs(grouped);
    } catch (err) {
      console.error('Failed to load wiki:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e, pageNum = 1) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSelectedTag(null);
      loadData(1);
      return;
    }
    setLoading(true);
    setSelectedTag(null);
    try {
      const res = await getFAQs({ q: searchQuery, page: pageNum, limit: 20 });
      setAllFAQs(res.data.faqs);
      setPage(pageNum);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.pages || 1);
      const grouped = {};
      for (const faq of res.data.faqs) {
        const tag = faq.tags?.[0] || 'uncategorized';
        if (!grouped[tag]) grouped[tag] = [];
        grouped[tag].push(faq);
      }
      setGroupedFAQs(grouped);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (faqId) => {
    if (!user) return;
    try {
      const res = await upvoteFAQ(faqId);
      const update = (faqs) => faqs.map(f =>
        f._id === faqId ? { ...f, upvotes: res.data.upvotes } : f
      );
      setAllFAQs(update);
      const newGrouped = {};
      for (const [tag, faqs] of Object.entries(groupedFAQs)) {
        newGrouped[tag] = update(faqs);
      }
      setGroupedFAQs(newGrouped);
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const filterByTagPage = async (tag, pageNum) => {
    setLoading(true);
    try {
      const res = await getFAQs({ tag, page: pageNum, limit: 20 });
      setAllFAQs(res.data.faqs);
      setPage(pageNum);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.pages || 1);
      setGroupedFAQs({ [tag]: res.data.faqs });
    } catch (err) {
      console.error('Tag page failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterByTag = async (tag) => {
    setSearchQuery('');
    if (selectedTag === tag) {
      setSelectedTag(null);
      loadData(1);
    } else {
      setSelectedTag(tag);
      setLoading(true);
      try {
        const res = await getFAQs({ tag, page: 1, limit: 20 });
        setAllFAQs(res.data.faqs);
        setPage(1);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.pages || 1);
        const grouped = { [tag]: res.data.faqs };
        setGroupedFAQs(grouped);
      } catch (err) {
        console.error('Tag filter failed:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const sortedTags = Object.keys(groupedFAQs).sort();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">📖 FAQ Wiki</h1>
        <p className="text-slate-500">Complete reference of all {allFAQs.length} frequently asked questions</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="input pl-12 py-3"
            placeholder="Search the entire wiki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => { setSelectedTag(null); setSearchQuery(''); loadData(1); }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !selectedTag && !searchQuery
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => filterByTag(cat.tag)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedTag === cat.tag
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.name} <span className="opacity-60">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* FAQ Groups */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : sortedTags.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-2xl mb-2">🔍</p>
          <p>No FAQs found</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* Highlighted FAQ — shown at top when arriving via ?highlight= */}
          {highlightedFAQ && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">🔗 Linked from your query</span>
              </div>
              <div className="bg-primary-50 rounded-xl border border-primary-200 overflow-hidden shadow-md">
                {/* Question */}
                <div className="px-6 py-4 border-b border-primary-100">
                  <h3 className="font-semibold text-primary-900 text-base">{highlightedFAQ.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {(highlightedFAQ.tags || []).slice(0, 3).map(t => (
                      <span key={t} className="badge badge-gray text-xs">#{t}</span>
                    ))}
                  </div>
                </div>
                {/* Answer — always expanded for highlighted */}
                <div className="px-6 py-4">
                  <div className="bg-white rounded-lg p-4 border-l-4 border-primary-400">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{highlightedFAQ.finalAnswer}</p>
                  </div>
                </div>
                {/* Footer */}
                <div className="px-6 py-3 bg-primary-100 border-t border-primary-100 flex items-center justify-between">
                  <span className="text-xs text-primary-600">
                    by {highlightedFAQ.createdBy?.name || 'Community'} &middot; {highlightedFAQ.upvotes} upvotes
                  </span>
                  {user && (
                    <button
                      onClick={() => handleUpvote(highlightedFAQ._id)}
                      className="btn-ghost text-xs py-1 px-2 text-primary-600"
                    >
                      👍 Upvote
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {sortedTags.map(tag => {
            const catInfo = categories.find(c => c.tag === tag);
            const faqs = groupedFAQs[tag];
            if (!faqs || faqs.length === 0) return null;

            return (
              <section key={tag} id={tag}>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-slate-800">
                    {catInfo?.name || formatTag(tag)}
                  </h2>
                  <span className="badge badge-gray">{faqs.length}</span>
                  {selectedTag === tag && (
                    <span className="badge badge-green">filtered</span>
                  )}
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                  {faqs
                    .filter(faq => faq._id !== highlightedId)
                    .map(faq => (
                    <div
                      key={faq._id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-primary-300 hover:shadow-md transition-all"
                    >
                      {/* Question */}
                      <div className="px-5 py-4">
                        <h3 className="font-semibold text-slate-900 text-base">{faq.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {faq.tags?.slice(0, 2).map(t => (
                            <span key={t} className="badge badge-gray text-xs">#{t}</span>
                          ))}
                        </div>
                      </div>

                      {/* Answer */}
                      <div className="px-5 pb-4">
                        <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-primary-300">
                          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{faq.finalAnswer}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          by {faq.createdBy?.name || 'Community'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{faq.upvotes} upvotes</span>
                          {user && (
                            <button
                              onClick={() => handleUpvote(faq._id)}
                              className="btn-ghost text-xs py-1 px-2 text-primary-600"
                            >
                              👍 Upvote
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Footer stats + Pagination */}
      {!loading && (
        <div className="mt-12">
          <div className="text-center text-sm text-slate-400 mb-4">
            Showing {allFAQs.length} of {total} FAQs across {sortedTags.length} topics
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => selectedTag ? filterByTagPage(selectedTag, page - 1) : searchQuery ? handleSearch(null, page - 1) : loadData(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm text-slate-500 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => selectedTag ? filterByTagPage(selectedTag, page + 1) : searchQuery ? handleSearch(null, page + 1) : loadData(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTag(tag) {
  return tag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default WikiPage;