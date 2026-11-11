import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface ToastAction { title?: string; url: string; label: string }

export interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onAction?: (id: string, url: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss, onAction }) => {
  if (toasts.length === 0) return null;

  const typeConfig: Record<ToastType, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />,
      bg: 'bg-white',
      text: 'text-brand-darkText',
      border: 'border-brand-green/60',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
      bg: 'bg-white',
      text: 'text-red-900',
      border: 'border-red-400',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      bg: 'bg-white',
      text: 'text-amber-900',
      border: 'border-amber-400',
    },
    info: {
      icon: <Info className="w-5 h-5 text-brand-plum shrink-0" />,
      bg: 'bg-white',
      text: 'text-brand-darkText',
      border: 'border-brand-plum/40',
    },
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 end-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4"
    >
      {toasts.map(toast => {
        const conf = typeConfig[toast.type];
        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`
              pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-card border shadow-dialog
              ${conf.bg} ${conf.text} ${conf.border}
              animate-in slide-in-from-bottom-4 duration-150
            `}
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {conf.icon}
              <div className="min-w-0">
                {toast.title && <p className="mb-1 text-sm font-bold">{toast.title}</p>}
                <p className="text-sm font-medium">{toast.message}</p>
                {toast.actionUrl && toast.actionLabel && <button type="button" onClick={() => onAction?.(toast.id, toast.actionUrl!)} className="mt-2 rounded-md bg-brand-plum px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand-plum">{toast.actionLabel}</button>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="إغلاق التنبيه"
              className="text-brand-charcoal/60 hover:text-brand-charcoal focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
