import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQueries, createAnswer, upvoteAnswer, acceptAnswer, claimQuery, unclaimQuery, createFAQRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RichTextEditor, { MarkdownContent } from '../components/RichTextEditor';

// ─── SLA helpers ──────────────────────────────────────────────────────────────

function formatTimeLeft(msLeft) {
  if (msLeft <= 0) return 'Expired';
  const h = Math.floor(msLeft / (1000 * 60 * 60));
  const m = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function getSlaStatus(expiresAt) {
  if (!expiresAt) return null;
  const msLeft = new Date(expiresAt) - new Date();
  if (msLeft <= 0) return { label: 'SLA Expired', urgency: 'critical', msLeft: 0 };
  const h = msLeft / (1000 * 60 * 60);
  if (h < 1) return { label: `${Math.floor(msLeft / 60000)}m left`, urgency: 'critical', msLeft };
  if (h < 4) return { label: `${Math.floor(h)}h ${Math.floor((msLeft % 3600000) / 60000)}m left`, urgency: 'critical', msLeft };
  if (h < 12) return { label: `${Math.floor(h)}h left`, urgency: 'warning', msLeft };
  if (h < 20) return { label: `${Math.floor(h)}h left`, urgency: 'caution', msLeft };
  return { label: `${Math.floor(h)}h left`, urgency: 'ok', msLeft };
}

function SlaBadge({ expiresAt }) {
  const status = getSlaStatus(expiresAt);
  if (!status) return null;
  const classes = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    caution: 'bg-amber-50 text-amber-700 border-amber-200',
    warning: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200 font-semibold'
  };
  return (
    <span className={`badge text-xs border ${classes[status.urgency]}`}>
      ⏱ {status.label}
    </span>
  );
}

function SlaWarningBanner({ expiresAt }) {
  const status = getSlaStatus(expiresAt);
  if (!status || status.urgency === 'ok' || status.urgency === 'caution') return null;
  return (
    <div className={`mt-3 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${
      status.urgency === 'warning'
        ? 'bg-orange-50 border border-orange-200 text-orange-700'
        : 'bg-red-50 border border-red-200 text-red-700 font-medium'
    }`}>
      {status.urgency === 'warning'
        ? '⚠️ This query needs an answer soon — SLA deadline approaching'
        : '🚨 SLA deadline breached! Answer immediately or claim will be released'}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CommunityPage() {
  const { user } = useAuth();

  const [queries, setQueries] = useState([]);
  const [expandedQuery, setExpandedQuery] = useState(null);
  const [answerContent, setAnswerContent] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [filter, setFilter] = useState('open');
  const [sort, setSort] = useState récent');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchQueries();
  }, [filter, sort, page]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const params = { sort, page, limit: PAGE_SIZE };
      if (filter === 'open') params.status = 'open';
      else if (filter === 'answered') params.status = 'answered';
      else if (filter === 'claimed') params.claimed = 'true';
      const res = await getQueries(params);
      let list = res.data.queries;
      if (filter === 'sla-breached') {
        list = list.filter(q => q.expiresAt && new Date(q.expiresAt) < new Date() && q.status !== 'closed');
      }
      setQueries(list);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load queries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimQuery = async (queryId) => {
    if (!user) { alert('Please sign in to claim a query'); return; }
    try {
      const res = await claimQuery(queryId);
      setQueries(queries.map(q => q._id === queryId ? { ...q, assignedTo: { _id: user._id, name: user.name } } : q));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to claim query');
    }
  };

  const handleUnclaimQuery = async (queryId) => {
    if (!user) return;
    try {
      await unclaimQuery(queryId);
      setQueries(queries.map(q => q._id === queryId ? { ...q, assignedTo: null } : q));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to release claim');
    }
  };

  const handleSubmitAnswer = async (queryId) => {
    const content = answerContent[queryId];
    if (!content || !content.trim()) { alert('Please write an answer before submitting.'); return; }
    if (!user) { alert('Please sign in to answer.'); return; }
    setSubmitting(queryId);
    try {
      await createAnswer(queryId, content);
      setAnswerContent({ ...answerContent, [queryId]: '' });
      fetchQueries();
      setExpandedQuery(queryId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit answer');
    } finally {
      setSubmitting(null);
    }
  };

  const handleUpvoteAnswer = async (answerId, queryId) => {
    if (!user) { alert('Please sign in to upvote.'); return; }
    try {
      await upvoteAnswer(answerId);
      fetchQueries();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upvote');
    }
  };

  const handleAcceptAnswer = async (answerId, queryId) => {
    if (!user) return;
    try {
      await acceptAnswer(answerId);
      fetchQueries();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept answer');
    }
  };

  const handleRequestFAQ = async (answerId, queryId, query) => {
    if (!user) { alert('Please sign in to request a FAQ'); return; }
    const answer = query.answers?.find(a => a._id === answerId);
    if (!answer) return;
    if (!confirm(`Request to add this answer as an FAQ for "${query.title}"?`)) return;
    try {
      await createFAQRequest({ queryId, answerId, proposedQuestion: query.title, proposedAnswer: answer.content, proposedTags: query.tags || [] });
      alert('FAQ request submitted! An admin will review it.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit FAQ request');
    }
  };

  const handleTakeQuestion = async () => {
    if (!user) { alert('Please sign in to take a question'); return; }
    try {
      setLoading(true);
      const res = await getQueries({ status: 'open', sort: 'recent', limit: 1 });
      const available = res.data.queries.find(q => !q.assignedTo);
      if (!available) { alert('No open queries available right now.'); return; }
      const claimRes = await claimQuery(available._id);
      const assignedQuery = claimRes.data.query || available;
      alert(`🎯 Claimed: "${assignedQuery.title}"\n⏱ You now have 24 hours to answer it.`);
      const exists = queries.some(q => q._id === assignedQuery._id);
      if (exists) {
        setQueries(queries.map(q => q._id === assignedQuery._id ? { ...q, assignedTo: { _id: user._id, name: user.name } } : q));
      } else {
        setQueries([assignedQuery, ...queries]);
      }
      setExpandedQuery(assignedQuery._id);
      setTimeout(() => {
        const el = document.getElementById(`query-card-${assignedQuery._id}`);
        if (el) el.scroll.intoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    } catch (err) {
      alert(err.response?.data?.error || 'No open queries available right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Community Answers</h1>
          <p className="text-slate-600">
            Browse open queries — claim or auto-assign, answer within 24h SLA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTakeQuestion}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-sm"
            disabled={loading}
            title="Auto-assign yourself an open query — 24hr SLA starts now"
          >
            <span>🎯</span> Take a Question
          </button>
          <Link to="/ask" className="btn-primary">
            Raise a Query
          </Link>
        </div>
      </div>

      {/* SLA Info Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 flex items-center gap-4">
        <span className="text-2xl">⏱</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">24-Hour SLA Policy</p>
          <p className="text-xs text-amber-700">Every query must be answered within 24 hours. Unanswered claims are auto-released. Queries past SLA are auto-assigned to the most active community member.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1.5">
          {['all', 'open', 'claimed', 'sla-breached', 'answered'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filter === f
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'sla-breached' ? '⚠️ SLA Breached' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:border-primary-400"
          >
            <option value="recent">Most Recent</option>
            <option value="trending">Most Active</option>
          </select>
        </div>
      </div>

      {/* Query list */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : queries.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-lg font-medium text-slate-600">No queries found</p>
          <p className="text-sm mt-1">Be the first to ask a question!</p>
          <Link to="/ask" className="btn-primary mt-4 inline-block">Raise a Query</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {queries.map(query => (
              <QueryCard
                key={query._id}
                query={query}
                isExpanded={expandedQuery === query._id}
                onToggle={() => setExpandedQuery(expandedQuery === query._id ? null : query._id)}
                answerContent={answerContent[query._id] || ''}
                onAnswerChange={(val) => setAnswerContent({ ...answerContent, [query._id]: val })}
                onSubmitAnswer={() => handleSubmitAnswer(query._id)}
                onUpvoteAnswer={(id) => handleUpvoteAnswer(id, query._id)}
                onAcceptAnswer={(id) => handleAcceptAnswer(id, query._id)}
                onRequestFAQ={(id) => handleRequestFAQ(id, query._id, query)}
                onClaimQuery={() => handleClaimQuery(query._id)}
                onUnclaimQuery={() => handleUnclaimQuery(query._id)}
                submitting={submitting === query._id}
                currentUser={user}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline text-sm py-1.5 px-4 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-outline text-sm py-1.5 px-4 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Query Card ───────────────────────────────────────────────────────────────

function QueryCard({ query, isExpanded, onToggle, answerContent, onAnswerChange, onSubmitAnswer, onUpvoteAnswer, onAcceptAnswer, onRequestFAQ, onClaimQuery, onUnclaimQuery, submitting, currentUser }) {
  const assignedToId = query.assignedTo ? (query.assignedTo._id || query.assignedTo) : null;
  const isAssignedToCurrentUser = currentUser && assignedToId && assignedToId === (currentUser._id || currentUser.id);
  const isOwnedByCurrentUser = currentUser && query.createdBy && (query.createdBy._id || query.createdBy) === (currentUser._id || currentUser.id);
  const isClosed = query.status === 'closed';
  const canClaim = !isClosed && !assignedToId && currentUser && !isOwnedByCurrentUser;
  const canRelease = !isClosed && isAssignedToCurrentUser;

  return (
    <div id={`query-card-${query._id}`} className={`card transition-all ${isClosed ? 'opacity-60' : ''}`}>
      {/* Card header — always visible */}
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-medium text-slate-900 leading-snug">{query.title}</h3>
            <span className={`badge text-xs shrink-0 ${
              query.status === 'open' ? 'badge-blue' :
              query.status === 'claimed' ? 'badge-yellow' :
              query.status === 'answered' ? 'badge-green' : 'badge-gray'
            }`}>
              {query.status}
            </span>
            <SlaBadge expiresAt={query.expiresAt} />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(query.tags || []).map(tag => (
              <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
            <span className="text-xs text-slate-400">by {query.createdBy?.name || 'Unknown'}</span>
            <span className="text-xs text-slate-400">· {query.answerCount || 0} answer{query.answerCount !== 1 ? 's' : ''}</span>
            {query.escalationCount > 0 && (
              <span className="text-xs text-red-500">· ⚠️ escalated {query.escalationCount}x</span>
            )}
          </div>
        </div>

        {/* Claim badges — visible even when collapsed */}
        {!isExpanded && assignedToId && (
          <div className="shrink-0">
            {isAssignedToCurrentUser ? (
              <span className="badge bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs">🎯 Claimed by You</span>
            ) : (
              <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-xs">🔒 {query.assignedTo?.name}</span>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          {/* SLA warning banner */}
          <SlaWarningBanner expiresAt={query.expiresAt} />

          {/* Description */}
          <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-1.5">Description</p>
            <MarkdownContent content={query.description} />
          </div>

          {/* Claim / Release buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {canClaim && (
              <button onClick={onClaimQuery} className="btn-primary text-sm py-1.5">
                🎯 Claim to Answer
              </button>
            )}
            {canRelease && (
              <button onClick={onUnclaimQuery} className="btn-outline text-sm py-1.5">
                ✖ Release Claim
              </button>
            )}
            {isOwnedByCurrentUser && !isClosed && (
              <span className="text-xs text-slate-400 self-center">You raised this query</span>
            )}
          </div>

          {/* Answers */}
          {query.answers && query.answers.length > 0 && (
            <div className="space-y-3 mb-4">
              <p className="text-sm font-semibold text-slate-700">{query.answers.length} Answer{query.answers.length !== 1 ? 's' : ''}</p>
              {query.answers.map(answer => (
                <div key={answer._id} className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-800">{answer.userId?.name || 'Anonymous'}</span>
                      <span className="text-xs text-slate-400">· {answer.userId?.reputation || 0} rep</span>
                      {answer.isAccepted && (
                        <span className="badge badge-green text-xs flex items-center gap-0.5">✓ Accepted</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpvoteAnswer(answer._id)}
                        className="text-xs text-slate-400 hover:text-primary-600 flex items-center gap-0.5"
                      >
                        ▲ {answer.upvotes || 0}
                      </button>
                      {isOwnedByCurrentUser && !answer.isAccepted && !query.resolvedFAQ && (
                        <button
                          onClick={() => onAcceptAnswer(answer._id)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Accept
                        </button>
                      )}
                      {(isOwnedByCurrentUser || (currentUser && currentUser.role === 'admin')) && (
                        <button
                          onClick={() => onRequestFAQ(answer._id)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          📋 Request to Add to FAQ
                        </button>
                      )}
                    </div>
                  </div>
                  <MarkdownContent content={answer.content} />
                </div>
              ))}
            </div>
          )}

          {/* Answer input — only if query is not closed and user is not the owner */}
          {!isClosed && (!currentUser || (currentUser && !isOwnedByCurrentUser)) && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Your Answer</p>
              <RichTextEditor
                value={answerContent}
                onChange={onAnswerChange}
                placeholder="Write your answer here... (Tip: use **bold**, *italic*, and - for bullet points)"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={onSubmitAnswer}
                  disabled={submitting || !answerContent.trim()}
                  className="btn-primary text-sm py-2 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              </div>
            </div>
          )}

          {isClosed && (
            <div className="bg-slate-100 rounded-lg px-4 py-3 text-sm text-slate-500 text-center">
              ✓ This query has been closed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommunityPage;
