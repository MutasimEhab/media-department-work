import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { TextField } from '../../components/ui/TextField';
import { Textarea } from '../../components/ui/Textarea';
import { EnglishDateInput } from '../../components/ui/EnglishDateInput';
import { useApp } from '../../context/AppContext';
import { Task, TaskPriority, TaskType } from '../../types';

const timeInput = (deadline?: string) => {
  const match = deadline?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return { hour: '05', minute: '00', period: 'PM' as const };
  return { hour: String(Number(match[1])).padStart(2, '0'), minute: match[2]!, period: match[3]!.toUpperCase() as 'AM'|'PM' };
};
const tomorrowInGaza = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const tomorrow = new Date(Date.UTC(year!, month! - 1, day! + 1));
  return tomorrow.toISOString().slice(0, 10);
};

export const AssignmentEditor: React.FC = () => {
  const { language, currentUser, users, tasks, saveTask, sendTask, today } = useApp();
  const ar = language === 'ar';
  const tx = (a: string, e: string) => ar ? a : e;
  const navigate = useNavigate();
  const { id } = useParams();
  const base = tasks.find(task => task.id === id);
  const [titleAr, setTitleAr] = useState(base?.titleAr || '');
  const [descriptionAr, setDescriptionAr] = useState(base?.descriptionAr || '');
  const [priority, setPriority] = useState<TaskPriority>(base?.priority || 'MEDIUM');
  const [type, setType] = useState<TaskType | ''>(base?.type || '');
  const [deadline, setDeadline] = useState(base?.deadline.split(' ')[0] || tomorrowInGaza(today));
  const [time, setTime] = useState(() => timeInput(base?.deadline));
  const [assignees, setAssignees] = useState<string[]>(base?.recipients.map(recipient => recipient.userId) || []);
  const [typeNames, setTypeNames] = useState({ normal: 'عادي', socialMedia: 'وسائل التواصل الاجتماعي' });
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const sentOnce = useRef(false);
  const activeUsers = users.filter(user => user.role === 'EMPLOYEE' && user.isActive);
  const recipientOptions = activeUsers.map(user => ({ value: user.id, label: `${ar ? user.arabicName : user.englishName} · ${ar ? user.jobTitleAr : user.jobTitleEn}` }));
  const minDate = tomorrowInGaza(today);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/system-settings', { credentials: 'include' })
      .then(async response => response.ok ? response.json() as Promise<{settings?:{assignmentTypeNames?:{normal?:string;socialMedia?:string}}}> : null)
      .then(payload => { if (!cancelled && payload?.settings?.assignmentTypeNames) setTypeNames(current => ({ ...current, ...payload.settings!.assignmentTypeNames })); })
      .catch(() => { /* Labels have readable defaults when settings are unavailable. */ });
    return () => { cancelled = true; };
  }, []);

  const makeTask = (isDraft: boolean): Task => ({
    id: base?.id || `TSK-${106 + tasks.filter(task => /^TSK-\d+$/.test(task.id)).length - 5}`,
    titleAr: titleAr.trim(),
    titleEn: titleAr.trim(),
    descriptionAr: descriptionAr.trim(),
    descriptionEn: descriptionAr.trim(),
    creatorId: currentUser.id,
    creatorNameAr: currentUser.arabicName,
    creatorNameEn: currentUser.englishName,
    priority,
    type: type || 'NORMAL',
    deadline: `${deadline} ${time.hour}:${time.minute} ${time.period}`,
    createdAt: new Date().toISOString(),
    isDraft,
    projectId: base?.projectId,
    reminderOptions: [],
    recipients: assignees.map(userId => {
      const user = users.find(candidate => candidate.id === userId)!;
      const previous = base?.recipients.find(recipient => recipient.userId === userId);
      return {
        userId,
        userNameAr: user.arabicName,
        userNameEn: user.englishName,
        status: previous?.status || 'RECEIVED',
        statusUpdatedAt: previous?.statusUpdatedAt || new Date().toISOString(),
      };
    }),
  });

  function validate(send: boolean) {
    if (!titleAr.trim()) { setError('title'); return false; }
    if (send && !descriptionAr.trim()) { setError('description'); return false; }
    if (deadline < minDate) { setError('date'); return false; }
    if (!/^(0[1-9]|1[0-2])$/.test(time.hour) || !/^[0-5]\d$/.test(time.minute)) { setError('time'); return false; }
    if (send && !assignees.length) { setError('assignees'); return false; }
    return true;
  }

  async function submit(send: boolean) {
    if (busy || sentOnce.current || !validate(send)) return;
    const confirmed = window.confirm(send
      ? tx(`إرسال التكليف إلى ${assignees.length} موظف؟ سيصل إشعار داخلي إلى كل مستلم.`, `Send this assignment to ${assignees.length} employee(s)? Each recipient will receive an internal notification.`)
      : tx('حفظ محتوى التكليف كمسودة؟', 'Save assignment content as a draft?'));
    if (!confirmed) return;
    setBusy(true);
    const task = makeTask(!send);
    setServerError('');
    const result = send ? await sendTask(task) : await saveTask(task);
    if (!result.ok) { setBusy(false); setServerError(result.message || 'تعذر حفظ التكليف.'); return; }
    if (send) sentOnce.current = true;
    setBusy(false);
    navigate('/app/assignments');
  }

  return <main className="max-w-4xl mx-auto space-y-5">
    <header className="app-page-heading">
      <h1 className="text-2xl font-bold mt-2">{id ? tx('تعديل مسودة التكليف', 'Edit assignment draft') : tx('إنشاء تكليف', 'Create assignment')}</h1>
      <p>{tx('أدخل بيانات التكليف باللغة العربية. يمكن تغيير لغة عرض الواجهة دون ترجمة النص الذي تكتبه.', 'Enter assignment content in Arabic. Changing the display language does not translate your text.')}</p>
    </header>

    <form onSubmit={event => event.preventDefault()} className="space-y-4">
      <Card title={tx('1. تفاصيل التكليف', '1. Assignment details')}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label={tx('عنوان التكليف','Assignment title')} value={titleAr} onChange={event => setTitleAr(event.target.value)} dir="rtl" requiredIndicator helperText={tx('اكتب العنوان بالعربية.','Enter the title in Arabic.')}/>
          <Textarea label={tx('وصف التكليف','Assignment description')} value={descriptionAr} onChange={event => setDescriptionAr(event.target.value)} dir="rtl" rows={3} helperText={tx('اكتب الوصف بالعربية.','Enter the description in Arabic.')}/>
          <label className="text-sm">{tx('الأولوية','Priority')}<select className="block w-full border rounded p-3 mt-1" value={priority} onChange={event => setPriority(event.target.value as TaskPriority)}>{[['LOW','منخفضة','Low'],['MEDIUM','متوسطة','Medium'],['HIGH','عالية','High'],['URGENT','عاجل','Urgent']].map(([value, arabic, english])=><option key={value} value={value}>{tx(arabic,english)}</option>)}</select></label>
          <fieldset className="text-sm"><legend>{tx('نوع التكليف (اختياري)','Assignment type (optional)')}</legend><div className="mt-2 flex flex-wrap gap-3">{([['NORMAL',typeNames.normal],['SOCIAL_MEDIA',typeNames.socialMedia]] as const).map(([value,label])=><label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border px-3 py-2"><input type="checkbox" checked={type===value} onChange={event=>setType(event.target.checked?value:type===value?'':type)}/>{label}</label>)}</div><p className="mt-1 text-xs text-brand-charcoal">{tx('يمكن ترك النوع دون تحديد أو اختيار نوع واحد.','Leave unselected or choose one type.')}</p></fieldset>
        </div>
      </Card>

      <Card title={tx('2. الموعد والمستلمون','2. Deadline and recipients')}>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">{tx('تاريخ الاستحقاق','Due date')}<EnglishDateInput className="mt-1 bg-white" ariaLabel={tx('تاريخ الاستحقاق','due date')} min={minDate} value={deadline} onChange={setDeadline} required/></label><fieldset><legend className="text-sm">{tx('وقت الاستحقاق (12 ساعة)','Due time (12-hour)')}</legend><div className="mt-1 flex gap-2" dir="ltr"><select aria-label="Hour" className="min-w-0 flex-1 rounded border p-3" value={time.hour} onChange={event=>setTime(current=>({...current,hour:event.target.value}))}>{Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')).map(hour=><option key={hour}>{hour}</option>)}</select><span className="self-center">:</span><select aria-label="Minute" className="min-w-0 flex-1 rounded border p-3" value={time.minute} onChange={event=>setTime(current=>({...current,minute:event.target.value}))}>{Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(minute=><option key={minute}>{minute}</option>)}</select><select aria-label="AM or PM" className="rounded border p-3" value={time.period} onChange={event=>setTime(current=>({...current,period:event.target.value as 'AM'|'PM'}))}><option value="AM">AM</option><option value="PM">PM</option></select></div></fieldset></div>
        <p className="text-xs mt-2">{tx(`أقرب تاريخ متاح: ${minDate} (بعد تاريخ اليوم ${today}).`, `Earliest allowed date: ${minDate} (after today ${today}).`)}</p>
        <div className="mt-4"><MultiSelect label={tx('الموظفون المكلفون','Assigned employees')} options={recipientOptions} value={assignees} onChange={setAssignees} requiredIndicator/><div className="flex flex-wrap gap-2 mt-3">{assignees.map(userId=>{const user=users.find(candidate=>candidate.id===userId);return user?<span className="rounded-full bg-brand-lightGray px-3 py-1 text-sm" key={userId}>{ar?user.arabicName:user.englishName}</span>:null})}</div></div>
      </Card>

      {error&&<p role="alert" className="p-3 border-s-4 border-brand-plum">{({title:'أدخل عنوان التكليف بالعربية.',description:'أدخل وصف التكليف بالعربية قبل الإرسال.',date:'اختر موعدًا مستقبليًا بعد تاريخ اليوم.',time:'اختر وقتاً صحيحاً للاستحقاق.',assignees:'اختر موظفًا واحدًا على الأقل.'} as Record<string,string>)[error]}</p>}
      {serverError&&<p role="alert" className="p-3 border-s-4 border-red-600">{serverError}</p>}
      <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" isLoading={busy} disabled={busy} onClick={()=>submit(false)}>{tx('حفظ كمسودة','Save draft')}</Button><Button type="button" isLoading={busy} disabled={busy} onClick={()=>submit(true)}>{tx('إرسال التكليف','Send assignment')}</Button><Button type="button" variant="ghost" onClick={()=>navigate('/app/assignments')}>{tx('إلغاء','Cancel')}</Button></div>
    </form>
  </main>;
};
