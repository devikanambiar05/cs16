import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

export default api;

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// FAQs
export const getFAQs = (params) => api.get('/faqs', { params });
export const getTrendingFAQs = () => api.get('/faqs/trending');
export const getFAQById = (id) => api.get(`/faqs/${id}`);
export const upvoteFAQ = (id) => api.post(`/faqs/${id}/upvote`);

// Queries
export const getQueries = (params) => api.get('/queries', { params });
export const getQueryById = (id) => api.get(`/queries/${id}`);
export const createQuery = (data) => api.post('/queries', data);
export const closeQuery = (id) => api.patch(`/queries/${id}/close`);

// Answers
export const createAnswer = (data) => api.post('/answers', data);
export const upvoteAnswer = (id) => api.post(`/answers/${id}/upvote`);
export const acceptAnswer = (id) => api.post(`/answers/${id}/accept`);
export const deleteAnswer = (id) => api.delete(`/answers/${id}`);

// Users
export const getLeaderboard = () => api.get('/users/leaderboard');
export const getUserProfile = (id) => api.get(`/users/${id}`);