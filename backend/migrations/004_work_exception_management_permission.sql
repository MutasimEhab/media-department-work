INSERT INTO permissions (code, name_ar)
VALUES ('work_exceptions.manage_department', 'إدارة استثناءات تواريخ عمل الدائرة')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code)
VALUES
  ('department_manager', 'work_exceptions.manage_department'),
  ('deputy_manager', 'work_exceptions.manage_department')
ON CONFLICT DO NOTHING;
