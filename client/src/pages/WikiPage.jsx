import { useState, useEffect } from 'react';
import { getCategories, getFAQs, upvoteFAQ } from '../services/api';
import { useAuth } from '../context/AuthContext';

function WikiPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [allFAQs, setAllFAQs] = useState([]);
  const [groupedFAQs, setGroupedFAQs] = useState({});
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, faqRes] = await Promise.all([
        getCategories(),
        getFAQs({ limit: 200 })
      ]);

      setCategories(catRes.data);
      setAllFAQs(faqRes.data.faqs);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSelectedTag(null);
      loadData();
      return;
    }
    setLoading(true);
    setSelectedTag(null);
    try {
      const res = await getFAQs({ q: searchQuery, limit: 200 });
      setAllFAQs(res.data.faqs);
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

  const filterByTag = (tag) => {
    setSearchQuery('');
    if (selectedTag === tag) {
      setSelectedTag(null);
      loadData();
    } else {
      setSelectedTag(tag);
      const filtered = allFAQs.filter(f => f.tags?.[0] === tag);
      const grouped = { [tag]: filtered };
      setGroupedFAQs(grouped);
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
          onClick={() => { setSelectedTag(null); setSearchQuery(''); loadData(); }}
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
                  {faqs.map(faq => (
                    <div key={faq._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
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

      {/* Footer stats */}
      {!loading && (
        <div className="mt-12 text-center text-sm text-slate-400">
          {allFAQs.length} FAQs across {sortedTags.length} topics
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}
    </div>
  );
}

function formatTag(tag) {
  return tag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default WikiPage;