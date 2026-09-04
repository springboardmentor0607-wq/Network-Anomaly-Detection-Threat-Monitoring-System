import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('netshield_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const socAPI = {
  getAlerts: (params) => API.get('/alerts', { params }),
  getNotifications: () => API.get('/notifications'),
  getUnreadCount: () => API.get('/notifications/unread-count'),
  markNotificationRead: (id) => API.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => API.put('/notifications/read-all'),
  getIncidents: () => API.get('/incidents'),
  createIncident: (data) => API.post('/incidents', data),
  transitionIncident: (id, data) => API.put(`/incidents/${id}/status`, data),
  addIncidentNote: (id, data) => API.post(`/incidents/${id}/notes`, data),
  getThreatIntel: () => API.get('/threat-intelligence'),
  getAnalyticsSummary: () => API.get('/analytics/summary'),
  predictTraffic: (data) => API.post('/predict', data),
  predictBatchCSV: (formData) => API.post('/predict/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPredictionHistory: () => API.get('/predictions/history'),
  huntThreats: () => API.post('/threat-hunt'),
  getModels: () => API.get('/models'),
  createModel: (data) => API.post('/models', data),
  deleteModel: (id) => API.delete(`/models/${id}`),
  updateModelStatus: (id, action) => API.put(`/models/${id}/status`, { action }),
  trainModel: (data) => API.post('/models/train', data),
};

export default API;
