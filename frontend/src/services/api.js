import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ Change this to your backend IP/URL when running
const BASE_URL = 'http://172.19.80.123:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ────────────────────────────────────────────────
export const authService = {
  register: (formData) => api.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (formData) => api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProfileImage: () => api.delete('/auth/profile-image'),
};

// ─── Products ────────────────────────────────────────────
export const productService = {
  getAll: () => api.get('/products'),
  getOne: (id) => api.get(`/products/${id}`),
  create: (formData) => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/products/${id}`),
  deleteImage: (id) => api.delete(`/products/${id}/image`),
};

// ─── Sales ───────────────────────────────────────────────
export const salesService = {
  getAll: () => api.get('/sales'),
  getOne: (id) => api.get(`/sales/${id}`),
  create: (formData) => api.post('/sales', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/sales/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/sales/${id}`),
  deleteImage: (id) => api.delete(`/sales/${id}/image`),
};

// ─── Customers ───────────────────────────────────────────
export const customerService = {
  getAll: () => api.get('/customers'),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (formData) => api.post('/customers', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/customers/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/customers/${id}`),
  deleteImage: (id) => api.delete(`/customers/${id}/image`),
  addPayment: (id, data) => api.post(`/customers/${id}/payments`, data),
};

// ─── Notifications ───────────────────────────────────────
export const notificationService = {
  getAll: () => api.get('/notifications'),
  create: (formData) => api.post('/notifications', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
  generate: () => api.get('/notifications/generate'),
};

// ─── Reports ─────────────────────────────────────────────
export const reportService = {
  getAll: () => api.get('/reports'),
  getSummary: (params) => api.get('/reports/summary', { params }),
  create: (formData) => api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/reports/${id}`),
};

// ─── Suppliers ───────────────────────────────────────────  ← NEW
export const supplierService = {
  getAll: () => api.get('/suppliers'),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (formData) => api.post('/suppliers', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/suppliers/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/suppliers/${id}`),
  deleteImage: (id) => api.delete(`/suppliers/${id}/image`),
  addPurchase: (id, data) => api.post(`/suppliers/${id}/purchases`, data),
  addPayment: (id, data) => api.post(`/suppliers/${id}/payments`, data),
};

export default api;