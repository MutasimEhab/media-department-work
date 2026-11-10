import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { useApp } from '../../context/AppContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { WorkLog } from '../../types';
import { downloadCsv } from '../../utils/downloadCsv';
import { formatArabicWorkDate } from '../../utils/dateFormatting';
import { downloadWorkReportPdf } from '../../utils/workReportPdf';

export const WorkHistory: React.FC = () => {
  const { language, currentUser, workLogs, tasks, projects, updateWorkLog, deleteWorkLog, notify, institutionLogo } = useApp();
  const ar = language === 'ar';
  const tx = (arabic: string, english: string) => ar ? arabic : english;
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [mode, setMode] = useState('');
  const [area, setArea] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<WorkLog>>({});
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState('');

  useEscapeKey(Boolean(selected), () => { setSelected(null); setEditing(false); });
  const rows = useMemo(() => workLogs.filter(log => log.userId === currentUser.id
    && (!query || `${log.activityAr} ${log.area || ''}`.toLowerCase().includes(query.toLowerCase()))
    && (!fromDate || log.date >= fromDate)
    && (!toDate || log.date <= toDate)
    && (!mode || log.location === mode)
    && (!area || (log.area || '').toLowerCase().includes(area.toLowerCase()))),
  [workLogs, currentUser.id, query, fromDate, toDate, mode, area]);
  const detail = workLogs.find(log => log.id === selected);
  const canEditOwnLogs = currentUser.role === 'EMPLOYEE' || currentUser.role === 'ADMIN';

  const exportCsv = () => downloadCsv('سجل-أعمالي.csv',
    ['التاريخ', 'الوقت', 'التفاصيل', 'المنطقة', 'مكان العمل'],
    rows.map(row => [row.date, row.time, row.activityAr, row.area || '', row.location === 'OFFICE' ? 'مكتبي' : 'ميداني']));

  const exportPdf = async () => {
    setPdfBusy(true);
    setError('');
    try {
      await downloadWorkReportPdf(rows, [{
        id: currentUser.id, arabicName: currentUser.arabicName,
        employeeNumber: currentUser.employeeNumber, jobTitleAr: currentUser.jobTitleAr,
      }], fromDate, toDate, currentUser.id, institutionLogo);
      notify('تم تجهيز كشف الأعمال وبدء تنزيل ملف PDF.', 'success');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'تعذر إنشاء ملف PDF.';
      setError(message);
      notify(message, 'error');
    } finally {
      setPdfBusy(false);
    }
  };

  const startEditing = (log: WorkLog) => {
    setSelected(log.id);
    setEditForm({ ...log });
    setError('');
    setEditing(true);
  };

  const saveChanges = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail || busy) return;
    setBusy(true);
    setError('');
    const result = await updateWorkLog(detail.id, editForm);
    setBusy(false);
    if (!result.ok) { setError(result.message || 'تعذر حفظ التعديل.'); return; }
    setEditing(false);
  };

  const permanentlyDelete = async (log: WorkLog) => {
    if (busy || !window.confirm('سيُحذف هذا السجل نهائياً ولن يمكن استرجاعه. هل تريد المتابعة؟')) return;
    setBusy(true);
    setError('');
    const result = await deleteWorkLog(log.id);
    setBusy(false);
    if (!result.ok) { setError(result.message || 'تعذر حذف السجل.'); return; }
    setSelected(null);
    setEditing(false);
  };

  const columns = [
    { key: 'date', header: tx('التاريخ', 'Date'), render: (row: WorkLog) => formatArabicWorkDate(row.date) },
    { key: 'activityAr', header: tx('تفاصيل العمل', 'Work details'), render: (row: WorkLog) => <button className="underline text-brand-plum" onClick={() => setSelected(row.id)}>{row.activityAr}</button> },
    { key: 'area', header: tx('المنطقة', 'Area') },
    { key: 'location', header: tx('النمط', 'Mode'), render: (row: WorkLog) => row.location === 'OFFICE' ? tx('المكتب', 'Office') : tx('الميدان', 'Field') },
    { key: 'open', header: tx('تفاصيل', 'Details'), render: (row: WorkLog) => <Button size="sm" variant="outline" onClick={() => setSelected(row.id)}>{tx('عرض', 'View')}</Button> },
    ...(canEditOwnLogs ? [{ key: 'actions', header: tx('الإجراءات', 'Actions'), render: (row: WorkLog) => <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => startEditing(row)}>{tx('تعديل', 'Edit')}</Button><Button size="sm" variant="outline" onClick={() => void permanentlyDelete(row)}>{tx('حذف', 'Delete')}</Button></div> }] : []),
  ];

  return <main className="space-y-5 printable-report">
    <header className="app-page-heading">
      <h1 className="mt-2 text-2xl font-bold">{tx('الكشف الخاص بي', 'My timesheet')}</h1>
      <p>{tx('سجلاتك محفوظة في قاعدة النظام. يمكنك تعديل سجلك أو حذفه نهائياً.', 'Your work logs are saved in the system database. You can edit or permanently delete your own entries.')}</p>
    </header>

    <Card>
      <div className="border-b border-brand-border pb-3"><h2 className="font-subheading font-bold">{tx('فلترة كشف الأعمال حسب الفترة', 'Filter work log by date range')}</h2></div>
      <div className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">{tx('من تاريخ', 'From date')}<input type="date" dir="ltr" className="mt-1 w-full rounded-input border border-brand-border p-2.5" value={fromDate} onChange={event => setFromDate(event.target.value)} /></label>
        <label className="text-sm">{tx('إلى تاريخ', 'To date')}<input type="date" dir="ltr" className="mt-1 w-full rounded-input border border-brand-border p-2.5" value={toDate} onChange={event => setToDate(event.target.value)} /></label>
        <label className="text-sm">{tx('بحث بالتفاصيل', 'Search details')}<input className="mt-1 w-full rounded-input border border-brand-border p-2.5" placeholder={tx('كلمة أو منطقة', 'Keyword or area')} value={query} onChange={event => setQuery(event.target.value)} /></label>
        <label className="text-sm">{tx('مكان العمل', 'Work location')}<select className="mt-1 w-full rounded-input border border-brand-border p-2.5" value={mode} onChange={event => setMode(event.target.value)}><option value="">{tx('الكل', 'All')}</option><option value="OFFICE">{tx('المكتب', 'Office')}</option><option value="FIELD">{tx('الميدان', 'Field')}</option></select></label>
        <label className="text-sm sm:col-span-2">{tx('المنطقة', 'Area')}<input className="mt-1 w-full rounded-input border border-brand-border p-2.5" placeholder={tx('تصفية حسب المنطقة', 'Filter by area')} value={area} onChange={event => setArea(event.target.value)} /></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="me-auto text-xs text-brand-charcoal/70">{tx('السجلات المطابقة', 'Matching records')}: {rows.length}</span>
        <Button size="sm" variant="secondary" onClick={() => { setFromDate(''); setToDate(''); setQuery(''); setMode(''); setArea(''); }}>{tx('مسح الفلتر', 'Clear filters')}</Button>
        <Button size="sm" variant="outline" disabled={!rows.length || pdfBusy} isLoading={pdfBusy} onClick={() => void exportPdf()}>{tx('تنزيل PDF بالترويسة', 'Download letterhead PDF')}</Button>
        <Button size="sm" variant="outline" onClick={exportCsv}>{tx('تنزيل CSV', 'Download CSV')}</Button>
        <Link to="/app/work/new"><Button size="sm">{tx('إضافة عمل', 'Add work')}</Button></Link>
      </div>
    </Card>

    {rows.length === 0 ? <Card><p>{workLogs.some(log => log.userId === currentUser.id) ? tx('لا توجد نتائج مطابقة.', 'No matching records.') : tx('لا توجد سجلات بعد. ابدأ بتسجيل عمل اليوم.', 'No records yet. Start by logging today’s work.')}</p></Card>
      : <><div className="hidden md:block"><Table columns={columns} data={rows} keyExtractor={row => row.id} /></div>
        <div className="space-y-3 md:hidden">{rows.map(row => <Card key={row.id}><p>{formatArabicWorkDate(row.date)} · <span dir="ltr">{row.time}</span></p><b>{row.activityAr}</b><p>{row.area || '—'} · {row.location === 'OFFICE' ? tx('المكتب', 'Office') : tx('الميدان', 'Field')}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelected(row.id)}>{tx('تفاصيل', 'Details')}</Button>{canEditOwnLogs&&<><Button size="sm" onClick={() => startEditing(row)}>{tx('تعديل', 'Edit')}</Button><Button size="sm" variant="outline" onClick={() => void permanentlyDelete(row)}>{tx('حذف', 'Delete')}</Button></>}</div></Card>)}</div></>}

    {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) { setSelected(null); setEditing(false); } }}>
      <section className="max-h-[90vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-xl bg-white p-6 text-brand-darkText" role="dialog" aria-modal="true" aria-labelledby="work-detail-title">
        <div className="flex items-center justify-between"><h2 id="work-detail-title" className="text-xl font-bold">{tx('سجل العمل', 'Work log')} · {formatArabicWorkDate(detail.date)}</h2><button onClick={() => { setSelected(null); setEditing(false); }} aria-label={tx('إغلاق', 'Close')}>×</button></div>
        {!editing ? <>
          <p>{formatArabicWorkDate(detail.date)} · <span dir="ltr">{detail.time}</span></p><p className="font-bold">{detail.activityAr}</p><p>{detail.area || '—'} · {detail.location === 'OFFICE' ? tx('المكتب', 'Office') : tx('الميدان', 'Field')}</p>
          {detail.projectId && <p>{tx('المشروع', 'Project')}: {projects.find(project => project.id === detail.projectId)?.titleAr}</p>}
          {detail.relatedTaskId && <p>{tx('التكليف', 'Assignment')}: {tasks.find(task => task.id === detail.relatedTaskId)?.titleAr}</p>}
          {detail.outputLink && <a className="underline text-brand-plum" href={detail.outputLink} target="_blank" rel="noreferrer">{tx('رابط المخرجات', 'Output link')}</a>}
          {canEditOwnLogs&&<div className="flex flex-wrap gap-2 border-t border-brand-border pt-4"><Button disabled={busy} onClick={() => startEditing(detail)}>{tx('تعديل السجل', 'Edit log')}</Button><Button disabled={busy} variant="outline" onClick={() => void permanentlyDelete(detail)}>{tx('حذف نهائي', 'Delete permanently')}</Button></div>}
        </> : <form className="space-y-3" onSubmit={saveChanges}>
          <label className="block text-sm">{tx('تفاصيل العمل', 'Work details')}<textarea required maxLength={300} rows={5} className="mt-1 w-full rounded-input border border-brand-border p-3" value={editForm.activityAr || ''} onChange={event => setEditForm(current => ({ ...current, activityAr: event.target.value }))} /></label>
          <label className="block text-sm">{tx('المنطقة', 'Area')}<select required className="mt-1 w-full rounded-input border border-brand-border p-3" value={editForm.area || ''} onChange={event => setEditForm(current => ({ ...current, area: event.target.value }))}><option value="">{tx('اختر المنطقة', 'Select an area')}</option><option value="شمال قطاع غزة">شمال قطاع غزة</option><option value="جنوب قطاع غزة">جنوب قطاع غزة</option></select></label>
          <label className="block text-sm">{tx('مكان العمل', 'Work location')}<select className="mt-1 w-full rounded-input border border-brand-border p-3" value={editForm.location || 'OFFICE'} onChange={event => setEditForm(current => ({ ...current, location: event.target.value as WorkLog['location'] }))}><option value="OFFICE">{tx('مكتبي', 'Office')}</option><option value="FIELD">{tx('ميداني', 'Field')}</option></select></label>
          <label className="block text-sm">{tx('رابط Google Drive (اختياري)', 'Google Drive link (optional)')}<input type="url" dir="ltr" className="mt-1 w-full rounded-input border border-brand-border p-3" value={editForm.outputLink || ''} onChange={event => setEditForm(current => ({ ...current, outputLink: event.target.value }))} /></label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? tx('جارٍ الحفظ…', 'Saving…') : tx('حفظ التعديل', 'Save changes')}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { setEditing(false); setError(''); }}>{tx('إلغاء', 'Cancel')}</Button></div>
        </form>}
        {!editing && error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </section>
    </div>}
  </main>;
};
