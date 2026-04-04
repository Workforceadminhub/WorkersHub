-- Add email to admin table
ALTER TABLE admin ADD COLUMN IF NOT EXISTS email VARCHAR(255);
