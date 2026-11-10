import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatArabicDateTime } from '../../utils/dateFormatting';

type AuditEvent = {
  id: string;
  actorNameAr: string;
  username: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

const actionNames: Record<string, string> = {
  'user.create': 'إنشاء حساب',
  'user.profile.update': 'تعديل بيانات حساب',
  'user.own_profile.update': 'تعديل الملف الشخصي',
  'user.status.update': 'تغيير حالة الحساب',
  'user.delete': 'حذف حساب',
  'user.permissions.update': 'تعديل الصلاحيات',
  'user.password.change': 'تغيير كلمة المرور',
  'work_log.create': 'تسجيل عمل',
  'work_log.update': 'تعديل سجل عمل',
  'work_log.delete': 'حذف سجل عمل',
  'assignment.create': 'إنشاء تكليف',
  'assignment.update': 'تعديل تكليف',
  'assignment.publish': 'نشر تكليف',
  'assignment.recipient.update': 'تحديث حالة تكليف',
  'project.create': 'إنشاء مشروع',
  'project.update': 'تعديل مشروع',
  'circular.create': 'إنشاء تعميم',
  'circular.publish': 'نشر تعميم',
  'circular.acknowledge': 'إقرار قراءة تعميم',
  'work_date_exception.grant': 'منح استثناء تاريخ عمل',
  'work_date_exception.revoke': 'إلغاء استثناء تاريخ عمل',
  'system_settings.update': 'تعديل إعدادات النظام',
  'role_permissions.update': 'تعديل صلاحيات نوع حساب',
  'account_type.create': 'إنشاء نوع حساب',
  'account_type.update': 'تعديل نوع حساب',
  'account_type.delete': 'حذف نوع حساب',
};

function exportCsv(events: AuditEvent[]) {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = [['التاريخ', 'المنفذ', 'اسم المستخدم', 'العملية', 'الكيان', 'معرّف الكيان'],
    ...events.map(event => [new Date(event.createdAt).toISOString(), event.actorNameAr, event.username ?? '',
      actionNames[event.action] ?? event.action, event.entityType, event.entityId ?? ''])];
  const blob = new Blob(['\uFEFF', rows.map(row => row.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'سجل-التدقيق.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export const AuditLog: React.FC = () => {
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const timer = window.setTimeout(() => {
      fetch(`/api/audit-logs?q=${encodeURIComponent(query)}&offset=0`, { credentials: 'include' })
        .then(async response => {
          const payload = await response.json() as { events?: AuditEvent[]; nextOffset?: number | null; message?: string };
          if (!response.ok) throw new Error(payload.message || 'تعذر تحميل سجل التدقيق.');
          if (!cancelled) { setEvents(payload.events ?? []); setNextOffset(payload.nextOffset ?? null); }
        })
        .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 200);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [query]);

  async function loadMore() {
    if (nextOffset === null) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/audit-logs?q=${encodeURIComponent(query)}&offset=${nextOffset}`, { credentials: 'include' });
      const payload = await response.json() as { events?: AuditEvent[]; nextOffset?: number | null; message?: string };
      if (!response.ok) throw new Error(payload.message || 'تعذر تحميل المزيد.');
      setEvents(previous => [...previous, ...(payload.events ?? [])]);
      setNextOffset(payload.nextOffset ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بالخادم.');
    } finally { setLoading(false); }
  }

  return <main className="space-y-4" dir="rtl">
    <header className="app-page-heading"><h1 className="mt-2 text-2xl font-bold">سجل التدقيق</h1><p>أحداث محفوظة في قاعدة البيانات مع صلاحيات عرض على الخادم.</p></header>
    <Card><div className="flex flex-wrap gap-2"><input className="min-h-11 flex-1 rounded-input border border-brand-border p-2" value={query} onChange={event => setQuery(event.target.value)} placeholder="بحث بالمنفذ أو العملية أو الكيان"/><Button variant="outline" disabled={!events.length} onClick={() => exportCsv(events)}>تنزيل النتائج CSV</Button></div></Card>
    {error && <Card><p role="alert">{error}</p></Card>}
    {loading && !events.length && <Card>جارٍ تحميل الأحداث…</Card>}
    {!loading && !error && !events.length && <Card>لا توجد أحداث مطابقة.</Card>}
    {events.map(event => <Card key={event.id}>
      <div className="flex flex-wrap items-start justify-between gap-2"><div><b>{actionNames[event.action] ?? event.action}</b><p>{event.actorNameAr}{event.username ? ` · ${event.username}` : ''}</p><p className="text-sm">{event.entityType}{event.entityId ? ` · ${event.entityId}` : ''}</p></div><time className="text-sm">{formatArabicDateTime(event.createdAt)}</time></div>
      {Object.keys(event.metadata ?? {}).length > 0 && <details className="mt-2"><summary className="cursor-pointer text-sm">تفاصيل الحدث</summary><pre dir="ltr" className="mt-2 overflow-auto whitespace-pre-wrap rounded-lg bg-brand-lightGray p-3 text-xs">{JSON.stringify(event.metadata, null, 2)}</pre></details>}
    </Card>)}
    {nextOffset !== null && <Button disabled={loading} variant="outline" onClick={() => void loadMore()}>{loading ? 'جارٍ التحميل…' : 'تحميل المزيد'}</Button>}
  </main>;
};
