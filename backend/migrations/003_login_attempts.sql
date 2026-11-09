CREATE TABLE login_attempts (
  identifier_hash char(64) PRIMARY KEY,
  failure_count smallint NOT NULL DEFAULT 0 CHECK (failure_count BETWEEN 0 AND 5),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX login_attempts_locked_until_idx ON login_attempts (locked_until)
  WHERE locked_until IS NOT NULL;
