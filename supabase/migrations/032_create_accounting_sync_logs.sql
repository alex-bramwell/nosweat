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
