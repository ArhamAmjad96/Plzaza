-- Phase 5: Categorized Payment Transactions & Receipts Migration

-- 1. Enhance payments table with tenant_id, lease_id, and payment_type
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS lease_id BIGINT REFERENCES leases(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'RENT' CHECK (payment_type IN ('RENT', 'ELECTRICITY', 'SECURITY', 'MAINTENANCE', 'OTHER'));

-- 2. Ensure payment_method check constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_method') THEN
    ALTER TABLE payments ADD CONSTRAINT check_payment_method CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Online', 'Cheque', 'Other', 'CASH', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'OTHER'));
  END IF;
END $$;

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_lease_id ON payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_no ON payments(receipt_number);
