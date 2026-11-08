INSERT INTO role_permissions (role_code, permission_code)
VALUES
  ('department_manager', 'work_logs.create_own'),
  ('deputy_manager', 'work_logs.create_own')
ON CONFLICT DO NOTHING;
