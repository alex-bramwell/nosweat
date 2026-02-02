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
