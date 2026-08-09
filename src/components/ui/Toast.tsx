"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Trophy, X } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  description?: string;
  variant: "default" | "pr" | "error";
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastOptions {
  description?: string;
  variant?: Toast["variant"];
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = ++idCounter;
      const toast: Toast = {
        id,
        message,
        description: options?.description,
        variant: options?.variant ?? "default",
        actionLabel: options?.actionLabel,
        onAction: options?.onAction,
      };
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => dismiss(id), options?.durationMs ?? 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-surface-elevated animate-fade-slide-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border-strong px-4 py-3 shadow-xl"
          >
            {t.variant === "pr" && (
              <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${t.variant === "error" ? "text-danger" : "text-ink"}`}
              >
                {t.message}
              </p>
              {t.description && (
                <p className="mt-0.5 text-sm text-ink-secondary">{t.description}</p>
              )}
            </div>
            {t.actionLabel && t.onAction && (
              <button
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
                className="shrink-0 text-sm font-semibold text-accent-soft"
              >
                {t.actionLabel}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="shrink-0 text-ink-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
