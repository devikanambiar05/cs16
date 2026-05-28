import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQueries, createAnswer, upvoteAnswer, acceptAnswer, claimQuery, unclaimQuery, createFAQRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CommunityPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, open, answered
  const [sort, setSort] = useState('recent');
  const [expandedQuery, setExpandedQuery] = useState(null);
  const [answerContent, setAnswerContent] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [pagination, setPagination] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    fetchQueries();
  }, [filter, sort]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const params = { sort };
      if (filter === 'open') params.status = 'open';
      if (filter === 'answered') params.status = 'answered';
      if (filter === 'claimed') params.claimed = 'true';
      const res = await getQueries(params);
      setQueries(res.data.queries);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error('Failed to fetch queries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimQuery = async (queryId) => {
    if (!user) {
      alert('Please sign in to claim a query');
      return;
    }
    try {
      const res = await claimQuery(queryId);
      setQueries(queries.map(q => {
        if (q._id === queryId) {
          return { ...q, assignedTo: { _id: user._id, name: user.name } };
        }
        return q;
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to claim query');
    }
  };

  const handleUnclaimQuery = async (queryId) => {
    if (!user) return;
    try {
      await unclaimQuery(queryId);
      setQueries(queries.map(q => {
        if (q._id === queryId) {
          const { assignedTo, ...rest } = q;
          return { ...rest };
        }
        return q;
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to release claim');
    }
  };

  const handleSubmitAnswer = async (queryId) => {
    if (!user) {
      alert('Please sign in to submit an answer');
      return;
    }
    const content = answerContent[queryId]?.trim();
    if (!content) return;

    try {
      setSubmitting(queryId);
      const res = await createAnswer({ queryId, content });
      // Update local state
      setQueries(queries.map(q => {
        if (q._id === queryId) {
          return {
            ...q,
            answerCount: q.answerCount + 1,
            status: 'answered',
            answers: [...(q.answers || []), res.data]
          };
        }
        return q;
      }));
      setAnswerContent({ ...answerContent, [queryId]: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit answer');
    } finally {
      setSubmitting(null);
    }
  };

  const handleUpvoteAnswer = async (answerId, queryId) => {
    if (!user) {
      alert('Please sign in to upvote');
      return;
    }
    try {
      const res = await upvoteAnswer(answerId);
      setQueries(queries.map(q => {
        if (q._id === queryId && q.answers) {
          return {
            ...q,
            answers: q.answers.map(a =>
              a._id === answerId
                ? { ...a, upvotes: res.data.upvotes, hasUpvoted: res.data.hasUpvoted }
                : a
            )
          };
        }
        return q;
      }));
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const handleAcceptAnswer = async (answerId, queryId) => {
    if (!user) return;
    try {
      await acceptAnswer(answerId);
      // Update local state
      setQueries(queries.map(q => {
        if (q._id === queryId) {
          return {
            ...q,
            status: 'closed',
            answers: q.answers?.map(a => ({
              ...a,
              isAccepted: a._id === answerId
            }))
          };
        }
        return q;
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept answer');
    }
  };

  const handleRequestFAQ = async (answerId, queryId, query) => {
    if (!user) {
      alert('Please sign in to request a FAQ');
      return;
    }
    const answer = query.answers?.find(a => a._id === answerId);
    if (!answer) return;
    if (!confirm(`Request to add this answer as an FAQ for "${query.title}"?`)) return;
    try {
      await createFAQRequest({
        queryId,
        answerId,
        proposedQuestion: query.title,
        proposedAnswer: answer.content,
        proposedTags: query.tags || []
      });
      alert('FAQ request submitted! An admin will review it.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit FAQ request');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Community Answers
          </h1>
          <p className="text-slate-600">
            Browse open queries — claim the ones you can answer
          </p>
        </div>
        <div>
          <Link to="/ask" className="btn-primary">
            Raise a Query
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {['all', 'open', 'claimed', 'answered'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-100 text-primary-700'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input py-2 px-3 text-sm w-auto ml-auto"
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Active</option>
          <option value="unanswered">Unanswered First</option>
        </select>
      </div>

      {/* Query List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : queries.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-lg">No queries found</p>
          <Link to="/ask" className="text-primary-600 hover:underline mt-2 inline-block">
            Be the first to ask!
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}

function QueryCard({ query, isExpanded, onToggle, answerContent, onAnswerChange, onSubmitAnswer, onUpvoteAnswer, onAcceptAnswer, onRequestFAQ, onClaimQuery, onUnclaimQuery, submitting, currentUser }) {
  const assignedToId = query.assignedTo ? (query.assignedTo._id || query.assignedTo) : null;
  const isAssignedToCurrentUser = currentUser && assignedToId && assignedToId === (currentUser._id || currentUser.id);
  const isClosed = query.status === 'closed';
  const isOwnedByCurrentUser = currentUser && query.createdBy && (query.createdBy._id || query.createdBy) === (currentUser._id || currentUser.id);
  const canClaim = !isClosed && !assignedToId && currentUser && !isOwnedByCurrentUser;
  const canRelease = !isClosed && isAssignedToCurrentUser;

  return (
    <div
      id={`query-card-${query._id}`}
      className={`card transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary-200 shadow-md' : 'hover:border-primary-300'}`}
    >
      <div
        className="cursor-pointer"
        onClick={onToggle}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 hover:text-primary-600 transition-colors">
              {query.title}
            </h3>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              {query.description}
            </p>

            {/* Tags & Meta */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {isAssignedToCurrentUser && (
                <span className="badge bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold flex items-center gap-1">
                  🎯 Claimed by You
                </span>
              )}
              {!isAssignedToCurrentUser && assignedToId && (
                <span className="badge bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  🔒 Claimed by {query.assignedTo?.name || 'someone'}
                </span>
              )}
              {canClaim && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClaimQuery(); }}
                  className="badge bg-primary-100 text-primary-700 border border-primary-300 font-semibold flex items-center gap-1 cursor-pointer hover:bg-primary-200 transition-colors"
                >
                  🎯 Claim to Answer
                </button>
              )}
              {canRelease && (
                <button
                  onClick={(e) => { e.stopPropagation(); onUnclaimQuery(); }}
                  className="badge bg-slate-100 text-slate-600 border border-slate-300 font-semibold flex items-center gap-1 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  ✖ Release Claim
                </button>
              )}
              {query.tags?.map(tag => (
                <span key={tag} className="badge badge-gray">#{tag}</span>
              ))}
              <span className={`badge ${
                query.status === 'open' ? 'badge-yellow' :
                query.status === 'answered' ? 'badge-green' : 'badge-gray'
              }`}>
                {query.status}
              </span>
              <span className="text-xs text-slate-400 ml-auto">
                by {query.createdBy?.name} · {query.answerCount} answers
              </span>
            </div>
          </div>

          {/* Expand Icon */}
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-slate-100">
          {/* Full Description */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Description
            </h4>
            <p className="text-slate-700">{query.description}</p>
          </div>

          {/* Submit Answer */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Your Answer
            </h4>

            {query.answerCount >= 5 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-3 text-sm flex items-start gap-2">
                <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-semibold">Answer Cap Reached</p>
                  <p className="mt-0.5">This query has already reached the maximum cap of 5 answers to prevent spam and duplicate answers.</p>
                </div>
              </div>
            )}

            <textarea
              className="input resize-none disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
              rows={4}
              placeholder={query.answerCount >= 5 ? "Answer submissions are locked because the cap of 5 answers has been reached." : "Share your knowledge..."}
              value={answerContent}
              onChange={(e) => onAnswerChange(e.target.value)}
              disabled={query.answerCount >= 5}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={onSubmitAnswer}
                disabled={!answerContent.trim() || submitting || query.answerCount >= 5}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </div>

          {/* Existing Answers */}
          {query.answers && query.answers.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {query.answers.length} Answer{query.answers.length !== 1 ? 's' : ''}
              </h4>
              <div className="space-y-3">
                {query.answers
                  .sort((a, b) => {
                    if (a.isAccepted) return -1;
                    if (b.isAccepted) return 1;
                    return b.upvotes - a.upvotes;
                  })
                  .map(answer => (
                    <div
                      key={answer._id}
                      className={`p-4 rounded-lg ${
                        answer.isAccepted
                          ? 'accepted-answer'
                          : 'bg-slate-50'
                      }`}
                    >
                      <p className="text-slate-700 mb-3">{answer.content}</p>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onUpvoteAnswer(answer._id)}
                          className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                            answer.hasUpvoted
                              ? 'text-primary-600'
                              : 'text-slate-500 hover:text-primary-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill={answer.hasUpvoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          {answer.upvotes}
                        </button>

                        <span className="text-xs text-slate-500">
                          by {answer.userId?.name}
                        </span>

                        {answer.isAccepted && (
                          <span className="badge badge-green flex items-center gap-1">
                            ✓ Accepted Answer
                          </span>
                        )}

                        {/* Accept button - only for query owner */}
                        {currentUser && !answer.isAccepted && !query.resolvedFAQ && (
                          <button
                            onClick={() => onAcceptAnswer(answer._id)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium ml-auto"
                          >
                            Accept Answer
                          </button>
                        )}

                        {/* Request to Add to FAQ - query owner or admin */}
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
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommunityPage;