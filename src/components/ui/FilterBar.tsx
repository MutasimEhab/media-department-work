import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  onReset,
  hasActiveFilters = false,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-white rounded-card border border-brand-border p-3.5 sm:p-4 shadow-subtle
        flex flex-wrap items-center justify-between gap-3
        ${className}
      `}
    >
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-subheading text-brand-charcoal/80 pe-2 border-e border-brand-border/60 hidden sm:flex">
          <Filter className="w-3.5 h-3.5" />
          <span>تصفية:</span>
        </div>
        {children}
      </div>

      {hasActiveFilters && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="text-xs text-brand-magenta hover:bg-brand-magenta/5"
        >
          إعادة ضبط
        </Button>
      )}
    </div>
  );
};
