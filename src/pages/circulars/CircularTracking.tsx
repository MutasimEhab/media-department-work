import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

export const CircularTracking: React.FC = () => {
  const { language, circulars, users, recordCircularReminder, canAccess } = useApp();
  const { id } = useParams();
  const circular = circulars.find(item => item.id === id);
  const ar = language === 'ar';
  const tx = (arabic: string, english: string) => ar ? arabic : english;
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const rows = useMemo(() => circular?.recipients.filter(recipient =>
    (filter === 'ALL' || (filter === 'ACK' ? recipient.hasAcknowledged : !recipient.hasAcknowledged))
    && (!query || `${recipient.userNameAr} ${recipient.userNameEn}`.toLowerCase().includes(query.toLowerCase()))
  ) || [], [circular, filter, query]);

  if (!circular) return <Card>{tx('التعميم غير موجود', 'Circular not found')}</Card>;
  const acknowledged = circular.recipients.filter(recipient => recipient.hasAcknowledged).length;

  const sendReminder = async (userId: string) => {
    if (!window.confirm(tx('تسجيل محاولة تذكير؟ لا ترسل رسالة فعلية.', 'Record a reminder attempt? No message will actually be delivered.'))) return;
    setPendingUserId(userId);
    setMessage('');
    const result = await recordCircularReminder(circular.id, userId);
    setPendingUserId(null);
    setMessage(result.ok
      ? tx('سُجلت محاولة التذكير. لم تُرسل رسالة فعلية.', 'Reminder attempt recorded. No message was sent.')
      : result.message || tx('تعذر تسجيل محاولة التذكير.', 'Could not record the reminder attempt.'));
  };

  return <main className="space-y-5">
    <h1 className="text-2xl font-bold">{tx('متابعة التعميم', 'Circular tracking')} · {circular.id}</h1>
    <Card>
      <p>{ar ? circular.titleAr : circular.titleEn}</p>
      <p>{tx('المُصدر', 'Issuer')}: {ar ? circular.issuerNameAr : circular.issuerNameEn} · {circular.issuedAt}</p>
      <p>{tx('إجمالي المستلمين', 'Total recipients')}: {circular.recipients.length} · {tx('أقروا', 'Acknowledged')}: {acknowledged} · {tx('بانتظار الإقرار', 'Pending')}: {circular.recipients.length - acknowledged}</p>
      <div className="h-3 bg-brand-lightGray rounded mt-3"><div className="h-3 bg-brand-plum rounded" style={{ width: `${circular.recipients.length ? acknowledged / circular.recipients.length * 100 : 0}%` }} /></div>
      <p>{circular.recipients.length ? Math.round(acknowledged / circular.recipients.length * 100) : 0}% {tx('نسبة الإقرار', 'acknowledged')}</p>
    </Card>
    <Card>
      <div className="flex flex-wrap gap-2">
        <input className="border rounded p-2" placeholder={tx('بحث باسم المستلم', 'Search recipient')} value={query} onChange={event => setQuery(event.target.value)} />
        {([['ALL', tx('الكل', 'All')], ['ACK', tx('تم الإقرار', 'Acknowledged')], ['PENDING', tx('معلق', 'Pending')]] as const).map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? 'secondary' : 'outline'} onClick={() => setFilter(value)}>{label}</Button>)}
      </div>
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      <div className="grid md:grid-cols-2 gap-3 mt-4">
        {rows.map(recipient => <article className="border rounded p-4" key={recipient.userId}>
          <b>{ar ? recipient.userNameAr : recipient.userNameEn}</b>
          <p>{users.find(user => user.id === recipient.userId)?.[ar ? 'jobTitleAr' : 'jobTitleEn']}</p>
          <p>{recipient.hasAcknowledged ? tx(`تم الإقرار · ${recipient.acknowledgedAt || ''}`, `Acknowledged · ${recipient.acknowledgedAt || ''}`) : tx('لم يقر بعد', 'Not acknowledged')}</p>
          <p>{tx('محاولات التذكير', 'Reminder attempts')}: {recipient.reminderCount || 0}</p>
          {!recipient.hasAcknowledged && canAccess('track_circulars') && <Button size="sm" disabled={pendingUserId === recipient.userId} onClick={() => void sendReminder(recipient.userId)}>{pendingUserId === recipient.userId ? tx('جارٍ الحفظ…', 'Saving…') : tx('تسجيل محاولة تذكير', 'Record reminder attempt')}</Button>}
        </article>)}
      </div>
    </Card>
  </main>;
};
