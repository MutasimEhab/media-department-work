import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { downloadWorkReportPdf, ReportEmployee } from '../../utils/workReportPdf';

type ReportLog = { id: string; userId: string; userNameAr: string; date: string; time: string; activityAr: string; location: 'OFFICE' | 'FIELD'; area: string };
type AssignmentSummary = Record<string, { total: number; onTime: number }>;
type ReportData = { workLogs: ReportLog[]; summary: { workLogCount: number; officeCount: number; fieldCount: number; assignments: AssignmentSummary } };
type Employee = ReportEmployee;

const STATUS_LABELS: Record<string, string> = { assigned: 'مسند', in_progress: 'قيد التنفيذ', submitted: 'مُسلّم', approved: 'معتمد', returned: 'مُعاد للتعديل' };

export const Reports: React.FC<{ department?: boolean }> = ({ department = false }) => {
  const { currentUser, canAccess, institutionLogo } = useApp();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [person, setPerson] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [data, setData] = useState<ReportData | null>(null);
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState('');
  const allowed = department ? canAccess('view_department_reports') : canAccess('view_own_report');

  useEffect(() => {
    if (!department) return;
    fetch('/api/users/report-employees', { credentials: 'include' })
      .then(async response => response.ok ? await response.json() as { employees?: Employee[] } : null)
      .then(payload => { if (payload?.employees) setEmployees(payload.employees); })
      .catch(() => undefined);
  }, [department]);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    setBusy(true);
    setError('');
    const query = new URLSearchParams({ month, scope: department ? 'department' : 'own' });
    if (person) query.set('userId', person);
    fetch(`/api/reports/monthly?${query}`, { credentials: 'include' })
      .then(async response => {
        const payload = await response.json() as ReportData & { message?: string };
        if (!response.ok) throw new Error(payload.message || 'تعذر تحميل التقرير.');
        return payload;
      })
      .then(payload => { if (!cancelled) setData(payload); })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.'); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [allowed, department, month, person]);

  const rows = useMemo(() => data?.workLogs ?? [], [data]);
  if (!allowed) return <Card>لا تملك صلاحية عرض هذا التقرير.</Card>;
  const exportCsv = () => {
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const lines = [['الموظف', 'التاريخ', 'الوقت', 'التفاصيل', 'المنطقة', 'مكان العمل'].map(quote).join(','), ...rows.map(row => [row.userNameAr, row.date, row.time, row.activityAr, row.area, row.location === 'OFFICE' ? 'مكتبي' : 'ميداني'].map(quote).join(','))];
    const url = URL.createObjectURL(new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `تقرير-الأعمال-${month}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    if (!data) return;
    setPdfBusy(true);
    setError('');
    try {
      const [year, monthNumber] = month.split('-').map(Number);
      const from = `${month}-01`;
      const to = new Date(Date.UTC(year!, monthNumber!, 0)).toISOString().slice(0, 10);
      const reportEmployees = department ? employees : [{
        id: currentUser.id, arabicName: currentUser.arabicName,
        employeeNumber: currentUser.employeeNumber, jobTitleAr: currentUser.jobTitleAr,
      }];
      await downloadWorkReportPdf(data.workLogs, reportEmployees, from, to, person || (!department ? currentUser.id : ''), institutionLogo);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر إنشاء ملف PDF.');
    } finally {
      setPdfBusy(false);
    }
  };

  return <main className="space-y-5 printable-report">
    <header className="app-page-heading"><span className="text-xs font-subheading text-brand-plum">تقارير محفوظة في قاعدة البيانات</span><h1 className="mt-2 text-2xl font-bold">{department ? 'تقارير الدائرة' : 'تقاريري الشهرية'}</h1><p>{department ? 'عرض فعلي لسجلات الموظفين والتكليفات ضمن نطاق الصلاحية.' : `سجلات العمل والتكليفات المسندة إلى ${currentUser.arabicName}.`}</p></header>
    <Card><div className="no-print flex flex-wrap items-end gap-3"><label className="text-sm">الشهر<input type="month" dir="ltr" className="mt-1 block min-h-11 rounded-input border border-brand-border bg-transparent px-3" value={month} onChange={event => setMonth(event.target.value)} /></label>{department && <label className="text-sm">الموظف<select className="mt-1 block min-h-11 rounded-input border border-brand-border bg-transparent px-3" value={person} onChange={event => setPerson(event.target.value)}><option value="">جميع الموظفين</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.arabicName}</option>)}</select></label>}<Button variant="outline" disabled={busy || !data} onClick={exportCsv}>تنزيل CSV</Button><Button variant="outline" disabled={busy || pdfBusy || !data || !rows.length} isLoading={pdfBusy} onClick={() => void exportPdf()}>تنزيل PDF بالترويسة</Button></div></Card>
    {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {busy && <Card>جارٍ تحميل بيانات التقرير المحفوظة…</Card>}
    {!busy && data && <>
      <div className="grid gap-3 sm:grid-cols-3"><Card title="سجلات العمل"><p className="text-3xl font-bold" dir="ltr">{data.summary.workLogCount}</p></Card><Card title="عمل مكتبي"><p className="text-3xl font-bold" dir="ltr">{data.summary.officeCount}</p></Card><Card title="عمل ميداني"><p className="text-3xl font-bold" dir="ltr">{data.summary.fieldCount}</p></Card></div>
      {department && <Card title="حالة التكليفات المسندة في الشهر"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Object.entries(data.summary.assignments).map(([status, summary]) => <div key={status} className="rounded-lg border border-brand-border p-3"><p>{STATUS_LABELS[status] ?? status}</p><p className="mt-2 text-xl font-bold" dir="ltr">{summary.total}</p><p className="text-xs">منها {summary.onTime} مسلمة ضمن الموعد أو قبله</p></div>)}{!Object.keys(data.summary.assignments).length && <p>لا توجد تكليفات مسندة في الشهر المحدد.</p>}</div></Card>}
      <Card title={`سجل العمل · ${month}`}><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="bg-brand-magenta text-white"><tr><th className="p-3">الموظف</th><th className="p-3">التاريخ</th><th className="p-3">الوقت</th><th className="p-3">التفاصيل</th><th className="p-3">المنطقة</th><th className="p-3">المكان</th></tr></thead><tbody>{rows.length ? rows.map(row => <tr key={row.id} className="border-t border-brand-border"><td className="p-3">{row.userNameAr}</td><td className="p-3" dir="ltr">{row.date}</td><td className="p-3" dir="ltr">{row.time}</td><td className="p-3">{row.activityAr}</td><td className="p-3">{row.area}</td><td className="p-3">{row.location === 'OFFICE' ? 'مكتبي' : 'ميداني'}</td></tr>) : <tr><td colSpan={6} className="p-5 text-center">لا توجد سجلات لهذا الشهر.</td></tr>}</tbody></table></div></Card>
    </>}
  </main>;
};
