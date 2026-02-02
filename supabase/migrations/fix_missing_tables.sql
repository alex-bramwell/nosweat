-- Targeted migration to fill gaps in database schema
-- This adds only missing tables needed for accounting integration
-- Safe to run multiple times (uses IF NOT EXISTS)

-- ============================================================
-- Migration 001: stripe_customers (if not exists)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_customers') THEN
    CREATE TABLE stripe_customers (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      stripe_customer_id TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
    ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own Stripe customer"
      ON stripe_customers FOR SELECT
      USING (auth.uid() = id);

    RAISE NOTICE 'Created stripe_customers table';
  ELSE
    RAISE NOTICE 'stripe_customers table already exists, skipping';
  END IF;
END $$;

-- ============================================================
-- Migration 002: bookings (if not exists)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    CREATE TABLE bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      booking_date DATE NOT NULL,
      booking_time TIME NOT NULL,
      status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
      payment_intent_id TEXT,
      amount INTEGER, -- in pence
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX idx_bookings_date ON bookings(booking_date);
    CREATE INDEX idx_bookings_status ON bookings(status);
    CREATE INDEX idx_bookings_payment_intent ON bookings(payment_intent_id);

    ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own bookings"
      ON bookings FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create own bookings"
      ON bookings FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    RAISE NOTICE 'Created bookings table';
  ELSE
    RAISE NOTICE 'bookings table already exists, skipping';
  END IF;
END $$;

-- ============================================================
-- Migration 003: payments (CRITICAL - needed for accounting)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    CREATE TABLE payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL, -- in pence
      currency TEXT DEFAULT 'gbp',
      payment_type TEXT NOT NULL,
      payment_intent_id TEXT UNIQUE,
      status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending',
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_payments_user_id ON payments(user_id);
    CREATE INDEX idx_payments_status ON payments(status);
    CREATE INDEX idx_payments_payment_intent ON payments(payment_intent_id);
    CREATE INDEX idx_payments_type ON payments(payment_type);
    CREATE INDEX idx_payments_created_at ON payments(created_at);

    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own payments"
      ON payments FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Admins can view all payments"
      ON payments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    RAISE NOTICE 'Created payments table';
  ELSE
    RAISE NOTICE 'payments table already exists, skipping';
  END IF;
END $$;

-- ============================================================
-- Migration 004: trial_memberships (if not exists)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trial_memberships') THEN
    CREATE TABLE trial_memberships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      start_date DATE NOT NULL DEFAULT CURRENT_DATE,
      end_date DATE NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_trial_memberships_user_id ON trial_memberships(user_id);
    CREATE INDEX idx_trial_memberships_active ON trial_memberships(is_active);
    CREATE INDEX idx_trial_memberships_end_date ON trial_memberships(end_date);

    ALTER TABLE trial_memberships ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own trial membership"
      ON trial_memberships FOR SELECT
      USING (auth.uid() = user_id);

    RAISE NOTICE 'Created trial_memberships table';
  ELSE
    RAISE NOTICE 'trial_memberships table already exists, skipping';
  END IF;
END $$;

-- ============================================================
-- Migration 024: workout_bookings (if not exists)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_bookings') THEN
    CREATE TABLE workout_bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      booking_status TEXT CHECK (booking_status IN ('booked', 'attended', 'cancelled', 'no_show')) DEFAULT 'booked',
      payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')) DEFAULT 'pending',
      payment_intent_id TEXT,
      amount_paid INTEGER, -- in pence
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(workout_id, user_id)
    );

    CREATE INDEX idx_workout_bookings_workout_id ON workout_bookings(workout_id);
    CREATE INDEX idx_workout_bookings_user_id ON workout_bookings(user_id);
    CREATE INDEX idx_workout_bookings_booking_status ON workout_bookings(booking_status);
    CREATE INDEX idx_workout_bookings_payment_status ON workout_bookings(payment_status);
    CREATE INDEX idx_workout_bookings_payment_intent ON workout_bookings(payment_intent_id);

    ALTER TABLE workout_bookings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view their own workout bookings"
      ON workout_bookings FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Admins can view all workout bookings"
      ON workout_bookings FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    CREATE POLICY "Users can create workout bookings"
      ON workout_bookings FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own bookings"
      ON workout_bookings FOR UPDATE
      USING (auth.uid() = user_id);

    RAISE NOTICE 'Created workout_bookings table';
  ELSE
    RAISE NOTICE 'workout_bookings table already exists, skipping';
  END IF;
END $$;

-- ============================================================
-- Migration 029: Add payment fields to service_bookings
-- ============================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_bookings') THEN
    -- Add columns only if they don't exist
    ALTER TABLE service_bookings
    ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
    ADD COLUMN IF NOT EXISTS amount_paid INTEGER,
    ADD COLUMN IF NOT EXISTS refund_eligible_until TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_service_bookings_payment_status ON service_bookings(payment_status);
    CREATE INDEX IF NOT EXISTS idx_service_bookings_payment_intent ON service_bookings(payment_intent_id);

    RAISE NOTICE 'Added payment fields to service_bookings table';
  ELSE
    RAISE NOTICE 'service_bookings table does not exist, skipping payment fields';
  END IF;
END $$;

-- ============================================================
-- ACCOUNTING MIGRATIONS (030-035)
-- ============================================================

-- Migration 030: accounting_integrations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_provider') THEN
    CREATE TYPE integration_provider AS ENUM ('quickbooks', 'xero');
    RAISE NOTICE 'Created integration_provider enum';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_status') THEN
    CREATE TYPE integration_status AS ENUM ('active', 'disconnected', 'error', 'expired');
    RAISE NOTICE 'Created integration_status enum';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_integrations') THEN
    CREATE TABLE accounting_integrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider integration_provider NOT NULL UNIQUE,
      status integration_status DEFAULT 'disconnected',
      access_token_encrypted TEXT,
      refresh_token_encrypted TEXT,
      token_expires_at TIMESTAMPTZ,
      realm_id TEXT,
      tenant_id TEXT,
      company_name TEXT,
      last_sync_at TIMESTAMPTZ,
      last_sync_status TEXT,
      last_error TEXT,
      auto_sync_enabled BOOLEAN DEFAULT true,
      sync_frequency_minutes INTEGER DEFAULT 60,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_accounting_integrations_provider ON accounting_integrations(provider);
    CREATE INDEX idx_accounting_integrations_status ON accounting_integrations(status);

    ALTER TABLE accounting_integrations ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Admins can view accounting integrations"
      ON accounting_integrations FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    CREATE POLICY "Admins can insert accounting integrations"
      ON accounting_integrations FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    CREATE POLICY "Admins can update accounting integrations"
      ON accounting_integrations FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    CREATE POLICY "Admins can delete accounting integrations"
      ON accounting_integrations FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    RAISE NOTICE 'Created accounting_integrations table';
  END IF;
END $$;

-- Migration 031: accounting_account_mappings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'revenue_category') THEN
    CREATE TYPE revenue_category AS ENUM (
      'day_pass',
      'service_pt',
      'service_specialty_class',
      'service_sports_massage',
      'service_nutrition',
      'service_physio',
      'refund'
    );
    RAISE NOTICE 'Created revenue_category enum';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_account_mappings') THEN
    CREATE TABLE accounting_account_mappings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider integration_provider NOT NULL,
      revenue_category revenue_category NOT NULL,
      external_account_id TEXT NOT NULL,
      external_account_name TEXT NOT NULL,
      external_account_code TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(provider, revenue_category)
    );

    CREATE INDEX idx_account_mappings_provider ON accounting_account_mappings(provider);
    CREATE INDEX idx_account_mappings_category ON accounting_account_mappings(revenue_category);
    CREATE INDEX idx_account_mappings_active ON accounting_account_mappings(is_active);

    ALTER TABLE accounting_account_mappings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Admins can view account mappings"
      ON accounting_account_mappings FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    CREATE POLICY "Admins can manage account mappings"
      ON accounting_account_mappings FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    RAISE NOTICE 'Created accounting_account_mappings table';
  END IF;
END $$;

-- Migration 032: accounting_sync_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_type') THEN
    CREATE TYPE sync_type AS ENUM ('manual', 'automatic', 'retry');
    RAISE NOTICE 'Created sync_type enum';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
    CREATE TYPE sync_status AS ENUM ('in_progress', 'completed', 'partial', 'failed');
    RAISE NOTICE 'Created sync_status enum';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_sync_logs') THEN
    CREATE TABLE accounting_sync_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider integration_provider NOT NULL,
      sync_type sync_type NOT NULL,
      status sync_status NOT NULL DEFAULT 'in_progress',
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      duration_seconds INTEGER,
      transactions_attempted INTEGER DEFAULT 0,
      transactions_succeeded INTEGER DEFAULT 0,
      transactions_failed INTEGER DEFAULT 0,
      error_message TEXT,
      error_details JSONB,
      date_range_start DATE,
      date_range_end DATE,
      triggered_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_sync_logs_provider ON accounting_sync_logs(provider);
    CREATE INDEX idx_sync_logs_status ON accounting_sync_logs(status);
    CREATE INDEX idx_sync_logs_started_at ON accounting_sync_logs(started_at DESC);
    CREATE INDEX idx_sync_logs_type ON accounting_sync_logs(sync_type);

    ALTER TABLE accounting_sync_logs ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Admins can view sync logs"
      ON accounting_sync_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    RAISE NOTICE 'Created accounting_sync_logs table';
  END IF;
END $$;

-- Migration 033: accounting_synced_transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_synced_transactions') THEN
    CREATE TABLE accounting_synced_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider integration_provider NOT NULL,
      payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      external_transaction_id TEXT NOT NULL,
      external_transaction_number TEXT,
      sync_log_id UUID REFERENCES accounting_sync_logs(id) ON DELETE SET NULL,
      synced_amount INTEGER NOT NULL,
      synced_at TIMESTAMPTZ DEFAULT NOW(),
      needs_resync BOOLEAN DEFAULT false,
      resync_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(provider, payment_id)
    );

    CREATE INDEX idx_synced_transactions_provider ON accounting_synced_transactions(provider);
    CREATE INDEX idx_synced_transactions_payment ON accounting_synced_transactions(payment_id);
    CREATE INDEX idx_synced_transactions_external_id ON accounting_synced_transactions(external_transaction_id);
    CREATE INDEX idx_synced_transactions_sync_log ON accounting_synced_transactions(sync_log_id);
    CREATE INDEX idx_synced_transactions_needs_resync ON accounting_synced_transactions(needs_resync) WHERE needs_resync = true;

    ALTER TABLE accounting_synced_transactions ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Admins can view synced transactions"
      ON accounting_synced_transactions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    RAISE NOTICE 'Created accounting_synced_transactions table';
  END IF;
END $$;

-- Migration 034: accounting_encryption_keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_encryption_keys') THEN
    CREATE TABLE accounting_encryption_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      version INTEGER NOT NULL UNIQUE,
      algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
      is_active BOOLEAN DEFAULT false,
      activated_at TIMESTAMPTZ,
      deactivated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id)
    );

    CREATE INDEX idx_encryption_keys_version ON accounting_encryption_keys(version);
    CREATE INDEX idx_encryption_keys_active ON accounting_encryption_keys(is_active) WHERE is_active = true;

    ALTER TABLE accounting_encryption_keys ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Admins can view encryption keys"
      ON accounting_encryption_keys FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    CREATE POLICY "Admins can manage encryption keys"
      ON accounting_encryption_keys FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    RAISE NOTICE 'Created accounting_encryption_keys table';
  END IF;
END $$;

-- Migration 035: Add accounting fields to payments
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS accounting_synced_qb BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS accounting_synced_xero BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS accounting_last_sync_attempt TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_payments_accounting_synced_qb ON payments(accounting_synced_qb) WHERE accounting_synced_qb = false;
    CREATE INDEX IF NOT EXISTS idx_payments_accounting_synced_xero ON payments(accounting_synced_xero) WHERE accounting_synced_xero = false;
    CREATE INDEX IF NOT EXISTS idx_payments_accounting_last_sync ON payments(accounting_last_sync_attempt);

    RAISE NOTICE 'Added accounting fields to payments table';
  END IF;
END $$;

-- Done!
DO $$ BEGIN
  RAISE NOTICE '✅ Migration complete! All required tables created.';
END $$;
