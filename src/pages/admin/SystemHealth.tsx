import React, { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

type Delivery = { id: string; notice: string; recipient: string; channel: 'داخلي'|'بريد إلكتروني'|'رسالة نصية'; status: 'فشل'|'قيد الإرسال'|'تم الإرسال'|'تعذر التسليم'; attempts: number; time: string };

export const SystemHealth: React.FC = () => {
  const { notifications, users, canAccess } = useApp();
  const [tab, setTab] = useState<'health'|'delivery'>('health');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<Delivery[]>(()=>notifications.slice(0,6).map((item,index)=>({
    id:item.id, notice:item.titleAr, recipient:users.find(user=>user.id===item.userId)?.arabicName||'مستخدم تجريبي',
    channel:index%3===0?'بريد إلكتروني':'داخلي', status:index%4===0?'فشل':index%3===0?'قيد الإرسال':'تم الإرسال',
    attempts:index%2+1,time:item.timestamp,
  })));
  const filtered = useMemo(()=>rows.filter(row=>(!query||`${row.notice} ${row.recipient} ${row.id}`.includes(query))&&(!status||row.status===status)),[rows,query,status]);
  if(!canAccess('view_system_health')) return <Card>لا تملك صلاحية عرض حالة النظام.</Card>;

  return <main className="space-y-5" dir="rtl">
    <header className="app-page-heading"><h1 className="mt-2 text-2xl font-bold">حالة النظام وسجل الإرسال</h1><p>مؤشرات تشغيلية توضيحية وسجل تجريبي لقنوات الإشعار.</p></header>
    <nav className="flex gap-2"><Button variant={tab==='health'?'secondary':'outline'} onClick={()=>setTab('health')}>مؤشرات النظام</Button><Button variant={tab==='delivery'?'secondary':'outline'} onClick={()=>setTab('delivery')}>سجل الإرسال</Button></nav>
    {tab==='health'?<>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        ['آخر نسخة احتياطية تجريبية','٢٠٢٦/١٠/٣١ · ٠٢:٠٠ ص'],['مهام قائمة الانتظار','٣'],['إشعارات تعذر إرسالها','٢'],['حالة التطبيق','يعمل ضمن المعاينة'],
      ].map(([label,value])=><Card key={label}><b>{label}</b><p className="mt-2 text-xl">{value}</p><small>آخر تحديث: ٢٠٢٦/١٠/٣١ · ٠٩:١٥ ص</small></Card>)}</section>
      <Card><p className="font-bold">تنبيه: مؤشرات الصحة والنسخ الاحتياطية في هذه الصفحة توضيحية فقط.</p><p className="mt-2">لا توجد خدمة مراقبة أو نسخ احتياطي متصلة؛ لا يمكن استعادة نسخة احتياطية من هذه الواجهة.</p></Card>
      <details><summary className="cursor-pointer">تفاصيل تقنية للمعاينة</summary><pre className="mt-2 whitespace-pre-wrap" dir="rtl">موصل قائمة الانتظار: داخل الذاكرة · إعادة المحاولة: محاكاة · منع التكرار: معرّف إشعار ثابت</pre></details>
    </>:<>
      <Card><div className="grid gap-3 sm:grid-cols-2"><input className="rounded-input border border-brand-border p-2" value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث في الإشعار أو المستلم"/><select className="rounded-input border border-brand-border p-2" value={status} onChange={e=>setStatus(e.target.value)}><option value="">كل الحالات</option>{['قيد الإرسال','تم الإرسال','فشل','تعذر التسليم'].map(value=><option key={value}>{value}</option>)}</select></div><p className="mt-3 text-sm">تعذر إرسال البريد أو الرسائل لا يؤثر على الإشعارات الداخلية. جميع الحالات المعروضة تجريبية.</p></Card>
      <div className="space-y-3">{filtered.map(row=><Card key={row.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><b>{row.notice} · {row.id}</b><p>{row.recipient} · {row.channel} · {row.status} · عدد المحاولات: {row.attempts}</p><time dir="ltr">{row.time}</time>{row.status==='فشل'&&<p className="text-sm">الخطأ: تعذّر الإرسال في المحاكاة.</p>}</div>{['فشل','قيد الإرسال'].includes(row.status)&&<Button size="sm" onClick={()=>setRows(previous=>previous.map(item=>item.id===row.id?{...item,status:'قيد الإرسال',attempts:item.attempts+1,time:'2026-10-31 09:15 AM'}:item))}>إعادة المحاولة تجريبيًا</Button>}</div></Card>)}{!filtered.length&&<Card>لا توجد نتائج مطابقة.</Card>}</div>
    </>}
  </main>;
};
