-- Gym owners need the 'admin' role (to use the site builder, manage features,
-- assign coaches, etc.). Onboarding tried to do this client-side with
-- profiles.update({ role: 'admin' }), but the "Users can update own profile"
-- RLS policy intentionally forbids a user from changing their OWN role (an
-- anti-privilege-escalation guard, added in migration 009). So the update was
-- denied (42501) and new owners were left as 'member' - they could still reach
-- the admin panel via owner_id checks, but role-gated features did not work.
--
-- Fix: grant the role server-side when a gym is created. You can only ever own a
-- gym you just created (gyms INSERT policy requires owner_id = auth.uid()), so
-- this cannot be abused for escalation. A SECURITY DEFINER trigger bypasses the
-- self-role-change restriction legitimately.

CREATE OR REPLACE FUNCTION public.grant_owner_admin_on_gym_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'admin',
        gym_id = NEW.id
    WHERE id = NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grant_owner_admin ON public.gyms;
CREATE TRIGGER grant_owner_admin
  AFTER INSERT ON public.gyms
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_owner_admin_on_gym_create();

-- Backfill: existing gym owners who were stuck as non-admin (created before this
-- fix) get the admin role and their gym link.
UPDATE public.profiles p
SET role = 'admin'
FROM public.gyms g
WHERE g.owner_id = p.id
  AND p.role IS DISTINCT FROM 'admin';

UPDATE public.profiles p
SET gym_id = g.id
FROM public.gyms g
WHERE g.owner_id = p.id
  AND p.gym_id IS DISTINCT FROM g.id;
