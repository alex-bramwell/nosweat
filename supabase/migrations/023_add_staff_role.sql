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
