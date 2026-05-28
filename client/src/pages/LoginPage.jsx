import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { forgotPassword, resendVerification } from '../services/api';

function LoginPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.wantsSignup ? false : true);

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
      } else {
        if (!form.name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        await register(form.name, form.email, form.password);
      }
      navigate(from, { replace: true });
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
      alert('Verification email sent! Check your inbox.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Join Samagama'}
          </h1>
          <p className="text-slate-600">
            {isLogin
              ? 'Sign in to ask questions and help others'
              : 'Create an account to participate in the community'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Forgot Password Panel */}
        {isLogin && showForgot && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">
              {forgotSent ? '✓ Check your email' : 'Reset your password'}
            </h3>
            {forgotSent ? (
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  If that email address is registered with us, we've sent a password reset link.
                  It expires in 1 hour.
                </p>
                <button
                  onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-sm text-slate-600">
                  Enter your email and we'll send you a reset link.
                </p>
                <input
                  type="email"
                  className="input"
                  placeholder="you@university.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="btn-primary text-sm py-2 flex-1">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="btn-ghost text-sm py-2"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="Priya Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="input"
              placeholder="you@university.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="input"
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
            className="btn-primary w-full py-2.5 text-base disabled:opacity-50"
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
              className="text-sm text-primary-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Demo Login */}
        {isLogin && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="btn-outline w-full py-2.5 text-sm"
              disabled={loading}
            >
              Try Demo Account
            </button>
          </div>
        )}

        {/* Toggle */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setShowForgot(false);
            }}
            className="text-sm text-primary-600 hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800 mb-2">Demo Account:</p>
          <p>👤 <span className="font-medium">Admin User</span> — admin@faqapp.com</p>
          <p className="mt-1">Password: <span className="font-mono bg-slate-200 px-1 rounded">admin123</span></p>
          <p className="text-xs mt-2 text-amber-600">Run <code className="bg-amber-100 px-1 rounded">npm run seed</code> first if login fails.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;