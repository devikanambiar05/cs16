import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { forgotPassword, resendVerification, register as apiRegister } from '../services/api';

function LoginPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const isRegisterPath = location.pathname === '/register';
  const [isLogin, setIsLogin] = useState(
    isRegisterPath ? false : (location.state?.wantsSignup ? false : true)
  );

  useEffect(() => {
    const isRegister = location.pathname === '/register';
    setIsLogin(isRegister ? false : (location.state?.wantsSignup ? false : true));
    setError('');
    setShowForgot(false);
  }, [location.pathname, location.state]);

  const from = (location.state?.from && location.state?.from !== '/login')
    ? location.state.from
    : '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
        navigate(from, { replace: true });
      } else {
        if (!form.name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        await apiRegister({ name: form.name, email: form.email, password: form.password });
        setIsLogin(true);
        setForm(prev => ({ ...prev, password: '' })); // Clear password
        toast.success('Registration successful! Please sign in with your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.error || (isLogin ? 'Login failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setForm({ name: '', email: 'admin@faqapp.com', password: 'admin123' });
    setError('');
    setLoading(true);
    try {
      await login('admin@faqapp.com', 'admin123');
      const destination = from !== '/login' ? from : '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError('Login failed — make sure you\'ve run the seed script');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await resendVerification();
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">
            {isLogin ? 'Welcome Back' : 'Join Granth'}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            {isLogin
              ? 'Sign in to raise queries and help others'
              : 'Create an account to participate in the community'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 px-4 py-2.5 rounded-xl mb-4 text-xs">
            {error}
          </div>
        )}

        {/* Forgot Password Panel */}
        {isLogin && showForgot && (
          <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl p-5 mb-5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-2">
              {forgotSent ? '✓ Check your email' : 'Reset your password'}
            </h3>
            {forgotSent ? (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  If that email address is registered with us, we've sent a password reset link.
                  It expires in 1 hour.
                </p>
                <button
                  onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors hover:underline font-medium"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your email and we'll send you a reset link.
                </p>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/15 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/5 focus:border-slate-400 transition-all placeholder-slate-400/70"
                  placeholder="you@university.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="btn-primary text-xs py-2 flex-1 rounded-xl">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="btn-ghost text-xs py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/15 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/5 focus:border-slate-400 transition-all placeholder-slate-400/70"
                placeholder="Priya Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/15 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/5 focus:border-slate-400 transition-all placeholder-slate-400/70"
              placeholder="you@university.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/15 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/5 focus:border-slate-400 transition-all placeholder-slate-400/70"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-sm font-medium tracking-wide shadow-sm hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Forgot password link */}
        {isLogin && !showForgot && (
          <div className="text-right mt-2">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium"
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Toggle */}
        <div className="text-center mt-5">
          <button
            type="button"
            onClick={() => {
              const targetPath = isLogin ? '/register' : '/login';
              navigate(targetPath, { replace: true });
              setIsLogin(!isLogin);
              setError('');
              setShowForgot(false);
            }}
            className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:underline font-medium transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Info Box */}
        {isLogin && (
          <details className="mt-5 group border border-slate-200/40 dark:border-slate-800/40 rounded-2xl p-3 bg-slate-50/20 dark:bg-slate-950/10 transition-all select-none">
            <summary className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer flex items-center justify-between">
              <span>Need demo credentials?</span>
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/30 dark:border-slate-800/30 text-xs text-slate-400 dark:text-slate-500 space-y-2.5">
              <p>👤 <span className="font-medium text-slate-600 dark:text-slate-300">Admin User</span> — admin@faqapp.com</p>
              <p>Password: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">admin123</span></p>
              <p className="text-[10px] text-amber-500/80">Run <code className="bg-amber-100/50 dark:bg-amber-950/20 px-1 rounded">npm run seed</code> first if login fails.</p>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full mt-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all duration-150"
                disabled={loading}
              >
                Sign in automatically with Demo
              </button>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export default LoginPage;