import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="app-header__brand" aria-label="Clinic Stock Console home">
          Clinic Stock Console
        </Link>

        <div className="app-header__actions">
          {user && (
            <>
              <span className="app-header__user">
                Signed in as {user.firstName ?? user.username}
              </span>
              <button type="button" className="btn btn--ghost" onClick={handleLogout}>
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
