import axios from 'axios';

/**
 * Addon API client — points to the new addon server on port 3002.
 * Mirrors the pattern from core/api.client.js.
 */
const addonClient = axios.create({
  baseURL: import.meta.env.VITE_ADDON_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3778',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

addonClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

addonClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  },
);

export { addonClient };
