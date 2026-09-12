import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * On mount, if an access token exists, validate it against the server.
   * We do NOT decode the JWT client-side: DummyJSON's tokens are not
   * cryptographically valid, so the only source of truth is /auth/me.
   * A 401 here is handled by the axios refresh interceptor and, if
   * refresh also fails, the interceptor redirects to /login.
   */
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const current = await authApi.getCurrentUser();
        if (!cancelled) setUser(current);
      } catch {
        // Either 401 with failed refresh (interceptor already cleared
        // tokens and redirected) or a transient error. Leave user=null;
        // ProtectedRoute will send them to /login.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
