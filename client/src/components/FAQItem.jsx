import { useState } from 'react';
import { Link } from 'react-router-dom';

const CATEGORY_COLORS = {
  'General': 'border-l-slate-400',
  'VINS': 'border-l-primary-500',
  'NOC': 'border-l-amber-500',
  'Evaluation': 'border-l-red-400',
  'Stipend': 'border-l-emerald-500',
  'Certificate': 'border-l-blue-400',
  'Project': 'border-l-purple-500',
  'Communication': 'border-l-pink-400',
};

const DEFAULT_COLOR = 'border-l-slate-300';

export default function FAQItem({ faq, onUpvote, user, compact = false, highlight = false }) {
  const [expanded, setExpanded] = useState(false);
  const [voted, setVoted] = useState(false);

  const colorClass = CATEGORY_COLORS[faq.tags?.[0]] || DEFAULT_COLOR;

  const handleUpvote = (e) => {
    e.stopPropagation();
    if (!user || voted) return;
    setVoted(true);
    onUpvote?.(faq._id);
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${colorClass} overflow-hidden
                  hover:border-slate-300 hover:shadow-md transition-all cursor-pointer
                  ${highlight ? 'ring-2 ring-primary-400 shadow-lg' : ''}`}
      onClick={() => !compact && setExpanded(e => !e)}
    >
      <div className={`${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-medium text-slate-800 leading-snug ${compact ? 'text-sm' : 'text-base'}`}>
            {faq.title}
          </h3>

          {/* Upvote button */}
          <button
            onClick={handleUpvote}
            disabled={!user || voted}
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all
              ${voted
                ? 'bg-primary-100 text-primary-600'
                : user
                  ? 'bg-slate-100 text-slate-500 hover:bg-primary-50 hover:text-primary-600'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            title={!user ? 'Sign in to upvote' : voted ? 'Already upvoted' : 'Upvote this FAQ'}
          >
            <span>↑</span>
            <span>{faq.upvotes + (voted ? 1 : 0)}</span>
          </button>
        </div>

        {/* Tags */}
        {!compact && (faq.tags?.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {faq.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Expanded answer */}
        {expanded && faq.finalAnswer && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-primary-300">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {faq.finalAnswer}
              </p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">
                {faq.createdBy?.name && `by ${faq.createdBy.name}`}
              </span>
              <Link
                to={`/wiki?highlight=${faq._id}`}
                onClick={e => e.stopPropagation()}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline">
                View in Wiki →
              </Link>
            </div>
          </div>
        )}

        {/* Compact: always show short answer */}
        {compact && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">
            {faq.finalAnswer}
          </p>
        )}
      </div>
    </div>
  );
}
