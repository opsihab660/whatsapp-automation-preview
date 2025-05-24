import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden access');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 429:
          console.error('Rate limit exceeded');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API Error:', data?.message || error.message);
      }

      return Promise.reject(data || error);
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
      return Promise.reject({ message: 'Network error. Please check your connection.' });
    } else {
      // Other error
      console.error('Error:', error.message);
      return Promise.reject(error);
    }
  }
);

// API methods
export const whatsappAPI = {
  getStatus: () => api.get('/whatsapp/status'),
  connect: () => api.post('/whatsapp/connect'),
  disconnect: () => api.post('/whatsapp/disconnect'),
  sendMessage: (to, message) => api.post('/whatsapp/send-message', { to, message }),
  toggleAutoReply: (enabled) => api.post('/whatsapp/toggle-auto-reply', { enabled }),
  getAutoReplyStatus: () => api.get('/whatsapp/auto-reply-status'),
};

export const messageAPI = {
  getMessages: (limit = 50, offset = 0) => api.get(`/messages?limit=${limit}&offset=${offset}`),
  getMessagesByNumber: (number, limit = 50) => api.get(`/messages/${number}?limit=${limit}`),
  sendMessage: (to, message) => api.post('/messages/send', { to, message }),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};

export const aiAPI = {
  test: () => api.post('/ai/test'),
  generateResponse: (message, context = {}) => api.post('/ai/generate-response', { message, context }),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.post('/settings', settings),
};

export default api;
