-- Create accounting synced transactions table for idempotency tracking
-- Migration: 033_create_accounting_synced_transactions.sql

-- Create synced transactions table
CREATE TABLE accounting_synced_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider integration_provider NOT NULL,

  -- Internal reference
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  service_booking_id UUID REFERENCES service_bookings(id) ON DELETE SET NULL,

  -- External reference (from QuickBooks/Xero)
  external_transaction_id TEXT NOT NULL, -- Invoice/Sales Receipt ID in QB/Xero
  external_transaction_type TEXT, -- 'invoice', 'sales_receipt', 'credit_memo', etc.
  external_customer_id TEXT, -- Customer ID in external system

  -- Sync details
  sync_log_id UUID REFERENCES accounting_sync_logs(id),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_amount INTEGER NOT NULL, -- in pence, for verification

  -- Status tracking
  is_synced BOOLEAN DEFAULT true,
  needs_resync BOOLEAN DEFAULT false,
  resync_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraints for idempotency
  UNIQUE(provider, payment_id),
  UNIQUE(provider, external_transaction_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_synced_txn_provider ON accounting_synced_transactions(provider);
CREATE INDEX idx_synced_txn_payment_id ON accounting_synced_transactions(payment_id);
CREATE INDEX idx_synced_txn_external_id ON accounting_synced_transactions(external_transaction_id);
CREATE INDEX idx_synced_txn_sync_log_id ON accounting_synced_transactions(sync_log_id);
CREATE INDEX idx_synced_txn_needs_resync ON accounting_synced_transactions(needs_resync) WHERE needs_resync = true;
CREATE INDEX idx_synced_txn_synced_at ON accounting_synced_transactions(synced_at DESC);

-- Enable Row Level Security
ALTER TABLE accounting_synced_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can view synced transactions

-- Admins can view synced transactions
CREATE POLICY "Admins can view synced transactions"
  ON accounting_synced_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert synced transactions (system creates them during sync)
CREATE POLICY "Admins can insert synced transactions"
  ON accounting_synced_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update synced transactions (for resync flags)
CREATE POLICY "Admins can update synced transactions"
  ON accounting_synced_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE accounting_synced_transactions IS 'Idempotency table to prevent duplicate transaction syncs';
COMMENT ON COLUMN accounting_synced_transactions.payment_id IS 'Internal payment ID from payments table';
COMMENT ON COLUMN accounting_synced_transactions.external_transaction_id IS 'Transaction ID from QuickBooks or Xero (e.g., Invoice ID, Sales Receipt ID)';
COMMENT ON COLUMN accounting_synced_transactions.external_transaction_type IS 'Type of transaction in external system (sales_receipt, invoice, credit_memo)';
COMMENT ON COLUMN accounting_synced_transactions.sync_amount IS 'Amount synced (in pence) for verification purposes';
COMMENT ON COLUMN accounting_synced_transactions.needs_resync IS 'Flag to indicate this transaction needs to be resynced due to error or update';
COMMENT ON COLUMN accounting_synced_transactions.resync_reason IS 'Reason why resync is needed (e.g., "Amount mismatch", "Account changed")';
