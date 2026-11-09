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
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const dirty = name !== currentUser.arabicName || mobile !== (currentUser.mobile || '') || avatar !== (currentUser.avatar || '');

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function selectAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('اختر ملف صورة صالحاً.'); return; }
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      const edge = 320;
      const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('تعذر تجهيز الصورة.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setAvatar(canvas.toDataURL('image/jpeg', 0.78));
      setMessage('تم تجهيز الصورة. اضغط «حفظ التغييرات» لتثبيتها.');
    } catch {
      setMessage('تعذر قراءة الصورة؛ جرّب ملفاً آخر.');
    } finally { URL.revokeObjectURL(objectUrl); }
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch('/api/users/me/profile', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ arabicName: name, mobile, avatar: avatar || null }) });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'تعذر حفظ الملف الشخصي.');
      const ok = updateUser({ ...currentUser, arabicName: name, englishName: name, mobile, avatar: avatar || undefined, preferredLanguage: 'ar' });
      setMessage(ok ? 'تم حفظ الملف الشخصي.' : 'تعذر تحديث بيانات العرض.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر الاتصال بالخادم.');
    } finally { setSaving(false); }
  }

  async function changePassword() {
    if (!currentPassword) { setMessage('أدخل كلمة المرور الحالية.'); return; }
    if (password.length < 9) { setMessage('يجب أن تتكون كلمة المرور الجديدة من 9 أحرف أو أرقام على الأقل.'); return; }
    if (password !== confirm) { setMessage('كلمتا المرور الجديدتان غير متطابقتين.'); return; }
    setPasswordSaving(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword: password }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'تعذر تغيير كلمة المرور.');
      setCurrentPassword(''); setPassword(''); setConfirm('');
      setMessage(payload.message || 'تم تغيير كلمة المرور بنجاح.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر الاتصال بالخادم.');
    } finally { setPasswordSaving(false); }
  }

  return <main className="mx-auto max-w-3xl space-y-4" dir="rtl">
    <header className="app-page-heading"><h1 className="mt-2 text-2xl font-bold">الملف الشخصي</h1><p>إدارة بيانات الحساب والتواصل.</p></header>
    <Card title="الصورة الشخصية"><div className="flex flex-wrap items-center gap-4"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-brand-border bg-brand-plum text-3xl font-bold text-white">{avatar?<img src={avatar} alt={`الصورة الشخصية لـ ${currentUser.arabicName}`} className="h-full w-full object-cover"/>:currentUser.arabicName.charAt(0)}</div><div className="space-y-2"><label className="inline-flex min-h-10 cursor-pointer items-center rounded-input bg-brand-magenta px-4 text-sm font-bold text-white hover:brightness-110">اختيار صورة<input className="sr-only" type="file" accept="image/*" onChange={event=>void selectAvatar(event.target.files?.[0])}/></label>{avatar&&<Button variant="outline" size="sm" onClick={()=>setAvatar('')}>إزالة الصورة</Button>}<p className="text-xs text-brand-charcoal">سيتم تصغير الصورة تلقائياً قبل حفظها.</p></div></div></Card>
    <Card title="البيانات الشخصية"><div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">الاسم<input className="mt-1 block w-full rounded-input border border-brand-border p-3" dir="rtl" value={name} onChange={e=>setName(e.target.value)}/></label>
      <label className="text-sm">المسمى الوظيفي<input className="mt-1 block w-full rounded-input border border-brand-border bg-brand-lightGray/40 p-3" readOnly value={currentUser.jobTitleAr}/></label>
      <label className="text-sm">الرقم الوظيفي<input className="mt-1 block w-full rounded-input border border-brand-border bg-brand-lightGray/40 p-3" readOnly dir="ltr" value={currentUser.employeeNumber||'—'}/></label>
      <label className="text-sm">اسم المستخدم<input className="mt-1 block w-full rounded-input border border-brand-border bg-brand-lightGray/40 p-3" dir="ltr" readOnly value={currentUser.username||'—'}/></label>
      <label className="text-sm">البريد الإلكتروني<input className="mt-1 block w-full rounded-input border border-brand-border bg-brand-lightGray/40 p-3" dir="ltr" readOnly value={currentUser.email || ''} placeholder="غير مسجل"/></label>
      <label className="text-sm">رقم الاتصال<input className="mt-1 block w-full rounded-input border border-brand-border p-3" dir="ltr" value={mobile} onChange={e=>setMobile(e.target.value)}/></label>
      <div className="rounded-lg border border-brand-border bg-brand-lightGray/40 p-3 text-sm"><b>لغة الواجهة</b><p className="mt-1">العربية</p></div>
    </div></Card>
    <Card title="تغيير كلمة المرور"><label className="block text-sm">كلمة المرور الحالية<input className="mt-1 block w-full rounded-input border border-brand-border p-3" dir="ltr" type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></label><label className="mt-3 block text-sm">كلمة المرور الجديدة<span className="mt-1 flex gap-2"><input className="flex-1 rounded-input border border-brand-border p-3" dir="ltr" type={showPassword?'text':'password'} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label="إظهار أو إخفاء كلمة المرور" onClick={()=>setShowPassword(value=>!value)}>{showPassword?<EyeOff/>:<Eye/>}</button></span></label><label className="mt-3 block text-sm">تأكيد كلمة المرور<input className="mt-1 block w-full rounded-input border border-brand-border p-3" dir="ltr" type={showPassword?'text':'password'} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><p className="mt-2 text-xs text-brand-charcoal">يجب أن تكون 9 أحرف أو أرقام على الأقل.</p><Button className="mt-3" disabled={passwordSaving} onClick={()=>void changePassword()}>{passwordSaving?'جارٍ التغيير…':'تغيير كلمة المرور'}</Button></Card>
    <Card title="الجلسة والإشعارات"><p>الدور الوظيفي: {t.roles[currentUser.role]}</p><p className="mt-1">الإشعارات المرتبطة بالحساب: {notifications.filter(item=>item.userId===currentUser.id).length}</p><Button className="mt-3" variant="outline" onClick={()=>{signOut();navigate('/auth/login')}}>تسجيل الخروج</Button></Card>
    {message&&<p role="status" className="rounded-lg border border-brand-border bg-white p-3 text-sm">{message}</p>}
    <div className="flex gap-2"><Button disabled={saving} onClick={()=>void save()}>{saving?'جارٍ الحفظ…':'حفظ التغييرات'}</Button><Button variant="outline" disabled={saving} onClick={()=>{setName(currentUser.arabicName);setMobile(currentUser.mobile||'');setAvatar(currentUser.avatar||'');setCurrentPassword('');setPassword('');setConfirm('');setMessage('')}}>إلغاء التعديلات</Button><Link className="self-center text-sm text-brand-plum underline" to="/app">العودة إلى النظام</Link></div>
  </main>;
};
