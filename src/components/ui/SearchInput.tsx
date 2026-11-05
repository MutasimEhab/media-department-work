import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'بحث...',
  onClear,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center w-full sm:w-64 ${className}`}>
      <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-brand-charcoal/60">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-input border border-brand-border bg-white ps-9 pe-8 py-2 text-xs sm:text-sm text-brand-darkText placeholder-brand-charcoal/50 min-h-[40px] focus:outline-none focus:border-brand-plum focus:ring-1 focus:ring-brand-plum"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          aria-label="مسح البحث"
          className="absolute inset-y-0 end-0 flex items-center pe-2.5 text-brand-charcoal/60 hover:text-brand-charcoal focus:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
