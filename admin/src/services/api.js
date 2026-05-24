import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('acx_admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 401) {
      localStorage.removeItem('acx_admin_token');
      localStorage.removeItem('acx_admin_user');
      window.location.href = '/login';
      toast.error('Session expired. Please log in again.');
    } else if (status === 403) {
      toast.error('Access denied.');
    } else if (status === 429) {
      toast.error('Too many requests. Please slow down.');
    } else if (status >= 500) {
      toast.error('Server error. Please try again.');
    } else if (message && status !== 404) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Convenience wrappers
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getDashboardCharts: (period) => api.get(`/admin/dashboard/charts?period=${period}`),

  // Franchise
  getFranchises: (params) => api.get('/admin/franchises', { params }),
  getFranchiseById: (id) => api.get(`/admin/franchises/${id}`),
  approveFranchise: (id, notes) => api.post(`/admin/franchises/${id}/kyc/approve`, { notes }),
  rejectFranchise: (id, notes) => api.post(`/admin/franchises/${id}/kyc/reject`, { notes }),
  suspendFranchise: (id) => api.post(`/admin/franchises/${id}/suspend`),
  getFranchiseEarnings: (id, params) => api.get(`/admin/franchises/${id}/earnings`, { params }),

  // Customers
  getCustomers: (params) => api.get('/admin/customers', { params }),
  getCustomerById: (id) => api.get(`/admin/customers/${id}`),
  exportCustomers: (params) => api.get('/admin/customers/export', { params, responseType: 'blob' }),

  // Bookings
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getBookingById: (id) => api.get(`/admin/bookings/${id}`),

  // Analytics
  getRevenue: (params) => api.get('/admin/analytics/revenue', { params }),
  getServiceMix: (params) => api.get('/admin/analytics/service-mix', { params }),
  getCityPerformance: (params) => api.get('/admin/analytics/cities', { params }),
  getCohortRetention: (params) => api.get('/admin/analytics/cohort', { params }),

  // Marketplace
  getListings: (params) => api.get('/admin/marketplace/listings', { params }),
  approveListing: (id) => api.post(`/admin/marketplace/listings/${id}/approve`),
  rejectListing: (id, reason) => api.post(`/admin/marketplace/listings/${id}/reject`, { reason }),

  // Subscriptions
  getSubscriptions: (params) => api.get('/admin/subscriptions', { params }),
  getSubscriptionMetrics: () => api.get('/admin/subscriptions/metrics'),
  pauseSubscription: (id) => api.post(`/admin/subscriptions/${id}/pause`),
  cancelSubscription: (id) => api.post(`/admin/subscriptions/${id}/cancel`),

  // Notifications
  sendNotification: (data) => api.post('/admin/notifications/send', data),
  getNotificationHistory: (params) => api.get('/admin/notifications/history', { params }),

  // Coupons
  getCoupons: (params) => api.get('/admin/coupons', { params }),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  toggleCoupon: (id) => api.post(`/admin/coupons/${id}/toggle`),
  bulkCreateCoupons: (data) => api.post('/admin/coupons/bulk', data),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getRoles: () => api.get('/admin/roles'),
  updateRole: (id, data) => api.put(`/admin/roles/${id}`, data),
};

export default api;
