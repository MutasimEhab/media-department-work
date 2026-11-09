import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Bell, BriefcaseBusiness, ClipboardList, FolderKanban, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

type HealthMetrics = {
  activeUsers: number;
  workLogs: number;
  assignments: number;
  projects: number;
  notifications: number;
  unreadNotifications: number;
  latestActivity: string | null;
  databaseTime: string;
};

export const SystemHealth: React.FC = () => {
  const { canAccess } = useApp();
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/system-health', { credentials: 'include' });
      const payload = await response.json() as { metrics?: HealthMetrics; message?: string };
      if (!response.ok || !payload.metrics) throw new Error(payload.message || 'تعذر تحميل مؤشرات النظام.');
      setMetrics(payload.metrics);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (canAccess('view_system_health')) void load(); }, [canAccess, load]);
  if (!canAccess('view_system_health')) return <Card>لا تملك صلاحية عرض حالة النظام.</Card>;

  const tiles = [
    { label: 'الحسابات النشطة', value: metrics?.activeUsers, icon: Users },
    { label: 'سجلات العمل المحفوظة', value: metrics?.workLogs, icon: ClipboardList },
    { label: 'التكليفات', value: metrics?.assignments, icon: BriefcaseBusiness },
    { label: 'المشاريع', value: metrics?.projects, icon: FolderKanban },
    { label: 'الإشعارات الداخلية', value: metrics?.notifications, icon: Bell },
    { label: 'إشعارات غير مقروءة', value: metrics?.unreadNotifications, icon: Activity },
  ];

  return <main className="space-y-5" dir="rtl">
    <header className="app-page-heading flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="mt-2 text-2xl font-bold">صحة النظام</h1><p>مؤشرات مباشرة من قاعدة البيانات.</p></div>
      <Button variant="outline" disabled={loading} onClick={() => void load()}>{loading ? 'جارٍ التحديث…' : 'تحديث المؤشرات'}</Button>
    </header>
    {error && <Card><p role="alert">{error}</p></Card>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{tiles.map(({ label, value, icon: Icon }) => <Card key={label}><div className="flex items-center justify-between gap-3"><span>{label}</span><Icon className="text-brand-plum" size={20}/></div><b className="mt-3 block text-2xl" dir="ltr">{value ?? '—'}</b></Card>)}</section>
    <Card title="اتصال قاعدة البيانات">
      <p className="font-bold">{metrics ? 'متصل بقاعدة Neon' : loading ? 'جارٍ التحقق…' : 'غير متاح'}</p>
      {metrics?.databaseTime && <p className="mt-2 text-sm">آخر تحقق: <time dir="ltr">{new Date(metrics.databaseTime).toLocaleString('en-GB')}</time></p>}
      <p className="mt-2 text-sm">آخر حدث مسجل: {metrics?.latestActivity ? <time dir="ltr">{new Date(metrics.latestActivity).toLocaleString('en-GB')}</time> : 'لا توجد أحداث مسجلة.'}</p>
    </Card>
    <Card title="سجل التدقيق"><p>يعرض العمليات المسجلة فعلياً، وتُحفظ التعديلات التي يدعمها النظام في قاعدة البيانات.</p><Link className="mt-3 inline-block text-brand-plum underline" to="/app/audit-log">فتح سجل التدقيق</Link></Card>
    <Card title="التنبيهات الخارجية والنسخ الاحتياطي"><p>البريد وSMS غير مفعّلين لعدم ربط مزود إرسال. النسخ الاحتياطي الآمن يتم إعداده من Neon؛ هذه الصفحة لا تدّعي وجود نسخة احتياطية لم تُنشأ.</p></Card>
  </main>;
};
