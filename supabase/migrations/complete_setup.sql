-- Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Create stripe_customers table to track Stripe customer IDs for users
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

-- Enable Row Level Security
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own Stripe customer data"
  ON stripe_customers FOR SELECT
  USING (auth.uid() = user_id);
-- Create bookings table to track class bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  class_day TEXT NOT NULL,
  class_time TEXT NOT NULL,
  class_name TEXT NOT NULL,
  coach_name TEXT,
  booking_type TEXT CHECK (booking_type IN ('day-pass', 'trial', 'membership')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  class_date TIMESTAMPTZ,
  payment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_class_date ON bookings(class_date);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);
-- Create payments table to track payment transactions
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- amount in pence/cents
  currency TEXT DEFAULT 'gbp',
  status TEXT CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled')) NOT NULL,
  payment_method_id TEXT,
  payment_type TEXT CHECK (payment_type IN ('day-pass', 'trial-setup', 'membership')) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);
-- Create trial_memberships table to track free trial memberships
CREATE TABLE trial_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_setup_intent_id TEXT UNIQUE,
  stripe_payment_method_id TEXT,
  trial_start_date TIMESTAMPTZ DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT CHECK (status IN ('active', 'converted', 'cancelled', 'expired')) DEFAULT 'active',
  auto_convert_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_trial_memberships_user_id ON trial_memberships(user_id);
CREATE INDEX idx_trial_memberships_status ON trial_memberships(status);
CREATE INDEX idx_trial_memberships_end_date ON trial_memberships(trial_end_date);

-- Enable Row Level Security
ALTER TABLE trial_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own trial membership"
  ON trial_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial membership"
  ON trial_memberships FOR UPDATE
  USING (auth.uid() = user_id);
-- Add Stripe-related columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

-- Create index for Stripe customer ID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
-- Add role column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('member', 'coach', 'admin')) DEFAULT 'member';

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add coach_id column to link profiles to coach records
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS coach_id TEXT;

-- Create index for coach_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_coach_id ON profiles(coach_id);

-- Update RLS policies to allow coaches and admins to view all profiles (for scheduling/management)
CREATE POLICY "Coaches can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('coach', 'admin')
    )
  );

-- Update trigger function to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create workouts table to store daily programming
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  workout_type TEXT CHECK (workout_type IN ('amrap', 'fortime', 'emom', 'strength', 'endurance')) NOT NULL,
  duration TEXT,
  rounds INTEGER,

  -- Structured workout sections
  warmup JSONB,           -- Array of strings
  strength JSONB,         -- Array of strings
  metcon JSONB,           -- Array of strings
  cooldown JSONB,         -- Array of strings
  movements TEXT[],       -- Main movements list for backward compatibility

  -- Metadata
  coach_notes TEXT,
  scaling_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status for draft/published
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'published'
);

-- Create indexes
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_workouts_status ON workouts(status);
CREATE INDEX idx_workouts_created_by ON workouts(created_by);

-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view published workouts
CREATE POLICY "Anyone can view published workouts"
  ON workouts FOR SELECT
  USING (status = 'published');

-- Coaches and admins can create workouts
CREATE POLICY "Coaches and admins can create workouts"
  ON workouts FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('coach', 'admin')
    )
  );

-- Coaches can update their own workouts, admins can update all
CREATE POLICY "Coaches can update own workouts, admins can update all"
  ON workouts FOR UPDATE
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Only admins can delete workouts
CREATE POLICY "Only admins can delete workouts"
  ON workouts FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER workout_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_updated_at();-- This migration provides SQL to manually create coach accounts
-- These INSERT statements should be run AFTER creating the auth.users via Supabase Dashboard or API

-- Note: Coach accounts must be created via Supabase Auth API first
-- Then update their profiles with this script

-- STEP 1: Create auth accounts in Supabase Dashboard
-- Go to: Authentication → Users → Add User
-- Create accounts with these emails:
--   - your-admin-email@example.com (your admin account)
--   - dan@crossfitcomet.com (Head Coach)
--   - lizzie@crossfitcomet.com
--   - lewis@crossfitcomet.com
--   - sam@crossfitcomet.com
--   - george@crossfitcomet.com
--   - thea@crossfitcomet.com

-- STEP 2: After creating auth users, run these updates to set roles and coach_ids
-- Update these SQL statements with your actual admin email

-- Set admin user (REPLACE WITH YOUR EMAIL)
-- UPDATE profiles SET role = 'admin', full_name = 'Your Name' WHERE email = 'your-admin-email@example.com';

-- Update coach profiles
/*
UPDATE profiles
SET role = 'coach', coach_id = 'dan', full_name = 'Dan'
WHERE email = 'dan@crossfitcomet.com';

UPDATE profiles
SET role = 'coach', coach_id = 'lizzie', full_name = 'Lizzie'
WHERE email = 'lizzie@crossfitcomet.com';

UPDATE profiles
SET role = 'coach', coach_id = 'lewis', full_name = 'Lewis'
WHERE email = 'lewis@crossfitcomet.com';

UPDATE profiles
SET role = 'coach', coach_id = 'sam', full_name = 'Sam'
WHERE email = 'sam@crossfitcomet.com';

UPDATE profiles
SET role = 'coach', coach_id = 'george', full_name = 'George'
WHERE email = 'george@crossfitcomet.com';

UPDATE profiles
SET role = 'coach', coach_id = 'thea', full_name = 'Thea'
WHERE email = 'thea@crossfitcomet.com';
*/

-- Create a view to easily see coach accounts
CREATE OR REPLACE VIEW coach_accounts AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.coach_id,
  CASE
    WHEN p.coach_id = 'dan' THEN 'Head Coach'
    WHEN p.coach_id = 'lizzie' THEN 'Senior Coach'
    WHEN p.coach_id = 'lewis' THEN 'Performance Coach'
    WHEN p.coach_id IN ('sam', 'george', 'thea') THEN 'CrossFit Coach'
    ELSE NULL
  END as coach_title,
  p.created_at
FROM profiles p
WHERE p.role IN ('coach', 'admin')
ORDER BY
  CASE p.role
    WHEN 'admin' THEN 1
    WHEN 'coach' THEN 2
    ELSE 3
  END,
  p.coach_id;

-- Grant access to view for authenticated users
GRANT SELECT ON coach_accounts TO authenticated;
-- Enable admins to manage users and assign roles
-- This migration adds RLS policies and functions for user management

-- Drop existing restrictive policies that might block admin operations
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;


-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their own role
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update any profile (including roles)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to insert new profiles (for user creation)
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a function to invite a new user (admin only)
-- This returns the necessary info to create an auth user via API
CREATE OR REPLACE FUNCTION invite_user(
  user_email TEXT,
  user_name TEXT,
  user_role TEXT DEFAULT 'member',
  user_coach_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_role TEXT;
  result JSON;
BEGIN
  -- Check if caller is admin
  SELECT role INTO calling_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can invite users';
  END IF;

  -- Validate role
  IF user_role NOT IN ('member', 'coach', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', user_role;
  END IF;

  -- Return user details for client-side auth creation
  result := json_build_object(
    'email', user_email,
    'name', user_name,
    'role', user_role,
    'coach_id', user_coach_id
  );

  RETURN result;
END;
$$;

-- Create a function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id UUID,
  new_role TEXT,
  new_coach_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_role TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO calling_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Validate role
  IF new_role NOT IN ('member', 'coach', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Update the user's role and coach_id
  UPDATE profiles
  SET
    role = new_role,
    coach_id = new_coach_id,
    updated_at = NOW()
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$;

-- Add updated_at column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION invite_user TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;
-- Allow admins to delete profiles
-- This will enable user deletion from the admin panel

-- Add DELETE policy for admins
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a function to delete a user (admin only)
-- This function will delete both the auth user and profile
-- Note: This requires admin privileges to delete from auth.users
CREATE OR REPLACE FUNCTION delete_user(
  target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_role TEXT;
  target_user_email TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO calling_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Prevent admins from deleting themselves
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  -- Get target user email for logging
  SELECT email INTO target_user_email
  FROM profiles
  WHERE id = target_user_id;

  IF target_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Delete from profiles table first (will be done automatically by CASCADE, but being explicit)
  DELETE FROM profiles WHERE id = target_user_id;

  -- Note: Deleting from auth.users requires superuser or service role
  -- The CASCADE will handle the profile deletion
  -- For full auth user deletion, you'll need to use the Supabase Admin API
  -- from a server-side endpoint with the service role key

  RETURN TRUE;
END;
$$;

-- Grant execute permissions on function
GRANT EXECUTE ON FUNCTION delete_user TO authenticated;
-- Create CrossFit movements table
-- This table stores a comprehensive library of CrossFit movements with muscle group tracking,
-- equipment requirements, difficulty levels, and scaling options for workout programming.

CREATE TABLE IF NOT EXISTS crossfit_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('gymnastic', 'weightlifting', 'metabolic', 'skill')),
  primary_muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  secondary_muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  description TEXT,
  scaling_options TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_crossfit_movements_category ON crossfit_movements(category);
CREATE INDEX idx_crossfit_movements_difficulty ON crossfit_movements(difficulty);
CREATE INDEX idx_crossfit_movements_primary_muscle_groups ON crossfit_movements USING GIN(primary_muscle_groups);
CREATE INDEX idx_crossfit_movements_secondary_muscle_groups ON crossfit_movements USING GIN(secondary_muscle_groups);

-- Enable Row Level Security
ALTER TABLE crossfit_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read movements (needed for workout creation)
CREATE POLICY "Allow authenticated users to read movements"
  ON crossfit_movements FOR SELECT
  TO authenticated
  USING (true);

-- Only coaches and admins can insert movements
CREATE POLICY "Allow coaches and admins to insert movements"
  ON crossfit_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Only coaches and admins can update movements
CREATE POLICY "Allow coaches and admins to update movements"
  ON crossfit_movements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Only admins can delete movements
CREATE POLICY "Allow admins to delete movements"
  ON crossfit_movements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_crossfit_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crossfit_movements_updated_at
  BEFORE UPDATE ON crossfit_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_crossfit_movements_updated_at();

-- Seed with comprehensive CrossFit movements
INSERT INTO crossfit_movements (name, category, primary_muscle_groups, secondary_muscle_groups, equipment, difficulty, description, scaling_options) VALUES
  -- Gymnastic Movements (27)
  ('Pull-Up', 'gymnastic', ARRAY['back'], ARRAY['arms'], ARRAY['pull-up bar'], 'intermediate', 'Dead hang pull-up, chin over bar', ARRAY['Banded pull-up', 'Ring row', 'Jumping pull-up']),
  ('Chest-to-Bar Pull-Up', 'gymnastic', ARRAY['back'], ARRAY['arms', 'shoulders'], ARRAY['pull-up bar'], 'advanced', 'Pull-up with chest touching bar', ARRAY['Regular pull-up', 'Banded CTB', 'Ring row']),
  ('Bar Muscle-Up', 'gymnastic', ARRAY['back', 'chest'], ARRAY['arms', 'shoulders'], ARRAY['pull-up bar'], 'advanced', 'Explosive pull-up transition to bar dip', ARRAY['Banded muscle-up', 'Jumping muscle-up', 'Pull-up + dip']),
  ('Ring Muscle-Up', 'gymnastic', ARRAY['back', 'chest'], ARRAY['arms', 'shoulders'], ARRAY['gymnastic rings'], 'advanced', 'Explosive pull transition to ring dip', ARRAY['Banded ring muscle-up', 'Ring row + ring dip', 'Bar muscle-up']),
  ('Toes-to-Bar', 'gymnastic', ARRAY['core'], ARRAY['shoulders'], ARRAY['pull-up bar'], 'intermediate', 'Hang from bar, bring toes to touch bar', ARRAY['Knees-to-elbow', 'Knee raise', 'Sit-up']),
  ('Knees-to-Elbow', 'gymnastic', ARRAY['core'], ARRAY['shoulders'], ARRAY['pull-up bar'], 'beginner', 'Hang from bar, bring knees to elbows', ARRAY['Knee raise', 'Sit-up', 'Plank hold']),
  ('Ring Dip', 'gymnastic', ARRAY['chest', 'arms'], ARRAY['shoulders'], ARRAY['gymnastic rings'], 'intermediate', 'Dip on rings, arms fully extended at top', ARRAY['Banded ring dip', 'Box dip', 'Push-up']),
  ('Push-Up', 'gymnastic', ARRAY['chest', 'arms'], ARRAY['shoulders', 'core'], ARRAY['bodyweight'], 'beginner', 'Standard push-up, chest to ground', ARRAY['Knee push-up', 'Incline push-up', 'Hand-release push-up']),
  ('Handstand Push-Up', 'gymnastic', ARRAY['shoulders'], ARRAY['arms', 'core'], ARRAY['wall'], 'advanced', 'Inverted push-up against wall', ARRAY['Pike push-up', 'Box HSPU', 'Dumbbell press']),
  ('Strict Handstand Push-Up', 'gymnastic', ARRAY['shoulders'], ARRAY['arms', 'core'], ARRAY['wall'], 'advanced', 'Strict HSPU, no kipping', ARRAY['Kipping HSPU', 'Pike push-up', 'Push press']),
  ('Pistol Squat', 'gymnastic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'advanced', 'Single-leg squat to full depth', ARRAY['Box pistol', 'Assisted pistol', 'Goblet squat']),
  ('Rope Climb', 'gymnastic', ARRAY['back', 'arms'], ARRAY['core', 'legs'], ARRAY['climbing rope'], 'intermediate', 'Climb 15ft rope to top', ARRAY['Lying rope pull', 'Towel pull-up', 'Pull-up']),
  ('Burpee', 'gymnastic', ARRAY['chest', 'legs'], ARRAY['core', 'shoulders'], ARRAY['bodyweight'], 'beginner', 'Chest to ground, jump with hands overhead', ARRAY['Step-back burpee', 'No push-up burpee', 'Elevated burpee']),
  ('Box Jump', 'gymnastic', ARRAY['legs'], ARRAY['core'], ARRAY['plyo box'], 'beginner', 'Jump onto box, full hip extension', ARRAY['Step-up', 'Reduced height', 'Box step-over']),
  ('Wall Walk', 'gymnastic', ARRAY['shoulders'], ARRAY['core', 'chest'], ARRAY['wall'], 'intermediate', 'Walk hands and feet up wall to handstand', ARRAY['Partial wall walk', 'Inchworm', 'Plank hold']),
  ('Air Squat', 'gymnastic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'beginner', 'Full depth squat, hips below knees', ARRAY['Box squat', 'Partial squat', 'Chair squat']),
  ('Lunge', 'gymnastic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'beginner', 'Walking or reverse lunge', ARRAY['Box step-up', 'Reduced range', 'Air squat']),
  ('Sit-Up', 'gymnastic', ARRAY['core'], ARRAY[]::TEXT[], ARRAY['ab-mat'], 'beginner', 'Abmat sit-up, shoulders touch ground', ARRAY['Anchored sit-up', 'Crunch', 'Dead bug']),
  ('V-Up', 'gymnastic', ARRAY['core'], ARRAY[]::TEXT[], ARRAY['bodyweight'], 'intermediate', 'Lift legs and torso simultaneously', ARRAY['Tuck-up', 'Sit-up', 'Hollow rock']),
  ('Hollow Rock', 'gymnastic', ARRAY['core'], ARRAY[]::TEXT[], ARRAY['bodyweight'], 'intermediate', 'Rock in hollow body position', ARRAY['Hollow hold', 'Dead bug', 'Plank']),
  ('L-Sit', 'gymnastic', ARRAY['core'], ARRAY['shoulders', 'arms'], ARRAY['parallettes', 'floor'], 'advanced', 'Hold seated position with legs extended', ARRAY['Tuck sit', 'Single leg L-sit', 'Plank']),
  ('Handstand Hold', 'gymnastic', ARRAY['shoulders'], ARRAY['core', 'arms'], ARRAY['wall'], 'intermediate', 'Hold handstand against wall', ARRAY['Plank hold', 'Pike hold', 'Wall walk partial']),
  ('Ring Row', 'gymnastic', ARRAY['back'], ARRAY['arms'], ARRAY['gymnastic rings'], 'beginner', 'Horizontal row on rings', ARRAY['Elevated ring row', 'Bent knee row', 'Band pull-apart']),
  ('Dip', 'gymnastic', ARRAY['chest', 'arms'], ARRAY['shoulders'], ARRAY['dip bars', 'rings'], 'intermediate', 'Parallel bar dip, full range', ARRAY['Banded dip', 'Box dip', 'Push-up']),
  ('Kipping Pull-Up', 'gymnastic', ARRAY['back'], ARRAY['arms', 'core'], ARRAY['pull-up bar'], 'intermediate', 'Pull-up using hip drive and kip', ARRAY['Strict pull-up', 'Banded kipping pull-up', 'Ring row']),
  ('Butterfly Pull-Up', 'gymnastic', ARRAY['back'], ARRAY['arms', 'shoulders'], ARRAY['pull-up bar'], 'advanced', 'Circular kipping pull-up for speed', ARRAY['Kipping pull-up', 'Strict pull-up', 'Ring row']),
  ('Hand-Release Push-Up', 'gymnastic', ARRAY['chest', 'arms'], ARRAY['shoulders'], ARRAY['bodyweight'], 'beginner', 'Push-up with hands lifted off ground at bottom', ARRAY['Regular push-up', 'Knee push-up', 'Incline push-up']),

  -- Weightlifting Movements (34)
  ('Snatch', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['barbell'], 'advanced', 'Full squat snatch from floor to overhead', ARRAY['Power snatch', 'Hang snatch', 'Overhead squat']),
  ('Power Snatch', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['barbell'], 'advanced', 'Snatch caught above parallel', ARRAY['Hang power snatch', 'Muscle snatch', 'Dumbbell snatch']),
  ('Hang Snatch', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['barbell'], 'advanced', 'Snatch from hang position (above knee)', ARRAY['Hang power snatch', 'Power snatch', 'Dumbbell snatch']),
  ('Hang Power Snatch', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['back'], ARRAY['barbell'], 'intermediate', 'Power snatch from hang above knee', ARRAY['Dumbbell snatch', 'Kettlebell swing', 'Power clean']),
  ('Clean', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders', 'core'], ARRAY['barbell'], 'advanced', 'Full squat clean from floor to shoulders', ARRAY['Power clean', 'Hang clean', 'Front squat']),
  ('Power Clean', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders', 'core'], ARRAY['barbell'], 'intermediate', 'Clean caught above parallel', ARRAY['Hang power clean', 'Dumbbell clean', 'Deadlift + front squat']),
  ('Hang Clean', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders', 'core'], ARRAY['barbell'], 'advanced', 'Clean from hang position', ARRAY['Hang power clean', 'Power clean', 'Dumbbell clean']),
  ('Hang Power Clean', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders'], ARRAY['barbell'], 'intermediate', 'Power clean from hang above knee', ARRAY['Dumbbell clean', 'Kettlebell swing', 'Deadlift']),
  ('Clean & Jerk', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['barbell'], 'advanced', 'Clean to shoulders, then jerk overhead', ARRAY['Power clean + push press', 'Thruster', 'Front squat + press']),
  ('Split Jerk', 'weightlifting', ARRAY['shoulders', 'legs'], ARRAY['core'], ARRAY['barbell'], 'advanced', 'Jerk with split stance', ARRAY['Push jerk', 'Push press', 'Shoulder press']),
  ('Push Jerk', 'weightlifting', ARRAY['shoulders', 'legs'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Jerk with small dip and drive', ARRAY['Push press', 'Shoulder press', 'Thruster']),
  ('Thruster', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core'], ARRAY['barbell', 'dumbbell'], 'intermediate', 'Front squat to overhead press in one motion', ARRAY['Front squat + push press', 'Goblet squat + press', 'Reduced weight']),
  ('Front Squat', 'weightlifting', ARRAY['legs'], ARRAY['core', 'back'], ARRAY['barbell'], 'intermediate', 'Squat with bar on front rack', ARRAY['Goblet squat', 'Reduced weight', 'Box squat']),
  ('Back Squat', 'weightlifting', ARRAY['legs'], ARRAY['core', 'back'], ARRAY['barbell'], 'beginner', 'Squat with bar on back', ARRAY['Goblet squat', 'Air squat', 'Box squat']),
  ('Overhead Squat', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core', 'back'], ARRAY['barbell'], 'advanced', 'Squat with bar overhead', ARRAY['PVC overhead squat', 'Goblet squat', 'Front squat']),
  ('Deadlift', 'weightlifting', ARRAY['back', 'legs'], ARRAY['core'], ARRAY['barbell'], 'beginner', 'Lift bar from ground to standing', ARRAY['Reduced weight', 'Rack pull', 'Romanian deadlift']),
  ('Sumo Deadlift', 'weightlifting', ARRAY['legs', 'back'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Wide stance deadlift', ARRAY['Conventional deadlift', 'Reduced weight', 'Kettlebell deadlift']),
  ('Romanian Deadlift', 'weightlifting', ARRAY['back', 'legs'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Deadlift with slight knee bend, focus on hamstrings', ARRAY['Dumbbell RDL', 'Reduced weight', 'Good morning']),
  ('Shoulder Press', 'weightlifting', ARRAY['shoulders'], ARRAY['arms', 'core'], ARRAY['barbell'], 'beginner', 'Strict overhead press from shoulders', ARRAY['Dumbbell press', 'Reduced weight', 'Push press']),
  ('Push Press', 'weightlifting', ARRAY['shoulders', 'legs'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Overhead press with leg drive', ARRAY['Shoulder press', 'Dumbbell push press', 'Reduced weight']),
  ('Bench Press', 'weightlifting', ARRAY['chest'], ARRAY['arms', 'shoulders'], ARRAY['barbell', 'bench'], 'beginner', 'Horizontal press on bench', ARRAY['Dumbbell bench press', 'Push-up', 'Reduced weight']),
  ('Overhead Walking Lunge', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core'], ARRAY['barbell', 'dumbbell', 'plate'], 'intermediate', 'Walking lunge with weight overhead', ARRAY['Regular lunge', 'Goblet lunge', 'Walking lunge']),
  ('Front Rack Lunge', 'weightlifting', ARRAY['legs'], ARRAY['core'], ARRAY['barbell', 'dumbbell'], 'intermediate', 'Lunge with weight in front rack', ARRAY['Goblet lunge', 'Walking lunge', 'Air lunge']),
  ('Goblet Squat', 'weightlifting', ARRAY['legs'], ARRAY['core'], ARRAY['dumbbell', 'kettlebell'], 'beginner', 'Squat holding weight at chest', ARRAY['Air squat', 'Reduced weight', 'Box squat']),
  ('Dumbbell Snatch', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core', 'back'], ARRAY['dumbbell'], 'intermediate', 'Single-arm snatch with dumbbell', ARRAY['Dumbbell swing', 'Kettlebell swing', 'Reduced weight']),
  ('Dumbbell Clean', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders'], ARRAY['dumbbell'], 'beginner', 'Clean dumbbells to shoulders', ARRAY['Hang dumbbell clean', 'Reduced weight', 'Kettlebell swing']),
  ('Devil Press', 'weightlifting', ARRAY['chest', 'shoulders', 'legs'], ARRAY['core', 'back'], ARRAY['dumbbell'], 'advanced', 'Burpee + double dumbbell snatch', ARRAY['Single dumbbell snatch', 'Dumbbell thruster', 'Burpee']),
  ('Turkish Get-Up', 'weightlifting', ARRAY['shoulders', 'core'], ARRAY['legs'], ARRAY['kettlebell', 'dumbbell'], 'intermediate', 'Complex movement from lying to standing with weight overhead', ARRAY['Partial TGU', 'Reduced weight', 'Windmill']),
  ('Kettlebell Swing', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders', 'core'], ARRAY['kettlebell'], 'beginner', 'Hip hinge swing to eye level', ARRAY['Russian swing', 'Reduced weight', 'Dumbbell swing']),
  ('American Kettlebell Swing', 'weightlifting', ARRAY['legs', 'back', 'shoulders'], ARRAY['core'], ARRAY['kettlebell'], 'intermediate', 'Hip hinge swing overhead', ARRAY['Russian swing', 'Reduced weight', 'Dumbbell swing']),
  ('Sumo Deadlift High Pull', 'weightlifting', ARRAY['legs', 'back', 'shoulders'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Wide stance deadlift with high pull', ARRAY['Upright row', 'Deadlift', 'Hang power clean']),
  ('Barbell Row', 'weightlifting', ARRAY['back'], ARRAY['arms'], ARRAY['barbell'], 'intermediate', 'Bent over barbell row', ARRAY['Dumbbell row', 'Ring row', 'Reduced weight']),
  ('Dumbbell Row', 'weightlifting', ARRAY['back'], ARRAY['arms'], ARRAY['dumbbell', 'bench'], 'beginner', 'Single-arm row with dumbbell', ARRAY['Ring row', 'Reduced weight', 'Band row']),
  ('Farmers Carry', 'weightlifting', ARRAY['core', 'back'], ARRAY['legs', 'arms'], ARRAY['dumbbell', 'kettlebell'], 'beginner', 'Walk carrying heavy weights at sides', ARRAY['Reduced weight', 'Shorter distance', 'Single-arm carry']),

  -- Metabolic Conditioning (10)
  ('Row (Calories)', 'metabolic', ARRAY['back', 'legs'], ARRAY['core', 'arms'], ARRAY['rowing machine'], 'beginner', 'Rowing machine for calories', ARRAY['Reduced calories', 'Bike calories', 'Ski calories']),
  ('Row (Meters)', 'metabolic', ARRAY['back', 'legs'], ARRAY['core', 'arms'], ARRAY['rowing machine'], 'beginner', 'Rowing machine for distance', ARRAY['Reduced meters', 'Bike', 'Ski']),
  ('Assault Bike (Calories)', 'metabolic', ARRAY['legs'], ARRAY['arms', 'core'], ARRAY['assault bike'], 'beginner', 'Air bike for calories', ARRAY['Reduced calories', 'Row calories', 'Ski calories']),
  ('Run (400m)', 'metabolic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'beginner', 'Run 400 meters', ARRAY['200m run', 'Row', 'Bike']),
  ('Run (800m)', 'metabolic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'intermediate', 'Run 800 meters', ARRAY['400m run', 'Row', 'Bike']),
  ('Run (1 Mile)', 'metabolic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'intermediate', 'Run 1 mile', ARRAY['800m run', '2000m row', 'Bike']),
  ('Double-Under', 'metabolic', ARRAY['legs'], ARRAY['shoulders', 'core'], ARRAY['jump rope'], 'intermediate', 'Jump rope with double spin per jump', ARRAY['Single-under', 'Penguin taps', 'Jumping jacks']),
  ('Single-Under', 'metabolic', ARRAY['legs'], ARRAY['shoulders'], ARRAY['jump rope'], 'beginner', 'Jump rope with single spin per jump', ARRAY['Imaginary jump rope', 'Step-overs', 'Jumping jacks']),
  ('Ski Erg (Calories)', 'metabolic', ARRAY['back', 'core'], ARRAY['legs', 'shoulders'], ARRAY['ski erg'], 'beginner', 'Ski erg machine for calories', ARRAY['Reduced calories', 'Row calories', 'Bike calories']),
  ('Ski Erg (Meters)', 'metabolic', ARRAY['back', 'core'], ARRAY['legs', 'shoulders'], ARRAY['ski erg'], 'beginner', 'Ski erg machine for distance', ARRAY['Reduced meters', 'Row meters', 'Bike']),

  -- Object Manipulation (5)
  ('Wall Ball', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core'], ARRAY['medicine ball'], 'beginner', 'Squat and throw ball to target', ARRAY['Reduced weight', 'Front squat + press', 'Air squat + press']),
  ('Medicine Ball Clean', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core', 'back'], ARRAY['medicine ball'], 'beginner', 'Clean medicine ball to shoulders', ARRAY['Reduced weight', 'Dumbbell clean', 'Wall ball']),
  ('Slam Ball', 'weightlifting', ARRAY['core', 'shoulders'], ARRAY['back', 'legs'], ARRAY['slam ball'], 'beginner', 'Overhead slam to ground', ARRAY['Reduced weight', 'Medicine ball slam', 'Dumbbell swing']),
  ('Sandbag Carry', 'weightlifting', ARRAY['back', 'legs'], ARRAY['core', 'shoulders'], ARRAY['sandbag'], 'intermediate', 'Carry sandbag on shoulder or bear hug', ARRAY['Reduced weight', 'Farmers carry', 'Shorter distance']),
  ('D-Ball Over Shoulder', 'weightlifting', ARRAY['legs', 'back'], ARRAY['core', 'shoulders'], ARRAY['d-ball'], 'intermediate', 'Lift and throw ball over shoulder', ARRAY['Reduced weight', 'Ball to shoulder only', 'Sandbag carry']),

  -- Skill/Accessory (6)
  ('Plank Hold', 'skill', ARRAY['core'], ARRAY['shoulders'], ARRAY['bodyweight'], 'beginner', 'Hold plank position', ARRAY['Knee plank', 'Reduced time', 'Dead bug']),
  ('Superman Hold', 'skill', ARRAY['back', 'core'], ARRAY[]::TEXT[], ARRAY['bodyweight'], 'beginner', 'Hold superman position on ground', ARRAY['Reduced time', 'Back extension', 'Bird dog']),
  ('GHD Sit-Up', 'skill', ARRAY['core'], ARRAY['back'], ARRAY['GHD machine'], 'intermediate', 'Full range sit-up on GHD', ARRAY['Abmat sit-up', 'Partial GHD', 'Sit-up']),
  ('GHD Hip Extension', 'skill', ARRAY['back', 'legs'], ARRAY['core'], ARRAY['GHD machine'], 'intermediate', 'Hip extension on GHD', ARRAY['Back extension', 'Superman hold', 'Good morning']),
  ('Good Morning', 'skill', ARRAY['back', 'legs'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Hip hinge with bar on back', ARRAY['Reduced weight', 'Romanian deadlift', 'Superman hold']),
  ('Banded Pull-Apart', 'skill', ARRAY['shoulders', 'back'], ARRAY[]::TEXT[], ARRAY['resistance band'], 'beginner', 'Pull resistance band apart at chest height', ARRAY['Lighter band', 'Reduced reps', 'Arm circles']);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'CrossFit movements table created successfully with % movements', (SELECT COUNT(*) FROM crossfit_movements);
END $$;
-- Add subcategory and recommended_sections to crossfit_movements table
-- This migration adds movement subcategories (olympic, powerlifting, calisthenics, etc.)
-- and recommended sections (warmup, strength, metcon, cooldown) for better movement organization

-- Add subcategory column
ALTER TABLE crossfit_movements
ADD COLUMN IF NOT EXISTS subcategory TEXT CHECK (subcategory IN ('olympic', 'powerlifting', 'calisthenics', 'cardio', 'accessory'));

-- Add recommended_sections column
ALTER TABLE crossfit_movements
ADD COLUMN IF NOT EXISTS recommended_sections TEXT[] NOT NULL DEFAULT '{}';

-- Create index for subcategory
CREATE INDEX IF NOT EXISTS idx_crossfit_movements_subcategory ON crossfit_movements(subcategory);

-- Create index for recommended_sections
CREATE INDEX IF NOT EXISTS idx_crossfit_movements_recommended_sections ON crossfit_movements USING GIN(recommended_sections);

-- Update existing movements with subcategories and recommended sections

-- Olympic Lifts
UPDATE crossfit_movements SET
  subcategory = 'olympic',
  recommended_sections = ARRAY['strength', 'metcon']
WHERE name IN ('Snatch', 'Power Snatch', 'Hang Snatch', 'Hang Power Snatch', 'Clean', 'Power Clean', 'Hang Clean', 'Hang Power Clean', 'Clean & Jerk', 'Split Jerk', 'Push Jerk');

-- Powerlifting
UPDATE crossfit_movements SET
  subcategory = 'powerlifting',
  recommended_sections = ARRAY['strength']
WHERE name IN ('Deadlift', 'Sumo Deadlift', 'Back Squat', 'Front Squat', 'Bench Press', 'Shoulder Press', 'Push Press');

-- Calisthenics/Gymnastic
UPDATE crossfit_movements SET
  subcategory = 'calisthenics',
  recommended_sections = ARRAY['warmup', 'metcon', 'cooldown']
WHERE category = 'gymnastic' AND name IN ('Pull-Up', 'Push-Up', 'Air Squat', 'Lunge', 'Sit-Up', 'Burpee', 'Box Jump', 'Ring Row', 'Handstand Hold', 'Plank Hold');

-- Advanced Gymnastics for MetCon/Strength
UPDATE crossfit_movements SET
  subcategory = 'calisthenics',
  recommended_sections = ARRAY['strength', 'metcon']
WHERE category = 'gymnastic' AND name IN ('Chest-to-Bar Pull-Up', 'Bar Muscle-Up', 'Ring Muscle-Up', 'Handstand Push-Up', 'Strict Handstand Push-Up', 'Ring Dip', 'Dip', 'Rope Climb', 'Pistol Squat', 'Kipping Pull-Up', 'Butterfly Pull-Up');

-- Core/Skill Work for Warmup/Cooldown
UPDATE crossfit_movements SET
  subcategory = 'calisthenics',
  recommended_sections = ARRAY['warmup', 'cooldown']
WHERE name IN ('Toes-to-Bar', 'Knees-to-Elbow', 'V-Up', 'Hollow Rock', 'L-Sit', 'Wall Walk', 'Hand-Release Push-Up', 'Superman Hold', 'Good Morning');

-- Cardio/Metabolic
UPDATE crossfit_movements SET
  subcategory = 'cardio',
  recommended_sections = ARRAY['warmup', 'metcon', 'cooldown']
WHERE category = 'metabolic';

-- Accessory movements
UPDATE crossfit_movements SET
  subcategory = 'accessory',
  recommended_sections = ARRAY['warmup', 'strength', 'cooldown']
WHERE name IN ('Farmers Carry', 'Turkish Get-Up', 'Romanian Deadlift', 'Barbell Row', 'Dumbbell Row', 'GHD Sit-Up', 'GHD Hip Extension', 'Banded Pull-Apart', 'Sandbag Carry');

-- Weighted movements for Strength/MetCon
UPDATE crossfit_movements SET
  subcategory = 'powerlifting',
  recommended_sections = ARRAY['strength', 'metcon']
WHERE subcategory IS NULL AND category = 'weightlifting' AND name IN ('Thruster', 'Wall Ball', 'Overhead Squat', 'Overhead Walking Lunge', 'Front Rack Lunge', 'Goblet Squat', 'Sumo Deadlift High Pull', 'Kettlebell Swing', 'American Kettlebell Swing', 'Dumbbell Snatch', 'Dumbbell Clean', 'Devil Press', 'Medicine Ball Clean', 'Slam Ball', 'D-Ball Over Shoulder');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Movement subcategories and recommended sections added successfully';
END $$;
-- Fix workouts table to auto-set created_by on insert
-- This ensures created_by is always set to the authenticated user

-- Create function to set created_by on insert
CREATE OR REPLACE FUNCTION set_workout_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-set created_by
DROP TRIGGER IF EXISTS workout_set_created_by ON workouts;
CREATE TRIGGER workout_set_created_by
  BEFORE INSERT ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION set_workout_created_by();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Workout created_by trigger added successfully';
END $$;
-- Add bodybuilding subcategory to crossfit_movements
-- This distinguishes between:
-- - Olympic: Snatch, Clean, Jerk variations
-- - Powerlifting: Squat, Bench, Deadlift and their variations
-- - Bodybuilding: Isolation and hypertrophy-focused accessory movements

-- First, drop the existing constraint and add the new one with bodybuilding
ALTER TABLE crossfit_movements
DROP CONSTRAINT IF EXISTS crossfit_movements_subcategory_check;

ALTER TABLE crossfit_movements
ADD CONSTRAINT crossfit_movements_subcategory_check
CHECK (subcategory IN ('olympic', 'powerlifting', 'bodybuilding', 'calisthenics', 'cardio', 'accessory'));

-- Recategorize movements properly

-- Olympic Lifts (snatch, clean, jerk and their variations)
UPDATE crossfit_movements SET
  subcategory = 'olympic',
  recommended_sections = ARRAY['strength', 'metcon']
WHERE name IN (
  'Snatch', 'Power Snatch', 'Hang Snatch', 'Hang Power Snatch', 'Squat Snatch',
  'Clean', 'Power Clean', 'Hang Clean', 'Hang Power Clean', 'Squat Clean',
  'Clean & Jerk', 'Split Jerk', 'Push Jerk', 'Jerk',
  'Muscle Snatch', 'Muscle Clean'
);

-- Powerlifting (squat, bench, deadlift - the big 3 and close variations)
UPDATE crossfit_movements SET
  subcategory = 'powerlifting',
  recommended_sections = ARRAY['strength']
WHERE name IN (
  'Back Squat', 'Front Squat', 'Overhead Squat', 'Box Squat',
  'Deadlift', 'Sumo Deadlift', 'Deficit Deadlift', 'Romanian Deadlift',
  'Bench Press', 'Close Grip Bench Press', 'Floor Press',
  'Shoulder Press', 'Push Press', 'Strict Press'
);

-- Bodybuilding (isolation movements, hypertrophy-focused, accessory work)
UPDATE crossfit_movements SET
  subcategory = 'bodybuilding',
  recommended_sections = ARRAY['warmup', 'strength', 'cooldown']
WHERE name IN (
  'Barbell Row', 'Bent Over Row', 'Pendlay Row',
  'Dumbbell Row', 'Single Arm Dumbbell Row',
  'Dumbbell Curl', 'Barbell Curl', 'Hammer Curl',
  'Tricep Extension', 'Skull Crusher', 'Tricep Dip',
  'Lateral Raise', 'Front Raise', 'Rear Delt Fly',
  'Face Pull', 'Banded Pull-Apart',
  'Leg Curl', 'Leg Extension',
  'Calf Raise', 'Hip Thrust',
  'Dumbbell Bench Press', 'Dumbbell Shoulder Press',
  'Incline Dumbbell Press', 'Decline Bench Press',
  'Preacher Curl', 'Concentration Curl',
  'Cable Crossover', 'Pec Fly'
);

-- CrossFit-specific weighted movements (for metcons, not traditional lifting)
UPDATE crossfit_movements SET
  subcategory = 'accessory',
  recommended_sections = ARRAY['strength', 'metcon']
WHERE subcategory IS NULL AND name IN (
  'Thruster', 'Wall Ball', 'Cluster',
  'Overhead Walking Lunge', 'Front Rack Lunge', 'Goblet Squat',
  'Sumo Deadlift High Pull',
  'Kettlebell Swing', 'American Kettlebell Swing', 'Russian Kettlebell Swing',
  'Dumbbell Snatch', 'Dumbbell Clean', 'Devil Press',
  'Medicine Ball Clean', 'Slam Ball', 'D-Ball Over Shoulder',
  'Farmers Carry', 'Sandbag Carry', 'Yoke Carry',
  'Turkish Get-Up'
);

-- GHD and specialized equipment
UPDATE crossfit_movements SET
  subcategory = 'accessory',
  recommended_sections = ARRAY['warmup', 'strength', 'cooldown']
WHERE name IN (
  'GHD Sit-Up', 'GHD Hip Extension', 'GHD Back Extension',
  'Good Morning', 'Glute Ham Raise'
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Bodybuilding subcategory added and movements recategorized successfully';
END $$;
-- Add 'tabata' to workout_type constraint
-- Tabata is a popular interval training format: 20 seconds work, 10 seconds rest, 8 rounds

-- Drop the existing constraint and add new one with tabata
ALTER TABLE workouts
DROP CONSTRAINT IF EXISTS workouts_workout_type_check;

ALTER TABLE workouts
ADD CONSTRAINT workouts_workout_type_check
CHECK (workout_type IN ('amrap', 'fortime', 'emom', 'tabata', 'strength', 'endurance'));
UPDATE "public"."workouts"
SET "workout_type" = 'fortime'
WHERE "workout_type" IS NULL;
-- Migration: Enhance Movement Analytics and Add Heavy Day Tracking
-- 1. Add 'functional_pattern' to crossfit_movements
-- 2. Update 'muscle_groups' check constraint to include 'full body'
-- 3. Add 'loading_focus' to workouts/WODs for Heavy Day tracking

-- Step 1: Add functional_pattern column
ALTER TABLE crossfit_movements
ADD COLUMN IF NOT EXISTS functional_pattern TEXT CHECK (functional_pattern IN ('squat', 'hinge', 'push', 'pull', 'lunge', 'carry', 'core', 'monostructural', 'other'));

CREATE INDEX IF NOT EXISTS idx_crossfit_movements_functional_pattern ON crossfit_movements(functional_pattern);

-- Step 2: Update Data for Functional Patterns
-- Squats
UPDATE crossfit_movements SET functional_pattern = 'squat' WHERE name IN ('Air Squat', 'Back Squat', 'Front Squat', 'Overhead Squat', 'Goblet Squat', 'Box Squat', 'Pistol Squat', 'Thruster', 'Wall Ball', 'Cluster');

-- Hinges
UPDATE crossfit_movements SET functional_pattern = 'hinge' WHERE name IN ('Deadlift', 'Sumo Deadlift', 'Romanian Deadlift', 'Kettlebell Swing', 'American Kettlebell Swing', 'Russian Kettlebell Swing', 'Good Morning', 'Snatch', 'Power Snatch', 'Clean', 'Power Clean', 'Dumbbell Snatch', 'Dumbbell Clean');

-- Pushes
UPDATE crossfit_movements SET functional_pattern = 'push' WHERE name IN ('Push-Up', 'Handstand Push-Up', 'Strict Handstand Push-Up', 'Shoulder Press', 'Push Press', 'Push Jerk', 'Split Jerk', 'Bench Press', 'Dumbbell Bench Press', 'Dip', 'Ring Dip', 'Burpee');

-- Pulls
UPDATE crossfit_movements SET functional_pattern = 'pull' WHERE name IN ('Pull-Up', 'Strict Pull-Up', 'Kipping Pull-Up', 'Butterfly Pull-Up', 'Chest-to-Bar Pull-Up', 'Muscle-Up', 'Bar Muscle-Up', 'Ring Muscle-Up', 'Ring Row', 'Barbell Row', 'Dumbbell Row', 'Rope Climb');

-- Lunges
UPDATE crossfit_movements SET functional_pattern = 'lunge' WHERE name IN ('Lunge', 'Walking Lunge', 'Overhead Walking Lunge', 'Front Rack Lunge', 'Bulgarian Split Squat', 'Box Step-Up');

-- Carries
UPDATE crossfit_movements SET functional_pattern = 'carry' WHERE name IN ('Farmers Carry', 'Sandbag Carry', 'Yoke Carry', 'Overhead Carry');

-- Core
UPDATE crossfit_movements SET functional_pattern = 'core' WHERE name IN ('Sit-Up', 'GHD Sit-Up', 'Toes-to-Bar', 'Knees-to-Elbow', 'V-Up', 'Hollow Rock', 'Plank Hold', 'L-Sit');

-- Monostructural
UPDATE crossfit_movements SET functional_pattern = 'monostructural' WHERE category IN ('metabolic');


-- Step 3: Add 'full body' to muscle groups (Note: PostgreSQL arrays don't have simple check constraints we can easily modify in place without dropping, so we often manage this at the application layer or complex triggers, but here we will just update the data)
-- We'll assume the application enforces the allowed values, but we can backfill 'full body' now.

UPDATE crossfit_movements
SET primary_muscle_groups = array_append(array_remove(primary_muscle_groups, 'legs'), 'full body')
WHERE name IN ('Thruster', 'Wall Ball', 'Cluster', 'Burpee', 'Devil Press', 'Man Maker');

-- Step 4: Add loading_focus to workouts table (assuming table name is 'workouts' or 'wods')
-- Check if table is 'workouts'
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workouts') THEN
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS loading_focus TEXT CHECK (loading_focus IN ('light', 'moderate', 'heavy'));
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Enhanced movement analytics schema applied successfully';
END $$;
-- Refine muscle groups to be more specific
-- This migration updates primary and secondary muscle groups to use more granular anatomy

-- 1. Squats (Legs -> Quads, Glutes)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['quads', 'glutes'],
    secondary_muscle_groups = ARRAY['hamstrings', 'core']
WHERE name IN ('Air Squat', 'Back Squat', 'Front Squat', 'Goblet Squat', 'Overhead Squat', 'Pistol Squat', 'Box Jump', 'Wall Ball', 'Thruster');

-- 2. Deadlifts / Hinges (Back/Legs -> Hamstrings, Glutes, Lower Back)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['hamstrings', 'glutes', 'lower_back'],
    secondary_muscle_groups = ARRAY['lats', 'traps', 'forearms']
WHERE name IN ('Deadlift', 'Sumo Deadlift', 'Romanian Deadlift', 'Kettlebell Swing', 'American Kettlebell Swing', 'Good Morning');

-- 3. Olympic Lifts (Full Body -> Specific Chain)
-- Snatch
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['hamstrings', 'glutes', 'shoulders', 'traps'],
    secondary_muscle_groups = ARRAY['quads', 'lower_back', 'triceps']
WHERE name LIKE '%Snatch%';

-- Clean
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['hamstrings', 'glutes', 'quads', 'traps'],
    secondary_muscle_groups = ARRAY['lats', 'lower_back', 'biceps']
WHERE name LIKE '%Clean%' AND name NOT LIKE '%Jerk%';

-- Jerk / Overhead Press
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['shoulders', 'triceps'],
    secondary_muscle_groups = ARRAY['upper_back', 'core']
WHERE name IN ('Shoulder Press', 'Push Press', 'Push Jerk', 'Split Jerk', 'Handstand Push-Up', 'Strict Handstand Push-Up');

-- 4. Pulling (Back -> Lats, Biceps)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['lats', 'biceps'],
    secondary_muscle_groups = ARRAY['upper_back', 'forearms']
WHERE name IN ('Pull-Up', 'Strict Pull-Up', 'Chin-Up', 'Ring Row', 'Barbell Row', 'Dumbbell Row', 'Rope Climb', 'Chest-to-Bar Pull-Up', 'Kipping Pull-Up', 'Butterfly Pull-Up');

-- 5. Pushing (Chest -> Chest, Triceps, Shoulders)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['chest', 'triceps', 'shoulders'],
    secondary_muscle_groups = ARRAY['core']
WHERE name IN ('Push-Up', 'Bench Press', 'Ring Dip', 'Dip', 'Hand-Release Push-Up', 'Burpee');

-- 6. Core (Core -> Abs, Obliques)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['abs'],
    secondary_muscle_groups = ARRAY['obliques'] -- hip_flexors not in type def yet, sticking to obliques
WHERE name IN ('Sit-Up', 'Toes-to-Bar', 'Knees-to-Elbow', 'V-Up', 'Hollow Rock', 'GHD Sit-Up', 'L-Sit');

-- Plank (Abs, Shoulders)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['abs', 'shoulders'],
    secondary_muscle_groups = ARRAY['quads', 'glutes']
WHERE name = 'Plank Hold';

-- 7. Lunges (Legs -> Quads, Glutes)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['quads', 'glutes'],
    secondary_muscle_groups = ARRAY['hamstrings', 'calves']
WHERE name LIKE '%Lunge%';

-- 8. Cardio
-- Row
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['lats', 'quads'],
    secondary_muscle_groups = ARRAY['biceps', 'hamstrings']
WHERE name LIKE 'Row%';

-- Run
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['quads', 'calves'],
    secondary_muscle_groups = ARRAY['hamstrings', 'glutes']
WHERE name LIKE 'Run%';

-- Bike
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['quads'],
    secondary_muscle_groups = ARRAY['hamstrings', 'calves']
WHERE name LIKE '%Bike%';

-- Double Unders
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['calves'],
    secondary_muscle_groups = ARRAY['shoulders', 'forearms']
WHERE name LIKE '%Under%';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Muscle groups refined successfully';
END $$;
-- Refine movement categories: Replace 'calisthenics' with 'gymnastic_strength' and 'gymnastic_skill'

-- 1. Drop the existing check constraint
ALTER TABLE crossfit_movements
DROP CONSTRAINT IF EXISTS crossfit_movements_subcategory_check;

-- 2. Update existing data (Map 'calisthenics' to new categories)

-- Strict / Strength Gymnastics
-- These are movements typically performed for strength development or strict mechanics
UPDATE crossfit_movements
SET subcategory = 'gymnastic_strength',
    recommended_sections = ARRAY['strength', 'warmup']
WHERE name IN (
  'Strict Pull-Up', 'Strict Handstand Push-Up', 'Push-Up', 'Ring Dip', 'Dip',
  'L-Sit', 'Pistol Squat', 'Rope Climb', 'Hand-Release Push-Up', 'Plank Hold',
  'Ring Row', 'Handstand Hold', 'Strict Toes-to-Bar', 'GHD Sit-Up', 'GHD Hip Extension',
  'Good Morning' -- Actually Good Morning is usually barbell/accessory, but if bodyweight it fits here or accessory
);

-- Dynamic / Skill Gymnastics
-- These are movements typically performed for metabolic conditioning or high-skill practice
UPDATE crossfit_movements
SET subcategory = 'gymnastic_skill',
    recommended_sections = ARRAY['metcon', 'skill']
WHERE name IN (
  'Pull-Up', 'Chest-to-Bar Pull-Up', 'Bar Muscle-Up', 'Ring Muscle-Up',
  'Toes-to-Bar', 'Knees-to-Elbow', 'Kipping Pull-Up', 'Butterfly Pull-Up',
  'Wall Walk', 'Burpee', 'Box Jump', 'Air Squat', 'Lunge', 'Sit-Up',
  'V-Up', 'Hollow Rock', 'Superman Hold'
);

-- Catch-all for any remaining 'calisthenics' (default to skill if unsure)
UPDATE crossfit_movements
SET subcategory = 'gymnastic_skill'
WHERE subcategory = 'calisthenics';

-- 3. Add new check constraint
ALTER TABLE crossfit_movements
ADD CONSTRAINT crossfit_movements_subcategory_check
CHECK (subcategory IN ('olympic', 'powerlifting', 'bodybuilding', 'gymnastic_strength', 'gymnastic_skill', 'cardio', 'accessory'));

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Movement categories refined: Calisthenics replaced with Gymnastic Strength/Skill';
END $$;
-- Revert muscle groups to broad categories and update subcategories to Title Case

-- 1. Update subcategories to Title Case (removing underscores)
ALTER TABLE crossfit_movements
DROP CONSTRAINT IF EXISTS crossfit_movements_subcategory_check;

UPDATE crossfit_movements
SET subcategory = CASE
  WHEN subcategory = 'olympic' THEN 'Olympic'
  WHEN subcategory = 'powerlifting' THEN 'Powerlifting'
  WHEN subcategory = 'bodybuilding' THEN 'Bodybuilding'
  WHEN subcategory = 'gymnastic_strength' THEN 'Gymnastic Strength'
  WHEN subcategory = 'gymnastic_skill' THEN 'Gymnastic Skill'
  WHEN subcategory = 'cardio' THEN 'Cardio'
  WHEN subcategory = 'accessory' THEN 'Accessory'
  ELSE subcategory
END;

ALTER TABLE crossfit_movements
ADD CONSTRAINT crossfit_movements_subcategory_check
CHECK (subcategory IN ('Olympic', 'Powerlifting', 'Bodybuilding', 'Gymnastic Strength', 'Gymnastic Skill', 'Cardio', 'Accessory'));

-- 2. Revert muscle groups to broad categories

-- Legs (Quads, Hamstrings, Glutes, Calves -> Legs)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(
        ARRAY_REPLACE(primary_muscle_groups, 'quads', 'legs'),
        'hamstrings', 'legs'
      ),
      'glutes', 'legs'
    ),
    'calves', 'legs'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(
        ARRAY_REPLACE(secondary_muscle_groups, 'quads', 'legs'),
        'hamstrings', 'legs'
      ),
      'glutes', 'legs'
    ),
    'calves', 'legs'
  );

-- Back (Lats, Upper Back, Lower Back -> Back)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(primary_muscle_groups, 'lats', 'back'),
      'upper_back', 'back'
    ),
    'lower_back', 'back'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(secondary_muscle_groups, 'lats', 'back'),
      'upper_back', 'back'
    ),
    'lower_back', 'back'
  );

-- Arms (Biceps, Triceps, Forearms -> Arms)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(primary_muscle_groups, 'biceps', 'arms'),
      'triceps', 'arms'
    ),
    'forearms', 'arms'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(secondary_muscle_groups, 'biceps', 'arms'),
      'triceps', 'arms'
    ),
    'forearms', 'arms'
  );

-- Core (Abs, Obliques -> Core)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(primary_muscle_groups, 'abs', 'core'),
    'obliques', 'core'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(secondary_muscle_groups, 'abs', 'core'),
    'obliques', 'core'
  );

-- Clean up duplicates in arrays (e.g. if 'quads' and 'glutes' both became 'legs')
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY(SELECT DISTINCT UNNEST(primary_muscle_groups)),
    secondary_muscle_groups = ARRAY(SELECT DISTINCT UNNEST(secondary_muscle_groups));

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Muscle groups reverted and subcategories updated successfully';
END $$;
-- Fix muscle group inconsistencies to match TypeScript types
-- This migration ensures all muscle groups use the correct naming convention:
-- Valid groups: shoulders, back, chest, arms, legs, core, full body

-- Replace 'full_body' with 'full body' (with space)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(primary_muscle_groups, 'full_body', 'full body'),
    secondary_muscle_groups = ARRAY_REPLACE(secondary_muscle_groups, 'full_body', 'full body');

-- Clean up any granular muscle groups that weren't properly reverted by migration 021
-- These should have been converted to broad categories but we'll ensure they're cleaned up

-- Replace granular leg muscle groups with 'legs'
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(
        ARRAY_REPLACE(primary_muscle_groups, 'quads', 'legs'),
        'hamstrings', 'legs'
      ),
      'glutes', 'legs'
    ),
    'calves', 'legs'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(
        ARRAY_REPLACE(secondary_muscle_groups, 'quads', 'legs'),
        'hamstrings', 'legs'
      ),
      'glutes', 'legs'
    ),
    'calves', 'legs'
  );

-- Replace granular back muscle groups with 'back'
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(
        ARRAY_REPLACE(primary_muscle_groups, 'lats', 'back'),
        'upper_back', 'back'
      ),
      'lower_back', 'back'
    ),
    'traps', 'back'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(
        ARRAY_REPLACE(secondary_muscle_groups, 'lats', 'back'),
        'upper_back', 'back'
      ),
      'lower_back', 'back'
    ),
    'traps', 'back'
  );

-- Replace granular arm muscle groups with 'arms'
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(primary_muscle_groups, 'biceps', 'arms'),
      'triceps', 'arms'
    ),
    'forearms', 'arms'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(secondary_muscle_groups, 'biceps', 'arms'),
      'triceps', 'arms'
    ),
    'forearms', 'arms'
  );

-- Replace granular core muscle groups with 'core'
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(primary_muscle_groups, 'abs', 'core'),
    'obliques', 'core'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(secondary_muscle_groups, 'abs', 'core'),
    'obliques', 'core'
  );

-- Remove duplicates that may have been created (e.g., ['legs', 'legs'] -> ['legs'])
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY(SELECT DISTINCT UNNEST(primary_muscle_groups)),
    secondary_muscle_groups = ARRAY(SELECT DISTINCT UNNEST(secondary_muscle_groups));

-- Assign 'full body' to movements that engage multiple major muscle groups simultaneously
-- These are compound movements that significantly tax the entire body

-- Thruster: Full squat to overhead press in one motion
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Thruster';

-- Wall Ball: Squat and throw ball to target
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Wall Ball';

-- Clean & Jerk: Full body Olympic lift
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Clean & Jerk';

-- Burpee: Chest to ground, jump with hands overhead
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Burpee';

-- Devil Press: Burpee + double dumbbell snatch
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Devil Press';

-- Rope Climb: Full body climbing movement
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Rope Climb';

-- Snatch: Full Olympic lift from floor to overhead
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Snatch';

-- Clean: Full squat clean from floor to shoulders
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Clean';

-- Turkish Get-Up: Complex movement from lying to standing
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Turkish Get-Up';

-- Muscle-Ups: Explosive pull + dip transition
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name IN ('Bar Muscle-Up', 'Ring Muscle-Up');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Fixed all muscle group inconsistencies and assigned full body movements successfully';
END $$;
-- Add 'staff' role to the profiles table
-- Staff members can edit workouts but don't have full coach privileges

-- First, drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new check constraint with 'staff' included
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('member', 'staff', 'coach', 'admin'));

-- Update RLS policy to allow staff to view coach dashboard content
-- Staff can view workouts (same as coaches)
DROP POLICY IF EXISTS "Staff can view workouts" ON workouts;
CREATE POLICY "Staff can view workouts"
  ON workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'coach', 'admin')
    )
  );

-- Staff can update workouts (same as coaches)
DROP POLICY IF EXISTS "Staff can update workouts" ON workouts;
CREATE POLICY "Staff can update workouts"
  ON workouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('staff', 'coach', 'admin')
    )
  );
-- Create workout_bookings table to track WOD bookings
-- Each workout has a maximum capacity of 16 spaces
CREATE TABLE workout_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('booked', 'cancelled', 'attended', 'no-show')) DEFAULT 'booked',
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate bookings
  UNIQUE(workout_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_workout_bookings_workout_id ON workout_bookings(workout_id);
CREATE INDEX idx_workout_bookings_user_id ON workout_bookings(user_id);
CREATE INDEX idx_workout_bookings_status ON workout_bookings(status);

-- Enable Row Level Security
ALTER TABLE workout_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own bookings
CREATE POLICY "Users can view their own workout bookings"
  ON workout_bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Coaches and admins can view all bookings
CREATE POLICY "Staff can view all workout bookings"
  ON workout_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'coach', 'admin')
    )
  );

-- Users can create their own bookings (with capacity check)
CREATE POLICY "Users can create their own workout bookings"
  ON workout_bookings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      SELECT COUNT(*) FROM workout_bookings wb
      WHERE wb.workout_id = workout_id
      AND wb.status = 'booked'
    ) < 16
  );

-- Users can cancel their own bookings
CREATE POLICY "Users can cancel their own workout bookings"
  ON workout_bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Coaches and admins can update any booking (e.g., mark attendance)
CREATE POLICY "Staff can update workout bookings"
  ON workout_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'coach', 'admin')
    )
  );

-- Users can delete their own bookings
CREATE POLICY "Users can delete their own workout bookings"
  ON workout_bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete any booking
CREATE POLICY "Admins can delete any workout booking"
  ON workout_bookings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to get booking count for a workout
CREATE OR REPLACE FUNCTION get_workout_booking_count(p_workout_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM workout_bookings
    WHERE workout_id = p_workout_id
    AND status = 'booked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a workout has available space
CREATE OR REPLACE FUNCTION workout_has_space(p_workout_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) < 16
    FROM workout_bookings
    WHERE workout_id = p_workout_id
    AND status = 'booked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create coach_services table to track which services each coach offers
-- Services: PT, Specialty Classes, Sports Massage, Nutrition, Physio

-- Create enum for service types
CREATE TYPE service_type AS ENUM ('pt', 'specialty_class', 'sports_massage', 'nutrition', 'physio');

-- Create coach_services table
CREATE TABLE coach_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10, 2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Each coach can only have one entry per service type
  UNIQUE(coach_id, service_type)
);

-- Create indexes
CREATE INDEX idx_coach_services_coach_id ON coach_services(coach_id);
CREATE INDEX idx_coach_services_service_type ON coach_services(service_type);
CREATE INDEX idx_coach_services_active ON coach_services(is_active);

-- Enable Row Level Security
ALTER TABLE coach_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Everyone can view active coach services
CREATE POLICY "Anyone can view active coach services"
  ON coach_services FOR SELECT
  USING (is_active = true);

-- Coaches can view their own services (even inactive)
CREATE POLICY "Coaches can view their own services"
  ON coach_services FOR SELECT
  USING (auth.uid() = coach_id);

-- Admins can view all services
CREATE POLICY "Admins can view all coach services"
  ON coach_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert/update/delete coach services
CREATE POLICY "Admins can insert coach services"
  ON coach_services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update coach services"
  ON coach_services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete coach services"
  ON coach_services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create service_bookings table for members to book services
CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES coach_services(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for service_bookings
CREATE INDEX idx_service_bookings_service_id ON service_bookings(service_id);
CREATE INDEX idx_service_bookings_member_id ON service_bookings(member_id);
CREATE INDEX idx_service_bookings_coach_id ON service_bookings(coach_id);
CREATE INDEX idx_service_bookings_date ON service_bookings(booking_date);
CREATE INDEX idx_service_bookings_status ON service_bookings(status);

-- Enable RLS on service_bookings
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- Members can view their own bookings
CREATE POLICY "Members can view their own service bookings"
  ON service_bookings FOR SELECT
  USING (auth.uid() = member_id);

-- Coaches can view bookings for their services
CREATE POLICY "Coaches can view their service bookings"
  ON service_bookings FOR SELECT
  USING (auth.uid() = coach_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all service bookings"
  ON service_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Members can create bookings
CREATE POLICY "Members can create service bookings"
  ON service_bookings FOR INSERT
  WITH CHECK (auth.uid() = member_id);

-- Members can update their own pending bookings (cancel)
CREATE POLICY "Members can update their own bookings"
  ON service_bookings FOR UPDATE
  USING (auth.uid() = member_id AND status = 'pending')
  WITH CHECK (auth.uid() = member_id);

-- Coaches can update bookings for their services
CREATE POLICY "Coaches can update their service bookings"
  ON service_bookings FOR UPDATE
  USING (auth.uid() = coach_id);

-- Admins can update any booking
CREATE POLICY "Admins can update any service booking"
  ON service_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to get service type display name
CREATE OR REPLACE FUNCTION get_service_display_name(stype service_type)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE stype
    WHEN 'pt' THEN 'Personal Training'
    WHEN 'specialty_class' THEN 'Specialty Classes'
    WHEN 'sports_massage' THEN 'Sports Massage'
    WHEN 'nutrition' THEN 'Nutrition'
    WHEN 'physio' THEN 'Physiotherapy'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- Add coach profile fields to profiles table
-- These fields allow coaches to manage their own public profile information

-- Add new columns for coach profile information
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';

-- Create index for role-based queries (coaches)
CREATE INDEX IF NOT EXISTS idx_profiles_role_coach ON profiles(role) WHERE role = 'coach';

-- Allow public read access to coach profiles for the public coaches page
CREATE POLICY "Anyone can view coach profiles"
  ON profiles FOR SELECT
  USING (role = 'coach');

-- Ensure coaches can update their own profile fields
-- Note: The existing "Users can update own profile" policy already allows this,
-- but we'll create a more specific one for clarity
DROP POLICY IF EXISTS "Coaches can update own profile" ON profiles;
CREATE POLICY "Coaches can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id AND role = 'coach')
  WITH CHECK (auth.uid() = id AND role = 'coach');
-- Allow coaches to update their own service rates
-- Note: Coaches can only update hourly_rate and description, not is_active (admin-only)

-- Create policy to allow coaches to update their own service rates
CREATE POLICY "Coaches can update their own service rates"
  ON coach_services FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Add a trigger to prevent coaches from changing is_active field
-- Only admins should be able to enable/disable services
CREATE OR REPLACE FUNCTION check_coach_service_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is the coach (not an admin), they can only change rate and description
  IF auth.uid() = NEW.coach_id THEN
    -- Check if user is admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    ) THEN
      -- Not an admin - preserve is_active from old value
      NEW.is_active := OLD.is_active;
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS coach_service_update_trigger ON coach_services;
CREATE TRIGGER coach_service_update_trigger
  BEFORE UPDATE ON coach_services
  FOR EACH ROW
  EXECUTE FUNCTION check_coach_service_update();
-- Add payment tracking fields to service_bookings table
ALTER TABLE service_bookings
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid INTEGER, -- in pence
ADD COLUMN IF NOT EXISTS refund_eligible_until TIMESTAMPTZ; -- 24 hours before booking start

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_service_bookings_payment_status ON service_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_payment_intent ON service_bookings(payment_intent_id);

-- Add comment for clarity
COMMENT ON COLUMN service_bookings.amount_paid IS 'Amount paid in pence (GBP)';
COMMENT ON COLUMN service_bookings.refund_eligible_until IS 'Timestamp until which the booking is eligible for full refund (24h before booking start)';
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
