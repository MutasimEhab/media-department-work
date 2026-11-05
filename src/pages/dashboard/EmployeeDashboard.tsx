import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarDays, CheckCircle2, CircleAlert, Clock3, FileText, FolderKanban, Wifi, WifiOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { NOOR_MONTHLY_SCORE_FIXTURE } from '../../data/mockData';

export const EmployeeDashboard: React.FC = () => {
  const { language, currentUser, tasks, projects, circulars, workLogs, notifications, frozenDate } = useApp();
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);
  const ar = language === 'ar';
  const txt = (a: string, e: string) => ar ? a : e;
  const myTasks = tasks.filter(t => !t.isDraft).flatMap(task => task.recipients.filter(r => r.userId === currentUser.id).map(recipient => ({task, recipient})));
  const myLogs = workLogs.filter(log => log.userId === currentUser.id && log.date.startsWith('2026-10'));
  const myProjects = projects.filter(project => project.ownerId === currentUser.id);
  const days = new Set(myLogs.map(log => log.date)).size;
  const myNotifications = notifications.filter(n=>n.userId===currentUser.id);
  const unread = myNotifications.filter(n=>!n.isRead).length;
  const circularNeedsAck = circulars.find(c=>!c.isDraft && c.id==='CIR-301' && c.recipients.some(r=>r.userId===currentUser.id&&!r.hasAcknowledged));
  const score = currentUser.id === 'U-004' ? NOOR_MONTHLY_SCORE_FIXTURE : undefined;
  const stateLabel = (status: string) => ({RECEIVED:txt('تم الاستلام','Received'),IN_PROGRESS:txt('قيد التنفيذ','In progress'),SUBMITTED:txt('تم التسليم','Submitted'),APPROVED:txt('معتمد','Approved'),RETURNED_FOR_REVISION:txt('معاد للتعديل','Returned for revision')}[status] || status);
  const priorityLabel = (p: string) => ({URGENT:txt('عاجل','Urgent'),HIGH:txt('عالية','High'),MEDIUM:txt('متوسطة','Medium'),LOW:txt('منخفضة','Low')}[p] || p);
  return <main className="space-y-5 min-w-0">
    <header className="relative overflow-hidden rounded-card border border-brand-border bg-white p-5 shadow-subtle sm:p-6">
      <div className="absolute inset-y-0 start-0 w-1.5 bg-brand-plum" aria-hidden="true" />
      <span className="inline-flex items-center rounded-full bg-brand-plum/10 px-3 py-1 text-[11px] font-subheading text-brand-plum">
        {ar ? currentUser.jobTitleAr : currentUser.jobTitleEn}
      </span>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{txt(`أهلاً ${currentUser.arabicName}`,`Hello, ${currentUser.englishName}`)}</h1>
      <p className="mt-1 flex items-center gap-2 text-sm text-brand-charcoal"><CalendarDays size={16}/>{txt('اليوم','Today')}: <time dateTime={frozenDate} dir="ltr">{frozenDate}</time></p>
    </header>
    <Link to="/app/work/new" className="block"><Button size="lg" fullWidth className="min-h-[60px]">{txt('إضافة عمل','Add work')}</Button></Link>
    <section className="grid lg:grid-cols-2 gap-4">
      <Card title={txt('آخر تعميم','Latest circular')}>
        {circularNeedsAck?<div className="rounded-xl border border-brand-magenta/20 bg-brand-magenta/5 p-4"><p className="flex items-center gap-2 text-sm font-bold text-brand-plum"><CircleAlert size={17}/>{txt('بانتظار إقرار القراءة','Acknowledgment needed')}</p><p className="mt-2 font-subheading">{ar?circularNeedsAck.titleAr:circularNeedsAck.titleEn}</p><Link to="/app/circulars" className="mt-3 inline-flex text-sm font-bold text-brand-plum underline">{txt('فتح التعميم','Open circular')}</Link></div>:<p className="text-sm text-brand-charcoal/70">{txt('لا توجد تعاميم جديدة تحتاج إقراراً.','No new circulars need acknowledgment.')}</p>}
      </Card>
      <Card title={txt('المشاريع المكلف بها','Projects assigned to me')}>
        {myProjects.length?<div className="space-y-3">{myProjects.slice(0,2).map(project=><Link key={project.id} to={`/app/projects/${project.id}`} className="block rounded-xl border border-brand-border p-3 transition hover:border-brand-plum"><div className="flex items-center justify-between gap-2"><b>{ar?project.titleAr:project.titleEn}</b><FolderKanban size={17} className="shrink-0 text-brand-plum"/></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-lightGray"><div className="h-full rounded-full bg-brand-plum" style={{width:`${project.stages.length?project.stages.filter(stage=>stage.isCompleted).length/project.stages.length*100:0}%`}}/></div><small className="mt-1 block text-brand-charcoal/70">{project.stages.filter(stage=>stage.isCompleted).length}/{project.stages.length} {txt('مرحلة مكتملة','stages complete')}</small></Link>)}</div>:<p className="text-sm text-brand-charcoal/70">{txt('لا توجد مشاريع مكلف بها حالياً.','No projects assigned at this time.')}</p>}
      </Card>
    </section>
    <section className="rounded-card border border-brand-border bg-white p-4 shadow-subtle sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-subheading font-bold text-brand-darkText">{txt('حالة الاتصال والحفظ','Connection and save status')}</h2><p className="mt-1 text-sm text-brand-charcoal/70">{txt('بيانات هذه النسخة تجريبية ومحفوظة داخل جلسة المتصفح. لا يوجد مزامنة فعلية دون اتصال.','This prototype uses browser-session demo data. Offline synchronization is not connected.')}</p></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${isOnline?'bg-green-50 text-green-800':'bg-amber-50 text-amber-900'}`}>{isOnline?<Wifi size={16}/>:<WifiOff size={16}/>} {isOnline?txt('متصل','Online'):txt('غير متصل','Offline')}</span></div></section>
    <section className="rounded-card border border-brand-border bg-white p-4 shadow-subtle sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-subheading font-bold">{txt('سير العمل الإعلامي','Media workflow')}</h2><p className="mt-1 text-xs text-brand-charcoal/70">{txt('ملخص تكليفاتك ومتابعتك لهذا الشهر','A summary of your assignments and progress this month')}</p></div><Link to="/app/work"><Button size="sm" variant="outline">{txt('فتح سجل العمل','Open work history')}</Button></Link></div><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[{label:txt('مشاريعي النشطة','Active projects'),value:myProjects.filter(p=>p.status==='IN_PROGRESS').length,icon:<FolderKanban size={19}/>},{label:txt('تكليفات مفتوحة','Open assignments'),value:myTasks.filter(x=>['RECEIVED','IN_PROGRESS'].includes(x.recipient.status)).length,icon:<Clock3 size={19}/>},{label:txt('بانتظار المراجعة','Awaiting review'),value:myTasks.filter(x=>x.recipient.status==='SUBMITTED').length,icon:<FileText size={19}/>},{label:txt('أيام العمل المسجلة','Days logged'),value:days,icon:<CalendarDays size={19}/>}].map(item=><div key={item.label} className="rounded-xl border border-brand-border p-3 sm:p-4"><div className="flex items-center justify-between gap-2 text-xs text-brand-charcoal"><span>{item.label}</span><span className="text-brand-plum">{item.icon}</span></div><strong className="mt-2 block text-2xl sm:text-3xl">{item.value}</strong></div>)}
    </div></section>
    <div className="grid sm:grid-cols-2 gap-4">
      <Card><p className="text-sm flex gap-2"><Bell size={17}/>{txt('إشعارات غير مقروءة','Unread notifications')}</p><strong className="text-3xl block mt-3">{unread}</strong><Link to="/app/notifications" className="underline text-brand-plum text-sm">{txt('عرض الإشعارات','View notifications')}</Link></Card>
      {score && <Card provisionalNotice><p className="text-sm">{txt('تقييم أكتوبر التجريبي','October demo score')}</p><strong className="text-3xl block mt-3" dir="ltr">{score.totalScore.toFixed(2)}</strong><span className="text-xs">{txt('الأوزان 40/40/20 مؤقتة وقيد الاعتماد','40/40/20 weights are provisional')}</span></Card>}
    </div>
    <section className="grid lg:grid-cols-2 gap-4"><Card title={txt('تكليفاتي','My assignments')}>
      {myTasks.length===0?<p>{txt('لا توجد تكليفات حالياً.','No assignments yet.')}</p>:<div className="space-y-3">{myTasks.map(({task,recipient})=><Link to={`/app/assignments/${task.id}`} key={task.id} className="block rounded-lg border p-4 hover:border-brand-plum focus:ring-2 focus:ring-brand-plum"><div className="flex flex-wrap justify-between gap-2"><b>{ar?task.titleAr:task.titleEn}</b><span className="text-xs">{priorityLabel(task.priority)}</span></div><p className="text-sm mt-2">{stateLabel(recipient.status)} · {txt('الموعد','Due')}: <time dir="ltr">{task.deadline}</time></p></Link>)}</div>}
    </Card><Card title={txt('الخطوات التالية','Next steps')}><div className="space-y-4">{myTasks.filter(x=>x.recipient.status!=='APPROVED').slice(0,3).map(({task,recipient})=><p key={task.id} className="flex gap-3"><Clock3 className="text-brand-plum shrink-0"/><span>{recipient.status==='SUBMITTED'?txt('بانتظار مراجعة','Awaiting review'):txt('تابع التكليف','Continue assignment')}: {ar?task.titleAr:task.titleEn}</span></p>)}{!circularNeedsAck&&<p className="flex gap-3"><CheckCircle2 className="text-brand-plum shrink-0"/>{txt('لا توجد تعاميم معلقة.','No circulars need acknowledgment.')}</p>}<Link to="/app/daily-work" className="flex gap-3 underline text-brand-plum"><FileText/>{txt('راجع سجل أعمالك','Review your work history')}</Link></div></Card></section>
    <p className="text-xs">{txt('المعلومات المعروضة تخص حسابك الحالي فقط. بيانات العرض خيالية، وقد تختلف تفاصيل العرض بين الموظفين.','This page shows only your account data. Demo records are fictional and may differ by employee.')}</p>
  </main>;
};
