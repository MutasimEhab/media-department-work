import React, { useId } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

export interface TimePickerProps {
  label?: string;
  helperText?: string;
  error?: string;
  value?: string; // e.g. "09:30 AM" or "09:30 ص"
  onChange?: (val: string) => void;
  disabled?: boolean;
  requiredIndicator?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  helperText,
  error,
  value = '09:00 AM',
  onChange,
  disabled,
  requiredIndicator,
}) => {
  const generatedId = useId();

  // Parse value
  const parts = value.split(' ');
  const timePart = parts[0] || '09:00';
  const periodPart = parts[1]?.toUpperCase() === 'AM' ? 'ص' : parts[1]?.toUpperCase() === 'PM' ? 'م' : parts[1] || 'ص';
  const [hours, minutes] = timePart.split(':');

  const handleHourChange = (newHour: string) => {
    onChange?.(`${newHour}:${minutes || '00'} ${periodPart}`);
  };

  const handleMinuteChange = (newMin: string) => {
    onChange?.(`${hours || '09'}:${newMin} ${periodPart}`);
  };

  const handlePeriodChange = (newPeriod: string) => {
    onChange?.(`${hours || '09'}:${minutes || '00'} ${newPeriod}`);
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-subheading text-brand-darkText">
          {label}
          {requiredIndicator && <span className="text-brand-magenta ms-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div
        className={`
          flex items-center gap-2 rounded-input border bg-white px-3 py-1.5 min-h-[44px]
          ${error ? 'border-red-500' : 'border-brand-border'}
          ${disabled ? 'bg-brand-lightGray/50 cursor-not-allowed opacity-50' : ''}
        `}
      >
        <Clock className="w-4 h-4 text-brand-charcoal/70 shrink-0" />

        <div className="flex items-center gap-1.5 font-mono text-sm" dir="ltr">
          {/* Hours */}
          <select
            disabled={disabled}
            value={hours || '09'}
            onChange={e => handleHourChange(e.target.value)}
            className="bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-plum rounded p-1"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const h = (i + 1).toString().padStart(2, '0');
              return <option key={h} value={h}>{h}</option>;
            })}
          </select>

          <span>:</span>

          {/* Minutes */}
          <select
            disabled={disabled}
            value={minutes || '00'}
            onChange={e => handleMinuteChange(e.target.value)}
            className="bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-plum rounded p-1"
          >
            {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Period */}
          <select
            disabled={disabled}
            value={periodPart}
            onChange={e => handlePeriodChange(e.target.value)}
            className="bg-transparent font-sans font-medium focus:outline-none focus:ring-1 focus:ring-brand-plum rounded p-1 ms-1 text-xs"
          >
            <option value="ص">صباحًا</option>
            <option value="م">مساءً</option>
          </select>
        </div>
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
