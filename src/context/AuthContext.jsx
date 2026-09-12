import { createContext } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Real auth state added in Step 5
  const value = { user: null, loading: false, login: () => {}, logout: () => {} };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
