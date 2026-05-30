import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { getPins } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const location = useLocation();
  const [pins, setPins] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();

  useEffect(() => {
    getPins().then(res => setPins(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'FAQs' },
    { to: '/community', label: 'Community' },
    ...(user ? [{ to: '/leaderboard', label: 'Leaderboard' }] : []),
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Navbar ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">G</span>
              </div>
              <span className="font-semibold text-slate-900 text-base hidden sm:block">Granth</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
            {/* Theme toggle */}
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l.707.707M6.343 17.657l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* User controls */}
              {user ? (
                <>
                  {user.role !== 'admin' && (
                    <Link
                      to="/ask"
                      className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Raise a Query"
                    >
                      <svg className="w-4 h-4 shrink-0 animate-bounce-slow" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v5" />
                        <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6" />
                        <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                        <path d="M6 14V10a2 2 0 0 0-2-2 2 2 0 0 0-2 2v10a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6V12a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
                      </svg>
                      <span className="font-medium">Raise Query</span>
                    </Link>
                  )}
                  <div className="relative group">
                    <button className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold flex items-center justify-center hover:bg-primary-200 transition-colors">
                      {user.name?.charAt(0).toUpperCase()}
                    </button>
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link to="/profile" className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary-600">
                        My Profile
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary-600">
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-slate-600 hover:text-primary-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    Sign in
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-1.5 px-3">
                    Register
                  </Link>
                </>
              )}

              {/* Mobile menu button */}
              <button
                className="sm:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={() => setMenuOpen(m => !m)}
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && user.role !== 'admin' && (
              <Link to="/ask" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 rounded-lg">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v5" />
                  <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6" />
                  <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                  <path d="M6 14V10a2 2 0 0 0-2-2 2 2 0 0 0-2 2v10a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6V12a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
                </svg>
                Raise Query
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ── Page content — rendered via React Router's <Outlet /> ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span>Granth</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="hover:text-primary-600 transition-colors">FAQs</Link>
              <Link to="/community" className="hover:text-primary-600 transition-colors">Community</Link>
              {user && <Link to="/leaderboard" className="hover:text-primary-600 transition-colors">Leaderboard</Link>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
