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
import { useNavigate, Link } from 'react-router-dom';
import {
  getAnalytics,
  getQueryStats,
  getQueries,
  deleteQuery,
  closeQuery,
  getUsers,
  updateUserBan,
  bulkUserAction,
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
  deletePin,
  getAuditLogs,
  getModerationQueue,
  mergeFAQs
} from '../services/api';
import { useToast } from '../components/ToastProvider';
import { useTheme } from '../context/ThemeContext';
import FAQsPage from './FAQsPage';
import WikiTagsPage from './WikiTagsPage';
import CommunityPage from './CommunityPage';
import LeaderboardPage from './LeaderboardPage';

const CONTROL_STATION_TABS = ['Overview', 'Queries', 'Users', 'Moderation & Audit', 'Manage FAQs', 'Pins'];
const PUBLIC_PLATFORM_TABS = ['FAQs', 'Wiki', 'Community', 'Leaderboard'];
const TABS = [...CONTROL_STATION_TABS, ...PUBLIC_PLATFORM_TABS];
const PAGE_SIZE = 10;

const TAB_ICONS = {
  'Overview': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  'Queries': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  'Users': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'Moderation & Audit': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751A11.959 11.959 0 0112 2.714z" />
    </svg>
  ),
  'Manage FAQs': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  'Pins': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2" />
    </svg>
  )
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { dark } = useTheme();
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [queries, setQueries] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditLogsError, setAuditLogsError] = useState(null);
  const [queryPage, setQueryPage] = useState(1);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [userStatus, setUserStatus] = useState({});
  // ── Bulk selection state ──────────────────────────────────────────────────
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [faqRequests, setFaqRequests] = useState([]);
  const [faqPage, setFaqPage] = useState(1);
  const [faqLoading, setFaqLoading] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqFilter, setFaqFilter] = useState('all');
  const [faqSearch, setFaqSearch] = useState('');
  const [faqManagePage, setFaqManagePage] = useState(1);      // pagination for Manage FAQs tab
  const [faqManageTotalPages, setFaqManageTotalPages] = useState(1);
  const [faqSearchInput, setFaqSearchInput] = useState('');   // debounced input
  const [adminFaqs, setAdminFaqs] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingFaqRequestId, setRejectingFaqRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
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

  // Moderation & Audit state
  const [moderationLoading, setModerationLoading] = useState(false);
  const [pendingFAQRequests, setPendingFAQRequests] = useState([]);
  const [slabreachedQueries, setSlabreachedQueries] = useState([]);
  const [recentEdits, setRecentEdits] = useState([]);

  // FAQ Merging state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSourceFaq, setMergeSourceFaq] = useState(null);
  const [mergeTargetFaqId, setMergeTargetFaqId] = useState('');
  const [mergeSearchText, setMergeSearchText] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeFaqSearchResults, setMergeFaqSearchResults] = useState([]);
  const [loadingMergeSearch, setLoadingMergeSearch] = useState(false);
  const [adminHighlightQueryId, setAdminHighlightQueryId] = useState(null);

  useEffect(() => {
    loadStats();
    loadQueries();
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'Overview') loadStats();
    if (activeTab === 'Queries') loadQueries();
    if (activeTab === 'Users') loadUsers();
    if (activeTab === 'Moderation & Audit') loadModerationQueue();
    if (activeTab === 'Pins') loadAdminPins();
  }, [activeTab]);

  // ── Manage FAQs: single effect with all dependencies ──────────────────────
  // Consolidates tab-switch, filter change, page change, and debounced search
  // into one effect so the current values of ALL state are always in scope.
  useEffect(() => {
    if (activeTab === 'Manage FAQs') loadAdminFaqs(faqManagePage, faqFilter, faqSearch);
  }, [activeTab, faqManagePage, faqFilter, faqSearch]);

  // Debounce search input — wait 500ms after typing stops then update faqSearch
  // faqSearch change triggers the effect above with the latest page reset to 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setFaqManagePage(1);   // reset page first
      setFaqSearch(faqSearchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [faqSearchInput]);

  useEffect(() => {
    if (!showMergeModal || !mergeSearchText.trim()) {
      setMergeFaqSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingMergeSearch(true);
      try {
        const res = await getAdminFaqs({ search: mergeSearchText.trim(), limit: 10 });
        const filtered = (res.data.faqs || res.data || []).filter(f => f._id !== mergeSourceFaq?._id);
        setMergeFaqSearchResults(filtered);
      } catch (err) {
        console.error('Failed to search merge target FAQs', err);
      } finally {
        setLoadingMergeSearch(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [mergeSearchText, showMergeModal, mergeSourceFaq]);

  async function loadStats() {
    setLoadingStats(true);
    setLoadingAuditLogs(true);
    setAuditLogsError(null);
    try {
      const [analyticsRes, queryRes, auditLogsRes] = await Promise.all([
        getAnalytics(),
        getQueryStats(),
        getAuditLogs()
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
        dailyStats: data.dailyStats ?? [],
        queryStats: queryRes.data
      });
      // API returns { logs: [...] } — extract the array
      setAuditLogs(auditLogsRes.data || []);
    } catch (err) {
      toast.error('Failed to load stats');
      setAuditLogsError('Failed to load recent activity log.');
    } finally {
      setLoadingStats(false);
      setLoadingAuditLogs(false);
    }
  }

  async function loadQueries() {
    setLoadingQueries(true);
    try {
      const res = await getQueries({ page: queryPage, pageSize: PAGE_SIZE });
      setQueries(res.data.queries || []);
    } catch (err) {
      toast.error('Failed to load queries');
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
      toast.error('Failed to load users');
    } finally {
      setLoadingUser(false);
    }
  }

  async function loadModerationQueue() {
    setModerationLoading(true);
    try {
      const res = await getModerationQueue();
      setPendingFAQRequests(res.data?.pendingFAQRequests || []);
      setSlabreachedQueries(res.data?.slabreachedQueries || []);
      setRecentEdits(res.data?.recentEdits || []);
    } catch (err) {
      toast.error('Failed to load moderation queue');
    } finally {
      setModerationLoading(false);
    }
  }

  async function handleMergeFAQs() {
    if (!mergeSourceFaq || !mergeTargetFaqId) {
      toast.error('Source and target FAQs are required');
      return;
    }
    setMergeLoading(true);
    try {
      await mergeFAQs(mergeSourceFaq._id, mergeTargetFaqId);
      toast.success('FAQs merged successfully');
      setShowMergeModal(false);
      setMergeSourceFaq(null);
      setMergeTargetFaqId('');
      setMergeSearchText('');
      loadAdminFaqs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to merge FAQs');
    } finally {
      setMergeLoading(false);
    }
  }

  // Accept explicit params so callers always pass fresh values — avoids stale closure bug
  async function loadAdminFaqs(page = faqManagePage, filter = faqFilter, search = faqSearch) {
    setFaqLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();

      const res = await getAdminFaqs(params);
      setAdminFaqs(res.data.faqs || res.data || []);
      if (res.data.pagination) {
        setFaqManageTotalPages(res.data.pagination.pages || 1);
      }
    } catch (err) {
      toast.error('Failed to load FAQs');
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
      toast.error('Failed to load pins');
    } finally {
      setPinsLoading(false);
    }
  }

  async function handleCreatePin(e) {
    e.preventDefault();
    if (!pinTitle.trim()) return;

    if (pinType === 'faq') {
      if (!pinFaqId || !pinFaqId.trim()) {
        toast.error('FAQ ID is required for pins of type FAQ');
        return;
      }
      if (!/^[0-9a-fA-F]{24}$/.test(pinFaqId.trim())) {
        toast.error('Please enter a valid 24-character MongoDB ObjectId for the FAQ ID');
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
        toast.success('Pin updated');
      } else {
        await createPin({
          type: pinType,
          title: pinTitle,
          content: pinType !== 'faq' ? pinContent : null,
          faqId: pinType === 'faq' ? pinFaqId.trim() : null,
          order: Number(pinOrder)
        });
        toast.success('Pin created');
      }
      setShowPinForm(false);
      setEditingPin(null);
      setPinTitle('');
      setPinContent('');
      setPinFaqId('');
      setPinOrder(0);
      loadAdminPins();
    } catch (err) {
      toast.error(editingPin ? 'Failed to update pin' : 'Failed to create pin');
    }
  }

  async function handleDeletePin(id) {
    if (!confirm('Remove this pin?')) return;
    try {
      await deletePin(id);
      toast.success('Pin removed');
      loadAdminPins();
    } catch (err) {
      toast.error('Failed to remove pin');
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
      toast.success('Query closed');
      loadQueries();
    } catch (err) {
      toast.error('Failed to close query');
    }
  }

  async function handleDeleteQuery(queryId) {
    if (!window.confirm('Delete this query permanently?')) return;
    try {
      await deleteQuery(queryId);
      toast.success('Query deleted');
      loadQueries();
    } catch (err) {
      toast.error('Failed to delete query');
    }
  }

  async function handleResolve(faqReqId) {
    try {
      await resolveFAQRequest(faqReqId);
      toast.success('FAQ request resolved');
      loadModerationQueue();
    } catch (err) {
      toast.error('Failed to resolve FAQ request');
    }
  }

  function openRejectModal(faqReqId) {
    setRejectingFaqRequestId(faqReqId);
    setRejectionReason('');
    setShowRejectModal(true);
  }

  function closeRejectModal() {
    setShowRejectModal(false);
    setRejectingFaqRequestId(null);
    setRejectionReason('');
  }

  async function handleConfirmRejectFAQ() {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setRejectLoading(true);
    try {
      await rejectFAQRequest(rejectingFaqRequestId, { rejectionReason: rejectionReason.trim() });
      toast.success('FAQ request rejected');
      loadModerationQueue();
      closeRejectModal();
    } catch (err) {
      toast.error('Failed to reject FAQ request');
    } finally {
      setRejectLoading(false);
    }
  }

  async function handleToggleBan(userId, currentStatus) {
    const isCurrentlyBanned = currentStatus === 'banned';
    const action = isCurrentlyBanned ? 'unban' : 'ban';
    try {
      setUserStatus(prev => ({ ...prev, [userId]: 'loading' }));
      await updateUserBan(userId, !isCurrentlyBanned);
      // Optimistically update UI — no page reload needed
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, status: isCurrentlyBanned ? 'active' : 'banned' } : u
      ));
      toast.success(`User ${action}ned successfully`);
    } catch (err) {
      toast.error('Failed to update user');
    } finally {
      setUserStatus(prev => ({ ...prev, [userId]: null }));
    }
  }

  // ── Bulk selection helpers ─────────────────────────────────────────────────
  function toggleSelectUser(userId) {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u._id)));
    }
  }

  async function handleBulkAction(action) {
    if (selectedUserIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await bulkUserAction([...selectedUserIds], action);
      // Optimistically update UI for all selected users — no reload needed
      setUsers(prev => prev.map(u => {
        if (!selectedUserIds.has(u._id)) return u;
        if (action === 'ban') return { ...u, status: 'banned' };
        if (action === 'unban') return { ...u, status: 'active' };
        if (action === 'promote') return { ...u, role: 'admin' };
        return u;
      }));
      setSelectedUserIds(new Set());
      toast.success(res.data.message);
    } catch (err) {
      toast.error(`Failed to ${action} selected users`);
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleTogglePin(faqId, currentlyPinned) {
    try {
      await pinFaq(faqId);
      toast.success(currentlyPinned ? 'FAQ unpinned' : 'FAQ pinned');
      loadAdminFaqs();
    } catch (err) {
      toast.error('Failed to update pin status');
    }
  }

  async function handleSoftDeleteRestore(faqId, currentDeleted) {
    try {
      await patchFaq(faqId, { deletedAt: currentDeleted ? null : new Date() });
      toast.success(currentDeleted ? 'FAQ restored' : 'FAQ soft-deleted');
      loadAdminFaqs();
    } catch (err) {
      toast.error('Failed to update FAQ');
    }
  }

  async function handleEditSave(faqId, newAnswer) {
    try {
      await patchFaq(faqId, { finalAnswer: newAnswer });
      toast.success('FAQ updated');
      setEditingFaq(null);
      loadAdminFaqs();
    } catch (err) {
      toast.error('Failed to update FAQ');
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

  // ── Admin theme tokens (dynamic based on global light/dark theme) ──────────
  const adminTheme = dark ? {
    bg: '#0f1117',        // deep midnight
    elevated: '#161a26',  // dark navy panel
    elevated2: '#1e2433', // navy hover
    border: '#2a3147',    // slate-blue border
    accent: '#6366f1',    // indigo accent
    accentMuted: '#818cf8', // indigo muted for hover
    text: '#e2e8f0',      // cool slate-200
    muted: '#94a3b8',     // slate-400
    faint: '#64748b',     // slate-500
  } : {
    bg: '#f8fafc',        // cool slate-50
    elevated: '#ffffff',  // pure white
    elevated2: '#f1f5f9', // slate-100
    border: '#e2e8f0',    // slate-200
    accent: '#4f46e5',    // indigo accent
    accentMuted: '#6366f1', // indigo muted
    text: '#0f172a',      // slate-900
    muted: '#64748b',     // slate-500
    faint: '#94a3b8',     // slate-400
  };

  return (
    <div style={{ background: adminTheme.bg, minHeight: '100vh', color: adminTheme.text, transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Content Area */}
          <div className="flex-1 w-full order-2 lg:order-1 space-y-6">

        {/* Overview */}
        {activeTab === 'Overview' && (stats || loadingAuditLogs || auditLogsError) && (
          <OverviewPanel
            stats={stats}
            loading={loadingStats}
            auditLogs={auditLogs}
            loadingAuditLogs={loadingAuditLogs}
            auditLogsError={auditLogsError}
            onRetry={loadStats}
          />
        )}

        {/* Queries */}
        {activeTab === 'Queries' && (
          <div>
            <h2 style={{ color: adminTheme.accent }} className="text-lg font-semibold mb-4">Community Queries</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${adminTheme.border}` }}>
                    <th style={{ color: adminTheme.muted }} className="pb-3 font-medium text-left">Query</th>
                    <th style={{ color: adminTheme.muted }} className="pb-3 font-medium text-left">Status</th>
                    <th style={{ color: adminTheme.muted }} className="pb-3 font-medium text-left">Claims</th>
                    <th style={{ color: adminTheme.muted }} className="pb-3 font-medium text-left">Answers</th>
                    <th style={{ color: adminTheme.muted }} className="pb-3 font-medium text-left">SLA</th>
                    <th style={{ color: adminTheme.muted }} className="pb-3 font-medium text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map(q => (
                    <tr key={q._id} style={{ borderBottom: `1px solid ${adminTheme.border}` }}>
                      <td style={{ color: adminTheme.text }} className="py-3 max-w-xs truncate">{q.title}</td>
                      <td className="py-3">
                        <span className={`badge badge-${q.status === 'open' ? 'green' : q.status === 'claimed' ? 'yellow' : 'red'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td style={{ color: adminTheme.muted }} className="py-3">{q.claims?.length || 0}</td>
                      <td style={{ color: adminTheme.muted }} className="py-3">{q.answerCount || 0}</td>
                      <td style={{ color: adminTheme.muted }} className="py-3">
                        {q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 flex gap-2">
                        <button
                          onClick={() => {
                            setAdminHighlightQueryId(q._id);
                            setActiveTab('Community');
                          }}
                          style={{ color: adminTheme.accent }}
                          className="hover:underline text-xs"
                        >
                          View
                        </button>
                        <button onClick={() => handleClose(q._id)} className="text-red-400 hover:underline text-xs">Close</button>
                        <button onClick={() => handleDeleteQuery(q._id)} className="text-red-400 hover:underline text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={() => { setQueryPage(p => Math.max(1, p - 1)); loadQueries(); }} disabled={queryPage === 1} style={{ background: adminTheme.elevated, color: adminTheme.text, border: `1px solid ${adminTheme.border}` }} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40">Previous</button>
              <span style={{ color: adminTheme.muted }} className="text-sm">Page {queryPage}</span>
              <button onClick={() => { setQueryPage(p => p + 1); loadQueries(); }} disabled={queries.length < PAGE_SIZE} style={{ background: adminTheme.elevated, color: adminTheme.text, border: `1px solid ${adminTheme.border}` }} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'Users' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Users</h2>

            {/* ── Sticky Bulk Toolbar ── */}
            {selectedUserIds.size > 0 && (
              <div className="sticky top-0 z-10 flex items-center gap-3 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3 mb-4 shadow-sm">
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                  {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleBulkAction('ban')}
                    disabled={bulkLoading}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                  >
                    🚫 Ban Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('unban')}
                    disabled={bulkLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                  >
                    ✅ Unban Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('promote')}
                    disabled={bulkLoading}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                  >
                    ⭐ Promote to Admin
                  </button>
                  <button
                    onClick={() => setSelectedUserIds(new Set())}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                    {/* Select-all checkbox */}
                    <th className="pb-3 pr-3 w-8">
                      <input
                        type="checkbox"
                        checked={users.length > 0 && selectedUserIds.size === users.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-600 accent-primary-600 cursor-pointer"
                        title="Select all"
                      />
                    </th>
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
                    <tr
                      key={u._id}
                      className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${selectedUserIds.has(u._id) ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''
                        }`}
                    >
                      {/* Per-row checkbox */}
                      <td className="py-3 pr-3">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(u._id)}
                          onChange={() => toggleSelectUser(u._id)}
                          className="rounded border-slate-300 dark:border-slate-600 accent-primary-600 cursor-pointer"
                        />
                      </td>
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
                          {u.status === 'banned' ? 'Unban' : 'Ban'}
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

        {/* Moderation & Audit */}
        {activeTab === 'Moderation & Audit' && (
          <div className="space-y-6">
            <div className="border-b pb-4" style={{ borderColor: adminTheme.border }}>
              <h2 className="text-xl font-bold font-serif" style={{ color: adminTheme.accent }}>Moderation & Audit Control Station</h2>
              <p className="text-xs mt-1" style={{ color: adminTheme.muted }}>
                Approve or reject FAQ requests, resolve SLA breaches, and inspect recent FAQ revision histories.
              </p>
            </div>

            {moderationLoading ? (
              <div className="flex justify-center py-12">
                <div className="spinner animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: adminTheme.accent }} />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upper Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Column: Pending FAQ Requests */}
                  <div style={{ background: adminTheme.elevated, border: `1px solid ${adminTheme.border}` }} className="rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-md font-semibold flex items-center gap-2" style={{ color: adminTheme.text }}>
                      <span>📥</span> Pending FAQ Requests
                      <span className="badge badge-yellow text-xs ml-auto">{pendingFAQRequests.length}</span>
                    </h3>
                    {pendingFAQRequests.length === 0 ? (
                      <p className="text-sm py-4" style={{ color: adminTheme.muted }}>No pending FAQ requests.</p>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {pendingFAQRequests.map(req => (
                          <div key={req._id} style={{ background: adminTheme.elevated2, border: `1px solid ${adminTheme.border}` }} className="rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-bold" style={{ color: adminTheme.muted }}>
                              <span>By: {req.submittedBy?.name || 'Unknown'}</span>
                              <span>Source: {req.queryId?.title || 'Unknown Query'}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-xs" style={{ color: adminTheme.text }}>Q: {req.proposedQuestion}</p>
                              <p className="text-xs mt-1 line-clamp-3" style={{ color: adminTheme.muted }}>A: {req.proposedAnswer}</p>
                            </div>
                            {req.proposedTags && req.proposedTags.length > 0 && (
                              <p className="text-[10px]" style={{ color: adminTheme.faint }}>Tags: {req.proposedTags.join(', ')}</p>
                            )}
                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                onClick={() => openRejectModal(req._id)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold hover:opacity-85 transition-all text-red-500 hover:bg-red-500/10"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleResolve(req._id)}
                                style={{ background: adminTheme.accent, color: '#fff' }}
                                className="px-3 py-1 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: SLA-Breached Queries */}
                  <div style={{ background: adminTheme.elevated, border: `1px solid ${adminTheme.border}` }} className="rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-md font-semibold flex items-center gap-2" style={{ color: adminTheme.text }}>
                      <span>⚡</span> SLA-Breached Queries
                      <span className="badge badge-red text-xs ml-auto">{slabreachedQueries.length}</span>
                    </h3>
                    {slabreachedQueries.length === 0 ? (
                      <p className="text-sm py-4" style={{ color: adminTheme.muted }}>No SLA-breached queries found.</p>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {slabreachedQueries.map(q => (
                          <div key={q._id} style={{ background: adminTheme.elevated2, border: `1px solid ${adminTheme.border}` }} className="rounded-xl p-4 flex flex-col justify-between space-y-3">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-red-500">EXPIRED</span>
                                <span className="text-[10px] font-medium" style={{ color: adminTheme.faint }}>
                                  Expired: {new Date(q.expiresAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="font-semibold text-xs" style={{ color: adminTheme.text }}>{q.title}</p>
                              <p className="text-[10px]" style={{ color: adminTheme.muted }}>Created by: {q.createdBy?.name || 'Unknown User'}</p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleClose(q._id)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold hover:opacity-80 transition-all text-red-455 hover:bg-red-500/10"
                              >
                                Close Query
                              </button>
                              <button
                                onClick={() => {
                                  setAdminHighlightQueryId(q._id);
                                  setActiveTab('Community');
                                }}
                                style={{ border: `1px solid ${adminTheme.border}`, color: adminTheme.accent }}
                                className="px-3 py-1 rounded-lg text-xs font-semibold hover:bg-slate-500/10 active:scale-95 transition-all shadow-sm"
                              >
                                View/Resolve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: FAQ Audit Trails & Revisions */}
                <div style={{ background: adminTheme.elevated, border: `1px solid ${adminTheme.border}` }} className="rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-md font-semibold flex items-center gap-2" style={{ color: adminTheme.text }}>
                    <span>📜</span> FAQ Revision History (Last 7 Days)
                  </h3>
                  {recentEdits.length === 0 ? (
                    <p className="text-sm py-4" style={{ color: adminTheme.muted }}>No edits logged in the past week.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b" style={{ borderColor: adminTheme.border, color: adminTheme.muted }}>
                            <th className="pb-3 font-semibold">FAQ Document</th>
                            <th className="pb-3 font-semibold">Edited By</th>
                            <th className="pb-3 font-semibold">Changes</th>
                            <th className="pb-3 font-semibold">Reason for Edit</th>
                            <th className="pb-3 font-semibold">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentEdits.map(edit => {
                            const changes = [];
                            if (edit.previousTitle !== edit.newTitle) changes.push('Title');
                            if (edit.previousDescription !== edit.newDescription) changes.push('Description');
                            if (edit.previousFinalAnswer !== edit.newFinalAnswer) changes.push('Answer');
                            if (JSON.stringify(edit.previousTags) !== JSON.stringify(edit.newTags)) changes.push('Tags');

                            return (
                              <tr key={edit._id} className="border-b last:border-none" style={{ borderColor: adminTheme.border }}>
                                <td className="py-3 font-medium max-w-xs truncate" style={{ color: adminTheme.text }}>
                                  {edit.faq?.title || 'Unknown/Deleted FAQ'}
                                  <span className="block text-[10px] font-mono text-slate-400">ID: {edit.faq?._id || edit.faq}</span>
                                </td>
                                <td className="py-3" style={{ color: adminTheme.text }}>
                                  {edit.editedBy?.name || 'Admin'}
                                </td>
                                <td className="py-3">
                                  <div className="flex flex-wrap gap-1">
                                    {changes.length === 0 ? (
                                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Metadata</span>
                                    ) : (
                                      changes.map(c => (
                                        <span key={c} className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded font-semibold">{c}</span>
                                      ))
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 italic" style={{ color: adminTheme.muted }}>
                                  {edit.reason || 'No reason provided'}
                                </td>
                                <td className="py-3" style={{ color: adminTheme.muted }}>
                                  {new Date(edit.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
            <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reject FAQ Request</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Provide a short reason to help the volunteer understand why this request was rejected.</p>
                </div>
                <button
                  onClick={closeRejectModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Close reject modal"
                >
                  ×
                </button>
              </div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2" htmlFor="rejectionReason">
                Rejection reason
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 p-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Example: Duplicate of FAQ #10"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejectFAQ}
                  disabled={rejectLoading}
                  className="btn-primary text-sm"
                >
                  {rejectLoading ? 'Rejecting…' : 'Reject request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage FAQs */}
        {activeTab === 'Manage FAQs' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Manage FAQs</h2>
              <div className="flex items-center gap-3">
                {/* Search — debounced via faqSearchInput state */}
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={faqSearchInput}
                  onChange={e => setFaqSearchInput(e.target.value)}
                  className="input py-1.5 text-sm w-48"
                />
                {/* Filter — resets to page 1 */}
                <select
                  value={faqFilter}
                  onChange={e => {
                    const newFilter = e.target.value;
                    setFaqFilter(newFilter);
                    setFaqManagePage(1);
                    loadAdminFaqs(1, newFilter, faqSearch); // pass fresh values directly
                  }}
                  className="input py-1.5 text-sm"
                >
                  <option value="all">All FAQs</option>
                  <option value="resolved">Resolved</option>
                  <option value="duplicate">Duplicate</option>
                </select>
                {/* Refresh */}
                <button onClick={() => loadAdminFaqs(1, faqFilter, faqSearch)} className="btn-secondary text-sm">Refresh</button>
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
            ) : adminFaqs.length === 0 ? (
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
                    {adminFaqs.map(faq => (
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
                          <button
                            onClick={() => {
                              setMergeSourceFaq(faq);
                              setMergeTargetFaqId('');
                              setMergeSearchText('');
                              setShowMergeModal(true);
                            }}
                            className="text-xs text-amber-600 dark:text-[#dca54c] hover:underline whitespace-nowrap"
                          >
                            Merge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination controls */}
            {faqManageTotalPages > 1 && (
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setFaqManagePage(p => Math.max(1, p - 1))}
                  disabled={faqManagePage === 1}
                  className="btn-secondary text-sm disabled:opacity-40"
                >Previous</button>
                <span className="text-sm text-slate-500">Page {faqManagePage} of {faqManageTotalPages}</span>
                <button
                  onClick={() => setFaqManagePage(p => Math.min(faqManageTotalPages, p + 1))}
                  disabled={faqManagePage === faqManageTotalPages}
                  className="btn-secondary text-sm disabled:opacity-40"
                >Next</button>
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
                        <span className={`badge uppercase tracking-wider text-[9px] px-2.5 py-0.5 font-bold ${pin.type === 'faq' ? 'badge-blue' :
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

        {/* Public Embedded Tabs */}
        {activeTab === 'FAQs' && <FAQsPage />}
        {activeTab === 'Wiki' && <WikiTagsPage />}
        {activeTab === 'Community' && (
          <CommunityPage
            propHighlightId={adminHighlightQueryId}
            onClearHighlight={() => setAdminHighlightQueryId(null)}
          />
        )}
        {activeTab === 'Leaderboard' && <LeaderboardPage />}
      </div>

      {/* Right Sidebar Rail */}
      <aside
        style={{
          background: adminTheme.elevated,
          borderColor: adminTheme.border
        }}
        className="w-full lg:w-16 lg:shrink-0 order-1 lg:order-2 lg:sticky lg:top-24 rounded-2xl p-2 lg:py-4 flex flex-row lg:flex-col items-center justify-start gap-2 lg:gap-4 overflow-x-auto lg:overflow-visible shadow-lg border"
      >
        {/* Control Station Tabs */}
        <div className="flex flex-row lg:flex-col gap-2">
          {CONTROL_STATION_TABS.map(tab => {
            const isActive = activeTab === tab;
            return (
              <div key={tab} className="relative group">
                <button
                  onClick={() => setActiveTab(tab)}
                  style={{
                    backgroundColor: isActive ? adminTheme.accent : 'transparent',
                    color: isActive ? '#ffffff' : adminTheme.muted,
                  }}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none border-l-4 ${
                    isActive
                      ? 'border-white dark:border-slate-100 shadow-md scale-105'
                      : 'border-transparent hover:bg-slate-200/30 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {TAB_ICONS[tab]}
                </button>
                {/* Tooltip */}
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 origin-right bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold px-2 py-1.5 rounded-lg shadow-xl pointer-events-none hidden lg:block whitespace-nowrap z-50">
                  {tab}
                </span>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-[1px] w-8 bg-slate-200 dark:bg-slate-800 hidden lg:block my-2" />
        <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800 lg:hidden mx-2" />

        {/* Public Platform Tabs */}
        <div className="flex flex-row lg:flex-col gap-2">
          {[
            {
              id: 'FAQs',
              label: 'FAQs',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              )
            },
            {
              id: 'Wiki',
              label: 'Wiki',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-16.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-16.25v16.25" />
                </svg>
              )
            },
            {
              id: 'Community',
              label: 'Community',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )
            },
            {
              id: 'Leaderboard',
              label: 'Leaderboard',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V17M10 21H14M12 15C15 15 17 13 17 10V5H7V10C7 13 9 15 12 15ZM17 7H19.5C20.5 7 21 8 21 9V10C21 11 20 12 19 12H17ZM7 7H4.5C3.5 7 3 8 3 9V10C3 11 4 12 5 12H7" />
                </svg>
              )
            }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative group">
                <button
                  onClick={() => {
                    setAdminHighlightQueryId(null);
                    setActiveTab(tab.id);
                  }}
                  style={{
                    backgroundColor: isActive ? adminTheme.accent : 'transparent',
                    color: isActive ? '#ffffff' : adminTheme.muted,
                  }}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none border-l-4 ${
                    isActive
                      ? 'border-white dark:border-slate-100 shadow-md scale-105'
                      : 'border-transparent hover:bg-slate-200/30 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {tab.icon}
                </button>
                {/* Tooltip */}
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 origin-right bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold px-2 py-1.5 rounded-lg shadow-xl pointer-events-none hidden lg:block whitespace-nowrap z-50">
                  {tab.label}
                </span>
              </div>
            );
          })}
        </div>
      </aside>
    </div>

        {/* Edit FAQ Modal */}
        {editingFaq && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit FAQ Answer</h3>
                <p className="text-sm text-slate-500 truncate max-w-xs">{editingFaq.title}</p>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-2">Answer</label>
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

        {/* Merge FAQ Modal */}
        {showMergeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-serif">Merge FAQ</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select a target FAQ to merge the source FAQ into. The source FAQ will be marked as a duplicate and soft-deleted.
                  </p>
                </div>
                <button onClick={() => setShowMergeModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Source FAQ Info */}
                <div className="p-4 rounded-xl bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/20">
                  <p className="text-[10px] font-bold text-amber-555 dark:text-amber-500 uppercase tracking-wider mb-1">Source FAQ (to be merged)</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {mergeSourceFaq?.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {mergeSourceFaq?._id}</p>
                </div>

                {/* Target FAQ Search */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="mergeSearchText">
                    Search Target FAQ
                  </label>
                  <input
                    id="mergeSearchText"
                    type="text"
                    placeholder="Type to search active FAQs..."
                    value={mergeSearchText}
                    onChange={e => setMergeSearchText(e.target.value)}
                    className="input w-full py-2.5 text-sm"
                  />
                </div>

                {/* Target FAQ search results */}
                {mergeSearchText.trim() && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {loadingMergeSearch ? (
                      <p className="p-3 text-xs text-slate-500">Searching...</p>
                    ) : mergeFaqSearchResults.length === 0 ? (
                      <p className="p-3 text-xs text-slate-500">No active FAQs found.</p>
                    ) : (
                      mergeFaqSearchResults.map(faq => (
                        <button
                          key={faq._id}
                          type="button"
                          onClick={() => setMergeTargetFaqId(faq._id)}
                          className={`w-full text-left p-3 text-xs border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-2 ${
                            mergeTargetFaqId === faq._id ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''
                          }`}
                        >
                          <span className="mt-0.5">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{faq.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">ID: {faq._id}</p>
                          </div>
                          {mergeTargetFaqId === faq._id && (
                            <span className="text-primary-500 font-bold shrink-0">✓ Selected</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Manual Target ID Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1" htmlFor="mergeTargetFaqId">
                    Target FAQ ID (Mongoose ObjectId)
                  </label>
                  <input
                    id="mergeTargetFaqId"
                    type="text"
                    placeholder="Enter 24-character target FAQ ID or select from search results"
                    value={mergeTargetFaqId}
                    onChange={e => setMergeTargetFaqId(e.target.value)}
                    className="input w-full py-2.5 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="btn-outline px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMergeFAQs}
                  disabled={mergeLoading || !mergeTargetFaqId || mergeTargetFaqId.trim().length !== 24}
                  className="btn-primary px-5 py-2 text-sm disabled:opacity-40"
                >
                  {mergeLoading ? 'Merging...' : 'Confirm Merge'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewPanel({ stats, loading, auditLogs, loadingAuditLogs, auditLogsError, onRetry }) {
  const { dark } = useTheme();
  const adminTheme = dark ? {
    bg: '#0f1117',
    elevated: '#161a26',
    elevated2: '#1e2433',
    border: '#2a3147',
    accent: '#6366f1',
    text: '#e2e8f0',
    muted: '#94a3b8',
    faint: '#64748b',
  } : {
    bg: '#f8fafc',
    elevated: '#ffffff',
    elevated2: '#f1f5f9',
    border: '#e2e8f0',
    accent: '#4f46e5',
    text: '#0f172a',
    muted: '#64748b',
    faint: '#94a3b8',
  };

  const dailyStats = stats?.dailyStats || [];
  const chartData = {
    labels: dailyStats.slice(-7).map(s => s.date),
    datasets: [{
      label: 'Queries',
      data: dailyStats.slice(-7).map(s => s.queries),
      borderColor: adminTheme.accent,
      backgroundColor: 'rgba(99,102,241,0.12)', // indigo glow
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: adminTheme.accent
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: adminTheme.muted }
      },
      y: {
        beginAtZero: true,
        grid: { color: `${adminTheme.border}80` },
        ticks: { color: adminTheme.muted }
      }
    }
  };

  // Helper for human-readable relative timestamps
  function getRelativeTime(timestamp) {
    if (!timestamp) return '';
    const secondsAgo = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (secondsAgo < 60) return 'just now';
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? 0 },
          { label: 'Total FAQs', value: stats?.totalFaqs ?? 0 },
          { label: 'Open Queries', value: stats?.queryStats?.open ?? 0 },
          { label: 'SLA Breach Rate', value: stats?.slaBreachRate != null ? `${stats.slaBreachRate.toFixed(1)}%` : '0%' },
        ].map(s => (
          <div key={s.label} style={{ background: adminTheme.elevated, border: `1px solid ${adminTheme.border}` }} className="rounded-xl p-5 shadow-sm">
            <p className="text-3xl font-bold" style={{ color: adminTheme.text }}>{s.value}</p>
            <p className="text-sm mt-1 font-medium" style={{ color: adminTheme.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Query Volume Chart */}
      <div style={{ background: adminTheme.elevated, border: `1px solid ${adminTheme.border}` }} className="rounded-xl p-5 min-h-[320px]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: adminTheme.muted }}>Query volume</p>
            <h3 className="text-xl font-semibold" style={{ color: adminTheme.text }}>Last 7 days</h3>
          </div>
          <span className="text-xs uppercase tracking-[0.2em]" style={{ color: adminTheme.faint }}>
            {dailyStats.length ? `${dailyStats.length} days tracked` : 'No data'}
          </span>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="inline-flex items-center gap-2" style={{ color: adminTheme.muted }}>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                <path d="M22 12a10 10 0 0 1-10 10" strokeLinecap="round" />
              </svg>
              Loading chart...
            </div>
          </div>
        ) : dailyStats.length === 0 ? (
          <div className="flex h-64 items-center justify-center" style={{ color: adminTheme.muted }}>No query data available yet.</div>
        ) : (
          <div className="h-[320px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Audit Logs Chronological Timeline */}
      <div style={{ background: adminTheme.elevated, border: `1px solid ${adminTheme.border}` }} className="rounded-xl p-6 shadow-md flex flex-col">
        <div className="border-b pb-3 mb-4 flex items-center justify-between" style={{ borderBottomColor: adminTheme.border }}>
          <div>
            <h3 className="text-md font-semibold font-serif uppercase tracking-wider" style={{ color: adminTheme.accent }}>
              Recent Moderator Activity
            </h3>
            <p className="text-xs mt-1" style={{ color: adminTheme.muted }}>
              Recent administrative events and moderation logs recorded on the platform.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: adminTheme.border, color: adminTheme.accent }}>
            Live Feed
          </span>
        </div>

        {/* Scrollable container with fixed height */}
        <div className="overflow-y-auto max-h-[350px] pr-2 space-y-4 font-sans scrollbar-thin">
          {loadingAuditLogs ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${adminTheme.accent} transparent ${adminTheme.accent} transparent` }}
              />
              <p className="text-sm font-medium" style={{ color: adminTheme.muted }}>Loading activities...</p>
            </div>
          ) : auditLogsError ? (
            <div className="text-center py-12 px-4 border border-dashed rounded-xl" style={{ borderColor: adminTheme.border }}>
              <span className="text-2xl">⚠️</span>
              <p className="text-sm mt-2 font-medium text-red-400">{auditLogsError}</p>
              <button
                onClick={onRetry}
                style={{ background: adminTheme.elevated2, border: `1px solid ${adminTheme.border}`, color: adminTheme.accent }}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                Retry Loading
              </button>
            </div>
          ) : (!auditLogs || auditLogs.length === 0) ? (
            <div className="text-center py-16">
              <span className="text-2xl">📜</span>
              <p className="text-sm mt-2 font-medium" style={{ color: adminTheme.muted }}>No activity logged yet.</p>
            </div>
          ) : (
            <div className="relative border-l pl-4 ml-2 space-y-5" style={{ borderLeftColor: adminTheme.border }}>
              {auditLogs.map((log) => {
                let color = adminTheme.accent;
                let dotIcon = '●';
                if (log.action.includes('delete') || log.action === 'deleted pin') {
                  color = '#ef4444';
                  dotIcon = '✕';
                } else if (log.action.includes('restore')) {
                  color = '#10b981';
                  dotIcon = '↺';
                } else if (log.action === 'resolved SLA breach') {
                  color = '#f59e0b';
                  dotIcon = '⚡';
                } else if (log.action === 'created pin') {
                  color = '#3b82f6';
                  dotIcon = '📌';
                }

                const rawName = log.performedBy?.name || 'Admin';
                // Normalise: prepend "Admin" if the name doesn't already start with it
                const displayName = rawName.toLowerCase().startsWith('admin') ? rawName : `Admin ${rawName}`;

                let actionText = '';
                if (log.action === 'soft-deleted') {
                  actionText = `soft-deleted ${log.targetModel} "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'restored') {
                  actionText = `restored ${log.targetModel} "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'resolved SLA breach') {
                  actionText = `resolved SLA breach for Query "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'created pin') {
                  actionText = `created Pin "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'updated pin') {
                  actionText = `updated Pin "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'deleted pin') {
                  actionText = `deleted Pin "${log.targetName || 'Untitled'}"`;
                } else {
                  actionText = `${log.action} ${log.targetModel} "${log.targetName || 'Untitled'}"`;
                }

                return (
                  <div key={log._id} className="relative group">
                    <div
                      className="absolute -left-[25px] top-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm select-none"
                      style={{ background: adminTheme.elevated2, border: `1px solid ${adminTheme.border}`, color }}
                    >
                      {dotIcon}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 pl-1">
                      <div>
                        <span className="font-semibold text-sm mr-1.5" style={{ color: adminTheme.text }}>
                          {displayName}
                        </span>
                        <span className="text-sm font-medium" style={{ color: adminTheme.muted }}>
                          {actionText}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold shrink-0" style={{ color: adminTheme.faint }}>
                        {getRelativeTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
