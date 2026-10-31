import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

// Endpoints that should NOT trigger the refresh interceptor
const skipRefreshUrls = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/me', '/auth/forgot-password', '/auth/reset-password'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !skipRefreshUrls.some((skip) => url.includes(skip))
    ) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export { api };
