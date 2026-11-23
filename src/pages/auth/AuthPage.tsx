import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';

export const AuthPage: React.FC = () => {
  const { login, isAuthenticated, isAuthLoading, currentUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.pathname.endsWith('forgot-password') ? 'forgot' : location.pathname.endsWith('reset-password') ? 'reset' : 'login';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const resetToken = new URLSearchParams(location.search).get('token') || '';

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate(currentUser.role === 'EMPLOYEE' ? '/app/my-dashboard' : '/app/dashboard', { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, currentUser.role, navigate]);

  const errorMessages: Record<string, string> = {
    required: 'أدخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور.',
    INVALID_CREDENTIALS: 'اسم المستخدم أو البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    ACCOUNT_INACTIVE: 'هذا الحساب غير نشط؛ راجع مسؤول النظام.',
    ACCOUNT_TEMPORARILY_LOCKED: 'تم إيقاف محاولات الدخول مؤقتاً بعد محاولات فاشلة؛ حاول بعد 15 دقيقة.',
    INVALID_INPUT: 'تحقق من البيانات المدخلة وحاول مرة ثانية.',
    LOGIN_UNAVAILABLE: 'تعذر الاتصال بخدمة الدخول حالياً؛ تأكد أن الخادم يعمل ثم أعد المحاولة.',
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'forgot') {
      if (!identifier.trim()) { setError('أدخل البريد الإلكتروني المرتبط بحسابك.'); return; }
      setBusy(true);
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier.trim() }),
        });
        const payload = await response.json() as { message?: string };
        if (!response.ok) throw new Error(payload.message || 'تعذر إرسال رسالة الاستعادة حالياً.');
        setNotice(payload.message || 'إذا كان البريد مرتبطاً بحساب نشط، فستصلك رسالة فيها رابط آمن لإعادة تعيين كلمة المرور.');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
      } finally { setBusy(false); }
      return;
    }

    if (mode === 'reset') {
      if (!resetToken) { setError('رابط الاستعادة غير مكتمل. اطلب رابطاً جديداً.'); return; }
      if (newPassword.length < 9) { setError('اجعل كلمة المرور 9 أحرف أو أرقام على الأقل.'); return; }
      if (newPassword !== confirmPassword) { setError('كلمتا المرور غير متطابقتين.'); return; }
      setBusy(true);
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword }),
        });
        const payload = await response.json() as { message?: string };
        if (!response.ok) throw new Error(payload.message || 'تعذر تغيير كلمة المرور.');
        setNotice(payload.message || 'تم تغيير كلمة المرور. سجّل الدخول باستخدام كلمة المرور الجديدة.');
        setNewPassword('');
        setConfirmPassword('');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
      } finally { setBusy(false); }
      return;
    }

    if (!identifier.trim() || !password) {
      setError('required');
      return;
    }

    setBusy(true);
    const result = await login(identifier.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.code || 'LOGIN_UNAVAILABLE');
      return;
    }
    navigate(result.user?.role === 'EMPLOYEE' ? '/app/my-dashboard' : '/app/dashboard', { replace: true });
  }

  const title = mode === 'login' ? 'تسجيل الدخول' : mode === 'forgot' ? 'استعادة كلمة المرور' : 'كلمة مرور جديدة';

  return (
    <main className="auth-page min-h-screen bg-brand-lightGray text-brand-charcoal p-4 sm:p-8">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 items-stretch">
        <section className="space-y-6">
          <p className="auth-system-title">نظام إدارة أعمال قسم الإعلام</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-relaxed">أعمال قسم الإعلام</h1>
          <p className="leading-8">نظام تسجيل ومتابعة أعمال موظفي قسم الإعلام.</p>
          <div className="auth-benefits space-y-2 text-sm">
            {['تسجيل أعمال الموظفين اليومية', 'متابعة التكليفات والمشاريع', 'إدارة التعاميم والإشعارات'].map(item => (
              <p key={item} className="rounded-xl border border-white/25 bg-white/10 px-4 py-3">{item}</p>
            ))}
          </div>
          <p className="auth-security flex gap-3 text-sm items-start"><ShieldCheck className="shrink-0" />تسجيل الدخول يتحقق من الحساب وكلمة المرور عبر الخادم.</p>
        </section>

        <section className="border border-brand-charcoal/30 rounded-2xl p-5 sm:p-8 min-w-0 space-y-6" aria-labelledby="auth-title">
          <div>
            <p className="text-sm text-brand-plum mb-2">بوابة الموظفين</p>
            <h2 id="auth-title" className="text-2xl font-bold">{title}</h2>
          </div>
          {mode === 'login' ? (
            <form noValidate onSubmit={submit} className="space-y-5">
              <TextField
                label="اسم المستخدم أو البريد الإلكتروني"
                type="text"
                autoComplete="username"
                dir="ltr"
                value={identifier}
                onChange={event => { setIdentifier(event.target.value); setError(''); }}
                required
              />
              <TextField
                label="كلمة المرور"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={event => { setPassword(event.target.value); setError(''); }}
                required
              />
              <button type="button" className="flex items-center gap-2 min-h-[44px] text-sm text-brand-plum" aria-pressed={visible} onClick={() => setVisible(value => !value)}>
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                {visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              </button>
              {error && <p role="alert" className="border-s-4 border-brand-plum ps-3 text-sm">{errorMessages[error] || error}</p>}
              <Button type="submit" fullWidth isLoading={busy || isAuthLoading} disabled={busy || isAuthLoading}>
                {busy ? 'جارٍ التحقق…' : 'تسجيل الدخول'}
              </Button>
              <Link className="block underline text-brand-plum text-sm" to="/auth/forgot-password">نسيت كلمة المرور؟</Link>
            </form>
          ) : mode === 'forgot' ? (
            <form noValidate onSubmit={submit} className="space-y-5">
              <p className="text-sm leading-7">أدخل البريد الإلكتروني المسجل في حسابك. إذا كان مرتبطاً بحساب نشط، سنرسل إليه رابط استعادة صالحاً لمدة 30 دقيقة.</p>
              <TextField label="البريد الإلكتروني" type="email" autoComplete="email" dir="ltr" value={identifier} onChange={event => { setIdentifier(event.target.value); setError(''); setNotice(''); }} required />
              {error && <p role="alert" className="border-s-4 border-brand-plum ps-3 text-sm">{error}</p>}
              {notice && <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
              <Button type="submit" fullWidth isLoading={busy} disabled={busy}>{busy ? 'جارٍ إرسال الطلب…' : 'إرسال رابط الاستعادة'}</Button>
              <Link className="block underline text-brand-plum text-sm" to="/auth/login">العودة لتسجيل الدخول</Link>
            </form>
          ) : (
            <form noValidate onSubmit={submit} className="space-y-5">
              {!resetToken && <p role="alert" className="border-s-4 border-brand-plum ps-3 text-sm">رابط الاستعادة غير مكتمل. اطلب رابطاً جديداً.</p>}
              <TextField label="كلمة المرور الجديدة" type="password" autoComplete="new-password" dir="ltr" value={newPassword} onChange={event => { setNewPassword(event.target.value); setError(''); setNotice(''); }} required />
              <TextField label="تأكيد كلمة المرور الجديدة" type="password" autoComplete="new-password" dir="ltr" value={confirmPassword} onChange={event => { setConfirmPassword(event.target.value); setError(''); setNotice(''); }} required />
              <p className="text-xs">يجب أن تتكون كلمة المرور من 9 أحرف أو أرقام على الأقل.</p>
              {error && <p role="alert" className="border-s-4 border-brand-plum ps-3 text-sm">{error}</p>}
              {notice && <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
              {notice ? <Link className="block underline text-brand-plum text-sm" to="/auth/login">العودة لتسجيل الدخول</Link> : <Button type="submit" fullWidth isLoading={busy} disabled={busy || !resetToken}>{busy ? 'جارٍ تغيير كلمة المرور…' : 'تغيير كلمة المرور'}</Button>}
            </form>
          )}
          {mode === 'login' && <p className="text-xs leading-6">تنتهي الجلسة بعد 30 دقيقة من عدم النشاط، ولا تُحفظ كلمة المرور في المتصفح.</p>}
        </section>
      </div>
    </main>
  );
};
