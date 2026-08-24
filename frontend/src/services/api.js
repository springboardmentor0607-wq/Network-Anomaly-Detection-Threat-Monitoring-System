import axios from 'axios';

// Resolve the backend API URL from Vite environment variables, defaulting to local FastAPI default port
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 30 s — dataset-status responses can be slow on first load;
  // auth endpoints (MongoDB only) are always fast in practice.
  timeout: 30000,
});

const getStoredToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('access_token')
  );
};

const existingToken = getStoredToken();
if (existingToken) {
  api.defaults.headers = api.defaults.headers || {};
  api.defaults.headers.common = api.defaults.headers.common || {};
  api.defaults.headers.common.Authorization = `Bearer ${existingToken}`;
}

// Request Interceptor: Attach JWT or custom headers in the future
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Standardized error parsing & auth rejection handlers
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is due to auth expiration (401 Unauthorized) to log out user
    if (error.response && error.response.status === 401) {
      console.warn('Authentication token expired or invalid.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('jwt');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('jwt');
      
      // Prevent infinite loops if we're already on login
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
