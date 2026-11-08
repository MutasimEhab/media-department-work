import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { TextField } from '../../components/ui/TextField';
import { Textarea } from '../../components/ui/Textarea';
import { useApp } from '../../context/AppContext';
import { Task, TaskPriority, TaskType } from '../../types';

const timeInput = (deadline?: string) => deadline?.match(/\d{1,2}:\d{2}\s?(?:AM|PM)/i)?.[0]?.replace(/\s+/g, ' ').replace(/AM/i,'ص').replace(/PM/i,'م') || '05:00 م';
const storedTime = (time: string) => time.trim().replace(/\s*ص$/,' AM').replace(/\s*م$/,' PM').trim().toUpperCase();

export const AssignmentEditor: React.FC = () => {
  const { language, currentUser, users, tasks, saveTask, sendTask, frozenDate } = useApp();
  const ar = language === 'ar';
  const tx = (a: string, e: string) => ar ? a : e;
  const navigate = useNavigate();
  const { id } = useParams();
  const base = tasks.find(task => task.id === id);
  const [titleAr, setTitleAr] = useState(base?.titleAr || '');
  const [descriptionAr, setDescriptionAr] = useState(base?.descriptionAr || '');
  const [priority, setPriority] = useState<TaskPriority>(base?.priority || 'MEDIUM');
  const [type, setType] = useState<TaskType>(base?.type || 'NORMAL');
  const [deadline, setDeadline] = useState(base?.deadline.split(' ')[0] || '2026-11-05');
  const [time, setTime] = useState(timeInput(base?.deadline));
  const [assignees, setAssignees] = useState<string[]>(base?.recipients.map(recipient => recipient.userId) || []);
  const [referenceUrl, setReferenceUrl] = useState(base?.referenceUrl || '');
  const [email, setEmail] = useState(base?.emailDelivery || false);
  const [sms, setSms] = useState(base?.smsDelivery || false);
  const [reminders, setReminders] = useState(base?.reminderOptions || ['24h', '2h', 'daily']);
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [simulateError, setSimulateError] = useState(false);
  const sentOnce = useRef(false);
  const activeUsers = users.filter(user => user.role === 'EMPLOYEE' && user.isActive);
  const recipientOptions = activeUsers.map(user => ({ value: user.id, label: `${ar ? user.arabicName : user.englishName} · ${ar ? user.jobTitleAr : user.jobTitleEn}` }));
  const tomorrow = new Date(`${frozenDate}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);
  const urlIsValid = !referenceUrl || /^https:\/\/drive\.google\.com\//.test(referenceUrl.trim());

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
    type,
    deadline: `${deadline} ${storedTime(time)}`,
    createdAt: '2026-10-31 09:15 AM',
    isDraft,
    projectId: base?.projectId,
    referenceUrl: referenceUrl.trim() || undefined,
    reminderOptions: reminders,
    emailDelivery: email,
    smsDelivery: sms,
    recipients: assignees.map(userId => {
      const user = users.find(candidate => candidate.id === userId)!;
      const previous = base?.recipients.find(recipient => recipient.userId === userId);
      return {
        userId,
        userNameAr: user.arabicName,
        userNameEn: user.englishName,
        status: previous?.status || 'RECEIVED',
        statusUpdatedAt: previous?.statusUpdatedAt || '2026-10-31 09:15 AM',
      };
    }),
  });

  function validate(send: boolean) {
    if (!titleAr.trim()) { setError('title'); return false; }
    if (send && !descriptionAr.trim()) { setError('description'); return false; }
    if (deadline < minDate) { setError('date'); return false; }
    if (!/^((0?[1-9]|1[0-2]):[0-5]\d)\s?(ص|م)$/.test(time.trim())) { setError('time'); return false; }
    if (!urlIsValid) { setError('url'); return false; }
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
    await new Promise(resolve => window.setTimeout(resolve, 500));
    if (simulateError) { setBusy(false); setError('network'); return; }
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
          <label className="text-sm">{tx('نوع التكليف','Assignment kind')}<select className="block w-full border rounded p-3 mt-1" value={type} onChange={event => setType(event.target.value as TaskType)}><option value="NORMAL">{tx('عادي','Normal')}</option><option value="SOCIAL_MEDIA">{tx('وسائل التواصل الاجتماعي','Social media')}</option></select></label>
        </div>
      </Card>

      <Card title={tx('2. الموعد والمستلمون','2. Deadline and recipients')}>
        <div className="grid gap-4 sm:grid-cols-2"><TextField label={tx('تاريخ الاستحقاق','Due date')} type="text" inputMode="numeric" dir="ltr" placeholder="YYYY-MM-DD" min={minDate} value={deadline} onChange={event => setDeadline(event.target.value)} requiredIndicator/><TextField label="الوقت (مثال: ٠٥:٠٠ م)" type="text" inputMode="text" dir="rtl" placeholder="٠٥:٠٠ م" value={time} onChange={event => setTime(event.target.value)} requiredIndicator/></div>
        <p className="text-xs mt-2">{tx(`أقرب تاريخ متاح: ${minDate} (بعد اليوم التجريبي ${frozenDate}).`, `Earliest allowed date: ${minDate} (after demo today ${frozenDate}).`)}</p>
        <div className="mt-4"><MultiSelect label={tx('الموظفون المكلفون','Assigned employees')} options={recipientOptions} value={assignees} onChange={setAssignees} requiredIndicator/><div className="flex flex-wrap gap-2 mt-3">{assignees.map(userId=>{const user=users.find(candidate=>candidate.id===userId);return user?<span className="rounded-full bg-brand-lightGray px-3 py-1 text-sm" key={userId}>{ar?user.arabicName:user.englishName}</span>:null})}</div></div>
      </Card>

      <Card title={tx('3. المراجع والتنبيهات','3. References and reminders')}>
        <TextField label={tx('رابط Google Drive مرجعي (اختياري)','Reference Google Drive URL (optional)')} type="url" dir="ltr" value={referenceUrl} onChange={event => setReferenceUrl(event.target.value)} helperText={tx('رابط Google Drive فقط، لا رفع للملفات.','Google Drive links only; no file uploads.')}/>
        <p className="font-bold mt-4">{tx('التذكيرات','Reminders')}</p>
        <div className="flex flex-wrap gap-4 mt-2">{[['24h',tx('قبل 24 ساعة','24 hours before')],['2h',tx('قبل ساعتين','2 hours before')],['daily',tx('يومياً بعد التأخير','Daily when overdue')]].map(([value,label])=><label key={value} className="flex items-center gap-2"><input type="checkbox" checked={reminders.includes(value)} onChange={event=>setReminders(current=>event.target.checked?[...current,value]:current.filter(item=>item!==value))}/>{label}</label>)}</div>
        <p className="font-bold mt-4">{tx('قنوات التوصيل الاختيارية','Optional delivery channels')}</p>
        <div className="flex flex-wrap gap-4 mt-2"><label><input type="checkbox" checked={email} onChange={event=>setEmail(event.target.checked)}/> Email · {tx('محاكاة فقط','simulated only')}</label><label><input type="checkbox" checked={sms} onChange={event=>setSms(event.target.checked)}/> SMS · {tx('محاكاة فقط','simulated only')}</label></div>
        <p className="text-sm mt-2">{tx('الإشعارات الداخلية مفعّلة دائماً. البريد وSMS لا يرسلان فعلياً.','Internal notifications are always on. Email and SMS are not actually sent.')}</p>
      </Card>

      <Card title={tx('معاينة الحالة','Preview state')}><label className="flex gap-2"><input type="checkbox" checked={simulateError} onChange={event=>setSimulateError(event.target.checked)}/>{tx('محاكاة خطأ اتصال عند الحفظ','Simulate a network error on save')}</label></Card>
      {error&&<p role="alert" className="p-3 border-s-4 border-brand-plum">{({title:'أدخل عنوان التكليف بالعربية.',description:'أدخل وصف التكليف بالعربية قبل الإرسال.',date:'اختر موعدًا مستقبليًا بعد تاريخ اليوم التجريبي.',time:'أدخل الوقت بصيغة ١٢ ساعة مثل ٠٥:٠٠ م.',url:'يجب أن يبدأ الرابط بـ https://drive.google.com/.',assignees:'اختر موظفًا واحدًا على الأقل.',network:'تعذر الاتصال التجريبي. احتفظنا بالمحتوى؛ أعد المحاولة.'} as Record<string,string>)[error]}</p>}
      {serverError&&<p role="alert" className="p-3 border-s-4 border-red-600">{serverError}</p>}
      <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" isLoading={busy} disabled={busy} onClick={()=>submit(false)}>{tx('حفظ كمسودة','Save draft')}</Button><Button type="button" isLoading={busy} disabled={busy} onClick={()=>submit(true)}>{tx('إرسال التكليف','Send assignment')}</Button><Button type="button" variant="ghost" onClick={()=>navigate('/app/assignments')}>{tx('إلغاء','Cancel')}</Button></div>
    </form>
  </main>;
};
