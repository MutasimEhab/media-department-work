import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export const AssignmentDetail: React.FC<{review?: boolean}> = ({ review = false }) => {
  const { language, currentUser, tasks, updateTask, canAccess } = useApp();
  const { id = '' } = useParams();
  const task = tasks.find(item => item.id === id);
  const ar = language === 'ar';
  const tx = (a: string, e: string) => ar ? a : e;
  const manager = canAccess('manage_assignments') || canAccess('review_assignments');
  const mine = task?.recipients.find(recipient => recipient.userId === currentUser.id);
  const [urls, setUrls] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [modal, setModal] = useState(false);
  const [flag, setFlag] = useState(false);
  const [filter, setFilter] = useState('');
  useEscapeKey(modal, () => setModal(false));

  if (!task) return <Card>{tx('التكليف غير موجود.','Assignment not found.')}</Card>;
  if (review && !manager) return <Card>{tx('غير مصرح بعرض المراجعة.','You are not authorized to review assignments.')}</Card>;
  if (!manager && !mine) return <Card>{tx('ليس لديك صلاحية لعرض هذا التكليف.','You are not assigned to this task.')}</Card>;

  const updateRecipient = (userId: string, fn: (recipient: any) => any) => updateTask(task.id, current => ({
    ...current,
    recipients: current.recipients.map(recipient => recipient.userId === userId ? fn(recipient) : recipient),
  }));
  const overdue = task.deadline.slice(0, 10) < '2026-10-31' && task.recipients.some(recipient => recipient.status !== 'APPROVED');
  const driveLinks = urls.split(/[\n,]+/).map(value => value.trim()).filter(Boolean);
  const validLinks = driveLinks.length > 0 && driveLinks.every(value => /^https:\/\/drive\.google\.com\//.test(value));
  const setStatus = (status: string) => mine && updateRecipient(mine.userId, recipient => ({ ...recipient, status, statusUpdatedAt: '2026-10-31 09:15 AM' }));

  return <main className="mx-auto max-w-4xl space-y-5">
    <header className="app-page-heading"><span className="text-xs font-mono text-brand-plum">{task.id}</span><h1 className="mt-2 text-2xl font-bold">{ar?task.titleAr:task.titleEn}</h1><p>{ar?task.creatorNameAr:task.creatorNameEn} · {tx(task.priority,task.priority)} · <time dir="ltr">{task.deadline}</time> {overdue&&<b className="text-brand-plum">{tx('متأخر','Overdue')}</b>}</p></header>
    <Card title={tx('تفاصيل التكليف','Assignment details')}><p>{ar?task.descriptionAr:task.descriptionEn}</p><p className="mt-3">{tx('المكلفون','Assignees')}: {task.recipients.map(recipient=>ar?recipient.userNameAr:recipient.userNameEn).join('، ')}</p></Card>

    {!review&&mine&&<>
      <Card title={tx('تقدمك الشخصي','Your progress')}>
        <div className="flex flex-wrap gap-2">{['Sent','Received','In Progress','Submitted','Approved'].map((status,index)=><span className={`rounded-full border px-3 py-2 ${(['RECEIVED','IN_PROGRESS','SUBMITTED','APPROVED'].indexOf(mine.status)>=index)?'border-brand-plum text-brand-plum':''}`} key={status}>{tx(['أرسل','استلم','قيد التنفيذ','تم التسليم','معتمد'][index],status)}</span>)}</div>
        <div className="mt-4 flex flex-wrap gap-2">{mine.status==='RECEIVED'&&<Button onClick={()=>setStatus('IN_PROGRESS')}>{tx('بدء العمل','Start work')}</Button>}{mine.status==='IN_PROGRESS'&&<Button onClick={()=>setModal(true)}>{tx('تسليم العمل','Submit work')}</Button>}</div>
        <label className="mt-4 flex items-center gap-2"><input type="checkbox" checked={flag} onChange={event=>setFlag(event.target.checked)}/>{tx('الإبلاغ عن مشكلة في التكليف','Flag an issue')}</label>
        {flag&&<p className="mt-2 text-sm text-brand-charcoal/70">{tx('تم تحديد المشكلة للمتابعة في هذه المعاينة.','Issue marked for follow-up in this preview.')}</p>}
      </Card>
      <Card title={tx('سجل التسليم','Submission history')}><p>{mine.submissionNote||tx('لا توجد ملاحظات تسليم.','No submission notes.')}</p>{(mine.submissionLinks||[mine.submissionLink].filter(Boolean) as string[]).map((url,index)=><p key={url}><a className="underline text-brand-plum" href={url} target="_blank" rel="noreferrer">{tx('رابط تجريبي','Demo link')} {index+1}</a></p>)}{mine.firstSubmittedAt&&<p>{tx('أول تسليم','First submitted')}: {mine.firstSubmittedAt}</p>}</Card>
    </>}

    {review&&<section className="space-y-3"><Card title={tx('مراجعة حسب المستلم','Review by recipient')}><div className="space-y-4">{task.recipients.map(recipient=><article className="rounded-lg border border-brand-border p-4" key={recipient.userId}><h2 className="font-bold">{ar?recipient.userNameAr:recipient.userNameEn} · {tx(recipient.status,recipient.status)}</h2>{recipient.submissionNote&&<p className="mt-2" dir="rtl">{recipient.submissionNote}</p>}{(recipient.submissionLinks||[recipient.submissionLink].filter(Boolean) as string[]).map(url=><p key={url}><a className="break-all underline text-brand-plum" href={url} target="_blank" rel="noreferrer">{url}</a></p>)}{recipient.status==='SUBMITTED'?<div className="mt-3 flex flex-wrap gap-2"><Button onClick={()=>updateRecipient(recipient.userId,current=>({...current,status:'APPROVED',reviewedBy:currentUser.id}))}>{tx('اعتماد','Approve')}</Button><input className="rounded-input border border-brand-border p-2" dir="rtl" placeholder={tx('سبب الإعادة مطلوب بالعربية','Enter return reason in Arabic')} value={filter===recipient.userId?reason:''} onFocus={()=>setFilter(recipient.userId)} onChange={event=>setReason(event.target.value)}/><Button variant="outline" disabled={!reason.trim()} onClick={()=>updateRecipient(recipient.userId,current=>({...current,status:'RETURNED_FOR_REVISION',reviewedBy:currentUser.id,reviewNote:reason}))}>{tx('إعادة للتعديل','Return for revision')}</Button></div>:<p className="mt-2 text-sm">{tx('لا يوجد تسليم للمراجعة.','No submission to review.')}</p>}</article>)}</div></Card>
      <Card title={tx('إجراءات التكليف','Assignment actions')}><p>{tx('سياسة الإلغاء غير محسومة؛ الإجراء التجريبي يحتاج سبباً وتأكيداً.','Cancellation policy is unresolved; demo action requires a reason and confirmation.')}</p><input className="mt-2 rounded-input border border-brand-border p-2" dir="rtl" placeholder={tx('سبب الإلغاء بالعربية','Cancellation reason in Arabic')} value={filter==='cancel'?reason:''} onFocus={()=>setFilter('cancel')} onChange={event=>setReason(event.target.value)}/><Button className="mt-2" variant="outline" disabled={!reason.trim()} onClick={()=>window.confirm(tx('إلغاء التكليف في بيانات العرض؟','Cancel this demo assignment?'))&&updateTask(task.id,current=>({...current,isDraft:true}))}>{tx('إلغاء تجريبي','Demo cancel')}</Button></Card>
    </section>}

    <Card title={tx('النشاط والتعليقات','Activity and comments')}><p>2026-10-31 09:15 AM · {task.id} · {tx('تم فتح سجل التكليف التجريبي','Demo assignment detail opened')}</p><p>{tx('التعليقات محصورة بالمكلف والمراجعين المخولين. لا توجد تعليقات إضافية في العينة.','Comments are limited to the assignee and authorized reviewers. No additional seeded comments.')}</p></Card>

    {modal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><Card title={tx('تسليم العمل عبر Google Drive','Submit work via Google Drive')} className="w-full max-w-xl"><p>{tx('أدخل رابطاً أو أكثر، رابط واحد في كل سطر.','Enter one or more URLs, one per line.')}</p><textarea className="mt-2 w-full rounded-input border border-brand-border p-3" rows={3} dir="ltr" value={urls} onChange={event=>setUrls(event.target.value)}/><label className="mt-3 block text-sm">{tx('ملاحظة التسليم بالعربية (اختياري)','Submission note in Arabic (optional)')}<textarea className="mt-1 w-full rounded-input border border-brand-border p-3" rows={2} dir="rtl" value={note} onChange={event=>setNote(event.target.value)}/></label><div className="mt-3 flex gap-2"><Button disabled={!validLinks} onClick={()=>{if(mine){updateRecipient(mine.userId,recipient=>({...recipient,status:'SUBMITTED',submissionLinks:driveLinks,submissionLink:driveLinks[0],submissionNote:note,firstSubmittedAt:'2026-10-31 09:15 AM',statusUpdatedAt:'2026-10-31 09:15 AM'}));setModal(false)}}}>{tx('تأكيد التسليم','Confirm submission')}</Button><Button variant="outline" onClick={()=>setModal(false)}>{tx('إلغاء','Cancel')}</Button></div>{urls&&!validLinks&&<p className="mt-2 text-sm text-red-700">{tx('تقبل روابط Google Drive فقط.','Google Drive URLs only.')}</p>}</Card></div>}
  </main>;
};
