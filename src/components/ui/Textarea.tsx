import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showCharCount?: boolean;
  maxLength?: number;
  requiredIndicator?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  helperText,
  error,
  showCharCount,
  maxLength,
  requiredIndicator,
  id,
  value,
  disabled,
  rows = 4,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-subheading text-brand-darkText">
            {label}
            {requiredIndicator && <span className="text-brand-magenta ms-1" aria-hidden="true">*</span>}
          </label>
        )}
        {showCharCount && maxLength && (
          <span className="text-xs text-brand-charcoal/70" dir="ltr">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>

      <textarea
        id={textareaId}
        value={value}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`
          w-full rounded-input border bg-white px-3.5 py-2.5 text-sm text-brand-darkText placeholder-brand-charcoal/50
          transition-colors resize-y min-h-[80px]
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
