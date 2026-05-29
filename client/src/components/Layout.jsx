import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { getPins } from '../services/api';

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const [pins, setPins] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getPins().then(res => setPins(res.data || [])).catch(() => {});
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: '/faqs', label: 'FAQs' },
    { to: '/wiki', label: 'Wiki' },
    { to: '/community', label: 'Community' },
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
                <span className="text-white text-sm font-bold">F</span>
              </div>
              <span className="font-semibold text-slate-900 text-base hidden sm:block">FAQ App</span>
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
              {/* Pin badge on FAQ nav */}
              {pins.length > 0 && (
                <Link
                  to="/faqs"
                  className="hidden sm:flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium"
                >
                  📌 {pins.length} pinned
                </Link>
              )}

              {/* RAG chat toggle */}
              {user ? (
                <>
                  <Link
                    to="/raise-query"
                    className="hidden sm:block text-sm text-slate-600 hover:text-primary-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Ask a Question
                  </Link>
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
                      {user.role === 'admin' && (
                        <Link to="/admin" className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary-600">
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={onLogout}
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
            {user && (
              <Link to="/raise-query" className="block px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg">
                Ask a Question
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">F</span>
              </div>
              <span>FAQ App — Vicharanashala</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/faqs" className="hover:text-primary-600 transition-colors">FAQs</Link>
              <Link to="/wiki" className="hover:text-primary-600 transition-colors">Wiki</Link>
              <Link to="/community" className="hover:text-primary-600 transition-colors">Community</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-primary-600 transition-colors">Admin</Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
