import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-card border border-dashed border-brand-border bg-white
        ${className}
      `}
    >
      <div className="w-14 h-14 rounded-full bg-brand-lightGray flex items-center justify-center text-brand-charcoal mb-4">
        {icon || <Inbox className="w-7 h-7 stroke-[1.5]" />}
      </div>
      <h4 className="text-base font-subheading text-brand-darkText">{title}</h4>
      {description && (
        <p className="text-xs sm:text-sm text-brand-charcoal/70 max-w-sm mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
