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
