import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

type Tab = 'INBOX' | 'PENDING' | 'ACK' | 'SENT';

export const CircularInbox: React.FC = () => {
  const { language, currentUser, circulars, acknowledgeCircular, canAccess } = useApp();
  const navigate = useNavigate();
  const ar = language === 'ar';
  const tx = (a: string, e: string) => ar ? a : e;
  const canManage = canAccess('manage_circulars');
  const canTrack = canAccess('track_circulars');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('INBOX');
  const [selected, setSelected] = useState<string | null>(null);
  const [attentionCircularId, setAttentionCircularId] = useState<string | null>(null);
  const [attention, setAttention] = useState(false);
  const [message, setMessage] = useState('');
  useEscapeKey(Boolean(selected), () => setSelected(null));
  useEscapeKey(attention, () => setAttention(false));

  const inbox = useMemo(() => circulars.filter(item => !item.isDraft
    && item.recipients.some(recipient => recipient.userId === currentUser.id)), [circulars, currentUser.id]);
  const sent = useMemo(() => circulars.filter(item => !item.isDraft
    && (canTrack || item.issuerId === currentUser.id)), [circulars, canTrack, currentUser.id]);
  const rows = useMemo(() => {
    const source = tab === 'SENT' ? sent : inbox.filter(item => {
      const recipient = item.recipients.find(row => row.userId === currentUser.id);
      if (tab === 'PENDING') return !recipient?.hasAcknowledged;
      if (tab === 'ACK') return Boolean(recipient?.hasAcknowledged);
      return true;
    });
    return source.filter(item => !query || `${item.titleAr} ${item.issuerNameAr}`.toLowerCase().includes(query.toLowerCase()));
  }, [tab, sent, inbox, currentUser.id, query]);
  const tabs: [Tab, string][] = [['INBOX', tx('الوارد', 'Inbox')], ['PENDING', tx('بانتظار القراءة', 'Unread')], ['ACK', tx('تمت القراءة', 'Read')]];
  if (canManage || canTrack) tabs.push(['SENT', tx('التعاميم المرسلة', 'Sent')]);
  const detail = circulars.find(item => item.id === selected);

  useEffect(() => {
    const pending = inbox.find(item => !item.recipients.find(row => row.userId === currentUser.id)?.hasAcknowledged);
    const key = pending ? `circular-attention-${currentUser.id}-${pending.id}` : '';
    if (pending && key && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, 'shown');
      setAttentionCircularId(pending.id);
      setAttention(true);
    }
  }, [currentUser.id, inbox]);

  async function acknowledge(circularId: string) {
    if (!window.confirm(tx('تأكيد أنك قرأت التعميم؟', 'Confirm that you have read this circular?'))) return;
    const result = await acknowledgeCircular(circularId, currentUser.id);
    setMessage(result.ok ? tx('تم تسجيل قراءة التعميم.', 'Circular marked as read.') : result.message || tx('تعذر حفظ إقرار القراءة.', 'Could not save the acknowledgment.'));
    if (result.ok) setSelected(null);
  }

  return <main className="space-y-5">
    <header className="app-page-heading flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="mt-2 text-2xl font-bold">{tx('صندوق التعاميم', 'Circulars')}</h1><p>{tx('التعاميم الموجهة إليك ومتابعة التعاميم التي أصدرتها.', 'Circulars addressed to you and those you sent.')}</p></div>
      {canManage && <Button onClick={() => navigate('/app/circulars/new')}>{tx('إنشاء تعميم', 'Create circular')}</Button>}
    </header>
    {message && <p role="status" className="rounded-lg border border-brand-green/40 bg-brand-green/10 p-3 text-sm">{message}</p>}
    <Card><div className="flex flex-wrap items-center gap-2">
      <input className="min-h-10 min-w-48 flex-1 rounded-input border border-brand-border p-2" placeholder={tx('بحث بعنوان التعميم أو المُصدر', 'Search title or sender')} value={query} onChange={event => setQuery(event.target.value)} />
      {tabs.map(([value, label]) => <Button key={value} size="sm" variant={tab === value ? 'secondary' : 'outline'} onClick={() => setTab(value)}>{label}</Button>)}
    </div></Card>
    <section className="grid gap-4 md:grid-cols-2">
      {rows.map(item => {
        const recipient = item.recipients.find(row => row.userId === currentUser.id);
        const isSent = tab === 'SENT';
        const readCount = item.recipients.filter(row => row.hasAcknowledged).length;
        return <Card key={item.id} className="h-full">
          <button className="w-full text-start" onClick={() => setSelected(item.id)}>
            <p className="text-xs text-brand-charcoal">{item.id} · {item.issuedAt}</p>
            <h2 className="mt-2 font-bold">{ar ? item.titleAr : item.titleEn}</h2>
            <p className="mt-2 text-sm">{tx('المُصدر', 'Issued by')}: {ar ? item.issuerNameAr : item.issuerNameEn}</p>
            {isSent
              ? <p className="mt-2 text-sm font-semibold">{tx(`تمت القراءة: ${readCount} من ${item.recipients.length}`, `Read: ${readCount} of ${item.recipients.length}`)}</p>
              : <p className="mt-2 text-sm">{recipient?.hasAcknowledged ? tx(`تمت القراءة · ${recipient.acknowledgedAt || ''}`, `Read · ${recipient.acknowledgedAt || ''}`) : tx('بانتظار قراءتك وإقرارك', 'Awaiting your acknowledgment')}</p>}
          </button>
          {isSent && <Button className="mt-3" size="sm" variant="outline" onClick={() => navigate(`/app/circulars/${item.id}/tracking`)}>{tx('عرض حالة القراءة', 'View read status')}</Button>}
        </Card>;
      })}
      {!rows.length && <Card>{tx('لا توجد تعاميم مطابقة.', 'No matching circulars.')}</Card>}
    </section>
    {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto" title={ar ? detail.titleAr : detail.titleEn} action={<button aria-label={tx('إغلاق', 'Close')} onClick={() => setSelected(null)}>×</button>}>
        <p>{tx('من', 'From')} {ar ? detail.issuerNameAr : detail.issuerNameEn} · {detail.issuedAt}</p>
        <p className="mt-4 whitespace-pre-line leading-8">{ar ? detail.contentAr : detail.contentEn}</p>
        {detail.issuerId === currentUser.id && <Button className="mt-4" variant="outline" onClick={() => navigate(`/app/circulars/${detail.id}/tracking`)}>{tx('متابعة قراءة المستلمين', 'Track recipient reads')}</Button>}
        {detail.recipients.some(row => row.userId === currentUser.id) && <>
          <p className="mt-4 text-sm">{tx('فتح التفاصيل لا يسجل إقرار القراءة.', 'Opening the circular does not acknowledge reading.')}</p>
          {detail.recipients.find(row => row.userId === currentUser.id)?.hasAcknowledged
            ? <p className="mt-3 font-bold">{tx('تم تسجيل قراءتك لهذا التعميم.', 'You have acknowledged this circular.')}</p>
            : <Button className="mt-3" onClick={() => void acknowledge(detail.id)}>{tx('قرأت التعميم', 'I have read it')}</Button>}
        </>}
      </Card>
    </div>}
    {attention && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"><Card title={tx('تعميم جديد', 'New circular')} className="w-full max-w-md"><p>{tx('يوجد تعميم جديد موجّه إليك.', 'A new circular is addressed to you.')}</p><Button className="mt-3" onClick={() => { setAttention(false); setSelected(attentionCircularId); }}>{tx('عرض التعميم', 'View circular')}</Button><Button className="mt-3" variant="ghost" onClick={() => setAttention(false)}>{tx('إغلاق', 'Close')}</Button></Card></div>}
  </main>;
};
