import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already signed in, bounce to the page they were trying to reach
  // (or the stock list if there was none).
  if (user) {
    const target = location.state?.from ?? '/';
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async ({ username, password }) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      // The <Navigate> at the top of this component handles redirection
      // once `user` flips from null to the logged-in profile.
    } catch (err) {
      const message =
        err.response?.data?.message ??
        (err.response?.status === 400
          ? 'Incorrect username or password.'
          : 'Sign-in failed. Check your connection and try again.');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <h1>Clinic Stock Console</h1>
        <p className="login-subtitle">Sign in to continue.</p>
        <LoginForm onSubmit={handleSubmit} error={error} isSubmitting={isSubmitting} />
      </div>
    </main>
  );
}
