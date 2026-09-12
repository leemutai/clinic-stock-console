import { Header } from './Header';

export function Layout({ children }) {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-content">{children}</main>
    </div>
  );
}
