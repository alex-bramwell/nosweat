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
