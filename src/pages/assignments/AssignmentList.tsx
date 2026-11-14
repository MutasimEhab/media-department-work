import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpLeft, CalendarClock, ClipboardList, Search, UsersRound } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { EnglishDateInput } from '../../components/ui/EnglishDateInput';
import { AssignmentProgress } from './AssignmentProgress';
import { Task, TaskPriority } from '../../types';

type StatusFilter = 'ALL' | 'ACTIVE' | 'REVIEW' | 'OVERDUE' | 'COMPLETED' | 'DRAFTS' | 'RETURNED';
const statusLabels: Record<string, string> = {
  RECEIVED: 'تم الإسناد', IN_PROGRESS: 'قيد التنفيذ', SUBMITTED: 'بانتظار المراجعة',
  APPROVED: 'معتمد', RETURNED_FOR_REVISION: 'يحتاج تعديلاً',
};
const priorityLabels: Record<TaskPriority, string> = { LOW: 'منخفضة', MEDIUM: 'متوسطة', HIGH: 'عالية', URGENT: 'عاجلة' };

function taskCategory(task: Task): StatusFilter {
  if (task.isDraft) return 'DRAFTS';
  if (task.isOverdue) return 'OVERDUE';
  if (task.recipients.some(recipient => recipient.status === 'SUBMITTED')) return 'REVIEW';
  if (task.recipients.some(recipient => recipient.status === 'RETURNED_FOR_REVISION')) return 'RETURNED';
  if (task.recipients.length && task.recipients.every(recipient => recipient.status === 'APPROVED')) return 'COMPLETED';
  return 'ACTIVE';
}

const filterLabels: Record<StatusFilter, string> = {
  ALL: 'كل الحالات', ACTIVE: 'قيد التنفيذ', REVIEW: 'بانتظار المراجعة', OVERDUE: 'متأخرة',
  COMPLETED: 'مكتملة', DRAFTS: 'مسودات', RETURNED: 'تحتاج تعديلاً',
};

export const AssignmentList: React.FC = () => {
  const { currentUser, tasks, users, canAccess } = useApp();
  const manager = canAccess('manage_assignments');
  const reviewer = canAccess('review_assignments');
  const canViewAssignments = canAccess('view_assignments');
  const departmentScope = manager || reviewer;
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [query, setQuery] = useState('');
  const [employee, setEmployee] = useState('');
  const [priority, setPriority] = useState('');
  const [kind, setKind] = useState('');
  const [date, setDate] = useState('');

  const rows = useMemo(() => tasks.filter(task => {
    if (!departmentScope && !task.recipients.some(recipient => recipient.userId === currentUser.id)) return false;
    if (!manager && task.isDraft) return false;
    if (status !== 'ALL' && status !== taskCategory(task)) return false;
    if (query && !`${task.id} ${task.titleAr}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (employee && !task.recipients.some(recipient => recipient.userId === employee)) return false;
    if (priority && task.priority !== priority) return false;
    if (kind && !(task.types?.includes(kind as 'MATERIALS_REQUIRED' | 'SOCIAL_MEDIA') || task.type === kind)) return false;
    if (date && !task.deadline.startsWith(date)) return false;
    return true;
  }).sort((a, b) => Number(a.isDraft) - Number(b.isDraft) || a.deadline.localeCompare(b.deadline)),
  [tasks, departmentScope, manager, currentUser.id, status, query, employee, priority, kind, date]);

  const clearFilters = () => { setStatus('ALL'); setQuery(''); setEmployee(''); setPriority(''); setKind(''); setDate(''); };

  return <main className="space-y-5" dir="rtl">
    <header className="app-page-heading flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-brand-plum">متابعة موحّدة</p>
        <h1 className="mt-1 text-2xl font-bold">{departmentScope ? 'إدارة التكليفات' : 'تكليفاتي'}</h1>
        <p>كل تكليف وتفاصيله في بطاقة واحدة، مع شريط يوضح التقدم الإجمالي ويتجدد عند تسجيل أي خطوة.</p>
      </div>
      {manager && <Link to="/app/assignments/new"><Button leftIcon={<ClipboardList size={17} />}>إنشاء تكليف</Button></Link>}
    </header>

    <Card title="البحث والتصفية">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="relative text-xs font-semibold text-brand-charcoal">بحث عن تكليف
          <Search size={16} className="absolute end-3 top-9 text-brand-charcoal/60" />
          <input className="mt-1 min-h-11 w-full rounded-input border border-brand-border bg-white pe-9 ps-3 text-sm" placeholder="العنوان أو الرقم" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
        <label className="text-xs font-semibold text-brand-charcoal">الحالة
          <select className="mt-1 min-h-11 w-full rounded-input border border-brand-border bg-white p-2.5 text-sm" value={status} onChange={event => setStatus(event.target.value as StatusFilter)}>
            {(Object.entries(filterLabels) as [StatusFilter, string][]).filter(([value]) => manager || value !== 'DRAFTS').map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {departmentScope && <label className="text-xs font-semibold text-brand-charcoal">الموظف
          <span className="relative mt-1 block"><UsersRound size={16} className="absolute end-3 top-3 text-brand-charcoal/60" /><select className="min-h-11 w-full rounded-input border border-brand-border bg-white p-2.5 pe-9 text-sm" value={employee} onChange={event => setEmployee(event.target.value)}><option value="">كل الموظفين</option>{users.filter(user => user.role === 'EMPLOYEE').map(user => <option key={user.id} value={user.id}>{user.arabicName}</option>)}</select></span>
        </label>}
        <label className="text-xs font-semibold text-brand-charcoal">الأولوية
          <select className="mt-1 min-h-11 w-full rounded-input border border-brand-border bg-white p-2.5 text-sm" value={priority} onChange={event => setPriority(event.target.value)}><option value="">كل الأولويات</option>{(Object.entries(priorityLabels) as [TaskPriority, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <label className="text-xs font-semibold text-brand-charcoal">نوع التكليف
          <select className="mt-1 min-h-11 w-full rounded-input border border-brand-border bg-white p-2.5 text-sm" value={kind} onChange={event => setKind(event.target.value)}><option value="">كل الأنواع</option><option value="MATERIALS_REQUIRED">مطلوب مواد للمؤسسة / جهات المانحة</option><option value="SOCIAL_MEDIA">سوشيال ميديا</option></select>
        </label>
        <label className="text-xs font-semibold text-brand-charcoal">تاريخ الاستحقاق<EnglishDateInput className="mt-1" value={date} onChange={setDate} ariaLabel="تاريخ الاستحقاق" /></label>
        <div className="flex items-end"><Button variant="outline" className="w-full" onClick={clearFilters}>مسح عوامل التصفية</Button></div>
      </div>
    </Card>

    <div className="flex items-center justify-between text-sm text-brand-charcoal">
      <span>عدد التكليفات: <b className="text-brand-darkText" dir="ltr">{rows.length}</b></span>
      <span className="inline-flex items-center gap-1.5 text-xs"><span className="h-2 w-2 rounded-full bg-emerald-500" /> تحديث تلقائي كل 15 ثانية</span>
    </div>

    <section className="space-y-4">
      {rows.map(task => {
        const recipients = task.recipients.filter(recipient => departmentScope || recipient.userId === currentUser.id);
        const category = taskCategory(task);
        const isReview = category === 'REVIEW';
        const detailsUrl = !canViewAssignments && reviewer ? `/app/assignments/${task.id}/review` : `/app/assignments/${task.id}`;
        return <Card key={task.id} className="overflow-hidden transition-shadow hover:shadow-md" padding="none">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-border/70 px-4 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${task.isDraft ? 'bg-slate-100 text-slate-700' : task.isOverdue ? 'bg-red-50 text-red-700' : isReview ? 'bg-amber-50 text-amber-800' : category === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-plum/10 text-brand-plum'}`}>{filterLabels[category]}</span>
                <span className="text-xs text-brand-charcoal">رقم التكليف: <b dir="ltr">{task.id}</b></span>
              </div>
              <Link className="text-lg font-bold text-brand-darkText decoration-brand-plum underline-offset-4 hover:text-brand-plum hover:underline" to={detailsUrl}>{task.titleAr || 'تكليف بلا عنوان'}</Link>
              {task.descriptionAr && <p className="mt-1 line-clamp-2 text-sm text-brand-charcoal">{task.descriptionAr}</p>}
            </div>
            <Link to={detailsUrl}><Button variant="outline" size="sm" rightIcon={<ArrowUpLeft size={15} />}>{reviewer && !canViewAssignments ? 'مراجعة التسليم' : 'التفاصيل'}</Button></Link>
          </div>

          <div className="grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
            <div className="space-y-5">
              <AssignmentProgress statuses={recipients.map(recipient => recipient.status)} />
              <p className="text-xs text-brand-charcoal">يُحسب التقدم من حالة جميع المكلفين بهذا العمل.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 self-start text-sm">
              <div className="rounded-xl border border-brand-border/80 bg-brand-lightGray/30 p-3">
                <span className="flex items-center gap-1.5 text-xs text-brand-charcoal"><CalendarClock size={15} /> موعد الاستحقاق</span>
                <time className="mt-2 block font-bold tabular-nums" dir="ltr">{task.deadline}</time>
              </div>
              <div className="rounded-xl border border-brand-border/80 bg-brand-lightGray/30 p-3">
                <span className="text-xs text-brand-charcoal">الأولوية</span>
                <b className="mt-2 block">{priorityLabels[task.priority]}</b>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold">حالة المستلمين</h2>
                <span className="text-xs text-brand-charcoal">{recipients.length} {recipients.length === 1 ? 'موظف' : 'موظفين'}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {recipients.map(recipient => <div key={recipient.userId} className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-brand-border/70 px-3 py-2.5">
                  <span className="truncate text-sm font-medium">{recipient.userNameAr}</span>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${recipient.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800' : recipient.status === 'SUBMITTED' ? 'bg-amber-50 text-amber-800' : recipient.status === 'RETURNED_FOR_REVISION' ? 'bg-red-50 text-red-700' : 'bg-brand-lightGray text-brand-charcoal'}`}>{statusLabels[recipient.status] || 'غير محدد'}</span>
                </div>)}
                {!recipients.length && <p className="text-sm text-brand-charcoal">لم يُحدّد مستلمون بعد.</p>}
              </div>
            </div>
          </div>
        </Card>;
      })}
      {!rows.length && <Card><div className="py-5 text-center"><ClipboardList size={28} className="mx-auto mb-2 text-brand-charcoal/60" /><p className="font-semibold">لا توجد تكليفات مطابقة.</p><p className="mt-1 text-sm text-brand-charcoal">جرّب تغيير عوامل التصفية أو البحث.</p></div></Card>}
    </section>
  </main>;
};
