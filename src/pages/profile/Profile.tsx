import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

export const Profile: React.FC = () => {
  const { currentUser, updateUser, notifications, t, signOut } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(currentUser.arabicName);
  const [mobile, setMobile] = useState(currentUser.mobile || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const dirty = name !== currentUser.arabicName || mobile !== (currentUser.mobile || '') || Boolean(password || confirm);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function save() {
    if ((password || confirm) && password.length < 10) { setMessage('يجب أن تتكون كلمة المرور من ١٠ أحرف على الأقل.'); return; }
    if (password !== confirm) { setMessage('كلمتا المرور غير متطابقتين.'); return; }
    const ok = updateUser({ ...currentUser, arabicName: name, englishName: name, mobile, preferredLanguage: 'ar' });
    setMessage(ok ? 'تم حفظ تعديلات الملف الشخصي في هذه النسخة.' : 'تعذر حفظ التعديلات.');
    setPassword(''); setConfirm('');
  }

  return <main className="mx-auto max-w-3xl space-y-4" dir="rtl">
    <header className="app-page-heading"><h1 className="mt-2 text-2xl font-bold">الملف الشخصي</h1><p>إدارة بيانات الحساب والتواصل.</p></header>
    <Card title="البيانات الشخصية"><div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">الاسم<input className="mt-1 block w-full rounded-input border border-brand-border p-3" dir="rtl" value={name} onChange={e=>setName(e.target.value)}/></label>
      <label className="text-sm">المسمى الوظيفي<input className="mt-1 block w-full rounded-input border border-brand-border bg-brand-lightGray/40 p-3" readOnly value={currentUser.jobTitleAr}/></label>
      <label className="text-sm">اسم المستخدم<input className="mt-1 block w-full rounded-input border border-brand-border bg-brand-lightGray/40 p-3" dir="ltr" readOnly value={currentUser.username||'—'}/></label>
      <label className="text-sm">البريد الإلكتروني<input className="mt-1 block w-full rounded-input border border-brand-border bg-brand-lightGray/40 p-3" dir="ltr" readOnly value={currentUser.email}/></label>
      <label className="text-sm">رقم الاتصال<input className="mt-1 block w-full rounded-input border border-brand-border p-3" dir="ltr" value={mobile} onChange={e=>setMobile(e.target.value)}/></label>
      <div className="rounded-lg border border-brand-border bg-brand-lightGray/40 p-3 text-sm"><b>لغة الواجهة</b><p className="mt-1">العربية</p></div>
    </div></Card>
    <Card title="تغيير كلمة المرور التجريبية"><label className="block text-sm">كلمة المرور الجديدة<span className="mt-1 flex gap-2"><input className="flex-1 rounded-input border border-brand-border p-3" dir="ltr" type={showPassword?'text':'password'} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label="إظهار أو إخفاء كلمة المرور" onClick={()=>setShowPassword(value=>!value)}>{showPassword?<EyeOff/>:<Eye/>}</button></span></label><label className="mt-3 block text-sm">تأكيد كلمة المرور<input className="mt-1 block w-full rounded-input border border-brand-border p-3" dir="ltr" type={showPassword?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><p className="mt-2 text-xs text-brand-charcoal">تغيير كلمة المرور غير مرتبط بخادم في النسخة الحالية.</p></Card>
    <Card title="الجلسة والإشعارات"><p>الدور الوظيفي: {t.roles[currentUser.role]}</p><p className="mt-1">الإشعارات المرتبطة بالحساب: {notifications.filter(item=>item.userId===currentUser.id).length}</p><Button className="mt-3" variant="outline" onClick={()=>{signOut();navigate('/auth/login')}}>تسجيل الخروج</Button></Card>
    {message&&<p role="status" className="rounded-lg border border-brand-border bg-white p-3 text-sm">{message}</p>}
    <div className="flex gap-2"><Button onClick={save}>حفظ التغييرات</Button><Button variant="outline" onClick={()=>{setName(currentUser.arabicName);setMobile(currentUser.mobile||'');setPassword('');setConfirm('');setMessage('')}}>إلغاء التعديلات</Button><Link className="self-center text-sm text-brand-plum underline" to="/app">العودة إلى النظام</Link></div>
  </main>;
};
