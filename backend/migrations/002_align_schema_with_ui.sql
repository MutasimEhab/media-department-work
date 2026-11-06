-- Extend the approved initial schema to cover fields and workflows present in the UI.
-- This migration is additive wherever possible and is run transactionally by the migration runner.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS job_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS mobile text,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- The form stores one Arabic description, work mode (office/field), and a fixed Gaza region.
-- Keep the older unused column nullable so no existing record is discarded.
ALTER TABLE work_logs
  ALTER COLUMN work_nature DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS output_link text;

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS reference_url text,
  ADD COLUMN IF NOT EXISTS original_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_sms boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason_ar text;

ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_priority_check;
ALTER TABLE assignments ADD CONSTRAINT assignments_priority_check
  CHECK (priority IN ('low', 'normal', 'medium', 'high', 'urgent'));

ALTER TABLE assignments ADD CONSTRAINT assignments_kind_check
  CHECK (kind IN ('normal', 'social_media'));

ALTER TABLE assignments ADD CONSTRAINT assignments_active_deadline_check
  CHECK (status <> 'active' OR deadline IS NOT NULL);

ALTER TABLE assignment_assignees
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS first_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_note_ar text;

ALTER TABLE assignment_assignees DROP CONSTRAINT IF EXISTS assignment_assignees_status_check;
ALTER TABLE assignment_assignees ADD CONSTRAINT assignment_assignees_status_check
  CHECK (status IN ('assigned', 'received', 'in_progress', 'submitted', 'approved', 'returned', 'returned_for_revision'));

ALTER TABLE assignment_assignees ADD CONSTRAINT assignment_assignees_return_count_check
  CHECK (return_count >= 0);

CREATE TABLE assignment_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_id uuid NOT NULL REFERENCES assignment_assignees(id) ON DELETE CASCADE,
  drive_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assignment_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_id uuid NOT NULL REFERENCES assignment_assignees(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body_ar text NOT NULL CHECK (length(trim(body_ar)) BETWEEN 1 AND 2000),
  is_problem boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assignment_comments_assignee_created_idx ON assignment_comments (assignee_id, created_at);

CREATE TABLE assignment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES assignment_assignees(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assignment_events_assignment_created_idx ON assignment_events (assignment_id, created_at);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS assignment_id uuid REFERENCES assignments(id) ON DELETE SET NULL;

UPDATE projects SET owner_id = created_by WHERE owner_id IS NULL;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('planned', 'active', 'paused', 'completed', 'cancelled', 'in_progress', 'on_hold', 'closed'));

ALTER TABLE project_stages
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS drive_link text;

ALTER TABLE circulars
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES circulars(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_sms boolean NOT NULL DEFAULT false;

ALTER TABLE circulars DROP CONSTRAINT IF EXISTS circulars_audience_type_check;
ALTER TABLE circulars ADD CONSTRAINT circulars_audience_type_check
  CHECK (audience_type IN ('all', 'employees_only', 'management_only', 'selected'));

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS action_url text NOT NULL DEFAULT '';

CREATE TABLE work_date_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  work_date date NOT NULL,
  granted_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason_ar text NOT NULL CHECK (length(trim(reason_ar)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE UNIQUE INDEX work_date_exceptions_active_unique
  ON work_date_exceptions (user_id, work_date) WHERE revoked_at IS NULL;

CREATE TABLE login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX login_sessions_user_active_idx ON login_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('in_app', 'email', 'sms')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'unable')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error text,
  sent_at timestamptz,
  dedupe_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notification_deliveries_status_idx ON notification_deliveries (status, created_at);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address inet;
