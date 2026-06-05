-- Create the test account for onboarding QA.
-- Uses Supabase's internal auth schema (same approach as dashboard "Add User").

-- Use a NOT EXISTS guard rather than ON CONFLICT (email): Supabase's
-- auth.users email uniqueness is a partial index, so ON CONFLICT (email) has
-- no matching arbiter and errors on a fresh database. This form is idempotent
-- and works both locally and on a fresh prod apply.
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@nosweattest.com',
  crypt('testtest123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Test Account", "role": "admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'test@nosweattest.com'
);
