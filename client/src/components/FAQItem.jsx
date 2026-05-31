import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from './ToastProvider';

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
  const toast = useToast();
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
      className={`bg-white dark:bg-[#22211e] rounded-xl border border-slate-100 dark:border-slate-800/80 border-l-4 ${colorClass} overflow-hidden
                  hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer
                  ${highlight ? 'ring-2 ring-primary-100 shadow-lg' : ''}`}
      onClick={() => !compact && setExpanded(e => !e)}
    >
      <div className={`${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
        {/* Header Question row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-semibold text-slate-850 dark:text-slate-100 leading-snug ${compact ? 'text-sm' : 'text-base'}`}>
            {faq.title}
          </h3>
        </div>

        {/* Compact mode: always show short answer */}
        {compact && (
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1.5 line-clamp-1">
            {faq.finalAnswer}
          </p>
        )}

        {/* Expanded Answer */}
        {expanded && faq.finalAnswer && (
          <div className="mt-3 pt-3 border-t border-slate-100/50 dark:border-slate-800/50">
            <div className="bg-slate-50 dark:bg-[#191816] rounded-lg p-4 border-l-4 border-primary-300 dark:border-primary-500 mb-2">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {faq.finalAnswer}
              </p>
            </div>
          </div>
        )}

        {/* Bottom row (only in non-compact mode) */}
        {!compact && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100/40 dark:border-slate-800/40" onClick={e => e.stopPropagation()}>
            {/* Left: Tags */}
            <div className="flex flex-wrap gap-1.5">
              {faq.tags && faq.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Right: Horizontal Actions */}
            <div className="flex items-center gap-4 shrink-0 select-none">
              {/* Upvote button */}
              <button
                onClick={handleUpvote}
                disabled={!user || voted}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                  ${voted
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'
                    : user
                      ? 'bg-slate-50 hover:bg-primary-50 hover:text-primary-600 dark:bg-[#191816] dark:hover:bg-primary-950/20 text-slate-500 dark:text-slate-400'
                      : 'bg-slate-50 text-slate-400 dark:bg-[#191816] cursor-not-allowed'
                  }`}
                title={!user ? 'Sign in to upvote' : voted ? 'Already upvoted' : 'Upvote this FAQ'}
              >
                <span>▲</span>
                <span>{faq.upvotes + (voted ? 1 : 0)}</span>
              </button>

              {/* Share button */}
              <button
                type="button"
                onClick={async (e) => {
                  const url = `${window.location.origin}/wiki?highlight=${faq._id}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    toast.success('📋 Share link copied to clipboard!');
                  } catch (err) {
                    toast.error('Failed to copy link');
                  }
                }}
                className="text-xs text-slate-400 hover:text-primary-600 dark:text-slate-500 transition-colors inline-flex items-center gap-1 font-semibold"
                title="Share FAQ"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l5.474-3.285M8.684 13.258l5.474 3.285M19 6.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm0 11a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM7 12a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Share
              </button>

              {/* View in Wiki Link */}
              <Link
                to={`/wiki?highlight=${faq._id}`}
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold hover:underline flex items-center gap-0.5"
              >
                View in Wiki →
              </Link>
          </div>
        )}
      </div>
    </div>
  );
}
