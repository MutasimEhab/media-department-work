import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { ALL_PERMISSIONS, AppPermission, DEFAULT_ROLE_PERMISSIONS, PERMISSION_LABELS } from '../../auth/permissions';
import { UserRole } from '../../types';

type Settings = {
  institution: string; department: string; timezone: string; workdays: string[];
  startTime: string; endTime: string; weights: { completion: number; timeliness: number; communication: number };
  taskReminderHours: number[]; missingWorkAlertsEnabled: boolean; missingWorkAlertTime: string;
  smsNotificationsEnabled: boolean; sessionMinutes: number; language: 'ar'; organizationLogo?: string | null;
};

const DEFAULT_SETTINGS: Settings = {
  institution: 'مؤسسة السمع والبصر للتنمية والتأهيل المجتمعي',
  department: 'دائرة الإعلام والاتصال', timezone: 'Asia/Gaza',
  workdays: ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'],
  startTime: '08:00', endTime: '15:00',
  weights: { completion: 40, timeliness: 40, communication: 20 },
  taskReminderHours: [24, 2], missingWorkAlertsEnabled: true, missingWorkAlertTime: '15:00',
  smsNotificationsEnabled: false, sessionMinutes: 30, language: 'ar', organizationLogo: null,
};

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'ADMIN', label: 'مسؤول النظام' }, { id: 'MANAGER', label: 'مدير الدائرة' },
  { id: 'DEPUTY', label: 'نائب مدير الدائرة' }, { id: 'EMPLOYEE', label: 'موظف' },
];
const WORKDAYS = ['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];

export const SystemSettings: React.FC = () => {
  const { rolePermissions, updateRolePermission, currentUser, setInstitutionLogo, setInstitutionName, notify } = useApp();
  const [settings, setSettings] = useState<Settings>(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('official_system_settings') || '{}') }; }
    catch { return DEFAULT_SETTINGS; }
  });
  const [saved, setSaved] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingRolePermission, setSavingRolePermission] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState<'organization'|'work'|'scoring'|'reminders'|'security'|'permissions'>('organization');
  const weightTotal = settings.weights.completion + settings.weights.timeliness + settings.weights.communication;

  useEffect(() => { setSaved(false); }, [settings]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/system-settings', { credentials: 'include' })
      .then(async response => {
        const payload = await response.json() as { settings?: Partial<Settings> | null; message?: string };
        if (!response.ok) throw new Error(payload.message || 'تعذر تحميل الإعدادات.');
        if (!cancelled && payload.settings) {
          const merged = { ...DEFAULT_SETTINGS, ...payload.settings, weights: { ...DEFAULT_SETTINGS.weights, ...payload.settings.weights } };
          setSettings(merged);
          setInstitutionLogo(String(merged.organizationLogo || ''));
          try { localStorage.setItem('official_system_settings', JSON.stringify(merged)); } catch { /* the database remains authoritative */ }
        }
      })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'تعذر تحميل الإعدادات.'); })
      .finally(() => { if (!cancelled) setLoadingSettings(false); });
    return () => { cancelled = true; };
  }, []);

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    if (!settings.institution.trim() || !settings.department.trim()) { setError('أدخل اسم المؤسسة والدائرة.'); return; }
    if (weightTotal !== 100) { setError('يجب أن يساوي مجموع أوزان التقييم ١٠٠٪.'); return; }
    if (!settings.workdays.length) { setError('اختر يوم عمل واحدًا على الأقل.'); return; }
    setSavingSettings(true);
    try {
      const response = await fetch('/api/system-settings', {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const payload = await response.json() as { settings?: Settings; message?: string };
      if (!response.ok || !payload.settings) throw new Error(payload.message || 'تعذر حفظ الإعدادات.');
      setSettings(payload.settings);
      setInstitutionLogo(String(payload.settings.organizationLogo || ''));
      setInstitutionName(payload.settings.institution);
      try { localStorage.setItem('official_system_settings', JSON.stringify(payload.settings)); } catch { /* database save already succeeded */ }
      setError(''); setSaved(true); notify('تم حفظ إعدادات المؤسسة والنظام بنجاح.');
    } catch (cause) { const message = cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم؛ لم تُحفظ الإعدادات.'; setError(message); notify(message, 'error'); }
    finally { setSavingSettings(false); }
  }

  async function chooseOrganizationLogo(file?: File) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('اختر صورة PNG أو JPG أو WebP.'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('حجم الصورة كبير؛ الحد الأقصى ٨ ميغابايت.'); return; }
    try {
      const source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);
        image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
        image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('تعذر قراءة الصورة.')); };
        image.src = url;
      });
      const scale = Math.min(1, 640 / Math.max(source.width, source.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));
      canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);
      const logo = canvas.toDataURL('image/webp', 0.86);
      if (logo.length > 500_000) throw new Error('تعذر ضغط الشعار إلى الحجم المسموح. اختر صورة أصغر.');
      setSettings(current => ({ ...current, organizationLogo: logo }));
      setError(''); setSaved(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر تجهيز الشعار.'); }
  }

  const tabs = [
    ['organization','بيانات المؤسسة'], ['work','الدوام وساعات العمل'],
    ['scoring','معايير التقييم'], ['reminders','التنبيهات'], ['security','الأمان والجلسات'], ['permissions','مصفوفة الصلاحيات'],
  ] as const;

  return <main className="mx-auto max-w-6xl space-y-5" dir="rtl">
    <header className="app-page-heading">
      <p className="text-xs font-bold text-brand-plum">الإدارة المؤسسية · الإعدادات المعتمدة</p>
      <h1 className="mt-1 text-2xl font-bold">إعدادات النظام</h1>
      <p className="mt-1 text-sm">إدارة بيانات المؤسسة والسياسات التشغيلية وصلاحيات الأدوار.</p>
    </header>
    <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="أقسام إعدادات النظام">
      {tabs.map(([id,label]) => <Button key={id} size="sm" variant={section===id?'secondary':'outline'} onClick={()=>setSection(id)}>{label}</Button>)}
    </nav>

    {section === 'permissions' ? <>
      <Card title="مصفوفة الصلاحيات حسب الدور">
        <p className="mb-4 text-sm text-brand-charcoal">تُحفظ التغييرات في قاعدة البيانات ويطبقها الخادم على طلبات الحسابات. تعديل المصفوفة متاح لمدير النظام فقط، وصلاحياته ثابتة لضمان بقاء إدارة النظام متاحة.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead><tr className="border-b border-brand-border text-start"><th className="p-3 text-start">الصلاحية</th>{ROLES.map(role=><th key={role.id} className="p-3 text-center">{role.label}</th>)}</tr></thead>
            <tbody>{ALL_PERMISSIONS.map(permission=><tr key={permission} className="border-b border-brand-border/70"><th className="p-3 text-start font-medium">{PERMISSION_LABELS[permission]}</th>{ROLES.map(role=>{
              const enabled = role.id==='ADMIN' || (rolePermissions[role.id] || DEFAULT_ROLE_PERMISSIONS[role.id]).includes(permission);
              const adminOnly = ['manage_system_settings','view_audit_log','view_system_health'].includes(permission);
              const employeeRestricted = role.id==='EMPLOYEE'&&['view_management_dashboard','view_department_work_logs','view_department_reports','manage_users','manage_work_exceptions'].includes(permission);
              return <td key={role.id} className="p-3 text-center"><input type="checkbox" aria-label={`${PERMISSION_LABELS[permission]} — ${role.label}`} checked={enabled} disabled={savingRolePermission||role.id==='ADMIN'||currentUser.role!=='ADMIN'||adminOnly||employeeRestricted} onChange={async event=>{setSavingRolePermission(true);await updateRolePermission(role.id,permission as AppPermission,event.target.checked);setSavingRolePermission(false)}} className="h-4 w-4 accent-fuchsia-700 disabled:opacity-60"/></td>;
            })}</tr>)}</tbody>
          </table>
        </div>
      </Card>
      <Card title="تعريف الأدوار"><ul className="space-y-2 text-sm">{ROLES.map(role=><li key={role.id}><b>{role.label}:</b> {role.id==='ADMIN'?'إدارة النظام والحسابات والسياسات وسجلات التدقيق.':role.id==='MANAGER'?'إدارة أعمال الدائرة والتكليفات والمشاريع والتعاميم ومراجعة التسليمات.':role.id==='DEPUTY'?'مساندة المدير في إدارة أعمال الدائرة ومتابعة التكليفات والمشاريع والتعاميم.':'تسجيل العمل الشخصي والاطلاع على التكليفات والمشاريع والتعاميم الموجهة إليه.'}</li>)}</ul></Card>
    </> : <form onSubmit={saveSettings} className="space-y-4">
      {section==='organization'&&<>
      <Card title="بيانات المؤسسة والجهة"><div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">اسم المؤسسة<input className="mt-1 block w-full rounded-input border border-brand-border p-3 font-normal" value={settings.institution} onChange={e=>setSettings(s=>({...s,institution:e.target.value}))}/><span className="mt-1 block text-xs font-normal text-brand-charcoal">يمكن لمدير النظام أو المستخدم الذي مُنح صلاحية «إدارة إعدادات النظام» تغييره.</span></label>
        <label className="text-sm font-semibold">اسم الدائرة<input className="mt-1 block w-full rounded-input border border-brand-border p-3 font-normal" value={settings.department} onChange={e=>setSettings(s=>({...s,department:e.target.value}))}/></label>
        <label className="text-sm font-semibold">المنطقة الزمنية<select className="mt-1 block w-full rounded-input border border-brand-border p-3 font-normal" value={settings.timezone} onChange={e=>setSettings(s=>({...s,timezone:e.target.value}))}><option value="Asia/Gaza">فلسطين — توقيت غزة</option><option value="Asia/Jerusalem">فلسطين — التوقيت المحلي</option><option value="UTC">التوقيت العالمي UTC</option></select></label>
        <div className="rounded-lg border border-brand-border bg-brand-lightGray/40 p-3 text-sm"><b>لغة النظام</b><p className="mt-1">العربية فقط · اتجاه العرض من اليمين إلى اليسار</p></div>
      </div></Card>
      <Card title="شعار المؤسسة">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-brand-border bg-brand-lightGray/40 p-3">
            {settings.organizationLogo ? <img src={settings.organizationLogo} alt="معاينة شعار المؤسسة الجديد" className="h-full w-full object-contain"/> : <span className="text-center text-xs text-brand-charcoal/70">لا يوجد شعار معيّن</span>}
          </div>
          <div className="space-y-3">
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-input bg-brand-magenta px-4 text-sm font-bold text-white hover:brightness-110">{settings.organizationLogo ? 'اختيار شعار بديل' : 'إضافة شعار'}<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{void chooseOrganizationLogo(event.target.files?.[0]);event.currentTarget.value='';}}/></label>
            {settings.organizationLogo && <Button type="button" variant="outline" onClick={()=>{setSettings(current=>({...current,organizationLogo:null}));setSaved(false);}}>حذف الشعار</Button>}
            <p className="max-w-xl text-xs text-brand-charcoal/75">يظهر الشعار بعد حفظ الإعدادات في الشريط العلوي وأيقونة المتصفح وتقارير PDF. ارفع PNG أو JPG أو WebP؛ تُضغط الصورة تلقائياً.</p>
          </div>
        </div>
      </Card>
      </>}
      {section==='work'&&<Card title="أيام وساعات الدوام الرسمي"><fieldset><legend className="mb-2 text-sm font-semibold">أيام العمل</legend><div className="flex flex-wrap gap-3">{WORKDAYS.map(day=><label key={day} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2"><input type="checkbox" checked={settings.workdays.includes(day)} onChange={e=>setSettings(s=>({...s,workdays:e.target.checked?[...s.workdays,day]:s.workdays.filter(value=>value!==day)}))}/>{day}</label>)}</div></fieldset><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">بداية الدوام<input type="time" dir="ltr" className="mt-1 block rounded-input border border-brand-border p-3 font-normal" value={settings.startTime} onChange={e=>setSettings(s=>({...s,startTime:e.target.value}))}/></label><label className="text-sm font-semibold">نهاية الدوام<input type="time" dir="ltr" className="mt-1 block rounded-input border border-brand-border p-3 font-normal" value={settings.endTime} onChange={e=>setSettings(s=>({...s,endTime:e.target.value}))}/></label></div><p className="mt-3 text-xs text-brand-charcoal">تُحفظ الإعدادات مركزياً في قاعدة البيانات وتُحمّل عند تسجيل الدخول.</p></Card>}
      {section==='scoring'&&<Card title="أوزان مؤشرات الأداء"><p className="mb-4 text-sm">يجب أن يساوي مجموع الأوزان ١٠٠٪.</p><div className="grid gap-4 sm:grid-cols-3">{([['completion','إنجاز الأعمال'],['timeliness','الالتزام بالمواعيد'],['communication','المخرجات الإعلامية']] as const).map(([key,label])=><label key={key} className="text-sm font-semibold">{label} (%)<input type="number" min="0" max="100" className="mt-1 block w-full rounded-input border border-brand-border p-3 font-normal" value={settings.weights[key]} onChange={e=>setSettings(s=>({...s,weights:{...s.weights,[key]:Number(e.target.value)}}))}/></label>)}</div><p className={`mt-3 font-bold ${weightTotal===100?'text-green-700':'text-red-700'}`}>المجموع: {weightTotal}٪</p></Card>}
      {section==='reminders'&&<Card title="سياسة التنبيهات"><div className="space-y-5"><section className="rounded-lg border border-brand-border p-4"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={settings.missingWorkAlertsEnabled} onChange={e=>setSettings(s=>({...s,missingWorkAlertsEnabled:e.target.checked}))}/>تنبيه الموظف عند عدم تسجيل العمل اليومي</label><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">موعد فحص السجلات وإرسال التنبيه<input type="time" dir="ltr" className="mt-1 block rounded-input border border-brand-border p-3" value={settings.missingWorkAlertTime} onChange={e=>setSettings(s=>({...s,missingWorkAlertTime:e.target.value}))}/></label><p className="self-end text-sm">يُفحص الموظفون النشطون في أيام الدوام المحددة. يُرسل تذكير للموظف وتنبيه متابعة للمستخدمين المخولين.</p></div><p className="mt-3 text-xs text-brand-charcoal">حدّد المستلمين من مصفوفة الصلاحيات عبر صلاحية «استلام تنبيهات عدم تسجيل العمل اليومي».</p></section><section><p className="mb-3 text-sm font-semibold">مواعيد التذكير بالتكليف قبل الاستحقاق</p><div className="flex flex-wrap gap-3">{[24,2].map(hours=><label key={hours} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2"><input type="checkbox" checked={settings.taskReminderHours.includes(hours)} onChange={e=>setSettings(s=>({...s,taskReminderHours:e.target.checked?[...s.taskReminderHours,hours]:s.taskReminderHours.filter(value=>value!==hours)}))}/>{hours===24?'قبل ٢٤ ساعة':'قبل ساعتين'}</label>)}</div><p className="mt-2 text-sm">تذكير يومي بعد تجاوز الموعد · إقرار التعميم بعد ٢٤ ساعة ثم كل ٤٨ ساعة، بحد أقصى ٣ تذكيرات.</p></section><section className="rounded-lg border border-brand-border bg-brand-lightGray/30 p-4"><label className="flex items-center gap-2 text-sm text-brand-charcoal"><input type="checkbox" checked={settings.smsNotificationsEnabled} disabled/>تفعيل إرسال التنبيهات عبر الرسائل النصية (SMS)</label><p className="mt-2 text-xs text-brand-charcoal">القناة جاهزة للإعداد لاحقًا، لكنها غير مفعّلة حتى ربط مزوّد رسائل ومفاتيح الإرسال بالخادم.</p><p className="mt-1 text-xs text-brand-charcoal">التنبيهات الحالية تظهر داخل الموقع فقط، ولا يتم إرسال رسائل فعلية.</p></section></div></Card>}
      {section==='security'&&<Card title="ضوابط الأمان والجلسات"><label className="block max-w-sm text-sm font-semibold">مدة الخمول قبل انتهاء الجلسة (دقيقة)<input type="number" min="5" max="240" className="mt-1 block w-full rounded-input border border-brand-border p-3 font-normal" value={settings.sessionMinutes} onChange={e=>setSettings(s=>({...s,sessionMinutes:Number(e.target.value)}))}/></label><div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm"><b>حالة التطبيق</b><p className="mt-1">تُحفظ قيمة مدة الجلسة مركزياً. تطبيقها على جلسات الدخول نفسها وإرسال SMS يحتاجان إعداداً إضافياً في الخادم ومزوّد الرسائل.</p></div></Card>}
      {error&&<p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {saved&&<p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">تم حفظ الإعدادات في قاعدة البيانات.</p>}
      {loadingSettings&&<p role="status" className="text-sm">جارٍ تحميل الإعدادات المحفوظة…</p>}
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={savingSettings||loadingSettings}>{savingSettings?'جارٍ الحفظ…':'حفظ الإعدادات'}</Button><Button type="button" variant="outline" disabled={savingSettings||loadingSettings} onClick={()=>setSettings(DEFAULT_SETTINGS)}>استعادة القيم الافتراضية</Button></div>
    </form>}
  </main>;
};
