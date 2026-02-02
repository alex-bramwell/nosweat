-- Create accounting integrations table for storing OAuth tokens and integration settings
-- Migration: 030_create_accounting_integrations.sql

-- Create enum types
CREATE TYPE integration_provider AS ENUM ('quickbooks', 'xero');
CREATE TYPE integration_status AS ENUM ('active', 'disconnected', 'error', 'expired');

-- Create main table
CREATE TABLE accounting_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider integration_provider NOT NULL UNIQUE,
  status integration_status DEFAULT 'disconnected',

  -- OAuth tokens (encrypted at application layer before storage)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Provider-specific IDs
  realm_id TEXT, -- QuickBooks company ID
  tenant_id TEXT, -- Xero tenant ID
  company_name TEXT, -- Company name from provider

  -- Last sync tracking
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_error TEXT,

  -- Settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 60, -- hourly by default

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_accounting_integrations_provider ON accounting_integrations(provider);
CREATE INDEX idx_accounting_integrations_status ON accounting_integrations(status);

-- Enable Row Level Security
ALTER TABLE accounting_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can view/modify integrations

-- Admins can view integrations
CREATE POLICY "Admins can view accounting integrations"
  ON accounting_integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert integrations
CREATE POLICY "Admins can insert accounting integrations"
  ON accounting_integrations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update integrations
CREATE POLICY "Admins can update accounting integrations"
  ON accounting_integrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete integrations (for cleanup)
CREATE POLICY "Admins can delete accounting integrations"
  ON accounting_integrations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE accounting_integrations IS 'Stores OAuth tokens and settings for QuickBooks/Xero integrations';
COMMENT ON COLUMN accounting_integrations.access_token_encrypted IS 'Encrypted OAuth access token using AES-256-GCM';
COMMENT ON COLUMN accounting_integrations.refresh_token_encrypted IS 'Encrypted OAuth refresh token using AES-256-GCM';
COMMENT ON COLUMN accounting_integrations.realm_id IS 'QuickBooks company ID (realmId)';
COMMENT ON COLUMN accounting_integrations.tenant_id IS 'Xero organization ID (tenantId)';
COMMENT ON COLUMN accounting_integrations.auto_sync_enabled IS 'Whether automatic cron sync is enabled for this provider';
COMMENT ON COLUMN accounting_integrations.sync_frequency_minutes IS 'How often to run automatic sync (default: 60 minutes)';
-- Create accounting account mappings table for mapping revenue categories to external accounts
-- Migration: 031_create_accounting_account_mappings.sql

-- Create enum for revenue categories
CREATE TYPE revenue_category AS ENUM (
  'day_pass',
  'service_pt',
  'service_specialty_class',
  'service_sports_massage',
  'service_nutrition',
  'service_physio',
  'refund'
);

-- Create account mappings table
CREATE TABLE accounting_account_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider integration_provider NOT NULL,
  revenue_category revenue_category NOT NULL,

  -- External account details from QuickBooks/Xero
  external_account_id TEXT NOT NULL, -- Account ID in QuickBooks/Xero
  external_account_name TEXT NOT NULL, -- e.g., "Sales:Day Passes"
  external_account_code TEXT, -- Account code/number (if applicable)

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique mapping per provider and category
  UNIQUE(provider, revenue_category)
);

-- Create indexes
CREATE INDEX idx_account_mappings_provider ON accounting_account_mappings(provider);
CREATE INDEX idx_account_mappings_category ON accounting_account_mappings(revenue_category);
CREATE INDEX idx_account_mappings_active ON accounting_account_mappings(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE accounting_account_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage mappings

-- Admins can view account mappings
CREATE POLICY "Admins can view account mappings"
  ON accounting_account_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage account mappings (insert, update, delete)
CREATE POLICY "Admins can manage account mappings"
  ON accounting_account_mappings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE accounting_account_mappings IS 'Maps internal revenue categories to external accounting system accounts (Chart of Accounts)';
COMMENT ON COLUMN accounting_account_mappings.revenue_category IS 'Internal revenue category (day_pass, service_pt, etc.)';
COMMENT ON COLUMN accounting_account_mappings.external_account_id IS 'Account ID from QuickBooks or Xero';
COMMENT ON COLUMN accounting_account_mappings.external_account_name IS 'Human-readable account name from external system';
COMMENT ON COLUMN accounting_account_mappings.external_account_code IS 'Account code/number (e.g., "4010" for income accounts)';
-- Create accounting sync logs table for tracking sync history and errors
-- Migration: 032_create_accounting_sync_logs.sql

-- Create enum types
CREATE TYPE sync_type AS ENUM ('manual', 'automatic', 'retry');
CREATE TYPE sync_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'partial');

-- Create sync logs table
CREATE TABLE accounting_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider integration_provider NOT NULL,
  sync_type sync_type NOT NULL,
  status sync_status DEFAULT 'pending',

  -- Sync scope and timing
  sync_started_at TIMESTAMPTZ DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  transactions_attempted INTEGER DEFAULT 0,
  transactions_succeeded INTEGER DEFAULT 0,
  transactions_failed INTEGER DEFAULT 0,

  -- Date range synced
  sync_from_date TIMESTAMPTZ,
  sync_to_date TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  initiated_by UUID REFERENCES auth.users(id), -- admin who triggered manual sync
  retry_count INTEGER DEFAULT 0,
  parent_sync_id UUID REFERENCES accounting_sync_logs(id), -- for retry tracking

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_sync_logs_provider ON accounting_sync_logs(provider);
CREATE INDEX idx_sync_logs_status ON accounting_sync_logs(status);
CREATE INDEX idx_sync_logs_created_at ON accounting_sync_logs(created_at DESC);
CREATE INDEX idx_sync_logs_sync_started ON accounting_sync_logs(sync_started_at DESC);
CREATE INDEX idx_sync_logs_sync_type ON accounting_sync_logs(sync_type);

-- Enable Row Level Security
ALTER TABLE accounting_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can view sync logs

-- Admins can view sync logs
CREATE POLICY "Admins can view sync logs"
  ON accounting_sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert sync logs (system creates them)
CREATE POLICY "Admins can insert sync logs"
  ON accounting_sync_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update sync logs (for status updates)
CREATE POLICY "Admins can update sync logs"
  ON accounting_sync_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE accounting_sync_logs IS 'Audit trail for all accounting sync operations';
COMMENT ON COLUMN accounting_sync_logs.sync_type IS 'Type of sync: manual (admin triggered), automatic (cron), or retry (failed transaction retry)';
COMMENT ON COLUMN accounting_sync_logs.status IS 'Sync status: pending, in_progress, completed (all succeeded), failed (critical error), partial (some failed)';
COMMENT ON COLUMN accounting_sync_logs.transactions_attempted IS 'Total number of transactions attempted in this sync';
COMMENT ON COLUMN accounting_sync_logs.transactions_succeeded IS 'Number of transactions successfully synced';
COMMENT ON COLUMN accounting_sync_logs.transactions_failed IS 'Number of transactions that failed to sync';
COMMENT ON COLUMN accounting_sync_logs.error_details IS 'JSON array of error details for failed transactions';
COMMENT ON COLUMN accounting_sync_logs.initiated_by IS 'User ID of admin who triggered manual sync (NULL for automatic)';
COMMENT ON COLUMN accounting_sync_logs.parent_sync_id IS 'Reference to original sync log if this is a retry';
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
-- Create accounting encryption keys table for tracking encryption key versions
-- Migration: 034_create_accounting_encryption_keys.sql

-- Create encryption keys table
CREATE TABLE accounting_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_version INTEGER NOT NULL UNIQUE,
  algorithm TEXT DEFAULT 'aes-256-gcm',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_at TIMESTAMPTZ,

  CHECK (key_version > 0)
);

-- Create index
CREATE INDEX idx_encryption_keys_active ON accounting_encryption_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_encryption_keys_version ON accounting_encryption_keys(key_version);

-- Insert initial key version (actual key stored in environment variable)
INSERT INTO accounting_encryption_keys (key_version, algorithm, is_active)
VALUES (1, 'aes-256-gcm', true);

-- Enable Row Level Security
ALTER TABLE accounting_encryption_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can view encryption keys metadata
-- Note: This table only stores metadata, not actual keys

-- Admins can view encryption keys metadata
CREATE POLICY "Admins can view encryption keys metadata"
  ON accounting_encryption_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert new key versions (for key rotation)
CREATE POLICY "Admins can insert encryption key versions"
  ON accounting_encryption_keys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update key status (for rotation)
CREATE POLICY "Admins can update encryption key status"
  ON accounting_encryption_keys FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE accounting_encryption_keys IS 'Tracks encryption key versions for OAuth token encryption (actual keys stored in environment variables)';
COMMENT ON COLUMN accounting_encryption_keys.key_version IS 'Version number of the encryption key (increments with each rotation)';
COMMENT ON COLUMN accounting_encryption_keys.algorithm IS 'Encryption algorithm used (default: aes-256-gcm)';
COMMENT ON COLUMN accounting_encryption_keys.is_active IS 'Whether this key version is currently active';
COMMENT ON COLUMN accounting_encryption_keys.rotated_at IS 'Timestamp when this key was rotated (replaced by newer version)';
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
