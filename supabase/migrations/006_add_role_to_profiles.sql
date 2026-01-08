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
