import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { WorkLog } from '../../types';
import { downloadWorkReportPdf, ReportEmployee } from '../../utils/workReportPdf';

export const RecordsExport: React.FC = () => {
  const { canAccess } = useApp();
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employees, setEmployees] = useState<ReportEmployee[]>([]);

  useEffect(() => {
    fetch('/api/users/report-employees', { credentials: 'include' })
      .then(async response => response.ok ? await response.json() as { employees?: ReportEmployee[] } : null)
      .then(payload => { if (payload?.employees) setEmployees(payload.employees); })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/work-logs/department', { credentials: 'include' })
      .then(async response => {
        const payload = await response.json() as { workLogs?: WorkLog[]; message?: string };
        if (!response.ok) throw new Error(payload.message || 'تعذر تحميل السجلات.');
        return payload;
      })
      .then(payload => { if (!cancelled) setWorkLogs(payload.workLogs || []); })
      .catch(cause => { if (!cancelled) setLoadError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => workLogs.filter(item =>
    (!employeeId || item.userId === employeeId)
    && (!query || `${item.userNameAr} ${item.activityAr} ${item.area || ''}`.includes(query))
    && (!from || item.date >= from) && (!to || item.date <= to)),
  [workLogs, query, from, to, employeeId]);

  if (!canAccess('view_department_reports')) return <Card>لا تملك صلاحية تصدير سجلات الدائرة.</Card>;

  const exportCsv = () => {
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const lines = [['الموظف', 'التاريخ', 'الوقت', 'طبيعة العمل', 'التفاصيل', 'المنطقة', 'المكان'].map(quote).join(','),
      ...rows.map(row => [row.userNameAr, row.date, row.time, row.location === 'OFFICE' ? 'مكتبي' : 'ميداني', row.activityAr, row.area || '', row.location === 'OFFICE' ? 'مكتبي' : 'ميداني'].map(quote).join(','))];
    const url = URL.createObjectURL(new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'كشف-سجلات-العمل.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    setPdfBusy(true);
    setLoadError('');
    try {
      await downloadWorkReportPdf(rows, employees, from, to, employeeId);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : 'تعذر إنشاء ملف PDF.');
    } finally {
      setPdfBusy(false);
    }
  };

  const arabicDate = (value: string) => new Intl.DateTimeFormat('ar-PS', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'UTC', calendar: 'gregory', numberingSystem: 'latn',
  }).format(new Date(`${value}T12:00:00Z`));

  return <main className="space-y-5 printable-report">
    <header className="app-page-heading"><h1 className="mt-2 text-2xl font-bold">الكشوفات والتصدير</h1><p>تصفية سجلات العمل المحفوظة ثم تنزيل كشف PDF مباشر بالترويسة الرسمية.</p></header>
    {loadError && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{loadError}</p>}
    <Card title="فلترة سجل الأعمال">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">الموظف<select className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={employeeId} onChange={event => setEmployeeId(event.target.value)}><option value="">جميع الموظفين</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.arabicName}</option>)}</select></label>
        <label className="text-sm">من تاريخ<input type="date" className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={from} onChange={event => setFrom(event.target.value)} /></label>
        <label className="text-sm">إلى تاريخ<input type="date" className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={to} onChange={event => setTo(event.target.value)} /></label>
        <label className="text-sm sm:col-span-2">بحث بالموظف أو التفاصيل<input className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={query} onChange={event => setQuery(event.target.value)} /></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><span className="me-auto text-sm">أعمال مطابقة: {rows.length}</span><Button variant="outline" onClick={() => { setFrom(''); setTo(''); setQuery(''); setEmployeeId(''); }}>مسح الفلاتر</Button><Button disabled={loading || !!loadError} onClick={exportCsv}>تصدير Excel / CSV</Button><Button variant="outline" disabled={loading || pdfBusy || !!loadError || !rows.length} isLoading={pdfBusy} onClick={() => void exportPdf()}>تنزيل PDF بالترويسة</Button></div>
    </Card>
    <Card title="نتائج الكشف"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-brand-magenta text-white"><tr><th className="p-3">#</th><th className="p-3">الموظف</th><th className="p-3">التاريخ</th><th className="p-3">طبيعة العمل</th><th className="p-3">التفاصيل</th><th className="p-3">المنطقة</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-5 text-center">جارٍ تحميل السجلات…</td></tr> : rows.length ? rows.map((row, index) => <tr key={row.id} className="border-t border-brand-border"><td className="p-3 text-center" dir="ltr">{index + 1}</td><td className="p-3">{row.userNameAr}</td><td className="p-3">{arabicDate(row.date)}</td><td className="p-3">{row.location === 'OFFICE' ? 'مكتبي' : 'ميداني'}</td><td className="max-w-sm p-3">{row.activityAr}</td><td className="p-3">{row.area || '—'}</td></tr>) : <tr><td colSpan={6} className="p-5 text-center">لا توجد سجلات مطابقة.</td></tr>}</tbody></table></div></Card>
  </main>;
};
