import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import organizationLogo from '../../assets/brand/organization-logo.png';

const DEMO_PASSWORD = 'DemoMedia2026!';
// Deliberately ephemeral: no credentials, reset tokens, or sessions are persisted.
const passwords = new Map<string, string>();
const attempts = new Map<string, { count: number; until: number }>();
let resetRequest: { email: string; expires: number; used: boolean } | undefined;

export const AuthPage: React.FC = () => {
  const { language, users, setCurrentUser } = useApp();
  const ar = language === 'ar';
  const tr = (a: string, e: string) => ar ? a : e;
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.pathname.endsWith('forgot-password') ? 'forgot' : location.pathname.endsWith('reset-password') ? 'reset' : 'login';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { setError(''); setSent(false); setPassword(''); setConfirm(''); }, [mode]);
  const key = identifier.trim().toLowerCase();
  const lock = attempts.get(key);
  const locked = Boolean(lock && lock.until > now);
  const expired = !resetRequest || resetRequest.used || resetRequest.expires <= now;
  const messages: Record<string, string> = {
    required: tr('يرجى تعبئة جميع الحقول.', 'Complete all required fields.'),
    email: tr('أدخل بريداً إلكترونياً صالحاً.', 'Enter a valid email address.'),
    invalid: tr('اسم المستخدم أو البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'Username, email, or password is incorrect.'),
    inactive: tr('هذا الحساب غير نشط. راجع مسؤول النظام.', 'This account is inactive. Contact your administrator.'),
    short: tr('كلمة المرور يجب أن تتكون من 10 أحرف على الأقل.', 'Password must contain at least 10 characters.'),
    mismatch: tr('كلمتا المرور غير متطابقتين.', 'Passwords do not match.'),
    expired: tr('رابط إعادة التعيين منتهي أو مستخدم. اطلب رابطاً جديداً.', 'The reset link has expired or was used. Request a new link.'),
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (mode !== 'reset' && !key || mode !== 'forgot' && !password || mode === 'reset' && !confirm) { setError('required'); return; }
    if (mode === 'forgot' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) { setError('email'); return; }
    if (mode === 'login' && locked) return;
    if (mode === 'reset') {
      if (expired) { setError('expired'); return; }
      if (password.length < 10) { setError('short'); return; }
      if (password !== confirm) { setError('mismatch'); return; }
    }
    setBusy(true);
    await new Promise(resolve => window.setTimeout(resolve, 600));
    setBusy(false);
    if (mode === 'forgot') {
      resetRequest = { email: key, expires: Date.now() + 3600000, used: false };
      setSent(true); return;
    }
    if (mode === 'reset' && resetRequest) {
      if (resetRequest.used || resetRequest.expires <= Date.now()) { setError('expired'); return; }
      passwords.set(resetRequest.email, password); attempts.delete(resetRequest.email);
      resetRequest.used = true; setSent(true); return;
    }
    const user = users.find(u => u.email.toLowerCase() === key || u.username?.toLowerCase() === key);
    const accountKey = user?.email.toLowerCase() || key;
    if (password !== (passwords.get(accountKey) || DEMO_PASSWORD) || !user) {
      const previous = attempts.get(key);
      const count = (previous && (!previous.until || previous.until > Date.now()) ? previous.count : 0) + 1;
      attempts.set(key, { count, until: count >= 5 ? Date.now() + 900000 : 0 });
      setNow(Date.now()); setError('invalid'); return;
    }
    if (!user.isActive) { setError('inactive'); return; }
    attempts.delete(key); setCurrentUser(user); navigate(user.role === 'EMPLOYEE' ? '/app/my-dashboard' : '/app/dashboard');
  }
  const title = mode === 'login' ? tr('تسجيل الدخول', 'Sign in') : mode === 'forgot' ? tr('استعادة كلمة المرور', 'Recover your password') : tr('كلمة مرور جديدة', 'Set a new password');
  return <main className="auth-page min-h-screen bg-brand-lightGray text-brand-charcoal p-4 sm:p-8">
    <header className="flex justify-start items-center gap-4 max-w-6xl mx-auto"><span className="text-xs font-bold">بيانات تجريبية فقط</span></header>
    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center py-8 lg:py-16">
      <section className="space-y-6"><img src={organizationLogo} alt={tr('شعار المؤسسة','Organization logo')} className="w-28 h-28 object-contain" /><h1 className="text-3xl sm:text-4xl font-bold leading-relaxed">{tr('أعمال قسم الإعلامية', 'Media Department Work')}</h1><p className="leading-8">{tr('نظام تسجيل ومتابعة أعمال موظفي قسم الإعلامية', 'A system for recording and following up on media department work.')}</p><div className="space-y-2 text-sm">{[tr('تسجيل أعمال الموظفين اليومية','Record employees’ daily work'),tr('فلترة وتصدير كشف Excel منسق','Filter and export a formatted Excel report'),tr('لوحة أمن للتقارير والتعاميم','Secure dashboard for reports and circulars')].map(item=><p key={item} className="rounded-xl border border-white/25 bg-white/10 px-4 py-3">{item}</p>)}</div><p className="flex gap-3 text-sm items-start"><ShieldCheck className="shrink-0" />{tr('هذه محاكاة واجهة فقط. لا يوجد تحقق حقيقي أو إرسال بريد إلكتروني.', 'UI simulation only. No real authentication or email delivery.')}</p></section>
      <section className="border border-brand-charcoal/30 rounded-2xl p-5 sm:p-8 min-w-0 space-y-6" aria-labelledby="auth-title">
        <div><p className="text-sm text-brand-plum mb-2">{tr('بوابة الموظفين', 'Staff portal')}</p><h2 id="auth-title" className="text-2xl font-bold">{title}</h2></div>
        {sent ? <div role="status" className="space-y-4"><h3 className="font-bold">{mode === 'forgot' ? tr('تمت محاكاة طلب الاستعادة', 'Recovery request simulated') : tr('تم تغيير كلمة المرور التجريبية', 'Demo password changed')}</h3><p>{mode === 'forgot' ? tr('لم يُرسل بريد. رابط المحاكاة صالح لساعة واحدة ويُستخدم مرة واحدة.', 'No email was sent. The simulated link lasts one hour and can be used once.') : tr('يمكنك تسجيل الدخول بكلمة المرور الجديدة خلال هذه المحاكاة.', 'You can sign in with the new password during this demo.')}</p>{mode === 'forgot' && <Link className="block underline text-brand-plum" to="/auth/reset-password">{tr('فتح رابط المحاكاة', 'Open simulated reset link')}</Link>}<Link className="block underline text-brand-plum" to="/auth/login">{tr('العودة لتسجيل الدخول', 'Back to sign in')}</Link></div> : <form noValidate onSubmit={submit} className="space-y-5">
          {mode !== 'reset' && <TextField label={mode==='login'?'اسم المستخدم أو البريد الإلكتروني':'البريد الإلكتروني'} type={mode==='forgot'?'email':'text'} autoComplete="username" dir="ltr" value={identifier} onChange={e => { setIdentifier(e.target.value); setError(''); }} required />}
          {mode !== 'forgot' && <><TextField label={mode === 'reset' ? tr('كلمة المرور الجديدة', 'New password') : tr('كلمة المرور', 'Password')} type={visible ? 'text' : 'password'} autoComplete={mode === 'reset' ? 'new-password' : 'current-password'} dir="ltr" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" className="flex items-center gap-2 min-h-[44px] text-sm text-brand-plum" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}{visible ? tr('إخفاء كلمة المرور', 'Hide password') : tr('إظهار كلمة المرور', 'Show password')}</button></>}
          {mode === 'reset' && <TextField label={tr('تأكيد كلمة المرور', 'Confirm password')} type={visible ? 'text' : 'password'} autoComplete="new-password" dir="ltr" value={confirm} onChange={e => setConfirm(e.target.value)} required />}
          {error && <p role="alert" className="border-s-4 border-brand-plum ps-3 text-sm">{messages[error]}</p>}
          {locked && mode === 'login' && <p role="status">{tr('قفل تجريبي بعد 5 محاولات. الوقت المتبقي بالثواني:', 'Simulated lock after 5 attempts. Seconds remaining:')} {Math.ceil(((lock?.until || 0) - now) / 1000)}</p>}
          {mode === 'login' && lock && !locked && <p className="text-sm">{tr('المحاولات الفاشلة:', 'Failed attempts:')} {lock.until ? 0 : lock.count} / 5</p>}
          {mode === 'reset' && expired && <p role="status">{messages.expired}</p>}
          <Button type="submit" fullWidth isLoading={busy} disabled={mode === 'login' && locked || mode === 'reset' && expired}>{busy ? tr('جارٍ التنفيذ', 'Working') : mode === 'login' ? tr('تسجيل الدخول التجريبي', 'Demo sign in') : mode === 'forgot' ? tr('محاكاة طلب رابط الاستعادة', 'Simulate recovery request') : tr('حفظ كلمة المرور', 'Save password')}</Button>
          <Link className="block underline text-brand-plum text-sm" to={mode === 'login' || mode === 'reset' ? '/auth/forgot-password' : '/auth/login'}>{mode === 'login' ? tr('نسيت كلمة المرور؟', 'Forgot password?') : mode === 'reset' ? tr('طلب رابط جديد', 'Request a new link') : tr('العودة لتسجيل الدخول', 'Back to sign in')}</Link>
        </form>}
        <p className="text-xs leading-6">{tr('وفق SRS: انتهاء الجلسة بعد 30 دقيقة من عدم النشاط. لا يوجد خيار تذكر الجلسة. سياسة الجلسات الحقيقية غير مطبقة في النموذج.', 'SRS: sessions expire after 30 minutes of inactivity. No remember-session option. Real session enforcement is outside this prototype.')}</p>
      </section>
    </div>
  </main>;
};

