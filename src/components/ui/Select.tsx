import React, { useId } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
  placeholder?: string;
  requiredIndicator?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  helperText,
  error,
  placeholder,
  requiredIndicator,
  id,
  disabled,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-subheading text-brand-darkText">
          {label}
          {requiredIndicator && <span className="text-brand-magenta ms-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`
            w-full appearance-none rounded-input border bg-white px-3.5 pe-10 py-2.5 text-sm text-brand-darkText
            min-h-[44px] transition-colors
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-brand-border focus:border-brand-plum focus:ring-2 focus:ring-brand-plum/20'
            }
            disabled:bg-brand-lightGray/50 disabled:text-brand-charcoal/50 disabled:cursor-not-allowed
            focus:outline-none cursor-pointer
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-brand-charcoal/70">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-brand-charcoal/70">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
