import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const items = [
  ['/app/admin/add-work','إضافة عمل لموظف'], ['/app/admin/work-date-exceptions','استثناءات التسجيل'],
  ['/app/admin/records','الكشوفات والتصدير'], ['/app/users','المستخدمون والحسابات'], ['/app/admin/account-types','أنواع الحسابات'],
  ['/app/admin/workflow','إعداد سير العمل'], ['/app/admin/settings','إعدادات النظام والتنبيهات'], ['/app/admin/custom-fields','الخانات الإضافية'],
  ['/app/audit-log','سجل النشاطات'], ['/app/system-health','فحص النظام'], ['/app/admin/backup','نسخ احتياطي'],
];

export const AdminNavigation: React.FC = () => {
  const location = useLocation();
  return <nav aria-label="أقسام لوحة الإدارة" className="mb-5 flex flex-wrap justify-end gap-2">{items.map(([href,label])=>{
    const active = location.pathname === href || location.pathname.startsWith(`${href}/`);
    return <NavLink key={`${href}-${label}`} to={href} className={`rounded-full border px-3 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-plum ${active?'border-brand-plum bg-brand-plum text-white':'border-brand-border bg-brand-surface text-brand-darkText hover:border-brand-plum hover:text-brand-plum'}`}>{label}</NavLink>;
  })}</nav>;
};
