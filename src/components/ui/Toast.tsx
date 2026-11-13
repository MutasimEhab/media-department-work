import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, ClipboardCheck, FolderKanban, FileText, CalendarCheck2, BellRing, type LucideIcon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  actionUrl?: string;
  actionLabel?: string;
  notificationType?: string;
  notificationId?: string;
}

export interface ToastAction { title?: string; url: string; label: string; notificationType?: string; notificationId?: string }

export interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onAction?: (id: string, url: string, notificationId?: string) => void;
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

  const notificationConfig: Record<string, { label: string; icon: LucideIcon }> = {
    TASK_ASSIGNED: { label: 'تكليف جديد', icon: ClipboardCheck },
    TASK_SUBMITTED: { label: 'تحديث تكليف', icon: ClipboardCheck },
    TASK_AWAITING_REVIEW: { label: 'تكليف للمراجعة', icon: ClipboardCheck },
    PROJECT_ASSIGNED: { label: 'مشروع جديد', icon: FolderKanban },
    CIRCULAR_PUBLISHED: { label: 'تعميم جديد', icon: FileText },
    WORK_DATE_EXCEPTION: { label: 'استثناء جديد', icon: CalendarCheck2 },
    WORK_LOG_MISSING: { label: 'تذكير بتسجيل العمل', icon: BellRing },
  };

  return (
    <>
      <div aria-live="polite" aria-relevant="additions" className="fixed top-16 end-2 z-50 flex w-[min(24rem,calc(100vw-1rem))] flex-col gap-3 pointer-events-none p-2 sm:top-20 sm:end-5">
      {toasts.filter(item => item.notificationType).map(toast => {
        const category = notificationConfig[toast.notificationType!] ?? { label: 'إشعار جديد', icon: BellRing };
        const CategoryIcon = category.icon;
        return (
          <section key={toast.id} role="status" className="notification-toast pointer-events-auto overflow-hidden rounded-2xl border border-brand-plum/30 bg-white text-brand-darkText shadow-dialog animate-in slide-in-from-top-3 fade-in duration-300">
            <div className="flex items-start gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-magenta/10 text-brand-plum"><CategoryIcon size={22} aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wide text-brand-plum">{category.label}</p>
                <p className="mt-1 text-sm font-bold leading-5">{toast.title || 'وصلك إشعار جديد'}</p>
                <p className="mt-1 text-xs leading-5 text-brand-charcoal/80">{toast.message}</p>
                {toast.actionUrl && toast.actionLabel && <button type="button" onClick={() => onAction?.(toast.id, toast.actionUrl!, toast.notificationId)} className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-brand-plum px-3.5 text-xs font-bold text-white transition hover:bg-brand-magenta focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-plum focus-visible:ring-offset-2">{toast.actionLabel}</button>}
              </div>
              <button type="button" onClick={() => onDismiss(toast.id)} aria-label="إغلاق الإشعار" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-brand-charcoal/70 transition hover:bg-brand-lightGray hover:text-brand-darkText focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-plum"><X size={17} /></button>
            </div>
            <div className="h-1 bg-brand-magenta/10"><div className="notification-toast-progress h-full bg-brand-magenta" /></div>
          </section>
        );
      })}
      </div>
      <div aria-live="polite" className="fixed bottom-2 end-2 z-50 flex max-w-sm w-full flex-col gap-2 pointer-events-none p-2 sm:bottom-5 sm:end-5">
      {toasts.filter(item => !item.notificationType).map(toast => {
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
                {toast.actionUrl && toast.actionLabel && <button type="button" onClick={() => onAction?.(toast.id, toast.actionUrl!, toast.notificationId)} className="mt-2 rounded-md bg-brand-plum px-3 py-1.5 text-xs font-bold text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand-plum">{toast.actionLabel}</button>}
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
    </>
  );
};
