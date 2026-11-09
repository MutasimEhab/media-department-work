ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS users_email_nonempty;

CREATE TABLE IF NOT EXISTS job_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  name_ar text NOT NULL CHECK (length(trim(name_ar)) BETWEEN 1 AND 120),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS job_titles_global_name_unique
  ON job_titles (lower(trim(name_ar))) WHERE department_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS job_titles_department_name_unique
  ON job_titles (department_id, lower(trim(name_ar))) WHERE department_id IS NOT NULL;

INSERT INTO job_titles (name_ar)
SELECT DISTINCT trim(job_title_ar)
  FROM users
 WHERE trim(job_title_ar) <> ''
ON CONFLICT DO NOTHING;
