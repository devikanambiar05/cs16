import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import { useNavigate } from 'react-router-dom';
import {
  getAnalytics,
  getQueryStats,
  getQueries,
  deleteQuery,
  closeQuery,
  getUsers,
  updateUserBan,
  getFAQRequests,
  resolveFAQRequest,
  rejectFAQRequest,
  deleteFAQ,
  getAdminFaqs,
  patchFaq,
  pinFaq,
  getAdminPins,
  createPin,
  updatePin,
  deletePin
} from '../services/api';
import { useToast } from '../components/ToastProvider';

const TABS = ['Overview', 'Queries', 'Users', 'FAQ Requests', 'Manage FAQs', 'Pins'];
const PAGE_SIZE = 10;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [queries, setQueries] = useState([]);
  const [queryPage, setQueryPage] = useState(1);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userStatus, setUserStatus] = useState({});
  const [faqRequests, setFaqRequests] = useState([]);
  const [faqPage, setFaqPage] = useState(1);
  const [faqLoading, setFaqLoading] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqFilter, setFaqFilter] = useState('all');
  const [faqSearch, setFaqSearch] = useState('');
  const [adminFaqs, setAdminFaqs] = useState([]);
  // Pins tab state
  const [pins, setPins] = useState([]);
  const [pinsLoading, setPinsLoading] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [editingPin, setEditingPin] = useState(null);
  const [pinType, setPinType] = useState('announcement');
  const [pinTitle, setPinTitle] = useState('');
  const [pinContent, setPinContent] = useState('');
  const [pinFaqId, setPinFaqId] = useState('');
  const [pinOrder, setPinOrder] = useState(0);

  useEffect(() => {
    loadStats();
    loadQueries();
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'Overview') loadStats();
    if (activeTab === 'Queries') loadQueries();
    if (activeTab === 'Users') loadUsers();
    if (activeTab === 'FAQ Requests') loadFAQRequests();
    if (activeTab === 'Manage FAQs') loadAdminFaqs();
    if (activeTab === 'Pins') loadAdminPins();
  }, [activeTab]);

  async function loadStats() {
    try {
      const [analyticsRes, queryRes] = await Promise.all([
        getAnalytics(),
        getQueryStats()
      ]);
      const data = analyticsRes.data;
      setStats({
        totalUsers: data.totals?.totalUsers ?? 0,
        totalFaqs: data.totals?.totalFAQs ?? 0,
        totalAnswers: data.totals?.totalAnswers ?? 0,
        totalQueries: data.totals?.totalQueries ?? 0,
        monthly: data.monthly,
        growth: data.growth,
        openQueries: data.openQueries ?? 0,
        slaBreachRate: data.slaBreachRate ?? 0,
        slaBreachedQueries: data.slaBreachedQueries ?? 0,
        popularTags: data.popularTags ?? [],
        topContributors: data.topContributors ?? [],
        dailyStats: [],
        queryStats: queryRes.data
      });
    } catch (err) {
      showToast('Failed to load stats', 'error');
    }
  }

  async function loadQueries() {
    setLoadingQueries(true);
    try {
      const res = await getQueries({ page: queryPage, pageSize: PAGE_SIZE });
      setQueries(res.data.queries || []);
    } catch (err) {
      showToast('Failed to load queries', 'error');
    } finally {
      setLoadingQueries(false);
    }
  }

  async function loadUsers() {
    setLoadingUser(true);
    try {
      const res = await getUsers({ page: userPage, pageSize: PAGE_SIZE });
      setUsers(res.data.users || []);
    } catch (err) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoadingUser(false);
    }
  }

  async function loadFAQRequests() {
    setFaqLoading(true);
    try {
      const res = await getFAQRequests({ page: faqPage });
      setFaqRequests(res.data?.requests || res.data || []);
    } catch (err) {
      showToast('Failed to load FAQ requests', 'error');
    } finally {
      setFaqLoading(false);
    }
  }

  async function loadAdminFaqs() {
    setFaqLoading(true);
    try {
      const params = { pageSize: 50 };
      if (faqFilter !== 'all') params.status = faqFilter;
      const res = await getAdminFaqs(params);
      setAdminFaqs(res.data.faqs || res.data || []);
    } catch (err) {
      showToast('Failed to load FAQs', 'error');
    } finally {
      setFaqLoading(false);
    }
  }

  async function loadAdminPins() {
    setPinsLoading(true);
    try {
      const res = await getAdminPins();
      setPins(res.data || []);
    } catch (err) {
      showToast('Failed to load pins', 'error');
    } finally {
      setPinsLoading(false);
    }
  }

  async function handleCreatePin(e) {
    e.preventDefault();
    if (!pinTitle.trim()) return;

    if (pinType === 'faq') {
      if (!pinFaqId || !pinFaqId.trim()) {
        showToast('FAQ ID is required for pins of type FAQ', 'error');
        return;
      }
      if (!/^[0-9a-fA-F]{24}$/.test(pinFaqId.trim())) {
        showToast('Please enter a valid 24-character MongoDB ObjectId for the FAQ ID', 'error');
        return;
      }
    }

    try {
      if (editingPin) {
        await updatePin(editingPin._id, {
          title: pinTitle,
          content: pinType !== 'faq' ? pinContent : null,
          faqId: pinType === 'faq' ? pinFaqId.trim() : null,
          order: Number(pinOrder),
          type: pinType
        });
        showToast('Pin updated', 'success');
      } else {
        await createPin({
          type: pinType,
          title: pinTitle,
          content: pinType !== 'faq' ? pinContent : null,
          faqId: pinType === 'faq' ? pinFaqId.trim() : null,
          order: Number(pinOrder)
        });
        showToast('Pin created', 'success');
      }
      setShowPinForm(false);
      setEditingPin(null);
      setPinTitle('');
      setPinContent('');
      setPinFaqId('');
      setPinOrder(0);
      loadAdminPins();
    } catch (err) {
      showToast(editingPin ? 'Failed to update pin' : 'Failed to create pin', 'error');
    }
  }

  async function handleDeletePin(id) {
    if (!confirm('Remove this pin?')) return;
    try {
      await deletePin(id);
      showToast('Pin removed', 'success');
      loadAdminPins();
    } catch (err) {
      showToast('Failed to remove pin', 'error');
    }
  }

  function openEditPin(pin) {
    setEditingPin(pin);
    setPinType(pin.type || 'announcement');
    setPinTitle(pin.title || '');
    setPinContent(pin.content || '');
    setPinFaqId(pin.faqId?._id || '');
    setPinOrder(pin.order || 0);
    setShowPinForm(true);
  }

  function closePinForm() {
    setShowPinForm(false);
    setEditingPin(null);
    setPinTitle('');
    setPinContent('');
    setPinFaqId('');
    setPinOrder(0);
    setPinType('announcement');
  }

  async function handleClose(queryId) {
    try {
      await closeQuery(queryId);
      showToast('Query closed', 'success');
      loadQueries();
    } catch (err) {
      showToast('Failed to close query', 'error');
    }
  }

  async function handleDeleteQuery(queryId) {
    if (!window.confirm('Delete this query permanently?')) return;
    try {
      await deleteQuery(queryId);
      showToast('Query deleted', 'success');
      loadQueries();
    } catch (err) {
      showToast('Failed to delete query', 'error');
    }
  }

  async function handleResolve(faqReqId) {
    try {
      await resolveFAQRequest(faqReqId);
      showToast('FAQ request resolved', 'success');
      loadFAQRequests();
    } catch (err) {
      showToast('Failed to resolve FAQ request', 'error');
    }
  }

  async function handleRejectFAQ(faqReqId) {
    try {
      await rejectFAQRequest(faqReqId);
      showToast('FAQ request rejected', 'success');
      loadFAQRequests();
    } catch (err) {
      showToast('Failed to reject FAQ request', 'error');
    }
  }

  async function handleToggleBan(userId, currentStatus) {
    const isCurrentlyBanned = currentStatus === 'banned';
    const action = isCurrentlyBanned ? 'unban' : 'ban';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user?`)) return;
    try {
      setUserStatus(prev => ({ ...prev, [userId]: 'loading' }));
      await updateUserBan(userId, !isCurrentlyBanned);
      showToast(`User ${action}ned`, 'success');
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, status: isCurrentlyBanned ? 'active' : 'banned' } : u
      ));
    } catch (err) {
      showToast('Failed to update user', 'error');
    } finally {
      setUserStatus(prev => ({ ...prev, [userId]: null }));
    }
  }

  async function handleTogglePin(faqId, currentlyPinned) {
    try {
      await pinFaq(faqId);
      showToast(currentlyPinned ? 'FAQ unpinned' : 'FAQ pinned', 'success');
      loadAdminFaqs();
    } catch (err) {
      showToast('Failed to update pin status', 'error');
    }
  }

  async function handleSoftDeleteRestore(faqId, currentDeleted) {
    try {
      await patchFaq(faqId, { deletedAt: currentDeleted ? null : new Date() });
      showToast(currentDeleted ? 'FAQ restored' : 'FAQ soft-deleted', 'success');
      loadAdminFaqs();
    } catch (err) {
      showToast('Failed to update FAQ', 'error');
    }
  }

  async function handleEditSave(faqId, newAnswer) {
    try {
      await patchFaq(faqId, { finalAnswer: newAnswer });
      showToast('FAQ updated', 'success');
      setEditingFaq(null);
      loadAdminFaqs();
    } catch (err) {
      showToast('Failed to update FAQ', 'error');
    }
  }

  // Filter and search FAQs
  const filteredFaqs = adminFaqs.filter(faq => {
    const matchesSearch = faqSearch
      ? faq.title?.toLowerCase().includes(faqSearch.toLowerCase())
      : true;
    const matchesFilter = faqFilter === 'all'
      ? true
      : faqFilter === 'duplicate'
        ? faq.status === 'duplicate'
        : faq.status === faqFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap gap-1 -mb-px">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors focus:outline-none ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview */}
      {activeTab === 'Overview' && stats && <OverviewPanel stats={stats} />}

      {/* Queries */}
      {activeTab === 'Queries' && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Community Queries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 text-slate-500 font-medium">Query</th>
                  <th className="pb-3 text-slate-500 font-medium">Status</th>
                  <th className="pb-3 text-slate-500 font-medium">Claims</th>
                  <th className="pb-3 text-slate-500 font-medium">Answers</th>
                  <th className="pb-3 text-slate-500 font-medium">SLA</th>
                  <th className="pb-3 text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queries.map(q => (
                  <tr key={q._id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 text-slate-800 dark:text-slate-200 max-w-xs truncate">{q.title}</td>
                    <td className="py-3">
                      <span className={`badge badge-${q.status === 'open' ? 'green' : q.status === 'claimed' ? 'yellow' : 'red'}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{q.claims?.length || 0}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{q.answerCount || 0}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 flex gap-2">
                      <button onClick={() => navigate(`/community?highlight=${q._id}`)} className="text-primary-600 hover:underline text-xs">View</button>
                      <button onClick={() => handleClose(q._id)} className="text-red-600 hover:underline text-xs">Close</button>
                      <button onClick={() => handleDeleteQuery(q._id)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => { setQueryPage(p => Math.max(1, p - 1)); loadQueries(); }}
              disabled={queryPage === 1}
              className="btn-secondary text-sm disabled:opacity-40"
            >Previous</button>
            <span className="text-sm text-slate-500">Page {queryPage}</span>
            <button
              onClick={() => { setQueryPage(p => p + 1); loadQueries(); }}
              disabled={queries.length < PAGE_SIZE}
              className="btn-secondary text-sm disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === 'Users' && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 text-slate-500 font-medium">Name</th>
                  <th className="pb-3 text-slate-500 font-medium">Email</th>
                  <th className="pb-3 text-slate-500 font-medium">Role</th>
                  <th className="pb-3 text-slate-500 font-medium">Reputation</th>
                  <th className="pb-3 text-slate-500 font-medium">Status</th>
                  <th className="pb-3 text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 text-slate-800 dark:text-slate-200">{u.name}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="py-3">
                      <span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{u.role}</span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{(u.reputation || 0).toLocaleString()}</td>
                    <td className="py-3">
                      {u.status === 'banned'
                        ? <span className="badge badge-red">Banned</span>
                        : <span className="badge badge-green">Active</span>}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleToggleBan(u._id, u.status)}
                        disabled={userStatus[u._id] === 'loading'}
                        className="text-xs text-red-600 hover:underline disabled:opacity-40"
                      >
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => { setUserPage(p => Math.max(1, p - 1)); loadUsers(); }} disabled={userPage === 1} className="btn-secondary text-sm disabled:opacity-40">Previous</button>
            <span className="text-sm text-slate-500">Page {userPage}</span>
            <button onClick={() => { setUserPage(p => p + 1); loadUsers(); }} disabled={users.length < PAGE_SIZE} className="btn-secondary text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* FAQ Requests */}
      {activeTab === 'FAQ Requests' && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">FAQ Requests</h2>
          {faqLoading ? (
            <p className="text-slate-500">Loading...</p>
          ) : faqRequests.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No pending FAQ requests.</p>
          ) : (
            <div className="space-y-4">
              {faqRequests.map(req => (
                <div key={req._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="mb-2">
                    <span className={`badge ${req.status === 'pending' ? 'badge-yellow' : req.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                      {req.status}
                    </span>
                    {req.submittedBy && (
                      <span className="text-xs text-slate-400 ml-2">by {req.submittedBy.name || 'unknown'}</span>
                    )}
                    {req.queryId && (
                      <span className="text-xs text-slate-400 ml-2">on: {typeof req.queryId === 'object' ? req.queryId.title : req.queryId}</span>
                    )}
                  </div>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">Q: {req.proposedQuestion}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-3">A: {req.proposedAnswer}</p>
                  {req.proposedTags && req.proposedTags.length > 0 && (
                    <p className="text-xs text-slate-400 mb-2">Tags: {req.proposedTags.join(', ')}</p>
                  )}
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleResolve(req._id)} className="btn-primary text-sm">Approve</button>
                      <button onClick={() => handleRejectFAQ(req._id)} className="btn-secondary text-sm">Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage FAQs */}
      {activeTab === 'Manage FAQs' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Manage FAQs</h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Search FAQs..."
                value={faqSearch}
                onChange={e => setFaqSearch(e.target.value)}
                className="input py-1.5 text-sm w-48"
              />
              {/* Filter */}
              <select
                value={faqFilter}
                onChange={e => setFaqFilter(e.target.value)}
                className="input py-1.5 text-sm"
              >
                <option value="all">All FAQs</option>
                <option value="resolved">Resolved</option>
                <option value="duplicate">Duplicate</option>
              </select>
              {/* Refresh */}
              <button onClick={loadAdminFaqs} className="btn-secondary text-sm">Refresh</button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total FAQs', value: adminFaqs.length },
              { label: 'Resolved', value: adminFaqs.filter(f => f.status === 'resolved').length },
              { label: 'Soft-deleted', value: adminFaqs.filter(f => f.deletedAt).length },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          {faqLoading ? (
            <p className="text-slate-500">Loading...</p>
          ) : filteredFaqs.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No FAQs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-3 text-slate-500 font-medium">Title</th>
                    <th className="pb-3 text-slate-500 font-medium">Status</th>
                    <th className="pb-3 text-slate-500 font-medium">Tags</th>
                    <th className="pb-3 text-slate-500 font-medium">Upvotes</th>
                    <th className="pb-3 text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaqs.map(faq => (
                    <tr key={faq._id} className={`border-b border-slate-100 dark:border-slate-800 ${faq.deletedAt ? 'opacity-60' : ''}`}>
                      <td className="py-3 text-slate-800 dark:text-slate-200 max-w-xs truncate">{faq.title}</td>
                      <td className="py-3">
                        <span className={`badge ${faq.deletedAt ? 'badge-red' : faq.status === 'resolved' ? 'badge-green' : 'badge-yellow'}`}>
                          {faq.deletedAt ? 'Deleted' : faq.status}
                        </span>
                        {faq.pinned && <span className="badge badge-amber ml-1">pinned</span>}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {(faq.tags || []).slice(0, 3).join(', ')}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">{faq.upvotes || 0}</td>
                      <td className="py-3 flex gap-2 flex-wrap">
                        <button
                          onClick={() => setEditingFaq({ _id: faq._id, title: faq.title, finalAnswer: faq.finalAnswer || '' })}
                          className="text-primary-600 hover:underline text-xs whitespace-nowrap"
                        >
                          Edit Answer
                        </button>
                        <button
                          onClick={() => handleSoftDeleteRestore(faq._id, !!faq.deletedAt)}
                          className="text-xs hover:underline whitespace-nowrap"
                        >
                          {faq.deletedAt ? 'Restore' : 'Soft-Delete'}
                        </button>
                        <button
                          onClick={() => handleTogglePin(faq._id, !!faq.pinned)}
                          className={`text-xs hover:underline whitespace-nowrap ${faq.pinned ? 'text-amber-600' : ''}`}
                        >
                          {faq.pinned ? 'Unpin' : 'Pin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pins */}
      {activeTab === 'Pins' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif">Pins Administration</h2>
              <p className="text-xs text-slate-500 mt-1">Manage announcements, platform overviews, and persistent homepage FAQ spotlights.</p>
            </div>
            <button
              onClick={() => {
                closePinForm();
                setShowPinForm(true);
              }}
              className="btn-primary text-sm flex items-center gap-1.5 shadow-sm"
            >
              <span>+</span> New Pin
            </button>
          </div>

          {pinsLoading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : pins.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-3xl">📌</span>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium">No pins active on the platform feed.</p>
              <p className="text-xs text-slate-400 mt-1">Create an announcement, overview, or FAQ pin to pin content to the top.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pins.map(pin => (
                <div
                  key={pin._id}
                  className="card flex flex-col justify-between border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-[#1f1e1b]/40 backdrop-blur-sm shadow-sm hover:border-primary-400/50 dark:hover:border-primary-500/40 transition-all duration-300"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`badge uppercase tracking-wider text-[9px] px-2.5 py-0.5 font-bold ${
                        pin.type === 'faq' ? 'badge-blue' :
                        pin.type === 'announcement' ? 'badge-yellow' :
                        'badge-green'
                      }`}>
                        {pin.type}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 flex items-center gap-1 uppercase select-none">
                        Order Index: <span className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded">{pin.order}</span>
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug font-serif">{pin.title}</p>
                      {pin.type !== 'faq' && pin.content && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3 whitespace-pre-wrap font-sans">
                          {pin.content}
                        </p>
                      )}
                      {pin.type === 'faq' && pin.faqId && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-primary-50/20 dark:bg-primary-950/5 border border-primary-100/30 dark:border-primary-900/10">
                          <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider mb-1">Spotlight FAQ Link</p>
                          <p className="text-xs font-semibold text-slate-755 dark:text-slate-300 truncate">
                            {pin.faqId.title || "Untitled FAQ"}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">ID: {pin.faqId._id || pin.faqId}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 mt-4 pt-3 select-none">
                    <div className="text-[10px] text-slate-405 flex items-center gap-1.5">
                      <span>👤 Pinned by</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-350">{pin.pinnedBy?.name || 'Admin'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditPin(pin)}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-350 text-xs font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePin(pin._id)}
                        className="text-red-500 hover:text-red-650 text-xs font-bold transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create/Edit Pin Modal */}
          {showPinForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl w-full max-w-md animate-zoom-in">
                <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800/85 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif">
                    {editingPin ? '✏️ Modify Active Pin' : '📌 Create Spotlight Pin'}
                  </h3>
                  <button onClick={closePinForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCreatePin} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Pin Type</label>
                    <select
                      value={pinType}
                      onChange={e => setPinType(e.target.value)}
                      className="input w-full py-2.5 text-sm"
                    >
                      <option value="announcement">Announcement Card</option>
                      <option value="overview">Platform Overview Text</option>
                      <option value="faq">Spotlight FAQ Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Title</label>
                    <input
                      type="text"
                      value={pinTitle}
                      onChange={e => setPinTitle(e.target.value)}
                      className="input w-full py-2.5 text-sm"
                      placeholder="e.g. Phase 2 Registration Deadline"
                      required
                    />
                  </div>

                  {pinType !== 'faq' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Content Body</label>
                      <textarea
                        value={pinContent}
                        onChange={e => setPinContent(e.target.value)}
                        className="input w-full font-sans py-2 text-sm leading-relaxed"
                        rows={4}
                        placeholder="Write announcement body or platform description details here..."
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center justify-between">
                        <span>FAQ Linked ID</span>
                        <span className="text-[10px] text-slate-400 normal-case font-normal">(24-char Mongoose ObjectId)</span>
                      </label>
                      <input
                        type="text"
                        value={pinFaqId}
                        onChange={e => setPinFaqId(e.target.value)}
                        className="input w-full py-2.5 text-sm font-mono"
                        placeholder="e.g. 66567634f19b22204c00010c"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Display Order Index</label>
                    <input
                      type="number"
                      value={pinOrder}
                      onChange={e => setPinOrder(e.target.value)}
                      className="input w-full py-2.5 text-sm"
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Lower order numbers appear first. Default is 0.</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-5">
                    <button type="button" onClick={closePinForm} className="btn-outline px-4 py-2">Cancel</button>
                    <button type="submit" className="btn-primary px-5 py-2">
                      {editingPin ? 'Save Changes' : 'Publish Pin'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit FAQ Modal */}
      {editingFaq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit FAQ Answer</h3>
              <p className="text-sm text-slate-500 truncate max-w-xs">{editingFaq.title}</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Answer</label>
              <textarea
                rows={8}
                className="input w-full font-mono text-sm"
                value={editingFaq.finalAnswer}
                onChange={e => setEditingFaq(f => ({ ...f, finalAnswer: e.target.value }))}
              />
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setEditingFaq(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => handleEditSave(editingFaq._id, editingFaq.finalAnswer)}
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewPanel({ stats }) {
  const chartData = {
    labels: (stats.dailyStats || []).slice(-7).map(s => s.date),
    datasets: [{
      label: 'Queries',
      data: (stats.dailyStats || []).slice(-7).map(s => s.queries),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4
    }]
  };
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Total Users', value: stats.totalUsers },
        { label: 'Total FAQs', value: stats.totalFaqs },
        { label: 'Open Queries', value: stats.queryStats?.open || 0 },
        { label: 'SLA Breach Rate', value: stats.slaBreachRate ? `${stats.slaBreachRate.toFixed(1)}%` : '0%' },
      ].map(s => (
        <div key={s.label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
          <p className="text-sm text-slate-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
