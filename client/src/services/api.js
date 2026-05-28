const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'x-auth-token': token } : {};
};

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  return { data };
}

const api = {
  get: (path, params) => fetch(`${API_URL}${path}${params ? '?' + new URLSearchParams(params) : ''}`, { headers: getHeaders() }).then(handleResponse),
  post: (path, body) => fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getHeaders() }, body: JSON.stringify(body) }).then(handleResponse),
  patch: (path, body) => fetch(`${API_URL}${path}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getHeaders() }, body: JSON.stringify(body) }).then(handleResponse),
  delete: (path) => fetch(`${API_URL}${path}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse)
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (email, password) => api.post('/api/auth/login', { email, password });
export const register = (name, email, password) => api.post('/api/auth/register', { name, email, password });
export const getMe = () => api.get('/api/auth/me');
export const forgotPassword = (email) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/api/auth/reset-password', { token, password });
export const resendVerification = () => api.post('/api/auth/resend-verification', {});

// ─── FAQs ─────────────────────────────────────────────────────────────────────
export const getFAQs = (params) => api.get('/api/faqs', params);
export const getTrendingFAQs = () => api.get('/api/faqs/trending');
export const getFAQsByCategory = (tag, params) => api.get(`/api/faqs/category/${tag}`, params);
export const upvoteFAQ = (id) => api.post(`/api/faqs/${id}/upvote`);
export const convertAnswerToFAQ = (answerId) => api.post(`/api/answers/${answerId}/convert`);

// ─── Categories ────────────────────────────────────────────────────────────────
export const getCategories = () => api.get('/api/categories');

// ─── Community Queries ─────────────────────────────────────────────────────────
export const getQueries = (params) => api.get('/api/queries', params);
export const createQuery = (data) => api.post('/api/queries', data);
export const closeQuery = (id) => api.patch(`/api/queries/${id}/close`);
export const claimQuery = (id) => api.post(`/api/queries/${id}/claim`);
export const unclaimQuery = (id) => api.delete(`/api/queries/${id}/claim`);

// ─── Answers ───────────────────────────────────────────────────────────────────
export const createAnswer = (queryId, content) => api.post(`/api/answers`, { queryId, content });
export const upvoteAnswer = (id) => api.post(`/api/answers/${id}/upvote`);
export const acceptAnswer = (id) => api.post(`/api/answers/${id}/accept`);

// ─── FAQ Requests ──────────────────────────────────────────────────────────────
export const createFAQRequest = (data) => api.post('/api/faq-requests', data);
export const getFAQRequests = (params) => api.get('/api/faq-requests', params);
export const approveFAQRequest = (id, data) => api.post(`/api/faq-requests/${id}/approve`, data);
export const rejectFAQRequest = (id, data) => api.delete(`/api/faq-requests/${id}/reject`, data);

// ─── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminStats = () => api.get('/api/users/admin/stats');
export const getAdminUsers = (params) => api.get('/api/users/admin/users', { params });
export const banUser = (id) => api.patch(`/api/users/admin/ban/${id}`);