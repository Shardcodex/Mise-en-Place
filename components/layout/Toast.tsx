"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-pill px-5 py-2.5 shadow-toast animate-slide-up ${
              toast.type === "error"
                ? "bg-danger text-white"
                : toast.type === "info"
                ? "bg-ink text-white"
                : "bg-herb text-white"
            }`}
          >
            {toast.type === "error" ? (
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2} />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
            )}
            <span className="text-[12px] font-medium whitespace-nowrap">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
