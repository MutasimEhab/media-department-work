import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { User, UserRole } from '../../types';
import { useApp } from '../../context/AppContext';

interface DepartmentOption { id: string; nameAr: string }
interface PermissionOption { code: string; name_ar: string; enabled: boolean }

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'مدير النظام', MANAGER: 'مدير الدائرة', DEPUTY: 'نائب مدير الدائرة', EMPLOYEE: 'موظف',
};

export const DatabaseUsers: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const { setCurrentUser } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [permissionTarget, setPermissionTarget] = useState<User | null>(null);
  const [permissionOptions, setPermissionOptions] = useState<PermissionOption[]>([]);
  const [permissionSelection, setPermissionSelection] = useState<string[]>([]);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [profileTarget, setProfileTarget] = useState<User | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ jobTitleAr: '', employeeNumber: '' });
  const [form, setForm] = useState({
    arabicName: '', username: '', email: '', jobTitleAr: '', employeeNumber: '', mobile: '',
    role: 'EMPLOYEE' as UserRole, departmentId: '', password: '',
  });

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, departmentsResponse] = await Promise.all([
        fetch('/api/users', { credentials: 'include' }),
        fetch('/api/users/departments', { credentials: 'include' }),
      ]);
      const usersPayload = await usersResponse.json();
      const departmentsPayload = await departmentsResponse.json();
      if (!usersResponse.ok) throw new Error(usersPayload.message || 'تعذر تحميل المستخدمين.');
      if (!departmentsResponse.ok) throw new Error(departmentsPayload.message || 'تعذر تحميل الدوائر.');
      setUsers(usersPayload.users as User[]);
      const departmentRows = departmentsPayload.departments as DepartmentOption[];
      setDepartments(departmentRows);
      setForm((previous) => ({ ...previous, departmentId: previous.departmentId || departmentRows[0]?.id || '' }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadUsers(); }, []);

  const allowedRoles: UserRole[] = currentUser.role === 'ADMIN'
    ? ['MANAGER', 'DEPUTY', 'EMPLOYEE']
    : currentUser.role === 'MANAGER' ? ['DEPUTY', 'EMPLOYEE']
      : currentUser.role === 'DEPUTY' ? ['EMPLOYEE'] : [];

  const visibleUsers = useMemo(() => users.filter((user) =>
    (!query || `${user.arabicName} ${user.username ?? ''} ${user.email}`.toLowerCase().includes(query.toLowerCase()))
    && (!role || user.role === role)), [users, query, role]);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'تعذر إنشاء الحساب.');
      setNotice('تم إنشاء الحساب وحفظه في قاعدة البيانات. أعطِ الموظف اسم المستخدم وكلمة المرور بشكل آمن.');
      setForm((previous) => ({ ...previous, arabicName: '', username: '', email: '', jobTitleAr: '', employeeNumber: '', mobile: '', password: '' }));
      setShowForm(false);
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally {
      setSaving(false);
    }
  }

  async function openPermissions(user: User) {
    setPermissionTarget(user);
    setPermissionLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.id)}/permissions`, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'تعذر تحميل الصلاحيات.');
      const options = payload.permissions as PermissionOption[];
      setPermissionOptions(options);
      setPermissionSelection(options.filter((item) => item.enabled).map((item) => item.code));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
      setPermissionTarget(null);
    } finally {
      setPermissionLoading(false);
    }
  }

  async function savePermissions() {
    if (!permissionTarget) return;
    setPermissionSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(permissionTarget.id)}/permissions`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionCodes: permissionSelection }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'تعذر حفظ الصلاحيات.');
      setNotice(`تم حفظ صلاحيات ${permissionTarget.arabicName}.`);
      setPermissionTarget(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally {
      setPermissionSaving(false);
    }
  }

  function editProfile(user: User) {
    setProfileTarget(user);
    setProfileForm({ jobTitleAr: user.jobTitleAr, employeeNumber: user.employeeNumber ?? '' });
    setError('');
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profileTarget) return;
    setProfileSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(profileTarget.id)}/profile`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'تعذر حفظ البيانات.');
      if (profileTarget.id === currentUser.id) {
        setCurrentUser({ ...currentUser, jobTitleAr: profileForm.jobTitleAr.trim(), employeeNumber: profileForm.employeeNumber.trim() });
      }
      setProfileTarget(null);
      await loadUsers();
      setNotice('تم تحديث المسمى الوظيفي والرقم الوظيفي.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function changeAccountStatus(user: User, isActive: boolean) {
    const action = isActive ? 'إعادة تفعيل' : 'إيقاف';
    if (!window.confirm(`هل تريد ${action} حساب ${user.arabicName}؟ ${isActive ? '' : 'سيُمنع من الدخول فوراً، وستبقى سجلاته محفوظة.'}`)) return;
    setError('');
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.id)}/status`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'تعذر تغيير حالة الحساب.');
      await loadUsers();
      setNotice(`تم ${action} الحساب بنجاح.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    }
  }

  async function deleteAccount(user: User) {
    if (!window.confirm(`سيُحذف حساب ${user.arabicName} نهائياً. إذا كان مرتبطاً بسجلات، سيرفض النظام الحذف وسيبقى بإمكانك إيقافه. هل تريد المتابعة؟`)) return;
    setError('');
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.id)}`, {
        method: 'DELETE', credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'تعذر حذف الحساب.');
      await loadUsers();
      setNotice('تم حذف الحساب نهائياً.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    }
  }

  return <main className="space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3 app-page-heading">
      <div><h1 className="text-2xl font-bold">إدارة المستخدمين</h1><p>الحسابات المعروضة محفوظة في قاعدة البيانات.</p></div>
      {allowedRoles.length > 0 && <Button onClick={() => { setShowForm((value) => !value); setError(''); }}>{showForm ? 'إغلاق النموذج' : 'إضافة مستخدم'}</Button>}
    </header>

    {notice && <p role="status" className="rounded-lg border border-brand-border bg-white p-3 text-sm">{notice}</p>}
    {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}

    {showForm && <Card title="إنشاء حساب مستخدم">
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={createUser}>
        <label className="text-sm">الاسم بالعربية<input required className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.arabicName} onChange={(event) => setForm({ ...form, arabicName: event.target.value })}/></label>
        <label className="text-sm">اسم المستخدم<input required autoComplete="off" dir="ltr" className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })}/></label>
        <label className="text-sm">البريد الإلكتروني<input required type="email" dir="ltr" className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label>
        <label className="text-sm">المسمى الوظيفي<input required className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.jobTitleAr} onChange={(event) => setForm({ ...form, jobTitleAr: event.target.value })}/></label>
        <label className="text-sm">الرقم الوظيفي<input required maxLength={40} dir="ltr" inputMode="numeric" className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.employeeNumber} onChange={(event) => setForm({ ...form, employeeNumber: event.target.value })}/></label>
        <label className="text-sm">رقم الاتصال<input dir="ltr" className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })}/></label>
        <label className="text-sm">الدور<select className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>{allowedRoles.map((value) => <option key={value} value={value}>{roleLabels[value]}</option>)}</select></label>
        {currentUser.role === 'ADMIN' && <label className="text-sm">الدائرة<select required className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>{departments.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}</select></label>}
        <label className="text-sm sm:col-span-2">كلمة مرور أولية (9 أحرف أو أرقام على الأقل)<input required minLength={9} maxLength={72} type="password" autoComplete="new-password" className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}/></label>
        <p className="text-xs sm:col-span-2">أدخل كلمة مرور مؤقتة وشاركها مع الموظف بشكل آمن؛ تغيير كلمة المرور من داخل النظام سيُضاف لاحقاً.</p>
        <Button type="submit" disabled={saving || !allowedRoles.includes(form.role)}>{saving ? 'جارٍ الحفظ…' : 'حفظ الحساب'}</Button>
      </form>
    </Card>}

    <Card>
      <div className="flex flex-wrap gap-2">
        <input className="min-h-10 rounded-input border border-brand-border bg-transparent px-3" placeholder="بحث بالاسم أو المستخدم أو البريد" value={query} onChange={(event) => setQuery(event.target.value)}/>
        <select className="min-h-10 rounded-input border border-brand-border bg-transparent px-3" value={role} onChange={(event) => setRole(event.target.value)}><option value="">كل الأدوار</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <Button variant="outline" onClick={() => void loadUsers()}>تحديث القائمة</Button>
      </div>
      {loading ? <p className="mt-4">جارٍ تحميل الحسابات…</p> : visibleUsers.length ? <div className="mt-4 space-y-3">{visibleUsers.map((user) => {
        const canManageAccount = currentUser.role === 'ADMIN'
          ? user.role !== 'ADMIN'
          : (currentUser.role === 'MANAGER' || currentUser.role === 'DEPUTY') && user.role === 'EMPLOYEE';
        const canEditProfile = currentUser.role === 'ADMIN'
          || (currentUser.role === 'MANAGER' || currentUser.role === 'DEPUTY') && user.role === 'EMPLOYEE';
        return <article key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-border p-4"><div><b>{user.arabicName}</b><p>{user.jobTitleAr} · {roleLabels[user.role]} · {user.isActive ? 'نشط' : 'غير نشط'}</p><p>الرقم الوظيفي: <span dir="ltr">{user.employeeNumber || 'غير محدد'}</span></p><p>{user.departmentAr}</p><p dir="ltr">{user.username} · {user.email} · {user.mobile || '—'}</p></div><div className="flex flex-wrap gap-2">{canEditProfile && <Button size="sm" variant="outline" onClick={() => editProfile(user)}>تعديل المسمى والرقم</Button>}{canManageAccount && <><Button size="sm" variant="outline" onClick={() => void openPermissions(user)}>إدارة الصلاحيات</Button><Button size="sm" variant="outline" onClick={() => void changeAccountStatus(user, !user.isActive)}>{user.isActive ? 'إيقاف الحساب' : 'إعادة التفعيل'}</Button><Button size="sm" variant="danger" onClick={() => void deleteAccount(user)}>حذف الحساب</Button></>}</div></article>;
      })}</div> : <p className="mt-4">لا توجد حسابات مطابقة.</p>}
    </Card>

    {permissionTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !permissionSaving) setPermissionTarget(null); }}><section className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 text-brand-darkText shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="permission-heading"><h2 id="permission-heading" className="text-xl font-bold">صلاحيات {permissionTarget.arabicName}</h2>{permissionLoading ? <p className="mt-4">جارٍ تحميل الصلاحيات…</p> : <div className="mt-4 grid gap-2 sm:grid-cols-2">{permissionOptions.map((permission) => <label key={permission.code} className="flex items-center gap-2 rounded-lg border border-brand-border p-3"><input type="checkbox" checked={permissionSelection.includes(permission.code)} onChange={(event) => setPermissionSelection((current) => event.target.checked ? [...current, permission.code] : current.filter((code) => code !== permission.code))}/><span>{permission.name_ar}</span></label>)}</div>}{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-4 flex gap-2"><Button disabled={permissionLoading || permissionSaving} onClick={() => void savePermissions()}>{permissionSaving ? 'جارٍ الحفظ…' : 'حفظ الصلاحيات'}</Button><Button variant="outline" disabled={permissionSaving} onClick={() => setPermissionTarget(null)}>إلغاء</Button></div></section></div>}
    {profileTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !profileSaving) setProfileTarget(null); }}><section className="w-full max-w-lg rounded-xl bg-white p-5 text-brand-darkText shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="profile-heading"><h2 id="profile-heading" className="text-xl font-bold">تعديل بيانات {profileTarget.arabicName}</h2><form className="mt-4 space-y-3" onSubmit={saveProfile}><label className="block text-sm">المسمى الوظيفي<input required className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={profileForm.jobTitleAr} onChange={(event) => setProfileForm({ ...profileForm, jobTitleAr: event.target.value })}/></label><label className="block text-sm">الرقم الوظيفي<input required maxLength={40} dir="ltr" inputMode="numeric" className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={profileForm.employeeNumber} onChange={(event) => setProfileForm({ ...profileForm, employeeNumber: event.target.value })}/></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex gap-2"><Button type="submit" disabled={profileSaving}>{profileSaving ? 'جارٍ الحفظ…' : 'حفظ التعديل'}</Button><Button type="button" variant="outline" disabled={profileSaving} onClick={() => setProfileTarget(null)}>إلغاء</Button></div></form></section></div>}
  </main>;
};
