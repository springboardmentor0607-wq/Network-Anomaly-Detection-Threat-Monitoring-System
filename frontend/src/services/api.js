import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl = configuredApiUrl || (
  import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'
);

const API = axios.create({
  baseURL: apiBaseUrl,
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

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('netshield_token');
      localStorage.removeItem('netshield_user');
    }
    return Promise.reject(error);
  }
);

export const downloadFile = async (path, filename) => {
  const response = await API.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

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
