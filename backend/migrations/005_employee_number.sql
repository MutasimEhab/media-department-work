ALTER TABLE users
  ADD COLUMN IF NOT EXISTS employee_number text;

CREATE UNIQUE INDEX IF NOT EXISTS users_employee_number_lower_unique
  ON users (lower(trim(employee_number)))
  WHERE employee_number IS NOT NULL AND trim(employee_number) <> '';
