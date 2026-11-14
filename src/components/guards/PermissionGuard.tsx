import React from 'react';
import { ShieldX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppPermission, PERMISSION_LABELS } from '../../auth/permissions';

export const PermissionGuard: React.FC<{ permission: AppPermission | AppPermission[]; children: React.ReactNode }> = ({ permission, children }) => {
  const { canAccess } = useApp();
  const permissions = Array.isArray(permission) ? permission : [permission];
  if (!permissions.some(canAccess)) return <section role="alert" className="my-8 rounded-card border border-brand-border bg-white p-8 text-center shadow-subtle">
    <ShieldX className="mx-auto mb-3 h-10 w-10 text-brand-magenta"/>
    <h1 className="text-xl font-bold">لا تملك صلاحية الوصول</h1>
    <p className="mt-2 text-sm text-brand-charcoal">تحتاج هذه الصفحة إلى صلاحية: {permissions.map(item => PERMISSION_LABELS[item]).join(' أو ')}.</p>
    <p className="mt-1 text-xs text-brand-charcoal/70">إذا كنت تحتاجها، يرجى التواصل مع مسؤول النظام.</p>
  </section>;
  return <>{children}</>;
};
