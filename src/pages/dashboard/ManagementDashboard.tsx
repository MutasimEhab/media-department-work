import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ClipboardList, Clock3, FileText, FolderKanban, MapPin, Megaphone } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useApp } from '../../context/AppContext';
import { WorkLog } from '../../types';

type MonthlyData = { workLogs: WorkLog[]; summary: { assignments: Record<string, { total: number; onTime: number }> } };
const todayInGaza = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Gaza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export const ManagementDashboard: React.FC = () => {
  const { currentUser, tasks, projects, circulars, users } = useApp();
  const [month, setMonth] = useState(todayInGaza().slice(0, 7));
  const [monthly, setMonthly] = useState<MonthlyData | null>(null);
  const [error, setError] = useState('');
  const today = todayInGaza();
  useEffect(() => {
    let cancelled = false;
    setError('');
    fetch(`/api/reports/monthly?scope=department&month=${encodeURIComponent(month)}`, { credentials: 'include' })
      .then(async response => { const payload = await response.json() as MonthlyData & { message?: string }; if (!response.ok) throw new Error(payload.message || 'تعذر تحميل ملخص الشهر.'); return payload; })
      .then(payload => { if (!cancelled) setMonthly(payload); })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.'); });
    return () => { cancelled = true; };
  }, [month]);
  const visibleTasks = useMemo(() => tasks.filter(task => !task.isDraft), [tasks]);
  const assigned = visibleTasks.flatMap(task => task.recipients.map(recipient => ({ task, recipient })));
  const pending = assigned.filter(item => item.recipient.status === 'SUBMITTED');
  const overdue = assigned.filter(item => item.task.isOverdue);
  const open = assigned.filter(item => ['RECEIVED', 'IN_PROGRESS'].includes(item.recipient.status));
  const unacknowledged = circulars.filter(item => !item.isDraft).flatMap(item => item.recipients.filter(recipient => !recipient.hasAcknowledged));
  const todayLogs = monthly?.workLogs.filter(log => log.date === today) ?? [];
  const cards = [
    { label: 'تكليفات قيد العمل', value: open.length, href: '/app/assignments', icon: <ClipboardList/> },
    { label: 'تكليفات متأخرة', value: overdue.length, href: '/app/assignments', icon: <AlertTriangle/> },
    { label: 'بانتظار المراجعة', value: pending.length, href: '/app/assignments', icon: <Clock3/> },
    { label: 'إقرارات تعاميم معلقة', value: unacknowledged.length, href: '/app/circulars', icon: <FileText/> },
  ];
  const statuses = [['RECEIVED', 'تم الاستلام'], ['IN_PROGRESS', 'قيد التنفيذ'], ['SUBMITTED', 'تم التسليم'], ['APPROVED', 'معتمد']] as const;
  const recent = [...visibleTasks.map(task => ({ id: task.id, label: task.titleAr, stamp: task.createdAt, icon: <ClipboardList size={17}/> })), ...circulars.filter(item => !item.isDraft).map(item => ({ id: item.id, label: item.titleAr, stamp: item.issuedAt, icon: <Megaphone size={17}/> }))].slice(0, 6);

  return <main className="space-y-5 min-w-0">
    <header className="relative overflow-hidden rounded-card border border-brand-border bg-white p-5 shadow-subtle sm:p-6"><div className="absolute inset-y-0 start-0 w-1.5 bg-brand-magenta" aria-hidden="true"/><span className="inline-flex rounded-full bg-brand-plum/10 px-3 py-1 text-[11px] font-subheading text-brand-plum">{currentUser.jobTitleAr}</span><h1 className="mt-3 text-2xl font-bold sm:text-3xl">مرحباً، {currentUser.arabicName}</h1><p className="mt-1 text-sm text-brand-charcoal">ملخص مباشر من بيانات الدائرة المحفوظة في النظام.</p><label className="mt-4 inline-flex flex-col gap-1 text-xs font-subheading text-brand-charcoal">الشهر<input type="month" dir="ltr" value={month} onChange={event => setMonth(event.target.value)} className="min-h-11 rounded-input border border-brand-border bg-white px-3 text-sm text-brand-darkText"/></label></header>
    {error && <Card><p role="alert">{error}</p></Card>}
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(item => <Link key={item.label} to={item.href}><Card className="h-full hover:border-brand-plum"><div className="flex justify-between gap-3"><span className="text-sm">{item.label}</span><span className="text-brand-plum">{item.icon}</span></div><strong className="mt-4 block text-3xl" dir="ltr">{item.value}</strong><span className="text-xs">فتح القائمة</span></Card></Link>)}</section>
    <section className="grid gap-4 lg:grid-cols-3"><Card title="التكليفات حسب الحالة"><div className="space-y-4">{statuses.map(([status, label]) => { const count = assigned.filter(item => item.recipient.status === status).length; return <div key={status}><div className="flex justify-between text-sm"><span>{label}</span><b dir="ltr">{count}</b></div><div className="mt-1 h-2 rounded bg-brand-lightGray"><div className="h-2 rounded bg-brand-plum" style={{ width: `${assigned.length ? count / assigned.length * 100 : 0}%` }}/></div></div>; })}</div></Card><Card title={`العمل المسجل اليوم · ${today}`}><div className="flex gap-4 text-center"><div className="flex-1 rounded bg-brand-lightGray p-4"><MapPin className="mx-auto"/><b className="block text-2xl" dir="ltr">{todayLogs.filter(log => log.location === 'OFFICE').length}</b>مكتبي</div><div className="flex-1 rounded bg-brand-lightGray p-4"><MapPin className="mx-auto"/><b className="block text-2xl" dir="ltr">{todayLogs.filter(log => log.location === 'FIELD').length}</b>ميداني</div></div><p className="mt-3 text-xs">{monthly ? `سجلات هذا الشهر: ${monthly.workLogs.length}` : 'جارٍ تحميل السجلات…'}</p></Card><Card title="المشاريع النشطة"><b className="text-3xl" dir="ltr">{projects.filter(project => project.status === 'IN_PROGRESS').length}</b><Link className="mt-3 block text-sm text-brand-plum underline" to="/app/projects">عرض المشاريع</Link><p className="mt-2 text-xs">عدد الحسابات النشطة في النطاق المتاح: {users.filter(user => user.isActive).length}</p></Card></section>
    <section className="grid gap-4 lg:grid-cols-2"><Card title="سجلات اليوم"><div className="space-y-3">{todayLogs.length ? todayLogs.map(log => <div key={log.id} className="border-b pb-3"><div className="flex justify-between gap-3"><b>{log.userNameAr}</b><span dir="ltr">{log.time}</span></div><p className="mt-1 text-sm">{log.activityAr}</p><span className="text-xs">{log.location === 'OFFICE' ? 'مكتبي' : 'ميداني'} · {log.area}</span></div>) : <p>{monthly ? 'لا توجد سجلات عمل اليوم.' : 'جارٍ تحميل السجلات…'}</p>}</div></Card><Card title="بانتظار الاعتماد"><div className="space-y-3">{pending.length ? pending.map(({ task, recipient }) => <div key={`${task.id}-${recipient.userId}`} className="rounded bg-brand-lightGray p-3"><b>{task.titleAr}</b><p className="mt-1 text-sm">{recipient.userNameAr} · بانتظار المراجعة</p></div>) : <p>لا توجد تسليمات بانتظار المراجعة.</p>}</div></Card></section>
    <section className="grid gap-4 lg:grid-cols-2"><Card title="النشاط الأخير"><div className="space-y-3">{recent.length ? recent.map(item => <div className="flex items-start gap-3" key={item.id}><span className="text-brand-plum">{item.icon}</span><div><p>{item.label}</p><small dir="ltr">{item.stamp}</small></div></div>) : <p>لا يوجد نشاط مسجل بعد.</p>}</div></Card><Card title="إقرارات التعاميم"><div className="space-y-3">{circulars.filter(item => !item.isDraft).flatMap(item => item.recipients.filter(recipient => recipient.hasAcknowledged).map(recipient => <p key={`${item.id}-${recipient.userId}`} className="text-sm"><CheckCircle2 className="me-2 inline text-brand-plum"/>{users.find(user => user.id === recipient.userId)?.arabicName} · {item.titleAr} · {recipient.acknowledgedAt}</p>))}</div></Card></section>
  </main>;
};
