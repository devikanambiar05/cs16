import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminStats, getQueries, getAdminUsers, banUser, convertAnswerToFAQ, closeQuery, getFAQRequests, approveFAQRequest, rejectFAQRequest, getSlaStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [queries, setQueries] = useState([]);
  const [users, setUsers] = useState([]);
  const [faqRequests, setFaqRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [requestFilter, setRequestFilter] = useState('pending');

  // Protect: admin only
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
      fetchQueries();
      fetchUsers();
      fetchFAQRequests();
    }
  }, [user, activeTab]);

  const fetchStats = async () => {
    try {
      const [statsRes, slaRes] = await Promise.all([
        getAdminStats(),
        getSlaStats()
      ]);
      setStats({ ...statsRes.data, sla: slaRes.data });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const res = await getQueries({ limit: 50 });
      setQueries(res.data.queries);
    } catch (err) {
      console.error('Failed to load queries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers({ limit: 50 });
      setUsers(res.data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFAQRequests = async (status) => {
    try {
      setLoading(true);
      const s = status !== undefined ? status : requestFilter;
      const res = await getFAQRequests({ status: s === 'all' ? undefined : s, limit: 50 });
      setFaqRequests(res.data.requests);
    } catch (err) {
      console.error('Failed to load FAQ requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    if (!confirm("Are you sure you want to toggle this user's ban status?")) return;
    setActionLoading(userId);
    try {
      const res = await banUser(userId);
      setUsers(users.map(u =>
        u._id === userId ? { ...u, status: res.data.user.status } : u
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToFAQ = async (answerId, queryId) => {
    if (!confirm('Convert this accepted answer into a public FAQ?')) return;
    setActionLoading(answerId);
    try {
      await convertAnswerToFAQ(answerId);
      setQueries(queries.map(q =>
        q._id === queryId ? { ...q, status: 'closed', resolvedFAQ: { _id: 'new' } } : q
      ));
      alert('FAQ created successfully!');
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to convert to FAQ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseQuery = async (queryId) => {
    setActionLoading(queryId);
    try {
      await closeQuery(queryId);
      setQueries(queries.map(q =>
        q._id === queryId ? { ...q, status: 'closed' } : q
      ));
      fetchStats();
    } catch (err) {
      console.error('Failed to close query:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveFAQRequest = async (requestId, adminNotes) => {
    if (!confirm('Approve this FAQ request? The FAQ will be created.')) return;
    setActionLoading(requestId);
    try {
      await approveFAQRequest(requestId, { adminNotes });
      setFaqRequests(faqRequests.map(r =>
        r._id === requestId ? { ...r, status: 'approved' } : r
      ));
      alert('FAQ request approved and FAQ created!');
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve FAQ request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectFAQRequest = async (requestId) => {
    const adminNotes = prompt('Reason for rejection (optional):');
    if (adminNotes === null) return;
    setActionLoading(requestId);
    try {
      await rejectFAQRequest(requestId, { adminNotes });
      setFaqRequests(faqRequests.map(r =>
        r._id === requestId ? { ...r, status: 'rejected' } : r
      ));
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject FAQ request');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage community content and users</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="badge badge-red">Admin</span>
          <span>{user.name}</span>
          {stats?.pendingFaqRequests > 0 && (
            <span className="badge bg-amber-100 text-amber-800 border border-amber-200">
              {stats.pendingFaqRequests} FAQ request{stats.pendingFaqRequests !== 1 ? 's' : ''} pending
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-8">
        {['overview', 'queries', 'users', 'faq-requests'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total FAQs" value={stats.totalFAQs} icon="📋" color="bg-primary-50" />
            <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="bg-emerald-50" />
            <StatCard label="Open Queries" value={stats.openQueries} icon="❓" color="bg-amber-50" />
            <StatCard label="Answered Queries" value={stats.answeredQueries} icon="💬" color="bg-violet-50" />
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Queries" value={stats.totalQueries} icon="📝" color="bg-slate-50" />
            <StatCard label="Total Answers" value={stats.totalAnswers} icon="💡" color="bg-blue-50" />
          </div>

          {/* Recent Queries */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Recent Queries</h2>
            {stats.recentQueries.length === 0 ? (
              <p className="text-slate-400 text-sm">No recent queries</p>
            ) : (
              <div className="space-y-3">
                {stats.recentQueries.map(q => (
                  <div key={q._id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <span className={`badge ${
                      q.status === 'open' ? 'badge-yellow' :
                      q.status === 'answered' ? 'badge-green' : 'badge-gray'
                    }`}>
                      {q.status}
                    </span>
                    <span className="text-sm text-slate-700 flex-1 truncate">{q.title}</span>
                    <span className="text-xs text-slate-400">{q.answerCount} answers</span>
                    <span className="text-xs text-slate-400">by {q.createdBy?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Queries Tab */}
      {activeTab === 'queries' && (
        <div>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-5">
            {['all', 'open', 'answered', 'closed'].map(f => (
              <button
                key={f}
                onClick={() => {
                  setLoading(true);
                  getQueries({ status: f === 'all' ? undefined : f, limit: 50 })
                    .then(res => setQueries(res.data.queries))
                    .finally(() => setLoading(false));
                }}
                className="btn-outline text-sm py-1.5"
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : queries.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No queries found</div>
          ) : (
            <div className="space-y-4">
              {queries.map(q => (
                <div key={q._id} className="card">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{q.title}</h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{q.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`badge ${
                          q.status === 'open' ? 'badge-yellow' :
                          q.status === 'answered' ? 'badge-green' : 'badge-gray'
                        }`}>
                          {q.status}
                        </span>
                        {q.tags?.map(tag => (
                          <span key={tag} className="badge badge-gray">#{tag}</span>
                        ))}
                        <span className="text-xs text-slate-400 ml-auto">
                          {q.answerCount} answers by {q.createdBy?.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {q.status !== 'closed' && (
                        <>
                          {q.status === 'answered' && (
                            <button
                              onClick={() => handleConvertToFAQ(q._id, q._id)}
                              className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                            >
                              Review & Convert
                            </button>
                          )}
                          <button
                            onClick={() => handleCloseQuery(q._id)}
                            disabled={actionLoading === q._id}
                            className="btn-outline text-xs py-1.5 px-3"
                          >
                            {actionLoading === q._id ? '...' : 'Close'}
                          </button>
                        </>
                      )}
                      {q.resolvedFAQ && (
                        <span className="badge badge-green text-xs">FAQ Created</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">All Users</h2>
            <span className="text-sm text-slate-500">{users.length} users</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reputation</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stats</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{u.name}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-gray'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      <span className="font-medium text-primary-600">{u.reputation}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      Q: {u.questionsAsked || 0} &middot; A: {u.answersGiven || 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${u.status === 'banned' ? 'badge-red' : 'badge-green'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleBanUser(u._id)}
                          disabled={actionLoading === u._id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                            u.status === 'banned'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {actionLoading === u._id ? '...' : u.status === 'banned' ? 'Unban' : 'Ban'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* FAQ Requests Tab */}
      {activeTab === 'faq-requests' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-2">
              {['pending', 'approved', 'rejected', 'all'].map(f => (
                <button
                  key={f}
                  onClick={() => {
                    setRequestFilter(f);
                    fetchFAQRequests(f);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    requestFilter === f
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">{faqRequests.length} request{faqRequests.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : faqRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No FAQ requests found</div>
          ) : (
            <div className="space-y-4">
              {faqRequests.map(req => (
                <div key={req._id} className="card">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${
                          req.status === 'pending' ? 'badge-yellow' :
                          req.status === 'approved' ? 'badge-green' : 'badge-gray'
                        }`}>
                          {req.status}
                        </span>
                        <span className="text-sm text-slate-500">by {req.submittedBy?.name}</span>
                        {req.adminNotes && (
                          <span className="text-xs text-slate-400 italic">— {req.adminNotes}</span>
                        )}
                      </div>
                      <h3 className="font-medium text-slate-900 mb-1">{req.proposedQuestion}</h3>
                      <p className="text-sm text-slate-600 mb-2">From query: {req.queryId?.title}</p>
                      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 border border-slate-200 mb-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Proposed Answer</p>
                        <p className="whitespace-pre-wrap">{req.proposedAnswer}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(req.proposedTags || []).map(tag => (
                          <span key={tag} className="badge badge-gray text-xs">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveFAQRequest(req._id)}
                            disabled={actionLoading === req._id}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            {actionLoading === req._id ? '...' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectFAQRequest(req._id)}
                            disabled={actionLoading === req._id}
                            className="btn-outline text-xs py-1.5 px-3"
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <span className="badge badge-green text-xs">✓ Approved</span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="badge badge-gray text-xs">✕ Rejected</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value ?? 0}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;