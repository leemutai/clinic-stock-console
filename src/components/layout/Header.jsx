import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="app-header__brand" aria-label="Clinic Stock Console home">
          Clinic Stock Console
        </Link>
        <div className="app-header__actions">
          {/* User menu and logout button added in Step 5 */}
        </div>
      </div>
    </header>
  );
}
