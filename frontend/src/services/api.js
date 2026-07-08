import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to attach bearer tokens automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('primepharm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const pharmacyId = localStorage.getItem('primepharm_pharmacy_id');
    if (pharmacyId) {
      config.headers['X-Pharmacy-ID'] = pharmacyId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to perform safe relative redirects only, preventing Open Redirect vulnerabilities
const safeRedirect = (path) => {
  // Ensure the path is relative (starts with '/' and not followed by another '/' or '\')
  if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('\\')) {
    window.location.href = path;
  } else {
    window.location.href = '/login';
  }
};

// Response interceptor to handle authentication and subscription failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      // Auto-logout if unauthorized (token expired/revoked)
      if (status === 401) {
        localStorage.removeItem('primepharm_token');
        localStorage.removeItem('primepharm_user');
        localStorage.removeItem('primepharm_pharmacy_id');
        
        // Redirect to login page only if not already there
        if (!window.location.pathname.includes('/login')) {
          safeRedirect('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
