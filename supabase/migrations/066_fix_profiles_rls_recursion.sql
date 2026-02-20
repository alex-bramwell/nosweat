-- Fix infinite recursion in profiles RLS policies.
-- Policies on "profiles" were querying "profiles" to check roles,
-- which triggers the same policies again, causing infinite recursion.
--
-- Solution: a SECURITY DEFINER function that bypasses RLS to read the
-- caller's role, then use that function in all policies.

-- 1. Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- 2. Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can view own profile"      ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"    ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile"    ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles"    ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles"  ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles"      ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles"      ON profiles;
DROP POLICY IF EXISTS "Coaches can view all profiles"   ON profiles;
DROP POLICY IF EXISTS "Coaches can update own profile"  ON profiles;
DROP POLICY IF EXISTS "Anyone can view coach profiles"  ON profiles;

-- 3. Recreate policies using auth.user_role() instead of sub-selects

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (cannot change role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = auth.user_role()
  );

-- Users can insert their own profile (signup trigger)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (auth.user_role() = 'admin');

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (auth.user_role() = 'admin');

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.user_role() = 'admin');

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (auth.user_role() = 'admin');

-- Coaches and admins can view all profiles (for scheduling)
CREATE POLICY "Coaches can view all profiles"
  ON profiles FOR SELECT
  USING (auth.user_role() IN ('coach', 'admin'));

-- Coaches can update their own profile
CREATE POLICY "Coaches can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id AND auth.user_role() = 'coach')
  WITH CHECK (auth.uid() = id AND auth.user_role() = 'coach');

-- Anyone can view coach profiles (public coaches page)
CREATE POLICY "Anyone can view coach profiles"
  ON profiles FOR SELECT
  USING (role = 'coach');
