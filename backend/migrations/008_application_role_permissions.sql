-- Canonical permission codes shared by the React guards and authenticated API routes.
INSERT INTO permissions (code, name_ar) VALUES
  ('view_management_dashboard', 'عرض لوحة الإدارة'),
  ('view_employee_dashboard', 'عرض لوحة الموظف'),
  ('create_work_log', 'تسجيل العمل اليومي'),
  ('view_own_work_logs', 'عرض سجل العمل الشخصي'),
  ('manage_own_work_logs', 'تعديل وحذف سجل العمل الشخصي'),
  ('view_department_work_logs', 'عرض سجلات عمل الدائرة'),
  ('view_assignments', 'عرض التكليفات'),
  ('manage_assignments', 'إنشاء وإدارة التكليفات'),
  ('review_assignments', 'مراجعة تسليمات التكليفات'),
  ('view_projects', 'عرض المشاريع المصرح بها'),
  ('manage_projects', 'إنشاء وإدارة المشاريع'),
  ('view_circulars', 'عرض التعاميم الموجهة'),
  ('manage_circulars', 'إنشاء ونشر التعاميم'),
  ('track_circulars', 'متابعة إقرارات التعاميم'),
  ('view_notifications', 'عرض الإشعارات الشخصية'),
  ('receive_missing_work_alerts', 'استلام تنبيهات عدم تسجيل العمل اليومي'),
  ('view_own_exceptions', 'عرض استثناءات تواريخ العمل الشخصية'),
  ('view_own_report', 'عرض التقرير الشخصي'),
  ('view_department_reports', 'عرض تقارير الدائرة'),
  ('manage_users', 'إدارة حسابات المستخدمين وأدوارهم'),
  ('manage_system_settings', 'إدارة إعدادات النظام'),
  ('manage_work_exceptions', 'إدارة استثناءات تواريخ العمل'),
  ('view_audit_log', 'عرض سجل التدقيق'),
  ('view_system_health', 'عرض حالة النظام والتسليمات')
ON CONFLICT (code) DO UPDATE SET name_ar = EXCLUDED.name_ar;

-- System administrators always retain every feature permission.
INSERT INTO role_permissions (role_code, permission_code)
SELECT 'system_admin', code FROM permissions
WHERE code IN (
  'view_management_dashboard','view_employee_dashboard','create_work_log','view_own_work_logs',
  'manage_own_work_logs','view_department_work_logs','view_assignments','manage_assignments',
  'review_assignments','view_projects','manage_projects','view_circulars','manage_circulars',
  'track_circulars','view_notifications','receive_missing_work_alerts','view_own_exceptions',
  'view_own_report','view_department_reports','manage_users','manage_system_settings',
  'manage_work_exceptions','view_audit_log','view_system_health'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code) VALUES
  ('department_manager','view_management_dashboard'),('department_manager','create_work_log'),
  ('department_manager','view_own_work_logs'),('department_manager','manage_own_work_logs'),
  ('department_manager','view_department_work_logs'),('department_manager','view_assignments'),
  ('department_manager','manage_assignments'),('department_manager','review_assignments'),
  ('department_manager','view_projects'),('department_manager','manage_projects'),
  ('department_manager','view_circulars'),('department_manager','manage_circulars'),
  ('department_manager','track_circulars'),('department_manager','view_notifications'),
  ('department_manager','receive_missing_work_alerts'),('department_manager','view_department_reports'),
  ('department_manager','manage_users'),('department_manager','manage_work_exceptions'),
  ('deputy_manager','view_management_dashboard'),('deputy_manager','create_work_log'),
  ('deputy_manager','view_own_work_logs'),('deputy_manager','manage_own_work_logs'),
  ('deputy_manager','view_department_work_logs'),('deputy_manager','view_assignments'),
  ('deputy_manager','manage_assignments'),('deputy_manager','review_assignments'),
  ('deputy_manager','view_projects'),('deputy_manager','manage_projects'),
  ('deputy_manager','view_circulars'),('deputy_manager','manage_circulars'),
  ('deputy_manager','track_circulars'),('deputy_manager','view_notifications'),
  ('deputy_manager','receive_missing_work_alerts'),('deputy_manager','view_department_reports'),
  ('deputy_manager','manage_users'),('deputy_manager','manage_work_exceptions'),
  ('employee','view_employee_dashboard'),('employee','create_work_log'),
  ('employee','view_own_work_logs'),('employee','manage_own_work_logs'),
  ('employee','view_assignments'),('employee','view_projects'),('employee','view_circulars'),
  ('employee','view_notifications'),('employee','view_own_exceptions'),('employee','view_own_report')
ON CONFLICT DO NOTHING;
