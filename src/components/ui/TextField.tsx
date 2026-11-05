import React, { useId } from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  requiredIndicator?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  onClear,
  requiredIndicator,
  id,
  value,
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
        <label
          htmlFor={inputId}
          className="text-sm font-subheading text-brand-darkText flex items-center justify-between"
        >
          <span>
            {label}
            {requiredIndicator && <span className="text-brand-magenta ms-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-brand-charcoal/70">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`
            w-full rounded-input border bg-white px-3.5 py-2.5 text-sm text-brand-darkText placeholder-brand-charcoal/50
            min-h-[44px] transition-colors
            ${leftIcon ? 'ps-10' : ''}
            ${rightIcon || onClear ? 'pe-10' : ''}
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

        {onClear && value && !disabled && (
          <button
            type="button"
            onClick={onClear}
            aria-label="مسح النص"
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-brand-charcoal/60 hover:text-brand-charcoal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {rightIcon && !onClear && (
          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-brand-charcoal/70">
            {rightIcon}
          </div>
        )}
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
