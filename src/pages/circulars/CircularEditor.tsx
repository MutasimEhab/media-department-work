import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { useApp } from '../../context/AppContext';
import { Circular } from '../../types';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export const CircularEditor: React.FC = () => {
  const { language, currentUser, users, circulars, saveCircular } = useApp();
  const ar = language === 'ar';
  const tx = (a: string, e: string) => ar ? a : e;
  const { id } = useParams();
  const navigate = useNavigate();
  const base = circulars.find(circular => circular.id === id);
  const immutable = Boolean(base && !base.isDraft);
  const [title, setTitle] = useState(base?.isDraft ? base.titleAr : '');
  const [body, setBody] = useState(base?.isDraft ? base.contentAr : '');
  const [audience, setAudience] = useState<'EVERYONE'|'EMPLOYEES_ONLY'|'MANAGEMENT_ONLY'|'SPECIFIC'>(base?.isDraft ? base.targetAudience : 'EMPLOYEES_ONLY');
  const [selected, setSelected] = useState<string[]>(base?.isDraft ? base.recipients.map(recipient => recipient.userId) : []);
  const [email, setEmail] = useState(base?.emailDelivery ?? false);
  const [sms, setSms] = useState(base?.smsDelivery ?? false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  useEscapeKey(confirm, () => setConfirm(false));

  const activeEmployees = users.filter(user => user.isActive && user.role === 'EMPLOYEE');
  const activeUsers = users.filter(user => user.isActive);
  const recipients = audience === 'SPECIFIC' ? selected : audience === 'EMPLOYEES_ONLY'
    ? activeEmployees.map(user => user.id)
    : audience === 'MANAGEMENT_ONLY'
      ? activeUsers.filter(user => user.role !== 'EMPLOYEE').map(user => user.id)
      : activeUsers.map(user => user.id);
  const recipientOptions = activeUsers.map(user => ({ value: user.id, label: ar ? user.arabicName : user.englishName }));

  async function save(publish: boolean) {
    if (!title.trim() || !body.trim()) { setError('content'); return; }
    if (publish && !recipients.length) { setError('recipients'); return; }
    const targets = recipients.map(userId => {
      const user = users.find(candidate => candidate.id === userId)!;
      return { userId, userNameAr: user.arabicName, userNameEn: user.englishName, hasAcknowledged: false };
    });
    const circular: Circular = {
      id: base?.id && !immutable ? base.id : `CIR-${304 + circulars.filter(item => /^CIR-\d+$/.test(item.id)).length - 3}`,
      titleAr: title.trim(),
      titleEn: title.trim(),
      contentAr: body.trim(),
      contentEn: body.trim(),
      issuerId: currentUser.id,
      issuerNameAr: currentUser.arabicName,
      issuerNameEn: currentUser.englishName,
      issuedAt: '2026-10-31 09:15 AM',
      targetAudience: audience,
      isDraft: !publish,
      recipients: targets,
      parentId: immutable ? base?.id : base?.parentId,
      emailDelivery: email,
      smsDelivery: sms,
    };
    const result = await saveCircular(circular, publish);
    if (!result.ok) return;
    setConfirm(false);
    navigate('/app/circulars');
  }

  return <main className="max-w-3xl mx-auto space-y-4">
    <header className="app-page-heading"><h1 className="text-2xl font-bold mt-2">{immutable ? tx('نشر تصحيح للتعميم','Publish a correction') : tx('إنشاء تعميم','Compose circular')}</h1><p>{tx('اكتب عنوان التعميم ومحتواه بالعربية. لغة العرض لا تغيّر النص الذي تكتبه.','Write the circular title and content in Arabic. Display language does not change your text.')}</p></header>
    {immutable&&<Card>{tx(`المحتوى المنشور ${id} غير قابل للتعديل. سيتم إنشاء تصحيح مرتبط به.`,`Published content ${id} is immutable. A correction will be created as a new circular.`)}</Card>}
    <Card title={tx('المحتوى','Content')}>
      <label className="block text-sm font-subheading">{tx('عنوان التعميم','Circular title')}<input className="mt-1 block w-full rounded-input border border-brand-border p-3" value={title} onChange={event=>setTitle(event.target.value)} dir="rtl" disabled={immutable} placeholder={tx('اكتب العنوان بالعربية','Enter the title in Arabic')}/></label>
      <label className="mt-4 block text-sm font-subheading">{tx('نص التعميم','Circular content')}<textarea className="mt-1 block w-full rounded-input border border-brand-border p-3" rows={6} value={body} onChange={event=>setBody(event.target.value)} dir="rtl" disabled={immutable} placeholder={tx('اكتب محتوى التعميم بالعربية','Enter circular content in Arabic')}/></label>
    </Card>
    <Card title={tx('الجمهور','Audience')}>
      <select className="w-full rounded-input border border-brand-border p-3" value={audience} onChange={event=>setAudience(event.target.value as typeof audience)}><option value="EVERYONE">{tx('الجميع','Everyone')}</option><option value="EMPLOYEES_ONLY">{tx('الموظفون فقط','Employees only')}</option><option value="SPECIFIC">{tx('أشخاص محددون','Specific people')}</option></select>
      {audience==='MANAGEMENT_ONLY'&&<p className="mt-3 text-sm">{tx('سيصل التعميم إلى الإدارة في دائرتك.','The circular will go to management in your department.')}</p>}
      {audience==='SPECIFIC'&&<div className="mt-3"><MultiSelect label={tx('المستلمون','Recipients')} options={recipientOptions} value={selected} onChange={setSelected}/></div>}
      <p className="mt-3">{tx('معاينة المستلمين','Recipient preview')}: {recipients.length} · {recipients.map(userId=>{const user=users.find(candidate=>candidate.id===userId);return ar?user?.arabicName:user?.englishName}).filter(Boolean).join('، ')}</p>
    </Card>
    <Card title={tx('قنوات إضافية (محاكاة)','Optional channels (simulated)')}><label className="me-4"><input type="checkbox" checked={email} onChange={event=>setEmail(event.target.checked)}/> {tx('البريد الإلكتروني','Email')}</label><label><input type="checkbox" checked={sms} onChange={event=>setSms(event.target.checked)}/> {tx('الرسائل النصية','SMS')}</label><p className="text-sm">{tx('الإشعار الداخلي دائم؛ البريد والرسائل لا تُرسل فعلياً.','Internal notification is always on; email and SMS are never actually sent.')}</p></Card>
    {error&&<p role="alert" className="text-sm text-red-700">{error==='content'?tx('أكمل عنوان التعميم ومحتواه بالعربية.','Enter the circular title and content in Arabic.'):tx('لا يمكن النشر من دون مستلمين.','Choose at least one recipient before publishing.')}</p>}
    <div className="flex gap-2"><Button variant="outline" onClick={()=>save(false)}>{tx('حفظ مسودة','Save draft')}</Button><Button onClick={()=>setConfirm(true)}>{tx('نشر','Publish')}</Button></div>
    {confirm&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><Card title={tx('تأكيد النشر','Confirm publication')} className="w-full max-w-md"><p>{tx(`سيتم إنشاء إشعارات داخلية لـ ${recipients.length} مستلم.`,`${recipients.length} internal demo notifications will be created.`)}</p><p>{tx('لن يتم إرسال بريد أو SMS فعلياً.','No actual email or SMS will be sent.')}</p><div className="mt-4 flex gap-2"><Button onClick={()=>save(true)}>{tx('تأكيد النشر','Confirm and publish')}</Button><Button variant="outline" onClick={()=>setConfirm(false)}>{tx('رجوع','Back')}</Button></div></Card></div>}
  </main>;
};
