import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Textarea } from '../../components/ui/Textarea';
import { useApp } from '../../context/AppContext';

const projectStatusLabels: Record<string,string> = { IN_PROGRESS:'قيد التنفيذ', COMPLETED:'مكتمل', CLOSED:'مغلق', ON_HOLD:'متوقف مؤقتًا' };

export const ProjectWorkspace: React.FC = () => {
  const { language, currentUser, projects, tasks, users, updateProjects, frozenDate, canAccess } = useApp();
  const ar = language === 'ar';
  const tx = (a: string, e: string) => ar ? a : e;
  const { id } = useParams();
  const navigate = useNavigate();
  const selected = projects.find(project => project.id === id);
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newOwner, setNewOwner] = useState(currentUser.role === 'EMPLOYEE' ? currentUser.id : users.find(user => user.role === 'EMPLOYEE' && user.isActive)?.id || '');
  const [linkedTask, setLinkedTask] = useState('');
  const [newStage, setNewStage] = useState('');
  const [startDate, setStartDate] = useState(frozenDate);
  const [endDate, setEndDate] = useState('2026-12-31');
  const manager = canAccess('manage_projects');
  const scoped = projects.filter(project =>
    (manager || project.ownerId === currentUser.id || project.memberIds?.includes(currentUser.id)) &&
    (!owner || project.ownerId === owner) &&
    (!status || project.status === status) &&
    (!search || `${project.titleAr} ${project.titleEn}`.toLowerCase().includes(search.toLowerCase()))
  );

  if (id === 'new') return <main className="max-w-3xl mx-auto space-y-4">
    <header className="app-page-heading"><h1 className="text-2xl font-bold mt-2">{tx('إنشاء مشروع','Create project')}</h1><p>{tx('أدخل بيانات المشروع بالعربية. لغة العرض لا تغيّر النص الذي تكتبه.','Enter project content in Arabic. Display language does not change your text.')}</p></header>
    <Card title={tx('بيانات المشروع','Project details')}>
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault();
        if (!title.trim()) return;
        const user = users.find(candidate => candidate.id === newOwner) || currentUser;
        const projectId = `PRJ-${204 + projects.length - 3}`;
        const result = await updateProjects(items => [...items, {
          id: projectId,
          titleAr: title.trim(), titleEn: title.trim(),
          descriptionAr: description.trim(), descriptionEn: description.trim(),
          ownerId: user.id, ownerNameAr: user.arabicName, ownerNameEn: user.englishName,
          status: 'IN_PROGRESS', stages: [], relatedTaskId: linkedTask || undefined,
          startedAt: startDate, expectedEndDate: endDate,
        }]);
        if (!result.ok) return;
        navigate('/app/projects');
      }}>
        <TextField label={tx('اسم المشروع','Project name')} value={title} onChange={event=>setTitle(event.target.value)} dir="rtl" requiredIndicator helperText={tx('اكتب اسم المشروع بالعربية.','Enter the project name in Arabic.')}/>
        <Textarea label={tx('وصف المشروع','Project description')} value={description} onChange={event=>setDescription(event.target.value)} dir="rtl" rows={4} helperText={tx('اكتب الوصف بالعربية.','Enter the description in Arabic.')}/>
        <label className="block text-sm">{tx('الموظف المسؤول','Project owner')}<select className="mt-1 w-full rounded-input border border-brand-border p-3" value={newOwner} onChange={event=>setNewOwner(event.target.value)} disabled={!manager}>{users.filter(user=>user.role==='EMPLOYEE'&&user.isActive).map(user=><option key={user.id} value={user.id}>{ar?user.arabicName:user.englishName}</option>)}</select></label>
        <div className="grid gap-4 sm:grid-cols-2"><TextField label={tx('تاريخ البداية','Start date')} type="text" inputMode="numeric" dir="ltr" placeholder="YYYY-MM-DD" value={startDate} onChange={event=>setStartDate(event.target.value)}/><TextField label={tx('تاريخ الانتهاء المتوقع','Expected end date')} type="text" inputMode="numeric" dir="ltr" placeholder="YYYY-MM-DD" value={endDate} onChange={event=>setEndDate(event.target.value)}/></div>
        <label className="block text-sm">{tx('التكليف المرتبط','Related assignment')}<select className="mt-1 w-full rounded-input border border-brand-border p-3" value={linkedTask} onChange={event=>setLinkedTask(event.target.value)}><option value="">{tx('بدون تكليف مرتبط','No linked assignment')}</option>{tasks.filter(task=>!task.isDraft).map(task=><option key={task.id} value={task.id}>{task.id} · {ar?task.titleAr:task.titleEn}</option>)}</select></label>
        <div className="flex gap-2"><Button type="submit">{tx('حفظ المشروع','Save project')}</Button><Button type="button" variant="outline" onClick={()=>navigate('/app/projects')}>{tx('إلغاء','Cancel')}</Button></div>
      </form>
    </Card>
  </main>;

  if (id && !selected) return <Card>المشروع غير موجود.</Card>;
  if (id && selected && !manager && selected.ownerId !== currentUser.id && !selected.memberIds?.includes(currentUser.id)) return <Card>لا تملك صلاحية عرض هذا المشروع.</Card>;

  if (selected) {
    const canEdit = manager || selected.ownerId === currentUser.id;
    const completed = selected.stages.filter(stage=>stage.isCompleted).length;
    return <main className="mx-auto max-w-3xl space-y-4">
      <Link to="/app/projects" className="text-sm font-bold text-brand-plum underline">{tx('العودة إلى المشاريع','Back to projects')}</Link>
      <Card title={ar?selected.titleAr:selected.titleEn} subtitle={`${selected.id} · ${projectStatusLabels[selected.status]||'غير محدد'}`}>
        <p>{ar?selected.descriptionAr:selected.descriptionEn}</p><p className="mt-2">{tx('المالك','Owner')}: {ar?selected.ownerNameAr:selected.ownerNameEn}</p><p>{tx('الموعد المتوقع','Expected end')}: {selected.expectedEndDate||'—'}</p>
        {selected.relatedTaskId&&<Link className="mt-2 inline-block text-brand-plum underline" to={`/app/assignments/${selected.relatedTaskId}`}>{tx('التكليف المرتبط','Linked assignment')} {selected.relatedTaskId}</Link>}
        <div className="mt-4 h-3 rounded-full bg-brand-lightGray"><div className="h-3 rounded-full bg-brand-plum" style={{width:`${selected.stages.length?completed/selected.stages.length*100:0}%`}}/></div><p className="mt-2 text-sm">{completed} {tx('من','of')} {selected.stages.length} {tx('مراحل مكتملة','stages completed')}</p>
      </Card>
      <Card title={tx('مراحل المشروع','Project stages')}>
        <div className="space-y-2">{selected.stages.map((stage,index)=><div key={stage.id} className="flex items-center gap-2 rounded-xl border border-brand-border p-3"><button className="text-brand-plum" disabled={!canEdit||selected.status==='CLOSED'} aria-label={tx(stage.isCompleted?'إلغاء إكمال المرحلة':'إكمال المرحلة',stage.isCompleted?'Mark stage incomplete':'Complete stage')} onClick={()=>updateProjects(items=>items.map(project=>project.id===selected.id?{...project,stages:project.stages.map(item=>item.id===stage.id?{...item,isCompleted:!item.isCompleted,completedAt:!item.isCompleted?'2026-10-31 09:15 AM':undefined}:item)}:project))}>{stage.isCompleted?'✓':'○'}</button><span className="flex-1">{ar?stage.titleAr:stage.titleEn}</span><Button size="sm" variant="ghost" disabled={!canEdit||index===0} onClick={()=>updateProjects(items=>items.map(project=>{if(project.id!==selected.id)return project;const stages=[...project.stages];[stages[index-1],stages[index]]=[stages[index],stages[index-1]];return {...project,stages}}))}>↑</Button><Button size="sm" variant="ghost" disabled={!canEdit||index===selected.stages.length-1} onClick={()=>updateProjects(items=>items.map(project=>{if(project.id!==selected.id)return project;const stages=[...project.stages];[stages[index],stages[index+1]]=[stages[index+1],stages[index]];return {...project,stages}}))}>↓</Button></div>)}</div>
        {canEdit&&selected.status!=='CLOSED'&&<form className="mt-4 flex gap-2" onSubmit={event=>{event.preventDefault();if(!newStage.trim())return;updateProjects(items=>items.map(project=>project.id===selected.id?{...project,stages:[...project.stages,{id:Math.max(0,...project.stages.map(stage=>stage.id))+1,titleAr:newStage.trim(),titleEn:newStage.trim(),isCompleted:false}]}:project));setNewStage('')}}><TextField className="flex-1" value={newStage} onChange={event=>setNewStage(event.target.value)} dir="rtl" placeholder={tx('اسم المرحلة بالعربية','Stage name in Arabic')}/><Button type="submit">{tx('إضافة','Add')}</Button></form>}
      </Card>
      {(selected.status==='CLOSED'?currentUser.role==='ADMIN':manager)&&<Button variant="outline" onClick={()=>updateProjects(items=>items.map(project=>project.id===selected.id?{...project,status:project.status==='CLOSED'?'IN_PROGRESS':'CLOSED'}:project))}>{selected.status==='CLOSED'?tx('إعادة فتح (مدير النظام فقط)','Reopen (Admin only)'):tx('إغلاق المشروع','Close project')}</Button>}
    </main>;
  }

  return <main className="space-y-5"><header className="app-page-heading flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold mt-2">{tx('المشاريع','Projects')}</h1><p>{tx('تابع المشاريع والمراحل ونسبة الإنجاز.','Track projects, stages, and progress.')}</p></div>{manager&&<Link to="/app/projects/new"><Button>{tx('مشروع جديد','New project')}</Button></Link>}</header>
      <Card><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><input className="rounded-input border border-brand-border p-2.5" placeholder={tx('بحث باسم المشروع','Search projects')} value={search} onChange={event=>setSearch(event.target.value)} dir="rtl"/><select className="rounded-input border border-brand-border p-2.5" value={owner} onChange={event=>setOwner(event.target.value)}><option value="">{tx('كل الملاك','All owners')}</option>{users.filter(user=>user.role==='EMPLOYEE').map(user=><option key={user.id} value={user.id}>{user.arabicName}</option>)}</select><select className="rounded-input border border-brand-border p-2.5" value={status} onChange={event=>setStatus(event.target.value)}><option value="">{tx('كل الحالات','All statuses')}</option>{['IN_PROGRESS','COMPLETED','CLOSED','ON_HOLD'].map(value=><option key={value} value={value}>{projectStatusLabels[value]}</option>)}</select><Button size="sm" variant="ghost" onClick={()=>{setSearch('');setOwner('');setStatus('')}}>{tx('مسح الفلاتر','Reset filters')}</Button></div></Card>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{scoped.map(project=><Link to={`/app/projects/${project.id}`} key={project.id}><Card className="h-full hover:border-brand-plum" title={project.titleAr} subtitle={`${project.id} · ${projectStatusLabels[project.status]||'غير محدد'}`}><p>المالك: {project.ownerNameAr}</p><div className="mt-3 h-2 rounded-full bg-brand-lightGray"><div className="h-2 rounded-full bg-brand-plum" style={{width:`${project.stages.length?project.stages.filter(stage=>stage.isCompleted).length/project.stages.length*100:0}%`}}/></div><p className="mt-2 text-sm">{project.stages.filter(stage=>stage.isCompleted).length} من {project.stages.length} مراحل مكتملة</p><p className="text-xs text-brand-charcoal/70">النهاية المتوقعة: {project.expectedEndDate||'—'}</p></Card></Link>)}</section>
    {!scoped.length&&<Card>{tx('لا توجد مشاريع مطابقة.','No matching projects.')}</Card>}
  </main>;
};
