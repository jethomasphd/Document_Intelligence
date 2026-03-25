import { Outlet, Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export default function Layout() {
  const location = useLocation();

  const navLink = (to, label) => (
    <Link
      to={to}
      className={clsx(
        'text-sm no-underline transition-colors',
        location.pathname === to ? 'text-accent-cyan' : 'text-text-muted hover:text-text-primary'
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <header className="border-b border-border-line bg-bg-surface px-6 py-3 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-3 no-underline">
          <div className="w-8 h-8 rounded bg-accent-cyan/20 flex items-center justify-center">
            <span className="text-accent-cyan font-mono text-sm font-medium">DI</span>
          </div>
          <span className="text-text-primary font-semibold text-lg">Document Intelligence</span>
        </Link>
        <nav className="flex items-center gap-4">
          {navLink('/home', 'Home')}
          {navLink('/about', 'About')}
          {navLink('/corpus/new', '+ New Corpus')}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
