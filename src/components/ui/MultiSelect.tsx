import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X, AlertCircle } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  requiredIndicator?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'اختر عناصر...',
  helperText,
  error,
  disabled,
  requiredIndicator,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  useEscapeKey(isOpen, () => setIsOpen(false));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const removeValue = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== val));
  };

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-subheading text-brand-darkText">
          {label}
          {requiredIndicator && <span className="text-brand-magenta ms-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-expanded={isOpen}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={`
            w-full rounded-input border bg-white px-3 py-2 text-sm text-brand-darkText min-h-[44px]
            flex items-center justify-between flex-wrap gap-1.5 transition-colors cursor-pointer
            ${error ? 'border-red-500' : 'border-brand-border focus:border-brand-plum'}
            ${disabled ? 'bg-brand-lightGray/50 cursor-not-allowed opacity-50' : ''}
            focus:outline-none focus:ring-2 focus:ring-brand-plum/20
          `}
        >
          <div className="flex items-center flex-wrap gap-1.5 flex-1">
            {value.length === 0 ? (
              <span className="text-brand-charcoal/50">{placeholder}</span>
            ) : (
              value.map(val => {
                const opt = options.find(o => o.value === val);
                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 bg-brand-lightGray text-brand-darkText px-2 py-0.5 rounded-badge text-xs font-medium"
                  >
                    <span>{opt?.label || val}</span>
                    <button
                      type="button"
                      aria-label="إزالة"
                      disabled={disabled}
                      onClick={e => removeValue(val, e)}
                      className="hover:text-brand-magenta focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-brand-charcoal/70 shrink-0" />
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-30 mt-1 w-full bg-white rounded-card border border-brand-border shadow-dialog max-h-60 overflow-y-auto p-1.5">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="تصفية الخيارات..."
              className="w-full px-3 py-1.5 text-xs border-b border-brand-border/60 mb-1 focus:outline-none"
              onClick={e => e.stopPropagation()}
            />
            {filteredOptions.length === 0 ? (
              <p className="p-2 text-xs text-brand-charcoal/60 text-center">لا توجد خيارات مطابقة</p>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = value.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => toggleOption(opt.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleOption(opt.value);
                      }
                    }}
                    className={`
                      flex items-center justify-between px-3 py-2 rounded text-xs cursor-pointer select-none
                      ${isSelected ? 'bg-brand-magenta/10 text-brand-magenta font-semibold' : 'hover:bg-brand-lightGray/60 text-brand-darkText'}
                    `}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-brand-magenta" />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-xs text-red-600 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-brand-charcoal/70">{helperText}</p>
      ) : null}
    </div>
  );
};
