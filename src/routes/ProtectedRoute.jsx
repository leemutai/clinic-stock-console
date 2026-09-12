import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Checking session…</p>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
