import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import organizationLogo from '../../assets/brand/organization-logo.png';

export const AuthPage: React.FC = () => {
  const { login, isAuthenticated, isAuthLoading, currentUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.pathname.endsWith('forgot-password') ? 'forgot' : location.pathname.endsWith('reset-password') ? 'reset' : 'login';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
    if (mode !== 'login') {
      setError('استعادة كلمة المرور تحتاج ربط البريد الإلكتروني بالنظام أولاً.');
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
      <header className="flex justify-start items-center gap-4 max-w-6xl mx-auto">
        <span className="text-xs font-bold">نظام إدارة أعمال دائرة الإعلام</span>
      </header>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center py-8 lg:py-16">
        <section className="space-y-6">
          <img src={organizationLogo} alt="شعار المؤسسة" className="w-28 h-28 object-contain" />
          <h1 className="text-3xl sm:text-4xl font-bold leading-relaxed">أعمال قسم الإعلامية</h1>
          <p className="leading-8">نظام تسجيل ومتابعة أعمال موظفي قسم الإعلامية.</p>
          <div className="space-y-2 text-sm">
            {['تسجيل أعمال الموظفين اليومية', 'متابعة التكليفات والمشاريع', 'إدارة التعاميم والإشعارات'].map(item => (
              <p key={item} className="rounded-xl border border-white/25 bg-white/10 px-4 py-3">{item}</p>
            ))}
          </div>
          <p className="flex gap-3 text-sm items-start"><ShieldCheck className="shrink-0" />تسجيل الدخول يتحقق من الحساب وكلمة المرور عبر الخادم.</p>
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
          ) : (
            <div role="status" className="space-y-4 text-sm leading-7">
              <p>استعادة كلمة المرور عبر البريد الإلكتروني لم تُفعّل بعد.</p>
              <Link className="block underline text-brand-plum" to="/auth/login">العودة لتسجيل الدخول</Link>
            </div>
          )}
          <p className="text-xs leading-6">تنتهي الجلسة بعد 30 دقيقة من عدم النشاط، ولا تُحفظ كلمة المرور في المتصفح.</p>
        </section>
      </div>
    </main>
  );
};
