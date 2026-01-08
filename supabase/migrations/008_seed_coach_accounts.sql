-- This migration provides SQL to manually create coach accounts
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
