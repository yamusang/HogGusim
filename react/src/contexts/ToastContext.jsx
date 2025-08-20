// src/contexts/ToastContext.jsx
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const idRef = useRef(0);
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, { type = 'info', timeout = 2400 } = {}) => {
    const id = ++idRef.current;
    setToasts((list) => [...list, { id, type, message }]);
    if (timeout > 0) {
      setTimeout(() => remove(id), timeout);
    }
  }, [remove]);

  const api = useMemo(() => ({
    show,
    success: (msg, opt) => show(msg, { ...opt, type: 'success' }),
    error:   (msg, opt) => show(msg, { ...opt, type: 'error' }),
    info:    (msg, opt) => show(msg, { ...opt, type: 'info' }),
  }), [show]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-portal">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast__msg">{t.message}</span>
            <button className="toast__x" onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
