-- Allow NULL gym_id on profiles for new platform signups.
-- Users sign up first (no gym), then create a gym during onboarding.
ALTER TABLE public.profiles ALTER COLUMN gym_id DROP NOT NULL;
