import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  provisionalNotice?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  footer,
  padding = 'md',
  provisionalNotice = false,
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-card border border-brand-border shadow-subtle flex flex-col relative
        ${className}
      `}
      {...props}
    >
      {provisionalNotice && (
        <div className="bg-amber-100/70 border-b border-amber-200 px-4 py-1.5 text-[11px] font-semibold text-amber-900 flex items-center justify-between">
          <span>واجهة تجريبية · بانتظار الاعتماد الرسمي</span>
        </div>
      )}

      {(title || action) && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-brand-border/60">
          <div>
            {title && <h3 className="text-base sm:text-lg font-subheading text-brand-darkText">{title}</h3>}
            {subtitle && <p className="text-xs text-brand-charcoal/70 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`flex-1 ${paddingClasses[padding]}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3 bg-brand-lightGray/40 border-t border-brand-border/60 rounded-b-card">
          {footer}
        </div>
      )}
    </div>
  );
};
