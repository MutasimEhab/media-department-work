import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  const { language } = useApp();
  const isRtl = language === 'ar';

  if (totalPages <= 1) return null;

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <nav
      role="navigation"
      aria-label="التنقل بين الصفحات"
      className={`flex items-center justify-center gap-1 sm:gap-2 ${className}`}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="الصفحة السابقة"
        className="w-10 h-10 rounded-input border border-brand-border bg-white flex items-center justify-center text-brand-darkText hover:bg-brand-lightGray/60 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-plum"
      >
        <PrevIcon className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={isActive ? 'page' : undefined}
              className={`
                w-10 h-10 rounded-input text-xs sm:text-sm font-mono font-bold flex items-center justify-center transition-colors
                focus:outline-none focus:ring-2 focus:ring-brand-plum
                ${
                  isActive
                    ? 'bg-brand-plum text-white shadow-sm'
                    : 'border border-brand-border bg-white text-brand-darkText hover:bg-brand-lightGray/60'
                }
              `}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="الصفحة التالية"
        className="w-10 h-10 rounded-input border border-brand-border bg-white flex items-center justify-center text-brand-darkText hover:bg-brand-lightGray/60 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-plum"
      >
        <NextIcon className="w-4 h-4" />
      </button>
    </nav>
  );
};
