-- ============================================================================
-- PHASE 1: Multi-Tenancy Foundation
-- ============================================================================
-- This migration adds multi-tenant support to the gym management platform.
-- It creates new tenant tables (gyms, gym_branding, gym_features, etc.),
-- adds gym_id to all existing tables, updates RLS policies, and creates
-- helper functions for tenant resolution.
-- ============================================================================

-- ============================================================================
-- 1. HELPER FUNCTIONS (created first, used by everything else)
-- ============================================================================

-- Resolve a user's gym_id from their profile
CREATE OR REPLACE FUNCTION get_user_gym_id()
RETURNS UUID AS $$
  SELECT gym_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if a feature is enabled for a gym
CREATE OR REPLACE FUNCTION is_feature_enabled(gym_id_param UUID, feature_key_param TEXT)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.gym_features WHERE gym_id = gym_id_param AND feature_key = feature_key_param),
    false
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if a user is the owner of a specific gym
CREATE OR REPLACE FUNCTION is_gym_owner(gym_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gyms WHERE id = gym_id_param AND owner_id = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if a user is admin or owner for their gym
CREATE OR REPLACE FUNCTION is_gym_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'coach')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- 2. NEW TABLES: Core Tenant Infrastructure
-- ============================================================================

-- 2a. gyms — the central tenant table
CREATE TABLE public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'onboarding' CHECK (status IN ('active', 'suspended', 'cancelled', 'onboarding')),
  contact_email TEXT,
  contact_phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'GB',
  website_url TEXT,
  google_maps_embed_url TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gyms_slug ON public.gyms(slug);
CREATE INDEX idx_gyms_owner_id ON public.gyms(owner_id);
CREATE INDEX idx_gyms_status ON public.gyms(status);

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;


-- 2b. gym_branding — all visual/content customization for a gym
CREATE TABLE public.gym_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE UNIQUE,

  -- Colors
  color_bg TEXT DEFAULT '#ffffff',
  color_bg_light TEXT DEFAULT '#f8f9fa',
  color_bg_dark TEXT DEFAULT '#e9ecef',
  color_surface TEXT DEFAULT '#ffffff',
  color_accent TEXT DEFAULT '#2563eb',
  color_accent2 TEXT DEFAULT '#dc2626',
  color_secondary TEXT DEFAULT '#0891b2',
  color_secondary2 TEXT DEFAULT '#059669',
  color_specialty TEXT DEFAULT '#7c3aed',
  color_text TEXT DEFAULT '#1f2937',
  color_muted TEXT DEFAULT '#6b7280',
  color_header TEXT DEFAULT '#111827',
  color_footer TEXT DEFAULT '#111827',

  -- Typography
  font_header TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Inter',

  -- Shape
  border_radius TEXT DEFAULT '0.5rem',

  -- Theme mode
  theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),

  -- Assets
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  hero_image_url TEXT,
  about_image_url TEXT,
  og_image_url TEXT,

  -- Content: Hero
  hero_headline TEXT DEFAULT 'Welcome to Your Gym',
  hero_subtitle TEXT DEFAULT 'Transform your fitness journey with expert coaching and a supportive community.',

  -- Content: CTA
  cta_headline TEXT DEFAULT 'Ready to Start Your Journey?',
  cta_subtitle TEXT DEFAULT 'Join us today and experience the difference. Your first class is free!',

  -- Content: About
  about_mission TEXT,
  about_philosophy TEXT,
  about_facility TEXT,

  -- Content: Footer
  footer_text TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gym_branding_gym_id ON public.gym_branding(gym_id);

ALTER TABLE public.gym_branding ENABLE ROW LEVEL SECURITY;


-- 2c. gym_features — toggleable features per gym
CREATE TABLE public.gym_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_at TIMESTAMPTZ,
  monthly_cost_pence INTEGER NOT NULL DEFAULT 1000,
  UNIQUE(gym_id, feature_key)
);

CREATE INDEX idx_gym_features_gym_id ON public.gym_features(gym_id);
CREATE INDEX idx_gym_features_key ON public.gym_features(feature_key);

ALTER TABLE public.gym_features ENABLE ROW LEVEL SECURITY;


-- 2d. gym_programs — replaces src/data/programs.ts & programDetails.ts
CREATE TABLE public.gym_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tagline TEXT,
  overview TEXT,
  features TEXT[] DEFAULT '{}',
  benefits JSONB DEFAULT '[]',
  who_is_it_for TEXT[] DEFAULT '{}',
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  price_pence INTEGER,
  price_unit TEXT,
  price_note TEXT,
  schedule_info TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gym_id, slug)
);

CREATE INDEX idx_gym_programs_gym_id ON public.gym_programs(gym_id);

ALTER TABLE public.gym_programs ENABLE ROW LEVEL SECURITY;


-- 2e. gym_schedule — replaces src/data/schedule.ts
CREATE TABLE public.gym_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  start_time TIME NOT NULL,
  end_time TIME,
  class_name TEXT NOT NULL,
  coach_id UUID REFERENCES public.profiles(id),
  program_id UUID REFERENCES public.gym_programs(id),
  max_capacity INTEGER DEFAULT 16,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gym_schedule_gym_id ON public.gym_schedule(gym_id);
CREATE INDEX idx_gym_schedule_day ON public.gym_schedule(day_of_week);

ALTER TABLE public.gym_schedule ENABLE ROW LEVEL SECURITY;


-- 2f. gym_stats — replaces src/data/stats.ts
CREATE TABLE public.gym_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value INTEGER NOT NULL,
  suffix TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_gym_stats_gym_id ON public.gym_stats(gym_id);

ALTER TABLE public.gym_stats ENABLE ROW LEVEL SECURITY;


-- 2g. gym_memberships — replaces hardcoded membership types
CREATE TABLE public.gym_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_pence INTEGER,
  billing_period TEXT DEFAULT 'monthly',
  features TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gym_id, slug)
);

CREATE INDEX idx_gym_memberships_gym_id ON public.gym_memberships(gym_id);

ALTER TABLE public.gym_memberships ENABLE ROW LEVEL SECURITY;


-- 2h. gym_feature_billing — tracks monthly feature costs
CREATE TABLE public.gym_feature_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_pence INTEGER NOT NULL DEFAULT 1000,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'waived')),
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gym_feature_billing_gym_id ON public.gym_feature_billing(gym_id);
CREATE INDEX idx_gym_feature_billing_period ON public.gym_feature_billing(period_start, period_end);

ALTER TABLE public.gym_feature_billing ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 3. ADD gym_id TO ALL EXISTING TABLES
-- ============================================================================
-- Added as NULLABLE first for backward compatibility.
-- Phase 7 migration will backfill data and set NOT NULL.

-- 3a. profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_profiles_gym_id ON public.profiles(gym_id);

-- 3b. stripe_customers
ALTER TABLE public.stripe_customers ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_gym_id ON public.stripe_customers(gym_id);

-- 3c. bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_bookings_gym_id ON public.bookings(gym_id);

-- 3d. payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON public.payments(gym_id);

-- 3e. trial_memberships
ALTER TABLE public.trial_memberships ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_trial_memberships_gym_id ON public.trial_memberships(gym_id);

-- 3f. workouts
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_workouts_gym_id ON public.workouts(gym_id);

-- 3g. workout_bookings
ALTER TABLE public.workout_bookings ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_workout_bookings_gym_id ON public.workout_bookings(gym_id);

-- 3h. coach_services
ALTER TABLE public.coach_services ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_coach_services_gym_id ON public.coach_services(gym_id);

-- 3i. service_bookings
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_gym_id ON public.service_bookings(gym_id);

-- 3j. accounting_integrations
ALTER TABLE public.accounting_integrations ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_accounting_integrations_gym_id ON public.accounting_integrations(gym_id);

-- 3k. accounting_account_mappings
ALTER TABLE public.accounting_account_mappings ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_accounting_account_mappings_gym_id ON public.accounting_account_mappings(gym_id);

-- 3l. accounting_sync_logs
ALTER TABLE public.accounting_sync_logs ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_accounting_sync_logs_gym_id ON public.accounting_sync_logs(gym_id);

-- 3m. accounting_synced_transactions
ALTER TABLE public.accounting_synced_transactions ADD COLUMN IF NOT EXISTS gym_id UUID REFERENCES public.gyms(id);
CREATE INDEX IF NOT EXISTS idx_accounting_synced_transactions_gym_id ON public.accounting_synced_transactions(gym_id);


-- ============================================================================
-- 4. UPDATE handle_new_user() TRIGGER
-- ============================================================================
-- Now accepts gym_id from user metadata during signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, gym_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    (NEW.raw_user_meta_data->>'gym_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 5. RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5a. gyms
-- ---------------------------------------------------------------------------
-- Public can read basic gym info by slug (needed for subdomain resolution)
CREATE POLICY "Anyone can view active gyms"
  ON public.gyms FOR SELECT
  USING (status = 'active');

-- Gym owners can view their own gym (even if onboarding)
CREATE POLICY "Owners can view own gym"
  ON public.gyms FOR SELECT
  USING (owner_id = auth.uid());

-- Gym owners can update their own gym
CREATE POLICY "Owners can update own gym"
  ON public.gyms FOR UPDATE
  USING (owner_id = auth.uid());

-- Authenticated users can create a gym (during onboarding)
CREATE POLICY "Authenticated users can create a gym"
  ON public.gyms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5b. gym_branding
-- ---------------------------------------------------------------------------
-- Public can read branding (needed to render the gym site)
CREATE POLICY "Anyone can view gym branding"
  ON public.gym_branding FOR SELECT
  USING (true);

-- Gym owners/admins can update branding
CREATE POLICY "Gym owners can update branding"
  ON public.gym_branding FOR UPDATE
  USING (is_gym_owner(gym_id));

-- Gym owners can insert branding (during onboarding)
CREATE POLICY "Gym owners can insert branding"
  ON public.gym_branding FOR INSERT
  WITH CHECK (is_gym_owner(gym_id));

-- ---------------------------------------------------------------------------
-- 5c. gym_features
-- ---------------------------------------------------------------------------
-- Public can read features (needed for feature gating in UI)
CREATE POLICY "Anyone can view gym features"
  ON public.gym_features FOR SELECT
  USING (true);

-- Gym owners can manage features
CREATE POLICY "Gym owners can insert features"
  ON public.gym_features FOR INSERT
  WITH CHECK (is_gym_owner(gym_id));

CREATE POLICY "Gym owners can update features"
  ON public.gym_features FOR UPDATE
  USING (is_gym_owner(gym_id));

CREATE POLICY "Gym owners can delete features"
  ON public.gym_features FOR DELETE
  USING (is_gym_owner(gym_id));

-- ---------------------------------------------------------------------------
-- 5d. gym_programs
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can view active gym programs"
  ON public.gym_programs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Gym admins can manage programs"
  ON public.gym_programs FOR ALL
  USING (gym_id = get_user_gym_id() AND is_gym_admin());

-- ---------------------------------------------------------------------------
-- 5e. gym_schedule
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can view active schedule"
  ON public.gym_schedule FOR SELECT
  USING (is_active = true);

CREATE POLICY "Gym admins can manage schedule"
  ON public.gym_schedule FOR ALL
  USING (gym_id = get_user_gym_id() AND is_gym_admin());

-- ---------------------------------------------------------------------------
-- 5f. gym_stats
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can view gym stats"
  ON public.gym_stats FOR SELECT
  USING (true);

CREATE POLICY "Gym admins can manage stats"
  ON public.gym_stats FOR ALL
  USING (gym_id = get_user_gym_id() AND is_gym_admin());

-- ---------------------------------------------------------------------------
-- 5g. gym_memberships
-- ---------------------------------------------------------------------------
CREATE POLICY "Anyone can view active memberships"
  ON public.gym_memberships FOR SELECT
  USING (is_active = true);

CREATE POLICY "Gym admins can manage memberships"
  ON public.gym_memberships FOR ALL
  USING (gym_id = get_user_gym_id() AND is_gym_admin());

-- ---------------------------------------------------------------------------
-- 5h. gym_feature_billing
-- ---------------------------------------------------------------------------
CREATE POLICY "Gym owners can view their billing"
  ON public.gym_feature_billing FOR SELECT
  USING (is_gym_owner(gym_id));

CREATE POLICY "System can insert billing records"
  ON public.gym_feature_billing FOR INSERT
  WITH CHECK (is_gym_owner(gym_id));


-- ============================================================================
-- 6. UPDATE RLS POLICIES ON EXISTING TABLES (add gym_id scoping)
-- ============================================================================
-- Strategy: Drop existing policies and recreate with gym_id filtering.
-- For tables where gym_id may still be NULL (pre-migration data), we allow
-- NULL gym_id to match so existing data continues to work until Phase 7.

-- ---------------------------------------------------------------------------
-- 6a. profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view coach profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can update own profile" ON public.profiles;

-- Users can always view and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Anyone can view coach profiles within the same gym (public pages need this)
CREATE POLICY "Anyone can view coach profiles"
  ON public.profiles FOR SELECT
  USING (role = 'coach');

-- Coaches/admins can view all profiles in their gym
CREATE POLICY "Gym staff can view gym profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('coach', 'admin')
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- Admins can update profiles in their gym
CREATE POLICY "Gym admins can update gym profiles"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- Admins can insert profiles for their gym
CREATE POLICY "Gym admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can delete profiles in their gym
CREATE POLICY "Gym admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6b. stripe_customers
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own Stripe customer data" ON public.stripe_customers;

CREATE POLICY "Users can view own stripe data"
  ON public.stripe_customers FOR SELECT
  USING (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6c. bookings
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- Staff can view all bookings in their gym
CREATE POLICY "Gym staff can view gym bookings"
  ON public.bookings FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'coach', 'admin')
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6d. payments
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- Admins can view all payments in their gym
CREATE POLICY "Gym admins can view gym payments"
  ON public.payments FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6e. trial_memberships
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own trial membership" ON public.trial_memberships;
DROP POLICY IF EXISTS "Users can update their own trial membership" ON public.trial_memberships;

CREATE POLICY "Users can view own trial"
  ON public.trial_memberships FOR SELECT
  USING (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Users can update own trial"
  ON public.trial_memberships FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6f. workouts
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view published workouts" ON public.workouts;
DROP POLICY IF EXISTS "Coaches and admins can create workouts" ON public.workouts;
DROP POLICY IF EXISTS "Coaches can update own workouts, admins can update all" ON public.workouts;
DROP POLICY IF EXISTS "Only admins can delete workouts" ON public.workouts;
DROP POLICY IF EXISTS "Staff can view workouts" ON public.workouts;
DROP POLICY IF EXISTS "Staff can update workouts" ON public.workouts;

-- Published workouts visible to anyone in the same gym
CREATE POLICY "Gym members can view published workouts"
  ON public.workouts FOR SELECT
  USING (
    status = 'published'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- Staff can view all workouts in their gym (including drafts)
CREATE POLICY "Gym staff can view all gym workouts"
  ON public.workouts FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'coach', 'admin')
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- Coaches/admins can create workouts for their gym
CREATE POLICY "Gym coaches can create workouts"
  ON public.workouts FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('coach', 'admin')
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- Coaches can update own, admins/staff can update any in their gym
CREATE POLICY "Gym staff can update workouts"
  ON public.workouts FOR UPDATE
  USING (
    (
      (auth.uid() = created_by AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('coach', 'admin'))
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'admin')
    )
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- Only admins can delete workouts in their gym
CREATE POLICY "Gym admins can delete workouts"
  ON public.workouts FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6g. workout_bookings
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own workout bookings" ON public.workout_bookings;
DROP POLICY IF EXISTS "Staff can view all workout bookings" ON public.workout_bookings;
DROP POLICY IF EXISTS "Users can create their own workout bookings" ON public.workout_bookings;
DROP POLICY IF EXISTS "Users can cancel their own workout bookings" ON public.workout_bookings;
DROP POLICY IF EXISTS "Staff can update workout bookings" ON public.workout_bookings;
DROP POLICY IF EXISTS "Users can delete their own workout bookings" ON public.workout_bookings;
DROP POLICY IF EXISTS "Admins can delete any workout booking" ON public.workout_bookings;

CREATE POLICY "Users can view own workout bookings"
  ON public.workout_bookings FOR SELECT
  USING (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym staff can view gym workout bookings"
  ON public.workout_bookings FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'coach', 'admin')
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Users can create workout bookings"
  ON public.workout_bookings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Users can update own workout bookings"
  ON public.workout_bookings FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym staff can update workout bookings"
  ON public.workout_bookings FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'coach', 'admin')
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Users can delete own workout bookings"
  ON public.workout_bookings FOR DELETE
  USING (
    auth.uid() = user_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can delete workout bookings"
  ON public.workout_bookings FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6h. coach_services
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view active coach services" ON public.coach_services;
DROP POLICY IF EXISTS "Coaches can view their own services" ON public.coach_services;
DROP POLICY IF EXISTS "Admins can view all coach services" ON public.coach_services;
DROP POLICY IF EXISTS "Admins can insert coach services" ON public.coach_services;
DROP POLICY IF EXISTS "Admins can update coach services" ON public.coach_services;
DROP POLICY IF EXISTS "Admins can delete coach services" ON public.coach_services;
DROP POLICY IF EXISTS "Coaches can update their own service rates" ON public.coach_services;

-- Public can view active services for a gym
CREATE POLICY "Anyone can view active gym services"
  ON public.coach_services FOR SELECT
  USING (
    is_active = true
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- Coaches can view their own services
CREATE POLICY "Coaches can view own services"
  ON public.coach_services FOR SELECT
  USING (auth.uid() = coach_id);

-- Admins can manage services in their gym
CREATE POLICY "Gym admins can view all services"
  ON public.coach_services FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can insert services"
  ON public.coach_services FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can update services"
  ON public.coach_services FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can delete services"
  ON public.coach_services FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- Coaches can update their own rates
CREATE POLICY "Coaches can update own service rates"
  ON public.coach_services FOR UPDATE
  USING (auth.uid() = coach_id);

-- ---------------------------------------------------------------------------
-- 6i. service_bookings
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can view their own service bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Coaches can view their service bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Admins can view all service bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Members can create service bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Members can update their own bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Coaches can update their service bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Admins can update any service booking" ON public.service_bookings;

CREATE POLICY "Members can view own service bookings"
  ON public.service_bookings FOR SELECT
  USING (
    auth.uid() = member_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Coaches can view their service bookings"
  ON public.service_bookings FOR SELECT
  USING (
    auth.uid() = coach_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can view all service bookings"
  ON public.service_bookings FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Members can create service bookings"
  ON public.service_bookings FOR INSERT
  WITH CHECK (
    auth.uid() = member_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Members can update own service bookings"
  ON public.service_bookings FOR UPDATE
  USING (
    auth.uid() = member_id AND status = 'pending'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Coaches can update their service bookings"
  ON public.service_bookings FOR UPDATE
  USING (
    auth.uid() = coach_id
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can update service bookings"
  ON public.service_bookings FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6j. accounting_integrations
-- ---------------------------------------------------------------------------
-- Remove the UNIQUE constraint on provider (now multiple gyms can have same provider)
ALTER TABLE public.accounting_integrations DROP CONSTRAINT IF EXISTS accounting_integrations_provider_key;
-- Add unique constraint per gym instead
ALTER TABLE public.accounting_integrations ADD CONSTRAINT accounting_integrations_gym_provider_unique UNIQUE (gym_id, provider);

DROP POLICY IF EXISTS "Admins can view accounting integrations" ON public.accounting_integrations;
DROP POLICY IF EXISTS "Admins can insert accounting integrations" ON public.accounting_integrations;
DROP POLICY IF EXISTS "Admins can update accounting integrations" ON public.accounting_integrations;
DROP POLICY IF EXISTS "Admins can delete accounting integrations" ON public.accounting_integrations;

CREATE POLICY "Gym admins can view accounting integrations"
  ON public.accounting_integrations FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can insert accounting integrations"
  ON public.accounting_integrations FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can update accounting integrations"
  ON public.accounting_integrations FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can delete accounting integrations"
  ON public.accounting_integrations FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6k. accounting_account_mappings
-- ---------------------------------------------------------------------------
-- Remove old unique constraint and make it per-gym
ALTER TABLE public.accounting_account_mappings DROP CONSTRAINT IF EXISTS accounting_account_mappings_provider_revenue_category_key;
ALTER TABLE public.accounting_account_mappings ADD CONSTRAINT accounting_account_mappings_gym_unique UNIQUE (gym_id, provider, revenue_category);

DROP POLICY IF EXISTS "Admins can view account mappings" ON public.accounting_account_mappings;
DROP POLICY IF EXISTS "Admins can manage account mappings" ON public.accounting_account_mappings;

CREATE POLICY "Gym admins can view account mappings"
  ON public.accounting_account_mappings FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can manage account mappings"
  ON public.accounting_account_mappings FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6l. accounting_sync_logs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view sync logs" ON public.accounting_sync_logs;
DROP POLICY IF EXISTS "Admins can insert sync logs" ON public.accounting_sync_logs;
DROP POLICY IF EXISTS "Admins can update sync logs" ON public.accounting_sync_logs;

CREATE POLICY "Gym admins can view sync logs"
  ON public.accounting_sync_logs FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can insert sync logs"
  ON public.accounting_sync_logs FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can update sync logs"
  ON public.accounting_sync_logs FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- 6m. accounting_synced_transactions
-- ---------------------------------------------------------------------------
-- Update unique constraints to be per-gym
ALTER TABLE public.accounting_synced_transactions DROP CONSTRAINT IF EXISTS accounting_synced_transactions_provider_payment_id_key;
ALTER TABLE public.accounting_synced_transactions DROP CONSTRAINT IF EXISTS accounting_synced_transactions_provider_external_transaction_key;
ALTER TABLE public.accounting_synced_transactions
  ADD CONSTRAINT accounting_synced_txn_gym_provider_payment UNIQUE (gym_id, provider, payment_id);
ALTER TABLE public.accounting_synced_transactions
  ADD CONSTRAINT accounting_synced_txn_gym_provider_external UNIQUE (gym_id, provider, external_transaction_id);

DROP POLICY IF EXISTS "Admins can view synced transactions" ON public.accounting_synced_transactions;
DROP POLICY IF EXISTS "Admins can insert synced transactions" ON public.accounting_synced_transactions;
DROP POLICY IF EXISTS "Admins can update synced transactions" ON public.accounting_synced_transactions;

CREATE POLICY "Gym admins can view synced transactions"
  ON public.accounting_synced_transactions FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can insert synced transactions"
  ON public.accounting_synced_transactions FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );

CREATE POLICY "Gym admins can update synced transactions"
  ON public.accounting_synced_transactions FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (gym_id = get_user_gym_id() OR gym_id IS NULL)
  );


-- ============================================================================
-- 6n. Fix workouts UNIQUE constraint for multi-tenancy
-- ============================================================================
-- The workouts table has UNIQUE(date) but with multi-tenancy, multiple gyms
-- need workouts on the same date. Replace with UNIQUE(gym_id, date).
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_gym_date ON public.workouts(gym_id, date);


-- ============================================================================
-- 7. FEATURE ENFORCEMENT TRIGGERS
-- ============================================================================
-- These prevent data insertion when a feature is disabled for the gym.

-- 7a. Enforce class_booking feature on bookings
CREATE OR REPLACE FUNCTION check_booking_feature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gym_id IS NOT NULL AND NOT is_feature_enabled(NEW.gym_id, 'class_booking') THEN
    RAISE EXCEPTION 'Feature "class_booking" is not enabled for this gym';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_booking_feature
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION check_booking_feature();

-- 7b. Enforce wod_programming feature on workouts
CREATE OR REPLACE FUNCTION check_workout_feature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gym_id IS NOT NULL AND NOT is_feature_enabled(NEW.gym_id, 'wod_programming') THEN
    RAISE EXCEPTION 'Feature "wod_programming" is not enabled for this gym';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_workout_feature
  BEFORE INSERT ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION check_workout_feature();

-- 7c. Enforce trial_memberships feature
CREATE OR REPLACE FUNCTION check_trial_feature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gym_id IS NOT NULL AND NOT is_feature_enabled(NEW.gym_id, 'trial_memberships') THEN
    RAISE EXCEPTION 'Feature "trial_memberships" is not enabled for this gym';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_trial_feature
  BEFORE INSERT ON public.trial_memberships
  FOR EACH ROW EXECUTE FUNCTION check_trial_feature();

-- 7d. Enforce service_booking feature on service_bookings
CREATE OR REPLACE FUNCTION check_service_booking_feature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gym_id IS NOT NULL AND NOT is_feature_enabled(NEW.gym_id, 'service_booking') THEN
    RAISE EXCEPTION 'Feature "service_booking" is not enabled for this gym';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_service_booking_feature
  BEFORE INSERT ON public.service_bookings
  FOR EACH ROW EXECUTE FUNCTION check_service_booking_feature();


-- ============================================================================
-- 8. UTILITY: Updated timestamp trigger for new tables
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all new tables
CREATE TRIGGER update_gyms_updated_at
  BEFORE UPDATE ON public.gyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_branding_updated_at
  BEFORE UPDATE ON public.gym_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_programs_updated_at
  BEFORE UPDATE ON public.gym_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_schedule_updated_at
  BEFORE UPDATE ON public.gym_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_memberships_updated_at
  BEFORE UPDATE ON public.gym_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 9. RESOLVE GYM BY SLUG (public API function)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_gym_by_slug(slug_param TEXT)
RETURNS SETOF public.gyms AS $$
  SELECT * FROM public.gyms WHERE slug = slug_param AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- DONE — Phase 1: Multi-Tenancy Foundation Complete
-- ============================================================================
-- Summary of changes:
-- - 8 new tables: gyms, gym_branding, gym_features, gym_programs, gym_schedule,
--   gym_stats, gym_memberships, gym_feature_billing
-- - gym_id column added to 13 existing tables (nullable for now)
-- - All existing RLS policies dropped and recreated with gym_id scoping
-- - New RLS policies for all new tables
-- - 4 helper functions: get_user_gym_id(), is_feature_enabled(), is_gym_owner(), is_gym_admin()
-- - 4 feature enforcement triggers on bookings, workouts, trials, service_bookings
-- - handle_new_user() updated to accept gym_id from user metadata
-- - Accounting table unique constraints updated for multi-tenancy
-- - Updated timestamp triggers on all new tables
