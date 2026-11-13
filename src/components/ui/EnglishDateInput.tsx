import React, { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

type PickerType = 'date' | 'month' | 'datetime-local';
interface EnglishDateInputProps {
  value: string;
  onChange: (value: string) => void;
  type?: PickerType;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  className?: string;
  id?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  onChangeEvent?: React.ChangeEventHandler<HTMLInputElement>;
}

/** Shows a stable Latin-digit date while retaining the browser's native calendar picker. */
export const EnglishDateInput: React.FC<EnglishDateInputProps> = ({
  value, onChange, type = 'date', min, max, disabled, required, ariaLabel, className = '', id, ariaInvalid, ariaDescribedBy, onChangeEvent,
}) => {
  const picker = useRef<HTMLInputElement>(null);
  const placeholder = type === 'month' ? 'YYYY-MM' : type === 'datetime-local' ? 'YYYY-MM-DDTHH:mm' : 'YYYY-MM-DD';

  return <div className="relative" dir="ltr">
    <input
      type="text" lang="en-US" inputMode="numeric" autoComplete="off"
      id={id} value={value} placeholder={placeholder} aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      pattern={type === 'month' ? '\\d{4}-\\d{2}' : type === 'datetime-local' ? '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}' : '\\d{4}-\\d{2}-\\d{2}'}
      required={required} disabled={disabled}
      onChange={event => { onChange(event.target.value); onChangeEvent?.(event); }}
      className={`min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3 pe-11 text-left text-sm tracking-wide text-brand-darkText placeholder:text-brand-charcoal/50 focus:border-brand-plum focus:outline-none focus:ring-2 focus:ring-brand-plum/20 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
    <button type="button" disabled={disabled} aria-label={ariaLabel ? `اختيار ${ariaLabel} من التقويم` : 'اختيار التاريخ من التقويم'}
      onClick={() => { const input = picker.current; if (!input) return; if (typeof input.showPicker === 'function') input.showPicker(); else input.click(); }}
      className="absolute inset-y-0 end-0 z-10 flex w-10 items-center justify-center text-brand-charcoal/70 hover:text-brand-plum disabled:cursor-not-allowed">
      <CalendarDays size={17} aria-hidden="true" />
    </button>
    <input ref={picker} type={type} lang="en-US" min={min} max={max} value={value} tabIndex={-1} aria-hidden="true"
      onChange={event => { onChange(event.target.value); onChangeEvent?.(event); }}
      className="pointer-events-none absolute end-1 top-1/2 h-px w-px -translate-y-1/2 opacity-0" />
  </div>;
};
