import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { EnglishDateInput } from './EnglishDateInput';

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
  value,
  onChange,
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

      <EnglishDateInput
        id={inputId}
        ariaLabel={label}
        ariaInvalid={Boolean(error)}
        ariaDescribedBy={error ? errorId : helperText ? helperId : undefined}
        value={String(value ?? '')}
        onChange={() => undefined}
        onChangeEvent={onChange}
        disabled={disabled}
        required={requiredIndicator || props.required}
        min={typeof props.min === 'string' ? props.min : undefined}
        max={typeof props.max === 'string' ? props.max : undefined}
        className={`bg-white ${error ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' : ''} ${className}`}
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


