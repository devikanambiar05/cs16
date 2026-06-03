import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';

const evaluatePasswordStrength = (pwd) => {
  if (!pwd) {
    return {
      score: 0,
      label: '',
      color: 'bg-slate-200 dark:bg-slate-800',
      level: 0,
      criteria: {
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSymbol: false,
      }
    };
  }

  const hasMinLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

  const criteria = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSymbol];
  const score = criteria.filter(Boolean).length;

  let label = 'Weak';
  let color = 'bg-red-500';
  let level = 1; // 1: Weak, 2: Fair, 3: Strong

  if (score === 5) {
    label = 'Strong';
    color = 'bg-emerald-500';
    level = 3;
  } else if (score >= 3) {
    label = 'Fair';
    color = 'bg-amber-500';
    level = 2;
  }

  return {
    score,
    label,
    color,
    level,
    criteria: {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSymbol,
    }
  };
};

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = evaluatePasswordStrength(password);

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Invalid Reset Link</h2>
          <p className="text-slate-600 mb-6">This password reset link is invalid or has expired.</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const strength = evaluatePasswordStrength(password);
    if (strength.score < 5) {
      setError('Password must meet all complexity requirements: minimum 8 characters, with uppercase, lowercase, numbers, and symbols.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔓</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Password Reset!</h2>
          <p className="text-slate-600 mb-6">Your password has been changed. You can now sign in with your new password.</p>
          <button onClick={() => navigate('/login')} className="btn-primary px-8">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Set New Password</h1>
          <p className="text-slate-600">Choose a strong password you haven't used before.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {password && passwordStrength && (
              <div className="mt-3 space-y-2 text-left">
                {/* Progressive Bar */}
                <div className="flex h-1.5 gap-1.5">
                  <div className={`h-full flex-1 rounded-sm transition-all duration-300 ${passwordStrength.level >= 1 ? (passwordStrength.level === 1 ? 'bg-red-500' : passwordStrength.level === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-800'}`} />
                  <div className={`h-full flex-1 rounded-sm transition-all duration-300 ${passwordStrength.level >= 2 ? (passwordStrength.level === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-800'}`} />
                  <div className={`h-full flex-1 rounded-sm transition-all duration-300 ${passwordStrength.level >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                </div>
                
                {/* Label */}
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 dark:text-slate-500">Password strength:</span>
                  <span className={`font-semibold transition-colors duration-300 ${
                    passwordStrength.level === 1 ? 'text-red-500' : passwordStrength.level === 2 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>

                {/* Checklist */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] pt-1">
                  <div className={`flex items-center gap-1.5 transition-colors duration-200 ${passwordStrength.criteria.hasMinLength ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span>{passwordStrength.criteria.hasMinLength ? '✓' : '○'}</span>
                    <span>Min. 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors duration-200 ${passwordStrength.criteria.hasUppercase ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span>{passwordStrength.criteria.hasUppercase ? '✓' : '○'}</span>
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors duration-200 ${passwordStrength.criteria.hasLowercase ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span>{passwordStrength.criteria.hasLowercase ? '✓' : '○'}</span>
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors duration-200 ${passwordStrength.criteria.hasNumber ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span>{passwordStrength.criteria.hasNumber ? '✓' : '○'}</span>
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 transition-colors duration-200 ${passwordStrength.criteria.hasSymbol ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span>{passwordStrength.criteria.hasSymbol ? '✓' : '○'}</span>
                    <span>Symbol (special char)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
              >
                {showConfirm ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-base disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;