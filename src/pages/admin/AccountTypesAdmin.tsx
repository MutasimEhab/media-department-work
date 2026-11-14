import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { ALL_PERMISSIONS, AppPermission, DEFAULT_ROLE_PERMISSIONS, PERMISSION_LABELS } from '../../auth/permissions';

interface AccountType { code: string; nameAr: string; baseRoleCode: string; isSystem: boolean }
const BASE_ROLE_LABELS: Record<string, string> = {
  department_manager: 'مدير القسم', deputy_manager: 'نائب مدير القسم', employee: 'موظف',
};
const ADMIN_ONLY = new Set(['manage_system_settings', 'view_audit_log', 'view_system_health']);
const EMPLOYEE_RESTRICTED = new Set(['view_management_dashboard', 'view_department_work_logs', 'view_department_reports', 'manage_users', 'manage_work_exceptions']);

export const AccountTypesAdmin: React.FC = () => {
  const { currentUser, rolePermissions, updateRolePermission } = useApp();
  const [types, setTypes] = useState<AccountType[]>([]);
  const [name, setName] = useState('');
  const [baseRoleCode, setBaseRoleCode] = useState('employee');
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const isAdmin = currentUser.role === 'ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/account-types', { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'تعذر تحميل أنواع الحسابات.');
      setTypes(payload.accountTypes as AccountType[]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/account-types', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nameAr: name, baseRoleCode }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'تعذر إضافة نوع الحساب.');
      setName(''); await load();
      setNotice('تم إنشاء النوع بدون صلاحيات مبدئياً؛ اختر الصلاحيات بشكل مستقل أدناه.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.'); }
    finally { setSaving(false); }
  }

  async function rename(item: AccountType) {
    const nameAr = renames[item.code]?.trim();
    if (!nameAr || nameAr === item.nameAr) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/account-types/${encodeURIComponent(item.code)}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nameAr }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'تعذر تعديل النوع.');
      setTypes((items) => items.map((value) => value.code === item.code ? payload.accountType : value));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.'); }
    finally { setSaving(false); }
  }

  async function remove(item: AccountType) {
    if (!window.confirm(`حذف نوع الحساب «${item.nameAr}»؟ لا يمكن حذف نوع مرتبط بحسابات مستخدمين.`)) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/account-types/${encodeURIComponent(item.code)}`, { method: 'DELETE', credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'تعذر حذف النوع.');
      setTypes((items) => items.filter((value) => value.code !== item.code));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.'); }
    finally { setSaving(false); }
  }

  return <div className="space-y-4">
    <Card title="أنواع الحسابات" subtitle="كل نوع جديد يبدأ بلا صلاحيات؛ يختار مدير النظام صلاحياته بشكل مستقل.">
      {isAdmin && <form className="grid gap-3 sm:grid-cols-[1fr_220px_auto]" onSubmit={create}>
        <label className="text-sm">اسم نوع الحساب<input required maxLength={80} className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" placeholder="مثال: مشرف محتوى" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="text-sm">النطاق التنظيمي<select className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={baseRoleCode} onChange={(event) => setBaseRoleCode(event.target.value)}>{Object.entries(BASE_ROLE_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
        <Button type="submit" className="self-end" disabled={saving || !name.trim()}>إضافة نوع</Button>
      </form>}
      {!isAdmin && <p className="text-sm">إضافة الأنواع وتعديل صلاحياتها متاحان لمدير النظام.</p>}
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      {notice && <p role="status" className="mt-3 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
    </Card>
    {loading ? <Card>جارٍ تحميل أنواع الحسابات…</Card> : types.map((item) => {
      const permissions = rolePermissions[item.code] || (item.isSystem ? DEFAULT_ROLE_PERMISSIONS[
        item.baseRoleCode === 'department_manager' ? 'MANAGER' : item.baseRoleCode === 'deputy_manager' ? 'DEPUTY' : 'EMPLOYEE'
      ] : []);
      return <Card key={item.code} title={item.nameAr} subtitle={`النطاق: ${BASE_ROLE_LABELS[item.baseRoleCode] || item.baseRoleCode} · ${item.isSystem ? 'نوع أساسي' : 'نوع مخصص'}`}>
        <div className="flex flex-wrap gap-2">
          {!item.isSystem && <><input aria-label={`اسم ${item.nameAr}`} className="min-h-10 flex-1 rounded-input border border-brand-border bg-transparent px-3" value={renames[item.code] ?? item.nameAr} onChange={(event) => setRenames((values) => ({ ...values, [item.code]: event.target.value }))} /><Button size="sm" variant="outline" disabled={saving || !renames[item.code]?.trim() || renames[item.code] === item.nameAr} onClick={() => void rename(item)}>حفظ الاسم</Button><Button size="sm" variant="danger" disabled={saving} onClick={() => void remove(item)}>حذف النوع</Button></>}
          {item.isSystem && <p className="text-sm">الصلاحيات الافتراضية لهذا النوع محفوظة في النظام.</p>}
        </div>
        {!item.isSystem && <div className="mt-4 grid gap-2 sm:grid-cols-2">{ALL_PERMISSIONS.map((permission: AppPermission) => {
          const forbidden = ADMIN_ONLY.has(permission) || (item.baseRoleCode === 'employee' && EMPLOYEE_RESTRICTED.has(permission));
          return <label key={permission} className="flex items-center gap-2 rounded-lg border border-brand-border p-3 text-sm"><input type="checkbox" checked={permissions.includes(permission)} disabled={!isAdmin || saving || forbidden} onChange={async (event) => { setSaving(true); await updateRolePermission(item.code, permission, event.target.checked); setSaving(false); }} /><span>{PERMISSION_LABELS[permission]}</span></label>;
        })}</div>}
      </Card>;
    })}
  </div>;
};
