import React from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DemoBanner: React.FC = () => {
  const { t, frozenDate } = useApp();

  return (
    <div className="flex items-center justify-between gap-3 bg-brand-charcoal px-4 py-2 text-xs text-white shadow-inner sm:px-6">
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 bg-brand-magenta text-white font-mono text-[10px] font-bold rounded uppercase tracking-wider">
          DEMO
        </span>
        <span className="hidden font-medium text-gray-200 sm:inline">{t.app.demoBanner}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[10px] text-gray-300 sm:text-[11px] font-mono" dir="ltr">
        <Calendar className="w-3.5 h-3.5 text-brand-lime" />
        <span>FROZEN DEMO DATE: {frozenDate}</span>
      </div>
    </div>
  );
};
