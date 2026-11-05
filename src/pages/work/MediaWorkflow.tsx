import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageCheck, Send, ClipboardList } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

export const MediaWorkflow: React.FC = () => {
  const { currentUser, tasks, projects, canAccess } = useApp();
  const [query, setQuery] = useState('');
  const manager = canAccess('manage_assignments');
  const rows = useMemo(() => tasks.filter(task => task.type === 'SOCIAL_MEDIA' && !task.isDraft)
    .flatMap(task => task.recipients.filter(recipient => manager || recipient.userId === currentUser.id).map(recipient => ({ task, recipient })))
    .filter(row => !query || `${row.task.titleAr} ${row.recipient.userNameAr} ${row.task.id}`.toLowerCase().includes(query.toLowerCase())), [tasks, manager, currentUser.id, query]);
  const submitted = rows.filter(row => ['SUBMITTED','APPROVED'].includes(row.recipient.status)).length;
  const approved = rows.filter(row => row.recipient.status === 'APPROVED').length;
  const statusLabel = (status: string) => ({ RECEIVED: 'تم الاستلام', IN_PROGRESS: 'قيد التنفيذ', SUBMITTED: 'بانتظار المراجعة', APPROVED: 'معتمد', RETURNED_FOR_REVISION: 'يحتاج استكمال' }[status] || status);
  return <main className="space-y-5">
    <header className="app-page-heading"><h1 className="mt-2 text-2xl font-bold">المواد الإعلامية</h1><p>متابعة المواد الإعلامية المكلّف بها ومراجعة تسليمها واعتمادها.</p></header>
    <Card title="إحصائية مواد السوشيال ميديا" subtitle="تتبع المواد المطلوبة وروابط التسليم لكل تكليف." action={<PackageCheck className="text-brand-plum"/>}>
      <div className="overflow-x-auto rounded-xl border border-brand-border"><table className="w-full min-w-[560px] text-sm"><thead className="bg-brand-magenta text-white"><tr><th className="p-3 text-start">الموظف</th><th className="p-3">مواد/روابط تم تسليمها</th><th className="p-3">تم استلامها</th><th className="p-3">تم نشرها</th></tr></thead><tbody>{rows.length ? rows.map(({task,recipient})=><tr key={`${task.id}-${recipient.userId}`} className="border-t border-brand-border"><td className="p-3"><b>{recipient.userNameAr}</b><small className="block text-brand-charcoal/70">{task.titleAr}</small></td><td className="p-3 text-center">{recipient.submissionLinks?.length || (recipient.submissionLink ? 1 : 0)}</td><td className="p-3 text-center">{['SUBMITTED','APPROVED'].includes(recipient.status)?1:0}</td><td className="p-3 text-center">{recipient.status==='APPROVED'?1:0}</td></tr>) : <tr><td colSpan={4} className="p-5 text-center">لا توجد مواد إعلامية مسندة حالياً.</td></tr>}</tbody></table></div>
    </Card>
    <Card title="المواد الإعلامية" subtitle={manager?'مواد السوشيال ميديا والمواد المؤسسية الظاهرة حسب صلاحيات الدور.':'المواد التي أُسندت إليك ومتابعة حالة تسليمها.'}>
      <div className="mb-4 flex flex-wrap gap-3"><input className="min-h-11 flex-1 rounded-input border border-brand-border bg-transparent px-3" value={query} onChange={event=>setQuery(event.target.value)} placeholder="بحث بالمشروع أو الموظف أو التكليف"/><span className="self-center rounded-full border border-brand-border px-3 py-1 text-xs">{rows.length} مادة</span></div>
      <div className="space-y-3">{rows.map(({task,recipient})=>{
        const project=projects.find(item=>item.id===task.projectId);
        const links=recipient.submissionLinks?.length?recipient.submissionLinks:recipient.submissionLink?[recipient.submissionLink]:[];
        return <article key={`${task.id}-${recipient.userId}`} className="rounded-xl border border-brand-border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-brand-charcoal/70">{project?.titleAr||'بدون مشروع مرتبط'} · {task.id}</p><h2 className="mt-1 font-bold">{task.titleAr}</h2><p className="mt-1 text-sm">{recipient.userNameAr} · {task.deadline}</p></div><span className="rounded-full bg-brand-plum/10 px-3 py-1 text-xs text-brand-plum">{statusLabel(recipient.status)}</span></div><div className="mt-3 flex flex-wrap items-center gap-2">{links.length?links.map((link,index)=><a key={link} className="text-sm text-brand-plum underline" href={link} target="_blank" rel="noreferrer">فتح رابط التسليم {index+1}</a>):<span className="text-sm text-brand-charcoal/70">لا يوجد رابط تسليم بعد.</span>}<Link className="ms-auto" to={`/app/assignments/${task.id}`}><Button size="sm" variant="outline" leftIcon={<ClipboardList size={15}/>}>تفاصيل التكليف</Button></Link></div></article>;
      })}{!rows.length&&<p className="py-6 text-center text-sm text-brand-charcoal/70">لا توجد نتائج مطابقة.</p>}</div>
      <p className="mt-4 flex items-center gap-2 text-xs text-brand-charcoal/70"><Send size={14}/> إجمالي المواد المسلمة: {submitted} · المعتمدة: {approved}</p>
    </Card>
  </main>;
};
