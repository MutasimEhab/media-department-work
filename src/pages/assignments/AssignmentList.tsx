import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { TaskPriority } from '../../types';

type Tab = 'ACTIVE'|'REVIEW'|'OVERDUE'|'COMPLETED'|'DRAFTS'|'ARCHIVED';
const statusLabels: Record<string,string> = { RECEIVED:'تم الاستلام', IN_PROGRESS:'قيد التنفيذ', SUBMITTED:'تم التسليم', APPROVED:'معتمد', RETURNED_FOR_REVISION:'أُعيد للتعديل' };
const priorityLabels: Record<TaskPriority,string> = { LOW:'منخفضة', MEDIUM:'متوسطة', HIGH:'عالية', URGENT:'عاجلة' };

export const AssignmentList: React.FC = () => {
  const { currentUser, tasks, users, canAccess } = useApp();
  const manager = canAccess('manage_assignments');
  const [tab,setTab] = useState<Tab>('ACTIVE');
  const [query,setQuery] = useState('');
  const [employee,setEmployee] = useState('');
  const [priority,setPriority] = useState('');
  const [kind,setKind] = useState('');
  const [date,setDate] = useState('');
  const tabs: {id:Tab;label:string}[] = [
    {id:'ACTIVE',label:'نشطة'},{id:'REVIEW',label:'بانتظار المراجعة'},
    {id:'OVERDUE',label:'متأخرة'},{id:'COMPLETED',label:'مكتملة'},
    ...(manager?[{id:'DRAFTS' as Tab,label:'مسودات'}]:[]),{id:'ARCHIVED',label:'ملغاة أو مؤرشفة'},
  ];
  const rows = useMemo(()=>tasks.filter(task=>{
    if(task.isDraft&&(!manager||tab!=='DRAFTS')) return false;
    if(!task.isDraft&&tab==='DRAFTS') return false;
    if(!manager&&!task.recipients.some(recipient=>recipient.userId===currentUser.id)) return false;
    if(query&&!`${task.id} ${task.titleAr}`.toLowerCase().includes(query.toLowerCase())) return false;
    if(employee&&!task.recipients.some(recipient=>recipient.userId===employee)) return false;
    if(priority&&task.priority!==priority) return false;
    if(kind&&task.type!==kind) return false;
    if(date&&!task.deadline.startsWith(date)) return false;
    if(tab==='REVIEW'&&!task.recipients.some(recipient=>recipient.status==='SUBMITTED')) return false;
    if(tab==='OVERDUE'&&!task.isOverdue) return false;
    if(tab==='COMPLETED'&&!task.recipients.every(recipient=>recipient.status==='APPROVED')) return false;
    if(tab==='ACTIVE'&&!task.isDraft&&!task.recipients.some(recipient=>['RECEIVED','IN_PROGRESS'].includes(recipient.status))) return false;
    if(tab==='ARCHIVED') return false;
    return true;
  }).sort((a,b)=>a.deadline.localeCompare(b.deadline)),[tasks,manager,tab,currentUser,query,employee,priority,kind,date]);

  return <main className="space-y-5" dir="rtl">
    <header className="flex flex-wrap items-end justify-between gap-3 app-page-heading"><div><h1 className="mt-2 text-2xl font-bold">{manager?'إدارة التكليفات':'تكليفاتي'}</h1><p>تُتابع حالة كل موظف مكلّف على حدة.</p></div>{canAccess('manage_assignments')&&<Link to="/app/assignments/new"><Button>إنشاء تكليف</Button></Link>}</header>
    <nav className="flex gap-2 overflow-x-auto">{tabs.map(item=><Button key={item.id} size="sm" variant={tab===item.id?'secondary':'outline'} onClick={()=>setTab(item.id)}>{item.label}</Button>)}</nav>
    <Card title="تصفية التكليفات"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <input className="rounded-input border border-brand-border p-2.5" placeholder="ابحث بعنوان التكليف أو رقمه" value={query} onChange={event=>setQuery(event.target.value)}/>
      {manager&&<select className="rounded-input border border-brand-border p-2.5" value={employee} onChange={event=>setEmployee(event.target.value)}><option value="">كل الموظفين</option>{users.filter(user=>user.role==='EMPLOYEE').map(user=><option key={user.id} value={user.id}>{user.arabicName}</option>)}</select>}
      <select className="rounded-input border border-brand-border p-2.5" value={priority} onChange={event=>setPriority(event.target.value)}><option value="">كل الأولويات</option>{(Object.entries(priorityLabels) as [TaskPriority,string][]).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <select className="rounded-input border border-brand-border p-2.5" value={kind} onChange={event=>setKind(event.target.value)}><option value="">كل أنواع التكليف</option><option value="NORMAL">عادي</option><option value="SOCIAL_MEDIA">وسائل التواصل الاجتماعي</option></select>
      <label className="text-sm">تاريخ الاستحقاق<input className="mt-1 block w-full rounded-input border border-brand-border p-2.5" type="text" inputMode="numeric" dir="ltr" placeholder="YYYY-MM-DD" value={date} onChange={event=>setDate(event.target.value)}/></label>
      <Button variant="outline" onClick={()=>{setQuery('');setEmployee('');setPriority('');setKind('');setDate('');setTab('ACTIVE')}}>مسح عوامل التصفية</Button>
    </div></Card>
    <p className="text-sm text-brand-charcoal">عدد النتائج: {rows.length}</p>
    <section className="grid gap-3 lg:grid-cols-2">{rows.map(task=><Card key={task.id} className="hover:border-brand-plum" title={<Link className="text-brand-plum underline" to={`/app/assignments/${task.id}`}>{task.titleAr||'تكليف بلا عنوان'}</Link>} subtitle={`رقم التكليف: ${task.id}`}>
      <p>{task.descriptionAr}</p><p className="mt-2 text-sm">الأولوية: <b>{priorityLabels[task.priority]}</b> · الاستحقاق: <time dir="ltr">{task.deadline}</time></p>
      <div className="mt-3 space-y-1">{task.recipients.filter(recipient=>manager||recipient.userId===currentUser.id).map(recipient=><p key={recipient.userId} className="text-sm">{recipient.userNameAr}: {statusLabels[recipient.status]||'غير محدد'}</p>)}</div>
      {task.isOverdue&&<p className="mt-2 font-bold text-red-700">متأخر عن الموعد</p>}
    </Card>)}{!rows.length&&<Card>لا توجد تكليفات مطابقة لعوامل التصفية.</Card>}</section>
  </main>;
};
