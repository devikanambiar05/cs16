import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    fetch(`http://localhost:5000/api/auth/verify-email/${token}`)
      .then(res => res.json())
      .then(data => {
        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong. Please try again later.');
      });
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying...</h2>
            <p className="text-slate-500">Please wait while we verify your email.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Email Verified!</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <button onClick={() => navigate('/login')} className="btn-primary px-8">
              Sign In
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <button onClick={() => navigate('/login')} className="btn-primary px-8">
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;