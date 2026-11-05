import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, UserRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { useApp } from '../../context/AppContext';

export const QuickWorkEntry: React.FC = () => {
  const { language, currentUser, users, tasks, projects, workLogs, addWorkLog, queueWorkLog, frozenDate, exceptions } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const adminEntry = pathname === '/app/admin/add-work';
  const employeeOptions = users.filter(user => user.role === 'EMPLOYEE' && user.isActive);
  const [targetUserId, setTargetUserId] = useState(() => employeeOptions[0]?.id || currentUser.id);
  const targetUser = adminEntry ? users.find(user => user.id === targetUserId) || currentUser : currentUser;
  const ar=language==='ar'; const txt=(a:string,e:string)=>ar?a:e;
  const [area,setArea]=useState(''); const [location,setLocation]=useState<'OFFICE'|'FIELD'>('OFFICE');
  const [description,setDescription]=useState(''); const [drive,setDrive]=useState(''); const [taskId,setTaskId]=useState(''); const [projectId,setProjectId]=useState('');
  const [selectedDate,setSelectedDate]=useState(frozenDate);
  const [error,setError]=useState(''); const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false);
  const [savedOffline,setSavedOffline]=useState(false);
  const savedOnce=useRef(false);
  const dirty=Boolean(area||description||drive||taskId||projectId);
  useEffect(()=>{if(!dirty||saved)return; const handler=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';}; window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty,saved]);
  const ownLogs=workLogs.filter(x=>x.userId===targetUser.id);
  const allowedDates=[frozenDate,...exceptions.filter(x=>x.userId===targetUser.id&&!x.revokedAt).flatMap(x=>x.dates)];
  const duplicate=ownLogs.some(x=>x.date===selectedDate && x.activityAr.trim().toLowerCase()===description.trim().toLowerCase() && description.trim().length>0);
  const driveValid=!drive||/^https:\/\/drive\.google\.com\/(file\/d\/[^/]+\/view|drive\/folders\/[^/?]+)(\?.*)?$/.test(drive.trim());
  const suggestions=useMemo(()=>Array.from(new Set(ownLogs.flatMap(x=>[x.activityAr,x.activityEn]).filter(Boolean))).slice(0,4),[ownLogs]);
  const options=(all:{id:string;titleAr:string;titleEn:string}[])=>[{value:'',label:txt('بدون ربط','No link')},...all.map(x=>({value:x.id,label:`${x.id} · ${ar?x.titleAr:x.titleEn}`}))];
  const dateValue=new Date(`${selectedDate}T12:00:00Z`);
  const dateParts=[
    {label:txt('اليوم','Day'),value:new Intl.DateTimeFormat(ar?'ar':'en',{weekday:'long',timeZone:'UTC'}).format(dateValue)},
    {label:txt('اليوم في الشهر','Day of month'),value:String(dateValue.getUTCDate())},
    {label:txt('الشهر','Month'),value:new Intl.DateTimeFormat(ar?'ar':'en',{month:'long',timeZone:'UTC'}).format(dateValue)},
    {label:txt('السنة الميلادية','Year'),value:String(dateValue.getUTCFullYear())},
  ];
  async function submit(e:React.FormEvent){e.preventDefault();if(savedOnce.current||saving)return;setError('');if(!description.trim()||!area.trim()){setError('required');return;}if(!driveValid){setError('url');return;}if(duplicate&&!window.confirm(txt('يوجد سجل مشابه لك اليوم. هل تريد حفظ سجل آخر؟','A similar entry exists for today. Save another record?')))return;
    savedOnce.current=true;setSaving(true);await new Promise(r=>window.setTimeout(r,500));
    const project=projects.find(p=>p.id===projectId);
    const entry={userId:targetUser.id,userNameAr:targetUser.arabicName,userNameEn:targetUser.englishName,date:selectedDate,time:'09:15 AM',activityAr:description.trim(),activityEn:description.trim(),area:area.trim(),location,relatedTaskId:taskId||undefined,projectId:project?.id,projectTitleAr:project?.titleAr,projectTitleEn:project?.titleEn,outputLink:drive.trim()||undefined,isException:selectedDate!==frozenDate};
    if(navigator.onLine)addWorkLog(entry);else{queueWorkLog(entry);setSavedOffline(true);}
    setSaving(false);setSaved(true);
  }
  const clearFields=()=>{if(dirty&&!window.confirm(txt('مسح البيانات المدخلة؟','Clear the entered fields?')))return;setArea('');setLocation('OFFICE');setDescription('');setDrive('');setTaskId('');setProjectId('');setError('');};
  return <main className="max-w-5xl mx-auto space-y-5">
    {saved?<section role="status" className="rounded-2xl border border-brand-border bg-white p-6 space-y-4 shadow-subtle"><h2 className="text-xl font-bold flex gap-2 items-center"><CheckCircle2 className="text-brand-plum"/>{savedOffline?txt('حُفظ العمل بانتظار المزامنة','Work saved and waiting to sync'):txt('تم حفظ سجل العمل','Work entry saved')}</h2><p>{savedOffline?txt('حُفظ هذا السجل على الجهاز؛ ستتم محاولة مزامنته عند عودة الاتصال.','This entry is stored on this device and will sync when the connection returns.'):txt('أضيف السجل إلى بياناتك التجريبية وحدثت القوائم فوراً.','The entry was added to your demo data and lists updated.')}</p><div className="flex gap-3 flex-wrap">{savedOffline&&<Link to="/app/work/pending"><Button>{txt('عرض الأعمال غير المتزامنة','View pending work')}</Button></Link>}<Link to={adminEntry?'/app/admin/records':'/app/work'}><Button>{adminEntry?txt('عرض كشف الأعمال','View work records'):txt('عرض سجل أعمالي','View my work')}</Button></Link><Link to={adminEntry?'/app/dashboard':'/app/my-dashboard'}><Button variant="outline">{adminEntry?txt('لوحة الإدارة','Management dashboard'):txt('العودة للوحة الموظف','Back to my dashboard')}</Button></Link></div></section>:<form onSubmit={submit} className="rounded-2xl border border-brand-border bg-white p-4 shadow-subtle sm:p-6 lg:p-7" noValidate>
      <header className="mb-5 border-b border-brand-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-subheading text-brand-plum">{adminEntry?txt('لوحة الإدارة · تسجيل عمل لموظف','Administration · Add work for an employee'):txt('بوابة الموظف · تسجيل يومي','Employee portal · Daily log')}</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{adminEntry?txt('إضافة عمل لموظف','Add work for an employee'):txt('إضافة عمل جديد','Add new work')}</h1></div><span className="inline-flex items-center gap-2 rounded-full bg-brand-plum/10 px-3 py-1.5 text-xs font-subheading text-brand-plum"><CalendarDays size={15}/><time dateTime={selectedDate} dir="ltr">{selectedDate}</time></span></div>
        <p className="mt-3 rounded-lg border border-brand-magenta/20 bg-brand-magenta/5 px-3 py-2 text-sm font-medium">{txt('التسجيل متاح لليوم الحالي فقط. إذا فاتك يوم سابق، يلزم استثناء فردي معتمد لذلك التاريخ.','Entries are for today only. A prior date requires an approved individual exception.')}</p>
      </header>

      <div className="space-y-5">
        <label className="block text-sm"><span className="mb-1.5 block font-bold">{txt('اسم الموظف','Employee name')}</span>{adminEntry?<span className="flex min-h-12 items-center gap-2 rounded-lg border border-brand-border bg-white px-3"><UserRound size={17} className="text-brand-plum"/><select aria-label="اختيار الموظف" className="min-h-11 flex-1 bg-transparent" value={targetUserId} onChange={event=>setTargetUserId(event.target.value)}>{employeeOptions.map(user=><option key={user.id} value={user.id}>{user.arabicName}</option>)}</select></span>:<span className="flex min-h-12 items-center gap-2 rounded-lg border border-brand-magenta/25 bg-brand-magenta/5 px-3 font-subheading text-brand-plum"><UserRound size={17}/>{ar?currentUser.arabicName:currentUser.englishName}<span className="ms-auto text-xs text-brand-charcoal/60">{txt('حسابك الحالي','Current account')}</span></span>}</label>

        <section className="rounded-xl border border-brand-border p-3 sm:p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-bold">{txt('تاريخ العمل','Work date')}</h2><time className="text-xs text-brand-charcoal/70" dateTime={selectedDate} dir="ltr">{selectedDate}</time></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{dateParts.map(part=><label key={part.label} className="block text-xs font-semibold text-brand-charcoal">{part.label}<input readOnly value={part.value} className="mt-1 min-h-11 w-full rounded-input border border-brand-border bg-brand-lightGray/30 px-3 text-sm font-normal text-brand-darkText"/></label>)}</div>{allowedDates.length>1&&<div className="mt-3 flex flex-wrap items-center gap-3"><label className="text-xs font-semibold">{txt('تاريخ الاستثناء المعتمد','Approved exception date')}<select aria-label={txt('اختر تاريخ العمل','Select work date')} className="ms-2 min-h-10 rounded-input border border-brand-border bg-white px-3" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}>{allowedDates.map(d=><option key={d} value={d}>{d}{d!==frozenDate?' · '+txt('استثناء معتمد','Approved exception'):''}</option>)}</select></label><Link to="/app/my-exceptions" className="text-xs text-brand-plum underline">{txt('عرض استثناءاتي','View my exceptions')}</Link></div>}</section>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><span className="block text-sm font-bold">{txt('وقت الإدخال','Entry time')}</span><span className="flex min-h-12 items-center gap-2 rounded-lg border border-brand-border bg-brand-lightGray/30 px-3 text-sm"><Clock3 size={17} className="text-brand-plum"/><time dir="ltr">09:15 AM</time><span className="ms-auto text-[11px] text-brand-charcoal/60">{txt('وقت تجريبي ثابت','Fixed demo time')}</span></span></div>
          <Select label={txt('طبيعة العمل','Nature of work')} value={location} onChange={e=>setLocation(e.target.value as 'OFFICE'|'FIELD')} options={[{value:'OFFICE',label:txt('مكتبي','Office')},{value:'FIELD',label:txt('ميداني','Field')}]}/>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select label={txt('المنطقة','Work area')} value={area} onChange={e=>setArea(e.target.value)} requiredIndicator placeholder={txt('اختر المنطقة','Select an area')} options={[{value:'شمال قطاع غزة',label:txt('شمال قطاع غزة','North Gaza')},{value:'جنوب قطاع غزة',label:txt('جنوب قطاع غزة','South Gaza')}]}/>
        </div>

        <Textarea label={txt('طبيعة العمل / التفاصيل','Work details')} value={description} onChange={e=>setDescription(e.target.value)} rows={5} maxLength={300} dir="rtl" requiredIndicator placeholder={txt('اكتب تفاصيل العمل باللغة العربية...','Enter work details in Arabic...')}/>
        {suggestions.length>0&&<div className="-mt-3"><p className="mb-2 text-xs text-brand-charcoal/70">{txt('أعمال سابقة','Previous work')}</p><div className="flex flex-wrap gap-2">{suggestions.map(s=><button key={s} type="button" onClick={()=>setDescription(s)} className="min-h-9 rounded-full border border-brand-border px-3 text-xs hover:border-brand-plum hover:text-brand-plum">{s}</button>)}</div></div>}

        <details className="rounded-xl border border-brand-border px-4 py-3"><summary className="cursor-pointer text-sm font-subheading font-bold">{txt('المخرجات والربط الإداري (اختياري)','Outputs and administrative links (optional)')}</summary><div className="mt-4 space-y-4"><TextField label={txt('رابط مخرجات Google Drive','Google Drive output link')} type="url" dir="ltr" value={drive} onChange={e=>setDrive(e.target.value)} error={error==='url'?txt('أدخل رابط Google Drive صالحاً. لا يمكن رفع الملفات هنا.','Enter a valid Google Drive URL. File uploads are not supported.'):undefined} helperText={txt('روابط Google Drive فقط؛ لا يمكن رفع ملفات من هذه الشاشة.','Google Drive links only; files cannot be uploaded here.')}/><div className="grid gap-4 md:grid-cols-2"><Select label={txt('التكليف المرتبط','Related assignment')} value={taskId} onChange={e=>setTaskId(e.target.value)} options={options(tasks.filter(t=>!t.isDraft).map(t=>({id:t.id,titleAr:t.titleAr,titleEn:t.titleEn})))}/><Select label={txt('المشروع المرتبط','Related project')} value={projectId} onChange={e=>setProjectId(e.target.value)} options={options(projects.map(p=>({id:p.id,titleAr:p.titleAr,titleEn:p.titleEn})))}/></div></div></details>

        {duplicate&&<p role="status" className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><AlertCircle size={18} className="shrink-0"/>{txt('تنبيه: يوجد سجل اليوم بعنوان مشابه. سيطلب تأكيدك قبل إضافة آخر.','A similar entry exists for today. Confirmation is required to add another.')}</p>}
        {error==='required'&&<p role="alert" className="text-sm text-red-700">{txt('أكمل تفاصيل العمل والمنطقة.','Complete the work details and area.')}</p>}
        <div className="flex flex-wrap gap-3 border-t border-brand-border pt-5"><Button type="submit" isLoading={saving} disabled={saving||!description.trim()||!area.trim()} leftIcon={<Clock3 size={17}/>}>{saving?txt('جارٍ الحفظ…','Saving…'):txt('حفظ العمل','Save work')}</Button><Button type="button" variant="outline" onClick={clearFields}>{txt('تفريغ الخانات','Clear fields')}</Button><Button type="button" variant="ghost" onClick={()=>{if(!dirty||window.confirm(txt('إلغاء التغييرات غير المحفوظة؟','Discard unsaved changes?')))navigate(-1);}}>{txt('إلغاء','Cancel')}</Button></div>
        <details className="text-xs text-brand-charcoal/65"><summary className="cursor-pointer">{txt('تفاصيل قاعدة التاريخ','Date rule details')}</summary><p className="mt-2">{txt('قاعدة اليوم فقط مؤقتة وتحل محل قاعدة 7 أيام في مسودة SRS، بانتظار الاعتماد الرسمي. لا يمكن تسجيل تاريخ سابق دون استثناء صادر من ADMIN.','The today-only rule is provisional and supersedes the SRS draft’s 7-day rule, pending formal approval. Earlier dates require an ADMIN-issued exception.')}</p></details>
      </div>
    </form>}
  </main>;
};
