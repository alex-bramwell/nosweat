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
