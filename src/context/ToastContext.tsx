import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Snackbar, Alert, type AlertColor } from '@mui/material';

interface Toast {
  id: number;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, severity: AlertColor, duration = 4000) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, severity, duration }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error', 6000),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info'),
  };

  // Show only the first toast (queue style)
  const current = toasts[0] ?? null;

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Snackbar
        open={!!current}
        autoHideDuration={current?.duration ?? 4000}
        onClose={() => current && removeToast(current.id)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {current ? (
          <Alert
            onClose={() => removeToast(current.id)}
            severity={current.severity}
            variant="filled"
            sx={{ width: '100%', minWidth: 300 }}
          >
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context.toast;
}
