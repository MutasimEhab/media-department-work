import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { User, UserRole } from '../../types';

interface DepartmentOption { id: string; nameAr: string }

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'مدير النظام', MANAGER: 'مدير الدائرة', DEPUTY: 'نائب مدير الدائرة', EMPLOYEE: 'موظف',
};

export const DatabaseUsers: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    arabicName: '', username: '', email: '', jobTitleAr: '', mobile: '',
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
      setForm((previous) => ({ ...previous, arabicName: '', username: '', email: '', jobTitleAr: '', mobile: '', password: '' }));
      setShowForm(false);
      await loadUsers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally {
      setSaving(false);
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
        <label className="text-sm">رقم الاتصال<input dir="ltr" className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })}/></label>
        <label className="text-sm">الدور<select className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>{allowedRoles.map((value) => <option key={value} value={value}>{roleLabels[value]}</option>)}</select></label>
        {currentUser.role === 'ADMIN' && <label className="text-sm">الدائرة<select required className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>{departments.map((item) => <option key={item.id} value={item.id}>{item.nameAr}</option>)}</select></label>}
        <label className="text-sm sm:col-span-2">كلمة مرور أولية (10 أحرف على الأقل)<input required minLength={10} maxLength={72} type="password" autoComplete="new-password" className="mt-1 block min-h-11 w-full rounded-input border border-brand-border bg-transparent px-3" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}/></label>
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
      {loading ? <p className="mt-4">جارٍ تحميل الحسابات…</p> : visibleUsers.length ? <div className="mt-4 space-y-3">{visibleUsers.map((user) => <article key={user.id} className="flex flex-wrap justify-between gap-3 rounded-lg border border-brand-border p-4"><div><b>{user.arabicName}</b><p>{user.jobTitleAr} · {roleLabels[user.role]} · {user.isActive ? 'نشط' : 'غير نشط'}</p><p>{user.departmentAr}</p><p dir="ltr">{user.username} · {user.email} · {user.mobile || '—'}</p></div></article>)}</div> : <p className="mt-4">لا توجد حسابات مطابقة.</p>}
    </Card>
  </main>;
};
