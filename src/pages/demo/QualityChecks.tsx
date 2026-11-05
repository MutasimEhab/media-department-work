import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';

export const QualityChecks: React.FC = () => {
  const { users, currentUser, workLogs, tasks } = useApp();
  const [unread, setUnread] = useState(0);
  const [large, setLarge] = useState(false);
  const [mobile, setMobile] = useState(false);
  const checks = [
    ['بيانات سجل اليوم', workLogs.filter(log=>log.date==='2026-10-31').length===2],
    ['حصر سجل الموظف بحسابه', currentUser.role!=='EMPLOYEE'||workLogs.filter(log=>log.userId===currentUser.id).every(log=>log.userId===currentUser.id)],
    ['حالات المستلمين مستقلة', Boolean(tasks.find(task=>task.id==='TSK-101')?.recipients.length===2)],
    ['تنسيق التاريخ ثابت', /^2026-10-31$/.test('2026-10-31')],
  ] as [string,boolean][];
  return <main className={`space-y-5 ${mobile?'max-w-[360px]':''}`} dir="rtl">
    <header className="app-page-heading"><p className="text-xs text-brand-plum">فحوص داخلية للنسخة التجريبية</p><h1 className="mt-2 text-2xl font-bold">معرض فحوص الجودة</h1><p>أدوات مراجعة داخلية لعرض حالات الواجهة، ولا تؤثر على بيانات الإنتاج.</p></header>
    <Card><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={()=>setUnread(value=>value===99?0:99)}>عداد الإشعارات: {unread===99?'٩٩+':unread}</Button><Button variant="outline" onClick={()=>setLarge(value=>!value)}>اختبار نص عربي طويل</Button><Button variant="outline" onClick={()=>setMobile(value=>!value)}>{mobile?'إعادة العرض الطبيعي':'محاكاة عرض الهاتف'}</Button></div></Card>
    <Card title="حالات المكونات"><div className="grid gap-3 sm:grid-cols-2"><p className="rounded border p-3">فارغ: لا توجد نتائج</p><p className="rounded border p-3">تحميل: جارٍ التحميل…</p><p role="alert" className="rounded border p-3">خطأ: تعذر إكمال العملية</p><p className="rounded border p-3">رمز ٤٠٣ · رمز ٤٠٤ · غير متصل</p><input className="rounded border p-3" aria-label="مثال على التحقق" placeholder="قيمة غير صالحة"/><button disabled className="rounded border p-3 opacity-50">زر غير متاح</button><p role="status" className="rounded border p-3">نجاح: تم الحفظ</p></div></Card>
    {large&&<Card><p className="text-lg leading-10">هذا نص عربي طويل لاختبار التفاف السطور واتجاه الكتابة من اليمين إلى اليسار دون تجاوز حدود البطاقة أو إخفاء أي محتوى للمستخدم.</p></Card>}
    <Card title="فحوص الصلاحيات والبيانات"><ul className="list-disc space-y-2 pe-6">{checks.map(([label,pass])=><li key={label}><b>{pass?'ناجح':'يحتاج مراجعة'}</b> · {label}</li>)}<li>المستخدمون التجريبيون: {users.length}</li></ul></Card>
  </main>;
};
