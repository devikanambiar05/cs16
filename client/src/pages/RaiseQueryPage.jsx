import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuery, getFAQs } from '../services/api';
import { useAuth } from '../context/AuthContext';

function RaiseQueryPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [similarFAQs, setSimilarFAQs] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !localStorage.getItem('token')) {
      navigate('/login', { state: { from: '/ask' } });
    }
  }, [user, navigate]);

  // Debounced search for similar FAQs while typing title
  useEffect(() => {
    if (!form.title.trim() || form.title.length < 5) {
      setSimilarFAQs([]);
      return;
    }

    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(async () => {
      try {
        const res = await getFAQs({ q: form.title, limit: 5 });
        setSimilarFAQs(res.data.faqs.slice(0, 4));
      } catch {
        // Silently fail
      }
    }, 400);

    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [form.title]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);
      const tags = form.tags
        ? form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

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

  const handleClearSimilar = () => {
    setSimilarFAQs([]);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Raise a Query
        </h1>
        <p className="text-slate-600">
          Can't find an answer? Ask the community — someone will help!
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Question Title *
          </label>
          <input
            type="text"
            className="input text-lg"
            placeholder="e.g., How do I apply for fee concession?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={200}
          />
          <p className="text-xs text-slate-400 mt-1 text-right">
            {form.title.length}/200
          </p>
        </div>

        {/* Similar FAQs Warning */}
        {similarFAQs.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-500">⚠️</span>
                <h4 className="font-medium text-amber-800">
                  Similar FAQs already exist
                </h4>
              </div>
              <button
                type="button"
                onClick={handleClearSimilar}
                className="text-xs text-amber-600 hover:text-amber-800"
              >
                Dismiss
              </button>
            </div>
            <div className="space-y-2">
              {similarFAQs.map(faq => (
                <div key={faq._id} className="bg-white rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-800">
                    {faq.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {faq.finalAnswer}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-700 mt-3">
              Please check if your question is already answered above.
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description *
          </label>
          <textarea
            className="input resize-none"
            rows={6}
            placeholder="Provide more details about your question. Include any relevant context that might help others understand and answer..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g., fees, concession, financial-aid"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          <p className="text-xs text-slate-400 mt-1">
            Adding tags helps others find your query
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting || !form.title.trim() || !form.description.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5"
          >
            {submitting ? 'Submitting...' : 'Submit Query'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-ghost text-slate-600"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-10 bg-slate-50 rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Tips for a good query</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            Be specific — include course name, semester, or other details
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            Check similar FAQs before posting to avoid duplicates
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            Add relevant tags to help others find your question
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            Be polite and patient — the community will respond!
          </li>
        </ul>
      </div>
    </div>
  );
}

export default RaiseQueryPage;