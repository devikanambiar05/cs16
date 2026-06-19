import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  mergeFAQs,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../services/api';
import { useToast } from '../components/ToastProvider';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../utils/avatar';
import FAQsPage from './FAQsPage';
import WikiTagsPage from './WikiTagsPage';
import CommunityPage from './CommunityPage';
import LeaderboardPage from './LeaderboardPage';

const CONTROL_STATION_TABS = ['Overview', 'Queries', 'Users', 'Moderation & Audit', 'Manage FAQs', 'Announce'];
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
  'Announce': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  )
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [consoleSearch, setConsoleSearch] = useState('');

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await getNotifications();
        setNotifications(res.data || []);
      } catch (err) {
        // Silently fail
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notif) => {
    setNotificationsOpen(false);
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const [activeTab, setActiveTab] = useState('Overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const [faqSortBy, setFaqSortBy] = useState('createdAt');
  const [faqSortOrder, setFaqSortOrder] = useState('desc');
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
    if (activeTab === 'Announce') loadAdminPins();
    setConsoleSearch('');
    setProfileOpen(false);
  }, [activeTab]);

  // ── Manage FAQs: single effect with all dependencies ──────────────────────
  // Consolidates tab-switch, filter change, page change, and debounced search
  // into one effect so the current values of ALL state are always in scope.
  useEffect(() => {
    if (activeTab === 'Manage FAQs') {
      loadAdminFaqs(faqManagePage, faqFilter, faqSearch, faqSortBy, faqSortOrder);
    }
  }, [activeTab, faqManagePage, faqFilter, faqSearch, faqSortBy, faqSortOrder]);

  // Debounce search input — wait 500ms after typing stops then update faqSearch
  // faqSearch change triggers the effect above with the latest page reset to 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setFaqManagePage(1);   // reset page first
      setFaqSearch(faqSearchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [faqSearchInput]);

  // Sync global search with Manage FAQs search
  useEffect(() => {
    if (activeTab === 'Manage FAQs') {
      setFaqSearchInput(consoleSearch);
    }
  }, [consoleSearch, activeTab]);

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

  async function loadQueries(page = queryPage) {
    setLoadingQueries(true);
    try {
      const res = await getQueries({ page, pageSize: PAGE_SIZE });
      setQueries(res.data.queries || []);
    } catch (err) {
      toast.error('Failed to load queries');
    } finally {
      setLoadingQueries(false);
    }
  }

  async function loadUsers(page = userPage) {
    setLoadingUser(true);
    try {
      const res = await getUsers({ page, pageSize: PAGE_SIZE });
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
  async function loadAdminFaqs(
    page = faqManagePage,
    filter = faqFilter,
    search = faqSearch,
    sortBy = faqSortBy,
    sortOrder = faqSortOrder
  ) {
    setFaqLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

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
    setPinType('announcement');
    setPinTitle(pin.title || '');
    setPinContent(pin.content || '');
    setPinFaqId('');
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
    const nonAdmins = users.filter(u => u.role !== 'admin');
    if (selectedUserIds.size === nonAdmins.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(nonAdmins.map(u => u._id)));
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
    bg: '#0b0f0c',        // deep forest-black
    elevated: '#121b15',  // dark pine panel
    elevated2: '#1a271e', // pine hover
    border: '#25362b',    // forest green border
    accent: '#10b981',    // emerald accent
    accentMuted: '#34d399', // emerald muted for hover
    text: '#ecfdf5',      // mint-slate-50
    muted: '#829a8c',     // sage-muted
    faint: '#5a7063',     // dark sage
  } : {
    bg: '#f0f5f1',        // light forest-slate
    elevated: '#ffffff',  // pure white
    elevated2: '#e6ede8', // light sage-gray
    border: '#d0ddd4',    // sage border
    accent: '#059669',    // emerald accent
    accentMuted: '#10b981', // emerald muted
    text: '#062f1c',      // dark forest text
    muted: '#4a5d51',     // slate sage text
    faint: '#788d80',     // light sage
  };

  return (
    <div className="flex min-h-screen font-sans bg-[#0b0f0c] text-slate-100 overflow-hidden">
      
      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#121b15] border-r border-[#25362b] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col overflow-y-auto flex-1">
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b border-[#25362b] gap-2.5">
            <span className="font-serif text-lg font-bold text-white tracking-wide">Admin Dashboard</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-6 flex-1">
            {/* Control Station Group */}
            <div>
              <p className="px-3 text-[10px] font-bold text-[#829a8c] uppercase tracking-wider mb-2.5">Control Station</p>
              <div className="space-y-1">
                {CONTROL_STATION_TABS.map(tab => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/10'
                          : 'text-[#829a8c] hover:text-white hover:bg-[#1a271f]/40'
                      }`}
                    >
                      <span className={`${isActive ? 'text-white' : 'text-[#829a8c]'}`}>{TAB_ICONS[tab]}</span>
                      <span>{tab}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Public Platform Group */}
            <div>
              <p className="px-3 text-[10px] font-bold text-[#829a8c] uppercase tracking-wider mb-2.5">Public Platform</p>
              <div className="space-y-1">
                {[
                  { id: 'FAQs', label: 'FAQs', icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                  ) },
                  { id: 'Wiki', label: 'Wiki', icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-16.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-16.25v16.25" />
                    </svg>
                  ) },
                  { id: 'Community', label: 'Community', icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ) },
                  { id: 'Leaderboard', label: 'Leaderboard', icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V17M10 21H14M12 15C15 15 17 13 17 10V5H7V10C7 13 9 15 12 15ZM17 7H19.5C20.5 7 21 8 21 9V10C21 11 20 12 19 12H17ZM7 7H4.5C3.5 7 3 8 3 9V10C3 11 4 12 5 12H7" />
                    </svg>
                  ) }
                ].map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setAdminHighlightQueryId(null);
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/10'
                          : 'text-[#829a8c] hover:text-white hover:bg-[#1a271f]/40'
                      }`}
                    >
                      <span className={`${isActive ? 'text-white' : 'text-[#829a8c]'}`}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* User profile section at bottom of sidebar */}
        {user && (
          <div className="p-4 border-t border-[#25362b] flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center font-bold text-sm text-white`}>
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-xs text-[#829a8c] truncate">{user.email}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── MAIN CONTENT WORKSPACE ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#25362b] bg-[#121b15]/60 backdrop-blur-md flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-[#25362b] text-slate-400 hover:text-white lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs font-semibold select-none">
              <span className="text-[#829a8c] hover:text-white transition-colors cursor-pointer" onClick={() => setActiveTab('Overview')}>Dashboard</span>
              <span className="text-[#829a8c]">/</span>
              <span className="text-white">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search Bar */}
            <div className="relative hidden md:block w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={
                  activeTab === 'Overview' ? 'Search activity logs...' :
                  activeTab === 'Queries' ? 'Search community queries...' :
                  activeTab === 'Users' ? 'Search users...' :
                  activeTab === 'Moderation & Audit' ? 'Search moderation queue...' :
                  activeTab === 'Manage FAQs' ? 'Search FAQs...' :
                  activeTab === 'Announce' ? 'Search announcements...' :
                  'Search console...'
                }
                value={consoleSearch}
                onChange={e => {
                  const val = e.target.value;
                  setConsoleSearch(val);
                  if (activeTab === 'Manage FAQs') {
                    setFaqSearchInput(val);
                  }
                }}
                className="w-full bg-[#1a271f] border border-[#25362b] rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-xl transition-all duration-150 text-slate-400 hover:text-white hover:bg-[#1a271f]/40"
              style={{ color: adminTheme.muted }}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l.707.707M6.343 17.657l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative flex items-center">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl hover:bg-[#1a271f]/40 relative transition-all duration-150"
                style={{ color: adminTheme.muted }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2" style={{ ringColor: adminTheme.elevated }} />
                )}
              </button>

              {/* Notification Dropdown panel */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div 
                    style={{ background: adminTheme.elevated, borderColor: adminTheme.border }}
                    className="absolute right-0 top-full mt-2 w-80 border rounded-xl shadow-xl py-1.5 z-50 animate-fade-in origin-top-right transition-all"
                  >
                    <div 
                      style={{ borderColor: adminTheme.border }}
                      className="flex items-center justify-between px-4 py-2 border-b"
                    >
                      <span className="text-xs font-semibold" style={{ color: adminTheme.text }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] hover:underline font-semibold"
                          style={{ color: adminTheme.accent }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y" style={{ divideColor: adminTheme.border }}>
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: adminTheme.faint }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <p className="text-[11px]" style={{ color: adminTheme.muted }}>All caught up! No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <button
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-500/10 flex gap-2.5 items-start transition-colors"
                            style={{ background: !notif.isRead ? `${adminTheme.accent}0d` : 'transparent' }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: adminTheme.accent, opacity: notif.isRead ? 0 : 1 }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: adminTheme.text }}>{notif.title}</p>
                              <p className="text-[11px] mt-0.5 leading-snug line-clamp-2" style={{ color: adminTheme.muted }}>{notif.message}</p>
                              <span className="text-[9px] mt-1 block" style={{ color: adminTheme.faint }}>
                                {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`w-8 h-8 ${getAvatarColor(user.name)} text-white rounded-full text-sm font-semibold flex items-center justify-center`}
                >
                  {getInitials(user.name)}
                </button>
                {/* Dropdown */}
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div 
                      style={{ background: adminTheme.elevated, borderColor: adminTheme.border }}
                      className="absolute right-0 top-full mt-1 w-48 border rounded-xl shadow-lg py-1 z-50 animate-fade-in origin-top-right"
                    >
                      <div className="px-3 py-2 border-b" style={{ borderColor: adminTheme.border }}>
                        <p className="text-sm font-medium truncate" style={{ color: adminTheme.text }}>{user.name}</p>
                        <p className="text-xs truncate" style={{ color: adminTheme.muted }}>{user.email}</p>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-slate-500/10 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Panel Container */}
        <main className="flex-1 overflow-y-auto bg-[#0b0f0c] p-6 lg:p-8 space-y-6">

        {/* Overview */}
        {activeTab === 'Overview' && (stats || loadingAuditLogs || auditLogsError) && (
          <OverviewPanel
            stats={stats}
            loading={loadingStats}
            auditLogs={auditLogs.filter(log => {
              if (!consoleSearch) return true;
              const searchLower = consoleSearch.toLowerCase();
              const performedBy = (log.performedBy?.name || '').toLowerCase();
              const action = (log.action || '').toLowerCase();
              const targetName = (log.targetName || '').toLowerCase();
              const targetModel = (log.targetModel || '').toLowerCase();
              return performedBy.includes(searchLower) ||
                     action.includes(searchLower) ||
                     targetName.includes(searchLower) ||
                     targetModel.includes(searchLower);
            })}
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
                  {queries.filter(q => {
                    if (!consoleSearch) return true;
                    const searchLower = consoleSearch.toLowerCase();
                    return (q.title || '').toLowerCase().includes(searchLower) ||
                           (q.description || '').toLowerCase().includes(searchLower);
                  }).map(q => (
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
              <button
                onClick={() => {
                  const nextPage = Math.max(1, queryPage - 1);
                  setQueryPage(nextPage);
                  loadQueries(nextPage);
                }}
                disabled={queryPage === 1}
                style={{ background: adminTheme.elevated, color: adminTheme.text, border: `1px solid ${adminTheme.border}` }}
                className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span style={{ color: adminTheme.muted }} className="text-sm">Page {queryPage}</span>
              <button
                onClick={() => {
                  const nextPage = queryPage + 1;
                  setQueryPage(nextPage);
                  loadQueries(nextPage);
                }}
                disabled={queries.length < PAGE_SIZE}
                style={{ background: adminTheme.elevated, color: adminTheme.text, border: `1px solid ${adminTheme.border}` }}
                className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40"
              >
                Next
              </button>
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
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Ban Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('unban')}
                    disabled={bulkLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Unban Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('promote')}
                    disabled={bulkLoading}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.195-.39.58-.649 1.018-.649s.823.259 1.018.65l2.253 4.567 5.04.733c.433.063.818.375.986.782.167.407.094.87-.188 1.206L20.25 13.91l.89 5.021a1.126 1.126 0 01-1.636 1.191l-4.508-2.37-4.508 2.37a1.126 1.126 0 01-1.636-1.191l.89-5.021-3.664-3.57a1.127 1.127 0 01-.188-1.206c.168-.407.553-.782.986-.782l5.04-.733 2.252-4.567z" />
                    </svg>
                    Promote to Admin
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
                        checked={users.filter(u => u.role !== 'admin').length > 0 && selectedUserIds.size === users.filter(u => u.role !== 'admin').length}
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
                  {users.filter(u => {
                    if (!consoleSearch) return true;
                    const searchLower = consoleSearch.toLowerCase();
                    return (u.name || '').toLowerCase().includes(searchLower) ||
                           (u.email || '').toLowerCase().includes(searchLower);
                  }).map(u => (
                    <tr
                      key={u._id}
                      className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${selectedUserIds.has(u._id) ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''
                        }`}
                    >
                      {/* Per-row checkbox */}
                      <td className="py-3 pr-3">
                        {u.role !== 'admin' && (
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(u._id)}
                            onChange={() => toggleSelectUser(u._id)}
                            className="rounded border-slate-300 dark:border-slate-600 accent-primary-600 cursor-pointer"
                          />
                        )}
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
                        {u.role !== 'admin' ? (
                          <button
                            onClick={() => handleToggleBan(u._id, u.status)}
                            disabled={userStatus[u._id] === 'loading'}
                            className="text-xs text-red-600 hover:underline disabled:opacity-40"
                          >
                            {u.status === 'banned' ? 'Unban' : 'Ban'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 select-none">Non-bannable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  const nextPage = Math.max(1, userPage - 1);
                  setUserPage(nextPage);
                  loadUsers(nextPage);
                }}
                disabled={userPage === 1}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {userPage}</span>
              <button
                onClick={() => {
                  const nextPage = userPage + 1;
                  setUserPage(nextPage);
                  loadUsers(nextPage);
                }}
                disabled={users.length < PAGE_SIZE}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Next
              </button>
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
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18a2.25 2.25 0 0 1 2.25 2.25v4.5A2.25 2.25 0 0 1 18 21.75H6a2.25 2.25 0 0 1-2.25-2.25v-4.5a2.25 2.25 0 0 1 2.25-2.25z" />
                      </svg>
                      Pending FAQ Requests
                      <span className="badge badge-yellow text-xs ml-auto">{pendingFAQRequests.length}</span>
                    </h3>
                    {pendingFAQRequests.length === 0 ? (
                      <p className="text-sm py-4" style={{ color: adminTheme.muted }}>No pending FAQ requests.</p>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {pendingFAQRequests.filter(req => {
                          if (!consoleSearch) return true;
                          const searchLower = consoleSearch.toLowerCase();
                          return (req.submittedBy?.name || '').toLowerCase().includes(searchLower) ||
                                 (req.proposedQuestion || '').toLowerCase().includes(searchLower) ||
                                 (req.proposedAnswer || '').toLowerCase().includes(searchLower);
                        }).map(req => (
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
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      SLA-Breached Queries
                      <span className="badge badge-red text-xs ml-auto">{slabreachedQueries.length}</span>
                    </h3>
                    {slabreachedQueries.length === 0 ? (
                      <p className="text-sm py-4" style={{ color: adminTheme.muted }}>No SLA-breached queries found.</p>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {slabreachedQueries.filter(q => {
                          if (!consoleSearch) return true;
                          const searchLower = consoleSearch.toLowerCase();
                          return (q.title || '').toLowerCase().includes(searchLower) ||
                                 (q.createdBy?.name || '').toLowerCase().includes(searchLower);
                        }).map(q => (
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
                                className="px-3 py-1 rounded-lg text-xs font-semibold hover:opacity-80 transition-all text-red-500 hover:bg-red-500/10"
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
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    FAQ Revision History (Last 7 Days)
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
                  className="input py-1.5 text-sm w-36"
                />
                {/* Filter — resets to page 1 */}
                <select
                  value={faqFilter}
                  onChange={e => {
                    const newFilter = e.target.value;
                    setFaqFilter(newFilter);
                    setFaqManagePage(1);
                    loadAdminFaqs(1, newFilter, faqSearch, faqSortBy, faqSortOrder); // pass fresh values directly
                  }}
                  className="input py-1.5 text-sm"
                >
                  <option value="all">All FAQs</option>
                  <option value="resolved">Resolved</option>
                  <option value="duplicate">Duplicate</option>
                </select>
                {/* Sort By */}
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sort By:</span>
                <select
                  value={faqSortBy}
                  onChange={e => {
                    const newSortBy = e.target.value;
                    setFaqSortBy(newSortBy);
                    setFaqManagePage(1);
                    loadAdminFaqs(1, faqFilter, faqSearch, newSortBy, faqSortOrder);
                  }}
                  className="input py-1.5 text-sm"
                >
                  <option value="createdAt">Recency</option>
                  <option value="upvotes">Upvotes</option>
                  <option value="section">Section</option>
                </select>
                {/* Direction */}
                <select
                  value={faqSortOrder}
                  onChange={e => {
                    const newSortOrder = e.target.value;
                    setFaqSortOrder(newSortOrder);
                    setFaqManagePage(1);
                    loadAdminFaqs(1, faqFilter, faqSearch, faqSortBy, newSortOrder);
                  }}
                  className="input py-1.5 text-sm"
                >
                  <option value="desc">Decrease</option>
                  <option value="asc">Increase</option>
                </select>
                {/* Refresh */}
                <button onClick={() => loadAdminFaqs(1, faqFilter, faqSearch, faqSortBy, faqSortOrder)} className="btn-secondary text-sm">Refresh</button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Total FAQs', value: adminFaqs.length },
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
                      <th className="pb-3 text-slate-500 font-medium">Tags</th>
                      <th className="pb-3 text-slate-500 font-medium">Upvotes</th>
                      <th className="pb-3 text-slate-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminFaqs.map(faq => (
                      <tr key={faq._id} className={`border-b border-slate-100 dark:border-slate-800 ${faq.deletedAt ? 'opacity-60' : ''}`}>
                        <td className="py-3 text-slate-800 dark:text-slate-200 max-w-xs truncate flex items-center gap-1.5 flex-wrap">
                          {faq.title}
                          {faq.pinned && <span className="badge badge-amber text-[10px]">pinned</span>}
                          {faq.deletedAt && <span className="badge badge-red text-[10px]">deleted</span>}
                          {faq.status === 'duplicate' && <span className="badge badge-yellow text-[10px]">duplicate</span>}
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

        {/* Announce */}
        {activeTab === 'Announce' && (() => {
          const filteredAnnouncements = pins.filter(pin => 
            pin.type === 'announcement' && 
            (!consoleSearch || 
             pin.title.toLowerCase().includes(consoleSearch.toLowerCase()) || 
             (pin.content || '').toLowerCase().includes(consoleSearch.toLowerCase())
            )
          );
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif">Announcements Administration</h2>
                  <p className="text-xs text-slate-500 mt-1">Manage announcements on the platform feed.</p>
                </div>
                <button
                  onClick={() => {
                    closePinForm();
                    setShowPinForm(true);
                  }}
                  className="btn-primary text-sm flex items-center gap-1.5 shadow-sm"
                >
                  <span>+</span> New Announcement
                </button>
              </div>

              {pinsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="spinner" />
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <svg className="w-8 h-8 text-slate-400 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium">No announcements active on the platform feed.</p>
                  <p className="text-xs text-slate-400 mt-1">Create a new announcement to publish it to the top feed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAnnouncements.map(pin => (
                    <div
                      key={pin._id}
                    className="card flex flex-col justify-between border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-[#1f1e1b]/40 backdrop-blur-sm shadow-sm hover:border-primary-400/50 dark:hover:border-primary-500/40 transition-all duration-300"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="badge badge-primary uppercase tracking-wider text-[9px] px-2.5 py-0.5 font-bold">
                          Announcement
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase select-none">
                          Order Index: <span className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded">{pin.order}</span>
                        </span>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug font-serif">{pin.title}</p>
                        {pin.content && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3 whitespace-pre-wrap font-sans">
                            {pin.content}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 mt-4 pt-3 select-none">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <span>Published by</span>
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
                          className="text-red-500 hover:text-red-600 text-xs font-bold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create/Edit Announcement Modal */}
            {showPinForm && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl w-full max-w-md animate-zoom-in">
                  <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800/85 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif">
                      {editingPin ? 'Modify Active Announcement' : 'Create Announcement'}
                    </h3>
                    <button onClick={closePinForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={handleCreatePin} className="p-6 space-y-4">
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

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Content Body</label>
                      <textarea
                        value={pinContent}
                        onChange={e => setPinContent(e.target.value)}
                        className="input w-full font-sans py-2 text-sm leading-relaxed"
                        rows={4}
                        placeholder="Write announcement body details here..."
                        required
                      />
                    </div>

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
                        {editingPin ? 'Save Changes' : 'Publish Announcement'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
          );
        })()}

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
        </main>
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
                  <p className="text-[10px] font-bold text-amber-500 dark:text-amber-500 uppercase tracking-wider mb-1">Source FAQ (to be merged)</p>
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
                          <svg className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
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
  );
}

function OverviewPanel({ stats, loading, auditLogs, loadingAuditLogs, auditLogsError, onRetry, setActiveTab }) {
  const dailyStats = stats?.dailyStats || [];
  
  // Doughnut Chart data for Query Status distribution
  const openCount = stats?.queryStats?.open || stats?.openQueries || 0;
  const claimedCount = stats?.queryStats?.claimed || 0;
  const answeredCount = stats?.queryStats?.answered || 0;
  const closedCount = stats?.queryStats?.closed || 0;
  const totalCount = openCount + claimedCount + answeredCount + closedCount;

  const doughnutData = {
    labels: ['Open', 'Claimed', 'Answered', 'Closed'],
    datasets: [{
      data: [openCount, claimedCount, answeredCount, closedCount],
      backgroundColor: [
        '#3b82f6', // blue
        '#f59e0b', // amber
        '#10b981', // emerald
        '#64748b'  // slate
      ],
      hoverOffset: 6,
      borderWidth: 2,
      borderColor: '#121b15'
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    cutout: '75%'
  };

  // Bar Chart data for Query creation volume over last 14 days
  const last14Days = dailyStats.slice(-14);
  const barData = {
    labels: last14Days.map(s => {
      const d = new Date(s.date);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Queries Raised',
        data: last14Days.map(s => s.queries),
        backgroundColor: '#6366f1',
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 12
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#829a8c', font: { size: 10 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#25362b' },
        ticks: { color: '#829a8c', font: { size: 10 } }
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
    <div className="space-y-6 w-full animate-fade-in text-slate-200">
      
      {/* ── Top Grid Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Card 1: Congratulations Admin */}
        <div className="xl:col-span-2 bg-[#121b15] border border-[#25362b] rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-lg">
          <div className="space-y-2">
            <h4 className="text-[#a5b4fc] text-xs font-bold tracking-wider uppercase">Grantha Control Hub</h4>
            <h2 className="text-xl font-bold text-white font-serif">Welcome back, Admin!</h2>
            <p className="text-xs text-[#829a8c] leading-relaxed max-w-[220px]">
              You have {openCount} active open queries waiting to be claimed by community volunteers.
            </p>
          </div>
          <div className="pt-4 flex items-baseline gap-4">
            <div>
              <span className="text-2xl font-extrabold text-white">{(stats?.totalQueries ?? 0).toLocaleString()}</span>
              <span className="text-[10px] text-[#829a8c] block">Total Queries Raised</span>
            </div>
            <button 
              onClick={() => setActiveTab('Queries')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 ml-auto"
            >
              View Queries
            </button>
          </div>
          {/* Mockup visual vector graphic */}
          <div className="absolute right-4 top-4 select-none opacity-20 xl:opacity-40">
            <svg className="w-20 h-20 text-emerald-500/80" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Users */}
        <div className="bg-[#121b15] border border-[#25362b] rounded-3xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
              <span>+12%</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-white">{(stats?.totalUsers ?? 0).toLocaleString()}</span>
            <span className="text-xs text-[#829a8c] block font-medium mt-0.5">Total Users</span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#25362b]/50">
            <svg className="w-full h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,25 Q15,10 30,20 T60,5 T90,15 T100,10" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: Total FAQs */}
        <div className="bg-[#121b15] border border-[#25362b] rounded-3xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-16.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-16.25v16.25" />
              </svg>
            </div>
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
              <span>+8%</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-white">{(stats?.totalFaqs ?? 0).toLocaleString()}</span>
            <span className="text-xs text-[#829a8c] block font-medium mt-0.5">Total FAQs</span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#25362b]/50">
            <svg className="w-full h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,20 Q20,10 40,25 T80,10 T100,5" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: SLA Breach Rate */}
        <div className="bg-[#121b15] border border-[#25362b] rounded-3xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-rose-500 flex items-center gap-0.5">
              <span>-2.4%</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-white">
              {stats?.slaBreachRate != null ? `${stats.slaBreachRate.toFixed(1)}%` : '0%'}
            </span>
            <span className="text-xs text-[#829a8c] block font-medium mt-0.5">SLA Breach Rate</span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#25362b]/50">
            <svg className="w-full h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,15 Q25,25 50,10 T75,20 T100,5" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Middle Dual-Chart Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Query Status (Doughnut) */}
        <div className="bg-[#121b15] border border-[#25362b] rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold text-white font-serif">Query Status</h3>
            <p className="text-[10px] text-[#829a8c] mt-0.5">Distribution of platform community queries</p>
          </div>

          <div className="relative h-44 my-4 flex items-center justify-center">
            {loading ? (
              <div className="text-xs text-[#829a8c] animate-pulse">Loading status...</div>
            ) : totalCount === 0 ? (
              <div className="text-xs text-[#829a8c]">No active queries</div>
            ) : (
              <>
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-white">{totalCount}</span>
                  <span className="text-[9px] font-bold text-[#829a8c] uppercase tracking-wider">Total</span>
                </div>
              </>
            )}
          </div>

          {/* Color Legend list */}
          <div className="space-y-1.5 pt-2 border-t border-[#25362b]/50 text-xs">
            {[
              { label: 'Open', count: openCount, color: 'bg-blue-500', pct: totalCount ? Math.round((openCount/totalCount)*100) : 0 },
              { label: 'Claimed', count: claimedCount, color: 'bg-amber-500', pct: totalCount ? Math.round((claimedCount/totalCount)*100) : 0 },
              { label: 'Answered', count: answeredCount, color: 'bg-emerald-500', pct: totalCount ? Math.round((answeredCount/totalCount)*100) : 0 },
              { label: 'Closed', count: closedCount, color: 'bg-slate-500', pct: totalCount ? Math.round((closedCount/totalCount)*100) : 0 }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="font-semibold">{item.label}</span>
                </div>
                <span className="font-medium text-[#829a8c]">{item.count} ({item.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Daily Volume Bar Chart */}
        <div className="lg:col-span-2 bg-[#121b15] border border-[#25362b] rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-md font-semibold text-white font-serif">Daily Query Volume</h3>
              <p className="text-[10px] text-[#829a8c] mt-0.5">Queries submitted over the last 14 days</p>
            </div>
            <span className="text-[9px] uppercase tracking-wider bg-[#1a271f] text-emerald-400 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {dailyStats.length} Days Tracked
            </span>
          </div>

          <div className="h-44 my-4">
            {loading ? (
              <div className="flex h-full items-center justify-center text-xs text-[#829a8c] animate-pulse">Loading chart...</div>
            ) : dailyStats.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-[#829a8c]">No query records found</div>
            ) : (
              <Bar data={barData} options={barOptions} />
            )}
          </div>

          {/* Monthly / Yearly mockup progress columns */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#25362b]/50">
            <div className="flex items-center gap-3">
              {/* Circular SVG Progress */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="20" cy="20" r="16" className="stroke-[#25362b]" strokeWidth="3" fill="transparent" />
                  <circle cx="20" cy="20" r="16" className="stroke-emerald-500" strokeWidth="3" fill="transparent" strokeDasharray="100" strokeDashoffset="35" />
                </svg>
                <span className="absolute text-[8px] font-bold text-white">65%</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#829a8c] block uppercase tracking-wider">Monthly Count</span>
                <span className="text-sm font-bold text-white">{(stats?.monthly?.newQueries ?? 0).toLocaleString()} Queries</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="20" cy="20" r="16" className="stroke-[#25362b]" strokeWidth="3" fill="transparent" />
                  <circle cx="20" cy="20" r="16" className="stroke-amber-500" strokeWidth="3" fill="transparent" strokeDasharray="100" strokeDashoffset="15" />
                </svg>
                <span className="absolute text-[8px] font-bold text-white">85%</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#829a8c] block uppercase tracking-wider">Yearly Activity</span>
                <span className="text-sm font-bold text-white">{(stats?.totalQueries ?? 0).toLocaleString()} Queries</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Audit Logs Chronological Timeline */}
      <div className="bg-[#121b15] border border-[#25362b] rounded-3xl p-6 shadow-lg flex flex-col">
        <div className="border-b border-[#25362b] pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-md font-semibold font-serif uppercase tracking-wider text-emerald-400">
              Recent Moderator Activity
            </h3>
            <p className="text-xs mt-1 text-[#829a8c]">
              Recent administrative events and moderation logs recorded on the platform.
            </p>
          </div>
        </div>

        {/* Scrollable container with fixed height */}
        <div className="overflow-y-auto max-h-[350px] pr-2 space-y-4 font-sans scrollbar-thin">
          {loadingAuditLogs ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-t-emerald-500 border-emerald-500/20" />
              <p className="text-sm font-medium text-[#829a8c]">Loading activities...</p>
            </div>
          ) : auditLogsError ? (
            <div className="text-center py-12 px-4 border border-dashed rounded-xl border-[#25362b]">
              <svg className="w-8 h-8 text-red-500 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm mt-2 font-medium text-red-500">{auditLogsError}</p>
              <button
                onClick={onRetry}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-[#1a271f] border border-[#25362b] text-emerald-400 hover:opacity-90 active:scale-95 transition-all"
              >
                Retry Loading
              </button>
            </div>
          ) : (!auditLogs || auditLogs.length === 0) ? (
            <div className="text-center py-16">
              <svg className="w-8 h-8 text-slate-500 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm mt-2 font-medium text-[#829a8c]">No activity logged yet.</p>
            </div>
          ) : (
            <div className="relative border-l border-[#25362b] pl-4 ml-2 space-y-5">
              {auditLogs.map((log) => {
                let color = '#10b981';
                let dotIcon = '●';
                if (log.action.includes('delete') || log.action === 'deleted pin') {
                  color = '#ef4444';
                  dotIcon = '✕';
                } else if (log.action.includes('restore')) {
                  color = '#10b981';
                  dotIcon = '↺';
                } else if (log.action === 'resolved SLA breach') {
                  color = '#f59e0b';
                  dotIcon = '⚠';
                } else if (log.action === 'created pin') {
                  color = '#059669';
                  dotIcon = '+';
                } else if (log.action === 'pinned faq') {
                  color = '#dca54c';
                  dotIcon = '★';
                } else if (log.action === 'unpinned faq') {
                  color = '#857d6a';
                  dotIcon = '☆';
                }

                const rawName = log.performedBy?.name || 'Admin';
                const displayName = rawName.toLowerCase().startsWith('admin') ? rawName : `Admin ${rawName}`;

                let actionText = '';
                if (log.action === 'soft-deleted') {
                  actionText = `soft-deleted ${log.targetModel} "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'restored') {
                  actionText = `restored ${log.targetModel} "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'resolved SLA breach') {
                  actionText = `resolved SLA breach for Query "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'created pin') {
                  actionText = `created an announcement "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'updated pin') {
                  actionText = `updated announcement "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'deleted pin') {
                  actionText = `deleted announcement "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'pinned faq') {
                  actionText = `pinned the FAQ "${log.targetName || 'Untitled'}"`;
                } else if (log.action === 'unpinned faq') {
                  actionText = `unpinned the FAQ "${log.targetName || 'Untitled'}"`;
                } else {
                  actionText = `${log.action} ${log.targetModel} "${log.targetName || 'Untitled'}"`;
                }

                return (
                  <div key={log._id} className="relative group animate-fade-in">
                    <div
                      className="absolute -left-[25px] top-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm select-none bg-[#1a271f] border border-[#25362b]"
                      style={{ color }}
                    >
                      {dotIcon}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 pl-1">
                      <div>
                        <span className="font-semibold text-sm mr-1.5 text-white">
                          {displayName}
                        </span>
                        <span className="text-sm font-medium text-[#829a8c]">
                          {actionText}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold shrink-0 text-[#829a8c]">
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
