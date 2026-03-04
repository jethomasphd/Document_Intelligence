import { Outlet, Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <header className="border-b border-border-line bg-bg-surface px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-8 h-8 rounded bg-accent-cyan/20 flex items-center justify-center">
            <span className="text-accent-cyan font-mono text-sm font-medium">DI</span>
          </div>
          <span className="text-text-primary font-semibold text-lg">Document Intelligence</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className={clsx(
              'text-sm no-underline transition-colors',
              location.pathname === '/' ? 'text-accent-cyan' : 'text-text-muted hover:text-text-primary'
            )}
          >
            Home
          </Link>
          <Link
            to="/corpus/new"
            className={clsx(
              'text-sm no-underline transition-colors',
              location.pathname === '/corpus/new' ? 'text-accent-cyan' : 'text-text-muted hover:text-text-primary'
            )}
          >
            + New Corpus
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
