import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createQuery } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RichTextEditor from '../components/RichTextEditor';
import TagInput from '../components/TagInput';

const MAX_TAGS = 3;

function RaiseQueryPage() {
  const [form, setForm] = useState({ title: '', description: '' });
  const [tags, setTags] = useState([]);
  const [detectingTags, setDetectingTags] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Duplicate / similar results
  const [similarFAQs, setSimilarFAQs] = useState([]);
  const [similarQueries, setSimilarQueries] = useState([]);
  const [resolvedQueries, setResolvedQueries] = useState([]);
  const [highConfidenceDuplicate, setHighConfidenceDuplicate] = useState(null);

  const searchTimerRef = useRef(null);
  const tagTimerRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !localStorage.getItem('token')) {
      navigate('/login', { state: { from: '/ask' } });
    }
  }, [user, navigate]);

  // ── Duplicate search — fires 500ms after title stops changing ──────────────
  useEffect(() => {
    clearTimeout(searchTimerRef.current);

    if (!form.title.trim() || form.title.length < 5) {
      setSimilarFAQs([]);
      setSimilarQueries([]);
      setResolvedQueries([]);
      setHighConfidenceDuplicate(null);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/similar?q=${encodeURIComponent(form.title.trim())}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
        );
        const data = await res.json();
        setSimilarFAQs(data.faqs || []);
        setSimilarQueries(data.queries || []);
        setResolvedQueries(data.resolvedQueries || []);
        setHighConfidenceDuplicate(data.highConfidenceDuplicate || null);
      } catch {
        // non-critical
      }
    }, 500);

    return () => clearTimeout(searchTimerRef.current);
  }, [form.title]);

  // ── Tag auto-detection — fires 1s after BOTH title and description settle ──
  // Only auto-applies if the user hasn't manually set tags yet.
  useEffect(() => {
    clearTimeout(tagTimerRef.current);

    const text = `${form.title} ${form.description}`.trim();
    if (text.length < 15) return;

    tagTimerRef.current = setTimeout(async () => {
      setDetectingTags(true);
      try {
        const res = await fetch(
          `/api/search/detect-tags?title=${encodeURIComponent(form.title)}&description=${encodeURIComponent(form.description)}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const detected = (data.detectedTags || []).slice(0, MAX_TAGS);
        if (detected.length > 0) {
          // Auto-apply, but don't overwrite tags the user has manually edited
          setTags(prev => {
            if (prev.length > 0) return prev; // user already has tags — don't clobber
            return detected;
          });
        }
      } catch {
        // non-critical
      } finally {
        setDetectingTags(false);
      }
    }, 1000);

    return () => clearTimeout(tagTimerRef.current);
  }, [form.title, form.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required');
      return;
    }
    if (!user) { navigate('/login'); return; }

    try {
      setSubmitting(true);
      await createQuery({
        title: form.title.trim(),
        description: form.description.trim(),
        tags
      });
      navigate('/community');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  };

  const hasSuggestions = similarFAQs.length > 0 || similarQueries.length > 0 || resolvedQueries.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Raise a Query
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Can't find an answer? Ask the community — someone will help within 24 hours.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Question <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g., How do I apply for fee concession?"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            maxLength={200}
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{form.title.length}/200</p>
        </div>

        {/* Similarity panel — only shown when there are relevant results */}
        {hasSuggestions && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
            {/* High-confidence duplicate — takes priority */}
            {highConfidenceDuplicate ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4">
                <p className="font-medium text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                  <span>✓</span> This question already has an accepted answer
                </p>
                <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">
                  {highConfidenceDuplicate.title}
                </p>
                <p className="text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                  {highConfidenceDuplicate.acceptedAnswer?.content}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/community')}
                  className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  View in community →
                </button>
              </div>
            ) : (
              <>
                {/* Similar FAQs */}
                {similarFAQs.length > 0 && (
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                      Similar FAQs
                    </p>
                    <ul className="space-y-2">
                      {similarFAQs.map(faq => (
                        <li key={faq._id}>
                          <Link
                            to={`/wiki?highlight=${faq._id}`}
                            className="flex items-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-2 -m-2 transition-colors"
                          >
                            <span className="text-primary-400 mt-0.5">→</span>
                            <div>
                              <p className="text-slate-800 dark:text-slate-200 font-medium leading-snug">
                                {faq.title}
                              </p>
                              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 line-clamp-1">
                                {faq.finalAnswer}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Similar open queries */}
                {similarQueries.length > 0 && (
                  <div className="p-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                      Open community queries
                    </p>
                    <ul className="space-y-1.5">
                      {similarQueries.map(q => (
                        <li key={q._id} className="flex items-center justify-between gap-3">
                          <p className="text-slate-700 dark:text-slate-300 leading-snug">{q.title}</p>
                          <span className="badge badge-yellow shrink-0">{q.status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <RichTextEditor
            value={form.description}
            onChange={val => setForm({ ...form, description: val })}
            placeholder="Provide more context — include course, semester, or any relevant details..."
          />
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tags
              <span className="text-xs font-normal text-slate-400 ml-1.5">(up to {MAX_TAGS})</span>
            </label>
            {detectingTags && (
              <span className="text-xs text-indigo-400 animate-pulse">✦ detecting tags…</span>
            )}
          </div>
          <TagInput
            tags={tags}
            onChange={setTags}
            maxTags={MAX_TAGS}
          />
          <p className="text-xs text-slate-400 mt-1">
            Tags are auto-suggested as you type. You can edit them freely.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !form.title.trim() || !form.description.trim()}
            className="btn-primary px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit Query'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost text-slate-500">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default RaiseQueryPage;
