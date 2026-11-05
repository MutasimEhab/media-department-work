import React, { useId } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  requiredIndicator?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  helperText,
  error,
  requiredIndicator,
  id,
  disabled,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-subheading text-brand-darkText">
          {label}
          {requiredIndicator && <span className="text-brand-magenta ms-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-brand-charcoal/70">
          <Calendar className="w-4 h-4" />
        </div>

        <input
          type="text" inputMode="numeric" dir="ltr" placeholder="YYYY-MM-DD"
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`
            w-full rounded-input border bg-white ps-10 pe-3.5 py-2.5 text-sm text-brand-darkText
            min-h-[44px] transition-colors font-mono
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-brand-border focus:border-brand-plum focus:ring-2 focus:ring-brand-plum/20'
            }
            disabled:bg-brand-lightGray/50 disabled:text-brand-charcoal/50 disabled:cursor-not-allowed
            focus:outline-none
            ${className}
          `}
          {...props}
        />
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


