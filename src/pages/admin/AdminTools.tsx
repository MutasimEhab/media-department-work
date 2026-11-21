import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Upload, Plus, Trash2, ArrowDown, ArrowUp, Database } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { WorkLog } from '../../types';
import { AccountTypesAdmin } from './AccountTypesAdmin';

type CustomField = { id: string; name: string; type: string; required: boolean };
const DEFAULT_WORKFLOW = ['قيد التنفيذ', 'بانتظار رفع المواد', 'معتمد', 'مكتمل ومغلق'];
const DEFAULT_FIELDS: CustomField[] = [{ id: 'area', name: 'المنطقة', type: 'قائمة منسدلة', required: true }];
const FIELD_TYPES = ['نص قصير', 'نص طويل', 'رقم', 'تاريخ', 'قائمة منسدلة', 'رابط'];

function readList<T>(key: string, fallback: T[]): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}

const download = (fileName: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const AdminTools: React.FC = () => {
  const { pathname } = useLocation();
  const { workLogs } = useApp();
  const [workflow, setWorkflow] = useState<string[]>(DEFAULT_WORKFLOW);
  const [workflowName, setWorkflowName] = useState('');
  const [fields, setFields] = useState<CustomField[]>(DEFAULT_FIELDS);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState(FIELD_TYPES[0]);
  const [fieldRequired, setFieldRequired] = useState(false);
  const [status, setStatus] = useState('');
  const [configError, setConfigError] = useState('');
  const [configSaved, setConfigSaved] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem('official_last_backup') || 'لا توجد عملية تنزيل مسجلة على هذا الجهاز.');
  const [usage, setUsage] = useState('جارٍ حساب المساحة المحلية…');

  useEffect(() => {
    const controller = new AbortController();
    const loadSharedSettings = async () => {
      try {
        const response = await fetch('/api/admin-tools', { credentials: 'include', signal: controller.signal });
        const payload = await response.json() as { settings?: { workflowSteps?: string[]; customFields?: CustomField[] } | null; message?: string };
        if (!response.ok) throw new Error(payload.message || 'تعذر تحميل الإعدادات المشتركة.');
        if (payload.settings) {
          setWorkflow(payload.settings.workflowSteps || DEFAULT_WORKFLOW);
          setFields(payload.settings.customFields || DEFAULT_FIELDS);
        } else {
          // Move existing local settings from this administrator's browser into the shared database once.
          const firstSettings = {
            workflowSteps: readList('official_workflow_steps', DEFAULT_WORKFLOW),
            customFields: readList('official_custom_fields', DEFAULT_FIELDS),
          };
          const saveResponse = await fetch('/api/admin-tools', {
            method: 'PUT', credentials: 'include', signal: controller.signal,
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings: firstSettings }),
          });
          const saved = await saveResponse.json() as { message?: string };
          if (!saveResponse.ok) throw new Error(saved.message || 'تعذر نقل الإعدادات إلى قاعدة البيانات.');
          setWorkflow(firstSettings.workflowSteps);
          setFields(firstSettings.customFields);
        }
      } catch (cause) {
        if (!controller.signal.aborted) setConfigError(cause instanceof Error ? cause.message : 'تعذر تحميل الإعدادات المشتركة.');
      } finally {
        if (!controller.signal.aborted) setLoadingConfig(false);
      }
    };
    void loadSharedSettings();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    void navigator.storage?.estimate?.()
      .then(result => setUsage(`مساحة المتصفح: ${Math.round(result.usage || 0)} بايت مستخدمة من ${Math.round(result.quota || 0)} بايت متاحة.`))
      .catch(() => setUsage('المساحة المحلية متاحة ضمن حدود المتصفح.'));
  }, []);

  const page = pathname.includes('workflow') ? 'workflow' : pathname.includes('account-types') ? 'accountTypes' : pathname.includes('custom-fields') ? 'customFields' : 'backup';
  const title = page === 'workflow' ? 'إعداد سير العمل' : page === 'accountTypes' ? 'أنواع الحسابات' : page === 'customFields' ? 'الخانات الإضافية' : 'النسخ الاحتياطي';

  async function saveSharedSettings(event?: React.FormEvent) {
    event?.preventDefault();
    setSavingConfig(true);
    setConfigError('');
    setConfigSaved(false);
    try {
      const response = await fetch('/api/admin-tools', {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { workflowSteps: workflow, customFields: fields } }),
      });
      const payload = await response.json() as { settings?: { workflowSteps: string[]; customFields: CustomField[] }; message?: string };
      if (!response.ok || !payload.settings) throw new Error(payload.message || 'تعذر حفظ الإعدادات المشتركة.');
      setWorkflow(payload.settings.workflowSteps);
      setFields(payload.settings.customFields);
      try {
        localStorage.setItem('official_workflow_steps', JSON.stringify(payload.settings.workflowSteps));
        localStorage.setItem('official_custom_fields', JSON.stringify(payload.settings.customFields));
      } catch { /* the database remains authoritative */ }
      setConfigSaved(true);
    } catch (cause) {
      setConfigError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally { setSavingConfig(false); }
  }

  function exportBackup() {
    const data: Record<string, string> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && /^(demo_|official_)/.test(key)) data[key] = localStorage.getItem(key) || '';
    }
    download(`نسخة-إعدادات-المتصفح-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ format: 'media-department-browser-settings', version: 1, createdAt: new Date().toISOString(), data }, null, 2), 'application/json');
    const now = new Date().toLocaleString('ar-u-nu-latn', { numberingSystem: 'latn' });
    localStorage.setItem('official_last_backup', now);
    setLastBackup(now);
    setStatus('تم تنزيل إعدادات هذا المتصفح فقط.');
  }

  function restoreBackup(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const value = JSON.parse(String(reader.result));
        if (value.format !== 'media-department-browser-settings' || !value.data || typeof value.data !== 'object') throw new Error('format');
        if (!window.confirm('سيتم استبدال إعدادات العرض المحلية الموجودة في هذا المتصفح ثم إعادة تحميل الموقع. هل تريد المتابعة؟')) return;
        for (const [key, item] of Object.entries(value.data)) {
          if (/^(demo_|official_)/.test(key) && typeof item === 'string') localStorage.setItem(key, item);
        }
        window.location.reload();
      } catch { setStatus('تعذر استعادة الملف. اختر ملف إعدادات صادر من هذه الشاشة.'); }
    };
    reader.readAsText(file);
  }

  const filteredLogs = useMemo(() => workLogs, [workLogs]);
  function exportCsv() {
    const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const lines = [
      ['الموظف', 'التاريخ', 'الوقت', 'طبيعة العمل', 'المنطقة', 'مكان العمل'].map(escapeCell).join(','),
      ...filteredLogs.map((row: WorkLog) => [row.userNameAr, row.date, row.time, row.activityAr, row.area || '', row.location === 'OFFICE' ? 'مكتبي' : 'ميداني'].map(escapeCell).join(',')),
    ];
    download('كشف-الأعمال.csv', '\uFEFF' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  }

  return <main className="space-y-5">
    <header className="app-page-heading">
      <h1 className="mt-2 text-2xl font-bold">{title}</h1>
      <p>حالات سير العمل والخانات الإضافية تُحفظ مركزيًا في قاعدة البيانات وتظهر للمخولين من أي جهاز.</p>
    </header>

    {loadingConfig && page !== 'backup' && <Card>جارٍ تحميل الإعدادات المشتركة…</Card>}
    {configError && page !== 'backup' && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{configError}</p>}
    {configSaved && page !== 'backup' && <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">تم حفظ الإعدادات المشتركة في قاعدة البيانات.</p>}

    {page === 'workflow' && <>
      <Card title="إعداد حالات سير العمل" subtitle="أضف الحالات ورتّبها ثم احفظها لتظهر إعداداتك من أجهزة أخرى.">
        <form className="flex flex-wrap gap-2" onSubmit={event => {
          event.preventDefault();
          if (workflowName.trim()) { setWorkflow(items => [...items, workflowName.trim()]); setWorkflowName(''); setConfigSaved(false); }
        }}>
          <input className="min-h-11 flex-1 rounded-input border border-brand-border bg-transparent px-3" aria-label="اسم الحالة" placeholder="اكتب اسم الحالة الجديدة" value={workflowName} onChange={event => setWorkflowName(event.target.value)} />
          <Button type="submit" disabled={loadingConfig || savingConfig} leftIcon={<Plus size={16} />}>إضافة حالة</Button>
        </form>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[500px] text-sm"><thead className="bg-brand-magenta text-white"><tr><th className="p-3">الترتيب</th><th className="p-3 text-start">حالة سير العمل</th><th className="p-3">إجراء</th></tr></thead><tbody>
          {workflow.map((name, index) => <tr key={`${name}-${index}`} className="border-t border-brand-border"><td className="p-3 text-center">{index + 1}<div className="mt-1 flex justify-center gap-1"><button type="button" aria-label="تحريك لأعلى" disabled={!index} onClick={() => { setWorkflow(items => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; }); setConfigSaved(false); }}><ArrowUp size={15} /></button><button type="button" aria-label="تحريك لأسفل" disabled={index === workflow.length - 1} onClick={() => { setWorkflow(items => { const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; }); setConfigSaved(false); }}><ArrowDown size={15} /></button></div></td><td className="p-3"><input className="w-full rounded-input border border-brand-border bg-transparent px-3 py-2" value={name} onChange={event => { setWorkflow(items => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item)); setConfigSaved(false); }} /></td><td className="p-3 text-center"><Button size="sm" variant="danger" disabled={workflow.length <= 1} onClick={() => { setWorkflow(items => items.filter((_, itemIndex) => itemIndex !== index)); setConfigSaved(false); }}>حذف</Button></td></tr>)}
        </tbody></table></div>
        <Button className="mt-4" disabled={loadingConfig || savingConfig} isLoading={savingConfig} onClick={() => void saveSharedSettings()}>{savingConfig ? 'جارٍ الحفظ…' : 'حفظ حالات سير العمل'}</Button>
      </Card>
      <Card title="قوائم بيانات المشروع"><p className="text-sm">تظهر أنواع المشاريع وأسماء المنسقين والمحررين في قوائم إنشاء المشروع. يمكن تعديلها من بيانات المشروع والصلاحيات الحالية.</p></Card>
    </>}

    {page === 'accountTypes' && <AccountTypesAdmin />}

    {page === 'customFields' && <>
      <Card title="إضافة خانة جديدة للنموذج">
        <form className="grid gap-3 md:grid-cols-3" onSubmit={event => {
          event.preventDefault();
          if (fieldName.trim()) { setFields(items => [...items, { id: `field-${Date.now()}`, name: fieldName.trim(), type: fieldType, required: fieldRequired }]); setFieldName(''); setConfigSaved(false); }
        }}>
          <label className="text-sm">اسم الخانة<input className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" placeholder="مثال: اسم المشروع" value={fieldName} onChange={event => setFieldName(event.target.value)} /></label>
          <label className="text-sm">نوع الخانة<select className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={fieldType} onChange={event => setFieldType(event.target.value)}>{FIELD_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
          <label className="flex items-center gap-2 self-end rounded-lg border border-brand-border p-3"><input type="checkbox" checked={fieldRequired} onChange={event => setFieldRequired(event.target.checked)} /> إلزامية</label>
          <Button className="md:col-span-3" type="submit" disabled={loadingConfig || savingConfig}>إضافة الخانة</Button>
        </form>
      </Card>
      <Card title="الخانات الحالية وترتيبها"><div className="overflow-x-auto"><table className="w-full min-w-[500px] text-sm"><thead className="bg-brand-magenta text-white"><tr><th className="p-3">الترتيب</th><th className="p-3 text-start">الخانة</th><th className="p-3">النوع</th><th className="p-3">إلزامية</th><th className="p-3">إجراء</th></tr></thead><tbody>
        {fields.map((field, index) => <tr key={field.id} className="border-t border-brand-border"><td className="p-3 text-center">{index + 1}</td><td className="p-3">{field.name}</td><td className="p-3 text-center">{field.type}</td><td className="p-3 text-center">{field.required ? 'نعم' : 'لا'}</td><td className="p-3 text-center"><Button variant="danger" size="sm" disabled={savingConfig} onClick={() => { setFields(items => items.filter(item => item.id !== field.id)); setConfigSaved(false); }}><Trash2 size={14} /></Button></td></tr>)}
      </tbody></table></div>
        <Button className="mt-4" disabled={loadingConfig || savingConfig} isLoading={savingConfig} onClick={() => void saveSharedSettings()}>{savingConfig ? 'جارٍ الحفظ…' : 'حفظ الخانات الإضافية'}</Button>
      </Card>
    </>}

    {page === 'backup' && <>
      <Card title="حالة النسخ الاحتياطي" action={<Database className="text-brand-plum" />}><p>لا توجد نسخة احتياطية تلقائية لقاعدة Neon مفعّلة بعد.</p><p className="mt-2 text-sm text-brand-charcoal/70">{lastBackup}</p></Card>
      <Card title="ملف محلي للإعدادات فقط"><p className="mb-4 text-sm">هذا الملف يحتوي على إعدادات العرض المحلية في هذا المتصفح فقط؛ لا يشمل المستخدمين أو سجلات العمل أو التكليفات المخزنة في قاعدة البيانات، لذلك لا يُعد نسخة احتياطية للنظام.</p><div className="flex flex-wrap gap-2"><Button onClick={exportBackup} leftIcon={<Download size={16} />}>تنزيل إعدادات هذا المتصفح</Button><label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-btn border border-brand-border px-4 py-2 text-sm font-bold hover:border-brand-plum"><Upload size={16} />استرجاع إعدادات محلية<input type="file" accept="application/json,.json" className="sr-only" onChange={event => restoreBackup(event.target.files?.[0])} /></label></div></Card>
      <Card title="أرشفة الأعمال على Google Drive"><p className="text-sm">ميزة الربط السحابي غير مهيأة؛ لا يتم إرسال أو حذف بيانات من Google Drive.</p><Button className="mt-3" variant="outline" disabled>ربط Google Drive</Button></Card>
      <Card title="قياس مساحة المتصفح" action={<Database className="text-brand-plum" />}><p>{usage}</p><p className="mt-2 text-xs text-brand-charcoal/70">هذا القياس يخص هذا المتصفح، وليس مساحة قاعدة بيانات Neon.</p><Button className="mt-3" variant="outline" onClick={() => void navigator.storage?.estimate?.().then(result => setUsage(`مساحة المتصفح: ${Math.round(result.usage || 0)} بايت مستخدمة من ${Math.round(result.quota || 0)} بايت متاحة.`))}>تحديث القياس</Button></Card>
    </>}
    {status && <p role="status" className="rounded-lg border border-brand-border bg-white p-3 text-sm">{status}</p>}
  </main>;
};
