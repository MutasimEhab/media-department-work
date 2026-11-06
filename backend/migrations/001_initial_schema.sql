CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  code text PRIMARY KEY,
  name_ar text NOT NULL
);

INSERT INTO roles (code, name_ar) VALUES
  ('system_admin', 'مدير النظام'),
  ('department_manager', 'مدير الدائرة'),
  ('deputy_manager', 'نائب مدير الدائرة'),
  ('employee', 'موظف')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE permissions (
  code text PRIMARY KEY,
  name_ar text NOT NULL
);

INSERT INTO permissions (code, name_ar) VALUES
  ('users.manage_all', 'إدارة جميع الحسابات'),
  ('users.create_manager', 'إنشاء حساب مدير دائرة'),
  ('users.create_deputy', 'إنشاء حساب نائب مدير دائرة'),
  ('users.create_employee', 'إنشاء حساب موظف'),
  ('permissions.manage_department', 'تعديل صلاحيات موظفي الدائرة'),
  ('work_logs.read_department', 'مشاهدة سجلات عمل الدائرة'),
  ('work_logs.create_own', 'إنشاء سجل العمل الشخصي'),
  ('work_logs.manage_own', 'تعديل وحذف سجل العمل الشخصي'),
  ('assignments.create_department', 'إنشاء تكليفات الدائرة'),
  ('projects.create_department', 'إنشاء مشاريع الدائرة'),
  ('circulars.create_department', 'إنشاء تعاميم الدائرة'),
  ('reports.read_department', 'مشاهدة تقارير الدائرة'),
  ('system.manage', 'إدارة إعدادات النظام')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE role_permissions (
  role_code text NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'system_admin', code FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code) VALUES
  ('department_manager', 'users.create_deputy'),
  ('department_manager', 'users.create_employee'),
  ('department_manager', 'permissions.manage_department'),
  ('department_manager', 'work_logs.read_department'),
  ('department_manager', 'assignments.create_department'),
  ('department_manager', 'projects.create_department'),
  ('department_manager', 'circulars.create_department'),
  ('department_manager', 'reports.read_department'),
  ('deputy_manager', 'users.create_employee'),
  ('deputy_manager', 'permissions.manage_department'),
  ('deputy_manager', 'work_logs.read_department'),
  ('deputy_manager', 'assignments.create_department'),
  ('deputy_manager', 'projects.create_department'),
  ('deputy_manager', 'circulars.create_department'),
  ('deputy_manager', 'reports.read_department'),
  ('employee', 'work_logs.create_own'),
  ('employee', 'work_logs.manage_own')
ON CONFLICT DO NOTHING;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE RESTRICT,
  role_code text NOT NULL REFERENCES roles(code) ON DELETE RESTRICT,
  username text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  full_name_ar text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_username_nonempty CHECK (length(trim(username)) > 0),
  CONSTRAINT users_email_nonempty CHECK (length(trim(email)) > 0)
);

CREATE UNIQUE INDEX users_username_lower_unique ON users (lower(username));
CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));
CREATE INDEX users_department_role_idx ON users (department_id, role_code);

CREATE TABLE user_permission_overrides (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  is_granted boolean NOT NULL,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, permission_code)
);

CREATE TABLE work_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  work_date date NOT NULL,
  work_nature text NOT NULL,
  work_region text NOT NULL CHECK (work_region IN ('north_gaza', 'south_gaza')),
  work_mode text NOT NULL CHECK (work_mode IN ('office', 'field')),
  description_ar text NOT NULL,
  assignment_id uuid,
  project_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_logs_description_nonempty CHECK (length(trim(description_ar)) > 0)
);

CREATE INDEX work_logs_user_date_idx ON work_logs (user_id, work_date DESC);

CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title_ar text NOT NULL,
  description_ar text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assignments_department_status_deadline_idx ON assignments (department_id, status, deadline);

CREATE TABLE assignment_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'approved', 'returned')),
  delivery_note_ar text,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, user_id)
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title_ar text NOT NULL,
  description_ar text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'paused', 'completed', 'cancelled')),
  start_date date,
  expected_end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE project_members (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  added_by uuid REFERENCES users(id) ON DELETE SET NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  sort_order integer NOT NULL DEFAULT 0,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE circulars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE RESTRICT,
  issued_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title_ar text NOT NULL,
  body_ar text NOT NULL,
  audience_type text NOT NULL CHECK (audience_type IN ('all', 'employees_only', 'selected')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE circular_recipients (
  circular_id uuid NOT NULL REFERENCES circulars(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  acknowledged_at timestamptz,
  reminder_count integer NOT NULL DEFAULT 0 CHECK (reminder_count >= 0),
  PRIMARY KEY (circular_id, user_id)
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title_ar text NOT NULL,
  body_ar text NOT NULL,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

CREATE TABLE system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at DESC);

ALTER TABLE work_logs
  ADD CONSTRAINT work_logs_assignment_fk
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL;

ALTER TABLE work_logs
  ADD CONSTRAINT work_logs_project_fk
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
