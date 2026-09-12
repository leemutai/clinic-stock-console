import axios from 'axios';

const BASE_URL = 'https://dummyjson.com';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Attach the current access token to every outgoing request.
 * Reads from localStorage so no React context is needed inside the API layer.
 */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Single-flight refresh queue.
 *
 * If five requests 401 at the same moment, we do NOT want five POSTs to
 * /auth/refresh — the first would invalidate the refresh token and the
 * other four would fail. Instead:
 *   - the first 401 sets `isRefreshing = true` and starts the refresh
 *   - the other four push a callback onto `waiters` and await
 *   - when refresh succeeds, every waiter replays its original request
 *   - when refresh fails, every waiter is rejected and the user is sent to login
 */
let isRefreshing = false;
let waiters = [];

function onRefreshed(newToken) {
  waiters.forEach((resolve) => resolve(newToken));
  waiters = [];
}

function onRefreshFailed(error) {
  waiters.forEach((_, reject) => reject(error));
  waiters = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only attempt refresh for 401s, and only once per request.
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      // No refresh token — user must sign in again.
      localStorage.removeItem('accessToken');
      window.location.assign('/login');
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // Another request is already refreshing. Wait for its result and replay.
      return new Promise((resolve, reject) => {
        waiters.push({
          resolve: (newToken) => {
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      onRefreshed(data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      onRefreshFailed(refreshError);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.assign('/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
