import React from 'react';
import { Check } from 'lucide-react';
import { TaskRecipientStatus } from '../../types';

const stages = [
  { key: 'RECEIVED', ar: 'تم الإسناد', en: 'Assigned', value: 25 },
  { key: 'IN_PROGRESS', ar: 'قيد التنفيذ', en: 'In progress', value: 50 },
  { key: 'SUBMITTED', ar: 'تم التسليم', en: 'Submitted', value: 75 },
  { key: 'APPROVED', ar: 'تم الاعتماد', en: 'Approved', value: 100 },
] as const;

const progressForStatus: Record<TaskRecipientStatus, number> = {
  RECEIVED: 25,
  IN_PROGRESS: 50,
  SUBMITTED: 75,
  APPROVED: 100,
  RETURNED_FOR_REVISION: 50,
};

interface AssignmentProgressProps {
  statuses: TaskRecipientStatus[];
  language?: 'ar' | 'en';
  compact?: boolean;
}

export const AssignmentProgress: React.FC<AssignmentProgressProps> = ({ statuses, language = 'ar', compact = false }) => {
  const percent = statuses.length
    ? Math.round(statuses.reduce((sum, status) => sum + progressForStatus[status], 0) / statuses.length)
    : 0;
  const returnedCount = statuses.filter(status => status === 'RETURNED_FOR_REVISION').length;
  const tx = (arabic: string, english: string) => language === 'ar' ? arabic : english;

  return <section className={compact ? 'space-y-2' : 'space-y-3'} aria-label={tx('التقدم الإجمالي للتكليف', 'Overall assignment progress')}>
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold">{tx('التقدم الإجمالي', 'Overall progress')}</span>
      <span className="font-bold tabular-nums text-brand-plum" dir="ltr">{percent}%</span>
    </div>
    <div className="relative pt-1">
      <div
        className="h-2.5 overflow-hidden rounded-full bg-brand-lightGray"
        role="progressbar"
        aria-label={tx('نسبة إنجاز التكليف', 'Assignment completion')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="h-full rounded-full bg-gradient-to-l from-brand-plum to-brand-magenta transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between" aria-hidden="true">
        {stages.map(stage => <span
          key={stage.key}
          className={`grid h-4 w-4 place-items-center rounded-full border-2 transition-colors ${percent >= stage.value ? 'border-brand-plum bg-brand-plum text-white' : 'border-brand-border bg-white text-transparent'}`}
        >{percent >= stage.value && <Check size={10} strokeWidth={3} />}</span>)}
      </div>
    </div>
    {!compact && <div className="grid grid-cols-4 gap-1 text-center text-[10px] leading-tight sm:text-xs">
      {stages.map(stage => <span key={stage.key} className={percent >= stage.value ? 'font-semibold text-brand-plum' : 'text-brand-charcoal'}>{tx(stage.ar, stage.en)}</span>)}
    </div>}
    {returnedCount > 0 && <p className="text-xs font-semibold text-amber-700">{tx(`يحتاج ${returnedCount} من المستلمين إلى تعديل التسليم`, `${returnedCount} submission${returnedCount === 1 ? '' : 's'} need revision`)}</p>}
  </section>;
};
