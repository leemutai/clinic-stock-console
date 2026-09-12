import { apiClient } from './client';

const SHORT_TOKEN_LIFETIME_MINUTES = 1;

export const authApi = {
  /**
   * Sign in and return the token pair plus user profile.
   * expiresInMins: 1 per the brief, so token expiry occurs during testing.
   */
  async login(username, password) {
    const { data } = await apiClient.post('/auth/login', {
      username,
      password,
      expiresInMins: SHORT_TOKEN_LIFETIME_MINUTES,
    });
    return data;
  },

  /**
   * Fetch the currently authenticated user. Used on app boot to
   * validate a token found in localStorage.
   */
  async getCurrentUser() {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  /**
   * Clear local credentials. No server call — DummyJSON has no logout endpoint.
   */
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
