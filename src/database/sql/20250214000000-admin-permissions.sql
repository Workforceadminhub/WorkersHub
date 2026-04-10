-- Add permission columns to admin table
ALTER TABLE admin ADD COLUMN IF NOT EXISTS permissions JSONB;
ALTER TABLE admin ADD COLUMN IF NOT EXISTS assigned_by INTEGER;
ALTER TABLE admin ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMPTZ;
