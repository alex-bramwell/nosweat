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
