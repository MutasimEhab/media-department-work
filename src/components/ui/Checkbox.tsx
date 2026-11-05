import React, { useId } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  error,
  id,
  checked,
  disabled,
  onChange,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={inputId}
        className={`
          flex items-start gap-3 select-none cursor-pointer min-h-[44px] py-1
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            id={inputId}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <div
            className={`
              w-5 h-5 rounded border-2 transition-colors flex items-center justify-center
              peer-focus:ring-2 peer-focus:ring-brand-plum peer-focus:ring-offset-2
              ${
                checked
                  ? 'bg-brand-magenta border-brand-magenta text-white'
                  : 'border-brand-border bg-white hover:border-brand-charcoal/60'
              }
            `}
          >
            {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-brand-darkText">{label}</span>
          {description && <span className="text-xs text-brand-charcoal/70">{description}</span>}
        </div>
      </label>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
