import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="text-xl font-bold text-primary-600">Samagama</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden sm:flex items-center gap-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'nav-link-active bg-primary-50' : 'nav-link hover:bg-slate-50'
                  }`
                }
              >
                FAQs
              </NavLink>
              <NavLink
                to="/wiki"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'nav-link-active bg-primary-50' : 'nav-link hover:bg-slate-50'
                  }`
                }
              >
                Wiki
              </NavLink>
              <NavLink
                to="/community"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'nav-link-active bg-primary-50' : 'nav-link hover:bg-slate-50'
                  }`
                }
              >
                Community
              </NavLink>
              <NavLink
                to="/ask"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'nav-link-active bg-primary-50' : 'nav-link hover:bg-slate-50'
                  }`
                }
              >
                Raise Query
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'nav-link-active bg-red-50 text-red-600' : 'nav-link hover:bg-slate-50'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-3">
                  {user.role === 'admin' && (
                    <Link to="/admin" className="hidden sm:flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg font-medium">
                      ⚙️ Admin
                    </Link>
                  )}
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.reputation} rep</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn-outline text-sm py-1.5 px-3"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost text-sm">
                    Sign In
                  </Link>
                  <Link to="/login" state={{ wantsSignup: true }} className="btn-primary text-sm">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-500">
          Samagama — Crowd-Sourced FAQ Management
        </div>
      </footer>
    </div>
  );
}

export default Layout;