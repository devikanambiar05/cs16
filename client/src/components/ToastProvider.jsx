import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useMemo(() => ({
    success: (message, opts = {}) => addToast({ message, type: 'success', ...opts }),
    error: (message, opts = {}) => {
      const rateLimitMsg = '⚡ Request limit reached. Please wait a few moments before trying again.';
      if (message === rateLimitMsg && opts.fromGlobalListener !== true) {
        // Ignore duplicate rate limit toast from local catch block
        return;
      }
      if (typeof window !== 'undefined' && Date.now() - (window.__lastRateLimitTime || 0) < 100) {
        if (typeof message === 'string' && (message.includes('Failed to') || message === 'Request failed' || message.includes('Error'))) {
          // Suppress generic failure toasts immediately after rate limiting
          return;
        }
      }
      return addToast({ message, type: 'error', ...opts });
    },
    warning: (message, opts = {}) => addToast({ message, type: 'warning', ...opts }),
    info: (message, opts = {}) => addToast({ message, type: 'info', ...opts }),
  }), [addToast]);

  useEffect(() => {
    const handleShowToast = (e) => {
      const { message, type, opts } = e.detail || {};
      if (message) {
        if (type === 'success') toast.success(message, opts);
        else if (type === 'warning') toast.warning(message, opts);
        else if (type === 'info') toast.info(message, opts);
        else toast.error(message, { ...opts, fromGlobalListener: true });
      }
    };
    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, [toast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * useToast() — call from any component or action handler.
 * Usage: const toast = useToast(); toast.success('Saved!');
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
};

const STYLES = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const ICON_STYLES = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function Toast({ toast, removeToast }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Bootstrap the enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => removeToast(toast.id), 250);
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto
        transition-all duration-300
        ${STYLES[toast.type]}
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <span className={`text-lg font-bold leading-none mt-0.5 ${ICON_STYLES[toast.type]}`}>
        {ICONS[toast.type]}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="text-current opacity-50 hover:opacity-100 text-lg leading-none font-bold shrink-0 ml-2"
      >
        ×
      </button>
    </div>
  );
}
