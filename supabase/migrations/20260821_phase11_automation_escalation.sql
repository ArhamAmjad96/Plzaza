-- Phase 11: Automation & Rent Escalation Migration

-- 1. Add rent escalation columns to leases
ALTER TABLE leases ADD COLUMN IF NOT EXISTS annual_increase_pct NUMERIC DEFAULT 10;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS last_escalation_date DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS next_escalation_date DATE;

-- 2. Populate next_escalation_date for existing active leases (12 months from move_in_date or lease_start_date)
UPDATE leases 
SET next_escalation_date = (COALESCE(lease_start_date, move_in_date, CURRENT_DATE) + INTERVAL '1 year')::DATE
WHERE next_escalation_date IS NULL;
