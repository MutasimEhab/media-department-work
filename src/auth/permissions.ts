import { UserRole } from '../types';

export type AppPermission =
  | 'view_management_dashboard' | 'view_employee_dashboard'
  | 'create_work_log' | 'view_own_work_logs' | 'manage_own_work_logs' | 'view_department_work_logs'
  | 'view_assignments' | 'manage_assignments' | 'review_assignments'
  | 'view_projects' | 'manage_projects' | 'view_circulars' | 'manage_circulars' | 'track_circulars'
  | 'view_notifications' | 'receive_missing_work_alerts' | 'view_own_exceptions' | 'view_own_report' | 'view_department_reports'
  | 'manage_users' | 'manage_system_settings' | 'manage_work_exceptions' | 'view_audit_log' | 'view_system_health';

export const PERMISSION_LABELS: Record<AppPermission, string> = {
  view_management_dashboard: 'عرض لوحة الإدارة', view_employee_dashboard: 'عرض لوحة الموظف',
  create_work_log: 'تسجيل العمل اليومي', view_own_work_logs: 'عرض سجل العمل الشخصي',
  manage_own_work_logs: 'تعديل وحذف سجل العمل الشخصي',
  view_department_work_logs: 'عرض سجلات عمل الدائرة', view_assignments: 'عرض التكليفات',
  manage_assignments: 'إنشاء وإدارة التكليفات', review_assignments: 'مراجعة تسليمات التكليفات',
  view_projects: 'عرض المشاريع المصرح بها', manage_projects: 'إنشاء وإدارة المشاريع',
  view_circulars: 'عرض التعاميم الموجهة', manage_circulars: 'إنشاء ونشر التعاميم',
  track_circulars: 'متابعة إقرارات التعاميم', view_notifications: 'عرض الإشعارات الشخصية', receive_missing_work_alerts: 'استلام تنبيهات عدم تسجيل العمل اليومي', view_own_exceptions: 'عرض استثناءات تواريخ العمل الشخصية',
  view_own_report: 'عرض التقرير الشخصي', view_department_reports: 'عرض تقارير الدائرة',
  manage_users: 'إدارة حسابات المستخدمين وأدوارهم', manage_system_settings: 'إدارة إعدادات النظام',
  manage_work_exceptions: 'إدارة استثناءات تواريخ العمل', view_audit_log: 'عرض سجل التدقيق',
  view_system_health: 'عرض حالة النظام والتسليمات',
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as AppPermission[];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  ADMIN: [...ALL_PERMISSIONS],
  MANAGER: ['view_management_dashboard','create_work_log','view_own_work_logs','manage_own_work_logs','view_department_work_logs','view_assignments','manage_assignments','review_assignments','view_projects','manage_projects','view_circulars','manage_circulars','track_circulars','view_notifications','view_department_reports','receive_missing_work_alerts','manage_users','manage_work_exceptions'],
  DEPUTY: ['view_management_dashboard','create_work_log','view_own_work_logs','manage_own_work_logs','view_department_work_logs','view_assignments','manage_assignments','review_assignments','view_projects','manage_projects','view_circulars','manage_circulars','track_circulars','view_notifications','view_department_reports','receive_missing_work_alerts','manage_users','manage_work_exceptions'],
  EMPLOYEE: ['view_employee_dashboard','create_work_log','view_own_work_logs','manage_own_work_logs','view_assignments','view_projects','view_circulars','view_notifications','view_own_exceptions','view_own_report'],
};

export type RolePermissionOverrides = Partial<Record<UserRole, AppPermission[]>>;

export function roleHasPermission(role: UserRole, permission: AppPermission, overrides: RolePermissionOverrides = {}): boolean {
  // Preserve an emergency administrator route so system access cannot be locked out.
  if (role === 'ADMIN') return true;
  return (overrides[role] || DEFAULT_ROLE_PERMISSIONS[role]).includes(permission);
}
