-- Add role and permission_level to admin table (permission_level is an array stored as JSONB)
ALTER TABLE admin ADD COLUMN IF NOT EXISTS role VARCHAR(64);
ALTER TABLE admin ADD COLUMN IF NOT EXISTS permission_level JSONB;
