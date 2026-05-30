import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPins } from '../services/api';

export default function CommunityBoard() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPins()
      .then(res => setPins(res.data || []))
      .catch(() => setPins([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || pins.length === 0) return null;

  const typeConfig = {
    faq: {
      icon: '📌',
      bg: 'from-primary-50 to-white dark:from-primary-950/20 dark:to-slate-900',
      border: 'border-primary-200 dark:border-primary-900/40',
      badge: 'bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300',
      label: 'Pinned FAQ',
    },
    announcement: {
      icon: '📢',
      bg: 'from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900',
      border: 'border-amber-200 dark:border-amber-900/30',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      label: 'Announcement',
    },
    overview: {
      icon: 'ℹ️',
      bg: 'from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900',
      border: 'border-emerald-200 dark:border-emerald-900/30',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      label: 'Overview',
    },
  };

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-amber-100 dark:bg-amber-950/40 rounded flex items-center justify-center">
          <span className="text-sm">📌</span>
        </div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Community Board
        </h2>
      </div>

      {/* Square card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {pins.map(pin => {
          const cfg = typeConfig[pin.type] || typeConfig.overview;
          return (
            <div
              key={pin._id}
              className={`relative rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.bg} p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default`}
              style={{ minHeight: '140px' }}
            >
              {/* Type badge */}
              <div className="flex items-center">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 flex-1">
                {pin.title}
              </h3>

              {/* Content */}
              {pin.type === 'faq' && pin.faqId ? (
                <div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {pin.faqId.finalAnswer || 'No answer yet.'}
                  </p>
                  <Link
                    to={`/wiki?highlight=${pin.faqId._id}`}
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-700 mt-1.5 transition-colors"
                  >
                    Read more <span>→</span>
                  </Link>
                </div>
              ) : pin.content ? (
                <p className="text-xs text-slate-500 line-clamp-3 whitespace-pre-wrap flex-1">
                  {pin.content}
                </p>
              ) : null}

              {/* Footer */}
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-auto pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                {pin.pinnedBy?.name && (
                  <span className="truncate">by {pin.pinnedBy.name}</span>
                )}
                {pin.order !== undefined && pin.order !== 0 && (
                  <span className="text-slate-300 dark:text-slate-700 shrink-0">#{pin.order + 1}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
