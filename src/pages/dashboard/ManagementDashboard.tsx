import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Clock3, FileText, FolderKanban, MapPin, Megaphone, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

export const ManagementDashboard: React.FC = () => {
  const { language, currentUser, tasks, projects, circulars, workLogs, users } = useApp();
  const ar = language === 'ar';
  const [month, setMonth] = useState('2026-10');
  const [view, setView] = useState<'ready'|'loading'|'empty'|'error'>('ready');
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);
  const txt = (a: string, e: string) => ar ? a : e;
  const visibleTasks = useMemo(() => tasks.filter(t => !t.isDraft), [tasks]);
  const assigned = visibleTasks.flatMap(t => t.recipients.map(r => ({task:t, recipient:r})));
  const pending = assigned.filter(x => x.recipient.status === 'SUBMITTED');
  const overdue = assigned.filter(x => x.task.isOverdue);
  const open = assigned.filter(x => ['RECEIVED','IN_PROGRESS'].includes(x.recipient.status));
  const unack = circulars.filter(c => !c.isDraft).flatMap(c => c.recipients.filter(r => !r.hasAcknowledged));
  const today = workLogs.filter(log => log.date === '2026-10-31');
  const recent = [...tasks.filter(t=>!t.isDraft).map(t=>({id:t.id,label:ar? t.titleAr:t.titleEn,stamp:t.createdAt,icon:<ClipboardList size={17}/> })), ...circulars.filter(c=>!c.isDraft).map(c=>({id:c.id,label:ar?c.titleAr:c.titleEn,stamp:c.issuedAt,icon:<Megaphone size={17}/> }))].slice(0,5);
  const cards = [
    { label:txt('تكليفات نشطة','Active assignments'), value:open.length, href:'/app/assignments', icon:<ClipboardList/> },
    { label:txt('متأخرة','Overdue'), value:overdue.length, href:'/app/assignments', icon:<AlertTriangle/> },
    { label:txt('بانتظار المراجعة','Awaiting review'), value:pending.length, href:'/app/assignments', icon:<Clock3/> },
    { label:txt('إقرارات تعاميم معلقة','Unacknowledged circulars'), value:unack.length, href:'/app/circulars', icon:<FileText/> },
  ];
  return <main className="space-y-5 min-w-0">
    <header className="relative overflow-hidden rounded-card border border-brand-border bg-white p-5 shadow-subtle sm:p-6">
      <div className="absolute inset-y-0 start-0 w-1.5 bg-brand-magenta" aria-hidden="true" />
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full bg-brand-plum/10 px-3 py-1 text-[11px] font-subheading text-brand-plum">
            {ar ? currentUser.jobTitleAr : currentUser.jobTitleEn}
          </span>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{txt(`مرحباً، ${currentUser.arabicName}`,`Welcome, ${currentUser.englishName}`)}</h1>
          <p className="mt-1 text-sm text-brand-charcoal">{txt('نظرة إدارية على دائرة الإعلام · تحديث تجريبي: 31 أكتوبر 2026','Media department overview · Demo refreshed: October 31, 2026')}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2 md:justify-end">
          <label className="flex flex-col gap-1 text-xs font-subheading text-brand-charcoal">
            {txt('الشهر','Month')}
            <input type="text" inputMode="numeric" dir="ltr" placeholder="YYYY-MM" value={month} onChange={e=>setMonth(e.target.value)} className="min-h-[44px] w-36 rounded-input border border-brand-border bg-white px-3 text-sm text-brand-darkText focus:border-brand-plum focus:outline-none focus:ring-2 focus:ring-brand-plum/20"/>
          </label>
          <Button variant="outline" onClick={()=>setView('ready')} leftIcon={<RefreshCw size={16}/>}>{txt('تحديث العرض','Refresh demo')}</Button>
        </div>
      </div>
    </header>
    <details className="group rounded-card border border-brand-border/80 bg-white/70 px-4 py-2.5">
      <summary className="min-h-8 cursor-pointer text-xs font-subheading text-brand-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-plum">
        {txt('معاينة حالات النظام','Preview system states')}
      </summary>
      <div className="flex flex-wrap gap-2 pb-1 pt-2" aria-label={txt('حالات العرض','View states')}>
        {(['ready','loading','empty','error'] as const).map(s=><Button key={s} size="sm" variant={view===s?'secondary':'outline'} onClick={()=>setView(s)}>{({ready:txt('البيانات','Data'),loading:txt('تحميل','Loading'),empty:txt('فارغ','Empty'),error:txt('خطأ','Error')}[s])}</Button>)}
      </div>
    </details>
    {view==='error' && <Card><p role="alert">{txt('تعذر تحميل بيانات العرض التجريبية.','Could not load demo data.')}</p><Button className="mt-3" onClick={()=>setView('ready')}>{txt('إعادة المحاولة','Retry')}</Button></Card>}
    {view==='loading' && <Card><p role="status">{txt('جارٍ تحميل الملخص…','Loading overview…')}</p><div className="h-2 bg-brand-lightGray rounded mt-4 animate-pulse"/></Card>}
    {view==='empty' && <Card><p>{txt('لا توجد نتائج للفترة المحددة. اختر أكتوبر 2026 لعرض بيانات المثال.','No results for this period. Select October 2026 to see the sample data.')}</p></Card>}
    {view==='ready' && <>
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map((item,i)=><Link key={item.label} to={item.href} className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-plum"><Card className="h-full hover:border-brand-plum"><div className="flex justify-between gap-3"><span className="text-sm">{item.label}</span><span className="text-brand-plum">{item.icon}</span></div><strong className="block text-3xl mt-4" dir="ltr">{item.value}</strong><span className="text-xs">{txt('عرض القائمة المفلترة','Open filtered list')}</span></Card></Link>)}</section>
      <section className="rounded-card border border-brand-border bg-white p-4 shadow-subtle sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-subheading font-bold">{txt('وضع العمل والاتصال','Work and connection status')}</h2><p className="mt-1 text-sm text-brand-charcoal/70">{txt('تعرض هذه النسخة حالة اتصال المتصفح؛ حفظ البيانات ومزامنتها دون اتصال غير متاحين في النموذج التجريبي.','This prototype reports browser connectivity; data saving and offline sync are not connected.')}</p></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${isOnline?'bg-green-50 text-green-800':'bg-amber-50 text-amber-900'}`}>{isOnline?<Wifi size={16}/>:<WifiOff size={16}/>} {isOnline?txt('متصل','Online'):txt('غير متصل','Offline')}</span></div></section>
      <section className="rounded-card border border-brand-border bg-white p-4 shadow-subtle sm:p-5"><div className="mb-4"><h2 className="font-subheading font-bold">{txt('سير العمل الإعلامي','Media workflow')}</h2><p className="mt-1 text-xs text-brand-charcoal/70">{txt('ملخص المشاريع والتكليفات والتعاميم في الدائرة','Summary of department projects, assignments, and circulars')}</p></div><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[{label:txt('المشاريع النشطة','Active projects'),value:projects.filter(p=>p.status==='IN_PROGRESS').length,icon:<FolderKanban size={19}/>,to:'/app/projects'},{label:txt('التكليفات المفتوحة','Open assignments'),value:open.length,icon:<ClipboardList size={19}/>,to:'/app/assignments'},{label:txt('مواد بانتظار المراجعة','Awaiting review'),value:pending.length,icon:<Clock3 size={19}/>,to:'/app/assignments'},{label:txt('إقرارات تعاميم معلقة','Circular acknowledgments'),value:unack.length,icon:<FileText size={19}/>,to:'/app/circulars'}].map(item=><Link key={item.label} to={item.to} className="rounded-xl border border-brand-border p-3 transition hover:border-brand-plum sm:p-4"><div className="flex items-center justify-between gap-2 text-xs text-brand-charcoal"><span>{item.label}</span><span className="text-brand-plum">{item.icon}</span></div><strong className="mt-2 block text-2xl sm:text-3xl">{item.value}</strong></Link>)}</div></section>
      <section className="grid lg:grid-cols-3 gap-4"><Card title={txt('التكليفات حسب الحالة','Assignments by state')}><div className="space-y-4">{[['RECEIVED',txt('تم الاستلام','Received')],['IN_PROGRESS',txt('قيد التنفيذ','In progress')],['SUBMITTED',txt('تم التسليم','Submitted')],['APPROVED',txt('معتمد','Approved')]].map(([status,label])=>{const count=assigned.filter(a=>a.recipient.status===status).length;return <div key={status}><div className="flex justify-between text-sm"><span>{label}</span><b>{count}</b></div><div className="h-2 bg-brand-lightGray rounded mt-1"><div className="h-2 bg-brand-plum rounded" style={{width:`${assigned.length?count/assigned.length*100:0}%`}}/></div></div>})}</div></Card>
      <Card title={txt('إنجاز الموعد الشهري','Monthly on-time performance')} subtitle={txt('مؤشرات تجميعية تجريبية — شهر أكتوبر 2026','Illustrative aggregate fixture — October 2026')}><div className="text-4xl font-bold" dir="ltr">88.89%</div><p className="mt-2 text-sm">{txt('8 من 9 تكليفات مكتملة في موعدها (مقياس تجميعي توضيحي).','8 of 9 completed assignments on time (illustrative aggregate).')}</p><p className="text-xs mt-4">{txt('هذا المؤشر ليس محسوباً من عينة التكليفات الظاهرة.','This metric is not derived from the sample task list.')}</p></Card>
      <Card title={txt('المكتب مقابل الميدان','Office vs field')}><div className="flex gap-4 text-center"><div className="flex-1 p-4 bg-brand-lightGray rounded"><MapPin className="mx-auto"/><b className="block text-2xl">{today.filter(l=>l.location==='OFFICE').length}</b>{txt('المكتب','Office')}</div><div className="flex-1 p-4 bg-brand-lightGray rounded"><MapPin className="mx-auto"/><b className="block text-2xl">{today.filter(l=>l.location==='FIELD').length}</b>{txt('الميدان','Field')}</div></div></Card></section>
      <section className="grid lg:grid-cols-2 gap-4"><Card title={txt('سجل العمل اليوم — 31 أكتوبر 2026','Logged work today — October 31, 2026')} subtitle={txt('يعرض سجلات هذا اليوم فقط','Only entries from this date')}><div className="space-y-3">{today.map(log=><div key={log.id} className="border-b pb-3"><div className="flex justify-between gap-3"><b>{ar?log.userNameAr:log.userNameEn}</b><span dir="ltr">{log.time}</span></div><p className="text-sm mt-1">{ar?log.activityAr:log.activityEn}</p><span className="text-xs">{log.location==='OFFICE'?txt('المكتب','Office'):txt('الميدان','Field')}</span></div>)}</div></Card>
      <Card title={txt('بانتظار الاعتماد','Pending approvals')}><div className="space-y-3">{pending.map(({task,recipient})=><div key={task.id} className="p-3 bg-brand-lightGray rounded"><b>{task.id} · {ar?task.titleAr:task.titleEn}</b><p className="text-sm mt-1">{ar?recipient.userNameAr:recipient.userNameEn} · {txt('بانتظار المراجعة','Awaiting review')}</p></div>)}</div></Card></section>
      <section className="grid lg:grid-cols-2 gap-4"><Card title={txt('النشاط الأخير','Recent activity')}><div className="space-y-3">{recent.map(item=><div className="flex gap-3 items-start" key={item.id}><span className="text-brand-plum">{item.icon}</span><div><p>{item.label}</p><small dir="ltr">{item.stamp}</small></div></div>)}</div></Card><Card title={txt('إقرارات التعاميم الأخيرة','Recent circular acknowledgments')}><div className="space-y-3">{circulars.filter(c=>!c.isDraft).flatMap(c=>c.recipients.filter(r=>r.hasAcknowledged).map(r=><p key={`${c.id}-${r.userId}`} className="text-sm"><CheckCircle2 className="inline text-brand-plum me-2"/>{users.find(u=>u.id===r.userId)?.[ar?'arabicName':'englishName']} · {c.id} · {r.acknowledgedAt}</p>))}</div></Card></section>
      <Card title={txt('إجراءات سريعة','Quick actions')}><div className="flex flex-wrap gap-3"><Link to="/app/assignments"><Button leftIcon={<ClipboardList size={17}/>}>{txt('إنشاء تكليف','Create assignment')}</Button></Link><Link to="/app/circulars"><Button variant="secondary" leftIcon={<Megaphone size={17}/>}>{txt('نشر تعميم','Publish circular')}</Button></Link></div></Card>
      {currentUser.role === 'ADMIN' && <Card title={txt('إدارة النظام','System administration')} subtitle={txt('اختصارات للمهام الإدارية','Shortcuts for administrative work')}><div className="flex flex-wrap gap-2"><Link to="/app/users"><Button variant="outline">{txt('إدارة المستخدمين','Manage users')}</Button></Link><Link to="/app/settings"><Button variant="outline">{txt('إعدادات النظام','System settings')}</Button></Link><Link to="/app/system-health"><Button variant="outline">{txt('صحة النظام','System health')}</Button></Link><Link to="/app/audit-log"><Button variant="outline">{txt('سجل التدقيق','Audit log')}</Button></Link></div></Card>}
      <p className="text-xs flex gap-2 items-center"><Activity size={15}/>{txt('الأرقام تخص بيانات خيالية داخل المتصفح. نتائج الموظفين التفصيلية لم تُستنتج من هذه العينة.','Counts use fictional in-browser data. Employee performance totals are not inferred from this sample.')}</p>
    </>}
  </main>;
};



