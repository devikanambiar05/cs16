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

  const typeLabel = { faq: '📌 Pinned FAQ', announcement: '📢 Announcement', overview: 'ℹ️ Overview' };
  const typeBg = { faq: 'bg-primary-50 border-primary-200', announcement: 'bg-amber-50 border-amber-200', overview: 'bg-emerald-50 border-emerald-200' };
  const typeText = { faq: 'text-primary-600', announcement: 'text-amber-600', overview: 'text-emerald-600' };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📌</span>
        <h2 className="text-base font-semibold text-slate-800">Community Board</h2>
      </div>

      {/* Square board grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {pins.map(pin => (
          <div
            key={pin._id}
            className={`rounded-xl border p-4 flex flex-col gap-2 h-full ${typeBg[pin.type] || 'bg-slate-50 border-slate-200'}`}
            style={{ minHeight: '140px' }}
          >
            {/* Type badge */}
            <span className={`text-xs font-semibold uppercase tracking-wide ${typeText[pin.type]}`}>
              {typeLabel[pin.type] || pin.type}
            </span>

            {/* Title */}
            <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">
              {pin.title}
            </h3>

            {/* Content */}
            {pin.type === 'faq' && pin.faqId ? (
              <div className="flex-1">
                <p className="text-xs text-slate-600 line-clamp-3">
                  {pin.faqId.finalAnswer || 'No answer yet.'}
                </p>
                <Link
                  to={`/wiki?highlight=${pin.faqId._id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 mt-1 transition-colors"
                >
                  Read more →
                </Link>
              </div>
            ) : pin.content ? (
              <p className="flex-1 text-xs text-slate-600 line-clamp-4 whitespace-pre-wrap">
                {pin.content}
              </p>
            ) : (
              <p className="flex-1 text-xs text-slate-400 italic">No content.</p>
            )}

            {/* Footer */}
            <div className="text-xs text-slate-400 mt-auto pt-1 border-t border-slate-200/50">
              {pin.pinnedBy?.name && `Pinned by ${pin.pinnedBy.name}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
