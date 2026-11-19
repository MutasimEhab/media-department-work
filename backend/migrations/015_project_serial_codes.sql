ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_code text;

CREATE SEQUENCE IF NOT EXISTS project_code_sequence START WITH 1 INCREMENT BY 1;

WITH numbered_projects AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS sequence_number
    FROM projects
   WHERE project_code IS NULL
)
UPDATE projects project
   SET project_code = 'PRJ-' || lpad(numbered_projects.sequence_number::text, 4, '0')
  FROM numbered_projects
 WHERE project.id = numbered_projects.id;

SELECT setval(
  'project_code_sequence',
  GREATEST((SELECT count(*) FROM projects), 1),
  (SELECT count(*) > 0 FROM projects)
);

ALTER TABLE projects
  ALTER COLUMN project_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS projects_project_code_unique_idx
  ON projects (project_code);
