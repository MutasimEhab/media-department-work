import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CloudOff, RefreshCw, Trash2, Wifi, WifiOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

export const PendingSync: React.FC = () => {
  const { currentUser, pendingWork, retryPendingWork, removePendingWork, canAccess } = useApp();
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);
  const canManage = canAccess('manage_users');
  const mine = pendingWork.filter(item => canManage || item.userId === currentUser.id);
  return <main className="space-y-5">
    <header className="app-page-heading"><h1 className="mt-2 text-2xl font-bold">الأعمال غير المتزامنة</h1><p>تُحفظ الأعمال التي تسجلها دون اتصال على هذا الجهاز، وتُرسل إلى سجل أعمالك عند عودة الاتصال.</p></header>
    <Card title="حالة الاتصال" action={online ? <Wifi className="text-green-600"/> : <WifiOff className="text-amber-500"/>}>
      <div className="flex flex-wrap items-center justify-between gap-3"><p>{online ? 'الاتصال متاح. يمكنك محاولة مزامنة الأعمال الآن.' : 'لا يوجد اتصال بالإنترنت حالياً. ستبقى الأعمال محفوظة على هذا الجهاز.'}</p><Button onClick={retryPendingWork} disabled={!online || !mine.length} leftIcon={<RefreshCw size={16}/>}>إعادة محاولة المزامنة</Button></div>
    </Card>
    <Card title="القائمة" subtitle={`${mine.length} عمل بانتظار المزامنة`}>
      {!mine.length ? <div className="flex min-h-24 items-center justify-center gap-3 rounded-xl border border-dashed border-brand-border bg-white p-5 text-center text-brand-charcoal/70"><CloudOff size={20}/>لا توجد أعمال بانتظار المزامنة حالياً.</div> : <div className="space-y-3">{mine.map((item,index)=><article key={item.id} className="rounded-xl border border-brand-border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs text-brand-charcoal/70">عمل رقم {mine.length-index} · {item.date} · {item.time}{canManage?` · ${item.userNameAr}`:''}</span><h2 className="mt-1 font-bold">{item.activityAr}</h2><p className="mt-1 text-sm">{item.area} · {item.location==='OFFICE'?'مكتبي':'ميداني'}</p><span className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-900">بانتظار المزامنة</span></div><Button variant="outline" size="sm" leftIcon={<Trash2 size={15}/>} onClick={()=>{if(window.confirm('حذف العمل غير المتزامن من هذا الجهاز؟'))removePendingWork(item.id);}}>حذف من القائمة</Button></div></article>)}</div>}
    </Card>
    <Link to="/app/work/new" className="inline-flex text-sm font-bold text-brand-plum underline">العودة إلى إضافة عمل</Link>
  </main>;
};
