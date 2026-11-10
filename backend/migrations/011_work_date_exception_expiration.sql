ALTER TABLE work_date_exceptions
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;
