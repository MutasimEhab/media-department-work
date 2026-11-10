import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { useApp } from '../../context/AppContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { User, WorkLog } from '../../types';
import { downloadWorkReportPdf } from '../../utils/workReportPdf';

interface DatabaseUsersResponse { users?: User[]; message?: string }
interface WorkLogsResponse { workLogs?: WorkLog[]; message?: string }

export const ManagementWorkLogs: React.FC = () => {
  const { language, today, institutionLogo } = useApp();
  const tx = (arabic: string, english: string) => language === 'ar' ? arabic : english;
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [employee, setEmployee] = useState('');
  const [month, setMonth] = useState('');
  const [date, setDate] = useState('');
  const [mode, setMode] = useState('');
  const [detail, setDetail] = useState<WorkLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState('');
  useEscapeKey(Boolean(detail), () => setDetail(null));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch('/api/work-logs/department', { credentials: 'include' }),
      fetch('/api/users', { credentials: 'include' }),
    ]).then(async ([logsResponse, usersResponse]) => {
      const [logsPayload, usersPayload] = await Promise.all([
        logsResponse.json() as Promise<WorkLogsResponse>,
        usersResponse.json() as Promise<DatabaseUsersResponse>,
      ]);
      if (!logsResponse.ok) throw new Error(logsPayload.message || 'تعذر تحميل سجلات الدائرة.');
      if (!usersResponse.ok) throw new Error(usersPayload.message || 'تعذر تحميل قائمة الموظفين.');
      if (cancelled) return;
      setWorkLogs(logsPayload.workLogs || []);
      setUsers((usersPayload.users || []).filter(user => user.role === 'EMPLOYEE'));
      setError('');
    }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => workLogs.filter(log =>
    (!query || `${log.userNameAr} ${log.activityAr} ${log.area || ''}`.toLowerCase().includes(query.toLowerCase()))
    && (!employee || log.userId === employee)
    && (!month || log.date.startsWith(month))
    && (!date || log.date === date)
    && (!mode || log.location === mode)), [workLogs, query, employee, month, date, mode]);
  const todayLogs = workLogs.filter(log => log.date === today);
  const todayEmployees = new Set(todayLogs.map(log => log.userId));
  const nonSubmitters = users.filter(user => user.isActive && !todayEmployees.has(user.id));

  const exportPdf = async () => {
    setPdfBusy(true);
    setError('');
    try {
      let rangeFrom = date || (month ? `${month}-01` : '');
      let rangeTo = date;
      if (!date && month) {
        const [year, monthNumber] = month.split('-').map(Number);
        rangeTo = new Date(Date.UTC(year!, monthNumber!, 0)).toISOString().slice(0, 10);
      }
      await downloadWorkReportPdf(rows, users.map(user => ({
        id: user.id, arabicName: user.arabicName,
        employeeNumber: user.employeeNumber, jobTitleAr: user.jobTitleAr,
      })), rangeFrom, rangeTo, employee, institutionLogo);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر إنشاء ملف PDF.');
    } finally {
      setPdfBusy(false);
    }
  };

  const columns = [
    { key: 'person', header: tx('الموظف', 'Employee'), render: (log: WorkLog) => <span>{log.userNameAr} · {users.find(user => user.id === log.userId)?.jobTitleAr || ''}</span> },
    { key: 'date', header: tx('التاريخ', 'Date') },
    { key: 'activityAr', header: tx('تفاصيل العمل', 'Work details') },
    { key: 'area', header: tx('المنطقة', 'Area') },
    { key: 'location', header: tx('النمط', 'Mode'), render: (log: WorkLog) => log.location === 'OFFICE' ? tx('مكتب', 'Office') : tx('ميدان', 'Field') },
    { key: 'time', header: tx('وقت الإدخال', 'Entered at'), render: (log: WorkLog) => <span dir="ltr">{log.time}</span> },
    { key: 'detail', header: tx('التفاصيل', 'Details'), render: (log: WorkLog) => <Button size="sm" variant="outline" onClick={() => setDetail(log)}>{tx('عرض', 'View')}</Button> },
  ];

  return <main className="space-y-5">
    <header className="app-page-heading"><h1 className="mt-2 text-2xl font-bold">{tx('سجلات عمل الموظفين', 'Employee work logs')}</h1><p>{tx('سجلات الموظفين للقراءة فقط؛ يحتفظ كل موظف بحق تعديل سجلاته وحذفها.', 'Employee logs are read-only for management. Each employee manages their own records.')}</p></header>
    <div className="grid gap-3 sm:grid-cols-3"><Card><b>{tx('مسجلو اليوم', 'Today’s active loggers')}</b><p className="text-2xl">{todayEmployees.size}</p></Card><Card><b>{tx('لم يسجلوا اليوم', 'No submission today')}</b><p>{nonSubmitters.map(user => user.arabicName).join('، ') || tx('سجل الجميع.', 'Everyone has submitted.')}</p></Card><Card><Button variant="outline" disabled={!rows.length || pdfBusy} isLoading={pdfBusy} onClick={() => void exportPdf()}>{tx('تنزيل PDF بالترويسة', 'Download letterhead PDF')}</Button></Card></div>
    <Card><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <input className="rounded-input border border-brand-border p-2" placeholder={tx('بحث بالموظف أو التفاصيل أو المنطقة', 'Search employee, details or area')} value={query} onChange={event => setQuery(event.target.value)} />
      <select className="rounded-input border border-brand-border p-2" value={employee} onChange={event => setEmployee(event.target.value)}><option value="">{tx('كل الموظفين', 'All employees')}</option>{users.map(user => <option key={user.id} value={user.id}>{user.arabicName}</option>)}</select>
      <input type="month" dir="ltr" aria-label={tx('تصفية حسب الشهر','Filter by month')} className="rounded-input border border-brand-border p-2" value={month} onChange={event => setMonth(event.target.value)} />
      <input type="date" dir="ltr" className="rounded-input border border-brand-border p-2" value={date} onChange={event => setDate(event.target.value)} />
      <select className="rounded-input border border-brand-border p-2" value={mode} onChange={event => setMode(event.target.value)}><option value="">{tx('مكتب وميدان', 'Office and field')}</option><option value="OFFICE">{tx('مكتب', 'Office')}</option><option value="FIELD">{tx('ميدان', 'Field')}</option></select>
    </div></Card>
    {loading ? <Card>{tx('جارٍ تحميل السجلات…', 'Loading work logs…')}</Card> : error ? <Card><p role="alert" className="text-red-700">{error}</p></Card> : <>
      <p className="text-sm text-brand-charcoal/70">{tx('عدد السجلات المطابقة', 'Matching records')}: {rows.length}</p>
      <div className="hidden md:block"><Table columns={columns} data={rows} keyExtractor={log => log.id} emptyMessage={tx('لا توجد سجلات مطابقة.', 'No matching records.')} /></div>
      <div className="space-y-3 md:hidden">{rows.map(log => <Card key={log.id}><b>{log.userNameAr}</b><p dir="ltr">{log.date} · {log.time}</p><p>{log.activityAr} · {log.area || '—'}</p><Button size="sm" variant="outline" onClick={() => setDetail(log)}>{tx('التفاصيل', 'Details')}</Button></Card>)}</div>
    </>}
    {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDetail(null); }}><Card className="w-full max-w-lg" title={`${detail.userNameAr} · ${detail.date}`} action={<button onClick={() => setDetail(null)}>×</button>}><p dir="ltr">{detail.time}</p><p className="font-bold">{detail.activityAr}</p><p>{detail.area} · {detail.location === 'OFFICE' ? tx('مكتبي', 'Office') : tx('ميداني', 'Field')}</p>{detail.outputLink && <a className="underline text-brand-plum" href={detail.outputLink} target="_blank" rel="noreferrer">{tx('رابط المخرجات', 'Output link')}</a>}<p className="border-t border-brand-border pt-3 text-sm">{tx('عرض فقط؛ لا يمكن تعديل سجل موظف أو حذفه من هذه الشاشة.', 'Read-only: management cannot edit or delete an employee entry here.')}</p></Card></div>}
  </main>;
};
