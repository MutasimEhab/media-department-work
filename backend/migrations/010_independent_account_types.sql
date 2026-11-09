ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS base_role_code text REFERENCES roles(code) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT true;

UPDATE roles SET base_role_code = code WHERE base_role_code IS NULL;
ALTER TABLE roles ALTER COLUMN base_role_code SET NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_type_code text REFERENCES roles(code) ON DELETE RESTRICT;

UPDATE users SET account_type_code = role_code WHERE account_type_code IS NULL;
ALTER TABLE users ALTER COLUMN account_type_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS users_account_type_idx ON users (account_type_code);
