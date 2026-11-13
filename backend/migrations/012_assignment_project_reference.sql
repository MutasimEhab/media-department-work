-- The assignment API reads and returns project_id, but earlier schema versions
-- did not include the corresponding nullable link on assignments.
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS assignments_project_id_idx ON assignments (project_id)
  WHERE project_id IS NOT NULL;
