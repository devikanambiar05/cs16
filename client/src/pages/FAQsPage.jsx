import { useState, useEffect } from 'react';
import { getFAQs, getTrendingFAQs, upvoteFAQ } from '../services/api';
import { useAuth } from '../context/AuthContext';

function FAQsPage() {
  const [faqs, setFAQs] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [pagination, setPagination] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [searchQuery, sort]);

  const fetchFAQs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getFAQs({ q: searchQuery, sort, page, limit: 20 });
      setFAQs(res.data.faqs);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await getTrendingFAQs();
      setTrending(res.data);
    } catch (err) {
      console.error('Failed to fetch trending:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFAQs(1);
  };

  const handleUpvote = async (faqId) => {
    if (!user) {
      alert('Please sign in to upvote');
      return;
    }
    try {
      const res = await upvoteFAQ(faqId);
      // Update local state
      setFAQs(faqs.map(f =>
        f._id === faqId
          ? { ...f, upvotes: res.data.upvotes, hasUpvoted: res.data.hasUpvoted }
          : f
      ));
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Knowledge Base
        </h1>
        <p className="text-slate-600">
          Find answers to commonly asked questions
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="input pl-12 py-3 text-lg shadow-sm"
            placeholder="Search FAQs by keyword, topic, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Trending Section */}
      {!searchQuery && trending.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            🔥 Trending FAQs
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.slice(0, 6).map(faq => (
              <FAQCard key={faq._id} faq={faq} onUpvote={handleUpvote} />
            ))}
          </div>
        </div>
      )}

      {/* All FAQs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {searchQuery ? `Search results for "${searchQuery}"` : 'All FAQs'}
          </h2>
          {!searchQuery && (
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input py-1.5 px-3 text-sm w-auto"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg">No FAQs found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {faqs.map(faq => (
              <FAQCard key={faq._id} faq={faq} onUpvote={handleUpvote} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => fetchFAQs(i + 1)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  pagination.page === i + 1
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// FAQ Card Component
function FAQCard({ faq, onUpvote }) {
  return (
    <div className="card group">
      <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">
        {faq.title}
      </h3>
      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
        {faq.description}
      </p>
      <div className="bg-slate-50 rounded-lg p-3 mb-3">
        <p className="text-sm text-slate-700">{faq.finalAnswer}</p>
      </div>

      {/* Tags */}
      {faq.tags && faq.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {faq.tags.slice(0, 4).map(tag => (
            <span key={tag} className="badge badge-gray">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>by</span>
          <span className="font-medium text-slate-700">
            {faq.createdBy?.name || 'Anonymous'}
          </span>
        </div>
        <button
          onClick={() => onUpvote(faq._id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            faq.hasUpvoted
              ? 'bg-primary-100 text-primary-700'
              : 'bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-600'
          }`}
        >
          <svg className="w-4 h-4" fill={faq.hasUpvoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 15l7-7 7 7" />
          </svg>
          {faq.upvotes}
        </button>
      </div>
    </div>
  );
}

export default FAQsPage;