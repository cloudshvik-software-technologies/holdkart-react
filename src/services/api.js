import axios from 'axios';
  import { getStorage, setStorage, removeStorage } from '../utils/storage.js';

  export const STORAGE_KEYS = {
    TOKEN: 'customerToken',
    REFRESH_TOKEN: 'customerRefreshToken',
    CUSTOMER: 'customerData',
  };

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  api.interceptors.request.use((config) => {
    const token = getStorage(STORAGE_KEYS.TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) delete config.headers['Content-Type'];
    return config;
  }, (err) => Promise.reject(err));

  let isRefreshing = false;
  let failedQueue = [];
  const processQueue = (err, token = null) => {
    failedQueue.forEach((p) => err ? p.reject(err) : p.resolve(token));
    failedQueue = [];
  };

  api.interceptors.response.use(
    (res) => res.data,
    async (error) => {
      const orig = error.config;
      if (error.response?.status === 401 && !orig._retry && !orig.url?.includes('/auth/')) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
            .then((token) => { orig.headers.Authorization = `Bearer ${token}`; return api(orig); })
            .catch((e) => Promise.reject(e));
        }
        orig._retry = true;
        isRefreshing = true;
        try {
          const refreshToken = getStorage(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) throw new Error('No refresh token');
          const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}/api/customer/auth/refresh`, { refreshToken });
          const { token } = res.data;
          setStorage(STORAGE_KEYS.TOKEN, token);
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          processQueue(null, token);
          orig.headers.Authorization = `Bearer ${token}`;
          return api(orig);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          removeStorage(STORAGE_KEYS.TOKEN);
          removeStorage(STORAGE_KEYS.REFRESH_TOKEN);
          removeStorage(STORAGE_KEYS.CUSTOMER);
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
          return Promise.reject(refreshErr);
        } finally { isRefreshing = false; }
      }
      return Promise.reject(error);
    }
  );

  export default api;
  