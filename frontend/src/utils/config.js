// API configuration
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
};

export const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:3001');
};
