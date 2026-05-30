import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { getBookmarks, toggleBookmark } from '../services/api';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, setBookmarks } = useAuth();
  const toast = useToast();
  const [savedFaqs, setSavedFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  useEffect(() => {
    loadSavedFAQs();
  }, []);

  const loadSavedFAQs = async () => {
    try {
      setLoading(true);
      const res = await getBookmarks();
      setSavedFaqs(res.data || []);
    } catch (err) {
      toast.error('Failed to load saved FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbookmark = async (e, faqId) => {
    e.stopPropagation();
    try {
      const res = await toggleBookmark(faqId);
      setBookmarks(res.data.bookmarks);
      setSavedFaqs(prev => prev.filter(f => f._id !== faqId));
      toast.success('Removed FAQ from saved list');
    } catch (err) {
      toast.error('Failed to remove FAQ');
    }
  };

  if (!user) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Page Title Header */}
      <div className="border-b border-slate-200/60 dark:border-slate-800/60 pb-6 mb-8 select-none">
        <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100 font-serif">
          My Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-light">
          Manage your saved content, monitor your community reputation, and review your contributions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: User Profile Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] backdrop-blur-md">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-150 dark:border-slate-800/50">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-full text-3xl font-serif flex items-center justify-center shadow-inner mb-4 select-none">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-serif">{user.name}</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{user.email}</p>
              
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-3 px-2.5 py-0.5 rounded-full select-none ${
                user.role === 'admin' 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/30' 
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/30'
              }`}>
                {user.role === 'admin' ? '🛡️ Administrator' : '🎓 Community Member'}
              </span>
            </div>

            {/* Profile Statistics Grid */}
            <div className="grid grid-cols-2 gap-4 py-6 border-b border-slate-150 dark:border-slate-800/50 select-none">
              <div className="text-center p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/15 border border-slate-100/50 dark:border-slate-850/50">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Reputation</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1 font-serif">🏆 {user.reputation || 0}</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/15 border border-slate-100/50 dark:border-slate-850/50">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Saved FAQs</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1 font-serif">🔖 {savedFaqs.length}</p>
              </div>
            </div>

            {/* Micro Details List */}
            <div className="pt-6 space-y-3.5 text-xs select-none">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Questions Raised:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{user.questionsAsked || 0}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Peer Answers Given:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{user.answersGiven || 0}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Member Since:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bookmarked/Saved FAQs Section */}
        <div className="lg:col-span-8">
          <div className="card bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.01)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] backdrop-blur-md">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-150 dark:border-slate-800/50 select-none">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 font-serif flex items-center gap-2">
                🔖 Saved Bookmarks <span className="font-normal text-xs text-slate-400">({savedFaqs.length})</span>
              </h2>
              {savedFaqs.length > 0 && (
                <span className="text-[10px] text-slate-400">Click a title to read the resolved answer</span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner" />
              </div>
            ) : savedFaqs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50/20 dark:bg-slate-950/5">
                <span className="text-3xl mb-3 block">📖</span>
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-350">No saved FAQs yet</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto">
                  Browse the knowledge base and click the bookmark ribbon icon on any FAQ card to save it here for offline reading!
                </p>
                <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline mt-4">
                  Explore FAQs →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-150 dark:divide-slate-800/50 list-none pl-0">
                {savedFaqs.map((faq, index) => {
                  const isExpanded = expandedFaqId === faq._id;
                  return (
                    <li key={faq._id} className={`${index > 0 ? 'pt-4.5' : ''} pb-4.5 group`}>
                      <div 
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq._id)}
                        className="flex items-start justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 transition-colors leading-snug font-serif flex items-center gap-1.5">
                            • {faq.title}
                          </h3>
                          
                          {/* Bookmarked FAQ Category */}
                          {faq.category && (
                            <span className="inline-block text-[9px] text-slate-405 dark:text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                              📁 {faq.category}
                            </span>
                          )}
                        </div>

                        {/* Unsave action button */}
                        <div className="flex items-center gap-2.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleUnbookmark(e, faq._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                            title="Unsave bookmark"
                          >
                            <svg className="w-4 h-4" fill="currentColor" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Answer Section */}
                      <div
                        className={`transition-all duration-350 overflow-hidden ${
                          isExpanded 
                            ? 'max-h-[1000px] opacity-100 mt-3 pl-3.5 border-l border-primary-300 dark:border-primary-900/60' 
                            : 'max-h-0 opacity-0 pointer-events-none'
                        }`}
                      >
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-wrap font-sans select-text">
                          {faq.finalAnswer}
                        </p>
                        
                        {/* Meta logs */}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 select-none">
                          <span>Upvotes: {faq.upvotes || 0}</span>
                          <span>•</span>
                          <span>Saved by you</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
