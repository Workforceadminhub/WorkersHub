-- Add approvedat to worker table (date approved / when status became ACTIVE)
ALTER TABLE worker ADD COLUMN IF NOT EXISTS approvedat TIMESTAMPTZ;
