-- Quick setup script to create Dan as admin
-- Run this in your Supabase SQL Editor

-- NOTE: This script assumes Dan's auth account already exists in Supabase Auth
-- If not, you must create it first via the Supabase Dashboard:
-- Authentication → Users → Add User → Email: dan@crossfitcomet.com

-- Check if Dan's profile exists
DO $$
DECLARE
  dan_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'dan@crossfitcomet.com'
  ) INTO dan_exists;

  IF dan_exists THEN
    -- Update existing profile to admin
    UPDATE profiles
    SET
      role = 'admin',
      name = 'Dan',
      coach_id = 'dan'
    WHERE email = 'dan@crossfitcomet.com';

    RAISE NOTICE 'Updated Dan to admin role';
  ELSE
    RAISE NOTICE 'Dan profile does not exist. Please create the auth account first in Supabase Dashboard: Authentication → Users → Add User';
    RAISE NOTICE 'Then run this script again.';
  END IF;
END $$;

-- Verify the update
SELECT
  id,
  email,
  name,
  role,
  coach_id,
  created_at
FROM profiles
WHERE email = 'dan@crossfitcomet.com';
