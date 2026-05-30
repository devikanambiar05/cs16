import { useState, useEffect } from 'react';
import { getPins } from '../services/api';

export default function CommunityBoard() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState(null);

  useEffect(() => {
    getPins()
      .then(res => setPins(res.data || []))
      .catch(() => setPins([]))
      .finally(() => setLoading(false));
  }, []);

  const announcements = pins.filter(pin => pin.type === 'announcement');

  if (loading || announcements.length === 0) return null;

  const typeConfig = {
    announcement: {
      icon: '📢',
      bg: 'from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900',
      border: 'border-amber-200 dark:border-amber-900/30',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      label: 'Announcement',
    }
  };

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-amber-100 dark:bg-amber-950/40 rounded flex items-center justify-center">
          <span className="text-sm">📢</span>
        </div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Latest Announcements
        </h2>
      </div>

      {/* Grid of announcements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {announcements.map(pin => {
          const cfg = typeConfig.announcement;
          return (
            <div
              key={pin._id}
              onClick={() => setSelectedPin(pin)}
              className={`relative rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.bg} p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer select-none`}
              style={{ minHeight: '140px' }}
            >
              {/* Type badge */}
              <div className="flex items-center">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-2 flex-1">
                {pin.title}
              </h3>

              {/* Content */}
              {pin.content ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 whitespace-pre-wrap flex-1">
                  {pin.content}
                </p>
              ) : null}

              {/* Footer */}
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-auto pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                {pin.pinnedBy?.name && (
                  <span className="truncate font-medium">by {pin.pinnedBy.name}</span>
                )}
                {pin.order !== undefined && pin.order !== 0 && (
                  <span className="text-slate-300 dark:text-slate-700 shrink-0">#{pin.order + 1}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Modal overlay */}
      {selectedPin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedPin(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl dark:shadow-slate-950/50 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${typeConfig.announcement.badge}`}>
                <span>📢</span>
                <span>Announcement</span>
              </span>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg transition-colors p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Title */}
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {selectedPin.title}
            </h3>

            {/* Modal Body */}
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap py-3 border-t border-b border-slate-100 dark:border-slate-850/60 max-h-[50vh] overflow-y-auto">
              {selectedPin.content}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
              {selectedPin.pinnedBy?.name && (
                <span>Published by <span className="font-semibold text-slate-600 dark:text-slate-300">{selectedPin.pinnedBy.name}</span></span>
              )}
              {selectedPin.order !== undefined && selectedPin.order !== 0 && (
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">#{selectedPin.order + 1}</span>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => setSelectedPin(null)}
              className="mt-2 w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-sm font-medium transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
