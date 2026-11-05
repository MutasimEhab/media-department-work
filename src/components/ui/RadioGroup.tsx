import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  label?: string;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (val: string) => void;
  direction?: 'horizontal' | 'vertical';
  error?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  direction = 'vertical',
  error,
}) => {
  return (
    <fieldset className="w-full flex flex-col gap-2">
      {label && <legend className="text-sm font-subheading text-brand-darkText mb-1">{label}</legend>}

      <div className={`flex ${direction === 'horizontal' ? 'flex-wrap gap-4' : 'flex-col gap-2.5'}`}>
        {options.map(opt => {
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`
                flex items-start gap-3 p-3 rounded-input border transition-colors cursor-pointer select-none min-h-[44px]
                ${
                  isSelected
                    ? 'border-brand-magenta bg-brand-magenta/5 text-brand-darkText'
                    : 'border-brand-border bg-white hover:bg-brand-lightGray/40 text-brand-charcoal'
                }
                ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isSelected}
                disabled={opt.disabled}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
                  ${isSelected ? 'border-brand-magenta' : 'border-brand-charcoal/40'}
                `}
              >
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-magenta" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{opt.label}</span>
                {opt.description && <span className="text-xs text-brand-charcoal/70">{opt.description}</span>}
              </div>
            </label>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </fieldset>
  );
};
