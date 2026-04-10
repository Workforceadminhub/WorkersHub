-- Activity audit table: tracks all API activities with user (from access token/code).
-- Run this if you apply migrations manually instead of using Kysely migrator.

CREATE TABLE IF NOT EXISTS activity_audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_code VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  method VARCHAR(16) NOT NULL,
  path VARCHAR(1024) NOT NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);
