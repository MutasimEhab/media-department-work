import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { WorkDateException } from '../../types';
import { EnglishDateInput } from '../../components/ui/EnglishDateInput';

interface ExceptionRow extends WorkDateException {
  employeeNameAr: string;
  granterNameAr: string;
}

interface EmployeeOption {
  id: string;
  arabicName: string;
}

interface WorkDateExceptionsProps {
  mine?: boolean;
}

export const WorkDateExceptions: React.FC<WorkDateExceptionsProps> = ({ mine = false }) => {
  const { canAccess } = useApp();
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [reason, setReason] = useState('');
  const [grantOpen, setGrantOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const response = await fetch('/api/work-date-exceptions', { credentials: 'include' });
      const payload = await response.json() as { exceptions?: ExceptionRow[]; employees?: EmployeeOption[]; message?: string };
      if (!response.ok) throw new Error(payload.message || 'تعذر تحميل الاستثناءات.');
      setExceptions(payload.exceptions || []);
      setEmployees(payload.employees || []);
      setTarget(current => current || payload.employees?.[0]?.id || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    }
  };

  useEffect(() => { void load(); }, []);

  const grantException = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/work-date-exceptions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: target, workDate: date, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : '', reason }),
      });
      const payload = await response.json() as { exception?: ExceptionRow; message?: string };
      if (!response.ok || !payload.exception) throw new Error(payload.message || 'تعذر حفظ الاستثناء.');
      setExceptions(current => [payload.exception!, ...current]);
      setGrantOpen(false);
      setDate('');
      setExpiresAt('');
      setReason('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally {
      setBusy(false);
    }
  };

  const revokeException = async (exception: ExceptionRow) => {
    if (!window.confirm(`إلغاء استثناء ${exception.dates[0]} للموظف ${exception.employeeNameAr}؟`)) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/work-date-exceptions/${encodeURIComponent(exception.id)}`, {
        method: 'DELETE', credentials: 'include',
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'تعذر إلغاء الاستثناء.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally {
      setBusy(false);
    }
  };

  const active = exceptions.filter(exception => !exception.revokedAt && (!exception.expiresAt || new Date(exception.expiresAt).getTime() > Date.now()));
  const visible = active;
  const mayManage = !mine && canAccess('manage_work_exceptions');
  const minExpiryDateTime = new Date(Date.now() + 60_000 - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

  return <main className="space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3 app-page-heading">
      <div>
        <h1 className="text-2xl font-bold">{mine ? 'استثناءات تواريخ عملي' : 'استثناءات تواريخ العمل'}</h1>
        <p>{mine ? 'التواريخ السابقة المعتمدة لحسابك.' : 'تُمنح الاستثناءات لموظفي القسم فقط، ويسجل النظام جهة المنح وسببه.'}</p>
      </div>
      {mayManage && <Button onClick={() => { setError(''); setGrantOpen(true); }}>منح استثناء</Button>}
    </header>

    {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {!error && !visible.length && <Card>{mine ? 'لا توجد استثناءات سارية لحسابك.' : 'لا توجد استثناءات سارية.'}</Card>}
    {visible.map(exception => <Card key={exception.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          {!mine && <p className="font-bold">{exception.employeeNameAr}</p>}
          <p><span className="font-semibold">التاريخ:</span> <time dir="ltr">{exception.dates[0]}</time></p>
          <p><span className="font-semibold">السبب:</span> {exception.reason}</p>
          {exception.expiresAt && <p><span className="font-semibold">آخر موعد لإدخال العمل:</span> <time dir="ltr">{new Date(exception.expiresAt).toLocaleString('ar-PS', { timeZone: 'Asia/Gaza', dateStyle: 'medium', timeStyle: 'short', hour12: true, numberingSystem: 'latn' })}</time></p>}
          <p className="text-sm text-brand-charcoal/70">منح بواسطة {exception.granterNameAr} · <time dir="ltr">{new Date(exception.createdAt).toLocaleString('ar-PS', { timeZone: 'Asia/Gaza', dateStyle: 'medium', timeStyle: 'short', hour12: true, numberingSystem: 'latn' })}</time></p>
        </div>
        {mayManage && <Button size="sm" variant="outline" disabled={busy} onClick={() => void revokeException(exception)}>إلغاء الاستثناء</Button>}
      </div>
    </Card>)}

    {grantOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setGrantOpen(false); }}>
      <section className="w-full max-w-lg space-y-3 rounded-xl bg-white p-5 text-brand-darkText shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="exception-title">
        <h2 id="exception-title" className="text-xl font-bold">منح استثناء تاريخ عمل</h2>
        <label className="block text-sm">الموظف
          <select className="mt-1 min-h-11 w-full rounded-input border border-brand-border p-2" value={target} onChange={event => setTarget(event.target.value)}>
            {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.arabicName}</option>)}
          </select>
        </label>
        <label className="block text-sm">تاريخ العمل الفائت
          <EnglishDateInput className="mt-1" value={date} onChange={setDate} ariaLabel="تاريخ الاستثناء" />
        </label>
        <label className="block text-sm">آخر موعد لإدخال العمل السابق
          <EnglishDateInput type="datetime-local" className="mt-1" value={expiresAt} onChange={setExpiresAt} ariaLabel="آخر موعد لإدخال العمل" min={minExpiryDateTime} />
          <span className="mt-1 block text-xs text-brand-charcoal/70">يجب أن يكون الموعد مستقبلياً. سيصل إشعار للموظف بتاريخ العمل والموعد النهائي.</span>
        </label>
        <label className="block text-sm">سبب الاستثناء
          <textarea className="mt-1 w-full rounded-input border border-brand-border p-2" rows={3} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <Button disabled={busy || !target || !date.trim() || !expiresAt || !reason.trim()} onClick={() => void grantException()}>{busy ? 'جارٍ الحفظ…' : 'تأكيد المنح'}</Button>
          <Button variant="outline" disabled={busy} onClick={() => setGrantOpen(false)}>إلغاء</Button>
        </div>
      </section>
    </div>}
  </main>;
};
