import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              min-w-[300px] max-w-md p-4 rounded-lg shadow-lg border-l-4 flex items-start gap-3 
              ${toast.type === 'success' ? 'bg-white border-green-500 text-gray-800' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-500 text-gray-800' : ''}
              ${toast.type === 'warning' ? 'bg-white border-yellow-500 text-gray-800' : ''}
              ${toast.type === 'info' ? 'bg-white border-blue-500 text-gray-800' : ''}
            `}
          >
            <div className="mt-0.5">
               {toast.type === 'success' && <CheckCircle className="text-green-500" size={18} />}
               {toast.type === 'error' && <AlertCircle className="text-red-500" size={18} />}
               {toast.type === 'warning' && <AlertTriangle className="text-yellow-500" size={18} />}
               {toast.type === 'info' && <Info className="text-blue-500" size={18} />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
               <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};