-- Add accounting sync tracking fields to payments table
-- Migration: 035_add_accounting_fields_to_payments.sql

-- Add tracking columns to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS accounting_synced_qb BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accounting_synced_xero BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accounting_last_sync_attempt TIMESTAMPTZ;

-- Create indexes for efficient querying of unsynced payments
CREATE INDEX idx_payments_accounting_synced_qb ON payments(accounting_synced_qb, created_at) WHERE accounting_synced_qb = false AND status = 'succeeded';
CREATE INDEX idx_payments_accounting_synced_xero ON payments(accounting_synced_xero, created_at) WHERE accounting_synced_xero = false AND status = 'succeeded';
CREATE INDEX idx_payments_last_sync_attempt ON payments(accounting_last_sync_attempt) WHERE accounting_last_sync_attempt IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN payments.accounting_synced_qb IS 'Whether this payment has been successfully synced to QuickBooks';
COMMENT ON COLUMN payments.accounting_synced_xero IS 'Whether this payment has been successfully synced to Xero';
COMMENT ON COLUMN payments.accounting_last_sync_attempt IS 'Timestamp of the last sync attempt for this payment (for retry tracking)';
