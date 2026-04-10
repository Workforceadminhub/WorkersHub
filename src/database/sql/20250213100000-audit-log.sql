-- Audit log: one table to log everything happening so you can track how the app and services are used.
-- Run this if you apply migrations manually. If you had activity_audit, drop it first: DROP TABLE IF EXISTS activity_audit;

DROP TABLE IF EXISTS activity_audit;

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_code VARCHAR(255),
  event VARCHAR(255) NOT NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);
